const EstadoConversacion = require('./estadoConversacion');

function normalizarContexto(contexto) {
  if (typeof contexto === 'string') {
    try {
      const parsed = JSON.parse(contexto);
      return parsed && typeof parsed === 'object' ? normalizarContexto(parsed) : { rawContext: contexto };
    } catch (_error) {
      return { rawContext: contexto };
    }
  }

  if (Array.isArray(contexto)) {
    return { rawContext: JSON.stringify(contexto) };
  }

  if (contexto && typeof contexto === 'object') {
    const normalized = { ...contexto };

    if (normalized.conversationState !== undefined) {
      normalized.conversation_state = normalized.conversationState;
      delete normalized.conversationState;
    }

    if (normalized.conversationSummary !== undefined) {
      normalized.conversation_summary = normalized.conversationSummary;
      delete normalized.conversationSummary;
    }

    if (normalized.state !== undefined && normalized.conversation_state === undefined) {
      normalized.conversation_state = normalized.state;
      delete normalized.state;
    }

    return normalized;
  }

  return { rawContext: String(contexto) };
}

class EstadoConversacionCasosDeUso {
  constructor({ estadoConversacionRepositorio }) {
    this.estadoConversacionRepositorio = estadoConversacionRepositorio;
  }

  async obtenerEstado(jid, sender, tenantId) {
    let estado = await this.estadoConversacionRepositorio.obtenerPorJidYSender(jid, sender, tenantId);

    if (!estado) {
      estado = EstadoConversacion.crearNuevo(jid, sender);
    } else {
      estado.incrementarNumero();
    }

    if (tenantId) {
      const po = estado.toPlainObject();
      po.tenantId = tenantId;
      await this.estadoConversacionRepositorio.guardar({ toPlainObject: () => po });
    } else {
      await this.estadoConversacionRepositorio.guardar(estado);
    }
    return estado.toPlainObject();
  }

  async obtenerEstadoSinIncrementar(jid, sender, tenantId) {
    let estado = await this.estadoConversacionRepositorio.obtenerPorJidYSender(jid, sender, tenantId);

    if (!estado) {
      estado = EstadoConversacion.crearNuevo(jid, sender);
      if (tenantId) {
        const po = estado.toPlainObject();
        po.tenantId = tenantId;
        await this.estadoConversacionRepositorio.guardar({ toPlainObject: () => po });
      } else {
        await this.estadoConversacionRepositorio.guardar(estado);
      }
    }

    return estado.toPlainObject();
  }

  async actualizarBloqueoPorUuid(uuid, bloqueado, fallback, reset = false, tenantId) {
    let estado = await this.estadoConversacionRepositorio.obtenerPorUuid(uuid);

    if (!estado) {
      if (!fallback || !fallback.jid || !fallback.sender) {
        throw new Error('No existe estado y faltan jid/sender para crear uno nuevo');
      }
      estado = new EstadoConversacion({ uuid, jid: fallback.jid, sender: fallback.sender, bloqueado: false, contexto: {}, numero: 1 });
    }

    if (reset) {
      estado.actualizarBloqueo(false);
      estado.reiniciarNumero();
      estado.actualizarContexto({});
    } else {
      estado.actualizarBloqueo(bloqueado);
    }

    if (tenantId) {
      const po = estado.toPlainObject();
      po.tenantId = tenantId;
      await this.estadoConversacionRepositorio.guardar({ toPlainObject: () => po });
    } else {
      await this.estadoConversacionRepositorio.guardar(estado);
    }
    return estado.toPlainObject();
  }

  async actualizarContextoPorUuid(uuid, contexto, fallback, tenantId) {
    let estado = await this.estadoConversacionRepositorio.obtenerPorUuid(uuid);

    if (!estado) {
      if (!fallback || !fallback.jid || !fallback.sender) {
        throw new Error('No existe estado y faltan jid/sender para crear uno nuevo');
      }
      estado = new EstadoConversacion({ uuid, jid: fallback.jid, sender: fallback.sender, bloqueado: false, contexto: {}, numero: 1 });
    }

    const contextoAnterior = estado.contexto || {};
    const contextoNormalizado = normalizarContexto(contexto);
    const mergedContexto = { ...contextoAnterior, ...contextoNormalizado };

    const resumenAnterior = contextoAnterior.conversationSummary || contextoAnterior.conversation_summary || '';
    const nuevoResumen = contextoNormalizado.conversationSummary || contextoNormalizado.conversation_summary || '';
    if (nuevoResumen) {
      mergedContexto.conversationSummary = resumenAnterior
        ? `${resumenAnterior} - ${nuevoResumen}`
        : nuevoResumen;
      mergedContexto.conversation_summary = mergedContexto.conversationSummary;
    }

    estado.actualizarContexto(mergedContexto);
    if (tenantId) {
      const po = estado.toPlainObject();
      po.tenantId = tenantId;
      await this.estadoConversacionRepositorio.guardar({ toPlainObject: () => po });
    } else {
      await this.estadoConversacionRepositorio.guardar(estado);
    }
    return estado.toPlainObject();
  }
}

module.exports = EstadoConversacionCasosDeUso;
