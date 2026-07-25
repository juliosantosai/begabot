require('dotenv').config();
const express = require('express');
const bufferRoute = require('./routes/bufferRoute');

const app = express();
app.use(express.json());

app.use('/api/buffer', bufferRoute);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const port = parseInt(process.env.PORT, 10) || 3000;
app.listen(port, () => {
});
