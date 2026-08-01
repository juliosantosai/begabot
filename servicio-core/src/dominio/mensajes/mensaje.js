class Mensaje {
  constructor({ jid, texto, isFromClient, source, creadoEn = new Date() }) {
    if (!jid || typeof jid !== 'string') {
      throw new Error('El jid es obligatorio.');
    }

    const textoNormalizado = typeof texto === 'string'
      ? texto
      : texto === undefined || texto === null
        ? ''
        : String(texto);

    const textoConPrefijo = typeof texto === 'number' || typeof texto === 'boolean'
      ? `quiero ${textoNormalizado}`
      : textoNormalizado;

    if (!textoConPrefijo.trim()) {
      throw new Error('El texto es obligatorio.');
    }

    if (typeof isFromClient !== 'boolean') {
      throw new Error('isFromClient debe ser booleano.');
    }

    if (!source || typeof source !== 'string') {
      throw new Error('source es obligatorio.');
    }

    this.jid = jid;
    this.texto = textoConPrefijo;
    this.isFromClient = isFromClient;
    this.source = source;
    this.creadoEn = creadoEn;
  }
}

module.exports = Mensaje;
