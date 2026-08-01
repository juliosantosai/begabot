const { AsyncLocalStorage } = require('node:async_hooks');

const tenantContext = new AsyncLocalStorage();
const TENANT_SCOPED_MODELS = new Set(['tenantConfig', 'dynamicRecord', 'sessionMemoryTenant', 'messageTenant']);

function withTenantContext(tenantId, callback) {
  if (!tenantId) {
    return callback();
  }

  return tenantContext.run({ tenantId }, callback);
}

function getTenantContext() {
  return tenantContext.getStore() || {};
}

function applyTenantFilters(args = {}, tenantId, operation = 'default') {
  if (!tenantId || !args || typeof args !== 'object') {
    return args;
  }

  const nextArgs = { ...args };

  if (operation === 'create') {
    if (nextArgs.data && typeof nextArgs.data === 'object' && !Array.isArray(nextArgs.data)) {
      if (!Object.prototype.hasOwnProperty.call(nextArgs.data, 'tenantId')) {
        nextArgs.data = { ...nextArgs.data, tenantId };
      }
    }
    return nextArgs;
  }

  const where = nextArgs.where;

  if (where && typeof where === 'object' && !Array.isArray(where)) {
    const hasExplicitTenant = Object.prototype.hasOwnProperty.call(where, 'tenantId');
    if (!hasExplicitTenant) {
      nextArgs.where = { ...where, tenantId };
    }
  } else if (!where) {
    nextArgs.where = { tenantId };
  }

  if (nextArgs.data && typeof nextArgs.data === 'object' && !Array.isArray(nextArgs.data)) {
    if (!Object.prototype.hasOwnProperty.call(nextArgs.data, 'tenantId')) {
      nextArgs.data = { ...nextArgs.data, tenantId };
    }
  }

  if (nextArgs.create && typeof nextArgs.create === 'object' && !Array.isArray(nextArgs.create)) {
    if (!Object.prototype.hasOwnProperty.call(nextArgs.create, 'tenantId')) {
      nextArgs.create = { ...nextArgs.create, tenantId };
    }
  }

  if (nextArgs.update && typeof nextArgs.update === 'object' && !Array.isArray(nextArgs.update)) {
    if (!Object.prototype.hasOwnProperty.call(nextArgs.update, 'tenantId')) {
      nextArgs.update = { ...nextArgs.update, tenantId };
    }
  }

  return nextArgs;
}

function createTenantAwarePrismaClient(prismaClient) {
  if (!prismaClient || typeof prismaClient !== 'object') {
    throw new Error('Se requiere una instancia válida de PrismaClient');
  }

  const wrapModel = (modelName) => {
    const target = prismaClient[modelName];
    if (!target || typeof target !== 'object' || !TENANT_SCOPED_MODELS.has(modelName)) {
      return target;
    }

    return new Proxy(target, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') return value;

        return (...args) => {
          const store = getTenantContext();
          const tenantId = store.tenantId;
          const nextArgs = tenantId ? applyTenantFilters(args[0], tenantId, prop) : args[0];
          return value.call(target, nextArgs, ...args.slice(1));
        };
      },
    });
  };

  return new Proxy(prismaClient, {
    get(target, prop, receiver) {
      if (prop in target) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'object' && value !== null && prop !== '$transaction' && prop !== '$disconnect') {
          return wrapModel(prop);
        }
        return value;
      }
      return undefined;
    },
  });
}

module.exports = {
  withTenantContext,
  getTenantContext,
  createTenantAwarePrismaClient,
};
