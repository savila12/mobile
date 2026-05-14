-- This migration is intentionally additive.
-- The maintenance_tasks table and RLS policies are defined in
-- 20260413_autotrack_schema.sql. Keep only incremental indexes here.

create index if not exists idx_maintenance_tasks_vehicle_id on public.maintenance_tasks(vehicle_id);
create index if not exists idx_maintenance_tasks_user_id on public.maintenance_tasks(user_id);
create index if not exists idx_maintenance_tasks_status on public.maintenance_tasks(status);
