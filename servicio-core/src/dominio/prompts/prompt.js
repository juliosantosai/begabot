const { generateUuid } = require('@begabot/shared');

class Prompt {
  constructor({ id = generateUuid(), sender, prompt, creadoEn = new Date(), actualizadoEn = new Date() }) {
    if (!sender || typeof sender !== 'string') {
      throw new Error('sender es obligatorio y debe ser string');
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('prompt es obligatorio y debe ser string');
    }

    this.id = id;
    this.sender = sender;
    this.prompt = prompt;
    this.creadoEn = creadoEn;
    this.actualizadoEn = actualizadoEn;
  }

  actualizarPrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('prompt es obligatorio y debe ser string');
    }

    this.prompt = prompt;
    this.actualizadoEn = new Date();
  }

  toPlainObject() {
    return {
      id: this.id,
      sender: this.sender,
      prompt: this.prompt,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}

module.exports = Prompt;
