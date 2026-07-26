const test = require('node:test');
const assert = require('node:assert/strict');

const RegistrarInstanciaEvolutionApi = require('../src/aplicacion/casos-de-uso/registrarInstanciaEvolutionApi');
const ConsultarInstanciaEvolutionApi = require('../src/aplicacion/casos-de-uso/consultarInstanciaEvolutionApi');

test('debe crear una configuración de Evolution API con datos de conexión y configuración HTTP', async () => {
  const registros = [];
  const repositorio = {
    buscarPorSender: async () => null,
    guardar: async (config) => {
      registros.push(config);
      return config;
    },
  };

  const caso = new RegistrarInstanciaEvolutionApi({ instanciaRepositorio: repositorio });
  const resultado = await caso.ejecutar({
    sender: 'bot',
    serverUrl: 'https://evolution.example.com',
    apiKey: 'abc123',
    instancia: 'mi-instancia',
    negocioNombre: 'Mi Negocio',
    activo: true,
  });

  assert.equal(resultado.sender, 'bot');
  assert.equal(resultado.negocioNombre, 'Mi Negocio');
  assert.equal(resultado.activo, true);
  assert.equal(resultado.configuracionHttp.method, 'POST');
  assert.equal(resultado.configuracionHttp.url, 'https://evolution.example.com/message/sendText/mi-instancia');
  assert.equal(registros.length, 1);
});

test('debe consultar una configuración existente y devolver la configuración HTTP', async () => {
  const repositorio = {
    buscarPorSender: async () => ({
      ownerJid: '5491112345678',
      sender: 'bot',
      serverUrl: 'https://evolution.example.com',
      apiKey: 'abc123',
      instancia: 'mi-instancia',
      negocioNombre: 'Mi Negocio',
      activo: true,
    }),
  };

  const caso = new ConsultarInstanciaEvolutionApi({ instanciaRepositorio: repositorio });
  const resultado = await caso.ejecutar('bot');

  assert.equal(resultado.sender, 'bot');
  assert.equal(resultado.configuracionHttp.method, 'POST');
  assert.equal(resultado.configuracionHttp.headers['apikey'], 'abc123');
  assert.equal(resultado.configuracionHttp.body.number, 'bot');
});
