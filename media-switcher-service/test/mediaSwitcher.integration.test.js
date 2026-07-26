const test = require('node:test');
const assert = require('node:assert/strict');
const fetch = globalThis.fetch || require('node-fetch');

test('POST /switch-media (integration)', async () => {
  // Start server by requiring it (server.js listens on start)
  require('../server');

  const resp = await fetch('http://localhost:3004/switch-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageType: 'audioMessage', key: { remoteJid: 'r@jid' } }),
  });

  const json = await resp.json();
  assert.equal(resp.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.messageType, 'audioMessage');
});
