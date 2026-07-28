const EstadoConversacionRepositorio = require('../../dominio/estadoConversacion/estadoConversacionRepositorio');
const EstadoConversacion = require('../../dominio/estadoConversacion/estadoConversacion');

class PrismaEstadoConversacionRepositorio extends EstadoConversacionRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async obtenerPorJidYSender(jid, sender) {
    const registro = await this.prisma.estadoConversacion.findFirst({
      where: { jid, sender },
    });
    if (!registro) return null;
    return new EstadoConversacion({
      uuid: registro.uuid,
      jid: registro.jid,
      sender: registro.sender,
      bloqueado: registro.bloqueado,
      contexto: registro.contexto,
      numero: registro.numero,
    });
  }

  async obtenerPorUuid(uuid) {
    const registro = await this.prisma.estadoConversacion.findUnique({
      where: { uuid },
    });
    if (!registro) return null;
    return new EstadoConversacion({
      uuid: registro.uuid,
      jid: registro.jid,
      sender: registro.sender,
      bloqueado: registro.bloqueado,
      contexto: registro.contexto,
      numero: registro.numero,
    });
  }

  async guardar(estadoConversacion) {
    const registro = estadoConversacion.toPlainObject();

    const existente = await this.prisma.estadoConversacion.findFirst({
      where: { jid: registro.jid, sender: registro.sender },
    });

    if (existente) {
      return this.prisma.estadoConversacion.update({
        where: { uuid: existente.uuid },
        data: {
          bloqueado: registro.bloqueado,
          contexto: registro.contexto,
          numero: registro.numero,
        },
      });
    }

    return this.prisma.estadoConversacion.create({
      data: {
        uuid: registro.uuid,
        jid: registro.jid,
        sender: registro.sender,
        bloqueado: registro.bloqueado,
        contexto: registro.contexto,
        numero: registro.numero,
      },
    });
  }

  async listarTodos() {
    const registros = await this.prisma.estadoConversacion.findMany();
    return registros.map((registro) => new EstadoConversacion({
      uuid: registro.uuid,
      jid: registro.jid,
      sender: registro.sender,
      bloqueado: registro.bloqueado,
      contexto: registro.contexto,
      numero: registro.numero,
    }));
  }
}

module.exports = PrismaEstadoConversacionRepositorio;
