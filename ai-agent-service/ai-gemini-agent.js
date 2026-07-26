require('dotenv').config();

const express = require('express');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || 'http://localhost:3001';

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'AI Agent Service UP', timestamp: new Date() });
});

app.post('/api/ai/generate-response', async (req, res) => {
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

    const resolvedSystemPrompt = systemPrompt || req.body.system_instruction;
    const resolvedBasePrompt = userConcatenatedMessage || basePrompt || promptBase || req.body.userMessage;

    if (!resolvedBasePrompt || !resolvedSystemPrompt || !sender || !remoteJid) {
      return res.status(400).json({
        error: 'Faltan parámetros obligatorios (basePrompt o userConcatenatedMessage, systemPrompt, sender, remoteJid)'
      });
    }

    const tiempoInicio = Date.now();

    const response = await ai.models.generateContent({
      model: aiModel || 'models/gemini-3.1-flash-lite',
      contents: resolvedBasePrompt,
      config: {
        systemInstruction: resolvedSystemPrompt,
        temperature: temperature !== undefined ? temperature : 0.7,
      }
    });

    const tiempoFin = Date.now();
    const latenciaMs = tiempoFin - tiempoInicio;

    const aiResponseText = response.text;

    const usage = response.usageMetadata || {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0
    };

    try {
      await axios.post(`${CORE_SERVICE_URL}/api/log-interaction`, {
        sender,
        remoteJid,
        userQuery: resolvedBasePrompt,
        aiResponse: aiResponseText,
        intent: 'general_assistant_intent',
        modelUsed: aiModel || 'models/gemini-3.1-flash-lite',
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0,
        latenciaMs
      });
    } catch (logError) {
      console.error('Error al reportar auditoría al Core de PostgreSQL:', logError.message);
    }

    return res.status(200).json({
      status: 'success',
      output: {
        response: aiResponseText,
        destination: {
          sender,
          remoteJid
        },
        metrics: {
          latenciaMs,
          tokens: {
            prompt: usage.promptTokenCount,
            completion: usage.candidatesTokenCount,
            total: usage.totalTokenCount
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

app.post('/api/ai/generate-from-prompts', async (req, res) => {
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

    const response = await ai.models.generateContent({
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
        response: response.text,
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

// Endpoint genérico para integración con n8n: acepta prompt, systemInstruction, history y tenantId
app.post('/run', async (req, res) => {
  try {
    const { tenantId, prompt, systemInstruction, history, model, temperature, sender, remoteJid } = req.body;

    if (!prompt || !systemInstruction) {
      return res.status(400).json({ error: 'Se requieren prompt y systemInstruction' });
    }

    const start = Date.now();
    const response = await ai.models.generateContent({
      model: model || (process.env.DEFAULT_AI_MODEL || 'models/gemini-3.1-flash-lite'),
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature !== undefined ? temperature : 0.7,
      }
    });

    const end = Date.now();
    const latenciaMs = end - start;

    const aiResponseText = response.text;

    return res.status(200).json({
      status: 'success',
      tenantId,
      output: {
        response: aiResponseText,
        metrics: { latenciaMs }
      }
    });
  } catch (error) {
    console.error('Error en /run:', error);
    return res.status(500).json({ error: 'Error interno en AI service' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✨ AI Agent Service (Gemini Flash 2.5) corriendo en el puerto ${PORT}`);
  });
}

module.exports = app;
