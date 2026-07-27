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

async function acumularMensajeEnBuffer(remoteJid, messageBody, sender) {
  const tiempoBufferMs = parseInt(process.env.MESSAGE_BUFFER_MS || '5000', 10);
  const claveCache = `begabot:msg-buffer:${remoteJid}`;
  const claveLista = `begabot:msg-list:${remoteJid}`;
  const claveSender = `begabot:msg-sender:${remoteJid}`;

  console.log(`\n[🔄 FLUJO BUFFER] ========== ETAPA 1: ACUMULAR ==========`);
  console.log(`[1.1] Recibido POST para: ${remoteJid}`);
  console.log(`[1.2] Remitente: ${sender}`);
  console.log(`[1.3] Texto: "${messageBody}"`);
  console.log(`[1.4] Tiempo de buffer: ${tiempoBufferMs}ms`);

  try {
    const textoExistente = await redis.get(claveCache);
    let nuevoTextoAcumulado;
    let esPrimero = false;

    if (!textoExistente) {
      console.log(`[1.5] ✓ PRIMERA VEZ - Creando nuevo acumulador`);
      nuevoTextoAcumulado = messageBody;
      esPrimero = true;
    } else {
      console.log(`[1.5] ✓ NO ES PRIMERA - Texto existente: "${textoExistente}"`);
      nuevoTextoAcumulado = `${textoExistente} - ${messageBody}`;
    }
    console.log(`[1.6] Texto acumulado total: "${nuevoTextoAcumulado}"`);

    console.log(`[1.7] Guardando en Redis clave: ${claveCache}`);
    await redis.set(claveCache, nuevoTextoAcumulado, 'PX', tiempoBufferMs);
    await redis.set(claveSender, sender, 'PX', tiempoBufferMs);
    console.log(`[1.8] ✓ Guardado en Redis con TTL ${tiempoBufferMs}ms`);
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
    console.log(`[1.9] Programando vencimiento en ${retraso}ms`);
    const temporizador = setTimeout(() => {
      console.log(`\n[⏰ FLUJO BUFFER] ========== ETAPA 2: VENCIMIENTO ==========`);
      gestionarVencimientoBuffer(claveLista, remoteJid).catch((err) => console.error('[Redis Buffer] Error al gestionar el vencimiento del buffer:', err));
    }, retraso);
    temporizadoresBuffer.set(claveLista, temporizador);
    console.log(`[1.10] ✓ ACUMULACIÓN COMPLETADA\n`);

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
  if (raw === undefined || raw === null) return undefined;
  
  // Si es un número o booleano, conviértelo a string
  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw);
  }
  
  if (typeof raw === 'string') {
    // Si la string se parece a JSON (empieza con { o [), intenta parsearla
    if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
      try {
        const valor = JSON.parse(raw);
        return extraerTextoDesdeEstructura(valor);
      } catch (e) {
        return raw;
      }
    }
    // Si es una string simple, devuélvela tal cual
    return raw;
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
    console.log(`[2.1] ✓ Vencimiento disparado para: ${remoteJid}`);
    // Se lee y elimina la lista de forma atómica usando MULTI.
    const mensajes = await redis.lrange(claveLista, 0, -1);
    console.log(`[2.2] Mensajes en lista: ${mensajes.length}`);
    console.log(`[2.3] Contenido: ${JSON.stringify(mensajes)}`);
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
        
        // Handle primitives (numbers, booleans, strings)
        if (typeof parsed === 'string') {
          textoExtraido = parsed;
        } else if (typeof parsed === 'number' || typeof parsed === 'boolean') {
          textoExtraido = String(parsed);
        } else if (parsed && typeof parsed === 'object') {
          // Handle objects - search for known properties
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
        }
      } catch (e) {
        // No es JSON, se trata como texto plano.
        textoExtraido = mensajeCrudo;
      }

      if (textoExtraido && typeof textoExtraido === 'string' && textoExtraido.trim().length > 0) {
        partes.push(textoExtraido.trim());
      }
    }

    const textoFinal = partes.join(' ');
    console.log(`[2.4] Partes extraídas: ${partes.length}`);
    console.log(`[2.5] Texto final consolidado: "${textoFinal}"`);
    
    if (textoFinal && textoFinal.trim().length > 0) {
      console.log(`[2.6] ✓ Texto válido, procediendo a guardar y enviar`);
      console.log(textoFinal);
      try {
        await redis.set(`begabot:final:${remoteJid}`, textoFinal, 'PX', 40000);
        console.log(`[2.7] ✓ Guardado en Redis como final`);
      } catch (e) {
        console.error('[Redis Buffer] No se pudo almacenar la clave de texto final:', e && e.message ? e.message : e);
      }

        if (urlWebhookBuffer) {
        const sender = await redis.get(`begabot:msg-sender:${remoteJid}`) || remoteJid;
        console.log(`\n[📤 FLUJO BUFFER] ========== ETAPA 3: ENVIAR WEBHOOK ==========`);
        console.log(`[3.1] URL destino: ${urlWebhookBuffer}`);
        await publicarResultadoBuffer(urlWebhookBuffer, {
          sender,
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
    console.log(`[3.2] Preparando payload:`);
    console.log(`[3.2.1] Remitente: ${data.sender}`);
    console.log(`[3.2.2] Acumulado: "${data.accumulatedText}"`);
    console.log(`[3.2.3] Timestamp: ${data.timestamp}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    console.log(`[3.3] Respuesta HTTP: ${response.status}`);
    if (!response.ok) {
      throw new Error(`Webhook POST falló con estado ${response.status}`);
    }

    console.log(`[3.4] ✓ Webhook POST exitoso a: ${url}`);
    console.log(`[✅ FLUJO COMPLETADO]\n`);
  } catch (err) {
    console.error(`[❌ ERROR EN WEBHOOK] ${err && err.message ? err.message : err}`);
    console.error(`[ERROR COMPLETO] ${JSON.stringify(err)}`);
  }
}

module.exports = {
  acumularMensajeEnBuffer,
  redis
};
