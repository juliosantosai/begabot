const { normalizeAutoreplyPayload, buildAutoreplyResponse } = require('../services/autoreplyService');
const {
  getConversationMemory,
  saveConversationMemory,
  mergeConversationContext,
} = require('../services/conversationMemoryService');

async function handleAutoreply(req, res) {
  try {
    const normalizedPayload = normalizeAutoreplyPayload(req.body);
    const sender = normalizedPayload.contact.sender;
    const previousContext = await getConversationMemory(sender);

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

    await saveConversationMemory(sender, memoryContext);

    const businessResult = {
      response: 'Gracias por contactarnos. Estamos revisando tu solicitud.',
      title: 'Solicitud recibida',
      personality: 'Asistente comercial',
      sendWhatsapp: Boolean(normalizedPayload.context.detectedPhone),
      memory: memoryContext,
    };

    const response = buildAutoreplyResponse(normalizedPayload, businessResult);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({
      error: 'payload_invalido',
      message: error.message,
    });
  }
}

async function getMemory(req, res) {
  try {
    const sender = req.query.sender;
    if (!sender) {
      return res.status(400).json({ error: 'sender_required' });
    }

    const memory = await getConversationMemory(sender);
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
