const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const mensajes = await prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    const sesiones = await prisma.sessionMemory.findMany({});

    console.log('Últimos mensajes (max 10):');
    mensajes.forEach((m) => console.log({ id: m.id, jid: m.jid, sender: m.sender, role: m.role, content: m.content, createdAt: m.createdAt }));

    console.log('\nSessionMemory:');
    sesiones.forEach((s) => console.log({ jid: s.jid, state_data: s.state_data, updatedAt: s.updatedAt }));
  } catch (err) {
    console.error('Error consultando DB:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
