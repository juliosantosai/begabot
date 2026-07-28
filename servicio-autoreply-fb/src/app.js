const express = require('express');
const { handleAutoreply, previewTransform, getMemory } = require('./controllers/autoreplyController');

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/webhook/autoreply', handleAutoreply);
app.get('/debug/memory', getMemory);
app.post('/internal/transform', previewTransform);

app.get('/', (_req, res) => {
  res.status(200).json({ service: 'servicio-autoreply-fb', status: 'online' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'endpoint_no_encontrado' });
});

module.exports = app;
