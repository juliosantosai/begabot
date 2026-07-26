const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const webhookRoutes = require('./routes/webhookRoutes');
const fetch = require('node-fetch');
const n8nAuth = require('./middleware/n8nAuth');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      req.body = JSON.parse(req.body);
    } catch (error) {
      // no es JSON válido, conservamos el cuerpo original
    }
  }
  next();
});

const env = process.env.NODE_ENV || 'production';
const appVersion = process.env.APP_VERSION || 'prod-1.0.0';

app.use(express.json());
app.get('/', (req, res) => {
  console.log('Solicitud GET recibida en /');
  res.status(200).json({
    status: 'ok',
    message: 'Webhook server is running',
    version: appVersion,
    environment: env,
  });
});
app.use('/webhook', webhookRoutes);

// Endpoint protegido para que n8n verifique o reenvíe eventos.
app.post('/n8n/forward', n8nAuth, async (req, res) => {
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) return res.status(500).json({ error: 'N8N_WEBHOOK_URL not configured' });

  try {
    await fetch(n8nUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
    return res.status(202).json({ status: 'forwarded' });
  } catch (error) {
    console.error('Error forwarding to n8n:', error.message);
    return res.status(502).json({ error: 'Failed to forward to n8n' });
  }
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
    console.log(`Versión de la app: ${appVersion}`);
    console.log(`Entorno: ${env}`);
  });
}

module.exports = app;
