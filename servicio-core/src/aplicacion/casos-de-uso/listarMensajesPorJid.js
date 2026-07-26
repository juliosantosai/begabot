class ListarMensajesPorJid {
  constructor({ mensajeRepositorio }) {
    this.mensajeRepositorio = mensajeRepositorio;
  }

  async ejecutar(jid) {
    return this.mensajeRepositorio.listarPorJid(jid);
  }
}

module.exports = ListarMensajesPorJid;
