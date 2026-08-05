module.exports = function tenantScope(req, res, next) {
  const routeTenantId = req.params?.tenantId;
  const headerTenantId = req.headers['x-tenant-id'] || req.headers['x-tenantid'];
  const tokenTenantId = req.user && req.user.tenantId ? req.user.tenantId : null;

  const tenantId = routeTenantId || headerTenantId || tokenTenantId;

  if (!tenantId) {
    return res.status(400).json({ error: 'El parámetro tenantId es obligatorio' });
  }

  if (headerTenantId && routeTenantId && headerTenantId !== routeTenantId) {
    return res.status(400).json({ error: 'Conflicto de tenantId entre ruta y headers' });
  }

  req.tenantId = tenantId;
  next();
};
