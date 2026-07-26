const { createWhatsAppNormalizedMessage } = require('@begabot/shared');

function processIncomingWebhook(payload) {
  console.log('Iniciando transformación del payload...');

  const unwrappedPayload = resolveIncomingPayload(payload);
  const normalizedData = extractAndNormalizeMessage(unwrappedPayload);

  if (!normalizedData) {
    console.log('El evento recibido no contiene un mensaje de texto o multimedia válido.');
    return null;
  }

  if (normalizedData.ignored) {
    console.log(`Mensaje descartado por filtro perimetral: ${normalizedData.reason}`);
    return normalizedData;
  }

  console.log('Mensaje normalizado con éxito:', normalizedData);
  return normalizedData;
}

function extractAndNormalizeMessage(payload) {
  const eventData = payload?.data || payload;
  const remoteJid = eventData?.key?.remoteJid || eventData?.from || eventData?.remoteJid || '';

  if (remoteJid.endsWith('@g.us')) {
    return {
      ignored: true,
      reason: 'IGNORED_GROUP_MESSAGE',
      remoteJid,
      fromMe: eventData?.key?.fromMe ?? eventData?.fromMe ?? false,
      deviceType: eventData?.source || eventData?.device || 'unknown',
      rawPayload: eventData,
    };
  }

  const normalizedData = createWhatsAppNormalizedMessage(payload);

  if (!normalizedData.remoteJid || !normalizedData.messageId) {
    return null;
  }

  if (!normalizedData.messageType && normalizedData.messageBody) {
    normalizedData.messageType = 'text';
  }

  return normalizedData;
}

function normalizePayload(req, res) {
  const incomingPayload = req.body;
  const payload = resolveIncomingPayload(incomingPayload);

  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Payload no válido para normalizar' });
  }

  const normalizedData = processIncomingWebhook(payload);

  if (!normalizedData) {
    return res.status(400).json({ error: 'Payload no válido para normalizar' });
  }

  if (normalizedData.ignored) {
    return res.status(200).json({
      status: normalizedData.reason,
      ignored: true,
    });
  }

  return res.status(200).json({
    status: 'NORMALIZED',
    data: normalizedData,
  });
}

function resolveIncomingPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return null;
    }
    return resolveIncomingPayload(payload[0]);
  }

  if (payload.body && typeof payload.body === 'object' && !payload.data && !payload.key && !payload.message) {
    return resolveIncomingPayload(payload.body);
  }

  if (payload.data && typeof payload.data === 'object') {
    return payload;
  }

  return payload;
}

module.exports = {
  processIncomingWebhook,
  extractAndNormalizeMessage,
  normalizePayload,
  resolveIncomingPayload,
};
