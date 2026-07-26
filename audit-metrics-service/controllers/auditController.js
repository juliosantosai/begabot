/**
 * Controlador de Auditoría y Métricas - BegaBot 3.0
 */

async function registerMetric(req, res) {
  try {
    const { tenantId, remoteJid, model, latencyMs, tokensUsed, promptVersion } = req.body;

    const auditLog = {
      timestamp: new Date().toISOString(),
      tenantId: tenantId || 'default',
      remoteJid,
      model: model || 'gemini-2.5-flash',
      latencyMs: latencyMs || 0,
      tokensUsed: tokensUsed || 0,
      promptVersion: promptVersion || 'v1.0',
    };

    // En producción esto debe guardarse asíncronamente en la base de datos o sistema de métricas.
    console.log('[AUDIT METRICS LOGGED]:', JSON.stringify(auditLog));

    return res.status(202).json({ success: true, message: 'Métrica registrada asíncronamente' });
  } catch (error) {
    console.error('Error registrando métrica de auditoría:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { registerMetric };
