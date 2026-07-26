const Redis = require('ioredis');

function getRedisTimeoutMs() {
  const configuredMs = parseInt(process.env.REDIS_OPERATION_TIMEOUT_MS ?? '', 10);
  return Number.isFinite(configuredMs) && configuredMs > 0 ? configuredMs : 1000;
}

function createRedisClient() {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const redisTimeoutMs = getRedisTimeoutMs();

  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: redisTimeoutMs,
    commandTimeout: redisTimeoutMs,
  });

  client.on('error', (error) => {
    console.error('[Buffer Redis] Error de conexión o resolución:', error.message || error);
  });

  client.on('connect', () => {
    console.log('[Buffer Redis] Conectado a Redis:', redisUrl);
  });

  return client;
}

module.exports = {
  createRedisClient,
  getRedisTimeoutMs,
};
