require('dotenv').config();
const express = require('express');
const bufferRoute = require('./routes/bufferRoute');

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'buffer-service online' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'buffer-service healthy' });
});

app.use('/api/buffer', bufferRoute);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const port = parseInt(process.env.PORT, 10) || 3000;
app.listen(port, () => {
});
