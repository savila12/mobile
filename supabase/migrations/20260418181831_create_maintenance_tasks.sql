-- Create maintenance_tasks table
create table if not exists public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  due_odometer integer,
  interval_miles integer,
  status text not null default 'upcoming' check (status in ('upcoming', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.maintenance_tasks enable row level security;

-- Create RLS policy: users can view their own vehicle's tasks
create policy "Users can view own vehicle tasks"
  on public.maintenance_tasks for select
  using (
    vehicle_id in (
      select id from public.vehicles where user_id = auth.uid()
    )
  );

-- Create RLS policy: users can insert tasks for their own vehicles
create policy "Users can insert own vehicle tasks"
  on public.maintenance_tasks for insert
  with check (
    vehicle_id in (
      select id from public.vehicles where user_id = auth.uid()
    )
  );

-- Create RLS policy: users can update tasks for their own vehicles
create policy "Users can update own vehicle tasks"
  on public.maintenance_tasks for update
  using (
    vehicle_id in (
      select id from public.vehicles where user_id = auth.uid()
    )
  );

-- Create RLS policy: users can delete tasks for their own vehicles
create policy "Users can delete own vehicle tasks"
  on public.maintenance_tasks for delete
  using (
    vehicle_id in (
      select id from public.vehicles where user_id = auth.uid()
    )
  );

-- Create index on vehicle_id for better query performance
create index idx_maintenance_tasks_vehicle_id on public.maintenance_tasks(vehicle_id);

-- Create index on user_id for better query performance
create index idx_maintenance_tasks_user_id on public.maintenance_tasks(user_id);

-- Create index on status for filtering upcoming tasks
create index idx_maintenance_tasks_status on public.maintenance_tasks(status);