const test = require('node:test');
const assert = require('node:assert/strict');

const EnviarMensajeEvolutionApi = require('../src/aplicacion/casos-de-uso/enviarMensajeEvolutionApi');

test('debe enviar un mensaje usando la configuración de Evolution API', async () => {
  const requests = [];
  const repositorio = {
    buscarPorSender: async () => ({
      sender: 'bot',
      serverUrl: 'https://example.com',
      apiKey: 'secret',
      instancia: 'mi-instancia',
    }),
  };

  const httpClient = {
    enviar: async (request) => {
      requests.push(request);
      return { ok: true, status: 200 };
    },
  };

  const caso = new EnviarMensajeEvolutionApi({
    evolutionApiRepositorio: repositorio,
    httpClient,
  });

  const resultado = await caso.ejecutar({
    sender: 'bot',
    texto: 'Hola desde el core',
    destino: '549999999999',
  });

  assert.equal(resultado.ok, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].headers.apikey, 'secret');
  assert.equal(requests[0].body.number, '549999999999');
  assert.equal(requests[0].body.text, 'Hola desde el core');
});
