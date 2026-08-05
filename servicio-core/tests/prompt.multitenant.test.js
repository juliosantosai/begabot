const test = require('node:test');
const assert = require('node:assert/strict');

const PrismaPromptRepositorio = require('../src/infraestructura/repositorios/prismaPromptRepositorio');

test('PrismaPromptRepositorio: versionado y rollback por tenant', async () => {
  // in-memory store
  const store = [];

  const mockPrisma = {
    prompt: {
      findFirst: async ({ where, orderBy } = {}) => {
        const matches = store.filter((p) => {
          if (where.tenantId && p.tenantId !== where.tenantId) return false;
          if (where.sender && p.sender !== where.sender) return false;
          if (where.version && p.version !== where.version) return false;
          if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
          return true;
        });
        if (!matches.length) return null;
        if (orderBy && orderBy.version === 'desc') {
          matches.sort((a, b) => b.version - a.version);
        }
        return matches[0];
      },
      findMany: async ({ where } = {}) => store.filter((p) => p.tenantId === where.tenantId),
      create: async ({ data }) => {
        const rec = { ...data };
        store.push(rec);
        return rec;
      },
      updateMany: async ({ where, data }) => {
        let updated = 0;
        for (const p of store) {
          if (p.tenantId === where.tenantId && p.sender === where.sender && p.isActive === where.isActive) {
            Object.assign(p, data);
            updated += 1;
          }
        }
        return { count: updated };
      },
      update: async ({ where, data }) => {
        const idx = store.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error('not found');
        Object.assign(store[idx], data);
        return store[idx];
      },
    },
    $transaction: async (fn) => {
      // provide tx with same prompt methods operating on same store
      const tx = mockPrisma;
      return fn(tx);
    },
  };

  const repo = new PrismaPromptRepositorio(mockPrisma);

  // create v1 for tenant-a
  const p1 = await repo.guardarConVersion({ sender: 's1', prompt: 'v1' }, 'tenant-a');
  assert.equal(p1.version, 1);
  assert.equal(p1.isActive, true);

  // create v2 for same tenant
  const p2 = await repo.guardarConVersion({ sender: 's1', prompt: 'v2' }, 'tenant-a');
  assert.equal(p2.version, 2);
  assert.equal(p2.isActive, true);

  // ensure previous deactivated
  const storedV1 = store.find((p) => p.version === 1 && p.tenantId === 'tenant-a');
  assert.equal(storedV1.isActive, false);

  // create v1 for different tenant
  const p3 = await repo.guardarConVersion({ sender: 's1', prompt: 'other' }, 'tenant-b');
  assert.equal(p3.version, 1);
  assert.equal(p3.tenantId, 'tenant-b');

  // rollback tenant-a to version 1
  const activo = await repo.rollback('tenant-a', 's1', 1);
  assert.equal(activo.version, 1);
  assert.equal(activo.isActive, true);

  // ensure tenant-b not affected
  const activeB = store.find((p) => p.tenantId === 'tenant-b' && p.isActive === true);
  assert.ok(activeB);
  assert.equal(activeB.version, 1);
});
