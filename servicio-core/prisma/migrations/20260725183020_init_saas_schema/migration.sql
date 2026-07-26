-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active_trial',
    "botConfigId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotConfig" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',

    CONSTRAINT "BotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSession" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "contextJson" JSONB,

    CONSTRAINT "ConversationSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_sender_key" ON "Company"("sender");

-- CreateIndex
CREATE UNIQUE INDEX "BotConfig_templateName_key" ON "BotConfig"("templateName");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationSession_companyId_remoteJid_key" ON "ConversationSession"("companyId", "remoteJid");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_botConfigId_fkey" FOREIGN KEY ("botConfigId") REFERENCES "BotConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationSession" ADD CONSTRAINT "ConversationSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
