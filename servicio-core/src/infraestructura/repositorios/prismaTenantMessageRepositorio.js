class PrismaTenantMessageRepositorio {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async guardar({ tenantId, jid, role, content }) {
    if (!this.prisma?.messageTenant && !this.prisma?.message) return null;
    const client = this.prisma.messageTenant ? this.prisma.messageTenant : this.prisma.message;
    return client.create({ data: { tenantId, jid, role, content, createdAt: new Date() } });
  }

  async listarRecientes(tenantId, jid, limit = 10) {
    const client = this.prisma.messageTenant ? this.prisma.messageTenant : this.prisma.message;
    return client.findMany({ where: { tenantId, jid }, orderBy: { createdAt: 'desc' }, take: limit });
  }
}

module.exports = PrismaTenantMessageRepositorio;
