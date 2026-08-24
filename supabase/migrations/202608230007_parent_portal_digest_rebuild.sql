-- HELP Math family portal: service-only weekly digest enqueue and replayable projections.

begin;

create or replace function public.enqueue_weekly_family_digests_v1(
  p_week_start date default date_trunc('week', current_date)::date,
  p_limit integer default 1000
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_enqueued integer := 0;
  v_rows integer;
  v_candidate record;
  v_retention_days integer;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_limit not between 1 and 10000
    or p_week_start <> date_trunc('week', p_week_start::timestamp)::date
    or p_week_start > current_date
    or p_week_start < current_date - 21
  then
    raise exception using errcode = '22023', message = 'invalid digest week';
  end if;

  for v_candidate in
    select
      t.id as tenant_id, t.environment_id, t.data_mode,
      guardian.id as guardian_user_id, guardian.notification_email_digest,
      guardian.notification_email_ciphertext,
      fnp.locale,
      count(distinct le.event_id)::integer as activity_count,
      count(distinct sa.id) filter (
        where sa.status <> 'completed'
      )::integer as open_assignment_count,
      count(distinct ft.id) filter (
        where exists (
          select 1
          from public.family_messages as fm
          left join public.family_thread_reads as ftr
            on ftr.tenant_id = ft.tenant_id
            and ftr.thread_id = ft.id
            and ftr.app_user_id = guardian.id
          where fm.tenant_id = ft.tenant_id
            and fm.thread_id = ft.id
            and fm.sender_user_id <> guardian.id
            and fm.created_at > coalesce(
              ftr.last_read_at, '-infinity'::timestamptz
            )
        )
      )::integer as unread_thread_count
    from public.tenants as t
    join public.family_notification_preferences as fnp
      on fnp.tenant_id = t.id and fnp.weekly_digest_enabled
    join public.app_users as guardian
      on guardian.id = fnp.app_user_id and guardian.status = 'active'
      and guardian.notification_email_digest is not null
      and guardian.notification_email_ciphertext is not null
    join public.role_bindings as rb
      on rb.tenant_id = t.id and rb.app_user_id = guardian.id
      and rb.role = 'guardian' and rb.active
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
    join public.guardian_links as gl
      on gl.tenant_id = t.id and gl.guardian_user_id = guardian.id
      and gl.status = 'active'
      and (gl.expires_at is null or gl.expires_at > statement_timestamp())
    join public.students as s
      on s.tenant_id = gl.tenant_id and s.id = gl.student_id and s.active
    join public.schools as sc
      on sc.tenant_id = s.tenant_id and sc.id = s.school_id and sc.active
    join public.enrollments as e
      on e.tenant_id = gl.tenant_id and e.student_id = gl.student_id
      and e.status = 'active'
      and e.starts_at <= current_date
      and (e.ends_at is null or e.ends_at >= current_date)
    join public.classes as c
      on c.tenant_id = e.tenant_id and c.id = e.class_id
      and c.school_id = s.school_id and c.active
    left join public.learning_events_v2 as le
      on le.tenant_id = gl.tenant_id and le.student_id = gl.student_id
      and le.occurred_at >= p_week_start::timestamptz
      and le.occurred_at < (p_week_start + 7)::timestamptz
    left join public.student_assignments as sa
      on sa.tenant_id = e.tenant_id and sa.enrollment_id = e.id
    left join public.family_threads as ft
      on ft.tenant_id = gl.tenant_id and ft.child_id = gl.student_id
      and ft.guardian_user_id = guardian.id
    where t.status = 'active' and t.family_portal_enabled
      and private.family_retention_days_v1(
        t.id, 'notification_outbox'
      ) is not null
      and not exists (
        select 1 from public.email_suppressions as es
        where es.tenant_id = t.id
          and es.recipient_email_digest = guardian.notification_email_digest
      )
      and not exists (
        select 1 from public.notification_outbox as existing_digest
        where existing_digest.tenant_id = t.id
          and existing_digest.idempotency_key =
            'weekly:' || t.id::text || ':' || guardian.id::text || ':' ||
            to_char(p_week_start, 'IYYY-IW')
      )
    group by
      t.id, t.environment_id, t.data_mode, guardian.id,
      guardian.notification_email_digest,
      guardian.notification_email_ciphertext, fnp.locale
    order by t.id, guardian.id
    limit p_limit
  loop
    v_retention_days := private.family_retention_days_v1(
      v_candidate.tenant_id, 'notification_outbox'
    );
    if v_retention_days is null then
      continue;
    end if;
    insert into public.notification_outbox (
      tenant_id, environment_id, data_mode, kind, recipient_user_id,
      recipient_email_digest, recipient_email_ciphertext, locale,
      idempotency_key, aggregate_type, aggregate_id, payload,
      retention_anchor_at, expires_at
    ) values (
      v_candidate.tenant_id, v_candidate.environment_id, v_candidate.data_mode,
      'weekly_family_digest', v_candidate.guardian_user_id,
      v_candidate.notification_email_digest,
      v_candidate.notification_email_ciphertext, v_candidate.locale,
      'weekly:' || v_candidate.tenant_id::text || ':' ||
        v_candidate.guardian_user_id::text || ':' ||
        to_char(p_week_start, 'IYYY-IW'),
      'guardian_week', v_candidate.guardian_user_id,
      jsonb_build_object(
        'kind', 'weekly_family_digest',
        'activityCount', v_candidate.activity_count,
        'openAssignmentCount', v_candidate.open_assignment_count,
        'unreadThreadCount', v_candidate.unread_thread_count
      ),
      statement_timestamp(),
      statement_timestamp() + make_interval(days => v_retention_days)
    ) on conflict (tenant_id, idempotency_key) do nothing;
    get diagnostics v_rows = row_count;
    v_enqueued := v_enqueued + v_rows;
  end loop;

  return jsonb_build_object(
    'enqueued', v_enqueued,
    'week_start', p_week_start
  );
end;
$$;

create or replace function public.rebuild_family_projections_v1(
  p_limit integer default 1000
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_group record;
  v_assignment public.assignments%rowtype;
  v_student_assignment public.student_assignments%rowtype;
  v_retention_days integer;
  v_progress_count integer := 0;
  v_skill_count integer := 0;
  v_progress_batch_count integer;
  v_skill_batch_count integer;
  v_progress_tenant_id uuid;
  v_progress_student_id uuid;
  v_progress_assignment_id uuid;
  v_skill_tenant_id uuid;
  v_skill_student_id uuid;
  v_skill_id text;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_limit not between 1 and 10000 then
    raise exception using errcode = '22023', message = 'rebuild limit out of range';
  end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception using errcode = '25000',
      message = 'projection rebuild requires read committed isolation';
  end if;

  update public.progress_projections_v1 set stale = true;
  update public.skill_projections_v1 set stale = true;

  loop
    v_progress_batch_count := 0;
    for v_group in
      select le.tenant_id, le.student_id, le.assignment_id
      from public.learning_events_v2 as le
      where le.event_type = 'page_reviewed'
        and le.expires_at > statement_timestamp()
        and (
          v_progress_tenant_id is null
          or (le.tenant_id, le.student_id, le.assignment_id) >
            (v_progress_tenant_id, v_progress_student_id, v_progress_assignment_id)
        )
      group by le.tenant_id, le.student_id, le.assignment_id
      order by le.tenant_id, le.student_id, le.assignment_id
      limit p_limit
    loop
    v_progress_batch_count := v_progress_batch_count + 1;
    v_progress_tenant_id := v_group.tenant_id;
    v_progress_student_id := v_group.student_id;
    v_progress_assignment_id := v_group.assignment_id;
    -- ingest_learning_events_v2 takes the same student-row lock before it
    -- inserts and recomputes. The aggregate is deliberately executed only
    -- after this lock, in a new Read Committed statement snapshot.
    perform 1 from public.students as locked_student
    where locked_student.tenant_id = v_progress_tenant_id
      and locked_student.id = v_progress_student_id
    for no key update;
    if not found then continue; end if;
    select
      le.tenant_id, le.student_id, le.assignment_id,
      count(distinct le.learning_object_version_id)
        filter (where le.event_type = 'page_reviewed')::integer
        as reviewed_pages,
      max(le.occurred_at) as last_event_occurred_at,
      (array_agg(le.event_id order by le.occurred_at desc, le.event_id desc))[1]
        as last_event_id,
      min(le.retention_anchor_at) as retention_anchor_at,
      min(le.expires_at) as expires_at
    into strict v_group
    from public.learning_events_v2 as le
    where le.tenant_id = v_progress_tenant_id
      and le.student_id = v_progress_student_id
      and le.assignment_id = v_progress_assignment_id
      and le.event_type = 'page_reviewed'
      and le.expires_at > statement_timestamp()
    group by le.tenant_id, le.student_id, le.assignment_id;
    select * into strict v_assignment
    from public.assignments as a
    where a.tenant_id = v_group.tenant_id and a.id = v_group.assignment_id;
    select sa.* into strict v_student_assignment
    from public.student_assignments as sa
    join public.enrollments as e
      on e.tenant_id = sa.tenant_id and e.id = sa.enrollment_id
    where sa.tenant_id = v_group.tenant_id
      and sa.assignment_id = v_group.assignment_id
      and e.student_id = v_group.student_id;
    v_retention_days := private.family_retention_days_v1(
      v_group.tenant_id, 'learning_event'
    );
    if v_retention_days is null then
      continue;
    end if;

    update public.student_assignments as sa
    set reviewed_pages = least(v_group.reviewed_pages, v_assignment.total_pages),
        status = case
          when least(v_group.reviewed_pages, v_assignment.total_pages) >=
            v_assignment.total_pages then 'completed'::public.family_assignment_status
          when v_group.reviewed_pages > 0 then 'in_progress'::public.family_assignment_status
          else 'not_started'::public.family_assignment_status
        end,
        started_at = case
          when v_group.reviewed_pages > 0 then coalesce(
            sa.started_at, v_group.last_event_occurred_at
          ) else null
        end,
        completed_at = case
          when least(v_group.reviewed_pages, v_assignment.total_pages) >=
            v_assignment.total_pages then coalesce(
              sa.completed_at, v_group.last_event_occurred_at
            ) else null
        end
    where sa.tenant_id = v_student_assignment.tenant_id
      and sa.id = v_student_assignment.id;

    insert into public.progress_projections_v1 (
      tenant_id, environment_id, data_mode, student_id, assignment_id,
      lesson_release_id, lesson_title, reviewed_pages, total_pages,
      last_activity_at, last_event_occurred_at, last_event_id,
      computed_at, stale, retention_anchor_at, expires_at
    ) values (
      v_assignment.tenant_id, v_assignment.environment_id,
      v_assignment.data_mode, v_group.student_id, v_assignment.id,
      v_assignment.lesson_release_id, v_assignment.lesson_title,
      least(v_group.reviewed_pages, v_assignment.total_pages),
      v_assignment.total_pages, v_group.last_event_occurred_at,
      v_group.last_event_occurred_at, v_group.last_event_id,
      clock_timestamp(), false, v_group.retention_anchor_at,
      v_group.expires_at
    ) on conflict (tenant_id, student_id, lesson_release_id, assignment_id)
    do update set
      reviewed_pages = excluded.reviewed_pages,
      total_pages = excluded.total_pages,
      last_activity_at = excluded.last_activity_at,
      last_event_occurred_at = excluded.last_event_occurred_at,
      last_event_id = excluded.last_event_id,
      computed_at = excluded.computed_at,
      stale = false,
      retention_anchor_at = excluded.retention_anchor_at,
      expires_at = excluded.expires_at;
    v_progress_count := v_progress_count + 1;
    end loop;
    exit when v_progress_batch_count = 0;
  end loop;

  loop
    v_skill_batch_count := 0;
    for v_group in
      select le.tenant_id, le.student_id, le.skill_id
      from public.learning_events_v2 as le
      join public.family_content_release_memberships as membership
        on membership.tenant_id = le.tenant_id
        and membership.content_release_id = le.content_release_id
        and membership.lesson_release_id = le.lesson_release_id
        and membership.learning_object_version_id = le.learning_object_version_id
        and membership.skill_id = le.skill_id
        and membership.published
        and membership.active_from <= le.occurred_at
        and (membership.active_until is null or membership.active_until > le.occurred_at)
      where le.skill_id is not null
        and le.event_type = 'practice_evaluated'
        and le.outcome in ('correct', 'incorrect')
        and le.occurred_at >= statement_timestamp() - interval '30 days'
        and le.expires_at > statement_timestamp()
        and (
          v_skill_tenant_id is null
          or (le.tenant_id, le.student_id, le.skill_id) >
            (v_skill_tenant_id, v_skill_student_id, v_skill_id)
        )
      group by le.tenant_id, le.student_id, le.skill_id
      order by le.tenant_id, le.student_id, le.skill_id
      limit p_limit
    loop
    v_skill_batch_count := v_skill_batch_count + 1;
    v_skill_tenant_id := v_group.tenant_id;
    v_skill_student_id := v_group.student_id;
    v_skill_id := v_group.skill_id;
    perform 1 from public.students as locked_student
    where locked_student.tenant_id = v_skill_tenant_id
      and locked_student.id = v_skill_student_id
    for no key update;
    if not found then continue; end if;
    select
      le.tenant_id, le.student_id, le.skill_id,
      min(membership.skill_name) as skill_name,
      count(*)::integer as evidence_count,
      max(le.occurred_at) as last_event_occurred_at,
      (array_agg(le.event_id order by le.occurred_at desc, le.event_id desc))[1]
        as last_event_id,
      min(le.retention_anchor_at) as retention_anchor_at,
      min(le.expires_at) as expires_at
    into strict v_group
    from public.learning_events_v2 as le
    join public.family_content_release_memberships as membership
      on membership.tenant_id = le.tenant_id
      and membership.content_release_id = le.content_release_id
      and membership.lesson_release_id = le.lesson_release_id
      and membership.learning_object_version_id = le.learning_object_version_id
      and membership.skill_id = le.skill_id
      and membership.published
      and membership.active_from <= le.occurred_at
      and (membership.active_until is null or membership.active_until > le.occurred_at)
    where le.tenant_id = v_skill_tenant_id
      and le.student_id = v_skill_student_id
      and le.skill_id = v_skill_id
      and le.event_type = 'practice_evaluated'
      and le.outcome in ('correct', 'incorrect')
      and le.occurred_at >= statement_timestamp() - interval '30 days'
      and le.expires_at > statement_timestamp()
    group by le.tenant_id, le.student_id, le.skill_id;
    v_retention_days := private.family_retention_days_v1(
      v_group.tenant_id, 'learning_event'
    );
    if v_retention_days is null then
      continue;
    end if;
    insert into public.skill_projections_v1 (
      tenant_id, environment_id, data_mode, student_id, skill_id,
      skill_name, band, evidence_count, explanation,
      window_starts_at, window_ends_at, computed_at, stale,
      last_event_occurred_at, last_event_id, retention_anchor_at, expires_at
    )
    select
      t.id, t.environment_id, t.data_mode, v_group.student_id,
      v_group.skill_id, v_group.skill_name,
      case
        when v_group.evidence_count = 0 then 'insufficient_evidence'::public.family_skill_band
        when v_group.evidence_count <= 2 then 'starting'::public.family_skill_band
        when v_group.evidence_count <= 5 then 'growing'::public.family_skill_band
        else 'strong'::public.family_skill_band
      end,
      v_group.evidence_count,
      v_group.evidence_count::text ||
        ' recent learning events contributed to this projection.',
      statement_timestamp() - interval '30 days', statement_timestamp(),
      clock_timestamp(), false, v_group.last_event_occurred_at,
      v_group.last_event_id, v_group.retention_anchor_at,
      v_group.expires_at
    from public.tenants as t where t.id = v_group.tenant_id
    on conflict (tenant_id, student_id, skill_id) do update set
      skill_name = excluded.skill_name,
      band = excluded.band,
      evidence_count = excluded.evidence_count,
      explanation = excluded.explanation,
      window_starts_at = excluded.window_starts_at,
      window_ends_at = excluded.window_ends_at,
      computed_at = excluded.computed_at,
      stale = false,
      last_event_occurred_at = excluded.last_event_occurred_at,
      last_event_id = excluded.last_event_id,
      retention_anchor_at = excluded.retention_anchor_at,
      expires_at = excluded.expires_at;
    v_skill_count := v_skill_count + 1;
    end loop;
    exit when v_skill_batch_count = 0;
  end loop;

  return jsonb_build_object(
    'progress_rebuilt', v_progress_count,
    'skills_rebuilt', v_skill_count
  );
end;
$$;

revoke all on function public.enqueue_weekly_family_digests_v1(date, integer)
  from public;
revoke all on function public.rebuild_family_projections_v1(integer) from public;
-- Final migration-level backstop: no function in the exposed schema is
-- executable through PostgreSQL's implicit PUBLIC role. App and worker RPCs
-- retain only their explicit grants from the migrations that define them.
revoke execute on all functions in schema public from public;
grant execute on function public.enqueue_weekly_family_digests_v1(date, integer)
  to service_role;
grant execute on function public.rebuild_family_projections_v1(integer)
  to service_role;

comment on function public.enqueue_weekly_family_digests_v1(date, integer) is
  'Service-only, opt-in weekly digest enqueue. Payload contains counts only and is unique per tenant, guardian, and ISO week.';
comment on function public.rebuild_family_projections_v1(integer) is
  'Service-only deterministic replay from immutable learning_events_v2 with event watermarks; accepts no tenant or actor parameter.';

commit;
