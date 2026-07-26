class Empresa {
  constructor({ id, name, sender, status = 'active_trial', businessTemplateId = null }) {
    this.id = id;
    this.name = name;
    this.sender = sender;
    this.status = status;
    this.businessTemplateId = businessTemplateId;
  }

  static crear({ name, sender }) {
    if (!name || !sender) {
      throw new Error('El nombre y el sender son obligatorios.');
    }

    return new Empresa({
      name,
      sender,
      status: 'active_trial',
    });
  }

  cambiarEstado(nuevoEstado) {
    this.status = nuevoEstado;
    return this;
  }
}

module.exports = Empresa;
