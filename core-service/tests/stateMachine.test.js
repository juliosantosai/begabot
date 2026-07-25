const test = require('node:test');
const assert = require('node:assert/strict');
const { crearMaquinaEstados } = require('../stateMachine');

test('crearMaquinaEstados devuelve los métodos del estado', () => {
  const maquina = crearMaquinaEstados({});
  assert.equal(typeof maquina.evaluarEstadoSesion, 'function');
  assert.equal(typeof maquina.procesarComandoOperador, 'function');
  assert.equal(typeof maquina.pausarBotPorMinutos, 'function');
});
