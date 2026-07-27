require('dotenv').config();
const express = require('express');
const rutaBuffer = require('./routes/rutaBuffer');

const app = express();
app.use(express.json());

// Middleware para loguear POSTs al buffer
app.post('/api/buffer', (req, res, next) => {
  console.log('[BUFFER - POST] Solicitud recibida:');
  console.log('[BUFFER - POST] Timestamp:', new Date().toISOString());
  console.log('[BUFFER - POST] Body:', JSON.stringify(req.body, null, 2));
  console.log('[BUFFER - POST] Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

/**
 * Contrato del servicio de buffer.
 *
 * Endpoint:
 *   POST /api/buffer
 *
 * Request body esperado:
 * {
 *   "jid": "1234567890@whatsapp.net",
 *   "text": "hola"
 * }
 *
 * Response body:
 * {
 *   "remoteJid": "1234567890@whatsapp.net",
 *   "accumulatedText": "hola",
 *   "windowMs": 5000,
 *   "isFirst": true
 * }
 */
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'servicio de buffer en línea' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'servicio de buffer saludable' });
});

app.use('/api/buffer', rutaBuffer);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

const puerto = parseInt(process.env.PORT, 10) || 3001;
app.listen(puerto, () => {
  console.log(`[servicio-buffer] Módulo iniciado en el puerto ${puerto}`);
});
