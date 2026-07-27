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

describe('Unit tests for ai-gemini-agent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 when missing required fields on generate-response', async () => {
    const response = await request(app).post('/api/ai/generate-response').send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('returns 200 for generate-from-prompts with valid body', async () => {
    aiGenaiMock.models.generateContent.mockResolvedValue({ text: 'Hola de prueba' });

    const response = await request(app)
      .post('/api/ai/generate-from-prompts')
      .send({ basePrompt: 'Hola', systemPrompt: 'Eres conciso.' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('output');
    expect(response.body.output).toMatchObject({ response: 'Hola de prueba' });
  });

  test('calls logging endpoint when generate-response succeeds with userContext', async () => {
    aiGenaiMock.models.generateContent.mockResolvedValue({ text: 'Respuesta' });
    axios.post.mockResolvedValue({ status: 200 });

    const response = await request(app)
      .post('/api/ai/generate-response')
      .send({
        systemPrompt: 'Eres un asistente amigable.',
        userConcatenatedMessage: 'Hola',
        userContext: 'El usuario es premium y quiere respuestas breves.',
        aiModel: 'models/gemini-3.1-flash-lite'
      });

    expect(response.status).toBe(200);
    expect(response.body.output.response).toBe('Respuesta');
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/log-interaction'),
      expect.objectContaining({
        aiResponse: 'Respuesta',
        userQuery: expect.stringContaining('El usuario es premium y quiere respuestas breves.')
      })
    );
  });

  test('convierte números a strings en el endpoint generate-response', async () => {
    aiGenaiMock.models.generateContent.mockResolvedValue({ text: 'Respuesta numérica' });
    axios.post.mockResolvedValue({ status: 200 });

    const response = await request(app)
      .post('/api/ai/generate-response')
      .send({
        systemPrompt: 12345,
        userConcatenatedMessage: 67890,
        userContext: 100,
        aiModel: 'models/gemini-3.1-flash-lite'
      });

    expect(response.status).toBe(200);
    expect(response.body.output.response).toBe('Respuesta numérica');
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/log-interaction'),
      expect.objectContaining({
        aiResponse: 'Respuesta numérica',
        userQuery: expect.stringContaining('100')
      })
    );
  });
});
