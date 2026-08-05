-- RLS policies for tenant isolation
-- WARNING: revisar en staging antes de aplicar en producción

-- Enable RLS on prompts and estado_conversaciones
ALTER TABLE IF EXISTS "prompts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "estado_conversaciones" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow access only to rows matching current tenant
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'prompts_tenant_isolation') THEN
    CREATE POLICY prompts_tenant_isolation ON "prompts"
      USING (tenant_id = current_setting('app.current_tenant')::text)
      WITH CHECK (tenant_id = current_setting('app.current_tenant')::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'estado_tenant_isolation') THEN
    CREATE POLICY estado_tenant_isolation ON "estado_conversaciones"
      USING (tenant_id = current_setting('app.current_tenant')::text)
      WITH CHECK (tenant_id = current_setting('app.current_tenant')::text);
  END IF;
END$$;

-- Note: superuser or migration role required to create policies. Ensure application sets
-- the session parameter `app.current_tenant` per connection (see app middleware).
