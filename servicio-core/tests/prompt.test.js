const test = require('node:test');
const assert = require('node:assert/strict');

const RegistrarPrompt = require('../src/aplicacion/casos-de-uso/registrarPrompt');
const ConsultarPrompt = require('../src/aplicacion/casos-de-uso/consultarPrompt');

test('debe crear un nuevo prompt para un sender', async () => {
  let guardado = null;
  const repositorio = {
    buscarPorSenderYTenant: async () => null,
    guardarConVersion: async (data, tenantId) => {
      guardado = { ...data, tenantId };
      return guardado;
    },
  };

  const caso = new RegistrarPrompt({ promptRepositorio: repositorio });
  const resultado = await caso.ejecutar({ sender: 'empresa123', prompt: 'Texto de prompt inicial', tenantId: 'default-tenant' });

  assert.equal(resultado.sender, 'empresa123');
  assert.equal(resultado.prompt, 'Texto de prompt inicial');
  assert.ok(resultado.creadoEn instanceof Date);
  assert.ok(resultado.actualizadoEn instanceof Date);
  assert.equal(guardado.sender, 'empresa123');
  assert.equal(guardado.prompt, 'Texto de prompt inicial');
  assert.ok(guardado.creadoEn instanceof Date);
  assert.ok(guardado.actualizadoEn instanceof Date);
});

test('debe actualizar el prompt existente para un sender', async () => {
  let guardado = null;
  const existente = {
    id: 'id-1',
    sender: 'empresa123',
    prompt: 'Prompt antiguo',
    creadoEn: new Date('2026-01-01T00:00:00.000Z'),
    actualizadoEn: new Date('2026-01-01T00:00:00.000Z'),
  };

  const repositorio = {
    buscarPorSenderYTenant: async () => existente,
    guardar: async (prompt) => {
      guardado = prompt;
      return prompt;
    },
    guardarConVersion: async (data, tenantId) => {
      guardado = { ...data, tenantId };
      return guardado;
    },
  };

  const caso = new RegistrarPrompt({ promptRepositorio: repositorio });
  const resultado = await caso.ejecutar({ sender: 'empresa123', prompt: 'Prompt actualizado', tenantId: 'default-tenant' });

  assert.equal(resultado.sender, 'empresa123');
  assert.equal(resultado.prompt, 'Prompt actualizado');
  assert.equal(resultado.id, 'id-1');
  assert.ok(resultado.creadoEn instanceof Date);
  assert.ok(resultado.actualizadoEn instanceof Date);
  assert.equal(guardado.prompt, 'Prompt actualizado');
  assert.ok(guardado.creadoEn instanceof Date);
  assert.ok(guardado.actualizadoEn instanceof Date);
});

test('debe consultar un prompt existente por sender', async () => {
  const repositorio = {
    buscarPorSenderYTenant: async () => ({
      id: 'id-2',
      sender: 'empresa123',
      prompt: 'Prompt consultado',
      creadoEn: new Date('2026-07-27T00:00:00.000Z'),
      actualizadoEn: new Date('2026-07-27T00:00:00.000Z'),
    }),
  };

  const caso = new ConsultarPrompt({ promptRepositorio: repositorio });
  const resultado = await caso.ejecutar('empresa123', 'default-tenant');

  assert.equal(resultado.sender, 'empresa123');
  assert.equal(resultado.prompt, 'Prompt consultado');
});

test('debe fallar al consultar un prompt inexistente', async () => {
  const repositorio = {
    buscarPorSenderYTenant: async () => null,
  };

  const caso = new ConsultarPrompt({ promptRepositorio: repositorio });
  await assert.rejects(async () => {
    await caso.ejecutar('empresa123', 'default-tenant');
  }, {
    message: 'No existe prompt para el sender proporcionado',
  });
});
