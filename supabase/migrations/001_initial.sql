create extension if not exists postgis;
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'guest', 'responder', 'admin')),
  home_barangay text,
  default_vehicle text check (default_vehicle in ('pedestrian', 'bicycle', 'motorcycle', 'tricycle', 'jeepney', 'sedan', 'suv')),
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  geom geometry(LineString, 4326) not null,
  start_point geometry(Point, 4326) not null,
  end_point geometry(Point, 4326) not null,
  length_meters numeric(10,2) not null,
  depth_level text not null check (depth_level in ('ankle', 'knee', 'waist', 'above_waist')),
  photo_url text,
  note text check (char_length(note) <= 500),
  street_name text not null check (char_length(street_name) between 2 and 120),
  barangay text not null check (char_length(barangay) between 2 and 120),
  report_mode text not null default 'segment' check (report_mode in ('segment', 'pin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '3 hours',
  verification_status text not null default 'unverified' check (verification_status in ('verified', 'unverified', 'hidden', 'expired')),
  upvotes integer not null default 0 check (upvotes >= 0),
  downvotes integer not null default 0 check (downvotes >= 0),
  check (st_npoints(geom) = 2),
  check (st_xmin(geom) >= 116.8 and st_xmax(geom) <= 126.7 and st_ymin(geom) >= 4.5 and st_ymax(geom) <= 21.3),
  check ((report_mode = 'segment' and length_meters between 5 and 2000) or (report_mode = 'pin' and length_meters = 0))
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(report_id, user_id)
);

create table if not exists public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  location geometry(Point, 4326) not null,
  accuracy_meters numeric(8,2) not null default 0 check (accuracy_meters between 0 and 5000),
  emergency_types text[] not null,
  status text not null default 'sent' check (status in ('sent', 'acknowledged', 'en_route', 'resolved')),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  updated_at timestamptz not null default now(),
  check (location && st_makeenvelope(116.8, 4.5, 126.7, 21.3, 4326)),
  check (cardinality(emergency_types) between 1 and 3),
  check (emergency_types <@ array['stranded', 'medical', 'supplies']::text[])
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reports_geom_gist on public.reports using gist (geom);
create index if not exists sos_alerts_location_gist on public.sos_alerts using gist (location);
create index if not exists reports_active_idx on public.reports (expires_at, verification_status);
create index if not exists reports_user_idx on public.reports (user_id, created_at desc);
create index if not exists sos_alerts_status_idx on public.sos_alerts (status, created_at desc);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.users where id = auth.uid()), 'guest')
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users(id, email, role) values (new.id, coalesce(new.email, ''), 'user') on conflict (id) do nothing;
  return new;
end
$$;

create or replace function public.refresh_report_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_report_id uuid;
  positive_votes integer;
  negative_votes integer;
  next_status text;
begin
  target_report_id = coalesce(new.report_id, old.report_id);
  select count(*) filter (where vote = 1), count(*) filter (where vote = -1)
  into positive_votes, negative_votes
  from public.votes
  where report_id = target_report_id;
  next_status = case
    when negative_votes >= 8 and negative_votes > positive_votes * 2 then 'hidden'
    when negative_votes >= 3 and negative_votes > positive_votes then 'unverified'
    when positive_votes >= 3 then 'verified'
    else 'unverified'
  end;
  update public.reports set upvotes = positive_votes, downvotes = negative_votes, verification_status = next_status, expires_at = case when tg_op <> 'DELETE' and new.vote = 1 then now() + interval '3 hours' else expires_at end where id = target_report_id and verification_status <> 'expired';
  return coalesce(new, old);
end
$$;

create or replace function public.audit_sos_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_log(actor_id, action, target_table, target_id, metadata) values (auth.uid(), 'sos_status_changed', 'sos_alerts', new.id, jsonb_build_object('from', old.status, 'to', new.status));
    if new.status = 'acknowledged' and new.acknowledged_at is null then
      new.acknowledged_at = now();
    end if;
  end if;
  return new;
end
$$;

create or replace function public.audit_report_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.verification_status is distinct from new.verification_status then
    insert into public.audit_log(actor_id, action, target_table, target_id, metadata) values (auth.uid(), 'report_status_changed', 'reports', new.id, jsonb_build_object('from', old.verification_status, 'to', new.verification_status));
  end if;
  return new;
