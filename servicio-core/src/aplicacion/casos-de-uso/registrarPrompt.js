const Prompt = require('../../dominio/prompts/prompt');

class RegistrarPrompt {
  constructor({ promptRepositorio }) {
    this.promptRepositorio = promptRepositorio;
  }

  // ejecutar accepts an object: { sender, prompt, tenantId }
  async ejecutar({ sender, prompt, tenantId } = {}) {
    const entidad = new Prompt({ sender, prompt });

    // If repository supports tenant-aware lookup, prefer that
    if (tenantId && typeof this.promptRepositorio.buscarPorSenderYTenant === 'function') {
      const existente = await this.promptRepositorio.buscarPorSenderYTenant(sender, tenantId);
      if (existente) {
        // if repository supports versioned save, use it
        if (typeof this.promptRepositorio.guardarConVersion === 'function') {
          return this.promptRepositorio.guardarConVersion({ sender, prompt: entidad.prompt }, tenantId);
        }

        return this.promptRepositorio.guardar({
          ...existente,
          prompt: entidad.prompt,
          actualizadoEn: entidad.actualizadoEn,
        });
      }

      // create new version scoped to tenant if supported
      if (typeof this.promptRepositorio.guardarConVersion === 'function') {
        return this.promptRepositorio.guardarConVersion({ sender, prompt: entidad.prompt }, tenantId);
      }

      return this.promptRepositorio.guardar({ ...entidad.toPlainObject(), tenantId });
    }

    // Fallback legacy behavior
    const existenteLegacy = await this.promptRepositorio.buscarPorSender(sender);
    if (existenteLegacy) {
      return this.promptRepositorio.guardar({
        ...existenteLegacy,
        prompt: entidad.prompt,
        actualizadoEn: entidad.actualizadoEn,
      });
    }

    return this.promptRepositorio.guardar(entidad.toPlainObject());
  }
}

module.exports = RegistrarPrompt;
