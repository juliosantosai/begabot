const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

// Tarea periódica cada minuto para verificar estados o limpiezas
setInterval(() => {
  console.log('[SCHEDULER TICK]: Verificando pausas expiradas y tareas de mantenimiento programadas...');
  // Aquí se podrían invocar endpoints internos (core-service) o ejecutar scripts de limpieza.
}, 60000);

app.get('/', (_req, res) => res.status(200).json({ status: 'scheduler-service online' }));
app.get('/health', (_req, res) => res.status(200).json({ status: 'scheduler-service healthy' }));

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`scheduler-service activo en el puerto ${PORT}`);
});
