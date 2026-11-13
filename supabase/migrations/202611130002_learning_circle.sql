-- Aggregate-only view of the single SkillForge project's learning community.
-- Review and apply after 202611130001_daily_accountability.sql.
begin;

create function public.learning_circle_snapshot() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  today date;
  snapshot jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  today := public.skillforge_local_today();

  with recursive
  day_totals as (
    select e.user_id, e.learning_date, sum(e.minutes)::integer as minutes
    from public.learning_entries e
    where e.learning_date <= today
    group by e.user_id, e.learning_date
  ),
  active_days as (
    select user_id, learning_date from day_totals where minutes >= 5
  ),
  anchors as (
    select user_id, max(learning_date) as learning_date
    from active_days
    group by user_id
    having max(learning_date) >= today - 1
  ),
  streak(user_id, learning_date) as (
    select user_id, learning_date from anchors
    union all
    select s.user_id, a.learning_date
    from streak s
    join active_days a on a.user_id = s.user_id
      and a.learning_date = s.learning_date - 1
  ),
  member_rows as (
    select p.id, p.display_name,
      (select count(*) from active_days a where a.user_id = p.id) as active_days,
      (select count(*) from streak s where s.user_id = p.id) as current_streak,
      (select coalesce(sum(d.minutes), 0) from day_totals d
        where d.user_id = p.id
          and d.learning_date >= today - (extract(isodow from today)::integer - 1)) as week_minutes,
      (select coalesce(jsonb_object_agg(d.learning_date::text, d.minutes), '{}'::jsonb)
        from day_totals d
        where d.user_id = p.id
          and d.learning_date >= date_trunc('month', today::timestamp)::date) as month_days
    from public.profiles p
  )
  select jsonb_build_object(
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', m.display_name,
        'current_streak', m.current_streak,
        'active_days', m.active_days,
        'week_minutes', m.week_minutes,
        'month_days', m.month_days
      ) order by lower(m.display_name), m.id)
      from member_rows m
    ), '[]'::jsonb),
    'community_minutes', (select coalesce(sum(minutes), 0) from day_totals),
    'community_active_days', (select count(distinct learning_date) from active_days)
  ) into snapshot;

  return snapshot;
end;
$$;

revoke all on function public.learning_circle_snapshot() from public, anon;
grant execute on function public.learning_circle_snapshot() to authenticated;
commit;
