const test = require('node:test');
const assert = require('node:assert/strict');
const { createTenantAwarePrismaClient, withTenantContext } = require('../src/infraestructura/prisma/tenantContextPrisma');

test('aplica filtrado implícito por tenant en operaciones de Prisma', async () => {
  const stored = [];
  const prisma = createTenantAwarePrismaClient({
    dynamicRecord: {
      create: async (args) => {
        stored.push(args.data);
        return { tenantId: args.data.tenantId, data: args.data.data };
      },
      findMany: async (args) => {
        const tenantId = args.where?.tenantId;
        return stored.filter((item) => item.tenantId === tenantId).map((item) => ({ tenantId: item.tenantId, data: item.data }));
      },
    },
  });

  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';

  await withTenantContext(tenantA, async () => {
    await prisma.dynamicRecord.create({
      data: {
        entityName: 'cliente',
        recordIdentifier: 'cedula-1',
        data: { nombre: 'Ana' },
      },
    });
  });

  await withTenantContext(tenantB, async () => {
    await prisma.dynamicRecord.create({
      data: {
        entityName: 'cliente',
        recordIdentifier: 'cedula-2',
        data: { nombre: 'Luis' },
      },
    });
  });

  const records = await withTenantContext(tenantA, async () => {
    return prisma.dynamicRecord.findMany({
      where: { entityName: 'cliente' },
    });
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].tenantId, tenantA);
  assert.equal(records[0].data.nombre, 'Ana');
});
