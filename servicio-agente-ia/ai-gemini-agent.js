require('dotenv').config();

const express = require('express');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const IaRequest = require('./dominio/iaRequest');

const aplicacion = express();
aplicacion.use(express.json());

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('GEMINI_API_KEY no está configurada. Define la variable de entorno antes de iniciar el servicio.');
  process.exit(1);
}

const clienteIa = new GoogleGenAI({ apiKey: geminiApiKey });

function crearErrorDeIa(error, defaultMessage) {
  const message = String(error?.message || '').trim();
  const responseData = error?.response?.data;
  const nestedMessage = responseData?.error?.message || responseData;
  const details = responseData || error?.response || message;
  const invalidKey = [message, nestedMessage]
    .filter(Boolean)
    .some((text) => String(text).includes('API key not valid') || String(text).includes('API_KEY_INVALID'));

  return {
    status: invalidKey ? 401 : 500,
    body: {
      error: invalidKey ? 'GEMINI_API_KEY inválida o no configurada' : defaultMessage,
      details,
    },
  };
}

function intentarParsearJson(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = String(texto).trim();
  if (!limpio || (!limpio.startsWith('{') && !limpio.startsWith('['))) return null;

  try {
    return JSON.parse(limpio.replace(/(\r|\n)+/g, ' ').trim());
  } catch (_error) {
    return null;
  }
}

function normalizarMemoryPatchString(valor) {
  if (typeof valor !== 'string') return valor;
  const matches = [...valor.matchAll(/\[(.*?)\s*:\s*(.*?)\]/g)];
  if (!matches.length) return valor;

  return matches.reduce((acc, [, key, value]) => {
    const clave = String(key || '').trim().toLowerCase().replace(/\s+/g, '_');
    if (clave) acc[clave] = String(value || '').trim();
    return acc;
  }, {});
}

function normalizarRespuestaIa({ textoRespuestaIa, respuestaJsonParseada, metrics, tenantId, model }) {
  const payloadParseado = respuestaJsonParseada && typeof respuestaJsonParseada === 'object'
    ? respuestaJsonParseada
    : {};

  const reply = payloadParseado.reply
    || payloadParseado.response
    || payloadParseado.text
    || payloadParseado.message
    || payloadParseado.mensaje_whatsapp
    || textoRespuestaIa
    || null;

  const memoryPatchRaw = payloadParseado.memory_patch
    || payloadParseado.memoryPatch
    || payloadParseado.nuevo_contexto
    || null;
  const memoryPatch = typeof memoryPatchRaw === 'string'
    ? normalizarMemoryPatchString(memoryPatchRaw)
    : (memoryPatchRaw || null);

  const warmingResponse = payloadParseado.warming_response
    || payloadParseado.warmingResponse
    || payloadParseado.mensaje_calentamiento
    || reply
    || null;
  const taskPayload = payloadParseado.task_payload || payloadParseado.taskPayload || payloadParseado.tarea || null;
  const intent = payloadParseado.intent || payloadParseado.userIntent || payloadParseado.usuario_intencion || null;
  const conversationState = payloadParseado.conversationState || payloadParseado.conversation_state || memoryPatch?.conversation_state || null;
  const conversationSummary = payloadParseado.conversationSummary || payloadParseado.conversation_summary || null;

  const respuestaNormalizada = {
    status: 'success',
    tenantId: tenantId || null,
    reply,
    memory_patch: memoryPatch,
    warming_response: warmingResponse,
    task_payload: taskPayload,
    intent,
    conversationState,
    conversationSummary,
    output: {
      response: textoRespuestaIa,
      parsedResponse: payloadParseado,
      metrics: metrics || {},
      model: model || null
    },
    response: textoRespuestaIa,
    responseText: textoRespuestaIa,
    parsedResponse: payloadParseado,
    metrics: metrics || {},
    model: model || null
  };

  return respuestaNormalizada;
}

/**
 * Contrato del servicio de agente de IA.
 *
 * Endpoint principal:
 *   POST /api/ai/generate-response
 *
 * Request body esperado:
 * {
 *   "systemPrompt": "Eres un asistente útil",
 *   "userContext": "El usuario es un cliente premium que necesita respuestas cortas",
 *   "userConcatenatedMessage": "Hola, necesito ayuda"
 * }
 *
 * Response body:
 * {
 *   "status": "success",
 *   "output": {
 *     "response": "Respuesta generada por IA",
 *     "metrics": {
 *       "latenciaMs": 120,
 *       "tokens": {
 *         "prompt": 10,
 *         "completion": 20,
 *         "total": 30
 *       }
 *     }
 *   }
 * }
 */
const puerto = process.env.PORT || 3003;
const urlServicioCore = process.env.CORE_SERVICE_URL || 'http://localhost:3002';

aplicacion.get('/', (_req, res) => {
  res.status(200).json({ status: 'servicio-agente-ia online' });
});

aplicacion.get('/health', (_req, res) => {
  res.status(200).json({ status: 'servicio-agente-ia healthy', timestamp: new Date() });
});

