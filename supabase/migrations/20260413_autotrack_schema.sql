create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  active_vehicle_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  make text not null,
  model text not null,
  trim text,
  color text,
  vin text,
  photo_url text,
  is_primary boolean not null default false,
  current_odometer integer not null default 0,
  unit_system text not null default 'imperial' check (unit_system in ('imperial', 'metric')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_year_check check (year between 1900 and extract(year from now())::int + 1),
  constraint vehicle_odometer_check check (current_odometer >= 0)
);

alter table public.profiles
  drop constraint if exists profiles_active_vehicle_id_fkey,
  add constraint profiles_active_vehicle_id_fkey foreign key (active_vehicle_id)
    references public.vehicles(id) on delete set null;

create table if not exists public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date timestamptz not null default now(),
  odometer integer not null,
  quantity numeric(10,3) not null,
  price_per_unit numeric(10,3) not null,
  total_cost numeric(12,2) not null,
  mpg numeric(8,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fuel_odometer_check check (odometer >= 0),
  constraint fuel_quantity_check check (quantity > 0),
  constraint fuel_price_check check (price_per_unit >= 0),
  constraint fuel_total_check check (total_cost >= 0)
);

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
  updated_at timestamptz not null default now(),
  constraint maintenance_due_odometer_check check (due_odometer is null or due_odometer >= 0),
  constraint maintenance_interval_check check (interval_miles is null or interval_miles > 0)
);

create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  event_type text not null check (event_type in ('maintenance', 'repair', 'fuel')),
  title text not null,
  date timestamptz not null default now(),
  odometer integer not null,
  cost numeric(12,2) not null default 0,
  notes text,
  photo_url text,
  source_ref_id uuid,
  created_at timestamptz not null default now(),
  constraint service_odometer_check check (odometer >= 0),
  constraint service_cost_check check (cost >= 0)
);

create table if not exists public.offline_sync_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  service_record_id uuid references public.service_records(id) on delete cascade,
  fuel_log_id uuid references public.fuel_logs(id) on delete cascade,
  file_path text not null,
  created_at timestamptz not null default now(),
  constraint service_attachments_ref_check check (service_record_id is not null or fuel_log_id is not null)
);

create index if not exists idx_vehicles_user_id on public.vehicles(user_id);
create index if not exists idx_vehicles_user_primary on public.vehicles(user_id, is_primary);
create index if not exists idx_fuel_logs_vehicle_date on public.fuel_logs(vehicle_id, date desc);
create index if not exists idx_fuel_logs_user_date on public.fuel_logs(user_id, date desc);
create index if not exists idx_maintenance_tasks_vehicle_status on public.maintenance_tasks(vehicle_id, status);
create index if not exists idx_maintenance_tasks_due_date on public.maintenance_tasks(due_date);
create index if not exists idx_service_records_vehicle_date on public.service_records(vehicle_id, date desc);
create index if not exists idx_service_records_user_date on public.service_records(user_id, date desc);
create index if not exists idx_sync_queue_user_status on public.offline_sync_queue(user_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at
before update on public.vehicles
for each row
execute function public.set_updated_at();

drop trigger if exists set_fuel_logs_updated_at on public.fuel_logs;
create trigger set_fuel_logs_updated_at
before update on public.fuel_logs
for each row
execute function public.set_updated_at();

drop trigger if exists set_maintenance_tasks_updated_at on public.maintenance_tasks;
create trigger set_maintenance_tasks_updated_at
before update on public.maintenance_tasks
for each row
execute function public.set_updated_at();

drop trigger if exists set_sync_queue_updated_at on public.offline_sync_queue;
create trigger set_sync_queue_updated_at
before update on public.offline_sync_queue
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.fuel_logs enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.service_records enable row level security;
alter table public.offline_sync_queue enable row level security;
alter table public.service_attachments enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
for insert with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "vehicles_select_own" on public.vehicles
for select using (user_id = auth.uid());

create policy "vehicles_insert_own" on public.vehicles
for insert with check (user_id = auth.uid());

create policy "vehicles_update_own" on public.vehicles
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "vehicles_delete_own" on public.vehicles
for delete using (user_id = auth.uid());

create policy "fuel_logs_select_own" on public.fuel_logs
for select using (user_id = auth.uid());

create policy "fuel_logs_insert_own" on public.fuel_logs
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid()
  )
);

create policy "fuel_logs_update_own" on public.fuel_logs
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "fuel_logs_delete_own" on public.fuel_logs
for delete using (user_id = auth.uid());

create policy "maintenance_tasks_select_own" on public.maintenance_tasks
for select using (user_id = auth.uid());

create policy "maintenance_tasks_insert_own" on public.maintenance_tasks
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid()
  )
);

create policy "maintenance_tasks_update_own" on public.maintenance_tasks
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "maintenance_tasks_delete_own" on public.maintenance_tasks
for delete using (user_id = auth.uid());

create policy "service_records_select_own" on public.service_records
for select using (user_id = auth.uid());

create policy "service_records_insert_own" on public.service_records
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid()
  )
);

create policy "service_records_update_own" on public.service_records
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "service_records_delete_own" on public.service_records
for delete using (user_id = auth.uid());

create policy "sync_queue_select_own" on public.offline_sync_queue
for select using (user_id = auth.uid());

create policy "sync_queue_insert_own" on public.offline_sync_queue
for insert with check (user_id = auth.uid());

create policy "sync_queue_update_own" on public.offline_sync_queue
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "service_attachments_select_own" on public.service_attachments
for select using (user_id = auth.uid());

create policy "service_attachments_insert_own" on public.service_attachments
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('service-attachments', 'service-attachments', true)
on conflict (id) do nothing;

create policy "attachments_upload_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'service-attachments'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "attachments_read_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'service-attachments'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "attachments_update_own" on storage.objects
for update to authenticated
using (
  bucket_id = 'service-attachments'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'service-attachments'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "attachments_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'service-attachments'
  and split_part(name, '/', 1) = auth.uid()::text
);
