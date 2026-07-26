const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creando registro...');
  const company = await prisma.company.create({
    data: {
      name: 'Empresa Test',
      sender: 'test-sender',
    },
  });
  console.log('Registro creado:', company);

  console.log('Listando registros...');
  const companies = await prisma.company.findMany();
  console.log('Registros:', companies);

  console.log('Actualizando registro...');
  const updated = await prisma.company.update({
    where: { id: company.id },
    data: { name: 'Empresa Test Actualizada' },
  });
  console.log('Registro actualizado:', updated);

  console.log('Eliminando registro...');
  const deleted = await prisma.company.delete({
    where: { id: company.id },
  });
  console.log('Registro eliminado:', deleted);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { main };
