-- CreateTable
CREATE TABLE "MessageHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageHistory_companyId_remoteJid_idx" ON "MessageHistory"("companyId", "remoteJid");

-- AddForeignKey
ALTER TABLE "MessageHistory" ADD CONSTRAINT "MessageHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
