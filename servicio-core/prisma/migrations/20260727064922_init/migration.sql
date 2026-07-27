-- CreateTable
CREATE TABLE "MessageHistory" (
    "id" TEXT NOT NULL,
    "jid" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "isFromClient" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionApiConfig" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "serverUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "instancia" TEXT NOT NULL,
    "negocioNombre" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EvolutionApiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstadoConversacion" (
    "uuid" TEXT NOT NULL,
    "jid" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "contexto" JSONB NOT NULL DEFAULT '{}',
    "numero" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EstadoConversacion_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "EvolutionApiConfig_sender_key" ON "EvolutionApiConfig"("sender");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_sender_key" ON "Prompt"("sender");

-- CreateIndex
CREATE UNIQUE INDEX "EstadoConversacion_jid_sender_key" ON "EstadoConversacion"("jid", "sender");
