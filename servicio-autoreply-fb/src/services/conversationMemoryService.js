const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl);

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildConversationMemoryKey(sender) {
  const safeSender = slugify(sender || 'unknown');
  return `begabot:autoreply:memory:${safeSender}`;
}

function mergeConversationContext(previousContext, currentData = {}) {
  previousContext = previousContext || {};
  const previousCount = Number(previousContext.messageCount || 0);
  const previousHistory = Array.isArray(previousContext.history) ? previousContext.history : [];
  const messageEntry = {
    message: currentData.message || null,
    timestamp: currentData.timestamp || new Date().toISOString(),
    detectedPhone: currentData.detectedPhone || null,
    source: currentData.source || null,
    isGroup: Boolean(currentData.isGroup),
  };
  const history = [...previousHistory, messageEntry].slice(-50);

  return {
    sender: currentData.sender || previousContext.sender || 'Sin nombre',
    messageCount: previousCount + 1,
    firstMessage: previousContext.firstMessage || currentData.message || previousContext.lastMessage || null,
    lastMessage: currentData.message || previousContext.lastMessage || null,
    lastTimestamp: messageEntry.timestamp,
    lastPhoneDetected: currentData.detectedPhone || previousContext.lastPhoneDetected || null,
    lastIntent: previousContext.lastIntent || previousContext.previousIntent || null,
    history,
    metadata: {
      ...previousContext.metadata,
      ...currentData.metadata,
    },
  };
}

async function getConversationMemory(sender) {
  const key = buildConversationMemoryKey(sender);
  const payload = await redis.get(key);
  if (!payload) return null;

  try {
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

async function saveConversationMemory(sender, context, ttlSeconds = 3600) {
  const key = buildConversationMemoryKey(sender);
  await redis.set(key, JSON.stringify(context), 'EX', ttlSeconds);
  return context;
}

async function deleteConversationMemory(sender) {
  const key = buildConversationMemoryKey(sender);
  await redis.del(key);
}

module.exports = {
  buildConversationMemoryKey,
  mergeConversationContext,
  getConversationMemory,
  saveConversationMemory,
  deleteConversationMemory,
};
