const Mensaje = require('../../dominio/mensajes/mensaje');

class ProcesarMensaje {
  constructor({ mensajeRepositorio, sessionMemoryRepositorio, agenteIa, logger }) {
    this.mensajeRepositorio = mensajeRepositorio;
    this.sessionMemoryRepositorio = sessionMemoryRepositorio;
    this.agenteIa = agenteIa;
    this.logger = logger || console;
  }

  async ejecutar({ jid, texto, isFromClient, source }) {
    const mensaje = new Mensaje({ jid, texto, isFromClient, source });
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
        mensajeUsuario: mensaje,
        historialConversacional,
        estadoActual,
      });
    } else {
      respuestaIa = { reply: texto, memory_patch: null };
    }

    let memoryPatch = null;
    let memoriaAplicada = estadoActual;

    if (respuestaIa && typeof respuestaIa === 'object') {
      const patchBruto = respuestaIa.memory_patch;
      if (patchBruto && typeof patchBruto === 'object' && !Array.isArray(patchBruto)) {
        memoryPatch = patchBruto;
        memoriaAplicada = { ...estadoActual, ...memoryPatch };
      } else {
        this.logger.warn?.(`Patch de memoria inválido para ${jid}:`, patchBruto);
      }
    }

    if (this.sessionMemoryRepositorio?.guardar) {
      await this.sessionMemoryRepositorio.guardar({
        jid,
        state_data: memoriaAplicada,
      });
    }

    const respuestaAsistente = await this.mensajeRepositorio.guardar({
      jid,
      texto: respuestaIa?.reply || texto,
      sender: 'assistant',
      role: 'assistant',
      isFromClient: false,
      source: 'core',
    });

    return {
      ...respuestaAsistente,
      reply: respuestaIa?.reply || texto,
      memoryPatch,
    };
  }
}

module.exports = ProcesarMensaje;
