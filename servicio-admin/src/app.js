const express = require('express');
const { createCoreApiClient } = require('./coreApiClient');

function createAdminApp() {
  const app = express();
  const client = createCoreApiClient();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'servicio-admin healthy', coreApiUrl: process.env.CORE_API_URL || 'not-configured' });
  });

  app.get('/admin/tenants/:tenantId/estados', async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { jid, sender } = req.query;
      const response = await client.getTenantStates(tenantId, { jid, sender });
      return res.status(200).json(response);
    } catch (error) {
      return res.status(502).json({ error: 'Error fetching core tenant states', detail: error.message });
    }
  });

  return app;
}

module.exports = { createAdminApp };
