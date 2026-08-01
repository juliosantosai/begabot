const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { crearAplicacion } = require('../src/interfaz/http/app');
const EstadoConversacion = require('../src/dominio/estadoConversacion/estadoConversacion');

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
  const almacen = new Map();
  const repo = {
    obtenerPorUuid: async () => null,
    obtenerPorJidYSender: async () => null,
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(registro.uuid, registro);
      return registro;
    },
  };

  const app = crearAplicacion({ estadoConversacionRepositorio: repo });
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
  const almacen = new Map();
  const repo = {
    obtenerPorUuid: async (uuid) => {
      const record = almacen.get(uuid);
      return record ? new EstadoConversacion(record) : null;
    },
    obtenerPorJidYSender: async () => null,
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(registro.uuid, registro);
      return registro;
    },
  };

  const app = crearAplicacion({ estadoConversacionRepositorio: repo });

  await request(app, 'POST', '/core/estado-conversacion/uuid-unblock/bloqueo?bloqueado=true&jid=jid-y&sender=sender-y');
  const response = await request(app, 'POST', '/core/estado-conversacion/uuid-unblock/bloqueo?bloqueado=false');

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.uuid, 'uuid-unblock');
  assert.equal(payload.bloqueado, false);
  assert.equal(payload.numero, 1);
});

test('POST bloqueo reset=true desbloquea y reinicia numero a 1 usando solo uuid', async () => {
  const almacen = new Map();
  const repo = {
    obtenerPorUuid: async (uuid) => {
      const record = almacen.get(uuid);
      return record ? new EstadoConversacion(record) : null;
    },
    obtenerPorJidYSender: async () => null,
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(registro.uuid, registro);
      return registro;
    },
  };

  const app = crearAplicacion({ estadoConversacionRepositorio: repo });

  // Crear estado con bloqueo=true, numero=5, y contexto con datos
  await request(app, 'POST', '/core/estado-conversacion/uuid-reset/bloqueo?bloqueado=true&jid=jid-z&sender=sender-z');
  await request(app, 'POST', '/core/estado-conversacion/uuid-reset/contexto', {
    jid: 'jid-z',
    sender: 'sender-z',
    contexto: { ultimoMensaje: 'hola', contador: 5 },
  });

  // Incrementar numero manualmente para simular múltiples lecturas
  let estadoTemp = almacen.get('uuid-reset');
  estadoTemp.numero = 5;
  almacen.set('uuid-reset', estadoTemp);

  // Aplicar reset
  const response = await request(app, 'POST', '/core/estado-conversacion/uuid-reset/bloqueo?reset=true');

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.uuid, 'uuid-reset');
  assert.equal(payload.bloqueado, false);
  assert.equal(payload.numero, 1);
  assert.deepEqual(payload.contexto, {});
});

test('GET sin-incrementar devuelve el estado sin modificar numero', async () => {
  const almacen = new Map();
  const repo = {
    obtenerPorJidYSender: async () => null,
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(registro.uuid, registro);
      return registro;
    },
  };

  const app = crearAplicacion({ estadoConversacionRepositorio: repo });

  await request(app, 'GET', '/core/estado-conversacion?jid=jid-a&sender=sender-a');
  const response = await request(app, 'GET', '/core/estado-conversacion/sin-incrementar?jid=jid-a&sender=sender-a');

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.jid, 'jid-a');
  assert.equal(payload.sender, 'sender-a');
  assert.equal(payload.numero, 1);
  assert.equal(payload.conversationState, 'general');
  assert.equal(payload.conversationSummary, '');
  assert.deepEqual(payload.contexto, {});
});

test('GET estado-conversacion inicial agrega conversationState y conversationSummary', async () => {
  const almacen = new Map();
  const repo = {
    obtenerPorJidYSender: async () => null,
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(registro.uuid, registro);
      return registro;
    },
  };

  const app = crearAplicacion({ estadoConversacionRepositorio: repo });
  const response = await request(app, 'GET', '/core/estado-conversacion?jid=jid-b&sender=sender-b');

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.jid, 'jid-b');
  assert.equal(payload.sender, 'sender-b');
  assert.equal(payload.numero, 1);
  assert.equal(payload.conversationState, 'general');
  assert.equal(payload.conversationSummary, '');
  assert.deepEqual(payload.contexto, {});
});
