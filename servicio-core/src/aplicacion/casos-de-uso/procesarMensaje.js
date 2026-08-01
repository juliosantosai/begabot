const Mensaje = require('../../dominio/mensajes/mensaje');

class ProcesarMensaje {
  constructor({ mensajeRepositorio, sessionMemoryRepositorio, agenteIa, logger }) {
    this.mensajeRepositorio = mensajeRepositorio;
    this.sessionMemoryRepositorio = sessionMemoryRepositorio;
    this.agenteIa = agenteIa;
    this.logger = logger || console;
  }

  async ejecutar({ jid, texto, isFromClient, source }) {
    const textoNormalizado = typeof texto === 'string'
      ? texto
      : texto === undefined || texto === null
        ? ''
        : String(texto);

    const textoNormalizadoConPrefijo = typeof texto === 'number' || typeof texto === 'boolean'
      ? `quiero ${textoNormalizado}`
      : textoNormalizado;

    const mensaje = new Mensaje({ jid, texto: textoNormalizadoConPrefijo, isFromClient, source });
    const mensajeUsuario = await this.mensajeRepositorio.guardar({
      ...mensaje,
      sender: 'user',
      role: 'user',
    });
    // If the repository is a minimal stub without listarPorJid, return the saved user message
    if (!this.mensajeRepositorio?.listarPorJid || !this.agenteIa?.generarRespuesta) {
      return mensajeUsuario;
    }

    const historialConversacional = await this.mensajeRepositorio.listarPorJid(jid);
    const memoriaActual = await this.sessionMemoryRepositorio?.obtenerPorJid?.(jid);
    const estadoActual = memoriaActual?.state_data || {};

    let respuestaIa;
    if (this.agenteIa?.generarRespuesta) {
      respuestaIa = await this.agenteIa.generarRespuesta({
        jid,
        sender: jid,
        mensajeUsuario: mensaje,
        historialConversacional,
        estadoActual,
      });
    } else {
      respuestaIa = { reply: textoNormalizadoConPrefijo, memory_patch: null };
    }

    const textoRespuesta = typeof respuestaIa?.reply === 'string'
      ? respuestaIa.reply
      : respuestaIa?.reply === undefined || respuestaIa?.reply === null
        ? ''
        : String(respuestaIa.reply);

    const textoRespuestaFinal = textoRespuesta || textoNormalizadoConPrefijo;
    const nuevoResumen = `${textoNormalizadoConPrefijo} - ${textoRespuestaFinal}`;
    const resumenActual = memoriaActual?.conversation_summary || '';
    const conversationSummary = resumenActual
      ? `${resumenActual} - ${nuevoResumen}`
      : nuevoResumen;

    let memoryPatch = null;
    let memoriaAplicada = estadoActual;
    let conversationState = estadoActual?.conversation_state || null;

    if (respuestaIa && typeof respuestaIa === 'object') {
      const patchBruto = respuestaIa.memory_patch;
      if (patchBruto && typeof patchBruto === 'object' && !Array.isArray(patchBruto)) {
        memoryPatch = patchBruto;
        memoriaAplicada = { ...estadoActual, ...memoryPatch };
        conversationState = patchBruto.conversation_state || patchBruto.state || estadoActual?.conversation_state || null;
      } else {
        this.logger.warn?.(`Patch de memoria inválido para ${jid}:`, patchBruto);
      }
    }

    if (this.sessionMemoryRepositorio?.guardar) {
      await this.sessionMemoryRepositorio.guardar({
        jid,
        state_data: memoriaAplicada,
        conversation_state: conversationState,
        conversation_summary: conversationSummary,
      });
    }

    const respuestaAsistente = await this.mensajeRepositorio.guardar({
      jid,
      texto: textoRespuestaFinal,
      sender: 'assistant',
      role: 'assistant',
      isFromClient: false,
      source: 'core',
    });

    return {
      ...respuestaAsistente,
      reply: textoRespuestaFinal,
      memoryPatch,
      warmingResponse: respuestaIa?.warmingResponse || null,
      taskPayload: respuestaIa?.taskPayload || null,
    };
  }
}

module.exports = ProcesarMensaje;
