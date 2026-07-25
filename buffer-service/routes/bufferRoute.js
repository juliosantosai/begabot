const express = require('express');
const { accumulateMessageInBuffer } = require('../controllers/messageBufferController');

const router = express.Router();

router.post('/', async (req, res) => {
  const payload = req.body || {};
  function extractPayload(p) {
    if (!p) return { remoteJid: undefined, messageBody: undefined };
    if (p.remoteJid || p.messageBody) return { remoteJid: p.remoteJid, messageBody: p.messageBody };
    const inner = p.body || p;
    const remoteJid = (inner.data && inner.data.key && inner.data.key.remoteJid) || inner.instance || inner.remoteJid || (inner.data && inner.data.instance);

    let messageBody;
    if (inner.data) {
      // Prefer common conversation text fields
      if (inner.data.conversation) messageBody = inner.data.conversation;
      else if (inner.data.key && inner.data.key.texto) messageBody = inner.data.key.texto;
      else if (inner.data.message) messageBody = inner.data.message;
      else if (inner.data.body) messageBody = inner.data.body;
      else if (inner.data.key && inner.data.key.remoteJid) messageBody = JSON.stringify(inner.data.key);
      else messageBody = JSON.stringify(inner.data);
    } else {
      messageBody = inner.messageBody || inner.body || undefined;
    }

    return { remoteJid, messageBody };
  }

  const { remoteJid, messageBody } = extractPayload(payload);
  

  if (!remoteJid || !messageBody) {
    return res.status(400).json({
      error: 'Se requieren remoteJid y messageBody en el body'
    });
  }

  const bufferResult = await accumulateMessageInBuffer(remoteJid, messageBody);

  return res.status(200).json({
    status: 'BUFFER_UPDATED',
    data: {
      remoteJid,
      accumulatedText: bufferResult.accumulatedText,
      windowMs: bufferResult.bufferTimeMs,
      isFirst: bufferResult.isFirst
    }
  });
});

module.exports = router;
