const EstadoConversacion = require('../../dominio/estadoConversacion/estadoConversacion');

class EstadoConversacionRepositorioMemoria {
  constructor() {
    this.store = new Map();
    this.uuidIndex = new Map();
  }

  generarClave(jid, sender) {
    return `${jid}::${sender}`;
  }

  async obtenerPorJidYSender(jid, sender) {
    const registro = this.store.get(this.generarClave(jid, sender));
    if (!registro) return null;
    return new EstadoConversacion(registro);
  }

  async obtenerPorUuid(uuid) {
    const clave = this.uuidIndex.get(uuid);
    if (!clave) return null;
    const registro = this.store.get(clave);
    if (!registro) return null;
    return new EstadoConversacion(registro);
  }

  async guardar(estadoConversacion) {
    const registro = estadoConversacion.toPlainObject();
    const clave = this.generarClave(estadoConversacion.jid, estadoConversacion.sender);
    this.store.set(clave, registro);
    this.uuidIndex.set(estadoConversacion.uuid, clave);
    return registro;
  }
}

module.exports = EstadoConversacionRepositorioMemoria;
