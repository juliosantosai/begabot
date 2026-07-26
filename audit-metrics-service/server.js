const express = require('express');
require('dotenv').config();
const { registerMetric } = require('./controllers/auditController');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post('/audit/metrics', registerMetric);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`audit-metrics-service activo en el puerto ${PORT}`);
});
