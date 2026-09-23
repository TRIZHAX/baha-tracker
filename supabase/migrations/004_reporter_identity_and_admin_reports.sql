alter table public.users
  add column if not exists full_name text;

create index if not exists users_full_name_idx on public.users (full_name);

create or replace function public.get_admin_reports(p_actor_id uuid)
returns table (
  id uuid,
  user_id uuid,
  reporter_name text,
  reporter_email text,
  length_meters numeric,
  depth_level text,
  photo_url text,
  note text,
  street_name text,
  barangay text,
  report_mode text,
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz,
  verification_status text,
  upvotes integer,
  downvotes integer,
  start_latitude double precision,
  start_longitude double precision,
  end_latitude double precision,
  end_longitude double precision
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.users
    where users.id = p_actor_id
      and users.role = 'admin'
  ) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  return query
  select
    r.id,
    r.user_id,
    u.full_name,
    u.email,
    r.length_meters,
    r.depth_level,
    r.photo_url,
    r.note,
    r.street_name,
    r.barangay,
    r.report_mode,
    r.created_at,
    r.updated_at,
    r.expires_at,
    r.verification_status,
    r.upvotes,
    r.downvotes,
    st_y(r.start_point)::double precision,
    st_x(r.start_point)::double precision,
    st_y(r.end_point)::double precision,
    st_x(r.end_point)::double precision
  from public.reports r
  left join public.users u on u.id = r.user_id
  order by r.created_at desc;
end;
$$;

revoke all on function public.get_admin_reports(uuid) from public;
grant execute on function public.get_admin_reports(uuid) to service_role;
