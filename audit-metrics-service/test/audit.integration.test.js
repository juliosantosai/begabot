const test = require('node:test');
const assert = require('node:assert/strict');
const fetch = globalThis.fetch || require('node-fetch');

test('POST /audit/metrics (integration)', async () => {
  require('../server');

  const resp = await fetch('http://localhost:3005/audit/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: 't1', remoteJid: 'r@jid', model: 'gemini', latencyMs: 5, tokensUsed: 20 }),
  });

  const json = await resp.json();
  assert.equal(resp.status, 202);
  assert.equal(json.success, true);
});
