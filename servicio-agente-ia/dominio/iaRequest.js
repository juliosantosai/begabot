function normalizarString(valor) {
  if (valor === undefined || valor === null) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  if (typeof valor === 'object') {
    try {
      return JSON.stringify(valor);
    } catch (e) {
      return '';
    }
  }
  return '';
}

class IaRequest {
  constructor({
    systemPrompt,
    userConcatenatedMessage,
    basePrompt,
    promptBase,
    userMessage,
    userContext,
    context,
    aiModel,
    temperature,
  }) {
    this.systemPrompt = normalizarString(systemPrompt || '');
    this.userText = normalizarString(userConcatenatedMessage || basePrompt || promptBase || userMessage || '');
    this.userContext = normalizarString(userContext || context || '');
    this.aiModel = aiModel;
    this.temperature = temperature;

    this.validate();
  }

  validate() {
    if (!this.systemPrompt) {
      throw new Error('systemPrompt es obligatorio y debe ser un string');
    }

    if (!this.userText) {
      throw new Error('userConcatenatedMessage o su alias es obligatorio y debe ser un string');
    }
  }

  get contents() {
    const trimmedContext = String(this.userContext).trim();
    const trimmedText = String(this.userText).trim();

    if (trimmedContext) {
      return `${trimmedContext}\n\nUsuario:\n${trimmedText}`;
    }

    return trimmedText;
  }

  toLoggingPayload(responseText, tokens, latencyMs) {
    return {
      userQuery: this.contents,
      aiResponse: responseText,
      intent: 'general_assistant_intent',
      modelUsed: this.aiModel || 'models/gemini-3.1-flash-lite',
      promptTokens: tokens.promptTokenCount || 0,
      completionTokens: tokens.candidatesTokenCount || 0,
      latenciaMs: latencyMs,
    };
  }
}

module.exports = IaRequest;
