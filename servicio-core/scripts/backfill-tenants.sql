-- Backfill and safe migration script for tenant fields
-- WARNING: revisar en un entorno de staging antes de aplicar en producción

-- Paso 1: Asegurar que las columnas existan permitiendo NULL temporalmente o con valor por defectomigración
ALTER TABLE IF EXISTS "prompts" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT DEFAULT 'default-tenant';
ALTER TABLE IF EXISTS "prompts" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS "prompts" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS "prompts" ADD COLUMN IF NOT EXISTS "previous_prompt_id" TEXT;

ALTER TABLE IF EXISTS "estado_conversaciones" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT DEFAULT 'default-tenant';

-- Paso 2: Backfill (Actualizar registros antiguos que no tengan tenant_id asignado)
UPDATE "prompts"
SET "tenant_id" = 'default-tenant'
WHERE "tenant_id" IS NULL;

UPDATE "estado_conversaciones"
SET "tenant_id" = 'default-tenant'
WHERE "tenant_id" IS NULL;

-- Paso 3: Aplicar restricciones de no nulabilidad una vez saneados los datos
ALTER TABLE IF EXISTS "prompts" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE IF EXISTS "estado_conversaciones" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Paso 4: Recrear índices y restricciones únicas compuestos por tenant_id
-- Ajusta los nombres de índices/constraints si tu esquema Prisma genera otros nombres
DROP INDEX IF EXISTS "prompts_sender_idx";
CREATE INDEX IF NOT EXISTS "prompts_tenant_id_sender_idx" ON "prompts"("tenant_id", "sender");

-- Asegurar unicidad por tenant, sender y versión (crear constraint si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prompts_tenant_sender_version_key'
  ) THEN
    ALTER TABLE "prompts" ADD CONSTRAINT "prompts_tenant_sender_version_key" UNIQUE ("tenant_id", "sender", "version");
  END IF;
END$$;

-- Nota: después de aplicar, generar la migración Prisma correspondiente con:
-- npx prisma migrate dev --name add_tenant_id_and_prompt_version
