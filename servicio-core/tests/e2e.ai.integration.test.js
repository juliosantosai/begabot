const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
// use global fetch provided by the test runtime
const { PrismaClient } = require('@prisma/client');
const { crearAplicacion } = require('../src/interfaz/http/app');

function createMockAiServer(responseHandler) {
  const app = express();
  app.use(express.json());
  app.post('/run', (req, res) => responseHandler(req, res));
  return app.listen(0);
}

test('E2E: AI valid parsedResponse persists memory_patch', async () => {
  const prisma = new PrismaClient();
  const mock = createMockAiServer((_req, res) => {
    const parsed = { reply: 'Hola desde mock', memory_patch: { ciudad: 'MVD', conversation_state: 'ESPERANDO_DIRECCION' } };
    res.json({ status: 'success', response: JSON.stringify(parsed), responseText: JSON.stringify(parsed), parsedResponse: parsed, output: { response: JSON.stringify(parsed), parsedResponse: parsed } });
  });

  const mockPort = mock.address().port;
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${mockPort}`;
  const app = crearAplicacion({ prisma });
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const jid = `e2e-jid-${Date.now()}`;
    await prisma.sessionMemory.deleteMany({ where: { jid } });

    const resp = await fetch(`http://127.0.0.1:${port}/core/mensajes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jid, texto: 'Quiero comprar', isFromClient: true, source: 'test' })
    });
    const payload = await resp.json();
    assert.equal(resp.status, 201);

    // Wait a tick then query DB
    await new Promise((r) => setTimeout(r, 200));
    const session = await prisma.sessionMemory.findUnique({ where: { jid } });
    assert.ok(session);
    assert.equal(session.state_data.ciudad, 'MVD');
    assert.equal(session.state_data.conversation_state, 'ESPERANDO_DIRECCION');
  } finally {
    server.close();
    mock.close();
    await prisma.$disconnect();
  }
});

test('E2E: AI split conversation_state into separate persisted field', async () => {
  const prisma = new PrismaClient();
  const jid = `e2e-jid-conversation-state-${Date.now()}`;
  await prisma.sessionMemory.deleteMany({ where: { jid } });

  const mock = createMockAiServer((_req, res) => {
    const parsed = { reply: 'Hola desde mock', memory_patch: { ciudad: 'MVD', conversation_state: 'ESPERANDO_DIRECCION' } };
    res.json({ status: 'success', response: JSON.stringify(parsed), responseText: JSON.stringify(parsed), parsedResponse: parsed, output: { response: JSON.stringify(parsed), parsedResponse: parsed } });
  });

  const mockPort = mock.address().port;
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${mockPort}`;
  const app = crearAplicacion({ prisma });
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const resp = await fetch(`http://127.0.0.1:${port}/core/mensajes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jid, texto: 'Quiero comprar', isFromClient: true, source: 'test' })
    });
    assert.equal(resp.status, 201);

    await new Promise((r) => setTimeout(r, 200));
    const session = await prisma.sessionMemory.findUnique({ where: { jid } });
    assert.ok(session);
    assert.equal(session.conversation_state, 'ESPERANDO_DIRECCION');
    assert.equal(session.state_data.ciudad, 'MVD');
    assert.equal(session.state_data.conversation_state, 'ESPERANDO_DIRECCION');
  } finally {
    server.close();
    mock.close();
    await prisma.$disconnect();
  }
});

test('E2E: AI accumulates conversation_summary in a dedicated field', async () => {
  const prisma = new PrismaClient();
  const jid = `e2e-jid-summary-${Date.now()}`;
  await prisma.sessionMemory.deleteMany({ where: { jid } });

  const mock = createMockAiServer((_req, res) => {
    const parsed = { reply: 'Hola desde mock', memory_patch: { ciudad: 'MVD', conversation_state: 'ESPERANDO_DIRECCION' } };
    res.json({ status: 'success', response: JSON.stringify(parsed), responseText: JSON.stringify(parsed), parsedResponse: parsed, output: { response: JSON.stringify(parsed), parsedResponse: parsed } });
  });

  const mockPort = mock.address().port;
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${mockPort}`;
  const app = crearAplicacion({ prisma });
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const resp = await fetch(`http://127.0.0.1:${port}/core/mensajes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jid, texto: 'Quiero comprar', isFromClient: true, source: 'test' })
    });
    assert.equal(resp.status, 201);

    await new Promise((r) => setTimeout(r, 200));
    const session = await prisma.sessionMemory.findUnique({ where: { jid } });
    assert.ok(session);
    assert.equal(session.conversation_summary, 'Quiero comprar - Hola desde mock');
    assert.equal(session.conversation_state, 'ESPERANDO_DIRECCION');
  } finally {
    server.close();
    mock.close();
    await prisma.$disconnect();
  }
});

