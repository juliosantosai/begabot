const test = require('node:test');
const assert = require('node:assert/strict');

const ProcesarMensaje = require('../src/aplicacion/casos-de-uso/procesarMensaje');
const ListarMensajesPorJid = require('../src/aplicacion/casos-de-uso/listarMensajesPorJid');

test('debe guardar un mensaje con jid, texto, origen y bandera de remitente', async () => {
  const mensajesGuardados = [];
  const repositorio = {
    guardar: async (mensaje) => {
      mensajesGuardados.push(mensaje);
      return mensaje;
    },
  };

  const caso = new ProcesarMensaje({ mensajeRepositorio: repositorio });
  const resultado = await caso.ejecutar({
    jid: '5491112345678',
    texto: 'Hola desde el cliente',
    isFromClient: true,
    source: 'whatsapp',
  });

  assert.equal(resultado.jid, '5491112345678');
  assert.equal(resultado.texto, 'Hola desde el cliente');
  assert.equal(resultado.isFromClient, true);
  assert.equal(resultado.source, 'whatsapp');
  assert.equal(mensajesGuardados.length, 1);
});

test('debe listar todos los mensajes que pertenecen a un jid', async () => {
  const mensajes = [
    { jid: '5491112345678', texto: 'uno', isFromClient: true, source: 'whatsapp' },
    { jid: '5491112345678', texto: 'dos', isFromClient: false, source: 'web' },
    { jid: '549999999999', texto: 'otro', isFromClient: true, source: 'mobile' },
  ];

  const repositorio = {
    listarPorJid: async (jid) => mensajes.filter((mensaje) => mensaje.jid === jid),
  };

  const caso = new ListarMensajesPorJid({ mensajeRepositorio: repositorio });
  const resultado = await caso.ejecutar('5491112345678');

  assert.equal(resultado.length, 2);
  assert.ok(resultado.every((mensaje) => mensaje.jid === '5491112345678'));
});
