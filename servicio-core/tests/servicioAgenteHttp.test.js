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

test('prioriza reply y memory_patch canonicos sobre el string serializado en response', async () => {
  const mockHttpClient = {
    enviar: async () => ({
      data: JSON.stringify({
        reply: 'Texto humano final',
        memory_patch: { estado: 'esperando_necesidad', zona: 'Ciudad del Este' },
        warming_response: 'Preparando el siguiente paso',
        task_payload: { texto: null, delay: 0 },
        response: '{"sender":"usuario","jid":"chat_123","response":"JSON serializado"}'
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

  assert.equal(resultado.reply, 'Texto humano final');
  assert.deepEqual(resultado.memory_patch, { estado: 'esperando_necesidad', zona: 'Ciudad del Este' });
  assert.equal(resultado.warmingResponse, 'Preparando el siguiente paso');
  assert.deepEqual(resultado.taskPayload, { texto: null, delay: 0 });
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
    estadoActual: { etapa: 'cantidad', conversation_state: 'ESPERANDO_DIRECCION', conversation_summary: 'Quiero comprar - Hola' },
  });

  assert.equal(capturedBody.prompt, '2');
  assert.equal(capturedBody.sender, 'empresa-a');
  assert.equal(capturedBody.jid, 'empresa-a');
  assert.equal(capturedBody.conversationState, 'ESPERANDO_DIRECCION');
  assert.equal(capturedBody.conversationSummary, 'Quiero comprar - Hola');
  assert.equal(capturedBody.systemInstruction, '');
});
