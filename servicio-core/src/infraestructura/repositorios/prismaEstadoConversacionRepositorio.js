const EstadoConversacionRepositorio = require('../../dominio/estadoConversacion/estadoConversacionRepositorio');
const EstadoConversacion = require('../../dominio/estadoConversacion/estadoConversacion');

class PrismaEstadoConversacionRepositorio extends EstadoConversacionRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async obtenerPorJidYSender(jid, sender, tenantId) {
    const where = { jid, sender };
    if (tenantId) where.tenantId = tenantId;
    const registro = await this.prisma.estadoConversacion.findFirst({ where });
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
    const registro = await this.prisma.estadoConversacion.findUnique({ where: { uuid } });
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

    const whereQuery = { jid: registro.jid, sender: registro.sender };
    if (registro.tenantId) whereQuery.tenantId = registro.tenantId;

    const existente = await this.prisma.estadoConversacion.findFirst({
      where: whereQuery,
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

    const createData = {
      uuid: registro.uuid,
      jid: registro.jid,
      sender: registro.sender,
      bloqueado: registro.bloqueado,
      contexto: registro.contexto,
      numero: registro.numero,
    };

    if (registro.tenantId) createData.tenantId = registro.tenantId;

    return this.prisma.estadoConversacion.create({
      data: createData,
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

  async listarPorTenant(tenantId, { jid, sender, take = 50 } = {}) {
    if (!tenantId) throw new Error('tenantId es requerido para listar estados');
    const where = { tenantId };
    if (jid) where.jid = jid;
    if (sender) where.sender = sender;
    const registros = await this.prisma.estadoConversacion.findMany({ where, orderBy: { uuid: 'desc' }, take });
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
