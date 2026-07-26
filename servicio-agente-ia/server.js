require('dotenv').config();
const aplicacion = require('./ai-gemini-agent');

const puerto = process.env.PORT || 3003;

aplicacion.listen(puerto, () => {
  console.log(`🚀 Servidor arrancado en el puerto ${puerto}`);
});
