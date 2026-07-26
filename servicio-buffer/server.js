require('dotenv').config();
const express = require('express');
const rutaBuffer = require('./routes/rutaBuffer');

const app = express();
app.use(express.json());

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
});
