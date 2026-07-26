function n8nAuth(req, res, next) {
  const expected = process.env.N8N_TOKEN;
  if (!expected) return next(); // no token configured, skip validation

  const provided = req.headers['x-n8n-token'] || req.headers['x-n8n-token'.toLowerCase()];
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Invalid N8N token' });
  }

  return next();
}

module.exports = n8nAuth;
