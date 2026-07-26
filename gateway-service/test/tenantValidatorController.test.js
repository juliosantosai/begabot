const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTenantAndTrial } = require('../controllers/tenantValidatorController');

const originalTrialDays = process.env.TRIAL_DAYS;

test.after(() => {
  process.env.TRIAL_DAYS = originalTrialDays;
});

test('devuelve error cuando falta sender o remoteJid', async () => {
  const result = await validateTenantAndTrial({ rawPayload: {} });

  assert.equal(result.isValid, false);
  assert.equal(result.error, 'SENDER_MISSING');
  assert.equal(result.message, 'No se pudo identificar el remitente o canal de origen.');
});

test('crea un tenant nuevo en prueba y devuelve companyId válido', async () => {
  process.env.TRIAL_DAYS = '1';

  const normalizedData = {
    rawPayload: { sender: '595981133313@s.whatsapp.net' },
    remoteJid: '595981133313@s.whatsapp.net',
  };

  const result = await validateTenantAndTrial(normalizedData);

  assert.equal(result.isValid, true);
  assert.equal(result.normalizedData, normalizedData);
  assert.equal(typeof result.companyId, 'string');
  assert(result.companyId.length > 0, 'Debe retornar un companyId no vacío');
});
