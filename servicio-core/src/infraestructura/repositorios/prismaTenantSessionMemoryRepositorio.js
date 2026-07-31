class PrismaTenantSessionMemoryRepositorio {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async obtenerPorTenantYJid(tenantId, jid) {
    if (!this.prisma?.sessionMemoryTenant) {
      // attempt to access by mapped name if prisma client uses model map
      if (!this.prisma?.sessionMemory) return null;
    }

    // prefer the new model if available
    const client = this.prisma.sessionMemoryTenant ? this.prisma.sessionMemoryTenant : this.prisma.sessionMemory;

    try {
      return await client.findUnique({ where: { tenantId_jid: { tenantId, jid } } });
    } catch (e) {
      return null;
    }
  }

  async guardar({ tenantId, jid, memoryPatch }) {
    const client = this.prisma.sessionMemoryTenant ? this.prisma.sessionMemoryTenant : this.prisma.sessionMemory;
    // upsert with composite unique
    return client.upsert({
      where: { tenantId_jid: { tenantId, jid } },
      update: { memoryPatch: memoryPatch || {}, updatedAt: new Date() },
      create: { tenantId, jid, memoryPatch: memoryPatch || {}, createdAt: new Date(), updatedAt: new Date() },
    });
  }
}

module.exports = PrismaTenantSessionMemoryRepositorio;
