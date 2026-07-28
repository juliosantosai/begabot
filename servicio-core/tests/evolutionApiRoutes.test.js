const test = require('node:test');
const assert = require('node:assert/strict');
const { crearAplicacion } = require('../src/interfaz/http/app');

function request(app, method, path) {
  return new Promise((resolve, reject) => {
    const http = require('node:http');
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

test('GET /core/evolution-api/configuraciones devuelve todas las instancias', async () => {
  const repo = {
    listarTodos: async () => [
      {
        id: 'inst-1',
        sender: 'bot',
        serverUrl: 'https://evolution.example.com',
        apiKey: 'abc123',
        instancia: 'mi-instancia',
        negocioNombre: 'Mi Negocio',
        activo: true,
      },
    ],
  };

  const app = crearAplicacion({ evolutionApiRepositorio: repo });
  const response = await request(app, 'GET', '/core/evolution-api/configuraciones');

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].sender, 'bot');
  assert.equal(payload.data[0].configuracionHttp.method, 'POST');
  assert.equal(payload.data[0].configuracionHttp.url, 'https://evolution.example.com/message/sendText/mi-instancia');
});
