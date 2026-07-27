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

  function normalizarString(valor) {
    if (valor === undefined || valor === null) return undefined;
    if (typeof valor === 'string') return valor;
    if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
    if (typeof valor === 'object') {
      try {
        return JSON.stringify(valor);
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }

  function extraerCargaUtil(c) {
    if (!c) return { remoteJid: undefined, messageBody: undefined, sender: undefined };

    const sender = normalizarString(c.sender || (c.body && c.body.sender));
    const remoteJid = normalizarString(c.jid || c.remoteJid || (c.body && c.body.remoteJid));
    let messageBody = normalizarString(c.text || c.messageBody);

    if (!messageBody && c.body) {
      if (typeof c.body === 'string' || typeof c.body === 'number' || typeof c.body === 'boolean') {
        messageBody = normalizarString(c.body);
      } else {
        messageBody = normalizarString(c.body.conversation)
          || normalizarString(c.body.text)
          || normalizarString(c.body.message)
          || normalizarString(c.body.body);
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
