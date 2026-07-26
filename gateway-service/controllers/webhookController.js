const {
  processIncomingWebhook: normalizeWebhookPayload,
  resolveIncomingPayload,
} = require('./payloadNormalizerController');
const { validateTenantAndTrial } = require('./tenantValidatorController');
const { createRedisClient } = require('../lib/redisClient');

let redisClient;
let redisAvailable = true;
let checkBufferMessageFn = bufferMessage;
const bufferTimers = new Map();
const bufferState = new Map();
let bufferFlushHandler = null;

function timeoutPromise(promise, ms) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Redis timeout')), ms);
  });
  return Promise.race([promise.finally(() => clearTimeout(timeoutId)), timeout]);
}

function getMessageBufferMs() {
  const configuredMs = parseInt(process.env.MESSAGE_BUFFER_MS ?? '', 10);
  return Number.isFinite(configuredMs) && configuredMs > 0 ? configuredMs : null;
}

function getRedisClient() {
  if (!redisAvailable) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  redisClient = createRedisClient();
  return redisClient;
}

async function ensureRedisConnected(client) {
  if (!client) {
    return false;
  }

  if (client.status === 'ready') {
    return true;
  }

  try {
    const redisTimeoutMs = require('../lib/redisClient').getRedisTimeoutMs();
    await timeoutPromise(client.connect(), redisTimeoutMs);
    return client.status === 'ready';
  } catch (error) {
    console.error('[Buffer Redis] No se pudo conectar a Redis:', error.message || error);
    redisAvailable = false;
    return false;
  }
}

async function disconnectRedis() {
  if (!redisClient) {
    return;
  }

  try {
    if (redisClient.status === 'ready') {
      await redisClient.quit();
    } else {
      redisClient.disconnect();
    }
  } catch (error) {
    console.error('[Buffer Redis] Error al desconectar Redis:', error.message || error);
  } finally {
    redisClient = null;
    redisAvailable = true;
  }
}

function getBufferKey(remoteJid) {
  return remoteJid ? `begabot:user-buffer:${remoteJid}` : null;
}

async function flushBuffer(cacheKey) {
  const state = bufferState.get(cacheKey);
  if (!state) {
    return;
  }

  clearTimeout(bufferTimers.get(cacheKey));
  bufferTimers.delete(cacheKey);
  bufferState.delete(cacheKey);

  const combinedText = state.combinedText;
  const normalizedData = {
    ...state.lastNormalizedData,
    messageBody: combinedText,
    messageId: state.messageIds.join('-') || state.lastNormalizedData.messageId,
  };

  console.log('[Buffer] Expiró el timer de buffer, procesando texto concatenado', {
    cacheKey,
    combinedText,
    messageIds: state.messageIds,
  });

  if (typeof bufferFlushHandler === 'function') {
    try {
      bufferFlushHandler({ remoteJid: state.remoteJid, combinedText, normalizedData });
    } catch (error) {
      console.error('[Buffer] Error en bufferFlushHandler:', error.message || error);
    }
  }

  try {
    const tenantResult = await validateTenantAndTrial(normalizedData);

    if (!tenantResult.isValid) {
      console.log(`[PIPELINE BUFFER FLUSH] Tenant inválido para canal: ${normalizedData.remoteJid || normalizedData.rawPayload?.sender}`);
      return;
    }

    console.log(`[PIPELINE BUFFER FLUSH] Empresa ${tenantResult.companyId} validada correctamente.`);
    console.log('[PIPELINE BUFFER FLUSH] Mensaje procesado con texto concatenado', {
      companyId: tenantResult.companyId,
      messageBody: normalizedData.messageBody,
      messageId: normalizedData.messageId,
      remoteJid: normalizedData.remoteJid,
    });
  } catch (error) {
    console.error('[PIPELINE BUFFER FLUSH] Error interno en el procesamiento:', error);
  }
}

async function bufferMessage(normalizedData) {
  const remoteJid = normalizedData?.remoteJid
    || normalizedData?.rawPayload?.data?.key?.remoteJid
    || normalizedData?.rawPayload?.key?.remoteJid;
  const cacheKey = getBufferKey(remoteJid);
  const ttlMs = getMessageBufferMs();

  if (!cacheKey) {
    console.warn('[Buffer] Ningún remoteJid disponible para buffer', {
      normalizedData: normalizedData && typeof normalizedData === 'object' ? Object.keys(normalizedData) : normalizedData,
    });
    return { isHeld: false, normalizedData, warning: 'No hay remoteJid para buffer' };
  }

  if (!ttlMs) {
    return { isHeld: false, normalizedData };
  }

  const existingState = bufferState.get(cacheKey);
  if (!existingState) {
    const combinedText = normalizedData.messageBody || '';
    const timer = setTimeout(() => {
      flushBuffer(cacheKey);
    }, ttlMs);

    bufferState.set(cacheKey, {
      remoteJid,
      combinedText,
      messageIds: [normalizedData.messageId],
      lastNormalizedData: normalizedData,
    });
    bufferTimers.set(cacheKey, timer);

    console.log('[Buffer] Iniciado buffer para remoteJid', { cacheKey, ttlMs, combinedText });
    return { isHeld: true, normalizedData, status: 'BUFFER_HELD', combinedText };
  }

  existingState.combinedText = existingState.combinedText
    ? `${existingState.combinedText}-${normalizedData.messageBody || ''}`
    : normalizedData.messageBody || '';
  existingState.messageIds.push(normalizedData.messageId);
  existingState.lastNormalizedData = normalizedData;

  console.log('[Buffer] Actualizando buffer para remoteJid', {
    cacheKey,
    combinedText: existingState.combinedText,
    messageIds: existingState.messageIds,
  });

  return {
    isHeld: true,
    normalizedData,
    status: 'BUFFER_HELD',
    combinedText: existingState.combinedText,
  };
}

