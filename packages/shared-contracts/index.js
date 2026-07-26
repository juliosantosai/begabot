'use strict';

const MESSAGE_TYPES = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  DOCUMENT: 'document',
});

function createServiceEvent(service, payload) {
  return {
    service,
    payload,
    createdAt: new Date().toISOString(),
  };
}

function generateUuid() {
  return require('crypto').randomUUID();
}

function createWhatsAppNormalizedMessage(rawPayload = {}) {
  const eventData = rawPayload?.data || rawPayload;
  const message = eventData?.message || eventData?.messages?.[0] || {};
  const messageType = eventData?.messageType || eventData?.type || inferMessageType(message);

  let messageBody = '';
  if (message?.conversation) {
    messageBody = message.conversation;
  } else if (message?.textMessage?.text) {
    messageBody = message.textMessage.text;
  } else if (typeof eventData?.body === 'string') {
    messageBody = eventData.body;
  } else if (message?.imageMessage?.caption) {
    messageBody = message.imageMessage.caption;
  } else if (messageType === MESSAGE_TYPES.AUDIO) {
    messageBody = '[Audio / Nota de voz]';
  } else if (messageType === MESSAGE_TYPES.IMAGE) {
    messageBody = '[Imagen]';
  }

  return {
    messageId: eventData?.key?.id || eventData?.id || null,
    remoteJid: eventData?.key?.remoteJid || eventData?.from || eventData?.remoteJid || '',
    fromMe: eventData?.key?.fromMe ?? eventData?.fromMe ?? false,
    deviceType: eventData?.source || eventData?.device || 'unknown',
    pushName: eventData?.pushName || eventData?.senderName || 'Usuario',
    messageType,
    messageBody,
    timestamp: eventData?.messageTimestamp || Date.now(),
    instance: rawPayload?.instance || rawPayload?.data?.instance || null,
    instanceId: rawPayload?.instanceId || rawPayload?.data?.instanceId || null,
    serverUrl: rawPayload?.server_url || rawPayload?.serverUrl || rawPayload?.data?.server_url || rawPayload?.data?.serverUrl || null,
    rawPayload: rawPayload,
  };
}

function createRedisBufferState({ remoteJid, messageId, messageBody, normalizedData = {} }) {
  return {
    remoteJid,
    combinedText: messageBody || normalizedData.messageBody || '',
    messageIds: messageId ? [messageId] : [],
    lastNormalizedData: normalizedData,
  };
}

function inferMessageType(message = {}) {
  if (message?.conversation) {
    return MESSAGE_TYPES.TEXT;
  }
  if (message?.textMessage) {
    return MESSAGE_TYPES.TEXT;
  }
  if (message?.imageMessage) {
    return MESSAGE_TYPES.IMAGE;
  }
  if (message?.audioMessage) {
    return MESSAGE_TYPES.AUDIO;
  }
  return MESSAGE_TYPES.TEXT;
}

module.exports = {
  MESSAGE_TYPES,
  createServiceEvent,
  createWhatsAppNormalizedMessage,
  createRedisBufferState,
  generateUuid,
};
