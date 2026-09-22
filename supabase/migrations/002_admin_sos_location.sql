-- Admin-only helper for displaying the exact SOS coordinates safely.
create or replace function public.admin_sos_locations(p_admin_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  longitude double precision,
  latitude double precision,
  accuracy_meters numeric,
  emergency_types text[],
  status text,
  created_at timestamptz,
  acknowledged_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.users u
    where u.id = p_admin_user_id and u.role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select
    s.id,
    s.user_id,
    st_x(s.location)::double precision as longitude,
    st_y(s.location)::double precision as latitude,
    s.accuracy_meters,
    s.emergency_types,
    s.status,
    s.created_at,
    s.acknowledged_at,
    s.updated_at
  from public.sos_alerts s
  order by s.created_at desc;
end;
$$;

revoke all on function public.admin_sos_locations(uuid) from public;
grant execute on function public.admin_sos_locations(uuid) to service_role;