function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  }

  return res.sendStatus(400);
}

async function receiveWebhook(req, res) {
  const { body, headers } = req;


  const allowedApiKeys = [process.env.EVOLUTION_API_KEY]
    .concat((process.env.ALLOWED_EVOLUTION_API_KEYS || '').split(',').map((value) => value.trim()).filter(Boolean))
    .filter(Boolean);

  const authorizationHeader = headers?.authorization || headers?.Authorization;
  const rawBody = body && typeof body === 'object' ? body : {};
  const payloadToProcess = resolveIncomingPayload(rawBody) || rawBody;

  const receivedApiKey = headers?.['x-api-key'] || headers?.['x-evolution-api-key'] ||
    (authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : authorizationHeader) ||
    rawBody?.apikey || rawBody?.apiKey || rawBody?.EVOLUTION_API_KEY || rawBody?.evolution_api_key ||
    rawBody?.body?.apikey || rawBody?.body?.apiKey || rawBody?.body?.EVOLUTION_API_KEY || rawBody?.body?.evolution_api_key ||
    payloadToProcess?.apikey || payloadToProcess?.apiKey || payloadToProcess?.EVOLUTION_API_KEY || payloadToProcess?.evolution_api_key ||
    payloadToProcess?.body?.apikey || payloadToProcess?.body?.apiKey || payloadToProcess?.body?.EVOLUTION_API_KEY || payloadToProcess?.body?.evolution_api_key;

  const isPayloadValid = payloadToProcess && typeof payloadToProcess === 'object' && Object.keys(payloadToProcess).length > 0;

 
  if (allowedApiKeys.length > 0) {
    if (!receivedApiKey) {
      console.log('API key faltante');
      return res.status(401).json({ error: 'API key faltante' });
    }

    if (!allowedApiKeys.includes(receivedApiKey)) {
      console.log('API key inválida');
      return res.status(401).json({ error: 'API key inválida' });
    }
  }

  if (isPayloadValid) {
    try {
      const normalizedData = normalizeWebhookPayload(payloadToProcess);

      if (!normalizedData) {
        return res.status(400).json({ error: 'No se pudo normalizar el payload del webhook' });
      }

      if (normalizedData.ignored) {
        console.log(`[PIPELINE] Mensaje descartado por filtro perimetral: ${normalizedData.reason}`);
        return res.status(200).json({ status: normalizedData.reason });
      }

      const bufferResult = await checkBufferMessageFn(normalizedData);
      if (bufferResult?.isHeld) {
        console.log(`[PIPELINE] Mensaje retenido en buffer: ${normalizedData.messageId || normalizedData.remoteJid}`);
        return res.status(200).json({
          status: 'BUFFER_HELD',
          messageId: normalizedData.messageId,
          remoteJid: normalizedData.remoteJid,
        });
      }

      const tenantResult = await validateTenantAndTrial(normalizedData);
      if (!tenantResult.isValid) {
        console.log(`[PIPELINE] Tenant inválido para canal: ${normalizedData.remoteJid || normalizedData.rawPayload?.sender}`);
        return res.status(200).json({
          status: tenantResult.error,
          message: tenantResult.message,
        });
      }

      console.log(`[PIPELINE] Empresa ${tenantResult.companyId} validada correctamente.`);
      console.log('[PIPELINE] Mensaje único procesado correctamente', {
        companyId: tenantResult.companyId,
        messageId: normalizedData.messageId,
      });
      return res.status(200).json({
        status: 'EVENT_RECEIVED_NORMALIZED_CHECKED_AND_TENANT_VALIDATED',
        companyId: tenantResult.companyId,
        data: tenantResult.normalizedData,
      });
    } catch (error) {
      console.error('[PIPELINE ERROR] Error interno en la tubería:', error);
      return res.status(500).json({ error: 'Error interno en el procesamiento' });
    }
  }

  return res.status(404).json({ error: 'Evento no soportado' });
}

module.exports = {
  verifyWebhook,
  receiveWebhook,
  bufferMessage,
  disconnectRedis,
  setBufferChecker(fn = bufferMessage) {
    checkBufferMessageFn = fn;
  },
  setBufferFlushHandler(fn) {
    bufferFlushHandler = fn;
  },
};
