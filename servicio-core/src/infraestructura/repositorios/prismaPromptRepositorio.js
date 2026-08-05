const PromptRepositorio = require('../../dominio/puertos/promptRepositorio');

class PrismaPromptRepositorio extends PromptRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async guardar(prompt) {
    const where = { sender: prompt.sender };
    if (prompt.tenantId) where.tenantId = prompt.tenantId;
    const existente = await this.prisma.prompt.findFirst({ where });

    if (existente) {
      return this.prisma.prompt.update({
        where: { id: existente.id },
        data: {
          prompt: prompt.prompt,
          actualizadoEn: prompt.actualizadoEn,
        },
      });
    }

    return this.prisma.prompt.create({
      data: {
        id: prompt.id,
        tenantId: prompt.tenantId,
        sender: prompt.sender,
        prompt: prompt.prompt,
        creadoEn: prompt.creadoEn,
        actualizadoEn: prompt.actualizadoEn,
      },
    });
  }

  async buscarPorSender(sender, tenantId) {
    const where = { sender };
    if (tenantId) where.tenantId = tenantId;
    return this.prisma.prompt.findFirst({ where, orderBy: { version: 'desc' } });
  }

  async listarPorTenant(tenantId) {
    if (!tenantId) throw new Error('tenantId es requerido para listar prompts');
    return this.prisma.prompt.findMany({ where: { tenantId, isActive: true }, orderBy: { actualizadoEn: 'desc' } });
  }

  // Tenant-aware lookup: returns the latest active version for a tenant
  async buscarPorSenderYTenant(sender, tenantId) {
    if (!tenantId) throw new Error('tenantId es requerido para buscar prompts por tenant');
    return this.prisma.prompt.findFirst({
      where: { sender, tenantId, isActive: true },
      orderBy: { version: 'desc' },
    });
  }

  // Create new version for a prompt scoped to tenant
  async guardarConVersion({ sender, prompt }, tenantId) {
    if (!tenantId) throw new Error('tenantId es requerido para guardar prompts');

    return this.prisma.$transaction(async (tx) => {
      const ultimo = await tx.prompt.findFirst({
        where: { tenantId, sender },
        orderBy: { version: 'desc' },
      });

      const nuevaVersion = (ultimo?.version || 0) + 1;

      // deactivate previous active versions
      await tx.prompt.updateMany({
        where: { tenantId, sender, isActive: true },
        data: { isActive: false },
      });

      return tx.prompt.create({
        data: {
          tenantId,
          sender,
          prompt,
          version: nuevaVersion,
          isActive: true,
          previousPromptId: ultimo ? ultimo.id : null,
        },
      });
    });
  }

  // Rollback to a specific version: activate the requested version and deactivate others
  async rollback(tenantId, sender, version) {
    if (!tenantId) throw new Error('tenantId es requerido para rollback');
    if (!version) throw new Error('version es requerido para rollback');

    return this.prisma.$transaction(async (tx) => {
      const target = await tx.prompt.findFirst({ where: { tenantId, sender, version } });
      if (!target) throw new Error('version no encontrada');

      await tx.prompt.updateMany({ where: { tenantId, sender, isActive: true }, data: { isActive: false } });
      await tx.prompt.update({ where: { id: target.id }, data: { isActive: true } });

      const activo = await tx.prompt.findFirst({ where: { tenantId, sender, isActive: true } });
      return activo;
    });
  }
}

module.exports = PrismaPromptRepositorio;
