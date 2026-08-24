-- HELP Math family portal: workspace projection and invitation transactions.

begin;

create or replace function private.assert_family_idempotency_key(p_value text)
returns void
language plpgsql
immutable
set search_path = pg_catalog
as $$
begin
  if p_value is null
    or char_length(p_value) not between 8 and 128
    or p_value !~ '^[A-Za-z0-9._:-]+$'
  then
    raise exception using errcode = '22023', message = 'invalid idempotency key';
  end if;
end;
$$;

create or replace function private.require_family_app_user()
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.family_current_app_user_id_v1();
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'family identity is not mapped';
  end if;
  return v_user_id;
end;
$$;

create or replace function private.family_assignments_json_v1(
  p_tenant_id uuid,
  p_student_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select coalesce(jsonb_agg(item order by assigned_at desc, assignment_id), '[]'::jsonb)
  from (
    select
      a.assigned_at,
      a.id as assignment_id,
      jsonb_build_object(
        'id', a.id,
        'assignedAt', a.assigned_at,
        'dueAt', a.due_at,
        'familyNote', a.family_note,
        'lessonReleaseId', a.lesson_release_id,
        'lessonTitle', a.lesson_title,
        'reviewedPages', least(sa.reviewed_pages, a.total_pages),
        'status', case
          when sa.status <> 'completed'
            and a.due_at is not null
            and a.due_at < statement_timestamp()
            then 'overdue'
          else sa.status::text
        end,
        'teacherDisplayName', teacher.display_name,
        'title', a.title,
        'totalPages', a.total_pages
      ) as item
    from public.student_assignments as sa
    join public.enrollments as e
      on e.tenant_id = sa.tenant_id and e.id = sa.enrollment_id
    join public.assignments as a
      on a.tenant_id = sa.tenant_id and a.id = sa.assignment_id
      and a.class_id = e.class_id
    join public.classes as c
      on c.tenant_id = e.tenant_id and c.id = e.class_id
    join public.students as s
      on s.tenant_id = e.tenant_id and s.id = e.student_id
    join public.schools as sc
      on sc.tenant_id = s.tenant_id and sc.id = s.school_id
    join public.app_users as teacher on teacher.id = a.teacher_user_id
    where sa.tenant_id = p_tenant_id
      and e.student_id = p_student_id
      and e.status = 'active'
      and e.starts_at <= current_date
      and (e.ends_at is null or e.ends_at >= current_date)
      and c.active and s.active and sc.active
      and c.school_id = s.school_id
  ) as assignments;
$$;

create or replace function private.family_lessons_json_v1(
  p_tenant_id uuid,
  p_student_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select coalesce(jsonb_agg(item order by computed_at desc, release_id), '[]'::jsonb)
  from (
    select
      pp.computed_at,
      pp.lesson_release_id as release_id,
      jsonb_build_object(
        'assignmentId', pp.assignment_id,
        'computedAt', pp.computed_at,
        'lastActivityAt', pp.last_activity_at,
        'lessonReleaseId', pp.lesson_release_id,
        'lessonTitle', pp.lesson_title,
        'projectionVersion', 'progress_projection_v1',
        'reviewedPages', pp.reviewed_pages,
        'stale', pp.stale,
        'totalPages', pp.total_pages
      ) as item
    from public.progress_projections_v1 as pp
    where pp.tenant_id = p_tenant_id
      and pp.student_id = p_student_id
      and pp.expires_at > statement_timestamp()
  ) as lessons;
$$;

create or replace function private.family_skills_json_v1(
  p_tenant_id uuid,
  p_student_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select coalesce(jsonb_agg(item order by computed_at desc, skill_id), '[]'::jsonb)
  from (
    select
      sp.computed_at,
      sp.skill_id,
      jsonb_build_object(
        'band', sp.band,
        'computedAt', sp.computed_at,
        'evidenceCount', sp.evidence_count,
        'explanation', sp.explanation,
        'projectionVersion', 'skill_projection_v1',
        'skillId', sp.skill_id,
        'skillName', sp.skill_name,
        'stale', sp.stale,
        'windowStartsAt', sp.window_starts_at,
        'windowEndsAt', sp.window_ends_at
      ) as item
    from public.skill_projections_v1 as sp
    where sp.tenant_id = p_tenant_id
      and sp.student_id = p_student_id
      and sp.expires_at > statement_timestamp()
  ) as skills;
$$;

create or replace function private.family_threads_json_v1(
  p_tenant_id uuid,
  p_student_id uuid,
  p_guardian_user_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select coalesce(jsonb_agg(item order by last_message_at desc, thread_id), '[]'::jsonb)
  from (
    select
      ft.id as thread_id,
      coalesce(latest.last_message_at, ft.created_at) as last_message_at,
      jsonb_build_object(
        'childId', ft.child_id,
        'id', ft.id,
        'lastMessageAt', coalesce(latest.last_message_at, ft.created_at),
        'messages', coalesce(messages.items, '[]'::jsonb),
        'participantLabel', staff.display_name,
        'status', ft.status,
        'topic', ft.topic,
        'unreadCount', coalesce(unread.message_count, 0)
      ) as item
    from public.family_threads as ft
    join public.app_users as staff on staff.id = ft.staff_user_id
    left join lateral (
      select max(fm.created_at) as last_message_at
      from public.family_messages as fm
      where fm.tenant_id = ft.tenant_id and fm.thread_id = ft.id
    ) as latest on true
    left join lateral (
      select jsonb_agg(message_item order by created_at, message_id) as items
      from (
        select
          fm.created_at,
          fm.id as message_id,
          jsonb_build_object(
            'body', fm.body,
            'id', fm.id,
            'mine', fm.sender_user_id = p_guardian_user_id,
            'redacted', fm.redacted_at is not null,
            'senderLabel', sender.display_name,
            'sentAt', fm.created_at
          ) as message_item
        from public.family_messages as fm
        join public.app_users as sender on sender.id = fm.sender_user_id
        where fm.tenant_id = ft.tenant_id and fm.thread_id = ft.id
        order by fm.created_at desc, fm.id desc
        limit 200
      ) as recent_messages
    ) as messages on true
    left join lateral (
      select count(*)::integer as message_count
      from public.family_messages as fm
      left join public.family_thread_reads as ftr
        on ftr.tenant_id = ft.tenant_id
        and ftr.thread_id = ft.id
        and ftr.app_user_id = p_guardian_user_id
      where fm.tenant_id = ft.tenant_id
        and fm.thread_id = ft.id
        and fm.sender_user_id <> p_guardian_user_id
        and fm.created_at > coalesce(ftr.last_read_at, '-infinity'::timestamptz)
    ) as unread on true
    where ft.tenant_id = p_tenant_id
      and ft.child_id = p_student_id
      and ft.guardian_user_id = p_guardian_user_id
  ) as threads;
$$;

create or replace function private.family_announcements_json_v1(
  p_tenant_id uuid,
  p_school_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select coalesce(jsonb_agg(item order by published_at desc, announcement_id), '[]'::jsonb)
  from (
    select
      sa.published_at,
      sa.id as announcement_id,
      jsonb_build_object(
        'body', sa.body,
        'id', sa.id,
        'publishedAt', sa.published_at,
        'publisherLabel', publisher.display_name,
        'title', sa.title
      ) as item
    from public.school_announcements as sa
    join public.app_users as publisher on publisher.id = sa.publisher_user_id
    where sa.tenant_id = p_tenant_id
      and sa.school_id = p_school_id
      and sa.published_at <= statement_timestamp()
      and (sa.expires_at is null or sa.expires_at > statement_timestamp())
  ) as announcements;
$$;

create or replace function public.family_workspace_v1(p_child_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_guardian_user_id uuid;
  v_link public.guardian_links%rowtype;
  v_student public.students%rowtype;
  v_school public.schools%rowtype;
  v_tenant public.tenants%rowtype;
  v_assignments jsonb;
  v_lessons jsonb;
  v_skills jsonb;
  v_threads jsonb;
  v_message_contacts jsonb;
  v_announcements jsonb;
  v_children jsonb;
  v_preference jsonb;
  v_completed_pages integer;
  v_latest_activity timestamptz;
  v_data_updated timestamptz;
  v_growing_skills jsonb;
  v_support jsonb;
  v_unread integer;
begin
  v_guardian_user_id := private.require_family_app_user();

  select gl.* into v_link
  from public.guardian_links as gl
  join public.tenants as t on t.id = gl.tenant_id
  join public.students as linked_student
    on linked_student.tenant_id = gl.tenant_id
    and linked_student.id = gl.student_id
  join public.schools as linked_school
    on linked_school.tenant_id = linked_student.tenant_id
    and linked_school.id = linked_student.school_id
  where gl.guardian_user_id = v_guardian_user_id
    and gl.status = 'active'
    and (gl.expires_at is null or gl.expires_at > statement_timestamp())
    and t.family_portal_enabled
    and t.status = 'active'
    and linked_student.active and linked_school.active
    and exists (
      select 1 from public.role_bindings as guardian_role
      where guardian_role.tenant_id = gl.tenant_id
        and guardian_role.app_user_id = gl.guardian_user_id
        and guardian_role.role = 'guardian'
        and guardian_role.active
        and guardian_role.starts_at <= statement_timestamp()
        and (guardian_role.ends_at is null
          or guardian_role.ends_at > statement_timestamp())
    )
    and (p_child_id is null or gl.student_id = p_child_id)
  order by gl.created_at, gl.id
  limit 1;

  if v_link.id is null then
    raise exception using errcode = 'P0002', message = 'family child not found';
  end if;

  select * into strict v_student
  from public.students
  where tenant_id = v_link.tenant_id and id = v_link.student_id and active;
  select * into strict v_school
  from public.schools
  where tenant_id = v_student.tenant_id and id = v_student.school_id and active;
  select * into strict v_tenant
  from public.tenants
  where id = v_student.tenant_id and status = 'active' and family_portal_enabled;

  v_assignments := private.family_assignments_json_v1(v_tenant.id, v_student.id);
  v_lessons := private.family_lessons_json_v1(v_tenant.id, v_student.id);
  v_skills := private.family_skills_json_v1(v_tenant.id, v_student.id);
  v_threads := private.family_threads_json_v1(
    v_tenant.id, v_student.id, v_guardian_user_id
  );
  v_announcements := private.family_announcements_json_v1(v_tenant.id, v_school.id);

  select coalesce(jsonb_agg(item order by staff_display_name, staff_user_id), '[]'::jsonb)
  into v_message_contacts
  from (
    select
      current_staff.staff_display_name,
      current_staff.staff_user_id,
      jsonb_build_object(
        'childId', v_student.id,
        'enrollmentId', current_staff.enrollment_id,
        'staffDisplayName', current_staff.staff_display_name,
        'staffUserId', current_staff.staff_user_id
      ) as item
    from (
      select distinct on (csb.teacher_user_id)
        e.id as enrollment_id,
        staff.display_name as staff_display_name,
        csb.teacher_user_id as staff_user_id
      from public.enrollments as e
      join public.classes as c
        on c.tenant_id = e.tenant_id
        and c.id = e.class_id
        and c.school_id = v_school.id
        and c.active
      join public.class_staff_bindings as csb
        on csb.tenant_id = e.tenant_id
        and csb.class_id = e.class_id
        and csb.active
        and csb.starts_at <= statement_timestamp()
        and (csb.ends_at is null or csb.ends_at > statement_timestamp())
      join public.app_users as staff
        on staff.id = csb.teacher_user_id
        and staff.status = 'active'
      join public.role_bindings as teacher_role
        on teacher_role.tenant_id = e.tenant_id
        and teacher_role.app_user_id = csb.teacher_user_id
        and teacher_role.role = 'teacher'
        and teacher_role.school_id = v_school.id
        and teacher_role.active
        and teacher_role.starts_at <= statement_timestamp()
        and (teacher_role.ends_at is null
          or teacher_role.ends_at > statement_timestamp())
      where e.tenant_id = v_tenant.id
        and e.student_id = v_student.id
        and e.status = 'active'
        and e.starts_at <= current_date
        and (e.ends_at is null or e.ends_at >= current_date)
      order by csb.teacher_user_id, e.starts_at desc, e.id
    ) as current_staff
    order by current_staff.staff_display_name, current_staff.staff_user_id
    limit 50
  ) as allowed_contacts;

  select coalesce(jsonb_agg(item order by display_name, student_id), '[]'::jsonb)
  into v_children
  from (
    select
      child.display_name,
      child.id as student_id,
      jsonb_build_object(
        'dataUpdatedAt', greatest(
          child.updated_at,
          (select max(pp.computed_at) from public.progress_projections_v1 as pp
            where pp.tenant_id = child.tenant_id and pp.student_id = child.id),
          (select max(sp.computed_at) from public.skill_projections_v1 as sp
            where sp.tenant_id = child.tenant_id and sp.student_id = child.id),
          (select max(le.recorded_at) from public.learning_events_v2 as le
            where le.tenant_id = child.tenant_id and le.student_id = child.id)
        ),
        'displayName', child.display_name,
        'gradeLabel', child.grade_label,
        'id', child.id,
        'linkStatus', 'active',
        'schoolName', child_school.display_name
      ) as item
    from public.guardian_links as child_link
    join public.students as child
      on child.tenant_id = child_link.tenant_id and child.id = child_link.student_id
    join public.schools as child_school
      on child_school.tenant_id = child.tenant_id and child_school.id = child.school_id
    where child_link.tenant_id = v_tenant.id
      and child_link.guardian_user_id = v_guardian_user_id
      and child_link.status = 'active'
      and (child_link.expires_at is null or child_link.expires_at > statement_timestamp())
      and child.active and child_school.active
      and exists (
        select 1 from public.role_bindings as guardian_role
        where guardian_role.tenant_id = child_link.tenant_id
          and guardian_role.app_user_id = child_link.guardian_user_id
          and guardian_role.role = 'guardian'
          and guardian_role.active
          and guardian_role.starts_at <= statement_timestamp()
          and (guardian_role.ends_at is null
            or guardian_role.ends_at > statement_timestamp())
      )
  ) as linked_children;

  select jsonb_build_object(
    'messageEmailEnabled', coalesce(fnp.message_email_enabled, false),
    'weeklyDigestEnabled', coalesce(fnp.weekly_digest_enabled, false)
  ) into v_preference
  from (select 1) as singleton
  left join public.family_notification_preferences as fnp
    on fnp.tenant_id = v_tenant.id and fnp.app_user_id = v_guardian_user_id;

  select count(*)::integer into v_completed_pages
  from public.learning_events_v2 as le
  where le.tenant_id = v_tenant.id
    and le.student_id = v_student.id
    and le.event_type = 'page_reviewed'
    and le.occurred_at >= date_trunc('week', statement_timestamp());

  select max(le.occurred_at) into v_latest_activity
  from public.learning_events_v2 as le
  where le.tenant_id = v_tenant.id and le.student_id = v_student.id;

  select greatest(
    v_student.updated_at,
    (select max(pp.computed_at) from public.progress_projections_v1 as pp
      where pp.tenant_id = v_tenant.id and pp.student_id = v_student.id),
    (select max(sp.computed_at) from public.skill_projections_v1 as sp
      where sp.tenant_id = v_tenant.id and sp.student_id = v_student.id),
    (select max(le.recorded_at) from public.learning_events_v2 as le
      where le.tenant_id = v_tenant.id and le.student_id = v_student.id)
  ) into v_data_updated;

  select coalesce(jsonb_agg(value), '[]'::jsonb) into v_growing_skills
  from (
    select value
    from jsonb_array_elements(v_skills) as skill(value)
    where value ->> 'band' = 'growing'
    order by value ->> 'computedAt' desc
    limit 3
  ) as top_skills;

  select jsonb_build_object(
    'description', pp.support_description,
    'source', pp.support_source,
    'title', pp.support_title
  ) into v_support
  from public.progress_projections_v1 as pp
  where pp.tenant_id = v_tenant.id
    and pp.student_id = v_student.id
    and pp.support_title is not null
    and pp.expires_at > statement_timestamp()
  order by pp.computed_at desc
  limit 1;

  select coalesce(sum((thread ->> 'unreadCount')::integer), 0)::integer
  into v_unread
  from jsonb_array_elements(v_threads) as thread;

  return jsonb_build_object(
    'assignments', v_assignments,
    'children', v_children,
    'lessons', v_lessons,
    'messageContacts', v_message_contacts,
    'notificationPreference', v_preference,
    'overview', jsonb_build_object(
      'announcements', v_announcements,
      'assignments', v_assignments,
      'completedLessonPagesThisWeek', v_completed_pages,
      'dataUpdatedAt', v_data_updated,
      'growingSkills', v_growing_skills,
      'latestActivityAt', v_latest_activity,
      'supportActivity', v_support,
      'unreadMessageCount', v_unread
    ),
    'selectedChildId', v_student.id,
    'skills', v_skills,
    'tenant', jsonb_build_object(
      'displayName', v_tenant.display_name,
      'id', v_tenant.id
    ),
    'threads', v_threads
  );
end;
$$;

create or replace function public.create_guardian_invitation_v1(
  p_student_id uuid,
  p_email_digest text,
  p_email_ciphertext text,
  p_token_digest text,
  p_encrypted_outbox_token text,
  p_expires_at timestamptz,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_student public.students%rowtype;
  v_invitation public.guardian_invitations%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  v_actor_id := private.require_family_app_user();

  select * into v_student from public.students where id = p_student_id and active;
  if v_student.id is null
    or not public.family_can_manage_student_v1(v_student.tenant_id, v_student.id)
  then
    raise exception using errcode = 'P0002', message = 'student not found';
  end if;

  select * into v_invitation
  from public.guardian_invitations
  where tenant_id = v_student.tenant_id
    and invited_by_user_id = v_actor_id
    and create_idempotency_key = p_idempotency_key;
  if v_invitation.id is not null then
    if v_invitation.student_id <> p_student_id
      or v_invitation.recipient_email_digest <> p_email_digest
    then
      raise exception using errcode = '22023', message = 'idempotency key conflict';
    end if;
    return jsonb_build_object(
      'invitation_id', v_invitation.id,
      'expires_at', v_invitation.expires_at
    );
  end if;

  if p_email_digest !~ '^[0-9a-f]{64}$'
    or p_token_digest !~ '^[0-9a-f]{64}$'
    or char_length(p_email_ciphertext) not between 16 and 8192
    or char_length(p_encrypted_outbox_token) not between 16 and 8192
    or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '8 days'
  then
    raise exception using errcode = '22023', message = 'invalid invitation material';
  end if;

  insert into public.guardian_invitations (
    tenant_id, environment_id, data_mode, school_id, student_id,
    invited_by_user_id, recipient_email_digest, recipient_email_ciphertext,
    token_digest, create_idempotency_key, last_delivery_idempotency_key,
    retention_anchor_at, expires_at
  ) values (
    v_student.tenant_id, v_student.environment_id, v_student.data_mode,
    v_student.school_id, v_student.id, v_actor_id, p_email_digest,
    p_email_ciphertext, p_token_digest, p_idempotency_key,
    p_idempotency_key, statement_timestamp(), p_expires_at
  ) returning * into v_invitation;

  insert into public.notification_outbox (
    tenant_id, environment_id, data_mode, kind, recipient_email_digest,
    recipient_email_ciphertext, locale, idempotency_key, aggregate_type,
    aggregate_id, payload, retention_anchor_at, expires_at
  ) values (
    v_student.tenant_id, v_student.environment_id, v_student.data_mode,
    'guardian_invitation', p_email_digest, p_email_ciphertext,
    v_student.locale, p_idempotency_key || ':invite', 'guardian_invitation',
    v_invitation.id,
    jsonb_build_object(
      'kind', 'guardian_invitation',
      'encryptedInvitationToken', p_encrypted_outbox_token
    ),
    statement_timestamp(), least(
      p_expires_at, statement_timestamp() + interval '30 days'
    )
  );

  return jsonb_build_object(
    'invitation_id', v_invitation.id,
    'expires_at', v_invitation.expires_at
  );
end;
$$;

create or replace function public.resend_guardian_invitation_v1(
  p_invitation_id uuid,
  p_token_digest text,
  p_encrypted_outbox_token text,
  p_expires_at timestamptz,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_invitation public.guardian_invitations%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  v_actor_id := private.require_family_app_user();
  select * into v_invitation
  from public.guardian_invitations
  where id = p_invitation_id
  for update;

  if v_invitation.id is null
    or not public.family_can_manage_student_v1(
      v_invitation.tenant_id, v_invitation.student_id
    )
  then
    raise exception using errcode = 'P0002', message = 'invitation not found';
  end if;
  if v_invitation.last_delivery_idempotency_key = p_idempotency_key then
    return jsonb_build_object(
      'invitation_id', v_invitation.id,
      'expires_at', v_invitation.expires_at
    );
  end if;
  if v_invitation.status <> 'pending' then
    raise exception using errcode = 'P0003', message = 'invitation is not pending';
  end if;
  if p_token_digest !~ '^[0-9a-f]{64}$'
    or char_length(p_encrypted_outbox_token) not between 16 and 8192
    or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '8 days'
  then
    raise exception using errcode = '22023', message = 'invalid invitation material';
  end if;

  update public.notification_outbox
  set status = 'cancelled', claimed_at = null,
      claim_token = null, claim_expires_at = null
  where tenant_id = v_invitation.tenant_id
    and kind = 'guardian_invitation'
    and aggregate_id = v_invitation.id
    and status = 'pending';

  update public.guardian_invitations
  set token_digest = p_token_digest,
      last_delivery_idempotency_key = p_idempotency_key,
      send_count = send_count + 1,
      last_sent_at = clock_timestamp(),
      retention_anchor_at = statement_timestamp(),
      expires_at = p_expires_at
  where tenant_id = v_invitation.tenant_id and id = v_invitation.id
  returning * into v_invitation;

  insert into public.notification_outbox (
    tenant_id, environment_id, data_mode, kind, recipient_email_digest,
    recipient_email_ciphertext, locale, idempotency_key, aggregate_type,
    aggregate_id, payload, retention_anchor_at, expires_at
  )
  select
    v_invitation.tenant_id, v_invitation.environment_id, v_invitation.data_mode,
    'guardian_invitation', v_invitation.recipient_email_digest,
    v_invitation.recipient_email_ciphertext, s.locale,
    p_idempotency_key || ':invite', 'guardian_invitation', v_invitation.id,
    jsonb_build_object(
      'kind', 'guardian_invitation',
      'encryptedInvitationToken', p_encrypted_outbox_token
    ),
    statement_timestamp(), least(
      p_expires_at, statement_timestamp() + interval '30 days'
    )
  from public.students as s
  where s.tenant_id = v_invitation.tenant_id and s.id = v_invitation.student_id;

  return jsonb_build_object(
    'invitation_id', v_invitation.id,
    'expires_at', v_invitation.expires_at
  );
end;
$$;

create or replace function public.accept_guardian_invitation_v1(
  p_token_digest text,
  p_verified_email_digest text,
  p_idempotency_key text
)
returns table (guardian_link_id uuid, student_id uuid, tenant_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
set row_security = off
as $$
declare
  v_invitation public.guardian_invitations%rowtype;
  v_issuer text;
  v_subject text;
  v_display_name text;
  v_locale text;
  v_user_id uuid;
  v_link_id uuid;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if p_token_digest !~ '^[0-9a-f]{64}$'
    or p_verified_email_digest !~ '^[0-9a-f]{64}$'
  then
    raise exception using errcode = 'P0003', message = 'invalid invitation';
  end if;

  select * into v_invitation
  from public.guardian_invitations
  where token_digest = p_token_digest
  for update;
  if v_invitation.id is null then
    raise exception using errcode = 'P0003', message = 'invalid invitation';
  end if;
  if v_invitation.status = 'pending'
    and v_invitation.expires_at <= statement_timestamp()
  then
    raise exception using errcode = 'P0004', message = 'invitation expired';
  end if;
  if v_invitation.status not in ('pending', 'accepted') then
    raise exception using errcode = 'P0003', message = 'invalid invitation';
  end if;

  v_issuer := private.jwt_claim('iss');
  v_subject := private.jwt_claim('sub');
  if v_issuer is null or v_subject is null then
    raise exception using errcode = '42501', message = 'provider identity required';
  end if;

  if not exists (
    select 1
    from public.tenant_identity_issuers as tip
    where tip.tenant_id = v_invitation.tenant_id
      and tip.issuer = v_issuer
      and tip.active
  ) then
    raise exception using errcode = '42501',
      message = 'identity provider is not allowed';
  end if;

  perform 1
  from public.tenants as t
  join public.schools as sc
    on sc.tenant_id = t.id and sc.id = v_invitation.school_id
  join public.students as s
    on s.tenant_id = t.id and s.id = v_invitation.student_id
    and s.school_id = sc.id
  where t.id = v_invitation.tenant_id
    and t.environment_id = v_invitation.environment_id
    and t.data_mode = v_invitation.data_mode
    and t.status = 'active' and t.family_portal_enabled
    and sc.active and s.active
  for key share of t, sc, s;
  if not found then
    raise exception using errcode = 'P0003', message = 'invalid invitation';
  end if;

  perform 1
  from public.enrollments as e
  join public.classes as c
    on c.tenant_id = e.tenant_id and c.id = e.class_id
  where e.tenant_id = v_invitation.tenant_id
    and e.student_id = v_invitation.student_id
    and e.status = 'active'
    and e.starts_at <= current_date
    and (e.ends_at is null or e.ends_at >= current_date)
    and c.school_id = v_invitation.school_id and c.active
  limit 1
  for key share of e, c;
  if not found then
    raise exception using errcode = 'P0003', message = 'invalid invitation';
  end if;

  -- The keyed HMAC is computed only by the trusted server action from the
  -- provider-verified email. The database never stores the HMAC key or reads
  -- plaintext email; possession of the invitation token alone is insufficient.
  if p_verified_email_digest <> v_invitation.recipient_email_digest then
    raise exception using errcode = 'P0005', message = 'verified email mismatch';
  end if;

  -- Serialize bootstrap for a previously unseen issuer + subject. The caller
  -- cannot supply an actor, tenant, role, display name, or identity key.
  perform pg_advisory_xact_lock(
    hashtextextended(v_issuer || chr(31) || v_subject, 73295631)
  );
  select pi.app_user_id into v_user_id
  from public.provider_identities as pi
  join public.app_users as au on au.id = pi.app_user_id
  where pi.issuer = v_issuer and pi.subject = v_subject
    and pi.active and au.status = 'active';

  if v_user_id is null then
    if exists (
      select 1 from public.provider_identities as pi
      where pi.issuer = v_issuer and pi.subject = v_subject
    ) then
      raise exception using errcode = '42501', message = 'identity is revoked';
    end if;
    v_display_name := 'Family member';
    v_locale := 'en';
    insert into public.app_users (
      display_name, locale, notification_email_digest,
      notification_email_ciphertext
    ) values (
      v_display_name, v_locale, v_invitation.recipient_email_digest,
      v_invitation.recipient_email_ciphertext
    ) returning id into v_user_id;
    insert into public.provider_identities (
      issuer, subject, app_user_id, active, last_seen_at
    ) values (
      v_issuer, v_subject, v_user_id, true, clock_timestamp()
    );
  else
    update public.provider_identities
    set last_seen_at = clock_timestamp()
    where issuer = v_issuer and subject = v_subject;
    update public.app_users
    set notification_email_digest = coalesce(
          notification_email_digest, v_invitation.recipient_email_digest
        ),
        notification_email_ciphertext = coalesce(
          notification_email_ciphertext, v_invitation.recipient_email_ciphertext
        )
    where id = v_user_id
      and (
        notification_email_digest is null
        or notification_email_digest = v_invitation.recipient_email_digest
      );
    if exists (
      select 1 from public.app_users
      where id = v_user_id
        and notification_email_digest is distinct from v_invitation.recipient_email_digest
    ) then
      raise exception using errcode = 'P0005', message = 'verified email mismatch';
    end if;
  end if;

  if v_invitation.status = 'accepted' then
    if v_invitation.accepted_by_user_id <> v_user_id
      or v_invitation.acceptance_idempotency_key <> p_idempotency_key
    then
      raise exception using errcode = 'P0003', message = 'invitation already accepted';
    end if;
    if not exists (
      select 1 from public.role_bindings as guardian_role
      where guardian_role.tenant_id = v_invitation.tenant_id
        and guardian_role.app_user_id = v_user_id
        and guardian_role.role = 'guardian'
        and guardian_role.active
        and guardian_role.starts_at <= statement_timestamp()
        and (guardian_role.ends_at is null
          or guardian_role.ends_at > statement_timestamp())
    ) then
      raise exception using errcode = '42501', message = 'guardian role inactive';
    end if;
    select gl.id into v_link_id
    from public.guardian_links as gl
    where gl.tenant_id = v_invitation.tenant_id
      and gl.guardian_user_id = v_user_id
      and gl.student_id = v_invitation.student_id
      and gl.status = 'active'
      and (gl.expires_at is null or gl.expires_at > statement_timestamp())
    order by gl.created_at desc limit 1
    for update;
    if v_link_id is null then
      raise exception using errcode = 'P0003', message = 'invalid invitation';
    end if;
    return query select v_link_id, v_invitation.student_id, v_invitation.tenant_id;
    return;
  end if;

  if exists (
    select 1 from public.role_bindings as guardian_role
    where guardian_role.tenant_id = v_invitation.tenant_id
      and guardian_role.app_user_id = v_user_id
      and guardian_role.role = 'guardian'
  ) and not exists (
    select 1 from public.role_bindings as guardian_role
    where guardian_role.tenant_id = v_invitation.tenant_id
      and guardian_role.app_user_id = v_user_id
      and guardian_role.role = 'guardian'
      and guardian_role.active
      and guardian_role.starts_at <= statement_timestamp()
      and (guardian_role.ends_at is null
        or guardian_role.ends_at > statement_timestamp())
  ) then
    raise exception using errcode = '42501', message = 'guardian role inactive';
  end if;

  insert into public.role_bindings (
    tenant_id, environment_id, data_mode, app_user_id, role, active
  ) values (
    v_invitation.tenant_id, v_invitation.environment_id,
    v_invitation.data_mode, v_user_id, 'guardian', true
  ) on conflict do nothing;

  if not exists (
    select 1 from public.role_bindings as guardian_role
    where guardian_role.tenant_id = v_invitation.tenant_id
      and guardian_role.app_user_id = v_user_id
      and guardian_role.role = 'guardian'
      and guardian_role.active
      and guardian_role.starts_at <= statement_timestamp()
      and (guardian_role.ends_at is null
        or guardian_role.ends_at > statement_timestamp())
  ) then
    raise exception using errcode = '42501', message = 'guardian role inactive';
  end if;

  select gl.id into v_link_id
  from public.guardian_links as gl
  where gl.tenant_id = v_invitation.tenant_id
    and gl.guardian_user_id = v_user_id
    and gl.student_id = v_invitation.student_id
    and gl.status = 'active'
    and (gl.expires_at is null or gl.expires_at > statement_timestamp())
  order by gl.created_at desc limit 1
  for update;
  if v_link_id is null then
    if exists (
      select 1 from public.guardian_links as gl
      where gl.tenant_id = v_invitation.tenant_id
        and gl.guardian_user_id = v_user_id
        and gl.student_id = v_invitation.student_id
        and gl.status in ('pending', 'active')
    ) then
      raise exception using errcode = '42501', message = 'guardian link inactive';
    end if;
    insert into public.guardian_links (
      tenant_id, environment_id, data_mode, guardian_user_id, student_id,
      relationship_kind, status, created_by_user_id, verified_at
    ) values (
      v_invitation.tenant_id, v_invitation.environment_id,
      v_invitation.data_mode, v_user_id, v_invitation.student_id,
      'parent', 'active', v_invitation.invited_by_user_id, clock_timestamp()
    ) returning id into v_link_id;
  end if;

  update public.guardian_invitations as gi
  set status = 'accepted', accepted_at = clock_timestamp(),
      accepted_by_user_id = v_user_id,
      acceptance_idempotency_key = p_idempotency_key
  where gi.tenant_id = v_invitation.tenant_id and gi.id = v_invitation.id;

  update public.notification_outbox as nox
  set status = 'cancelled', claimed_at = null,
      claim_token = null, claim_expires_at = null
  where nox.tenant_id = v_invitation.tenant_id
    and nox.kind = 'guardian_invitation'
    and nox.aggregate_id = v_invitation.id
    and nox.status = 'pending';

  return query select v_link_id, v_invitation.student_id, v_invitation.tenant_id;
end;
$$;

create or replace function public.revoke_guardian_invitation_v1(
  p_invitation_id uuid,
  p_idempotency_key text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_invitation public.guardian_invitations%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if p_reason is null or char_length(btrim(p_reason)) not between 1 and 500 then
    raise exception using errcode = '22023', message = 'invalid revocation reason';
  end if;
  v_actor_id := private.require_family_app_user();
  select * into v_invitation
  from public.guardian_invitations
  where id = p_invitation_id
  for update;
  if v_invitation.id is null
    or not public.family_can_manage_student_v1(
      v_invitation.tenant_id, v_invitation.student_id
    )
  then
    raise exception using errcode = 'P0002', message = 'invitation not found';
  end if;
  if v_invitation.status = 'revoked'
    and v_invitation.revocation_idempotency_key = p_idempotency_key
  then
    return;
  end if;
  if v_invitation.status <> 'pending' then
    raise exception using errcode = 'P0003', message = 'invitation is not pending';
  end if;

  update public.guardian_invitations
  set status = 'revoked', revoked_at = clock_timestamp(),
      revoked_by_user_id = v_actor_id,
      revocation_idempotency_key = p_idempotency_key
  where tenant_id = v_invitation.tenant_id and id = v_invitation.id;
  update public.notification_outbox
  set status = 'cancelled', claimed_at = null,
      claim_token = null, claim_expires_at = null
  where tenant_id = v_invitation.tenant_id
    and kind = 'guardian_invitation'
    and aggregate_id = v_invitation.id
    and status = 'pending';
end;
$$;

revoke all on function private.assert_family_idempotency_key(text) from public;
revoke all on function private.require_family_app_user() from public;
revoke all on function private.family_assignments_json_v1(uuid, uuid) from public;
revoke all on function private.family_lessons_json_v1(uuid, uuid) from public;
revoke all on function private.family_skills_json_v1(uuid, uuid) from public;
revoke all on function private.family_threads_json_v1(uuid, uuid, uuid) from public;
revoke all on function private.family_announcements_json_v1(uuid, uuid) from public;

revoke all on function public.family_workspace_v1(uuid) from public;
revoke all on function public.create_guardian_invitation_v1(
  uuid, text, text, text, text, timestamptz, text
) from public;
revoke all on function public.resend_guardian_invitation_v1(
  uuid, text, text, timestamptz, text
) from public;
revoke all on function public.accept_guardian_invitation_v1(
  text, text, text
)
  from public;
revoke all on function public.revoke_guardian_invitation_v1(uuid, text, text)
  from public;

grant execute on function public.family_workspace_v1(uuid) to authenticated;
grant execute on function public.accept_guardian_invitation_v1(
  text, text, text
) to authenticated;
grant execute on function public.revoke_guardian_invitation_v1(uuid, text, text)
  to authenticated;

comment on function public.accept_guardian_invitation_v1(
  text, text, text
) is
  'Bootstraps the signed JWT issuer+subject only after the Next server verifies the provider primary email and submits its server-only keyed HMAC with the one-use token. PostgreSQL stores neither the HMAC key nor plaintext email.';

comment on function public.create_guardian_invitation_v1(
  uuid, text, text, text, text, timestamptz, text
) is
  'Reserved for a future dedicated invitation issuer with independently verifiable upstream attestation. It is intentionally not executable by authenticated or service_role.';

comment on function public.resend_guardian_invitation_v1(
  uuid, text, text, timestamptz, text
) is
  'Reserved for a future dedicated invitation issuer with independently verifiable upstream attestation. It is intentionally not executable by authenticated or service_role.';

commit;
