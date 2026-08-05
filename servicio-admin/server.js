const dotenv = require('dotenv');
const { createAdminApp } = require('./src/app');

dotenv.config();

const port = process.env.PORT || 3004;
const app = createAdminApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`servicio-admin listening on port ${port}`);
});
