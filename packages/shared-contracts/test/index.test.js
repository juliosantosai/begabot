const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createWhatsAppNormalizedMessage,
  createRedisBufferState,
  MESSAGE_TYPES,
} = require('../index.js');

test('createWhatsAppNormalizedMessage normaliza payloads de WhatsApp', () => {
  const result = createWhatsAppNormalizedMessage({
    key: { id: 'msg-1', remoteJid: '573001112233@s.whatsapp.net' },
    message: { conversation: 'hola' },
    messageTimestamp: 1710000000,
    pushName: 'Ana',
  });

  assert.equal(result.messageId, 'msg-1');
  assert.equal(result.remoteJid, '573001112233@s.whatsapp.net');
  assert.equal(result.messageBody, 'hola');
  assert.equal(result.messageType, MESSAGE_TYPES.TEXT);
});

test('createRedisBufferState prepara un estado de buffer reutilizable', () => {
  const state = createRedisBufferState({
    remoteJid: '573001112233@s.whatsapp.net',
    messageId: 'msg-1',
    messageBody: 'hola',
  });

  assert.equal(state.remoteJid, '573001112233@s.whatsapp.net');
  assert.equal(state.combinedText, 'hola');
  assert.deepEqual(state.messageIds, ['msg-1']);
});
