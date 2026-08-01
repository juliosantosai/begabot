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
      basePrompt,
      promptBase,
      userMessage,
      userContext,
      context,
      sender,
      tenantId,
      tenant
    } = req.body;

    const resolvedTenantId = sender || tenantId || tenant || req.headers['x-tenant-id'] || null;
    if (!resolvedTenantId) {
      return res.status(400).json({ error: 'Se requiere sender o tenantId para aislar la conversación' });
    }

    let iaRequest;
    try {
      iaRequest = new IaRequest({
        systemPrompt: systemPrompt || req.body.system_instruction,
        userConcatenatedMessage,
        basePrompt,
        promptBase,
        userMessage,
        userContext,
        context,
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

    const respuestaNormalizada = {
      status: 'success',
      mensaje_whatsapp: respuestaJsonParseada?.mensaje_whatsapp || null,
      mensaje_calentamiento: respuestaJsonParseada?.mensaje_calentamiento || null,
      nuevo_contexto: respuestaJsonParseada?.nuevo_contexto || null,
      usuario_intencion: respuestaJsonParseada?.usuario_intencion || null,
      tarea: respuestaJsonParseada?.tarea || null,
      output: {
        response: textoRespuestaIa,
        parsedResponse: respuestaJsonParseada,
        metrics: {
          latenciaMs,
          tokens: {
            prompt: usoTokens.promptTokenCount,
            completion: usoTokens.candidatesTokenCount,
            total: usoTokens.totalTokenCount
          }
        }
      },
      response: textoRespuestaIa,
      responseText: textoRespuestaIa,
      parsedResponse: respuestaJsonParseada,
      metrics: {
        latenciaMs,
        tokens: {
          prompt: usoTokens.promptTokenCount,
          completion: usoTokens.candidatesTokenCount,
          total: usoTokens.totalTokenCount
        }
      }
    };

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
    if (!resolvedTenantId) {
      return res.status(400).json({ error: 'Se requiere sender o tenantId para aislar la conversación' });
    }

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
    const respuestaNormalizada = {
      status: 'success',
      mensaje_whatsapp: respuestaJsonParseada?.mensaje_whatsapp || null,
      mensaje_calentamiento: respuestaJsonParseada?.mensaje_calentamiento || null,
      nuevo_contexto: respuestaJsonParseada?.nuevo_contexto || null,
      usuario_intencion: respuestaJsonParseada?.usuario_intencion || null,
      tarea: respuestaJsonParseada?.tarea || null,
      output: {
        response: respuestaIa.text,
        parsedResponse: respuestaJsonParseada,
        model: model || 'models/gemini-3.1-flash-lite'
      },
      response: respuestaIa.text,
      responseText: respuestaIa.text,
      parsedResponse: respuestaJsonParseada,
      model: model || 'models/gemini-3.1-flash-lite'
    };

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
    const { tenantId, prompt, systemInstruction, history, model, temperature, sender, tenant } = req.body;
    const resolvedTenantId = sender || tenantId || tenant || req.headers['x-tenant-id'] || null;

    if (!prompt || !systemInstruction || !resolvedTenantId) {
      return res.status(400).json({ error: 'Se requieren prompt, systemInstruction y tenantId' });
    }

    const inicio = Date.now();
    const respuestaIa = await clienteIa.models.generateContent({
      model: model || (process.env.DEFAULT_AI_MODEL || 'models/gemini-3.1-flash-lite'),
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature !== undefined ? temperature : 0.7,
      }
    });

    const fin = Date.now();
    const latenciaMs = fin - inicio;

    const textoRespuestaIa = respuestaIa.text;

    const respuestaJsonParseada = intentarParsearJson(textoRespuestaIa);
    const respuestaNormalizada = {
      status: 'success',
      tenantId: resolvedTenantId,
      mensaje_whatsapp: respuestaJsonParseada?.mensaje_whatsapp || null,
      mensaje_calentamiento: respuestaJsonParseada?.mensaje_calentamiento || null,
      nuevo_contexto: respuestaJsonParseada?.nuevo_contexto || null,
      usuario_intencion: respuestaJsonParseada?.usuario_intencion || null,
      tarea: respuestaJsonParseada?.tarea || null,
      output: {
        response: textoRespuestaIa,
        parsedResponse: respuestaJsonParseada,
        metrics: { latenciaMs }
      },
      response: textoRespuestaIa,
      responseText: textoRespuestaIa,
      parsedResponse: respuestaJsonParseada,
      metrics: { latenciaMs }
    };

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
