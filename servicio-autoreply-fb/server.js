require('dotenv').config();
const app = require('./src/app');

const port = parseInt(process.env.PORT, 10) || 3004;
app.listen(port, () => {
  console.log(`[servicio-autoreply-fb] iniciado en el puerto ${port}`);
});
