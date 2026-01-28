-- Migration: Fix RLS for assets table
-- Date: 2026-01-28
-- Description: Allow 'Operativo' role to manage assets (insert/update/delete) because they have inventory permissions.

DROP POLICY IF EXISTS "Admin and Gerente can manage assets" ON assets;

CREATE POLICY "Authorized roles can manage assets" ON assets
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('Admin', 'Gerente', 'Operativo')
  )
);
