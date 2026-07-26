const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const envPath = path.join(__dirname, '..', '.env');

test('loads EVOLUTION_API_KEY from .env', () => {
  assert.ok(fs.existsSync(envPath), 'No se encontró el archivo .env');
  delete require.cache[require.resolve('../server')];
  delete process.env.EVOLUTION_API_KEY;
  require('../server');
  assert.equal(process.env.EVOLUTION_API_KEY, 'C72947216ABD-4957-B7E2-DA911A29D6DA');
});
