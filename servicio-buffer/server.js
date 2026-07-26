require('dotenv').config();
const express = require('express');
const rutaBuffer = require('./routes/rutaBuffer');

const app = express();
app.use(express.json());

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
