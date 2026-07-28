const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { deleteConversationMemory } = require('../src/services/conversationMemoryService');

const mockPayload = {
  appPackageName: 'tkstudio.autoresponderforwa',
  messengerPackageName: 'com.whatsapp',
  query: {
    sender: 'Alice',
    message: 'Hola, quiero cotizar un servicio',
    isGroup: false,
    groupParticipant: '',
    ruleId: 11,
    isTestMessage: false,
  },
};

test.before(async () => {
  await deleteConversationMemory('Alice');
});

test('GET /health returns ok', async () => {
  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('POST /webhook/autoreply returns response with history array', async () => {
  const response = await request(app)
    .post('/webhook/autoreply')
    .send(mockPayload)
    .set('Content-Type', 'application/json');

  assert.equal(response.status, 200);
  assert.equal(response.body.sender, 'Alice');
  assert.ok(Array.isArray(response.body.history));
  assert.ok(response.body.history.length >= 1);
});

test('POST /internal/transform returns normalized payload', async () => {
  const response = await request(app)
    .post('/internal/transform')
    .send(mockPayload)
    .set('Content-Type', 'application/json');

  assert.equal(response.status, 200);
  assert.equal(response.body.normalized.source, 'autoreply');
  assert.equal(response.body.normalized.contact.sender, 'Alice');
});

test('GET /debug/memory returns stored memory after webhook', async () => {
  const response = await request(app).get('/debug/memory?sender=Alice');
  assert.equal(response.status, 200);
  assert.equal(response.body.memory.sender, 'Alice');
  assert.ok(Array.isArray(response.body.memory.history));
});

test('GET /debug/memory returns 400 without sender', async () => {
  const response = await request(app).get('/debug/memory');
  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'sender_required');
});
