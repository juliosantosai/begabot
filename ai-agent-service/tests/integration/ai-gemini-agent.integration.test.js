const request = require('supertest');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

jest.mock('axios');
jest.mock('@google/genai');

const aiGenaiMock = {
  models: {
    generateContent: jest.fn()
  }
};

GoogleGenAI.mockImplementation(() => aiGenaiMock);

const app = require('../../ai-gemini-agent');

describe('Integration tests for ai-gemini-agent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/ai/generate-from-prompts returns structured JSON output', async () => {
    aiGenaiMock.models.generateContent.mockResolvedValue({ text: 'Respuesta de integración' });

    const response = await request(app)
      .post('/api/ai/generate-from-prompts')
      .send({
        basePrompt: 'Resume esta idea en una frase.',
        systemPrompt: 'Eres un asistente conciso.',
        sender: 'demo',
        remoteJid: 'demo'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.output.response).toBe('Respuesta de integración');
    expect(response.body.output.destination).toEqual({ sender: 'demo', remoteJid: 'demo' });
  });

  test('POST /api/ai/generate-response includes metrics and calls logging service', async () => {
    aiGenaiMock.models.generateContent.mockResolvedValue({ text: 'Respuesta completa' });
    axios.post.mockResolvedValue({ status: 200 });

    const response = await request(app)
      .post('/api/ai/generate-response')
      .send({
        sender: 'user2',
        remoteJid: 'whatsapp:5678',
        systemPrompt: 'Eres preciso.',
        userConcatenatedMessage: 'Hola de integración',
        aiModel: 'models/gemini-3.1-flash-lite'
      });

    expect(response.status).toBe(200);
    expect(response.body.output.response).toBe('Respuesta completa');
    expect(response.body.output.metrics).toBeDefined();
    expect(axios.post).toHaveBeenCalled();
  });
});
