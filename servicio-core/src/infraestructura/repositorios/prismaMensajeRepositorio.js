const MensajeRepositorio = require('../../dominio/puertos/mensajeRepositorio');

class PrismaMensajeRepositorio extends MensajeRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async guardar(mensaje) {
    if (this.prisma?.message) {
      return this.prisma.message.create({
        data: {
          jid: mensaje.jid,
          sender: mensaje.sender || 'user',
          role: mensaje.role || 'user',
          content: mensaje.texto,
        },
      });
    }

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
    if (this.prisma?.message) {
      return this.prisma.message.findMany({
        where: { jid },
        orderBy: { createdAt: 'asc' },
      });
    }

    return this.prisma.messageHistory.findMany({
      where: { jid },
      orderBy: { creadoEn: 'asc' },
    });
  }
}

module.exports = PrismaMensajeRepositorio;
