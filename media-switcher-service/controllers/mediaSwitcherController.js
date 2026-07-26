const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function processMediaMessage(req, res) {
  try {
    const payload = req.body;
    const messageType = payload?.messageType || payload?.type || 'conversation';
    const remoteJid = payload?.key?.remoteJid || payload?.from || null;

    let normalizedText = '';

    if (messageType === 'audioMessage' || messageType === 'pttMessage') {
      // Nota: en producción deberías descargar el binario de audio y enviarlo a la API de transcripción.
      // Aquí devolvemos un placeholder o una llamada a Gemini si se configura.
      normalizedText = '[Nota de voz transcrita automáticamente]';
    } else if (messageType === 'locationMessage') {
      const lat = payload?.message?.locationMessage?.degreesLatitude || payload?.message?.location?.latitude || 0;
      const lng = payload?.message?.locationMessage?.degreesLongitude || payload?.message?.location?.longitude || 0;
      normalizedText = `[Ubicación compartida del usuario: Lat ${lat}, Lng ${lng}]`;
    } else {
      normalizedText = payload?.message?.conversation || payload?.message?.extendedTextMessage?.text || payload?.body || '';
    }

    return res.status(200).json({
      success: true,
      remoteJid,
      messageType,
      processedText: normalizedText,
      timestamp: Date.now(),
      raw: payload,
    });

  } catch (error) {
    console.error('Error en media-switcher-service:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { processMediaMessage };
