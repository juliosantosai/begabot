const express = require('express');
require('dotenv').config();
const { dispatchMessage } = require('./controllers/dispatcherController');

const app = express();
app.use(express.json({ limit: '100kb' }));

app.post('/dispatch', dispatchMessage);
app.get('/', (_req, res) => res.status(200).json({ status: 'dispatcher-service online' }));
app.get('/health', (_req, res) => res.status(200).json({ status: 'dispatcher-service healthy' }));

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log(`dispatcher-service activo en el puerto ${PORT}`);
});
