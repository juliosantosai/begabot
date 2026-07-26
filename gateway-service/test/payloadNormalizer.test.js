const test = require('node:test');
const assert = require('node:assert/strict');
const {
  processIncomingWebhook,
  extractAndNormalizeMessage,
} = require('../controllers/payloadNormalizerController');

test('normaliza un payload de conversación simple', () => {
  const payload = {
    data: {
      id: '12345',
      from: '1234@s.whatsapp.net',
      messageType: 'conversation',
      message: { conversation: 'hola' },
      messageTimestamp: 1690000000,
    },
  };

  const normalizedData = processIncomingWebhook(payload);

  assert.equal(normalizedData.messageId, '12345');
  assert.equal(normalizedData.remoteJid, '1234@s.whatsapp.net');
  assert.equal(normalizedData.messageBody, 'hola');
  assert.equal(normalizedData.messageType, 'conversation');
});

test('devuelve null cuando falta messageId o remoteJid', () => {
  const payload = {
    data: {
      messageType: 'conversation',
      message: { conversation: 'hola' },
    },
  };

  const normalizedData = processIncomingWebhook(payload);
  assert.equal(normalizedData, null);
});

test('extrae payload anidado en body', () => {
  const payload = {
    body: {
      id: 'abc123',
      from: 'contact@s.whatsapp.net',
      messageType: 'textMessage',
      message: { textMessage: { text: 'hola' } },
      messageTimestamp: 1690000001,
    },
  };

  const normalizedData = processIncomingWebhook(payload);

  assert.equal(normalizedData.messageId, 'abc123');
  assert.equal(normalizedData.messageBody, 'hola');
  assert.equal(normalizedData.remoteJid, 'contact@s.whatsapp.net');
});

test('normaliza payload de messages.upsert con message.conversation aunque falte messageType', () => {
  const payload = {
    event: 'messages.upsert',
    instance: '150',
    data: {
      key: {
        remoteJid: '595981133313@s.whatsapp.net',
        id: '3EB0228AE70851520C282A',
        fromMe: false,
      },
      pushName: 'Jsantos',
      message: {
        conversation: 'çasdf',
      },
      messageTimestamp: 1784959953,
    },
  };

  const normalizedData = processIncomingWebhook(payload);

  assert.equal(normalizedData.messageId, '3EB0228AE70851520C282A');
  assert.equal(normalizedData.remoteJid, '595981133313@s.whatsapp.net');
  assert.equal(normalizedData.messageBody, 'çasdf');
  assert.equal(normalizedData.messageType, 'text');
});

test('propaga fromMe true y deviceType en lugar de ignorar el mensaje del humano', () => {
  const payload = {
    data: {
      key: {
        remoteJid: '595981133313@s.whatsapp.net',
        id: 'msg-123',
        fromMe: true,
      },
      source: 'android',
      message: {
        conversation: 'hola desde el bot',
      },
    },
  };

  const normalizedData = processIncomingWebhook(payload);

  assert.equal(normalizedData.fromMe, true);
  assert.equal(normalizedData.deviceType, 'android');
  assert.equal(normalizedData.messageId, 'msg-123');
  assert.equal(normalizedData.messageBody, 'hola desde el bot');
  assert.notEqual(normalizedData.ignored, true);
});

test('ignora mensajes de grupo con remoteJid @g.us', () => {
  const payload = {
    data: {
      key: {
        remoteJid: '12345-67890@g.us',
        id: 'msg-456',
      },
      message: {
        conversation: 'mensaje de grupo',
      },
    },
  };

  const normalizedData = processIncomingWebhook(payload);

  assert.equal(normalizedData.ignored, true);
  assert.equal(normalizedData.reason, 'IGNORED_GROUP_MESSAGE');
});
