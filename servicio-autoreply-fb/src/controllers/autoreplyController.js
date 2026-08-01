const { normalizeAutoreplyPayload, buildAutoreplyResponse } = require('../services/autoreplyService');
const {
  getConversationMemory,
  saveConversationMemory,
  mergeConversationContext,
} = require('../services/conversationMemoryService');
const { createLogger } = require('../services/logger');

const logger = createLogger('autoreply-controller');

async function handleAutoreply(req, res) {
  try {
    const normalizedPayload = normalizeAutoreplyPayload(req.body);
    const sender = normalizedPayload.contact.sender;
    const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId || normalizedPayload?.context?.tenantId || 'default';
    const traceId = normalizedPayload?.contact?.sender || req.headers['x-trace-id'] || `sender-${Date.now()}`;
    logger.info('webhook received', { traceId, sender, tenantId, source: normalizedPayload.source });

    const previousContext = await getConversationMemory(sender, tenantId);

    const memoryContext = mergeConversationContext(previousContext, {
      sender,
      message: normalizedPayload.message.text,
      detectedPhone: normalizedPayload.context.detectedPhone,
      timestamp: new Date().toISOString(),
      metadata: {
        source: normalizedPayload.source,
        isGroup: normalizedPayload.message.isGroup,
      },
    });

    await saveConversationMemory(sender, memoryContext, 3600, tenantId);

    const businessResult = {
      response: 'Gracias por contactarnos. Estamos revisando tu solicitud.',
      title: 'Solicitud recibida',
      personality: 'Asistente comercial',
      sendWhatsapp: Boolean(normalizedPayload.context.detectedPhone),
      memory: memoryContext,
    };

    const response = buildAutoreplyResponse(normalizedPayload, businessResult);
    logger.info('webhook processed', { traceId: sender, sender, responseSent: Boolean(response) });
    res.status(200).json(response);
  } catch (error) {
    logger.error('webhook processing failed', { traceId: req.headers['x-trace-id'] || 'unknown', error: error.message });
    res.status(400).json({
      error: 'payload_invalido',
      message: error.message,
    });
  }
}

async function getMemory(req, res) {
  try {
    const sender = req.query.sender;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId || 'default';
    if (!sender) {
      return res.status(400).json({ error: 'sender_required' });
    }

    const memory = await getConversationMemory(sender, tenantId);
    if (!memory) {
      return res.status(404).json({ error: 'memory_not_found' });
    }

    res.status(200).json({ memory });
  } catch (error) {
    res.status(500).json({ error: 'memory_fetch_error', message: error.message });
  }
}

function previewTransform(req, res) {
  try {
    const normalizedPayload = normalizeAutoreplyPayload(req.body || {});
    res.status(200).json({ normalized: normalizedPayload });
  } catch (error) {
    res.status(400).json({ error: 'payload_invalido', message: error.message });
  }
}

module.exports = {
  handleAutoreply,
  previewTransform,
  getMemory,
};
