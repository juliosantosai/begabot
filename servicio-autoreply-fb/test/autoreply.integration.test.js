const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { deleteConversationMemory } = require('../src/services/conversationMemoryService');

const senderName = 'Marta';
const firstPayload = {
  appPackageName: 'tkstudio.autoresponderforwa',
  messengerPackageName: 'com.whatsapp',
  query: {
    sender: senderName,
    message: 'Hola, quiero cotizar un servicio. Mi teléfono es +54 9 11 1234 5678',
    isGroup: false,
    groupParticipant: '',
    ruleId: 42,
    isTestMessage: false,
  },
};

const secondPayload = {
  appPackageName: 'tkstudio.autoresponderforwa',
  messengerPackageName: 'com.whatsapp',
  query: {
    sender: senderName,
    message: 'Perfecto, quiero más detalles.',
    isGroup: false,
    groupParticipant: '',
    ruleId: 42,
    isTestMessage: false,
  },
};

test.before(async () => {
  await deleteConversationMemory(senderName);
});

test.after(async () => {
  await deleteConversationMemory(senderName);
});

test('Integration: webhook autoreply + memory persistence simula flujo n8n', async () => {
  const firstResponse = await request(app)
    .post('/webhook/autoreply')
    .send(firstPayload)
    .set('Content-Type', 'application/json');

  assert.equal(firstResponse.status, 200);
  assert.equal(firstResponse.body.sender, senderName);
  assert.equal(firstResponse.body.titulo, 'Solicitud recibida');
  assert.equal(firstResponse.body.personalidad, 'Asistente comercial');
  assert.equal(firstResponse.body.enviarWhatsapp, true);
  assert.equal(firstResponse.body.whatsappSender, '+5491112345678');
  assert.ok(Array.isArray(firstResponse.body.history), 'history debe ser un arreglo');
  assert.equal(firstResponse.body.history.length, 1);
  assert.equal(firstResponse.body.history[0].message, firstPayload.query.message);

  const secondResponse = await request(app)
    .post('/webhook/autoreply')
    .send(secondPayload)
    .set('Content-Type', 'application/json');

  assert.equal(secondResponse.status, 200);
  assert.equal(secondResponse.body.history.length, 2);
  assert.equal(secondResponse.body.history[1].message, secondPayload.query.message);
  assert.equal(secondResponse.body.enviarWhatsapp, false);

  const memoryResponse = await request(app).get(`/debug/memory?sender=${encodeURIComponent(senderName)}`);
  assert.equal(memoryResponse.status, 200);
  assert.equal(memoryResponse.body.memory.sender, senderName);
  assert.equal(memoryResponse.body.memory.messageCount, 2);
  assert.equal(memoryResponse.body.memory.lastMessage, secondPayload.query.message);
  assert.equal(memoryResponse.body.memory.history.length, 2);
});
