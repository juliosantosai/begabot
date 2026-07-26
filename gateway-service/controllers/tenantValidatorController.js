/**
 * Validador provisional de Tenant y Auto-Registro sin BBDD externa.
 * Este modo simulado permite probar la ruta del webhook 100% sin PostgreSQL.
 */

async function validateTenantAndTrial(normalizedData) {
  const senderId = normalizedData?.rawPayload?.sender || normalizedData?.remoteJid;

  if (!senderId) {
    return {
      isValid: false,
      error: 'SENDER_MISSING',
      message: 'No se pudo identificar el remitente o canal de origen.',
    };
  }

  const simulatedCompanyId = 'uuid-empresa-prueba-12345';
  console.log(`[MULTI-TENANT SIMULADO] Canal aceptado para pruebas: ${senderId}`);

  return {
    isValid: true,
    companyId: simulatedCompanyId,
    normalizedData,
  };
}

module.exports = {
  validateTenantAndTrial,
};
