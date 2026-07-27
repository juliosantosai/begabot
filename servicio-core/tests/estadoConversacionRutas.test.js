const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
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

test('POST bloqueo true crea o bloquea el estado sin body', async () => {
  const app = crearAplicacion({ prisma: {} });
  const response = await request(app, 'POST', '/core/estado-conversacion/uuid-bloquear/bloqueo?bloqueado=true&jid=jid-x&sender=sender-x');

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.uuid, 'uuid-bloquear');
  assert.equal(payload.jid, 'jid-x');
  assert.equal(payload.sender, 'sender-x');
  assert.equal(payload.bloqueado, true);
  assert.equal(payload.numero, 1);
});

test('POST bloqueo false desbloquea sin reiniciar numero usando solo uuid', async () => {
  const app = crearAplicacion({ prisma: {} });

  await request(app, 'POST', '/core/estado-conversacion/uuid-unblock/bloqueo?bloqueado=true&jid=jid-y&sender=sender-y');
  const response = await request(app, 'POST', '/core/estado-conversacion/uuid-unblock/bloqueo?bloqueado=false');

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.uuid, 'uuid-unblock');
  assert.equal(payload.bloqueado, false);
  assert.equal(payload.numero, 1);
});

test('POST bloqueo reset=true desbloquea y reinicia numero a 1 usando solo uuid', async () => {
  const app = crearAplicacion({ prisma: {} });

  await request(app, 'POST', '/core/estado-conversacion/uuid-reset/bloqueo?bloqueado=true&jid=jid-z&sender=sender-z');
  const response = await request(app, 'POST', '/core/estado-conversacion/uuid-reset/bloqueo?reset=true');

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.uuid, 'uuid-reset');
  assert.equal(payload.bloqueado, false);
  assert.equal(payload.numero, 1);
});


test('GET sin-incrementar devuelve el estado sin modificar numero', async () => {
  const app = crearAplicacion({ prisma: {} });

  await request(app, 'GET', '/core/estado-conversacion?jid=jid-a&sender=sender-a');
  const response = await request(app, 'GET', '/core/estado-conversacion/sin-incrementar?jid=jid-a&sender=sender-a');

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.jid, 'jid-a');
  assert.equal(payload.sender, 'sender-a');
  assert.equal(payload.numero, 1);
});
