const test = require('node:test');
const assert = require('node:assert/strict');
const { crearAplicacion } = require('../index');

function buildMockPrisma() {
  const calls = [];

  const company = {
    id: 'company-1',
    name: 'Empresa Test',
    sender: 'test-sender',
    status: 'active',
    botConfig: {
      id: 'bot-1',
      customSystemPrompt: 'Prompt personalizado de empresa',
      aiModel: 'gemini-2.5-flash',
      temperature: 0.4,
      systemPrompt: 'Prompt de prueba',
    },
    businessTemplate: {
      id: 'template-1',
      systemPrompt: 'Prompt base de plantilla',
      aiModel: 'gemini-2.5-flash',
      temperature: 0.7,
    },
    messages: [],
    interactionLogs: [],
    promptPerformanceLogs: [],
  };

  return {
    calls,
    messageHistory: {
      create: async (args) => {
        calls.push(['messageHistory.create', args]);
        return { id: 'msg-1', ...args.data };
      },
    },
    interactionLog: {
      create: async (args) => {
        calls.push(['interactionLog.create', args]);
        return { id: 'interaction-1', ...args.data };
      },
    },
    promptPerformanceLog: {
      create: async (args) => {
        calls.push(['promptPerformanceLog.create', args]);
        return { id: 'performance-1', ...args.data };
      },
    },
    company: {
      findUnique: async () => company,
      upsert: async (args) => {
        calls.push(['company.upsert', args]);
        return { id: 'company-1', ...args.create, ...args.update, botConfig: null };
      },
    },
    conversationSession: {
      findUnique: async () => null,
      create: async (args) => {
        calls.push(['conversationSession.create', args]);
        return { id: 'session-1', interactionCount: 0, contextJson: { isBlocked: false, botPausedByHuman: false, pauseExpiresAt: null }, ...args.data };
      },
      update: async (args) => {
        calls.push(['conversationSession.update', args]);
        return { id: 'session-1', interactionCount: 1, contextJson: { isBlocked: false, botPausedByHuman: false, pauseExpiresAt: null }, ...args.data };
      },
    },
  };
}

test('POST /api/procesar-mensaje devuelve payload y registra el mensaje inbound', async () => {
  const mockPrisma = buildMockPrisma();
  const app = crearAplicacion(mockPrisma);
  const server = app.listen(0);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/procesar-mensaje`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'test-sender',
        remoteJid: '123@s.whatsapp.net',
        messageBody: 'Hola desde prueba',
      }),
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'success');
    assert.equal(body.data.companyName, 'Empresa Test');
    assert.equal(body.data.aiModel, 'gemini-2.5-flash');
    assert.equal(body.data.systemPrompt, 'Prompt personalizado de empresa');
    assert.equal(body.data.temperature, 0.4);
    assert.equal(mockPrisma.calls[0][0], 'messageHistory.create');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/registrar-saliente registra un mensaje saliente', async () => {
  const mockPrisma = buildMockPrisma();
  const app = crearAplicacion(mockPrisma);
  const server = app.listen(0);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/registrar-saliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: 'company-1',
        remoteJid: '123@s.whatsapp.net',
        messageBody: 'respuesta de prueba',
      }),
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'success');
    assert.equal(body.data.direction, 'outbound');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/log-interaction registra interacción y métricas', async () => {
  const mockPrisma = buildMockPrisma();
  const app = crearAplicacion(mockPrisma);
  const server = app.listen(0);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/log-interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'test-sender',
        remoteJid: '123@s.whatsapp.net',
        userQuery: 'Quiero una cotización',
        aiResponse: 'Claro, te ayudo',
        intent: 'cotizacion',
        modelUsed: 'gpt-4o-mini',
        promptTokens: 10,
        completionTokens: 12,
        latencyMs: 120,
      }),
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'success');
    assert.equal(mockPrisma.calls.some(([name]) => name === 'interactionLog.create'), true);
    assert.equal(mockPrisma.calls.some(([name]) => name === 'promptPerformanceLog.create'), true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/companies crea o actualiza una empresa de forma idempotente', async () => {
  const mockPrisma = buildMockPrisma();
  const app = crearAplicacion(mockPrisma);
  const server = app.listen(0);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Empresa Demo',
        sender: 'demo-sender',
        status: 'active_trial',
      }),
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.status, 'success');
    assert.equal(body.data.sender, 'demo-sender');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/companies/:sender/audit devuelve auditoría reciente', async () => {
  const mockPrisma = buildMockPrisma();
  const app = crearAplicacion(mockPrisma);
  const server = app.listen(0);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/companies/test-sender/audit`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'success');
    assert.equal(body.companyName, 'Empresa Test');
    assert.equal(Array.isArray(body.recentMessages), true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
