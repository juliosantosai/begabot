const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { PrismaClient } = require('@prisma/client');
const { crearAplicacion } = require('../src/interfaz/http/app');

function request(app, method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        },
        (res) => {
          let bodyData = '';
          res.on('data', (chunk) => { bodyData += chunk; });
          res.on('end', () => {
            server.close(() => {
              resolve({ statusCode: res.statusCode, body: bodyData, headers: res.headers });
            });
          });
        },
      );

      req.on('error', (error) => {
        server.close(() => reject(error));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

test('E2E: tenant prompt versioning and rollback isolates prompts by tenant', async () => {
  const prisma = new PrismaClient();
  const tenantA = `tenant-a-${Date.now()}`;
  const tenantB = `tenant-b-${Date.now()}`;
  const sender = `sender-${Date.now()}`;

  await prisma.prompt.deleteMany({ where: { sender } });

  const app = crearAplicacion({ prisma });

  const resp1 = await request(app, 'POST', `/core/tenants/${tenantA}/prompts`, { sender, prompt: 'prompt a v1' });
  assert.equal(resp1.statusCode, 201);
  const data1 = JSON.parse(resp1.body).data;
  assert.equal(data1.version, 1);
  assert.equal(data1.tenantId, tenantA);
  assert.equal(data1.prompt, 'prompt a v1');

  const resp2 = await request(app, 'POST', `/core/tenants/${tenantA}/prompts`, { sender, prompt: 'prompt a v2' });
  assert.equal(resp2.statusCode, 201);
  const data2 = JSON.parse(resp2.body).data;
  assert.equal(data2.version, 2);
  assert.equal(data2.isActive, true);

  const resp3 = await request(app, 'POST', `/core/tenants/${tenantB}/prompts`, { sender, prompt: 'prompt b v1' });
  assert.equal(resp3.statusCode, 201);
  const data3 = JSON.parse(resp3.body).data;
  assert.equal(data3.version, 1);
  assert.equal(data3.tenantId, tenantB);

  const listA = await request(app, 'GET', `/core/tenants/${tenantA}/prompts`);
  assert.equal(listA.statusCode, 200);
  const promptsA = JSON.parse(listA.body).data;
  assert.equal(promptsA.length, 1);
  assert.equal(promptsA[0].tenantId, tenantA);
  assert.equal(promptsA[0].version, 2);
  assert.equal(promptsA[0].isActive, true);

  const rollbackResp = await request(app, 'POST', `/core/tenants/${tenantA}/prompts/${sender}/rollback`, { version: 1 });
  assert.equal(rollbackResp.statusCode, 200);
  const rollbackData = JSON.parse(rollbackResp.body).data;
  assert.equal(rollbackData.version, 1);
  assert.equal(rollbackData.isActive, true);

  const activeA = await prisma.prompt.findFirst({ where: { tenantId: tenantA, sender, isActive: true } });
  assert.ok(activeA);
  assert.equal(activeA.version, 1);

  const activeB = await prisma.prompt.findFirst({ where: { tenantId: tenantB, sender, isActive: true } });
  assert.ok(activeB);
  assert.equal(activeB.version, 1);

  await prisma.$disconnect();
});
