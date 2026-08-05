const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { PrismaClient } = require('@prisma/client');
const { crearAplicacion } = require('../src/interfaz/http/app');

function request(app, method, path) {
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
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            server.close(() => {
              resolve({ statusCode: res.statusCode, body, headers: res.headers });
            });
          });
        },
      );

      req.on('error', (error) => {
        server.close(() => reject(error));
      });

      req.end();
    });
  });
}

test('E2E: /core/tenants/:tenantId/estados filtra estados por tenant', async () => {
  const prisma = new PrismaClient();
  const tenantA = `tenant-a-${Date.now()}`;
  const tenantB = `tenant-b-${Date.now()}`;

  await prisma.estadoConversacion.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => null);
  await prisma.estadoConversacion.create({
    data: {
      tenantId: tenantA,
      jid: 'jid-a-1',
      sender: 'sender-a-1',
      contexto: { flujo: 'tenant-a' },
      numero: 1,
    },
  });
  await prisma.estadoConversacion.create({
    data: {
      tenantId: tenantA,
      jid: 'jid-a-2',
      sender: 'sender-a-2',
      contexto: { flujo: 'tenant-a-2' },
      numero: 1,
    },
  });
  await prisma.estadoConversacion.create({
    data: {
      tenantId: tenantB,
      jid: 'jid-b-1',
      sender: 'sender-b-1',
      contexto: { flujo: 'tenant-b' },
      numero: 1,
    },
  });

  const app = crearAplicacion({ prisma });

  const responseA = await request(app, 'GET', `/core/tenants/${tenantA}/estados`);
  assert.equal(responseA.statusCode, 200);
  const payloadA = JSON.parse(responseA.body);
  assert.equal(payloadA.success, true);
  assert.equal(payloadA.data.length, 2);
  assert.ok(payloadA.data.some((item) => item.sender === 'sender-a-1'));
  assert.ok(payloadA.data.some((item) => item.sender === 'sender-a-2'));

  const responseB = await request(app, 'GET', `/core/tenants/${tenantB}/estados`);
  assert.equal(responseB.statusCode, 200);
  const payloadB = JSON.parse(responseB.body);
  assert.equal(payloadB.success, true);
  assert.equal(payloadB.data.length, 1);
  assert.equal(payloadB.data[0].sender, 'sender-b-1');

  await prisma.$disconnect();
});
