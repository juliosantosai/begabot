-- CreateTable
CREATE TABLE "InteractionLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "intent" TEXT,
    "userQuery" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptPerformanceLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "botConfigId" TEXT,
    "modelUsed" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptPerformanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InteractionLog_companyId_remoteJid_idx" ON "InteractionLog"("companyId", "remoteJid");

-- CreateIndex
CREATE INDEX "InteractionLog_intent_idx" ON "InteractionLog"("intent");

-- CreateIndex
CREATE INDEX "PromptPerformanceLog_companyId_idx" ON "PromptPerformanceLog"("companyId");

-- CreateIndex
CREATE INDEX "PromptPerformanceLog_modelUsed_idx" ON "PromptPerformanceLog"("modelUsed");

-- AddForeignKey
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptPerformanceLog" ADD CONSTRAINT "PromptPerformanceLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptPerformanceLog" ADD CONSTRAINT "PromptPerformanceLog_botConfigId_fkey" FOREIGN KEY ("botConfigId") REFERENCES "BotConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
