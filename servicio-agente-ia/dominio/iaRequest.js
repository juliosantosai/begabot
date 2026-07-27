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
    this.systemPrompt = systemPrompt || '';
    this.userText = userConcatenatedMessage || basePrompt || promptBase || userMessage || '';
    this.userContext = userContext || context || '';
    this.aiModel = aiModel;
    this.temperature = temperature;

    this.validate();
  }

  validate() {
    if (!this.systemPrompt || typeof this.systemPrompt !== 'string') {
      throw new Error('systemPrompt es obligatorio y debe ser un string');
    }

    if (!this.userText || typeof this.userText !== 'string') {
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
