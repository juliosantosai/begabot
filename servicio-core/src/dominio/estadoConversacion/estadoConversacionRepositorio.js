class EstadoConversacionRepositorio {
  async obtenerPorJidYSender(jid, sender) {
    throw new Error('Método no implementado');
  }

  async obtenerPorUuid(uuid) {
    throw new Error('Método no implementado');
  }

  async guardar(estadoConversacion) {
    throw new Error('Método no implementado');
  }
}

module.exports = EstadoConversacionRepositorio;