aplicacion.post('/api/ai/generate-response', async (req, res) => {
  try {
    const {
      aiModel,
      systemPrompt,
      temperature,
      userConcatenatedMessage,
      userContext,
      sender,
      tenantId,
      tenant,
    } = req.body;

    const resolvedTenantId = sender || tenantId || tenant || req.headers['x-tenant-id'] || null;

    let iaRequest;
    try {
      iaRequest = new IaRequest({
        systemPrompt,
        userConcatenatedMessage,
        userContext,
        aiModel,
        temperature,
      });
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const tiempoInicio = Date.now();

    const respuestaIa = await clienteIa.models.generateContent({
      model: iaRequest.aiModel || 'models/gemini-3.1-flash-lite',
      contents: iaRequest.contents,
      config: {
        systemInstruction: iaRequest.systemPrompt,
        temperature: iaRequest.temperature !== undefined ? iaRequest.temperature : 0.7,
      }
    });

    const tiempoFin = Date.now();
    const latenciaMs = tiempoFin - tiempoInicio;

    const textoRespuestaIa = respuestaIa.text;
    const respuestaJsonParseada = intentarParsearJson(textoRespuestaIa);

    const usoTokens = respuestaIa.usageMetadata || {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0
    };

    try {
      await axios.post(`${urlServicioCore}/api/log-interaction`, iaRequest.toLoggingPayload(textoRespuestaIa, usoTokens, latenciaMs));
    } catch (logError) {
      console.error('Error al reportar auditoría al Core de PostgreSQL:', logError.message);
    }

    const respuestaNormalizada = normalizarRespuestaIa({
      textoRespuestaIa,
      respuestaJsonParseada,
      metrics: {
        latenciaMs,
        tokens: {
          prompt: usoTokens.promptTokenCount,
          completion: usoTokens.candidatesTokenCount,
          total: usoTokens.totalTokenCount
        }
      },
      tenantId: resolvedTenantId,
      model: iaRequest.aiModel || 'models/gemini-3.1-flash-lite'
    });

    return res.status(200).json(respuestaNormalizada);
  } catch (error) {
    console.error('Error crítico en el servicio de Gemini Flash 2.5:', error);
    const err = crearErrorDeIa(error, 'Error interno procesando la inteligencia artificial');
    return res.status(err.status).json(err.body);
  }
});

aplicacion.post('/api/ai/generate-from-prompts', async (req, res) => {
  try {
    const {
      basePrompt,
      systemPrompt,
      model,
      temperature,
      sender,
      tenantId,
      tenant
    } = req.body;

    const resolvedTenantId = sender || tenantId || tenant || req.headers['x-tenant-id'] || null;

    if (!basePrompt || !systemPrompt) {
      return res.status(400).json({
        error: 'Se requieren basePrompt y systemPrompt'
      });
    }

    const respuestaIa = await clienteIa.models.generateContent({
      model: model || 'models/gemini-3.1-flash-lite',
      contents: basePrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: temperature !== undefined ? temperature : 0.7,
      }
    });

    const respuestaJsonParseada = intentarParsearJson(respuestaIa.text);
    const respuestaNormalizada = normalizarRespuestaIa({
      textoRespuestaIa: respuestaIa.text,
      respuestaJsonParseada,
      metrics: { latenciaMs: 0 },
      tenantId: resolvedTenantId,
      model: model || 'models/gemini-3.1-flash-lite'
    });

    return res.status(200).json(respuestaNormalizada);
  } catch (error) {
    console.error('Error en el endpoint de prompts:', error);
    const err = crearErrorDeIa(error, 'No se pudo generar la respuesta con los prompts proporcionados');
    return res.status(err.status).json(err.body);
  }
});

// Endpoint genérico para integración con n8n: acepta prompt, systemInstruction, history e identificador de inquilino.
aplicacion.post('/run', async (req, res) => {
  try {
    const {
      tenantId,
      prompt,
      systemInstruction,
      history,
      model,
      temperature,
      sender,
      tenant,
      conversationState,
      conversationSummary,
    } = req.body;
    const resolvedTenantId = sender || tenantId || tenant || req.headers['x-tenant-id'] || null;

    if (!prompt || !systemInstruction || !resolvedTenantId) {
      return res.status(400).json({ error: 'Se requieren prompt, systemInstruction y tenantId' });
    }

    const contextoDeEstado = {
      conversationState: conversationState || null,
      conversationSummary: conversationSummary || null,
    };

    const inicio = Date.now();
    const respuestaIa = await clienteIa.models.generateContent({
      model: model || (process.env.DEFAULT_AI_MODEL || 'models/gemini-3.1-flash-lite'),
      contents: `${JSON.stringify(contextoDeEstado)}\n\n${prompt}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature !== undefined ? temperature : 0.7,
      }
    });

    const fin = Date.now();
    const latenciaMs = fin - inicio;

    const textoRespuestaIa = respuestaIa.text;

    const respuestaJsonParseada = intentarParsearJson(textoRespuestaIa);
    const respuestaNormalizada = normalizarRespuestaIa({
      textoRespuestaIa,
      respuestaJsonParseada,
      metrics: { latenciaMs },
      tenantId: resolvedTenantId,
      model: model || (process.env.DEFAULT_AI_MODEL || 'models/gemini-3.1-flash-lite')
    });

    return res.status(200).json(respuestaNormalizada);
  } catch (error) {
    console.error('Error en /run:', error);
    return res.status(500).json({ error: 'Error interno en AI service' });
  }
});

if (require.main === module) {
  aplicacion.listen(puerto, () => {
    console.log(`✨ AI Agent Service (Gemini Flash 2.5) corriendo en el puerto ${puerto}`);
  });
}

module.exports = aplicacion;
