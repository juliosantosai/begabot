require('dotenv').config();

const express = require('express');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

const aplicacion = express();
aplicacion.use(express.json());

/**
 * Contrato del servicio de agente de IA.
 *
 * Endpoint principal:
 *   POST /api/ai/generate-response
 *
 * Request body esperado:
 * {
 *   "sender": "usuario123",
 *   "remoteJid": "1234567890@whatsapp.net",
 *   "systemPrompt": "Eres un asistente útil",
 *   "userConcatenatedMessage": "Hola, necesito ayuda"
 * }
 *
 * Response body:
 * {
 *   "status": "success",
 *   "output": {
 *     "response": "Respuesta generada por IA",
 *     "destination": {
 *       "sender": "usuario123",
 *       "remoteJid": "1234567890@whatsapp.net"
 *     },
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

const clienteIa = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
      companyId,
      sender,
      remoteJid,
      aiModel,
      systemPrompt,
      temperature,
      userConcatenatedMessage,
      basePrompt,
      promptBase
    } = req.body;

    const instruccionSistemaResuelta = systemPrompt || req.body.system_instruction;
    const promptBaseResuelto = userConcatenatedMessage || basePrompt || promptBase || req.body.userMessage;

    if (!promptBaseResuelto || !instruccionSistemaResuelta || !sender || !remoteJid) {
      return res.status(400).json({
        error: 'Faltan parámetros obligatorios (basePrompt o userConcatenatedMessage, systemPrompt, sender, remoteJid)'
      });
    }

    const tiempoInicio = Date.now();

    const respuestaIa = await clienteIa.models.generateContent({
      model: aiModel || 'models/gemini-3.1-flash-lite',
      contents: promptBaseResuelto,
      config: {
        systemInstruction: instruccionSistemaResuelta,
        temperature: temperature !== undefined ? temperature : 0.7,
      }
    });

    const tiempoFin = Date.now();
    const latenciaMs = tiempoFin - tiempoInicio;

    const textoRespuestaIa = respuestaIa.text;

    const usoTokens = respuestaIa.usageMetadata || {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0
    };

    try {
      await axios.post(`${urlServicioCore}/api/log-interaction`, {
        sender,
        remoteJid,
        userQuery: promptBaseResuelto,
        aiResponse: textoRespuestaIa,
        intent: 'general_assistant_intent',
        modelUsed: aiModel || 'models/gemini-3.1-flash-lite',
        promptTokens: usoTokens.promptTokenCount || 0,
        completionTokens: usoTokens.candidatesTokenCount || 0,
        latenciaMs
      });
    } catch (logError) {
      console.error('Error al reportar auditoría al Core de PostgreSQL:', logError.message);
    }

    return res.status(200).json({
      status: 'success',
      output: {
        response: textoRespuestaIa,
        destination: {
          sender,
          remoteJid
        },
        metrics: {
          latenciaMs,
          tokens: {
            prompt: usoTokens.promptTokenCount,
            completion: usoTokens.candidatesTokenCount,
            total: usoTokens.totalTokenCount
          }
        }
      }
    });
  } catch (error) {
    console.error('Error crítico en el servicio de Gemini Flash 2.5:', error);
    return res.status(500).json({
      error: 'Error interno procesando la inteligencia artificial',
      details: error.message
    });
  }
});

aplicacion.post('/api/ai/generate-from-prompts', async (req, res) => {
  try {
    const {
      basePrompt,
      systemPrompt,
      model,
      temperature,
      sender = 'demo',
      remoteJid = 'demo'
    } = req.body;

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

    return res.status(200).json({
      status: 'success',
      output: {
        response: respuestaIa.text,
        destination: { sender, remoteJid },
        model: model || 'models/gemini-3.1-flash-lite'
      }
    });
  } catch (error) {
    console.error('Error en el endpoint de prompts:', error);
    return res.status(500).json({
      error: 'No se pudo generar la respuesta con los prompts proporcionados',
      details: error.message
    });
  }
});

// Endpoint genérico para integración con n8n: acepta prompt, systemInstruction, history e identificador de inquilino.
aplicacion.post('/run', async (req, res) => {
  try {
    const { tenantId, prompt, systemInstruction, history, model, temperature, sender, remoteJid } = req.body;

    if (!prompt || !systemInstruction) {
      return res.status(400).json({ error: 'Se requieren prompt y systemInstruction' });
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

    return res.status(200).json({
      status: 'success',
      tenantId,
      output: {
        response: textoRespuestaIa,
        metrics: { latenciaMs }
      }
    });
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
