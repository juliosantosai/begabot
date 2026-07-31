class PrismaSessionMemoryRepositorio {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async obtenerPorJid(jid) {
    if (!this.prisma?.sessionMemory) {
      return null;
    }

    return this.prisma.sessionMemory.findUnique({
      where: { jid },
    });
  }

  async guardar(registro) {
    if (!this.prisma?.sessionMemory) {
      return registro;
    }

    return this.prisma.sessionMemory.upsert({
      where: { jid: registro.jid },
      update: {
        state_data: registro.state_data,
        updatedAt: new Date(),
      },
      create: {
        jid: registro.jid,
        state_data: registro.state_data,
        updatedAt: new Date(),
      },
    });
  }
}

module.exports = PrismaSessionMemoryRepositorio;
