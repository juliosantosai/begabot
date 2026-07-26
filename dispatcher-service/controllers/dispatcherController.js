/**
 * Motor de Acciones y Envío de Mensajes - Dispatcher
 */

async function dispatchMessage(req, res) {
  try {
    const { remoteJid, messageText, instanceUrl, apiKey } = req.body;

    // Simulación: en producción hacemos POST a Evolution API con credenciales seguras
    console.log(`[DISPATCHER]: Enviando mensaje a ${remoteJid} -> "${messageText}"`);

    // Opcional: realizar llamada real si instanceUrl y apiKey están presentes
    if (instanceUrl && apiKey) {
      try {
        await fetch(instanceUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ to: remoteJid, message: messageText }),
        });
      } catch (err) {
        console.warn('Dispatcher: fallo en llamada externa, continuando (simulado).', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      dispatchedAt: new Date().toISOString(),
      recipient: remoteJid,
    });
  } catch (error) {
    console.error('Error al despachar mensaje:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { dispatchMessage };
