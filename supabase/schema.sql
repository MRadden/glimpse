-- Glimpse: storage for short share links.
-- Paste all of this into the Supabase SQL Editor and click Run. You can run it again safely.

-- 1. The table. It holds only the snapshot that the owner approved.
create table if not exists public.snapshots (
  id         text primary key,
  data       text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

-- 2. Lock the table. The public key cannot read, list or change rows directly.
alter table public.snapshots enable row level security;
revoke all on table public.snapshots from anon, authenticated;

-- 3. Make a snapshot. Returns a random 10-character ID.
create or replace function public.create_snapshot(p_data text)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  bytes bytea;
  new_id text;
begin
  if p_data is null or length(p_data) < 10 or length(p_data) > 200000 then
    raise exception 'Snapshot size is not valid';
  end if;
  loop
    bytes := gen_random_bytes(10);
    new_id := '';
    for i in 0..9 loop
      new_id := new_id || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
    end loop;
    begin
      insert into public.snapshots (id, data) values (new_id, p_data);
      return new_id;
    exception when unique_violation then
      -- The ID is already used. Try again.
    end;
  end loop;
end;
$$;

-- 4. Read one snapshot by its ID. Returns null if it does not exist or has expired.
create or replace function public.get_snapshot(p_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select data from public.snapshots where id = p_id and expires_at > now();
$$;

revoke all on function public.create_snapshot(text) from public;
revoke all on function public.get_snapshot(text) from public;
grant execute on function public.create_snapshot(text) to anon, authenticated;
grant execute on function public.get_snapshot(text) to anon, authenticated;

-- 5. Delete expired snapshots every day (only if pg_cron is available).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('glimpse-cleanup', '17 3 * * *', $c$delete from public.snapshots where expires_at < now()$c$);
exception when others then
  raise notice 'pg_cron is not available. Expired snapshots are hidden but not deleted.';
end;
$$;
