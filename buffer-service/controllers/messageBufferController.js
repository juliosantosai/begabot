const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 1
});

// In-memory timers to trigger buffer flush per remoteJid while process is up.
const bufferTimers = new Map();

redis.on('error', (err) => {
  console.error('[Redis Buffer] Error de conexión:', err.message);
});


async function accumulateMessageInBuffer(remoteJid, messageBody) {
  const bufferTimeMs = parseInt(process.env.MESSAGE_BUFFER_MS || '5000', 10);
  const cacheKey = `begabot:msg-buffer:${remoteJid}`;
  const listKey = `begabot:msg-list:${remoteJid}`;

  try {
    const existingText = await redis.get(cacheKey);
    let newAccumulatedText;
    let isFirst = false;

    if (!existingText) {
      newAccumulatedText = messageBody;
      isFirst = true;
    } else {
      newAccumulatedText = `${existingText} - ${messageBody}`;
    }

    const setResult = await redis.set(cacheKey, newAccumulatedText, 'PX', bufferTimeMs);
    // Also append only extracted conversational text to a list to allow extraction on expiry
    try {
      const extractedForList = extractTextFromRaw(messageBody);
      if (extractedForList && extractedForList.trim().length > 0) {
        try {
          const last = await redis.lindex(listKey, -1);
          if (last === extractedForList) {
            // skip duplicate consecutive
          } else {
            await redis.rpush(listKey, extractedForList);
            await redis.pexpire(listKey, bufferTimeMs);
          }
        } catch (e) {
          // on error, still attempt to push
          await redis.rpush(listKey, extractedForList);
          await redis.pexpire(listKey, bufferTimeMs);
        }
      } else {
        // no conversational text extracted; nothing to push
      }
    } catch (e) {
      console.error('[Redis Buffer] Failed to push to list:', e && e.message ? e.message : e);
    }
    try {
      const pttl = await redis.pttl(cacheKey);
      // ignore
    } catch (e) {
      // ignore
    }

    // Always (re)schedule an in-process timer to flush the buffer after the last message
    if (bufferTimers.has(listKey)) {
      clearTimeout(bufferTimers.get(listKey));
      bufferTimers.delete(listKey);
    }
    const delay = Math.max(50, bufferTimeMs - 200);
    const t = setTimeout(() => {
      handleBufferExpiry(listKey, remoteJid).catch((err) => console.error('[Redis Buffer] handleBufferExpiry error:', err));
    }, delay);
    bufferTimers.set(listKey, t);

    return {
      accumulatedText: newAccumulatedText,
      isFirst,
      bufferTimeMs
    };
  } catch (error) {
    console.error('[Redis Buffer] Fallo al acumular (Modo Fail-Open):', error && error.message ? error.message : error);
    return {
      accumulatedText: messageBody,
      isFirst: true,
      bufferTimeMs
    };
  }
}

function extractTextFromRaw(raw) {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    try {
      const maybe = JSON.parse(raw);
      return extractTextFromParsed(maybe);
    } catch (e) {
      return raw;
    }
  }
  if (typeof raw === 'object') return extractTextFromParsed(raw);
  return undefined;
}

function extractTextFromParsed(parsed) {
  if (!parsed) return undefined;
  if (parsed.conversation) return parsed.conversation;
  if (parsed.text) return parsed.text;
  if (parsed.message) return parsed.message;
  if (parsed.body) return parsed.body;
  if (parsed.data) {
    if (typeof parsed.data === 'string') return parsed.data;
    if (parsed.data.conversation) return parsed.data.conversation;
    if (parsed.data.text) return parsed.data.text;
    if (parsed.data.message) return parsed.data.message;
    if (parsed.data.body) return parsed.data.body;
  }
  return undefined;
}


async function handleBufferExpiry(listKey, remoteJid) {
  try {
    // Read and delete the list atomically using MULTI
    const messages = await redis.lrange(listKey, 0, -1);
    await redis.del(listKey);
    bufferTimers.delete(listKey);

    if (!messages || messages.length === 0) {
      return;
    }

    // Attempt to extract human conversation text from each message entry
    const parts = [];
    for (const raw of messages) {
      if (!raw) continue;
      let extracted = null;
      try {
        const parsed = JSON.parse(raw);
        // common shapes
        if (parsed.conversation) extracted = parsed.conversation;
        else if (parsed.text) extracted = parsed.text;
        else if (parsed.message) extracted = parsed.message;
        else if (parsed.body) extracted = parsed.body;
        else if (parsed.data) {
          if (typeof parsed.data === 'string') extracted = parsed.data;
          else if (parsed.data.conversation) extracted = parsed.data.conversation;
          else if (parsed.data.text) extracted = parsed.data.text;
          else if (parsed.data.message) extracted = parsed.data.message;
          else if (parsed.data.body) extracted = parsed.data.body;
        }
      } catch (e) {
        // not JSON, treat as plain text
        extracted = raw;
      }

      if (extracted && typeof extracted === 'string' && extracted.trim().length > 0) parts.push(extracted.trim());
    }

    const finalText = parts.join(' ');
    if (finalText && finalText.trim().length > 0) {
      console.log(finalText);
      try {
        await redis.set(`begabot:final:${remoteJid}`, finalText, 'PX', 60000);
      } catch (e) {
        console.error('[Redis Buffer] Failed to store final text key:', e && e.message ? e.message : e);
      }
    }
    try {
      const cacheKey = `begabot:msg-buffer:${remoteJid}`;
      await redis.del(cacheKey);
    } catch (e) {
      // ignore
    }
  } catch (err) {
    console.error('[Redis Buffer] Error flushing buffer for', remoteJid, err && err.message ? err.message : err);
  }
}

module.exports = {
  accumulateMessageInBuffer,
  redis
};
