-- Single-statement RLS verification script compatible with `supabase db query --file`.
-- Pass condition: prints a NOTICE.
-- Fail condition: raises an EXCEPTION with table-by-table JSON details.

do $$
declare
  missing_rls jsonb;
  missing_policy_cmds jsonb;
  weak_policy_shapes jsonb;
  details jsonb;
begin
  with required_tables as (
    select unnest(array[
      'profiles',
      'vehicles',
      'fuel_logs',
      'maintenance_tasks',
      'service_records',
      'offline_sync_queue',
      'service_attachments'
    ]) as table_name
  ),
  missing as (
    select rt.table_name
    from required_tables rt
    left join pg_tables pt
      on pt.schemaname = 'public'
     and pt.tablename = rt.table_name
    where coalesce(pt.rowsecurity, false) = false
  )
  select coalesce(jsonb_agg(table_name order by table_name), '[]'::jsonb)
  into missing_rls
  from missing;

  with required_policy_commands as (
    select 'profiles'::text as table_name, 'SELECT'::text as cmd, true as requires_using, false as requires_with_check
    union all select 'profiles', 'INSERT', false, true
    union all select 'profiles', 'UPDATE', true, true

    union all select 'vehicles', 'SELECT', true, false
    union all select 'vehicles', 'INSERT', false, true
    union all select 'vehicles', 'UPDATE', true, true
    union all select 'vehicles', 'DELETE', true, false

    union all select 'fuel_logs', 'SELECT', true, false
    union all select 'fuel_logs', 'INSERT', false, true
    union all select 'fuel_logs', 'UPDATE', true, true
    union all select 'fuel_logs', 'DELETE', true, false

    union all select 'maintenance_tasks', 'SELECT', true, false
    union all select 'maintenance_tasks', 'INSERT', false, true
    union all select 'maintenance_tasks', 'UPDATE', true, true
    union all select 'maintenance_tasks', 'DELETE', true, false

    union all select 'service_records', 'SELECT', true, false
    union all select 'service_records', 'INSERT', false, true
    union all select 'service_records', 'UPDATE', true, true
    union all select 'service_records', 'DELETE', true, false

    union all select 'offline_sync_queue', 'SELECT', true, false
    union all select 'offline_sync_queue', 'INSERT', false, true
    union all select 'offline_sync_queue', 'UPDATE', true, true

    union all select 'service_attachments', 'SELECT', true, false
    union all select 'service_attachments', 'INSERT', false, true
  ),
  existing_policy_commands as (
    select
      tablename as table_name,
      upper(cmd) as cmd,
      bool_or(qual is not null) as has_using,
      bool_or(with_check is not null) as has_with_check
    from pg_policies
    where schemaname = 'public'
    group by tablename, upper(cmd)
  ),
  missing_cmd as (
    select rpc.table_name, rpc.cmd
    from required_policy_commands rpc
    left join existing_policy_commands epc
      on epc.table_name = rpc.table_name
     and epc.cmd = rpc.cmd
    where epc.cmd is null
  ),
  grouped as (
    select
      table_name,
      jsonb_agg(cmd order by cmd) as missing_commands
    from missing_cmd
    group by table_name
  )
  select coalesce(jsonb_object_agg(table_name, missing_commands), '{}'::jsonb)
  into missing_policy_cmds
  from grouped;

  with required_policy_commands as (
    select 'profiles'::text as table_name, 'SELECT'::text as cmd, true as requires_using, false as requires_with_check
    union all select 'profiles', 'INSERT', false, true
    union all select 'profiles', 'UPDATE', true, true

    union all select 'vehicles', 'SELECT', true, false
    union all select 'vehicles', 'INSERT', false, true
    union all select 'vehicles', 'UPDATE', true, true
    union all select 'vehicles', 'DELETE', true, false

    union all select 'fuel_logs', 'SELECT', true, false
    union all select 'fuel_logs', 'INSERT', false, true
    union all select 'fuel_logs', 'UPDATE', true, true
    union all select 'fuel_logs', 'DELETE', true, false

    union all select 'maintenance_tasks', 'SELECT', true, false
    union all select 'maintenance_tasks', 'INSERT', false, true
    union all select 'maintenance_tasks', 'UPDATE', true, true
    union all select 'maintenance_tasks', 'DELETE', true, false

    union all select 'service_records', 'SELECT', true, false
    union all select 'service_records', 'INSERT', false, true
    union all select 'service_records', 'UPDATE', true, true
    union all select 'service_records', 'DELETE', true, false

    union all select 'offline_sync_queue', 'SELECT', true, false
    union all select 'offline_sync_queue', 'INSERT', false, true
    union all select 'offline_sync_queue', 'UPDATE', true, true

    union all select 'service_attachments', 'SELECT', true, false
    union all select 'service_attachments', 'INSERT', false, true
  ),
  existing_policy_commands as (
    select
      tablename as table_name,
      upper(cmd) as cmd,
      bool_or(qual is not null) as has_using,
      bool_or(with_check is not null) as has_with_check
    from pg_policies
    where schemaname = 'public'
    group by tablename, upper(cmd)
  ),
  weak as (
    select
      rpc.table_name,
      rpc.cmd,
      rpc.requires_using,
      rpc.requires_with_check,
      coalesce(epc.has_using, false) as has_using,
      coalesce(epc.has_with_check, false) as has_with_check
    from required_policy_commands rpc
    join existing_policy_commands epc
      on epc.table_name = rpc.table_name
     and epc.cmd = rpc.cmd
    where (rpc.requires_using and not coalesce(epc.has_using, false))
       or (rpc.requires_with_check and not coalesce(epc.has_with_check, false))
  ),
  grouped as (
    select
      table_name,
      jsonb_agg(
        jsonb_build_object(
          'cmd', cmd,
          'missing_using', requires_using and not has_using,
          'missing_with_check', requires_with_check and not has_with_check
        )
        order by cmd
      ) as weak_commands
    from weak
    group by table_name
  )
  select coalesce(jsonb_object_agg(table_name, weak_commands), '{}'::jsonb)
  into weak_policy_shapes
  from grouped;

  if jsonb_array_length(missing_rls) > 0
     or missing_policy_cmds <> '{}'::jsonb
     or weak_policy_shapes <> '{}'::jsonb then
    details := jsonb_build_object(
      'missing_rls_tables', missing_rls,
      'missing_policy_commands_by_table', missing_policy_cmds,
      'weak_policy_shapes_by_table', weak_policy_shapes
    );

    raise exception 'RLS verification failed: %', details::text;
  end if;

  raise notice 'RLS verification passed for all required tables, commands, and policy shapes.';
end
$$;
