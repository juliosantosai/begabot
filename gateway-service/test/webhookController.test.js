require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const webhookController = require('../controllers/webhookController');

let originalEvolutionApiKey;
let originalAllowedEvolutionApiKeys;
let originalRedisUrl;

const buildResponse = () => {
  let statusCode = null;
  let jsonBody = null;

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
  };
};

test.before(() => {
  originalEvolutionApiKey = process.env.EVOLUTION_API_KEY;
  originalAllowedEvolutionApiKeys = process.env.ALLOWED_EVOLUTION_API_KEYS;
  originalRedisUrl = process.env.REDIS_URL;
});

test.after(() => {
  process.env.EVOLUTION_API_KEY = originalEvolutionApiKey;
  process.env.ALLOWED_EVOLUTION_API_KEYS = originalAllowedEvolutionApiKeys;
  process.env.REDIS_URL = originalRedisUrl;
});

test.beforeEach(() => {
  webhookController.setBufferChecker(async (normalizedData) => ({
    isDuplicate: false,
    normalizedData,
  }));
});

test.afterEach(async () => {
  webhookController.setBufferChecker();
  if (webhookController.disconnectRedis) {
    await webhookController.disconnectRedis();
  }
});

test('verifyWebhook responde el challenge con token válido', () => {
  process.env.WHATSAPP_VERIFY_TOKEN = 'verify-token';

  const req = {
    query: {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'verify-token',
      'hub.challenge': 'challenge-code',
    },
  };

  let sentValue = null;
  const res = {
    status() {
      return this;
    },
    send(value) {
      sentValue = value;
      return this;
    },
  };

  webhookController.verifyWebhook(req, res);

  assert.equal(sentValue, 'challenge-code');
});

test('accepts api key from body.EVOLUTION_API_KEY and normalizes payload', async () => {
  process.env.EVOLUTION_API_KEY = 'secret-key';

  const req = {
    body: {
      EVOLUTION_API_KEY: 'secret-key',
      data: {
        id: '12345',
        from: '1234@s.whatsapp.net',
        messageType: 'conversation',
        message: { conversation: 'hola' },
        messageTimestamp: 1690000000,
      },
    },
    headers: {},
  };
  const res = buildResponse();

  await webhookController.receiveWebhook(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonBody.status, 'EVENT_RECEIVED_NORMALIZED_CHECKED_AND_TENANT_VALIDATED');
  assert.equal(res.jsonBody.data.messageBody, 'hola');
});

test('rejects if API key is missing', async () => {
  process.env.EVOLUTION_API_KEY = 'secret-key';

  const req = {
    body: { event: 'message' },
    headers: {},
  };
  const res = buildResponse();

  await webhookController.receiveWebhook(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.jsonBody, { error: 'API key faltante' });
});

test('ignora mensajes en ráfaga cuando el buffer Redis marca activo', async () => {
  process.env.EVOLUTION_API_KEY = 'secret-key';

  webhookController.setBufferChecker(async () => ({
    isDuplicate: true,
    normalizedData: { messageId: '12345', remoteJid: '1234@s.whatsapp.net' },
  }));

  const req = {
    body: {
      EVOLUTION_API_KEY: 'secret-key',
      data: {
        id: '12345',
        from: '1234@s.whatsapp.net',
        messageType: 'conversation',
        message: { conversation: 'hola' },
        messageTimestamp: 1690000000,
      },
    },
    headers: {},
  };
  const res = buildResponse();

  await webhookController.receiveWebhook(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonBody.status, 'BUFFER_HELD');
  assert.equal(res.jsonBody.messageId, '12345');
  assert.equal(res.jsonBody.remoteJid, '1234@s.whatsapp.net');
});

const fs = require('node:fs');
const path = require('node:path');

// ... later in the file ...

test('procesa EJEMPLO.JSON completo a través de la tubería', async () => {
  const samplePayload = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'EJEMPLO.JSON'), 'utf8'));
  process.env.EVOLUTION_API_KEY = 'C72947216ABD-4957-B7E2-DA911A29D6DA';

  const req = {
    body: samplePayload,
    headers: {},
  };
  const res = buildResponse();

  await webhookController.receiveWebhook(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonBody.status, 'EVENT_RECEIVED_NORMALIZED_CHECKED_AND_TENANT_VALIDATED');
  assert.equal(res.jsonBody.data.messageBody, 'çasdf');
  assert.equal(res.jsonBody.data.messageType, 'conversation');
});
