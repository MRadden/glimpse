-- Glimpse dating tests: the "Match me" waitlist and match-score feedback.
-- Paste all of this into the Supabase SQL Editor and click Run. You can run it again safely.
-- Run schema.sql first (it makes the snapshots table).

-- 1. Waitlist: people who want to be matched by their feed when matching opens in their city.
create table if not exists public.waitlist (
  email      text primary key,
  city       text not null,
  age_range  text not null,
  glimpse_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Feedback: "Did this match score feel accurate?"
create table if not exists public.match_feedback (
  id         bigint generated always as identity primary key,
  glimpse_a  text not null,
  glimpse_b  text not null,
  score      int  not null,
  rating     text not null,
  created_at timestamptz not null default now()
);

-- 3. Lock both tables. The public key cannot read, list or change rows directly.
alter table public.waitlist enable row level security;
alter table public.match_feedback enable row level security;
revoke all on table public.waitlist from anon, authenticated;
revoke all on table public.match_feedback from anon, authenticated;

-- 4. Join the waitlist (or update your city and age range). Returns the number of people in that city.
create or replace function public.join_waitlist(p_email text, p_city text, p_age_range text, p_glimpse_id text default null)
returns int
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_city  text := initcap(regexp_replace(trim(p_city), '\s+', ' ', 'g'));
  v_count int;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 200 then
    raise exception 'Email is not valid';
  end if;
  if length(v_city) < 2 or length(v_city) > 80 then
    raise exception 'City is not valid';
  end if;
  if p_age_range not in ('18-24', '25-34', '35-44', '45-54', '55+') then
    raise exception 'Age range is not valid';
  end if;
  if p_glimpse_id is not null and p_glimpse_id !~ '^[A-Za-z0-9]{10}$' then
    p_glimpse_id := null;
  end if;

  insert into public.waitlist (email, city, age_range, glimpse_id)
  values (v_email, v_city, p_age_range, p_glimpse_id)
  on conflict (email) do update
    set city = excluded.city,
        age_range = excluded.age_range,
        glimpse_id = coalesce(excluded.glimpse_id, public.waitlist.glimpse_id),
        updated_at = now();

  select count(*) into v_count from public.waitlist where city = v_city;
  return v_count;
end;
$$;

-- 5. Save one rating of a match score.
create or replace function public.rate_match(p_a text, p_b text, p_score int, p_rating text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_a !~ '^[A-Za-z0-9]{10}$' or p_b !~ '^[A-Za-z0-9]{10}$' then
    raise exception 'Glimpse IDs are not valid';
  end if;
  if p_score < 0 or p_score > 100 then
    raise exception 'Score is not valid';
  end if;
  if p_rating not in ('spot-on', 'somewhat', 'not-really') then
    raise exception 'Rating is not valid';
  end if;
  insert into public.match_feedback (glimpse_a, glimpse_b, score, rating) values (p_a, p_b, p_score, p_rating);
end;
$$;

revoke all on function public.join_waitlist(text, text, text, text) from public;
revoke all on function public.rate_match(text, text, int, text) from public;
grant execute on function public.join_waitlist(text, text, text, text) to anon, authenticated;
grant execute on function public.rate_match(text, text, int, text) to anon, authenticated;

-- 6. Tell the API to see the new tables and functions now.
notify pgrst, 'reload schema';

-- To see the results later (in the SQL Editor, as the owner):
--   select city, count(*) from public.waitlist group by city order by 2 desc;
--   select rating, count(*), round(avg(score)) as avg_score from public.match_feedback group by rating;