test('E2E: AI invalid response does not alter session memory', async () => {
  const prisma = new PrismaClient();
  const jid = `e2e-jid-invalid-${Date.now()}`;
  await prisma.sessionMemory.deleteMany({ where: { jid } });
  // seed session with initial state
  await prisma.sessionMemory.upsert({ where: { jid }, create: { jid, state_data: { nombre: 'Ana' }, updatedAt: new Date() }, update: { state_data: { nombre: 'Ana' }, updatedAt: new Date() } });

  const mock = createMockAiServer((_req, res) => {
    // return plain text that is not JSON parsable by intentarParsearJson
    res.json({ status: 'success', response: 'This is plain text not json', responseText: 'This is plain text not json', parsedResponse: null });
  });

  const mockPort = mock.address().port;
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${mockPort}`;
  const app = crearAplicacion({ prisma });
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const resp = await fetch(`http://127.0.0.1:${port}/core/mensajes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jid, texto: 'Mensaje que provoca texto inválido', isFromClient: true, source: 'test' })
    });
    const payload = await resp.json();
    assert.equal(resp.status, 201);

    await new Promise((r) => setTimeout(r, 200));
    const session = await prisma.sessionMemory.findUnique({ where: { jid } });
    assert.ok(session);
    // should remain unchanged
    assert.equal(session.state_data.nombre, 'Ana');
  } finally {
    server.close();
    mock.close();
    await prisma.$disconnect();
  }
});

test('POST /core/tenants/:tenantId/sesiones/persistencia filters dynamic data by tenant allowlist', async () => {
  const prisma = new PrismaClient();
  const tenantId = `tenant-allowlist-${Date.now()}`;
  const jid = `jid-allowlist-${Date.now()}`;

  await prisma.tenantConfig.deleteMany({ where: { tenantId } });
  await prisma.messageTenant.deleteMany({ where: { tenantId, jid } });
  await prisma.dynamicRecord.deleteMany({ where: { tenantId } });
  await prisma.sessionMemoryTenant.deleteMany({ where: { tenantId, jid } });
  await prisma.tenantConfig.create({ data: { tenantId, name: 'Tenant Test', fields: ['nombre', 'empresa'] } });

  const app = crearAplicacion({ prisma });
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const resp = await fetch(`http://127.0.0.1:${port}/core/tenants/${tenantId}/sesiones/persistencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jid,
        mensaje_usuario: 'Hola',
        respuesta_ia: 'Hola de vuelta',
        memory_patch: { conversation_state: 'LISTO_PARA_VENTA' },
        dynamic_record: {
          entityName: 'cliente',
          data: {
            nombre: 'Ana',
            empresa: 'Tech',
            password: 'no-deberia-persistir'
          }
        }
      })
    });

    assert.equal(resp.status, 201);
    const payload = await resp.json();
    assert.equal(payload.status, 'success');

    const dynamicRecord = await prisma.dynamicRecord.findFirst({ where: { tenantId, entityName: 'cliente', recordIdentifier: jid } });
    assert.ok(dynamicRecord);
    assert.deepEqual(dynamicRecord.data, { nombre: 'Ana', empresa: 'Tech' });

    const session = await prisma.sessionMemoryTenant.findUnique({ where: { tenantId_jid: { tenantId, jid } } });
    assert.ok(session);
    assert.equal(session.memoryPatch.conversation_state, 'LISTO_PARA_VENTA');

    const messages = await prisma.messageTenant.findMany({ where: { tenantId, jid } });
    assert.equal(messages.length, 2);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
});

test('POST /core/tenants/:tenantId/sesiones/persistencia ignores dynamic data when tenant allowlist is absent', async () => {
  const prisma = new PrismaClient();
  const tenantId = `tenant-no-allowlist-${Date.now()}`;
  const jid = `jid-no-allowlist-${Date.now()}`;

  await prisma.tenantConfig.deleteMany({ where: { tenantId } });
  await prisma.dynamicRecord.deleteMany({ where: { tenantId } });
  await prisma.sessionMemoryTenant.deleteMany({ where: { tenantId, jid } });
  await prisma.messageTenant.deleteMany({ where: { tenantId, jid } });

  const app = crearAplicacion({ prisma });
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const resp = await fetch(`http://127.0.0.1:${port}/core/tenants/${tenantId}/sesiones/persistencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jid,
        mensaje_usuario: 'Hola',
        respuesta_ia: 'Hola',
        dynamic_record: {
          entityName: 'cliente',
          data: { nombre: 'Ana', password: 'x' }
        }
      })
    });

    assert.equal(resp.status, 201);
    const dynamicRecord = await prisma.dynamicRecord.findFirst({ where: { tenantId, entityName: 'cliente', recordIdentifier: jid } });
    assert.equal(dynamicRecord, null);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
});

test('POST /core/tenants/:tenantId/sesiones/persistencia returns error when Prisma transaction fails', async () => {
  const prisma = new PrismaClient();
  const originalTransaction = prisma.$transaction.bind(prisma);
  prisma.$transaction = async () => {
    throw new Error('db unavailable');
  };

  const app = crearAplicacion({ prisma });
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const resp = await fetch(`http://127.0.0.1:${port}/core/tenants/tenant-fail/sesiones/persistencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jid: 'jid-fail',
        mensaje_usuario: 'Hola',
        respuesta_ia: 'Hola',
        dynamic_record: {
          entityName: 'cliente',
          data: { nombre: 'Ana' }
        }
      })
    });

    assert.equal(resp.status, 500);
    const payload = await resp.json();
    assert.equal(payload.error, 'Error interno al persistir la sesión');
  } finally {
    prisma.$transaction = originalTransaction;
    server.close();
    await prisma.$disconnect();
  }
});
