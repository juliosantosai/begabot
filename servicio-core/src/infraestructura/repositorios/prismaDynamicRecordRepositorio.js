class PrismaDynamicRecordRepositorio {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async obtenerPorUnique(tenantId, entityName, recordIdentifier) {
    if (!this.prisma?.dynamicRecord) return null;

    try {
      return await this.prisma.dynamicRecord.findUnique({ where: { tenantId_entityName_recordIdentifier: { tenantId, entityName, recordIdentifier } } });
    } catch (e) {
      return null;
    }
  }

  async guardar({ tenantId, entityName, recordIdentifier, data }) {
    if (!this.prisma?.dynamicRecord) return null;

    return this.prisma.dynamicRecord.upsert({
      where: { tenantId_entityName_recordIdentifier: { tenantId, entityName, recordIdentifier } },
      update: { data, updatedAt: new Date() },
      create: { tenantId, entityName, recordIdentifier, data, createdAt: new Date(), updatedAt: new Date() },
    });
  }
}

module.exports = PrismaDynamicRecordRepositorio;
