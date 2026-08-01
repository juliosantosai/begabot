const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAutoreplyPayload, buildAutoreplyResponse } = require('../src/services/autoreplyService');
const { buildConversationMemoryKey, mergeConversationContext } = require('../src/services/conversationMemoryService');

test('normaliza el payload de Autoreply.io y detecta un teléfono', () => {
  const payload = {
    appPackageName: 'tkstudio.autoresponderforwa',
    messengerPackageName: 'com.whatsapp',
    query: {
      sender: 'John Smith',
      message: 'Hola, mi número es +54 11 5555 6666',
      isGroup: false,
      groupParticipant: '',
      ruleId: 42,
      isTestMessage: false,
    },
  };

  const normalized = normalizeAutoreplyPayload(payload);

  assert.equal(normalized.contact.name, 'John Smith');
  assert.equal(normalized.message.text, 'Hola, mi número es +54 11 5555 6666');
  assert.equal(normalized.context.detectedPhone, '+541155556666');
  assert.equal(normalized.context.phoneCandidates.length, 1);
});

test('construye una respuesta lista para Autoreply.io', () => {
  const normalized = {
    source: 'autoreply',
    channel: 'whatsapp',
    contact: { name: 'John Smith', sender: 'John Smith' },
    message: { text: 'This is an example!', isGroup: false, groupParticipant: '' },
    context: { detectedPhone: null, phoneCandidates: [] },
  };

  const response = buildAutoreplyResponse(normalized, { status: 'accepted' });

  assert.equal(response.sender, 'John Smith');
  assert.equal(response.personalidad, 'Asistente comercial');
  assert.equal(response.enviarWhatsapp, false);
  assert.equal(response.data.processedBy, 'autoreply-adapter');
});

test('genera una clave estable para la memoria del sender', () => {
  const key = buildConversationMemoryKey('John Smith', 'acme');
  assert.match(key, /begabot:autoreply:memory:tenant:acme:user:john-smith/);
});

test('fusiona la memoria previa con el contexto actual', () => {
  const previousContext = {
    messageCount: 1,
    lastIntent: 'start',
    lastMessage: 'Hola',
  };

  const merged = mergeConversationContext(previousContext, {
    sender: 'John Smith',
    message: 'Quiero comprar',
  });

  assert.equal(merged.messageCount, 2);
  assert.equal(merged.lastIntent, 'start');
  assert.equal(merged.lastMessage, 'Quiero comprar');
  assert.equal(merged.sender, 'John Smith');
});
