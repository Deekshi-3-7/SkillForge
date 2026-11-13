-- SkillForge owns its own Supabase project. Apply this migration to that project only.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner' check (char_length(trim(display_name)) between 1 and 80),
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (
    char_length(name) between 1 and 40
    and name !~ '(^[[:space:]]|[[:space:]]$)'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);
create unique index learning_categories_user_name_key
  on public.learning_categories (user_id, lower(name));

create table public.learning_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null,
  learning_date date not null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  minutes integer not null check (minutes between 1 and 1440),
  notes text check (notes is null or char_length(notes) <= 2000),
  reference_url text check (reference_url is null or (char_length(reference_url) <= 1000 and reference_url ~* '^https?://')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, category_id)
    references public.learning_categories(user_id, id)
    on delete no action deferrable initially deferred
);
create index learning_entries_user_date_idx
  on public.learning_entries (user_id, learning_date desc, created_at desc);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 180),
  platform text not null check (char_length(trim(platform)) between 1 and 80),
  course_url text not null check (char_length(trim(course_url)) between 1 and 1000 and course_url ~* '^https?://'),
  total_lectures integer check (total_lectures is null or total_lectures > 0),
  completed_lectures integer not null default 0 check (completed_lectures >= 0),
  -- Progress remains manually editable, including when total_lectures is null.
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_lectures is null or completed_lectures <= total_lectures),
  foreign key (user_id, category_id)
    references public.learning_categories(user_id, id)
    on delete no action deferrable initially deferred
);
create index courses_user_updated_idx on public.courses (user_id, updated_at desc);

-- Grants and RLS both matter: grants allow an operation, policies limit its rows.
revoke all on public.profiles, public.learning_categories,
  public.learning_entries, public.courses from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.learning_categories,
  public.learning_entries, public.courses to authenticated;
grant all on public.profiles, public.learning_categories,
  public.learning_entries, public.courses to service_role;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger categories_updated before update on public.learning_categories
  for each row execute function public.touch_updated_at();
create trigger entries_updated before update on public.learning_entries
  for each row execute function public.touch_updated_at();
create trigger courses_updated before update on public.courses
  for each row execute function public.touch_updated_at();

-- A new Auth account gets its own profile and editable suggested categories.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
                  split_part(coalesce(new.email, 'Learner'), '@', 1)), 80)
  );
  insert into public.learning_categories (user_id, name)
  select new.id, seeded.name from unnest(array[
    'Coding', 'DSA', 'Test Automation', 'System Design',
    'DevOps', 'Courses', 'Reading', 'Other'
  ]) as seeded(name);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.learning_categories enable row level security;
alter table public.learning_entries enable row level security;
alter table public.courses enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- The browser cannot change the role, regardless of an attempted profile update.
create function public.protect_profile_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is not null and new.role is distinct from old.role then
    raise exception 'Profile role cannot be changed by the client';
  end if;
  return new;
end;
$$;
create trigger profile_role_guard before update on public.profiles
  for each row execute function public.protect_profile_fields();

create policy categories_own on public.learning_categories for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy entries_own on public.learning_entries for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy courses_own on public.courses for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
