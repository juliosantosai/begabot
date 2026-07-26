const test = require('node:test');
const assert = require('node:assert');
const { evaluateSessionState } = require('../maquinaEstados');

test('Máquina de Estados: Comando de bloqueo permanente (bloquear)', async () => {
  const session = { interactionCount: 2, isBlocked: false };
  const result = await evaluateSessionState(session, 'bloquear');

  assert.strictEqual(result.action, 'BLOCK');
  assert.strictEqual(result.updateData.isBlocked, true);
});

test('Máquina de Estados: Comando de desbloqueo (desbloquear)', async () => {
  const session = { interactionCount: 5, isBlocked: true };
  const result = await evaluateSessionState(session, 'desbloquear');

  assert.strictEqual(result.action, 'UNBLOCK');
  assert.strictEqual(result.updateData.isBlocked, false);
});

test('Máquina de Estados: Comando humano (humano)', async () => {
  const session = { interactionCount: 3, isBlocked: false };
  const result = await evaluateSessionState(session, 'humano');

  assert.strictEqual(result.action, 'HUMAN_PAUSED');
  assert.strictEqual(result.updateData.botPausedByHuman, true);
});

test('Máquina de Estados: Pausa temporal activa por minutos', async () => {
  const futureDate = new Date(Date.now() + 10 * 60000); // 10 minutos en el futuro
  const session = { interactionCount: 1, pausedUntil: futureDate };
  const result = await evaluateSessionState(session, 'hola bot');

  assert.strictEqual(result.action, 'SKIPPED_PAUSED');
  assert.strictEqual(result.replyMessage, null);
});

test('Máquina de Estados: El bloqueo ya no depende del límite de interacciones', async () => {
  const session = { interactionCount: 8, maxInteractions: 8 };
  const result = await evaluateSessionState(session, 'otra pregunta');

  assert.strictEqual(result.action, 'PROCEED');
  assert.strictEqual(result.updateData.interactionCount, 9);
});

test('Máquina de Estados: Flujo normal (PROCEED)', async () => {
  const session = { interactionCount: 2, maxInteractions: 8 };
  const result = await evaluateSessionState(session, 'necesito información');

  assert.strictEqual(result.action, 'PROCEED');
  assert.strictEqual(result.updateData.interactionCount, 3);
});
