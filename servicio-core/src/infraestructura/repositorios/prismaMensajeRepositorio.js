const MensajeRepositorio = require('../../dominio/puertos/mensajeRepositorio');

class PrismaMensajeRepositorio extends MensajeRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async guardar(mensaje) {
    const textoNormalizado = typeof mensaje?.texto === 'string'
      ? mensaje.texto
      : mensaje?.texto === undefined || mensaje?.texto === null
        ? ''
        : String(mensaje.texto);

    if (this.prisma?.message) {
      return this.prisma.message.create({
        data: {
          jid: mensaje.jid,
          sender: mensaje.sender || 'user',
          role: mensaje.role || 'user',
          content: textoNormalizado,
        },
      });
    }

    return this.prisma.messageHistory.create({
      data: {
        jid: mensaje.jid,
        texto: textoNormalizado,
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
