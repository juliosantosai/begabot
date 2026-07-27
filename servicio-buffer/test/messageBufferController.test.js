const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { once } = require('node:events');
const { acumularMensajeEnBuffer, redis } = require('../controllers/controladorBufferMensajes');
const router = require('../routes/rutaBuffer');

test('acumularMensajeEnBuffer devuelve texto acumulado y marca primer mensaje', async () => {
  const result = await acumularMensajeEnBuffer('test-buffer@whatsapp.net', 'hola');
  assert.equal(result.isFirst, true);
  assert.equal(result.accumulatedText, 'hola');
});

test('acumularMensajeEnBuffer acumula mensajes consecutivos', async () => {
  const result = await acumularMensajeEnBuffer('test-buffer@whatsapp.net', 'mundo');
  assert.equal(result.isFirst, false);
  assert.match(result.accumulatedText, /hola - mundo/);
});

test('redis expone la conexión del buffer', async () => {
  assert.ok(redis);
  assert.equal(typeof redis.get, 'function');
});

test('la ruta acepta un JSON simple con jid, text y sender', async () => {
  const app = express();
  app.use(express.json());
  app.use('/', router);

  const servidor = app.listen(0);
  await once(servidor, 'listening');

  try {
    const direccion = servidor.address();
    const payload = {
      jid: 'test@whatsapp.net',
      text: 'hola desde el nuevo contrato',
      sender: 'sender@whatsapp.net'
    };

    const respuesta = await fetch(`http://127.0.0.1:${direccion.port}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const cuerpo = await respuesta.json();
    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.remoteJid, 'test@whatsapp.net');
    assert.equal(cuerpo.sender, 'sender@whatsapp.net');
    assert.match(cuerpo.accumulatedText, /hola desde el nuevo contrato/);
  } finally {
    servidor.close();
  }
});

test('la ruta convierte valores numéricos a string en sender y text', async () => {
  const app = express();
  app.use(express.json());
  app.use('/', router);

  const servidor = app.listen(0);
  await once(servidor, 'listening');

  try {
    const direccion = servidor.address();
    const payload = {
      jid: 'test@whatsapp.net',
      text: 12345,
      sender: 67890
    };

    const respuesta = await fetch(`http://127.0.0.1:${direccion.port}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const cuerpo = await respuesta.json();
    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.remoteJid, 'test@whatsapp.net');
    assert.equal(cuerpo.sender, '67890');
    assert.match(cuerpo.accumulatedText, /12345/);
  } finally {
    servidor.close();
  }
});

test('la ruta rechaza el request cuando falta sender', async () => {
  const app = express();
  app.use(express.json());
  app.use('/', router);

  const servidor = app.listen(0);
  await once(servidor, 'listening');

  try {
    const direccion = servidor.address();
    const respuesta = await fetch(`http://127.0.0.1:${direccion.port}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jid: 'test@whatsapp.net', text: 'hola sin sender' })
    });

    const cuerpo = await respuesta.json();
    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.error, 'Se requieren jid, text y sender en el cuerpo');
  } finally {
    servidor.close();
  }
});
