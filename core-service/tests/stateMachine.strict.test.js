const test = require('node:test');
const assert = require('node:assert');
const { evaluateSessionState } = require('../stateMachine');

test('Máquina de Estados: Comando de bloqueo permanente (.)', async () => {
  const session = { interactionCount: 2, isBlocked: false };
  const result = await evaluateSessionState(session, '.');

  assert.strictEqual(result.action, 'BLOCK');
  assert.strictEqual(result.updateData.isBlocked, true);
});

test('Máquina de Estados: Comando de reinicio de interacciones (@)', async () => {
  const session = { interactionCount: 5, isBlocked: true };
  const result = await evaluateSessionState(session, '@ reiniciar');

  assert.strictEqual(result.action, 'RESET');
  assert.strictEqual(result.updateData.interactionCount, 0);
  assert.strictEqual(result.updateData.isBlocked, false);
});

test('Máquina de Estados: Pausa temporal activa por minutos', async () => {
  const futureDate = new Date(Date.now() + 10 * 60000); // 10 minutos en el futuro
  const session = { interactionCount: 1, pausedUntil: futureDate };
  const result = await evaluateSessionState(session, 'hola bot');

  assert.strictEqual(result.action, 'SKIPPED_PAUSED');
  assert.strictEqual(result.replyMessage, null);
});

test('Máquina de Estados: Límite máximo de interacciones excedido (ciclo de 8)', async () => {
  const session = { interactionCount: 8, maxInteractions: 8 };
  const result = await evaluateSessionState(session, 'otra pregunta');

  assert.strictEqual(result.action, 'LIMIT_REACHED');
  assert.strictEqual(result.updateData.isBlocked, true);
});

test('Máquina de Estados: Flujo normal (PROCEED)', async () => {
  const session = { interactionCount: 2, maxInteractions: 8 };
  const result = await evaluateSessionState(session, 'necesito información');

  assert.strictEqual(result.action, 'PROCEED');
  assert.strictEqual(result.updateData.interactionCount, 3);
});
