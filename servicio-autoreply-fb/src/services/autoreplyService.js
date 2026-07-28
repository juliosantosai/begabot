function extractPhoneCandidates(message) {
  if (!message) return [];

  const matches = message.match(/\+?\d[\d\s().-]{6,}/g) || [];
  return matches.map((value) => value.replace(/[^0-9+]/g, '').replace(/^\+/, ''));
}

function normalizePhone(value) {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return digits.startsWith('54') ? `+${digits}` : `+${digits}`;
}

function normalizeAutoreplyPayload(payload) {
  const query = payload?.query || {};
  const messageText = query.message || '';
  const phoneCandidates = extractPhoneCandidates(messageText);
  const detectedPhone = phoneCandidates.length > 0
    ? normalizePhone(phoneCandidates[0])
    : null;

  return {
    source: 'autoreply',
    channel: 'whatsapp',
    externalReference: {
      appPackageName: payload?.appPackageName || null,
      messengerPackageName: payload?.messengerPackageName || null,
      ruleId: query.ruleId || null,
      isTestMessage: Boolean(query.isTestMessage),
    },
    contact: {
      name: query.sender || 'Sin nombre',
      sender: query.sender || 'Sin nombre',
    },
    message: {
      text: messageText,
      isGroup: Boolean(query.isGroup),
      groupParticipant: query.groupParticipant || '',
    },
    context: {
      detectedPhone,
      phoneCandidates,
    },
  };
}

function buildAutoreplyResponse(normalizedPayload, businessResult = {}) {
  const responseText = businessResult?.response || 'Gracias por contactarnos. Hemos recibido tu mensaje y lo estamos procesando.';
  const sender = normalizedPayload?.contact?.name || 'Sin nombre';
  const detectedPhone = normalizedPayload?.context?.detectedPhone || null;

  return {
    response: responseText,
    sender,
    titulo: businessResult?.title || 'Mensaje recibido',
    personalidad: businessResult?.personality || 'Asistente comercial',
    enviarWhatsapp: Boolean(detectedPhone && businessResult?.sendWhatsapp),
    whatsappSender: detectedPhone,
    history: businessResult?.memory?.history || [],
    data: {
      rawMessage: normalizedPayload?.message?.text || '',
      phoneDetected: Boolean(detectedPhone),
      ruleId: normalizedPayload?.externalReference?.ruleId || null,
      isGroup: normalizedPayload?.message?.isGroup || false,
      processedBy: 'autoreply-adapter',
    },
  };
}

module.exports = {
  normalizeAutoreplyPayload,
  buildAutoreplyResponse,
};
