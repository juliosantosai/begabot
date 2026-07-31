const TareaRepositorio = require('../../dominio/puertos/tareaRepositorio');

class PrismaTareaRepositorio extends TareaRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async crear(tarea) {
    const { estadoConversacionUuid } = tarea;

    if (estadoConversacionUuid) {
      const existente = await this.prisma.task.findFirst({
        where: {
          estado: 'pendiente',
          eliminado: false,
          estadoConversacionUuid,
        },
        orderBy: { creadoEn: 'desc' },
      });

      if (existente) {
        return this.prisma.task.update({
          where: { id: existente.id },
          data: {
            estadoConversacionUuid,
            texto: tarea.texto,
            fechaEjecucion: tarea.fechaEjecucion,
            estado: 'pendiente',
            actualizadoEn: new Date(),
          },
        });
      }
    }

    return this.prisma.task.create({
      data: {
        id: tarea.id,
        estadoConversacionUuid,
        texto: tarea.texto,
        fechaEjecucion: tarea.fechaEjecucion,
        estado: tarea.estado,
      },
    });
  }

  async obtenerPorEstadoConversacionUuid(estadoConversacionUuid) {
    return this.prisma.task.findFirst({
      where: {
        estado: 'pendiente',
        eliminado: false,
        estadoConversacionUuid,
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async obtenerPorId(id) {
    return this.prisma.task.findUnique({ where: { id } });
  }

  async listarPendientes() {
    const ahora = new Date();
    return this.prisma.task.findMany({
      where: {
        estado: 'pendiente',
        eliminado: false,
        fechaEjecucion: { lte: ahora },
      },
      orderBy: { fechaEjecucion: 'asc' },
    });
  }

  async listarFuturas() {
    const ahora = new Date();
    return this.prisma.task.findMany({
      where: {
        estado: 'pendiente',
        eliminado: false,
        fechaEjecucion: { gt: ahora },
      },
      orderBy: { fechaEjecucion: 'asc' },
    });
  }

  async eliminarPorId(id) {
    // soft-delete: marcar eliminado y poner deletedAt
    return this.prisma.task.update({ where: { id }, data: { eliminado: true, deletedAt: new Date(), estado: 'eliminada' } });
  }

  async borrarTodos() {
    const deletedLogs = await this.prisma.taskLog.deleteMany({});
    const deletedTasks = await this.prisma.task.deleteMany({});
    return {
      deletedLogs: deletedLogs.count ?? deletedLogs,
      deletedTasks: deletedTasks.count ?? deletedTasks,
    };
  }

  async guardarLog(log) {
    return this.prisma.taskLog.create({
      data: {
        tareaId: log.tareaId,
        texto: log.texto,
        fechaEjecucion: log.fechaEjecucion,
        estadoFinal: log.estadoFinal,
        observacion: log.observacion,
      },
    });
  }
}

module.exports = PrismaTareaRepositorio;
