const test = require('node:test');
const assert = require('node:assert/strict');

const CrearTarea = require('../src/aplicacion/casos-de-uso/crearTarea');
const ConsumirProximaTarea = require('../src/aplicacion/casos-de-uso/consumirProximaTarea');
const { crearAplicacion } = require('../src/interfaz/http/app');

test('CrearTarea llama al repositorio con datos correctos', async () => {
  let saved = null;
  const repo = {
    crear: async (tarea) => { saved = tarea.toPlainObject ? tarea.toPlainObject() : tarea; return saved; },
  };

  const caso = new CrearTarea({ tareaRepositorio: repo });
  const now = new Date();
  await caso.ejecutar({ texto: 'hola', fechaEjecucion: now, estadoConversacionUuid: 'estado-123' });

  assert.equal(saved.texto, 'hola');
  assert.equal(saved.payload.estadoConversacionUuid, 'estado-123');
});

test('CrearTarea guarda el uuid del estado de conversación en el payload', async () => {
  let saved = null;
  const repo = {
    crear: async (tarea) => { saved = tarea.toPlainObject ? tarea.toPlainObject() : tarea; return saved; },
  };

  const caso = new CrearTarea({ tareaRepositorio: repo });
  const now = new Date();
  await caso.ejecutar({
    texto: 'hola',
    fechaEjecucion: now,
    estadoConversacionUuid: 'estado-123',
  });

  assert.equal(saved.payload.estadoConversacionUuid, 'estado-123');
});

test('PrismaTareaRepositorio actualiza tarea pendiente existente con el mismo estadoConversacionUuid', async () => {
  const tasks = [{
    id: 't-1',
    estadoConversacionUuid: 'estado-123',
    texto: 'hola',
    fechaEjecucion: new Date(Date.now() - 1000),
    estado: 'pendiente',
    eliminado: false,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    payload: { estadoConversacionUuid: 'estado-123' },
  }];

  const prisma = {
    task: {
      findFirst: async ({ where }) => tasks.find((t) => t.estado === where.estado && t.eliminado === where.eliminado && t.estadoConversacionUuid === where.estadoConversacionUuid),
      update: async ({ where, data }) => {
        const index = tasks.findIndex((t) => t.id === where.id);
        tasks[index] = { ...tasks[index], ...data };
        return tasks[index];
      },
      create: async ({ data }) => {
        tasks.push(data);
        return data;
      },
    },
  };

  const PrismaTareaRepositorio = require('../src/infraestructura/repositorios/prismaTareaRepositorio');
  const Tarea = require('../src/dominio/tareas/tarea');
  const repo = new PrismaTareaRepositorio(prisma);
  const tarea = new Tarea({
    id: 't-2',
    texto: 'saludo',
    fechaEjecucion: new Date(),
    payload: { estadoConversacionUuid: 'estado-123' },
  });

  const result = await repo.crear(tarea);

  assert.equal(result.id, 't-1');
  assert.equal(result.texto, 'saludo');
  assert.equal(result.estadoConversacionUuid, 'estado-123');
  assert.equal(tasks.length, 1);
});

test('ConsumirProximaTarea guarda log y marca tarea eliminada', async () => {
  const tarea = { id: 't1', sender: 's1', jid: 'j1', texto: 'x', fechaEjecucion: new Date() };
  const repo = {
    listarPendientes: async () => [tarea],
    guardarLog: async (log) => ({ ...log, id: 'log1' }),
    eliminarPorId: async (id) => ({ id, eliminado: true }),
  };

  const caso = new ConsumirProximaTarea({ tareaRepositorio: repo });
  const res = await caso.ejecutar();

  assert.equal(res.id, 'log1');
  assert.equal(res.tareaId, tarea.id);
});

test('ConsumirProximaTarea no consume tareas con fecha futura', async () => {
  const tareaFutura = { id: 't2', sender: 's1', jid: 'j1', texto: 'x', fechaEjecucion: new Date(Date.now() + 60000) };
  const repo = {
    listarPendientes: async () => [tareaFutura],
    guardarLog: async () => { throw new Error('No debería registrar'); },
    eliminarPorId: async () => { throw new Error('No debería eliminar'); },
  };

  const caso = new ConsumirProximaTarea({ tareaRepositorio: repo });
  await assert.rejects(async () => {
    await caso.ejecutar();
  }, {
    message: 'No hay tareas pendientes para ejecutar',
  });
});

test('GET /core/tareas/pendientes devuelve tareas con segundos restantes', async () => {
  const prisma = {
    task: {
      findMany: async () => [
        {
          id: 't-1',
          sender: 's1',
          jid: 'j1',
          texto: 'hola',
          fechaEjecucion: new Date(Date.now() + 4500),
          estado: 'pendiente',
          eliminado: false,
        },
      ],
    },
  };

  const app = crearAplicacion({ prisma });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/core/tareas/pendientes`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data[0].id, 't-1');
    assert.equal(payload.data[0].uuid, 't-1');
    assert.ok(payload.data[0].segundosRestantes >= 4 && payload.data[0].segundosRestantes <= 5);
  } finally {
    server.close();
  }
});
