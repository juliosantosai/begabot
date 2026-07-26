const express = require('express');
require('dotenv').config();
const { processMediaMessage } = require('./controllers/mediaSwitcherController');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'media-switcher-service online' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'media-switcher-service healthy' });
});

app.post('/switch-media', processMediaMessage);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`media-switcher-service activo en el puerto ${PORT}`);
});
