const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureSeedData(sender) {
  const botConfig = await prisma.botConfig.upsert({
    where: { templateName: 'default' },
    update: {},
    create: {
      templateName: 'default',
      systemPrompt: 'Eres un asistente útil y profesional para el cliente.',
      aiModel: 'gpt-4o-mini',
    },
  });

  const company = await prisma.company.upsert({
    where: { sender },
    update: {
      name: 'Empresa Test',
      status: 'active_trial',
      botConfigId: botConfig.id,
    },
    create: {
      name: 'Empresa Test',
      sender,
      status: 'active_trial',
      botConfigId: botConfig.id,
    },
  });

  return { company, botConfig };
}

async function getCompanyContext(sender) {
  const { company, botConfig } = await ensureSeedData(sender);

  const companyWithConfig = await prisma.company.findUnique({
    where: { id: company.id },
    include: { botConfig: true },
  });

  return {
    company: companyWithConfig,
    botConfig: companyWithConfig?.botConfig || botConfig,
  };
}

async function buildBotPayload(sender, userMessage) {
  const { company, botConfig } = await getCompanyContext(sender);

  return {
    companyId: company.id,
    sender,
    companyName: company.name,
    status: company.status,
    systemPrompt: botConfig?.systemPrompt || 'Eres un asistente útil.',
    aiModel: botConfig?.aiModel || 'gpt-4o-mini',
    userMessage,
  };
}

async function main() {
  const sender = 'test-sender';
  const userMessage = 'Hola, necesito ayuda con mi bot.';

  const payload = await buildBotPayload(sender, userMessage);
  console.log(JSON.stringify(payload, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
