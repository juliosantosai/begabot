require('dotenv').config();
const app = require('./ai-gemini-agent');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 Servidor arrancado en el puerto ${PORT}`);
});
