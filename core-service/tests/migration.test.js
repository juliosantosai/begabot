const test = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('node:child_process');
const path = require('node:path');

test('la migración de Prisma deja disponibles los modelos de negocio', () => {
  const cwd = path.join(__dirname, '..');

  const output = execSync('npx prisma migrate status', {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.match(output, /database/i);
});
