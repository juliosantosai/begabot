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
    if (!c) return { remoteJid: undefined, messageBody: undefined, sender: undefined };

    const sender = c.sender || (c.body && c.body.sender) || undefined;
    const remoteJid = c.jid || c.remoteJid || (c.body && c.body.remoteJid) || undefined;
    let messageBody = c.text || c.messageBody || undefined;

    if (!messageBody && c.body) {
      if (typeof c.body === 'string') {
        messageBody = c.body;
      } else {
        messageBody = c.body.conversation || c.body.text || c.body.message || c.body.body || undefined;
      }
    }

    return { remoteJid, messageBody, sender };
  }

  const { remoteJid, messageBody, sender } = extraerCargaUtil(carga);

  if (!remoteJid || !messageBody || !sender) {
    return res.status(400).json({
      error: 'Se requieren jid, text y sender en el cuerpo'
    });
  }

  const resultadoBuffer = await acumularMensajeEnBuffer(remoteJid, messageBody, sender);

  return res.status(200).json({
    sender,
    remoteJid,
    accumulatedText: resultadoBuffer.accumulatedText,
    windowMs: resultadoBuffer.bufferTimeMs,
    isFirst: resultadoBuffer.isFirst
  });
});

module.exports = router;
