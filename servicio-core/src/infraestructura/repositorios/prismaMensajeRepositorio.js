const MensajeRepositorio = require('../../dominio/puertos/mensajeRepositorio');

class PrismaMensajeRepositorio extends MensajeRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async guardar(mensaje) {
    return this.prisma.messageHistory.create({
      data: {
        companyId: 'default-company',
        remoteJid: mensaje.jid,
        direction: mensaje.isFromClient ? 'incoming' : 'outgoing',
        messageBody: mensaje.texto,
      },
    });
  }

  async listarPorJid(jid) {
    return this.prisma.messageHistory.findMany({
      where: { remoteJid: jid },
      orderBy: { createdAt: 'asc' },
    });
  }
}

module.exports = PrismaMensajeRepositorio;
