const test = require('node:test');
const assert = require('node:assert/strict');
const { registerMetric } = require('../controllers/auditController');

test('registerMetric acepta y registra payloads (unit)', async () => {
  const req = { body: { tenantId: 't1', remoteJid: 'r@jid', model: 'gemini', latencyMs: 10, tokensUsed: 100 } };
  let sent = null;
  const res = { status: (s) => ({ json: (d) => { sent = { status: s, body: d }; return d; } }) };
  await registerMetric(req, res);
  assert.equal(sent.status, 202);
  assert.equal(sent.body.success, true);
});
