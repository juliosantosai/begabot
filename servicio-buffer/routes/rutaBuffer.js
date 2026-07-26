const express = require('express');
const { acumularMensajeEnBuffer } = require('../controllers/controladorBufferMensajes');

/**
 * Contrato del módulo de buffer.
 *
 * Endpoint:
 *   POST /api/buffer
 *
 * JSON esperado:
 * {
 *   "jid": "1234567890@whatsapp.net",
 *   "text": "hola"
 * }
 *
 * También se aceptan campos alternativos por compatibilidad:
 * - remoteJid + messageBody
 * - body con estructuras anidadas
 *
 * JSON de respuesta:
 * {
 *   "remoteJid": "1234567890@whatsapp.net",
 *   "accumulatedText": "hola",
 *   "windowMs": 5000,
 *   "isFirst": true
 * }
 */
const router = express.Router();

router.post('/', async (req, res) => {
  const carga = req.body || {};

  function extraerCargaUtil(c) {
    if (!c) return { remoteJid: undefined, messageBody: undefined };

    if (c.jid || c.text) {
      return {
        remoteJid: c.jid || c.remoteJid,
        messageBody: c.text || c.messageBody || c.body
      };
    }

    if (c.remoteJid || c.messageBody) {
      return { remoteJid: c.remoteJid, messageBody: c.messageBody || c.body };
    }

    const interno = c.body || c;
    const remoteJid = (interno.data && interno.data.key && interno.data.key.remoteJid) || interno.instance || interno.remoteJid || (interno.data && interno.data.instance);

    let messageBody;
    if (interno.data) {
      if (interno.data.conversation) messageBody = interno.data.conversation;
      else if (interno.data.key && interno.data.key.texto) messageBody = interno.data.key.texto;
      else if (interno.data.message) messageBody = interno.data.message;
      else if (interno.data.body) messageBody = interno.data.body;
      else if (interno.data.key && interno.data.key.remoteJid) messageBody = JSON.stringify(interno.data.key);
      else messageBody = JSON.stringify(interno.data);
    } else {
      messageBody = interno.messageBody || interno.body || interno.text || undefined;
    }

    return { remoteJid, messageBody };
  }

  const { remoteJid, messageBody } = extraerCargaUtil(carga);

  if (!remoteJid || !messageBody) {
    return res.status(400).json({
      error: 'Se requieren jid y text en el cuerpo'
    });
  }

  const resultadoBuffer = await acumularMensajeEnBuffer(remoteJid, messageBody);

  return res.status(200).json({
    remoteJid,
    accumulatedText: resultadoBuffer.accumulatedText,
    windowMs: resultadoBuffer.bufferTimeMs,
    isFirst: resultadoBuffer.isFirst
  });
});

module.exports = router;
