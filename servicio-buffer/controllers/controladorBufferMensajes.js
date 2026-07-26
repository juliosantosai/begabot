const Redis = require('ioredis');

const urlRedis = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const urlWebhookBuffer = process.env.BUFFER_WEBHOOK_URL || process.env.BUFFER_DESTINATION_URL;
const redis = new Redis(urlRedis, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 1
});

// Temporizadores en memoria para vaciar el buffer por remoteJid mientras el proceso siga activo.
const temporizadoresBuffer = new Map();

redis.on('error', (err) => {
  console.error('[Redis Buffer] Error de conexión:', err.message);
});

async function acumularMensajeEnBuffer(remoteJid, messageBody) {
  const tiempoBufferMs = parseInt(process.env.MESSAGE_BUFFER_MS || '5000', 10);
  const claveCache = `begabot:msg-buffer:${remoteJid}`;
  const claveLista = `begabot:msg-list:${remoteJid}`;

  try {
    const textoExistente = await redis.get(claveCache);
    let nuevoTextoAcumulado;
    let esPrimero = false;

    if (!textoExistente) {
      nuevoTextoAcumulado = messageBody;
      esPrimero = true;
    } else {
      nuevoTextoAcumulado = `${textoExistente} - ${messageBody}`;
    }

    await redis.set(claveCache, nuevoTextoAcumulado, 'PX', tiempoBufferMs);
    // También se añade solo el texto conversacional extraído a una lista para poder recuperarlo al expirar.
    try {
      const textoExtraido = extraerTextoDesdeCrudo(messageBody);
      if (textoExtraido && textoExtraido.trim().length > 0) {
        try {
          const ultimo = await redis.lindex(claveLista, -1);
          if (ultimo !== textoExtraido) {
            await redis.rpush(claveLista, textoExtraido);
            await redis.pexpire(claveLista, tiempoBufferMs);
          }
        } catch (e) {
          // Si falla, se intenta volver a guardar el texto.
          await redis.rpush(claveLista, textoExtraido);
          await redis.pexpire(claveLista, tiempoBufferMs);
        }
      }
    } catch (e) {
      console.error('[Redis Buffer] No se pudo agregar el texto a la lista:', e && e.message ? e.message : e);
    }

    try {
      await redis.pttl(claveCache);
    } catch (e) {
      // Se ignora el error de TTL.
    }

    // Siempre se reprograma un temporizador para vaciar el buffer tras el último mensaje.
    if (temporizadoresBuffer.has(claveLista)) {
      clearTimeout(temporizadoresBuffer.get(claveLista));
      temporizadoresBuffer.delete(claveLista);
    }
    const retraso = Math.max(50, tiempoBufferMs - 200);
    const temporizador = setTimeout(() => {
      gestionarVencimientoBuffer(claveLista, remoteJid).catch((err) => console.error('[Redis Buffer] Error al gestionar el vencimiento del buffer:', err));
    }, retraso);
    temporizadoresBuffer.set(claveLista, temporizador);

    return {
      accumulatedText: nuevoTextoAcumulado,
      isFirst: esPrimero,
      bufferTimeMs: tiempoBufferMs
    };
  } catch (error) {
    console.error('[Redis Buffer] Fallo al acumular (Modo Fail-Open):', error && error.message ? error.message : error);
    return {
      accumulatedText: messageBody,
      isFirst: true,
      bufferTimeMs: tiempoBufferMs
    };
  }
}

function extraerTextoDesdeCrudo(raw) {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    try {
      const valor = JSON.parse(raw);
      return extraerTextoDesdeEstructura(valor);
    } catch (e) {
      return raw;
    }
  }
  if (typeof raw === 'object') return extraerTextoDesdeEstructura(raw);
  return undefined;
}

function extraerTextoDesdeEstructura(parsed) {
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

async function gestionarVencimientoBuffer(claveLista, remoteJid) {
  try {
    // Se lee y elimina la lista de forma atómica usando MULTI.
    const mensajes = await redis.lrange(claveLista, 0, -1);
    await redis.del(claveLista);
    temporizadoresBuffer.delete(claveLista);

    if (!mensajes || mensajes.length === 0) {
      return;
    }

    // Se intenta extraer el texto conversacional humano de cada mensaje.
    const partes = [];
    for (const mensajeCrudo of mensajes) {
      if (!mensajeCrudo) continue;
      let textoExtraido = null;
      try {
        const parsed = JSON.parse(mensajeCrudo);
        if (parsed.conversation) textoExtraido = parsed.conversation;
        else if (parsed.text) textoExtraido = parsed.text;
        else if (parsed.message) textoExtraido = parsed.message;
        else if (parsed.body) textoExtraido = parsed.body;
        else if (parsed.data) {
          if (typeof parsed.data === 'string') textoExtraido = parsed.data;
          else if (parsed.data.conversation) textoExtraido = parsed.data.conversation;
          else if (parsed.data.text) textoExtraido = parsed.data.text;
          else if (parsed.data.message) textoExtraido = parsed.data.message;
          else if (parsed.data.body) textoExtraido = parsed.data.body;
        }
      } catch (e) {
        // No es JSON, se trata como texto plano.
        textoExtraido = mensajeCrudo;
      }

      if (textoExtraido && typeof textoExtraido === 'string' && textoExtraido.trim().length > 0) partes.push(textoExtraido.trim());
    }

    const textoFinal = partes.join(' ');
    if (textoFinal && textoFinal.trim().length > 0) {
      console.log(textoFinal);
      try {
        await redis.set(`begabot:final:${remoteJid}`, textoFinal, 'PX', 60000);
      } catch (e) {
        console.error('[Redis Buffer] No se pudo almacenar la clave de texto final:', e && e.message ? e.message : e);
      }

      if (urlWebhookBuffer) {
        await publicarResultadoBuffer(urlWebhookBuffer, {
          remoteJid,
          accumulatedText: textoFinal,
          timestamp: new Date().toISOString(),
        });
      }
    }
    try {
      const claveCache = `begabot:msg-buffer:${remoteJid}`;
      await redis.del(claveCache);
    } catch (e) {
      // Se ignora el error al limpiar el cache.
    }
  } catch (err) {
    console.error('[Redis Buffer] Error al vaciar el buffer para', remoteJid, err && err.message ? err.message : err);
  }
}

async function publicarResultadoBuffer(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Webhook POST falló con estado ${response.status}`);
    }

    console.log('[Redis Buffer] Webhook POST exitoso:', url);
  } catch (err) {
    console.error('[Redis Buffer] No se pudo publicar el resultado del buffer al webhook:', err && err.message ? err.message : err);
  }
}

module.exports = {
  acumularMensajeEnBuffer,
  redis
};
