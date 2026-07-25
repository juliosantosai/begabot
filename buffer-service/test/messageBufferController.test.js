const test = require('node:test');
const assert = require('node:assert/strict');
const { accumulateMessageInBuffer, redis } = require('../controllers/messageBufferController');

test('accumulateMessageInBuffer devuelve texto acumulado y marca primer mensaje', async () => {
  const result = await accumulateMessageInBuffer('test-buffer@whatsapp.net', 'hola');
  assert.equal(result.isFirst, true);
  assert.equal(result.accumulatedText, 'hola');
});

test('accumulateMessageInBuffer acumula mensajes consecutivos', async () => {
  const result = await accumulateMessageInBuffer('test-buffer@whatsapp.net', 'mundo');
  assert.equal(result.isFirst, false);
  assert.match(result.accumulatedText, /hola - mundo/);
});

test('redis expone la conexión del buffer', async () => {
  assert.ok(redis);
  assert.equal(typeof redis.get, 'function');
});
