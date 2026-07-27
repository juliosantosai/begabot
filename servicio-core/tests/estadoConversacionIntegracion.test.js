const test = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const EstadoConversacion = require('../src/dominio/estadoConversacion/estadoConversacion');
const PrismaEstadoConversacionRepositorio = require('../src/infraestructura/repositorios/prismaEstadoConversacionRepositorio');
const { crearAplicacion } = require('../src/interfaz/http/app');
const http = require('node:http');

const prisma = new PrismaClient();
const repo = new PrismaEstadoConversacionRepositorio(prisma);

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
          res.on('data', (chunk) => {
            body += chunk;
          });
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

async function limpiarTabla() {
  await prisma.estadoConversacion.deleteMany();
}

test.before(async () => {
  await limpiarTabla();
});

test.after(async () => {
  await limpiarTabla();
  await prisma.$disconnect();
});

test('guardar crea un registro y lo puede leer por jid y sender', async () => {
  const estado = new EstadoConversacion({ uuid: 'test-uuid-1', jid: 'jid-db-1', sender: 'sender-db-1', bloqueado: false, contexto: { paso: 1 }, numero: 2 });
  await repo.guardar(estado);

  const encontrado = await repo.obtenerPorJidYSender('jid-db-1', 'sender-db-1');
  assert.equal(encontrado.uuid, 'test-uuid-1');
  assert.equal(encontrado.sender, 'sender-db-1');
  assert.deepEqual(encontrado.contexto, { paso: 1 });
});

test('guardar actualiza el registro existente por jid y sender', async () => {
  const estado = new EstadoConversacion({ uuid: 'test-uuid-2', jid: 'jid-db-2', sender: 'sender-db-2', bloqueado: false, contexto: { paso: 1 }, numero: 1 });
  await repo.guardar(estado);

  estado.actualizarBloqueo(true);
  estado.incrementarNumero();
  estado.actualizarContexto({ paso: 2 });
  await repo.guardar(estado);

  const actualizado = await repo.obtenerPorJidYSender('jid-db-2', 'sender-db-2');
  assert.equal(actualizado.bloqueado, true);
  assert.equal(actualizado.numero, 2);
  assert.deepEqual(actualizado.contexto, { paso: 2 });
});

test('obtenerPorUuid devuelve el estado correcto', async () => {
  const estado = new EstadoConversacion({ uuid: 'test-uuid-3', jid: 'jid-db-3', sender: 'sender-db-3', bloqueado: false, contexto: { paso: 1 }, numero: 1 });
  await repo.guardar(estado);

  const encontrado = await repo.obtenerPorUuid('test-uuid-3');
  assert.equal(encontrado.jid, 'jid-db-3');
  assert.equal(encontrado.sender, 'sender-db-3');
});

test('guardar actualiza el registro existente por jid y sender y mantiene el uuid original', async () => {
  const estado1 = new EstadoConversacion({ uuid: 'test-uuid-4', jid: 'jid-db-4', sender: 'sender-db-4', bloqueado: false, contexto: {}, numero: 1 });
  const estado2 = new EstadoConversacion({ uuid: 'test-uuid-4b', jid: 'jid-db-4', sender: 'sender-db-4', bloqueado: true, contexto: {}, numero: 2 });

  await repo.guardar(estado1);
  await repo.guardar(estado2);

  const encontrado = await repo.obtenerPorJidYSender('jid-db-4', 'sender-db-4');
  assert.equal(encontrado.uuid, 'test-uuid-4');
  assert.equal(encontrado.bloqueado, true);
  assert.equal(encontrado.numero, 2);

  const rows = await prisma.estadoConversacion.findMany({ where: { jid: 'jid-db-4', sender: 'sender-db-4' } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].uuid, 'test-uuid-4');
});

test('GET /core/estado-conversacion usa el repositorio Prisma real', async () => {
  const app = crearAplicacion({ prisma });

  const response = await request(app, 'GET', '/core/estado-conversacion?jid=jid-db-route&sender=sender-db-route');
  assert.equal(response.statusCode, 200);

  const payload = JSON.parse(response.body);
  assert.equal(payload.jid, 'jid-db-route');
  assert.equal(payload.sender, 'sender-db-route');
  assert.equal(payload.numero, 1);

  const response2 = await request(app, 'GET', '/core/estado-conversacion?jid=jid-db-route&sender=sender-db-route');
  assert.equal(response2.statusCode, 200);
  const payload2 = JSON.parse(response2.body);
  assert.equal(payload2.numero, 2);
});
