const test = require('node:test');
const assert = require('node:assert/strict');
const { processMediaMessage } = require('../controllers/mediaSwitcherController');

test('processMediaMessage normaliza audio, ubicación y texto (unit)', async () => {
  // audioMessage
  const reqAudio = { body: { messageType: 'audioMessage', key: { remoteJid: 'r@jid' } } };
  let sentAudio = null;
  const resAudio = {
    status: (s) => ({
      json: (d) => { sentAudio = d; return d; }
    })
  };
  await processMediaMessage(reqAudio, resAudio);
  assert.equal(sentAudio.success, true);
  assert.equal(sentAudio.messageType, 'audioMessage');
  assert.ok(sentAudio.processedText.includes('Nota de voz') || sentAudio.processedText.length > 0);

  // locationMessage
  const reqLoc = { body: { messageType: 'locationMessage', message: { location: { latitude: 1, longitude: 2 } }, key: { remoteJid: 'r@jid' } } };
  let sentLoc = null;
  const resLoc = { status: (s) => ({ json: (d) => { sentLoc = d; return d; } }) };
  await processMediaMessage(reqLoc, resLoc);
  assert.equal(sentLoc.success, true);
  assert.equal(sentLoc.messageType, 'locationMessage');
  assert.ok(sentLoc.processedText.includes('Ubicación'));

  // text
  const reqTxt = { body: { messageType: 'text', message: { conversation: 'hola' }, key: { remoteJid: 'r@jid' } } };
  let sentTxt = null;
  const resTxt = { status: (s) => ({ json: (d) => { sentTxt = d; return d; } }) };
  await processMediaMessage(reqTxt, resTxt);
  assert.equal(sentTxt.success, true);
  assert.equal(sentTxt.messageType, 'text');
  assert.equal(sentTxt.processedText, 'hola');
});
