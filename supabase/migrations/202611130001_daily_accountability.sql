-- Apply only after reviewing this migration against the existing SkillForge project.
-- The existing role value 'owner' is the administrator; 'member' remains the default.
begin;

-- The browser sends its IANA local timezone on every PostgREST request. Reject a
-- missing or unknown timezone rather than silently falling back to UTC.
-- MVP limitation: a direct API caller can submit a different valid timezone.
create function public.skillforge_local_today() returns date
language plpgsql stable set search_path = '' as $$
declare
  zone_name text;
begin
  zone_name := current_setting('request.headers', true)::jsonb ->> 'x-skillforge-timezone';
  if zone_name is null or not exists (
    select 1 from pg_catalog.pg_timezone_names where name = zone_name
  ) then
    raise exception 'A valid local timezone is required to log learning';
  end if;
  return (statement_timestamp() at time zone zone_name)::date;
end;
$$;

create function public.check_learning_entry_date() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.learning_date <> public.skillforge_local_today() then
    raise exception 'Learning entries can only be created for today';
  end if;
  if tg_op = 'UPDATE' and new.learning_date is distinct from old.learning_date then
    raise exception 'A learning entry date cannot be changed';
  end if;
  return new;
end;
$$;
create trigger learning_entry_date_guard before insert or update on public.learning_entries
  for each row execute function public.check_learning_entry_date();

-- SECURITY DEFINER avoids recursive profile RLS evaluation. It checks only the
-- calling user's own role and never accepts a target user ID.
create function public.skillforge_is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'owner'
  );
$$;

-- Existing historical rows are untouched. Members retain INSERT, but not UPDATE
-- or DELETE. Owners can select, update, and delete any user's learning entries.
drop policy entries_own on public.learning_entries;
create policy entries_select on public.learning_entries for select to authenticated
  using (user_id = (select auth.uid()) or public.skillforge_is_owner());
create policy entries_insert_own_today on public.learning_entries for insert to authenticated
  with check (user_id = (select auth.uid()) and learning_date = public.skillforge_local_today());
create policy entries_update_owner on public.learning_entries for update to authenticated
  using (public.skillforge_is_owner()) with check (public.skillforge_is_owner());
create policy entries_delete_owner on public.learning_entries for delete to authenticated
  using (public.skillforge_is_owner());

-- Owners need category names and member names to manage cross-user entries.
create policy profiles_select_owner on public.profiles for select to authenticated
  using (public.skillforge_is_owner());
create policy categories_select_owner on public.learning_categories for select to authenticated
  using (public.skillforge_is_owner());

-- Keep the existing display_name-only profile UPDATE grant and role guard.
-- Let PostgreSQL generate entry IDs and timestamps; clients supply only content.
revoke insert, update, delete on public.learning_entries from authenticated;
grant insert (user_id, category_id, learning_date, title, minutes, notes, reference_url)
  on public.learning_entries to authenticated;
grant update (title, category_id, minutes, notes, reference_url) on public.learning_entries to authenticated;
grant delete on public.learning_entries to authenticated;
revoke all on function public.skillforge_local_today() from public, anon;
grant execute on function public.skillforge_local_today() to authenticated;
revoke all on function public.skillforge_is_owner() from public, anon;
grant execute on function public.skillforge_is_owner() to authenticated;
commit;
