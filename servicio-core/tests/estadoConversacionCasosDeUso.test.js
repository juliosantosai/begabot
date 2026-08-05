const test = require('node:test');
const assert = require('node:assert/strict');

const EstadoConversacion = require('../src/dominio/estadoConversacion/estadoConversacion');
const EstadoConversacionCasosDeUso = require('../src/dominio/estadoConversacion/estadoConversacionCasosDeUso');

test('obtenerEstado crea un nuevo estado si no existe para jid y sender', async () => {
  const almacen = new Map();
  const repo = {
    obtenerPorJidYSender: async (jid, sender) => {
      const key = `${jid}::${sender}`;
      const record = almacen.get(key);
      return record ? new EstadoConversacion(record) : null;
    },
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(`${registro.jid}::${registro.sender}`, registro);
      return registro;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const resultado = await caso.obtenerEstado('jid-a', 'sender-a');

  assert.equal(resultado.jid, 'jid-a');
  assert.equal(resultado.sender, 'sender-a');
  assert.equal(resultado.numero, 1);
  assert.equal(resultado.bloqueado, false);
  assert.deepEqual(resultado.contexto, {});
  assert.ok(typeof resultado.uuid === 'string');
  assert.equal(almacen.size, 1);
});

test('obtenerEstado incrementa numero cuando ya existe un estado para el mismo jid y sender', async () => {
  const almacen = new Map();
  const estadoExistente = new EstadoConversacion({ uuid: 'id-1', jid: 'jid-b', sender: 'sender-b', numero: 3 });
  almacen.set('jid-b::sender-b', estadoExistente.toPlainObject());

  const repo = {
    obtenerPorJidYSender: async (jid, sender) => {
      const key = `${jid}::${sender}`;
      const record = almacen.get(key);
      return record ? new EstadoConversacion(record) : null;
    },
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(`${registro.jid}::${registro.sender}`, registro);
      return registro;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const resultado = await caso.obtenerEstado('jid-b', 'sender-b');

  assert.equal(resultado.numero, 4);
  assert.equal(almacen.get('jid-b::sender-b').numero, 4);
});

test('obtenerEstadoSinIncrementar devuelve el estado existente sin cambiar numero', async () => {
  const almacen = new Map();
  const estadoExistente = new EstadoConversacion({ uuid: 'id-2', jid: 'jid-x', sender: 'sender-x', numero: 5 });
  almacen.set('jid-x::sender-x', estadoExistente.toPlainObject());

  const repo = {
    obtenerPorJidYSender: async (jid, sender) => {
      const key = `${jid}::${sender}`;
      const record = almacen.get(key);
      return record ? new EstadoConversacion(record) : null;
    },
    guardar: async () => { throw new Error('No debería guardar'); },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const resultado = await caso.obtenerEstadoSinIncrementar('jid-x', 'sender-x');

  assert.equal(resultado.numero, 5);
  assert.equal(resultado.uuid, 'id-2');
});

test('obtenerEstadoSinIncrementar crea nuevo estado si no existe sin incrementar numero', async () => {
  let guardado;
  const repo = {
    obtenerPorJidYSender: async () => null,
    guardar: async (estado) => {
      guardado = estado.toPlainObject();
      return guardado;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const resultado = await caso.obtenerEstadoSinIncrementar('jid-new', 'sender-new');

  assert.equal(resultado.jid, 'jid-new');
  assert.equal(resultado.sender, 'sender-new');
  assert.equal(resultado.numero, 1);
  assert.deepEqual(resultado, guardado);
});

test('actualizarBloqueoPorUuid actualiza un estado existente por uuid', async () => {
  const almacen = new Map();
  const uuid = 'uuid-actualizar-bloqueo';
  const registro = new EstadoConversacion({ uuid, jid: 'jid-c', sender: 'sender-c', bloqueado: false, numero: 2 }).toPlainObject();
  almacen.set('jid-c::sender-c', registro);
  almacen.set(uuid, 'jid-c::sender-c');

  const repo = {
    obtenerPorUuid: async (searchUuid) => {
      const clave = almacen.get(searchUuid);
      return clave ? new EstadoConversacion(almacen.get(clave)) : null;
    },
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(`${registro.jid}::${registro.sender}`, registro);
      almacen.set(registro.uuid, `${registro.jid}::${registro.sender}`);
      return registro;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const resultado = await caso.actualizarBloqueoPorUuid(uuid, true, { jid: 'jid-c', sender: 'sender-c' });

  assert.equal(resultado.uuid, uuid);
  assert.equal(resultado.bloqueado, true);
  assert.equal(resultado.jid, 'jid-c');
  assert.equal(resultado.sender, 'sender-c');
});

test('actualizarBloqueoPorUuid desbloquea un estado existente sin resetear numero', async () => {
  const almacen = new Map();
  const uuid = 'uuid-desbloquear';
  const registro = new EstadoConversacion({ uuid, jid: 'jid-d', sender: 'sender-d', bloqueado: true, numero: 5 }).toPlainObject();
  almacen.set('jid-d::sender-d', registro);
  almacen.set(uuid, 'jid-d::sender-d');

  const repo = {
    obtenerPorUuid: async (searchUuid) => {
      const clave = almacen.get(searchUuid);
      return clave ? new EstadoConversacion(almacen.get(clave)) : null;
    },
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(`${registro.jid}::${registro.sender}`, registro);
      almacen.set(registro.uuid, `${registro.jid}::${registro.sender}`);
      return registro;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const resultado = await caso.actualizarBloqueoPorUuid(uuid, false, { jid: 'jid-d', sender: 'sender-d' });

  assert.equal(resultado.bloqueado, false);
  assert.equal(resultado.numero, 5);
});

test('actualizarBloqueoPorUuid resetear estado deja numero en 1 y bloqueo false', async () => {
  const almacen = new Map();
  const uuid = 'uuid-reset';
  const registro = new EstadoConversacion({ uuid, jid: 'jid-e', sender: 'sender-e', bloqueado: true, numero: 10, contexto: { ultimoMensaje: 'hola' } }).toPlainObject();
  almacen.set('jid-e::sender-e', registro);
  almacen.set(uuid, 'jid-e::sender-e');

  const repo = {
    obtenerPorUuid: async (searchUuid) => {
      const clave = almacen.get(searchUuid);
      return clave ? new EstadoConversacion(almacen.get(clave)) : null;
    },
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(`${registro.jid}::${registro.sender}`, registro);
      almacen.set(registro.uuid, `${registro.jid}::${registro.sender}`);
      return registro;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const resultado = await caso.actualizarBloqueoPorUuid(uuid, false, { jid: 'jid-e', sender: 'sender-e' }, true);

  assert.equal(resultado.bloqueado, false);
  assert.equal(resultado.numero, 1);
  assert.deepEqual(resultado.contexto, {});
});

test('actualizarBloqueoPorUuid crea un nuevo estado cuando no existe y recibe fallback', async () => {
  let guardado;
  const repo = {
    obtenerPorUuid: async () => null,
    guardar: async (estado) => {
      guardado = estado.toPlainObject();
      return guardado;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const resultado = await caso.actualizarBloqueoPorUuid('uuid-nuevo-1', true, { jid: 'jid-d', sender: 'sender-d' });

  assert.equal(resultado.uuid, 'uuid-nuevo-1');
  assert.equal(resultado.jid, 'jid-d');
  assert.equal(resultado.sender, 'sender-d');
  assert.equal(resultado.bloqueado, true);
  assert.equal(resultado.numero, 1);
  assert.deepEqual(resultado.contexto, {});
  assert.deepEqual(resultado, guardado);
});

test('actualizarBloqueoPorUuid falla cuando no existe estado y no se provee fallback válido', async () => {
  const repo = {
    obtenerPorUuid: async () => null,
    guardar: async () => { throw new Error('No debería guardar'); },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  await assert.rejects(() => caso.actualizarBloqueoPorUuid('uuid-nuevo-2', true, null), {
    message: 'No existe estado y faltan jid/sender para crear uno nuevo',
  });
});

test('actualizarContextoPorUuid actualiza el contexto de un estado existente por uuid', async () => {
  const almacen = new Map();
  const uuid = 'uuid-actualizar-contexto';
  const registro = new EstadoConversacion({ uuid, jid: 'jid-e', sender: 'sender-e', contexto: { paso: 1 } }).toPlainObject();
  almacen.set('jid-e::sender-e', registro);
  almacen.set(uuid, 'jid-e::sender-e');

  const repo = {
    obtenerPorUuid: async (searchUuid) => {
      const clave = almacen.get(searchUuid);
      return clave ? new EstadoConversacion(almacen.get(clave)) : null;
    },
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(`${registro.jid}::${registro.sender}`, registro);
      almacen.set(registro.uuid, `${registro.jid}::${registro.sender}`);
      return registro;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const nuevoContexto = { paso: 2, meta: 'terminado' };
  const resultado = await caso.actualizarContextoPorUuid(uuid, nuevoContexto, { jid: 'jid-e', sender: 'sender-e' });

  assert.deepEqual(resultado.contexto, nuevoContexto);
  assert.equal(resultado.uuid, uuid);
  assert.equal(resultado.jid, 'jid-e');
  assert.equal(resultado.sender, 'sender-e');
});

test('actualizarContextoPorUuid concatena conversationSummary en lugar de sobrescribirlo', async () => {
  const almacen = new Map();
  const uuid = 'uuid-actualizar-summary';
  const registro = new EstadoConversacion({
    uuid,
    jid: 'jid-f',
    sender: 'sender-f',
    contexto: { paso: 1, conversation_summary: 'Primera parte' }
  }).toPlainObject();
  almacen.set('jid-f::sender-f', registro);
  almacen.set(uuid, 'jid-f::sender-f');

  const repo = {
    obtenerPorUuid: async (searchUuid) => {
      const clave = almacen.get(searchUuid);
      return clave ? new EstadoConversacion(almacen.get(clave)) : null;
    },
    guardar: async (estado) => {
      const registro = estado.toPlainObject();
      almacen.set(`${registro.jid}::${registro.sender}`, registro);
      almacen.set(registro.uuid, `${registro.jid}::${registro.sender}`);
      return registro;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const nuevoContexto = { conversation_summary: 'Segunda parte', otro: 'valor' };
  const resultado = await caso.actualizarContextoPorUuid(uuid, nuevoContexto, { jid: 'jid-f', sender: 'sender-f' });

  assert.equal(resultado.contexto.conversation_summary, 'Primera parte - Segunda parte');
  assert.equal(resultado.contexto.conversationSummary, 'Primera parte - Segunda parte');
  assert.equal(resultado.contexto.otro, 'valor');
  assert.equal(resultado.uuid, uuid);
  assert.equal(resultado.jid, 'jid-f');
  assert.equal(resultado.sender, 'sender-f');
});

test('actualizarContextoPorUuid crea un nuevo estado cuando no existe y recibe fallback', async () => {
  let guardado;
  const repo = {
    obtenerPorUuid: async () => null,
    guardar: async (estado) => {
      guardado = estado.toPlainObject();
      return guardado;
    },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  const contexto = { paso: 1, origen: 'buffer' };
  const resultado = await caso.actualizarContextoPorUuid('uuid-nuevo-3', contexto, { jid: 'jid-f', sender: 'sender-f' });

  assert.equal(resultado.uuid, 'uuid-nuevo-3');
  assert.equal(resultado.jid, 'jid-f');
  assert.equal(resultado.sender, 'sender-f');
  assert.deepEqual(resultado.contexto, contexto);
  assert.equal(resultado.numero, 1);
  assert.deepEqual(resultado, guardado);
});

test('actualizarContextoPorUuid falla cuando no existe estado y no se provee fallback válido', async () => {
  const repo = {
    obtenerPorUuid: async () => null,
    guardar: async () => { throw new Error('No debería guardar'); },
  };

  const caso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: repo });
  await assert.rejects(() => caso.actualizarContextoPorUuid('uuid-nuevo-4', { paso: 1 }, {}), {
    message: 'No existe estado y faltan jid/sender para crear uno nuevo',
  });
});
