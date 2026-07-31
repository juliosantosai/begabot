const test = require('node:test');
const assert = require('node:assert/strict');

const ProcesarMensaje = require('../src/aplicacion/casos-de-uso/procesarMensaje');

test('debe descartar el memory_patch cuando la IA devuelve JSON inválido y conservar el estado anterior', async () => {
  const mensajesGuardados = [];
  const memoriaGuardada = [];
  const estadoAnterior = { nombre: 'Carlos', ciudad: 'CDE' };

  const repositorioMensajes = {
    guardar: async (mensaje) => {
      mensajesGuardados.push(mensaje);
      return { ...mensaje, id: 'msg-1' };
    },
    listarPorJid: async () => []
  };

  const repositorioMemoria = {
    obtenerPorJid: async () => ({ jid: 'jid-1', state_data: estadoAnterior }),
    guardar: async (registro) => {
      memoriaGuardada.push(registro);
      return registro;
    }
  };

  const agenteIa = {
    generarRespuesta: async () => ({ reply: 'Respuesta válida', memory_patch: null })
  };

  const caso = new ProcesarMensaje({
    mensajeRepositorio: repositorioMensajes,
    sessionMemoryRepositorio: repositorioMemoria,
    agenteIa,
    logger: { warn: () => {} }
  });

  const resultado = await caso.ejecutar({
    jid: 'jid-1',
    texto: 'Hola',
    isFromClient: true,
    source: 'whatsapp'
  });

  assert.equal(mensajesGuardados.length, 2);
  assert.equal(memoriaGuardada.length, 1);
  assert.deepEqual(memoriaGuardada[0].state_data, estadoAnterior);
  assert.equal(resultado.reply, 'Respuesta válida');
  assert.equal(resultado.memoryPatch, null);
});

test('debe aplicar un memory_patch válido y fusionar solo los campos modificados', async () => {
  const mensajesGuardados = [];
  const memoriaGuardada = [];
  const estadoAnterior = { nombre: 'Carlos', ciudad: 'CDE', conversation_state: 'ESPERANDO_NOMBRE' };

  const repositorioMensajes = {
    guardar: async (mensaje) => {
      mensajesGuardados.push(mensaje);
      return { ...mensaje, id: `msg-${mensajesGuardados.length}` };
    },
    listarPorJid: async () => []
  };

  const repositorioMemoria = {
    obtenerPorJid: async () => ({ jid: 'jid-2', state_data: estadoAnterior }),
    guardar: async (registro) => {
      memoriaGuardada.push(registro);
      return registro;
    }
  };

  const agenteIa = {
    generarRespuesta: async () => ({
      reply: 'Respuesta con patch',
      memory_patch: { conversation_state: 'ESPERANDO_DIRECCION', ciudad: 'MVD' }
    })
  };

  const caso = new ProcesarMensaje({
    mensajeRepositorio: repositorioMensajes,
    sessionMemoryRepositorio: repositorioMemoria,
    agenteIa,
    logger: { warn: () => {} }
  });

  const resultado = await caso.ejecutar({
    jid: 'jid-2',
    texto: 'Quiero comprar',
    isFromClient: true,
    source: 'whatsapp'
  });

  assert.equal(mensajesGuardados.length, 2);
  assert.equal(memoriaGuardada.length, 1);
  assert.deepEqual(memoriaGuardada[0].state_data, {
    nombre: 'Carlos',
    ciudad: 'MVD',
    conversation_state: 'ESPERANDO_DIRECCION'
  });
  assert.equal(resultado.reply, 'Respuesta con patch');
  assert.deepEqual(resultado.memoryPatch, { conversation_state: 'ESPERANDO_DIRECCION', ciudad: 'MVD' });
});
