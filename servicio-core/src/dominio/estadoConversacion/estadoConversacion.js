const { randomUUID } = require('crypto');

class EstadoConversacion {
  constructor({ uuid, jid, sender, bloqueado = false, contexto = {}, numero = 1 }) {
    if (!jid || typeof jid !== 'string') {
      throw new Error('jid es obligatorio y debe ser string');
    }
    if (!sender || typeof sender !== 'string') {
      throw new Error('sender es obligatorio y debe ser string');
    }

    this.uuid = uuid || randomUUID();
    this.jid = jid;
    this.sender = sender;
    this.bloqueado = Boolean(bloqueado);
    this.contexto = contexto || {};
    this.numero = Number.isInteger(numero) && numero > 0 ? numero : 1;
  }

  static crearNuevo(jid, sender) {
    return new EstadoConversacion({ uuid: randomUUID(), jid, sender, bloqueado: false, contexto: {}, numero: 1 });
  }

  incrementarNumero() {
    this.numero += 1;
    return this;
  }

  reiniciarNumero() {
    this.numero = 1;
    return this;
  }

  actualizarBloqueo(bloqueado) {
    this.bloqueado = Boolean(bloqueado);
    return this;
  }

  actualizarContexto(contexto) {
    this.contexto = contexto || {};
    return this;
  }

  toPlainObject() {
    return {
      uuid: this.uuid,
      jid: this.jid,
      sender: this.sender,
      bloqueado: this.bloqueado,
      contexto: this.contexto,
      numero: this.numero,
    };
  }
}

module.exports = EstadoConversacion;
