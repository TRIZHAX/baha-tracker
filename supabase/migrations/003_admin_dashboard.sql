-- Admin Dashboard + SOS Map support.
-- The API passes the authenticated user's id after server-side Supabase auth.
-- The function independently verifies that id has the admin role before exposing coordinates.
create or replace function public.get_admin_sos_alerts(p_actor_id uuid)
returns table (
  id uuid,
  user_id uuid,
  reporter_email text,
  latitude double precision,
  longitude double precision,
  accuracy_meters numeric,
  emergency_types text[],
  status text,
  created_at timestamptz,
  acknowledged_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.users where users.id = p_actor_id and users.role = 'admin') then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  return query
  select
    s.id,
    s.user_id,
    u.email,
    st_y(s.location)::double precision,
    st_x(s.location)::double precision,
    s.accuracy_meters,
    s.emergency_types,
    s.status,
    s.created_at,
    s.acknowledged_at,
    s.updated_at
  from public.sos_alerts s
  left join public.users u on u.id = s.user_id
  order by s.created_at desc;
end;
$$;

revoke all on function public.get_admin_sos_alerts(uuid) from public;
grant execute on function public.get_admin_sos_alerts(uuid) to service_role;
