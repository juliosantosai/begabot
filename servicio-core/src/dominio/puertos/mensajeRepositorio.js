class MensajeRepositorio {
  async guardar(_mensaje) {
    throw new Error('Debe implementar guardar().');
  }

  async listarPorJid(_jid) {
    throw new Error('Debe implementar listarPorJid().');
  }
}

module.exports = MensajeRepositorio;
