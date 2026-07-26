const MensajeRepositorio = require('../../dominio/puertos/mensajeRepositorio');

class PrismaMensajeRepositorio extends MensajeRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async guardar(mensaje) {
    return this.prisma.messageHistory.create({
      data: {
        jid: mensaje.jid,
        texto: mensaje.texto,
        isFromClient: mensaje.isFromClient,
        source: mensaje.source,
      },
    });
  }

  async listarPorJid(jid) {
    return this.prisma.messageHistory.findMany({
      where: { jid },
      orderBy: { creadoEn: 'asc' },
    });
  }
}

module.exports = PrismaMensajeRepositorio;
