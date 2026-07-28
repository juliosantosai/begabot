-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "jid" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "fechaEjecucion" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskLog" (
    "id" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "jid" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "fechaEjecucion" TIMESTAMP(3) NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoFinal" TEXT NOT NULL,
    "observacion" TEXT,

    CONSTRAINT "TaskLog_pkey" PRIMARY KEY ("id")
);
