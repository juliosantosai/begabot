const test = require('node:test');
const assert = require('node:assert/strict');
const { bufferMessage, disconnectRedis } = require('../controllers/webhookController');

const originalRedisUrl = process.env.REDIS_URL;
const originalMessageBufferMs = process.env.MESSAGE_BUFFER_MS;

async function tryRedisConnection(url) {
  process.env.REDIS_URL = url;
  try {
    const result = await bufferMessage({ remoteJid: 'health-check-redis@whatsapp.net' });
    return result.warning !== 'Redis no disponible';
  } catch {
    return false;
  }
}

test.afterEach(async () => {
  await disconnectRedis();
  process.env.MESSAGE_BUFFER_MS = originalMessageBufferMs;
});

test.after(() => {
  process.env.REDIS_URL = originalRedisUrl;
});

test('marca como no duplicado cuando no hay remoteJid para buffer', async () => {
  const result = await bufferMessage({});
  assert.equal(result.isHeld, false);
  assert.equal(result.warning, 'No hay remoteJid para buffer');
});

test('usa fallback cuando Redis no está disponible', async () => {
  process.env.REDIS_URL = 'redis://127.0.0.1:9999';
  const result = await bufferMessage({ remoteJid: 'test-1@whatsapp.net' });

  assert.equal(result.isHeld, false);
  assert.equal(result.warning, undefined);
});

test('Redis SET NX PX produce buffering distribuido y respeta TTL por usuario', async (t) => {
  const redisAvailable = await tryRedisConnection('redis://127.0.0.1:6379');
  if (!redisAvailable) {
    t.skip('Redis no disponible en redis://127.0.0.1:6379');
    return;
  }

  process.env.MESSAGE_BUFFER_MS = '250';
  const remoteJid = '595981133313@s.whatsapp.net';

  const firstResult = await bufferMessage({ remoteJid, messageId: 'dup-1' });
  assert.equal(firstResult.isHeld, true);

  const secondResult = await bufferMessage({ remoteJid, messageId: 'dup-2' });
  assert.equal(secondResult.isHeld, true);

  await new Promise((resolve) => setTimeout(resolve, 300));

  const thirdResult = await bufferMessage({ remoteJid, messageId: 'dup-3' });
  assert.equal(thirdResult.isHeld, true);
});