end
$$;

create or replace function public.get_active_reports()
returns table (
  id uuid,
  user_id uuid,
  coordinates jsonb,
  start_coordinate jsonb,
  end_coordinate jsonb,
  length_meters numeric,
  depth_level text,
  photo_url text,
  note text,
  street_name text,
  barangay text,
  created_at timestamptz,
  expires_at timestamptz,
  verification_status text,
  upvotes integer,
  downvotes integer,
  report_mode text
)
language sql
stable
security invoker
set search_path = public
as $$
  select r.id, r.user_id, st_asgeojson(r.geom, 5)::jsonb -> 'coordinates', st_asgeojson(r.start_point, 5)::jsonb -> 'coordinates', st_asgeojson(r.end_point, 5)::jsonb -> 'coordinates', r.length_meters, r.depth_level, r.photo_url, r.note, r.street_name, r.barangay, r.created_at, r.expires_at, r.verification_status, r.upvotes, r.downvotes, r.report_mode
  from public.reports r
  where r.expires_at > now() and r.verification_status not in ('hidden', 'expired')
  order by r.created_at desc
$$;

create trigger users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger auth_user_profile after insert on auth.users for each row execute function public.handle_new_auth_user();
create trigger reports_updated_at before update on public.reports for each row execute function public.set_updated_at();
create trigger votes_updated_at before update on public.votes for each row execute function public.set_updated_at();
create trigger sos_alerts_updated_at before update on public.sos_alerts for each row execute function public.set_updated_at();
create trigger votes_refresh_report after insert or update or delete on public.votes for each row execute function public.refresh_report_votes();
create trigger sos_status_audit before update on public.sos_alerts for each row execute function public.audit_sos_status_change();
create trigger report_moderation_audit after update on public.reports for each row execute function public.audit_report_moderation();

alter table public.users enable row level security;
alter table public.reports enable row level security;
alter table public.votes enable row level security;
alter table public.sos_alerts enable row level security;
alter table public.audit_log enable row level security;

create policy users_select_self on public.users for select to authenticated using (id = auth.uid() or public.current_user_role() in ('responder', 'admin'));
create policy users_insert_self on public.users for insert to authenticated with check (id = auth.uid() and role = 'user');
create policy users_update_self on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = public.current_user_role());

create policy reports_select_active on public.reports for select to anon, authenticated using (expires_at > now() and verification_status not in ('hidden', 'expired'));
create policy reports_insert_own on public.reports for insert to authenticated with check (user_id = auth.uid());
create policy reports_update_own on public.reports for update to authenticated using (user_id = auth.uid() or public.current_user_role() in ('responder', 'admin')) with check (user_id = auth.uid() or public.current_user_role() in ('responder', 'admin'));
create policy reports_delete_own on public.reports for delete to authenticated using (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy votes_select_all on public.votes for select to authenticated using (true);
create policy votes_insert_own on public.votes for insert to authenticated with check (user_id = auth.uid() and public.current_user_role() <> 'guest');
create policy votes_update_own on public.votes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.current_user_role() <> 'guest');
create policy votes_delete_own on public.votes for delete to authenticated using (user_id = auth.uid());

create policy sos_select_authorized on public.sos_alerts for select to authenticated using (user_id = auth.uid() or public.current_user_role() in ('responder', 'admin'));
create policy sos_insert_own on public.sos_alerts for insert to authenticated with check (user_id = auth.uid());
create policy sos_update_responders on public.sos_alerts for update to authenticated using (public.current_user_role() in ('responder', 'admin')) with check (public.current_user_role() in ('responder', 'admin'));

create policy audit_select_responders on public.audit_log for select to authenticated using (public.current_user_role() in ('responder', 'admin'));
create policy audit_insert_responders on public.audit_log for insert to authenticated with check (actor_id = auth.uid() and public.current_user_role() in ('responder', 'admin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('flood-photos', 'flood-photos', true, 3000000, array['image/jpeg', 'image/png', 'image/webp']) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy flood_photos_public_read on storage.objects for select to public using (bucket_id = 'flood-photos');
create policy flood_photos_authenticated_upload on storage.objects for insert to authenticated with check (bucket_id = 'flood-photos' and (storage.foldername(name))[1] = auth.uid()::text);

alter publication supabase_realtime add table public.reports;
