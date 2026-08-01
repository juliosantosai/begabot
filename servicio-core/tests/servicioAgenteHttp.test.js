const test = require('node:test');
const assert = require('node:assert/strict');
const ServicioAgenteHttp = require('../src/infraestructura/ai/servicioAgenteHttp');

test('normaliza warming_response y task_payload desde la respuesta del agente', async () => {
  const mockHttpClient = {
    enviar: async () => ({
      data: JSON.stringify({
        response: 'respuesta de prueba',
        parsedResponse: {
          warming_response: 'Te estoy preparando la siguiente acción.',
          task_payload: { tipo: 'seguimiento', prioridad: 'alta' },
          memory_patch: { estado: 'esperando' },
        },
      }),
    }),
  };

  const servicio = new ServicioAgenteHttp({ url: 'http://localhost:3003', httpClient: mockHttpClient });
  const resultado = await servicio.generarRespuesta({
    jid: 'empresa-a',
    mensajeUsuario: { texto: 'Hola' },
    historialConversacional: [],
    estadoActual: {},
  });

  assert.equal(resultado.reply, 'respuesta de prueba');
  assert.equal(resultado.warmingResponse, 'Te estoy preparando la siguiente acción.');
  assert.deepEqual(resultado.taskPayload, { tipo: 'seguimiento', prioridad: 'alta' });
  assert.deepEqual(resultado.memory_patch, { estado: 'esperando' });
});

test('envía el payload estructurado con userConcatenatedMessage y contexto al agente', async () => {
  let capturedBody;
  const mockHttpClient = {
    enviar: async ({ url, method, headers, body }) => {
      capturedBody = body;
      return {
        data: JSON.stringify({
          response: 'respuesta de prueba',
          parsedResponse: {
            response: 'respuesta de prueba',
            warming_response: 'listo',
            task_payload: { paso: 'cantidad' },
            memory_patch: { estado: 'cantidad' },
          },
        }),
      };
    },
  };

  const servicio = new ServicioAgenteHttp({ url: 'http://localhost:3003', httpClient: mockHttpClient });
  await servicio.generarRespuesta({
    jid: 'empresa-a',
    sender: 'empresa-a',
    mensajeUsuario: { texto: '2' },
    historialConversacional: [{ role: 'user', content: 'Hola' }],
    estadoActual: { etapa: 'cantidad' },
  });

  assert.equal(capturedBody.userConcatenatedMessage, '2');
  assert.equal(capturedBody.sender, 'empresa-a');
  assert.equal(capturedBody.jid, 'empresa-a');
  assert.equal(capturedBody.contextoPrevio, '[Estado: cantidad]');
  assert.equal(capturedBody.systemPrompt, '');
});
