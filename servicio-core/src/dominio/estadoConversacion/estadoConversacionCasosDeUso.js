const EstadoConversacion = require('./estadoConversacion');

class EstadoConversacionCasosDeUso {
  constructor({ estadoConversacionRepositorio }) {
    this.estadoConversacionRepositorio = estadoConversacionRepositorio;
  }

  async obtenerEstado(jid, sender) {
    let estado = await this.estadoConversacionRepositorio.obtenerPorJidYSender(jid, sender);

    if (!estado) {
      estado = EstadoConversacion.crearNuevo(jid, sender);
    } else {
      estado.incrementarNumero();
    }

    await this.estadoConversacionRepositorio.guardar(estado);
    return estado.toPlainObject();
  }

  async obtenerEstadoSinIncrementar(jid, sender) {
    let estado = await this.estadoConversacionRepositorio.obtenerPorJidYSender(jid, sender);

    if (!estado) {
      estado = EstadoConversacion.crearNuevo(jid, sender);
      await this.estadoConversacionRepositorio.guardar(estado);
    }

    return estado.toPlainObject();
  }

  async actualizarBloqueoPorUuid(uuid, bloqueado, fallback, reset = false) {
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

    await this.estadoConversacionRepositorio.guardar(estado);
    return estado.toPlainObject();
  }

  async actualizarContextoPorUuid(uuid, contexto, fallback) {
    let estado = await this.estadoConversacionRepositorio.obtenerPorUuid(uuid);

    if (!estado) {
      if (!fallback || !fallback.jid || !fallback.sender) {
        throw new Error('No existe estado y faltan jid/sender para crear uno nuevo');
      }
      estado = new EstadoConversacion({ uuid, jid: fallback.jid, sender: fallback.sender, bloqueado: false, contexto: {}, numero: 1 });
    }

    estado.actualizarContexto(contexto);
    await this.estadoConversacionRepositorio.guardar(estado);
    return estado.toPlainObject();
  }
}

module.exports = EstadoConversacionCasosDeUso;
