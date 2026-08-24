-- HELP Math family portal: explicit guardian-tenant workspace selection and
-- the database-authoritative lower bound for the approved messaging kill
-- switch.
--
-- This migration intentionally does not add separate invitation,
-- relationship, projection, export, or curriculum product flags. The approved
-- product controls remain FAMILY_PORTAL_ENABLED,
-- FAMILY_MESSAGING_ENABLED, FAMILY_EMAIL_NOTIFICATIONS_ENABLED, and the
-- tenant family_portal_enabled boundary. family_messaging_enabled is the
-- database-side safety mirror that prevents authenticated direct-RPC bypass.

begin;

alter table public.tenants
  add column family_messaging_enabled boolean not null default false;

comment on column public.tenants.family_messaging_enabled is
  'Default-off database lower bound for the approved Family messaging kill switch. Read-only Family growth data, revocation, relinquishment, redaction, and retention remain available when false.';

-- Preference idempotency must survive later preference changes. The mutable
-- preference row cannot prove a non-adjacent replay, so keep a private,
-- immutable receipt for every accepted mutation. Receipts cascade with the
-- lifecycle-governed preference and never expose a browser table surface.
create table public.family_notification_preference_mutations (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  app_user_id uuid not null,
  client_mutation_id text not null,
  message_email_enabled boolean not null,
  weekly_digest_enabled boolean not null,
  locale text not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, app_user_id, client_mutation_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, app_user_id)
    references public.family_notification_preferences (tenant_id, app_user_id)
    on update restrict on delete cascade,
  constraint family_notification_preference_mutations_idempotency check (
    char_length(client_mutation_id) between 8 and 128
    and client_mutation_id ~ '^[A-Za-z0-9._:-]+$'
  ),
  constraint family_notification_preference_mutations_locale check (
    locale in ('en', 'es')
  )
);

alter table public.family_notification_preference_mutations enable row level security;
revoke all on table public.family_notification_preference_mutations
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

comment on table public.family_notification_preference_mutations is
  'Owner-only immutable idempotency receipts. Contains no email, provider subject, token, message body, or student data and is deleted with its lifecycle-governed preference.';

-- 009 added access-time lifecycle clocks after the original identity helpers
-- were defined. Rebind every downstream authorization helper to a currently
-- usable provider identity, application user, role, and tenant.
create or replace function public.family_current_app_user_id_v1()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select identity.app_user_id
  from public.provider_identities as identity
  join public.app_users as app_user on app_user.id = identity.app_user_id
  where identity.issuer = private.jwt_claim('iss')
    and identity.subject = private.jwt_claim('sub')
    and identity.active
    and identity.lifecycle_expires_at > statement_timestamp()
    and app_user.status = 'active'
    and app_user.lifecycle_expires_at > statement_timestamp()
  limit 1;
$$;

create or replace function public.family_has_role_v1(
  p_tenant_id uuid,
  p_roles public.app_role[],
  p_school_id uuid default null,
  p_student_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select exists (
    select 1
    from public.role_bindings as binding
    join public.tenants as tenant on tenant.id = binding.tenant_id
    where binding.tenant_id = p_tenant_id
      and binding.app_user_id = public.family_current_app_user_id_v1()
      and binding.role = any(p_roles)
      and binding.active
      and binding.starts_at <= statement_timestamp()
      and (binding.ends_at is null
        or binding.ends_at > statement_timestamp())
      and binding.lifecycle_expires_at > statement_timestamp()
      and tenant.status = 'active'
      and tenant.family_portal_enabled
      and (tenant.lifecycle_expires_at is null
        or tenant.lifecycle_expires_at > statement_timestamp())
      and (
        p_school_id is null
        or exists (
          select 1 from public.schools as scoped_school
          where scoped_school.tenant_id = p_tenant_id
            and scoped_school.id = p_school_id
            and scoped_school.active
        )
      )
      and (
        p_student_id is null
        or exists (
          select 1
          from public.students as scoped_student
          join public.schools as student_school
            on student_school.tenant_id = scoped_student.tenant_id
            and student_school.id = scoped_student.school_id
          where scoped_student.tenant_id = p_tenant_id
            and scoped_student.id = p_student_id
            and scoped_student.active
            and student_school.active
        )
      )
      and (
        binding.role = 'district_admin'
        or (p_school_id is null and p_student_id is null)
        or (binding.role in ('teacher', 'school_admin')
          and binding.school_id = p_school_id)
        or (binding.role = 'learner' and binding.student_id = p_student_id)
        or binding.role = 'guardian'
      )
  );
$$;

create or replace function private.family_invitation_admin_is_current_v1(
  p_tenant_id uuid,
  p_student_id uuid,
  p_actor_user_id uuid,
  p_actor_issuer text,
  p_actor_subject text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select exists (
    select 1
    from public.tenants as tenant
    join public.students as student
      on student.tenant_id = tenant.id and student.id = p_student_id
    join public.schools as school
      on school.tenant_id = student.tenant_id
      and school.id = student.school_id
    join public.app_users as actor on actor.id = p_actor_user_id
    join public.provider_identities as identity
      on identity.issuer = p_actor_issuer
      and identity.subject = p_actor_subject
      and identity.app_user_id = actor.id
    join public.tenant_identity_issuers as allowed_issuer
      on allowed_issuer.tenant_id = tenant.id
      and allowed_issuer.issuer = identity.issuer
    where tenant.id = p_tenant_id
      and tenant.status = 'active'
      and tenant.family_portal_enabled
      and tenant.data_mode = 'synthetic'
      and (tenant.lifecycle_expires_at is null
        or tenant.lifecycle_expires_at > statement_timestamp())
      and student.active and school.active
      and actor.status = 'active'
      and actor.lifecycle_expires_at > statement_timestamp()
      and identity.active
      and identity.lifecycle_expires_at > statement_timestamp()
      and allowed_issuer.active
      and exists (
        select 1
        from public.enrollments as enrollment
        join public.classes as class_row
          on class_row.tenant_id = enrollment.tenant_id
          and class_row.id = enrollment.class_id
          and class_row.school_id = student.school_id
          and class_row.active
        where enrollment.tenant_id = student.tenant_id
          and enrollment.student_id = student.id
          and enrollment.status = 'active'
          and enrollment.starts_at <= current_date
          and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
      )
      and exists (
        select 1
        from public.role_bindings as admin_role
        where admin_role.tenant_id = tenant.id
          and admin_role.app_user_id = actor.id
          and admin_role.role in ('school_admin', 'district_admin')
          and admin_role.active
          and admin_role.starts_at <= statement_timestamp()
          and (admin_role.ends_at is null
            or admin_role.ends_at > statement_timestamp())
          and admin_role.lifecycle_expires_at > statement_timestamp()
          and (
            admin_role.role = 'district_admin'
            or (
              admin_role.role = 'school_admin'
              and admin_role.school_id = student.school_id
            )
          )
      )
  );
$$;

-- FOR SHARE, unlike FOR KEY SHARE, conflicts with a non-key UPDATE of the
-- messaging flag. Callers acquire this tenant lock before any resource lock or
-- write, matching the tenant-toggle trigger's tenant -> outbox lock order.
create or replace function private.lock_family_messaging_tenant_v1(
  p_tenant_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
declare
  v_tenant_id uuid;
begin
  select tenant.id into v_tenant_id
  from public.tenants as tenant
  where tenant.id = p_tenant_id
    and tenant.status = 'active'
    and tenant.family_portal_enabled
    and tenant.family_messaging_enabled
    and (tenant.lifecycle_expires_at is null
      or tenant.lifecycle_expires_at > statement_timestamp())
  for share of tenant;
  if v_tenant_id is null then
    raise exception using errcode = '42501',
      message = 'family messaging disabled';
  end if;
end;
$$;

create or replace function private.family_thread_is_current_v1(
  p_tenant_id uuid,
  p_thread_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select exists (
    select 1
    from public.family_threads as thread
    join public.tenants as tenant
      on tenant.id = thread.tenant_id
      and tenant.status = 'active'
      and tenant.family_portal_enabled
      and (tenant.lifecycle_expires_at is null
        or tenant.lifecycle_expires_at > statement_timestamp())
    join public.students as student
      on student.tenant_id = thread.tenant_id
      and student.id = thread.child_id and student.active
    join public.schools as school
      on school.tenant_id = student.tenant_id
      and school.id = student.school_id
      and school.id = thread.school_id and school.active
    join public.enrollments as enrollment
      on enrollment.tenant_id = thread.tenant_id
      and enrollment.id = thread.enrollment_id
      and enrollment.student_id = thread.child_id
      and enrollment.status = 'active'
      and enrollment.starts_at <= current_date
      and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
    join public.classes as class_row
      on class_row.tenant_id = enrollment.tenant_id
      and class_row.id = enrollment.class_id
      and class_row.school_id = thread.school_id
      and class_row.active
    join public.app_users as guardian
      on guardian.id = thread.guardian_user_id
      and guardian.status = 'active'
      and guardian.lifecycle_expires_at > statement_timestamp()
    join public.app_users as staff
      on staff.id = thread.staff_user_id
      and staff.status = 'active'
      and staff.lifecycle_expires_at > statement_timestamp()
    where thread.tenant_id = p_tenant_id
      and thread.id = p_thread_id
      and thread.lifecycle_expires_at > statement_timestamp()
      and exists (
        select 1
        from public.provider_identities as guardian_identity
        where guardian_identity.app_user_id = guardian.id
          and guardian_identity.active
          and guardian_identity.lifecycle_expires_at > statement_timestamp()
      )
      and exists (
        select 1
        from public.provider_identities as staff_identity
        where staff_identity.app_user_id = staff.id
          and staff_identity.active
          and staff_identity.lifecycle_expires_at > statement_timestamp()
      )
      and exists (
        select 1
        from public.guardian_links as guardian_link
        join public.role_bindings as guardian_role
          on guardian_role.tenant_id = guardian_link.tenant_id
          and guardian_role.app_user_id = guardian_link.guardian_user_id
          and guardian_role.role = 'guardian'
          and guardian_role.active
          and guardian_role.starts_at <= statement_timestamp()
          and (guardian_role.ends_at is null
            or guardian_role.ends_at > statement_timestamp())
          and guardian_role.lifecycle_expires_at > statement_timestamp()
        where guardian_link.tenant_id = thread.tenant_id
          and guardian_link.student_id = thread.child_id
          and guardian_link.guardian_user_id = thread.guardian_user_id
          and guardian_link.status = 'active'
          and (guardian_link.expires_at is null
            or guardian_link.expires_at > statement_timestamp())
          and guardian_link.lifecycle_expires_at > statement_timestamp()
      )
      and exists (
        select 1
        from public.class_staff_bindings as staff_binding
        join public.role_bindings as teacher_role
          on teacher_role.tenant_id = staff_binding.tenant_id
          and teacher_role.app_user_id = staff_binding.teacher_user_id
          and teacher_role.role = 'teacher'
          and teacher_role.school_id = thread.school_id
          and teacher_role.active
          and teacher_role.starts_at <= statement_timestamp()
          and (teacher_role.ends_at is null
            or teacher_role.ends_at > statement_timestamp())
          and teacher_role.lifecycle_expires_at > statement_timestamp()
        where staff_binding.tenant_id = thread.tenant_id
          and staff_binding.class_id = enrollment.class_id
          and staff_binding.teacher_user_id = thread.staff_user_id
          and staff_binding.active
          and staff_binding.starts_at <= statement_timestamp()
          and (staff_binding.ends_at is null
            or staff_binding.ends_at > statement_timestamp())
      )
  );
$$;

create or replace function public.family_can_access_thread_v1(
  p_tenant_id uuid,
  p_thread_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select private.family_thread_is_current_v1(p_tenant_id, p_thread_id)
    and exists (
      select 1 from public.family_threads as thread
      where thread.tenant_id = p_tenant_id and thread.id = p_thread_id
        and public.family_current_app_user_id_v1() in (
          thread.guardian_user_id, thread.staff_user_id
        )
    );
$$;

-- Return the messaging lower bound only inside the server authorization
-- context. Browser tenant choices continue to expose only opaque id + label.
create or replace function public.family_authorization_context_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_app_user_id uuid;
  v_context jsonb;
begin
  v_app_user_id := public.family_current_app_user_id_v1();
  if v_app_user_id is null then
    raise exception using errcode = '42501',
      message = 'family identity is not mapped';
  end if;

  with tenant_roles as (
    select
      rb.tenant_id,
      t.display_name,
      t.environment_id,
      t.data_mode,
      t.family_messaging_enabled,
      jsonb_agg(distinct rb.role::text order by rb.role::text) as roles
    from public.role_bindings as rb
    join public.tenants as t on t.id = rb.tenant_id
    where rb.app_user_id = v_app_user_id
      and rb.active
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
      and rb.lifecycle_expires_at > statement_timestamp()
      and t.status = 'active'
      and t.family_portal_enabled
      and (t.lifecycle_expires_at is null
        or t.lifecycle_expires_at > statement_timestamp())
    group by
      rb.tenant_id, t.display_name, t.environment_id, t.data_mode,
      t.family_messaging_enabled
  )
  select jsonb_build_object(
    'appUserId', v_app_user_id,
    'tenants', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', tr.tenant_id,
          'displayName', tr.display_name,
          'environmentId', tr.environment_id,
          'dataMode', tr.data_mode,
          'messagingEnabled', tr.family_messaging_enabled,
          'roles', tr.roles
        ) order by tr.display_name, tr.tenant_id
      ),
      '[]'::jsonb
    )
  )
  into v_context
  from tenant_roles as tr;

  return v_context;
end;
$$;

-- Current, lifecycle-aware Family DTO projections. The 004 workspace predates
-- 009 lifecycle clocks, so returning its inline child/contact/preference rows
-- unchanged would make expired records readable until a retention sweep.
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
  select coalesce(
    jsonb_agg(item order by assigned_at desc, assignment_id), '[]'::jsonb
  )
  from (
    select
      assignment.assigned_at,
      assignment.id as assignment_id,
      jsonb_build_object(
        'id', assignment.id,
        'assignedAt', assignment.assigned_at,
        'dueAt', assignment.due_at,
        'familyNote', assignment.family_note,
        'lessonReleaseId', assignment.lesson_release_id,
        'lessonTitle', assignment.lesson_title,
        'reviewedPages', least(
          student_assignment.reviewed_pages, assignment.total_pages
        ),
        'status', case
          when student_assignment.status <> 'completed'
            and assignment.due_at is not null
            and assignment.due_at < statement_timestamp()
            then 'overdue'
          else student_assignment.status::text
        end,
        'teacherDisplayName', case
          when teacher.status = 'active'
            and teacher.lifecycle_expires_at > statement_timestamp()
            and exists (
              select 1
              from public.provider_identities as teacher_identity
              where teacher_identity.app_user_id = teacher.id
                and teacher_identity.active
                and teacher_identity.lifecycle_expires_at > statement_timestamp()
            )
            then teacher.display_name
          else 'School staff'
        end,
        'title', assignment.title,
        'totalPages', assignment.total_pages
      ) as item
    from public.student_assignments as student_assignment
    join public.enrollments as enrollment
      on enrollment.tenant_id = student_assignment.tenant_id
      and enrollment.id = student_assignment.enrollment_id
    join public.assignments as assignment
      on assignment.tenant_id = student_assignment.tenant_id
      and assignment.id = student_assignment.assignment_id
      and assignment.class_id = enrollment.class_id
    join public.classes as class_row
      on class_row.tenant_id = enrollment.tenant_id
      and class_row.id = enrollment.class_id and class_row.active
    join public.students as student
      on student.tenant_id = enrollment.tenant_id
      and student.id = enrollment.student_id and student.active
    join public.schools as school
      on school.tenant_id = student.tenant_id
      and school.id = student.school_id and school.active
    join public.app_users as teacher on teacher.id = assignment.teacher_user_id
    where student_assignment.tenant_id = p_tenant_id
      and enrollment.student_id = p_student_id
      and enrollment.status = 'active'
      and enrollment.starts_at <= current_date
      and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
      and class_row.school_id = student.school_id
  ) as assignments;
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
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select coalesce(
    jsonb_agg(item order by last_message_at desc, thread_id), '[]'::jsonb
  )
  from (
    select
      thread.id as thread_id,
      coalesce(latest.last_message_at, thread.created_at) as last_message_at,
      jsonb_build_object(
        'childId', thread.child_id,
        'id', thread.id,
        'lastMessageAt', coalesce(latest.last_message_at, thread.created_at),
        'messages', coalesce(messages.items, '[]'::jsonb),
        'participantLabel', staff.display_name,
        'status', thread.status,
        'topic', thread.topic,
        'unreadCount', coalesce(unread.message_count, 0)
      ) as item
    from public.family_threads as thread
    join public.app_users as staff
      on staff.id = thread.staff_user_id
      and staff.status = 'active'
      and staff.lifecycle_expires_at > statement_timestamp()
    left join lateral (
      select max(message.created_at) as last_message_at
      from public.family_messages as message
      join public.app_users as sender
        on sender.id = message.sender_user_id
        and sender.status = 'active'
        and sender.lifecycle_expires_at > statement_timestamp()
      where message.tenant_id = thread.tenant_id
        and message.thread_id = thread.id
        and message.expires_at > statement_timestamp()
    ) as latest on true
    left join lateral (
      select jsonb_agg(message_item order by created_at, message_id) as items
      from (
        select
          message.created_at,
          message.id as message_id,
          jsonb_build_object(
            'body', message.body,
            'id', message.id,
            'mine', message.sender_user_id = p_guardian_user_id,
            'redacted', message.redacted_at is not null,
            'senderLabel', sender.display_name,
            'sentAt', message.created_at
          ) as message_item
        from public.family_messages as message
        join public.app_users as sender
          on sender.id = message.sender_user_id
          and sender.status = 'active'
          and sender.lifecycle_expires_at > statement_timestamp()
        where message.tenant_id = thread.tenant_id
          and message.thread_id = thread.id
          and message.expires_at > statement_timestamp()
        order by message.created_at desc, message.id desc
        limit 200
      ) as recent_messages
    ) as messages on true
    left join lateral (
      select count(*)::integer as message_count
      from public.family_messages as message
      join public.app_users as sender
        on sender.id = message.sender_user_id
        and sender.status = 'active'
        and sender.lifecycle_expires_at > statement_timestamp()
      left join public.family_thread_reads as receipt
        on receipt.tenant_id = thread.tenant_id
        and receipt.thread_id = thread.id
        and receipt.app_user_id = p_guardian_user_id
        and receipt.lifecycle_expires_at > statement_timestamp()
      where message.tenant_id = thread.tenant_id
        and message.thread_id = thread.id
        and message.sender_user_id <> p_guardian_user_id
        and message.expires_at > statement_timestamp()
        and message.created_at > coalesce(
          receipt.last_read_at, '-infinity'::timestamptz
        )
    ) as unread on true
    where thread.tenant_id = p_tenant_id
      and thread.child_id = p_student_id
      and thread.guardian_user_id = p_guardian_user_id
      and private.family_thread_is_current_v1(thread.tenant_id, thread.id)
  ) as current_threads;
$$;

create or replace function private.family_current_children_json_v1(
  p_tenant_id uuid,
  p_guardian_user_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select coalesce(
    jsonb_agg(item order by display_name, student_id), '[]'::jsonb
  )
  from (
    select
      student.display_name,
      student.id as student_id,
      jsonb_build_object(
        'dataUpdatedAt', greatest(
          student.updated_at,
          (select max(projection.computed_at)
            from public.progress_projections_v1 as projection
            where projection.tenant_id = student.tenant_id
              and projection.student_id = student.id
              and projection.expires_at > statement_timestamp()),
          (select max(skill.computed_at)
            from public.skill_projections_v1 as skill
            where skill.tenant_id = student.tenant_id
              and skill.student_id = student.id
              and skill.expires_at > statement_timestamp()),
          (select max(event.recorded_at)
            from public.learning_events_v2 as event
            where event.tenant_id = student.tenant_id
              and event.student_id = student.id
              and event.expires_at > statement_timestamp())
        ),
        'displayName', student.display_name,
        'gradeLabel', student.grade_label,
        'id', student.id,
        'linkStatus', 'active',
        'schoolName', school.display_name
      ) as item
    from public.guardian_links as guardian_link
    join public.students as student
      on student.tenant_id = guardian_link.tenant_id
      and student.id = guardian_link.student_id and student.active
    join public.schools as school
      on school.tenant_id = student.tenant_id
      and school.id = student.school_id and school.active
    where guardian_link.tenant_id = p_tenant_id
      and guardian_link.guardian_user_id = p_guardian_user_id
      and guardian_link.status = 'active'
      and (guardian_link.expires_at is null
        or guardian_link.expires_at > statement_timestamp())
      and guardian_link.lifecycle_expires_at > statement_timestamp()
      and exists (
        select 1 from public.role_bindings as guardian_role
        where guardian_role.tenant_id = guardian_link.tenant_id
          and guardian_role.app_user_id = guardian_link.guardian_user_id
          and guardian_role.role = 'guardian'
          and guardian_role.active
          and guardian_role.starts_at <= statement_timestamp()
          and (guardian_role.ends_at is null
            or guardian_role.ends_at > statement_timestamp())
          and guardian_role.lifecycle_expires_at > statement_timestamp()
      )
      and exists (
        select 1
        from public.enrollments as enrollment
        join public.classes as class_row
          on class_row.tenant_id = enrollment.tenant_id
          and class_row.id = enrollment.class_id
          and class_row.school_id = student.school_id
          and class_row.active
        where enrollment.tenant_id = student.tenant_id
          and enrollment.student_id = student.id
          and enrollment.status = 'active'
          and enrollment.starts_at <= current_date
          and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
      )
  ) as current_children;
$$;

create or replace function private.family_current_message_contacts_json_v1(
  p_tenant_id uuid,
  p_student_id uuid,
  p_school_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select coalesce(
    jsonb_agg(item order by staff_display_name, staff_user_id), '[]'::jsonb
  )
  from (
    select
      current_staff.staff_display_name,
      current_staff.staff_user_id,
      jsonb_build_object(
        'childId', p_student_id,
        'enrollmentId', current_staff.enrollment_id,
        'staffDisplayName', current_staff.staff_display_name,
        'staffUserId', current_staff.staff_user_id
      ) as item
    from (
      select distinct on (staff_binding.teacher_user_id)
        enrollment.id as enrollment_id,
        staff.display_name as staff_display_name,
        staff_binding.teacher_user_id as staff_user_id
      from public.enrollments as enrollment
      join public.classes as class_row
        on class_row.tenant_id = enrollment.tenant_id
        and class_row.id = enrollment.class_id
        and class_row.school_id = p_school_id
        and class_row.active
      join public.class_staff_bindings as staff_binding
        on staff_binding.tenant_id = enrollment.tenant_id
        and staff_binding.class_id = enrollment.class_id
        and staff_binding.active
        and staff_binding.starts_at <= statement_timestamp()
        and (staff_binding.ends_at is null
          or staff_binding.ends_at > statement_timestamp())
      join public.app_users as staff
        on staff.id = staff_binding.teacher_user_id
        and staff.status = 'active'
        and staff.lifecycle_expires_at > statement_timestamp()
      join public.role_bindings as teacher_role
        on teacher_role.tenant_id = enrollment.tenant_id
        and teacher_role.app_user_id = staff_binding.teacher_user_id
        and teacher_role.role = 'teacher'
        and teacher_role.school_id = p_school_id
        and teacher_role.active
        and teacher_role.starts_at <= statement_timestamp()
        and (teacher_role.ends_at is null
          or teacher_role.ends_at > statement_timestamp())
        and teacher_role.lifecycle_expires_at > statement_timestamp()
      where enrollment.tenant_id = p_tenant_id
        and enrollment.student_id = p_student_id
        and enrollment.status = 'active'
        and enrollment.starts_at <= current_date
        and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
        and exists (
          select 1 from public.provider_identities as identity
          where identity.app_user_id = staff.id and identity.active
            and identity.lifecycle_expires_at > statement_timestamp()
        )
      order by staff_binding.teacher_user_id, enrollment.starts_at desc,
        enrollment.id
    ) as current_staff
    order by current_staff.staff_display_name, current_staff.staff_user_id
    limit 50
  ) as bounded_contacts;
$$;

create or replace function private.family_current_notification_preference_json_v1(
  p_tenant_id uuid,
  p_guardian_user_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select jsonb_build_object(
    'messageEmailEnabled', coalesce(preference.message_email_enabled, false),
    'weeklyDigestEnabled', coalesce(preference.weekly_digest_enabled, false)
  )
  from (select 1) as singleton
  left join public.family_notification_preferences as preference
    on preference.tenant_id = p_tenant_id
    and preference.app_user_id = p_guardian_user_id
    and preference.lifecycle_expires_at > statement_timestamp();
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
  select coalesce(
    jsonb_agg(item order by published_at desc, announcement_id), '[]'::jsonb
  )
  from (
    select
      announcement.published_at,
      announcement.id as announcement_id,
      jsonb_build_object(
        'body', announcement.body,
        'id', announcement.id,
        'publishedAt', announcement.published_at,
        'publisherLabel', publisher.display_name,
        'title', announcement.title
      ) as item
    from public.school_announcements as announcement
    join public.app_users as publisher
      on publisher.id = announcement.publisher_user_id
      and publisher.status = 'active'
      and publisher.lifecycle_expires_at > statement_timestamp()
    where announcement.tenant_id = p_tenant_id
      and announcement.school_id = p_school_id
      and announcement.published_at <= statement_timestamp()
      and announcement.expires_at > statement_timestamp()
  ) as current_announcements;
$$;

create or replace function private.family_actor_can_publish_school_v1(
  p_tenant_id uuid,
  p_school_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select exists (
    select 1
    from public.schools as school
    where school.tenant_id = p_tenant_id
      and school.id = p_school_id and school.active
      and (
        public.family_has_role_v1(
          p_tenant_id, array['district_admin']::public.app_role[], null, null
        )
        or public.family_has_role_v1(
          p_tenant_id,
          array['school_admin']::public.app_role[],
          p_school_id, null
        )
        or (
          public.family_has_role_v1(
            p_tenant_id,
            array['teacher']::public.app_role[],
            p_school_id,
            null
          )
          and exists (
            select 1
            from public.class_staff_bindings as staff_binding
            join public.classes as class_row
              on class_row.tenant_id = staff_binding.tenant_id
              and class_row.id = staff_binding.class_id
              and class_row.school_id = p_school_id
              and class_row.active
            where staff_binding.tenant_id = p_tenant_id
              and staff_binding.teacher_user_id =
                public.family_current_app_user_id_v1()
              and staff_binding.active
              and staff_binding.starts_at <= statement_timestamp()
              and (staff_binding.ends_at is null
                or staff_binding.ends_at > statement_timestamp())
          )
        )
      )
  );
$$;

-- The 004 function chooses the first guardian link across every tenant when
-- p_child_id is null. Keep that implementation as an owner-only core and put
-- the browser behind an explicit tenant locator that is independently
-- re-authorized from the signed identity.
alter function public.family_workspace_v1(uuid)
  rename to family_workspace_unscoped_core_v1;

revoke all on function public.family_workspace_unscoped_core_v1(uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.family_workspace_for_tenant_v1(
  p_tenant_id uuid,
  p_child_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_guardian_user_id uuid;
  v_child_id uuid;
  v_school_id uuid;
  v_messaging_enabled boolean;
  v_workspace jsonb;
  v_children jsonb;
  v_message_contacts jsonb;
  v_preference jsonb;
  v_threads jsonb;
  v_completed_pages integer;
  v_latest_activity timestamptz;
  v_data_updated timestamptz;
  v_unread integer;
begin
  if p_tenant_id is null then
    raise exception using errcode = 'P0002',
      message = 'family workspace not found';
  end if;
  v_guardian_user_id := private.require_family_app_user();

  select linked.student_id, linked.school_id, linked.messaging_enabled
  into v_child_id, v_school_id, v_messaging_enabled
  from (
    select gl.student_id, student.school_id,
      tenant.family_messaging_enabled as messaging_enabled,
      gl.created_at, gl.id
    from public.guardian_links as gl
    join public.tenants as tenant
      on tenant.id = gl.tenant_id
      and tenant.id = p_tenant_id
      and tenant.status = 'active'
      and tenant.family_portal_enabled
      and (tenant.lifecycle_expires_at is null
        or tenant.lifecycle_expires_at > statement_timestamp())
    join public.app_users as guardian
      on guardian.id = gl.guardian_user_id
      and guardian.id = v_guardian_user_id
      and guardian.status = 'active'
      and guardian.lifecycle_expires_at > statement_timestamp()
    join public.role_bindings as guardian_role
      on guardian_role.tenant_id = gl.tenant_id
      and guardian_role.app_user_id = gl.guardian_user_id
      and guardian_role.role = 'guardian'
      and guardian_role.active
      and guardian_role.starts_at <= statement_timestamp()
      and (guardian_role.ends_at is null
        or guardian_role.ends_at > statement_timestamp())
      and guardian_role.lifecycle_expires_at > statement_timestamp()
    join public.students as student
      on student.tenant_id = gl.tenant_id
      and student.id = gl.student_id
      and student.active
    join public.schools as school
      on school.tenant_id = student.tenant_id
      and school.id = student.school_id
      and school.active
    where gl.tenant_id = p_tenant_id
      and gl.guardian_user_id = v_guardian_user_id
      and gl.status = 'active'
      and (gl.expires_at is null or gl.expires_at > statement_timestamp())
      and gl.lifecycle_expires_at > statement_timestamp()
      and (p_child_id is null or gl.student_id = p_child_id)
      and exists (
        select 1
        from public.enrollments as enrollment
        join public.classes as class_row
          on class_row.tenant_id = enrollment.tenant_id
          and class_row.id = enrollment.class_id
          and class_row.school_id = student.school_id
          and class_row.active
        where enrollment.tenant_id = student.tenant_id
          and enrollment.student_id = student.id
          and enrollment.status = 'active'
          and enrollment.starts_at <= current_date
          and (enrollment.ends_at is null
            or enrollment.ends_at >= current_date)
      )
    order by gl.created_at, gl.id
    limit 1
  ) as linked;

  if v_child_id is null then
    raise exception using errcode = 'P0002',
      message = 'family workspace not found';
  end if;

  v_workspace := public.family_workspace_unscoped_core_v1(v_child_id);
  if jsonb_typeof(v_workspace) <> 'object'
    or v_workspace #>> '{tenant,id}' is distinct from p_tenant_id::text
    or v_workspace ->> 'selectedChildId' is distinct from v_child_id::text
  then
    raise exception using errcode = 'XX000',
      message = 'invalid family workspace receipt';
  end if;

  v_children := private.family_current_children_json_v1(
    p_tenant_id, v_guardian_user_id
  );
  if not exists (
    select 1 from jsonb_array_elements(v_children) as child
    where child ->> 'id' = v_child_id::text
  ) then
    raise exception using errcode = 'P0002',
      message = 'family workspace not found';
  end if;
  v_message_contacts := case
    when v_messaging_enabled then
      private.family_current_message_contacts_json_v1(
        p_tenant_id, v_child_id, v_school_id
      )
    else '[]'::jsonb
  end;
  v_preference := private.family_current_notification_preference_json_v1(
    p_tenant_id, v_guardian_user_id
  );
  -- The owner core now resolves threads through the lifecycle-aware helper
  -- defined above. Re-read that bounded branch before deriving unread counts.
  v_threads := coalesce(v_workspace -> 'threads', '[]'::jsonb);

  select count(*)::integer, max(event.occurred_at)
  into v_completed_pages, v_latest_activity
  from public.learning_events_v2 as event
  where event.tenant_id = p_tenant_id
    and event.student_id = v_child_id
    and event.expires_at > statement_timestamp()
    and event.event_type = 'page_reviewed'
    and event.occurred_at >= date_trunc('week', statement_timestamp());

  -- Latest activity includes every current event, not only page reviews.
  select max(event.occurred_at) into v_latest_activity
  from public.learning_events_v2 as event
  where event.tenant_id = p_tenant_id
    and event.student_id = v_child_id
    and event.expires_at > statement_timestamp();

  select greatest(
    student.updated_at,
    (select max(projection.computed_at)
      from public.progress_projections_v1 as projection
      where projection.tenant_id = student.tenant_id
        and projection.student_id = student.id
        and projection.expires_at > statement_timestamp()),
    (select max(skill.computed_at)
      from public.skill_projections_v1 as skill
      where skill.tenant_id = student.tenant_id
        and skill.student_id = student.id
        and skill.expires_at > statement_timestamp()),
    (select max(event.recorded_at)
      from public.learning_events_v2 as event
      where event.tenant_id = student.tenant_id
        and event.student_id = student.id
        and event.expires_at > statement_timestamp())
  ) into v_data_updated
  from public.students as student
  where student.tenant_id = p_tenant_id and student.id = v_child_id;

  select coalesce(sum((thread ->> 'unreadCount')::integer), 0)::integer
  into v_unread
  from jsonb_array_elements(v_threads) as thread;

  v_workspace := jsonb_set(v_workspace, '{children}', v_children, true);
  v_workspace := jsonb_set(
    v_workspace, '{messageContacts}', v_message_contacts, true
  );
  v_workspace := jsonb_set(
    v_workspace, '{notificationPreference}', v_preference, true
  );
  v_workspace := jsonb_set(v_workspace, '{threads}', v_threads, true);
  v_workspace := jsonb_set(
    v_workspace, '{overview,completedLessonPagesThisWeek}',
    to_jsonb(v_completed_pages), true
  );
  v_workspace := jsonb_set(
    v_workspace, '{overview,latestActivityAt}',
    coalesce(to_jsonb(v_latest_activity), 'null'::jsonb), true
  );
  v_workspace := jsonb_set(
    v_workspace, '{overview,dataUpdatedAt}', to_jsonb(v_data_updated), true
  );
  v_workspace := jsonb_set(
    v_workspace, '{overview,unreadMessageCount}', to_jsonb(v_unread), true
  );
  return v_workspace;
end;
$$;

-- Notification preferences are tenant records. The legacy no-argument tenant
-- inference becomes ambiguous as soon as one verified guardian belongs to two
-- tenants, so it is retained only as an owner core for historical evidence and
-- removed from the request surface.
alter function public.update_family_notification_preferences_v1(
  boolean, boolean, text
) rename to update_family_notification_preferences_unscoped_core_v1;

revoke all on function
  public.update_family_notification_preferences_unscoped_core_v1(
    boolean, boolean, text
  ) from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.update_family_notification_preferences_for_tenant_v1(
  p_tenant_id uuid,
  p_message_email_enabled boolean,
  p_weekly_digest_enabled boolean,
  p_client_mutation_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_tenant public.tenants%rowtype;
  v_locale text;
  v_existing public.family_notification_preferences%rowtype;
  v_replay public.family_notification_preference_mutations%rowtype;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  v_actor_id := private.require_family_app_user();
  perform pg_advisory_xact_lock(hashtextextended(
    'family-notification-preference' || chr(31) || p_tenant_id::text
      || chr(31) || v_actor_id::text,
    91373011
  ));

  select tenant.*
  into v_tenant
  from public.tenants as tenant
  where tenant.id = p_tenant_id
    and tenant.status = 'active'
    and tenant.family_portal_enabled
    and (tenant.lifecycle_expires_at is null
      or tenant.lifecycle_expires_at > statement_timestamp())
    and exists (
      select 1 from public.role_bindings as guardian_role
      where guardian_role.tenant_id = tenant.id
        and guardian_role.app_user_id = v_actor_id
        and guardian_role.role = 'guardian'
        and guardian_role.active
        and guardian_role.starts_at <= statement_timestamp()
        and (guardian_role.ends_at is null
          or guardian_role.ends_at > statement_timestamp())
        and guardian_role.lifecycle_expires_at > statement_timestamp()
    )
    and exists (
      select 1
      from public.guardian_links as guardian_link
      join public.students as student
        on student.tenant_id = guardian_link.tenant_id
        and student.id = guardian_link.student_id
        and student.active
      join public.schools as school
        on school.tenant_id = student.tenant_id
        and school.id = student.school_id
        and school.active
      where guardian_link.tenant_id = tenant.id
        and guardian_link.guardian_user_id = v_actor_id
        and guardian_link.status = 'active'
        and (guardian_link.expires_at is null
          or guardian_link.expires_at > statement_timestamp())
        and guardian_link.lifecycle_expires_at > statement_timestamp()
        and exists (
          select 1
          from public.enrollments as enrollment
          join public.classes as class_row
            on class_row.tenant_id = enrollment.tenant_id
            and class_row.id = enrollment.class_id
            and class_row.school_id = student.school_id
            and class_row.active
          where enrollment.tenant_id = student.tenant_id
            and enrollment.student_id = student.id
            and enrollment.status = 'active'
            and enrollment.starts_at <= current_date
            and (enrollment.ends_at is null
              or enrollment.ends_at >= current_date)
        )
    )
  for share of tenant;

  if v_tenant.id is null then
    raise exception using errcode = 'P0002',
      message = 'family notification preference not found';
  end if;
  if (p_message_email_enabled or p_weekly_digest_enabled)
    and not v_tenant.family_messaging_enabled
  then
    raise exception using errcode = '42501',
      message = 'family messaging disabled';
  end if;

  select locale into v_locale
  from public.app_users
  where id = v_actor_id and status = 'active'
    and lifecycle_expires_at > statement_timestamp();
  if v_locale is null then
    raise exception using errcode = 'P0002',
      message = 'family notification preference not found';
  end if;

  select * into v_replay
  from public.family_notification_preference_mutations as mutation
  where mutation.tenant_id = v_tenant.id
    and mutation.app_user_id = v_actor_id
    and mutation.client_mutation_id = p_client_mutation_id;
  if v_replay.id is not null then
    if v_replay.message_email_enabled is distinct from p_message_email_enabled
      or v_replay.weekly_digest_enabled is distinct from p_weekly_digest_enabled
      or v_replay.locale is distinct from v_locale
    then
      raise exception using errcode = '22023',
        message = 'idempotency key conflict';
    end if;
    return;
  end if;

  select * into v_existing
  from public.family_notification_preferences
  where tenant_id = v_tenant.id and app_user_id = v_actor_id
  for update;
  if v_existing.app_user_id is not null
    and v_existing.lifecycle_expires_at <= statement_timestamp()
  then
    raise exception using errcode = 'P0002',
      message = 'family notification preference not found';
  end if;
  if v_existing.app_user_id is not null
    and v_existing.idempotency_key = p_client_mutation_id
  then
    if v_existing.message_email_enabled is distinct from p_message_email_enabled
      or v_existing.weekly_digest_enabled is distinct from p_weekly_digest_enabled
      or v_existing.locale is distinct from v_locale
    then
      raise exception using errcode = '22023',
        message = 'idempotency key conflict';
    end if;
    insert into public.family_notification_preference_mutations (
      tenant_id, environment_id, data_mode, app_user_id,
      client_mutation_id, message_email_enabled, weekly_digest_enabled, locale
    ) values (
      v_tenant.id, v_tenant.environment_id, v_tenant.data_mode, v_actor_id,
      p_client_mutation_id, p_message_email_enabled,
      p_weekly_digest_enabled, v_locale
    );
    return;
  end if;

  insert into public.family_notification_preferences (
    tenant_id, environment_id, data_mode, app_user_id,
    message_email_enabled, weekly_digest_enabled, locale, idempotency_key
  ) values (
    v_tenant.id, v_tenant.environment_id, v_tenant.data_mode, v_actor_id,
    p_message_email_enabled, p_weekly_digest_enabled, v_locale,
    p_client_mutation_id
  ) on conflict (tenant_id, app_user_id) do update
  set message_email_enabled = excluded.message_email_enabled,
      weekly_digest_enabled = excluded.weekly_digest_enabled,
      locale = excluded.locale,
      idempotency_key = excluded.idempotency_key;

  insert into public.family_notification_preference_mutations (
    tenant_id, environment_id, data_mode, app_user_id,
    client_mutation_id, message_email_enabled, weekly_digest_enabled, locale
  ) values (
    v_tenant.id, v_tenant.environment_id, v_tenant.data_mode, v_actor_id,
    p_client_mutation_id, p_message_email_enabled,
    p_weekly_digest_enabled, v_locale
  );

  update public.notification_outbox as outbox
  set status = 'cancelled', claimed_at = null,
      claim_token = null, claim_expires_at = null
  where outbox.tenant_id = v_tenant.id
    and outbox.recipient_user_id = v_actor_id
    and outbox.status = 'pending'
    and (
      (outbox.kind = 'family_message' and not p_message_email_enabled)
      or (outbox.kind = 'weekly_family_digest'
        and not p_weekly_digest_enabled)
    );
end;
$$;

-- Guardian self-relinquishment remains available when messaging is off, but
-- it must still require a current identity, tenant role, relationship clock,
-- child, school, and enrollment. The link-id predecessor is owner-only.
create or replace function public.relinquish_guardian_child_access_v1(
  p_child_id uuid,
  p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_link public.guardian_links%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  v_actor_id := private.require_family_app_user();
  select guardian_link.* into v_link
  from public.guardian_links as guardian_link
  join public.tenants as tenant
    on tenant.id = guardian_link.tenant_id
    and tenant.environment_id = guardian_link.environment_id
    and tenant.data_mode = guardian_link.data_mode
    and tenant.status = 'active' and tenant.family_portal_enabled
    and (tenant.lifecycle_expires_at is null
      or tenant.lifecycle_expires_at > statement_timestamp())
  join public.students as student
    on student.tenant_id = guardian_link.tenant_id
    and student.id = guardian_link.student_id and student.active
  join public.schools as school
    on school.tenant_id = student.tenant_id
    and school.id = student.school_id and school.active
  join public.role_bindings as guardian_role
    on guardian_role.tenant_id = guardian_link.tenant_id
    and guardian_role.app_user_id = v_actor_id
    and guardian_role.role = 'guardian' and guardian_role.active
    and guardian_role.starts_at <= statement_timestamp()
    and (guardian_role.ends_at is null
      or guardian_role.ends_at > statement_timestamp())
    and guardian_role.lifecycle_expires_at > statement_timestamp()
  where guardian_link.student_id = p_child_id
    and guardian_link.guardian_user_id = v_actor_id
    and guardian_link.lifecycle_expires_at > statement_timestamp()
    and (
      (
        guardian_link.status = 'active'
        and (guardian_link.expires_at is null
          or guardian_link.expires_at > statement_timestamp())
      )
      or (
        guardian_link.status = 'revoked'
        and guardian_link.revocation_idempotency_key = p_idempotency_key
      )
    )
    and exists (
      select 1
      from public.enrollments as enrollment
      join public.classes as class_row
        on class_row.tenant_id = enrollment.tenant_id
        and class_row.id = enrollment.class_id
        and class_row.school_id = student.school_id and class_row.active
      where enrollment.tenant_id = student.tenant_id
        and enrollment.student_id = student.id
        and enrollment.status = 'active'
        and enrollment.starts_at <= current_date
        and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
    )
  order by (guardian_link.status = 'active') desc,
    guardian_link.created_at desc
  limit 1
  for update of guardian_link;
  if v_link.id is null then
    raise exception using errcode = 'P0002',
      message = 'guardian access not found';
  end if;
  perform public.relinquish_guardian_link_v1(v_link.id, p_idempotency_key);
end;
$$;

-- Every browser-callable messaging write stays behind the existing resource
-- authorization and abuse-budget core. The wrapper checks the authoritative
-- tenant switch before the transaction can commit, so a disabled call rolls
-- back its message, thread, outbox, audit, and budget writes together.
alter function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) rename to send_family_message_pre_messaging_gate_v1;

revoke all on function public.send_family_message_pre_messaging_gate_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;

create or replace function public.send_family_message_v1(
  p_body text,
  p_child_id uuid,
  p_client_mutation_id text,
  p_enrollment_id uuid,
  p_staff_user_id uuid,
  p_thread_id uuid,
  p_topic public.family_message_topic
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_receipt jsonb;
  v_message_id uuid;
  v_thread_id uuid;
  v_tenant_id uuid;
  v_requested_tenant_id uuid;
begin
  perform private.require_family_app_user();
  if p_thread_id is not null then
    select thread.tenant_id into v_requested_tenant_id
    from public.family_threads as thread
    where thread.id = p_thread_id
      and public.family_can_access_thread_v1(thread.tenant_id, thread.id);
  elsif p_enrollment_id is not null and p_child_id is not null then
    select enrollment.tenant_id into v_requested_tenant_id
    from public.enrollments as enrollment
    where enrollment.id = p_enrollment_id
      and enrollment.student_id = p_child_id
      and (
        exists (
          select 1
          from public.guardian_links as guardian_link
          where guardian_link.tenant_id = enrollment.tenant_id
            and guardian_link.student_id = enrollment.student_id
            and guardian_link.guardian_user_id =
              public.family_current_app_user_id_v1()
            and guardian_link.status = 'active'
            and (guardian_link.expires_at is null
              or guardian_link.expires_at > statement_timestamp())
            and guardian_link.lifecycle_expires_at > statement_timestamp()
            and public.family_has_role_v1(
              enrollment.tenant_id,
              array['guardian']::public.app_role[], null, null
            )
        )
        or (
          p_staff_user_id = public.family_current_app_user_id_v1()
          and public.family_has_role_v1(
            enrollment.tenant_id,
            array['teacher']::public.app_role[], null, null
          )
        )
      );
  end if;
  if v_requested_tenant_id is null then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end if;
  perform private.lock_family_messaging_tenant_v1(v_requested_tenant_id);

  v_receipt := public.send_family_message_pre_messaging_gate_v1(
    p_body, p_child_id, p_client_mutation_id, p_enrollment_id,
    p_staff_user_id, p_thread_id, p_topic
  );
  begin
    if jsonb_typeof(v_receipt) <> 'object'
      or array(select jsonb_object_keys(v_receipt) order by 1)
        is distinct from array['message_id', 'thread_id']::text[]
    then
      raise exception 'invalid receipt';
    end if;
    v_message_id := (v_receipt ->> 'message_id')::uuid;
    v_thread_id := (v_receipt ->> 'thread_id')::uuid;
    select message.tenant_id into strict v_tenant_id
    from public.family_messages as message
    join public.family_threads as thread
      on thread.tenant_id = message.tenant_id
      and thread.id = message.thread_id
    where message.id = v_message_id and thread.id = v_thread_id;
  exception when others then
      raise exception using errcode = 'XX000',
        message = 'invalid family message receipt';
  end;
  if v_tenant_id <> v_requested_tenant_id then
    raise exception using errcode = 'XX000',
      message = 'invalid family message receipt';
  end if;
  if not private.family_thread_is_current_v1(v_tenant_id, v_thread_id) then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end if;
  return v_receipt;
end;
$$;

alter function public.mark_family_thread_read_v1(uuid, text)
  rename to mark_family_thread_read_pre_messaging_gate_v1;
alter function public.close_family_thread_v1(uuid, text)
  rename to close_family_thread_pre_messaging_gate_v1;

revoke all on function
  public.mark_family_thread_read_pre_messaging_gate_v1(uuid, text)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function
  public.close_family_thread_pre_messaging_gate_v1(uuid, text)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.mark_family_thread_read_v1(
  p_thread_id uuid,
  p_client_mutation_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_tenant_id uuid;
begin
  perform private.require_family_app_user();
  begin
    select tenant_id into strict v_tenant_id
    from public.family_threads
    where id = p_thread_id
      and public.family_can_access_thread_v1(tenant_id, id);
  exception when no_data_found or too_many_rows then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end;
  perform private.lock_family_messaging_tenant_v1(v_tenant_id);
  perform public.mark_family_thread_read_pre_messaging_gate_v1(
    p_thread_id, p_client_mutation_id
  );
  if not private.family_thread_is_current_v1(v_tenant_id, p_thread_id) then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end if;
end;
$$;

create or replace function public.close_family_thread_v1(
  p_thread_id uuid,
  p_client_mutation_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_tenant_id uuid;
begin
  perform private.require_family_app_user();
  begin
    select tenant_id into strict v_tenant_id
    from public.family_threads
    where id = p_thread_id
      and public.family_can_access_thread_v1(tenant_id, id);
  exception when no_data_found or too_many_rows then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end;
  perform private.lock_family_messaging_tenant_v1(v_tenant_id);
  perform public.close_family_thread_pre_messaging_gate_v1(
    p_thread_id, p_client_mutation_id
  );
  if not private.family_thread_is_current_v1(v_tenant_id, p_thread_id) then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end if;
end;
$$;

-- Announcement composition shares the approved asynchronous communication
-- kill switch. Existing announcements remain readable; a disabled publish is
-- rolled back after the original authorization/idempotency core runs.
alter function public.authorize_school_announcement_publish_v1(uuid)
  rename to authorize_school_announcement_publish_unscoped_core_v1;

revoke all on function
  public.authorize_school_announcement_publish_unscoped_core_v1(uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.authorize_school_announcement_publish_v1(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_tenant_id uuid;
  v_receipt jsonb;
begin
  perform private.require_family_app_user();
  select school.tenant_id into v_tenant_id
  from public.schools as school
  where school.id = p_school_id
    and private.family_actor_can_publish_school_v1(
      school.tenant_id, school.id
    );
  if v_tenant_id is null then
    raise exception using errcode = 'P0002',
      message = 'school announcement target not found';
  end if;
  perform private.lock_family_messaging_tenant_v1(v_tenant_id);
  v_receipt :=
    public.authorize_school_announcement_publish_unscoped_core_v1(p_school_id);
  if jsonb_typeof(v_receipt) <> 'object'
    or v_receipt ->> 'tenantId' is distinct from v_tenant_id::text
    or v_receipt ->> 'schoolId' is distinct from p_school_id::text
  then
    raise exception using errcode = 'XX000',
      message = 'invalid school announcement authorization receipt';
  end if;
  return v_receipt;
end;
$$;

alter function public.publish_school_announcement_v1(
  uuid, text, text, text, timestamptz
) rename to publish_school_announcement_pre_messaging_gate_v1;

revoke all on function
  public.publish_school_announcement_pre_messaging_gate_v1(
    uuid, text, text, text, timestamptz
  ) from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.publish_school_announcement_v1(
  p_school_id uuid,
  p_title text,
  p_body text,
  p_idempotency_key text,
  p_expires_at timestamptz default null
)
returns table (
  announcement_id uuid,
  published_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_receipt record;
  v_tenant_id uuid;
begin
  perform private.require_family_app_user();
  select school.tenant_id into v_tenant_id
  from public.schools as school
  where school.id = p_school_id
    and private.family_actor_can_publish_school_v1(
      school.tenant_id, school.id
    );
  if v_tenant_id is null then
    raise exception using errcode = 'P0002',
      message = 'school announcement target not found';
  end if;
  perform private.lock_family_messaging_tenant_v1(v_tenant_id);
  select * into v_receipt
  from public.publish_school_announcement_pre_messaging_gate_v1(
    p_school_id, p_title, p_body, p_idempotency_key, p_expires_at
  );
  if v_receipt.announcement_id is null
    or not exists (
      select 1
      from public.school_announcements as announcement
      where announcement.tenant_id = v_tenant_id
        and announcement.id = v_receipt.announcement_id
        and announcement.school_id = p_school_id
    )
  then
    raise exception using errcode = 'XX000',
      message = 'invalid school announcement receipt';
  end if;
  if not private.family_actor_can_publish_school_v1(
    v_tenant_id, p_school_id
  ) then
    raise exception using errcode = 'P0002',
      message = 'school announcement target not found';
  end if;
  return query select
    v_receipt.announcement_id,
    v_receipt.published_at,
    v_receipt.expires_at;
end;
$$;

-- Administrator access is tenant-selected too. The predecessor inferred one
-- tenant and failed ambiguously for an administrator with two active tenants;
-- retain it only as an owner core and build the DTO from the selected scope.
alter function public.admin_family_access_workspace_v1()
  rename to admin_family_access_workspace_unscoped_core_v1;

revoke all on function public.admin_family_access_workspace_unscoped_core_v1()
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.admin_family_access_workspace_for_tenant_v1(
  p_tenant_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_tenant public.tenants%rowtype;
begin
  v_actor_id := private.require_family_app_user();
  select tenant.* into v_tenant
  from public.tenants as tenant
  where tenant.id = p_tenant_id
    and tenant.status = 'active'
    and tenant.family_portal_enabled
    and (tenant.lifecycle_expires_at is null
      or tenant.lifecycle_expires_at > statement_timestamp())
    and exists (
      select 1
      from public.role_bindings as admin_role
      left join public.schools as school
        on school.tenant_id = admin_role.tenant_id
        and school.id = admin_role.school_id and school.active
      where admin_role.tenant_id = tenant.id
        and admin_role.app_user_id = v_actor_id
        and admin_role.role in ('school_admin', 'district_admin')
        and admin_role.active
        and admin_role.starts_at <= statement_timestamp()
        and (admin_role.ends_at is null
          or admin_role.ends_at > statement_timestamp())
        and admin_role.lifecycle_expires_at > statement_timestamp()
        and (admin_role.role = 'district_admin' or school.id is not null)
    );
  if v_tenant.id is null then
    raise exception using errcode = '42501',
      message = 'family administrator access required';
  end if;

  return jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', v_tenant.id, 'displayName', v_tenant.display_name
    ),
    'children', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', child.id, 'displayName', child.display_name,
        'gradeLabel', child.grade_label, 'schoolName', school.display_name
      ) order by child.display_name, child.id)
      from (
        select distinct
          student.id, student.display_name, student.grade_label,
          student.school_id
        from public.students as student
        join public.schools as scoped_school
          on scoped_school.tenant_id = student.tenant_id
          and scoped_school.id = student.school_id and scoped_school.active
        join public.enrollments as enrollment
          on enrollment.tenant_id = student.tenant_id
          and enrollment.student_id = student.id
          and enrollment.status = 'active'
          and enrollment.starts_at <= current_date
          and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
        join public.classes as class_row
          on class_row.tenant_id = enrollment.tenant_id
          and class_row.id = enrollment.class_id
          and class_row.school_id = student.school_id and class_row.active
        where student.tenant_id = v_tenant.id and student.active
          and public.family_has_role_v1(
            v_tenant.id,
            array['school_admin', 'district_admin']::public.app_role[],
            student.school_id, null
          )
        order by student.display_name, student.id
        limit 5000
      ) as child
      join public.schools as school
        on school.tenant_id = v_tenant.id and school.id = child.school_id
    ), '[]'::jsonb),
    'invitations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', invitation.id,
        'guardianLinkId', case
          when invitation.status = 'accepted' then current_link.id
          else null
        end,
        'childId', student.id,
        'childDisplayName', student.display_name,
        'gradeLabel', student.grade_label,
        'guardianLabel', coalesce(guardian.display_name, 'Verified adult'),
        'destinationLabel', 'Verified adult destination',
        'status', case
          when invitation.status = 'accepted' and current_link.id is not null
            then 'accepted'
          when invitation.status = 'pending'
            and invitation.expires_at > statement_timestamp() then 'pending'
          else 'revoked'
        end,
        'expiresAt', invitation.expires_at
      ) order by invitation.created_at desc, invitation.id)
      from public.guardian_invitations as invitation
      join public.students as student
        on student.tenant_id = invitation.tenant_id
        and student.id = invitation.student_id and student.active
      join public.schools as school
        on school.tenant_id = invitation.tenant_id
        and school.id = invitation.school_id
        and school.id = student.school_id and school.active
      left join public.app_users as guardian
        on guardian.id = invitation.accepted_by_user_id
        and guardian.status = 'active'
        and guardian.lifecycle_expires_at > statement_timestamp()
        and exists (
          select 1
          from public.provider_identities as guardian_identity
          where guardian_identity.app_user_id = guardian.id
            and guardian_identity.active
            and guardian_identity.lifecycle_expires_at > statement_timestamp()
        )
      left join lateral (
        select guardian_link.id
        from public.guardian_links as guardian_link
        join public.app_users as current_guardian
          on current_guardian.id = guardian_link.guardian_user_id
          and current_guardian.status = 'active'
          and current_guardian.lifecycle_expires_at > statement_timestamp()
        join public.role_bindings as guardian_role
          on guardian_role.tenant_id = guardian_link.tenant_id
          and guardian_role.app_user_id = guardian_link.guardian_user_id
          and guardian_role.role = 'guardian' and guardian_role.active
          and guardian_role.starts_at <= statement_timestamp()
          and (guardian_role.ends_at is null
            or guardian_role.ends_at > statement_timestamp())
          and guardian_role.lifecycle_expires_at > statement_timestamp()
        where guardian_link.tenant_id = invitation.tenant_id
          and guardian_link.student_id = invitation.student_id
          and guardian_link.guardian_user_id = invitation.accepted_by_user_id
          and guardian_link.status = 'active'
          and (guardian_link.expires_at is null
            or guardian_link.expires_at > statement_timestamp())
          and guardian_link.lifecycle_expires_at > statement_timestamp()
          and exists (
            select 1
            from public.provider_identities as current_identity
            where current_identity.app_user_id = current_guardian.id
              and current_identity.active
              and current_identity.lifecycle_expires_at > statement_timestamp()
          )
        order by guardian_link.created_at desc
        limit 1
      ) as current_link on true
      where invitation.tenant_id = v_tenant.id
        and invitation.status in ('pending', 'accepted', 'revoked', 'expired')
        and invitation.id in (
          select limited.id
          from public.guardian_invitations as limited
          where limited.tenant_id = v_tenant.id
          order by limited.created_at desc, limited.id
          limit 5000
        )
        and exists (
          select 1
          from public.enrollments as enrollment
          join public.classes as class_row
            on class_row.tenant_id = enrollment.tenant_id
            and class_row.id = enrollment.class_id
            and class_row.school_id = invitation.school_id
            and class_row.active
          where enrollment.tenant_id = invitation.tenant_id
            and enrollment.student_id = invitation.student_id
            and enrollment.status = 'active'
            and enrollment.starts_at <= current_date
            and (enrollment.ends_at is null
              or enrollment.ends_at >= current_date)
        )
        and public.family_has_role_v1(
          v_tenant.id,
          array['school_admin', 'district_admin']::public.app_role[],
          invitation.school_id, null
        )
    ), '[]'::jsonb) || coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', guardian_link.id,
        'guardianLinkId', guardian_link.id,
        'childId', student.id,
        'childDisplayName', student.display_name,
        'gradeLabel', student.grade_label,
        'guardianLabel', guardian.display_name,
        'destinationLabel', 'Verified adult destination',
        'status', 'accepted',
        'expiresAt', guardian_link.expires_at
      ) order by guardian_link.created_at desc, guardian_link.id)
      from public.guardian_links as guardian_link
      join public.students as student
        on student.tenant_id = guardian_link.tenant_id
        and student.id = guardian_link.student_id and student.active
      join public.schools as school
        on school.tenant_id = student.tenant_id
        and school.id = student.school_id and school.active
      join public.app_users as guardian
        on guardian.id = guardian_link.guardian_user_id
        and guardian.status = 'active'
        and guardian.lifecycle_expires_at > statement_timestamp()
      join public.role_bindings as guardian_role
        on guardian_role.tenant_id = guardian_link.tenant_id
        and guardian_role.app_user_id = guardian_link.guardian_user_id
        and guardian_role.role = 'guardian' and guardian_role.active
        and guardian_role.starts_at <= statement_timestamp()
        and (guardian_role.ends_at is null
          or guardian_role.ends_at > statement_timestamp())
        and guardian_role.lifecycle_expires_at > statement_timestamp()
      where guardian_link.tenant_id = v_tenant.id
        and guardian_link.status = 'active'
        and (guardian_link.expires_at is null
          or guardian_link.expires_at > statement_timestamp())
        and guardian_link.lifecycle_expires_at > statement_timestamp()
        and exists (
          select 1
          from public.provider_identities as guardian_identity
          where guardian_identity.app_user_id = guardian.id
            and guardian_identity.active
            and guardian_identity.lifecycle_expires_at > statement_timestamp()
        )
        and exists (
          select 1
          from public.enrollments as enrollment
          join public.classes as class_row
            on class_row.tenant_id = enrollment.tenant_id
            and class_row.id = enrollment.class_id
            and class_row.school_id = student.school_id and class_row.active
          where enrollment.tenant_id = student.tenant_id
            and enrollment.student_id = student.id
            and enrollment.status = 'active'
            and enrollment.starts_at <= current_date
            and (enrollment.ends_at is null
              or enrollment.ends_at >= current_date)
        )
        and public.family_has_role_v1(
          v_tenant.id,
          array['school_admin', 'district_admin']::public.app_role[],
          student.school_id, null
        )
        and not exists (
          select 1
          from public.guardian_invitations as accepted_invitation
          where accepted_invitation.tenant_id = guardian_link.tenant_id
            and accepted_invitation.student_id = guardian_link.student_id
            and accepted_invitation.accepted_by_user_id =
              guardian_link.guardian_user_id
            and accepted_invitation.status = 'accepted'
        )
        and guardian_link.id in (
          select limited.id
          from public.guardian_links as limited
          where limited.tenant_id = v_tenant.id
            and limited.status = 'active'
          order by limited.created_at desc, limited.id
          limit 5000
        )
    ), '[]'::jsonb)
  );
end;
$$;

-- Teacher message reads are also unavailable through direct RPC while the
-- tenant switch is off. Guardian growth/workspace reads remain available and
-- existing message history is read-only.
alter function public.teacher_family_inbox_v1()
  rename to teacher_family_inbox_pre_messaging_gate_v1;

revoke all on function public.teacher_family_inbox_pre_messaging_gate_v1()
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.teacher_family_inbox_for_tenant_v1(
  p_tenant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_tenant public.tenants%rowtype;
begin
  v_actor_id := private.require_family_app_user();
  perform private.lock_family_messaging_tenant_v1(p_tenant_id);

  select tenant.* into v_tenant
  from public.tenants as tenant
  where tenant.id = p_tenant_id
    and exists (
      select 1
      from public.role_bindings as teacher_role
      join public.schools as school
        on school.tenant_id = teacher_role.tenant_id
        and school.id = teacher_role.school_id and school.active
      join public.classes as class_row
        on class_row.tenant_id = school.tenant_id
        and class_row.school_id = school.id and class_row.active
      join public.class_staff_bindings as staff_binding
        on staff_binding.tenant_id = class_row.tenant_id
        and staff_binding.class_id = class_row.id
        and staff_binding.teacher_user_id = teacher_role.app_user_id
        and staff_binding.active
        and staff_binding.starts_at <= statement_timestamp()
        and (staff_binding.ends_at is null
          or staff_binding.ends_at > statement_timestamp())
      where teacher_role.tenant_id = tenant.id
        and teacher_role.app_user_id = v_actor_id
        and teacher_role.role = 'teacher'
        and teacher_role.active
        and teacher_role.starts_at <= statement_timestamp()
        and (teacher_role.ends_at is null
          or teacher_role.ends_at > statement_timestamp())
        and teacher_role.lifecycle_expires_at > statement_timestamp()
    );
  if v_tenant.id is null then
    raise exception using errcode = '42501',
      message = 'teacher family access required';
  end if;

  return jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', v_tenant.id, 'displayName', v_tenant.display_name
    ),
    'threads', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', thread.id,
        'childId', student.id,
        'guardianLabel', guardian.display_name,
        'childLabel', student.display_name,
        'gradeLabel', student.grade_label,
        'topic', thread.topic,
        'unreadCount', (
          select least(count(*), 200)::integer
          from public.family_messages as unread
          join public.app_users as sender
            on sender.id = unread.sender_user_id
            and sender.status = 'active'
            and sender.lifecycle_expires_at > statement_timestamp()
          left join public.family_thread_reads as receipt
            on receipt.tenant_id = thread.tenant_id
            and receipt.thread_id = thread.id
            and receipt.app_user_id = v_actor_id
            and receipt.lifecycle_expires_at > statement_timestamp()
          where unread.tenant_id = thread.tenant_id
            and unread.thread_id = thread.id
            and unread.sender_user_id <> v_actor_id
            and unread.expires_at > statement_timestamp()
            and unread.created_at > coalesce(
              receipt.last_read_at, '-infinity'::timestamptz
            )
        ),
        'status', thread.status,
        'messages', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', message.id,
            'senderLabel', sender.display_name,
            'sentAt', message.created_at,
            'body', message.body,
            'mine', message.sender_user_id = v_actor_id
          ) order by message.created_at, message.id)
          from (
            select candidate.*
            from public.family_messages as candidate
            where candidate.tenant_id = thread.tenant_id
              and candidate.thread_id = thread.id
              and candidate.expires_at > statement_timestamp()
            order by candidate.created_at desc, candidate.id desc
            limit 200
          ) as message
          join public.app_users as sender
            on sender.id = message.sender_user_id
            and sender.status = 'active'
            and sender.lifecycle_expires_at > statement_timestamp()
        ), '[]'::jsonb)
      ) order by thread.updated_at desc, thread.id)
      from (
        select candidate.*
        from public.family_threads as candidate
        where candidate.tenant_id = v_tenant.id
          and candidate.staff_user_id = v_actor_id
          and private.family_thread_is_current_v1(
            candidate.tenant_id, candidate.id
          )
        order by candidate.updated_at desc, candidate.id
        limit 500
      ) as thread
      join public.students as student
        on student.tenant_id = thread.tenant_id
        and student.id = thread.child_id and student.active
      join public.app_users as guardian
        on guardian.id = thread.guardian_user_id
        and guardian.status = 'active'
        and guardian.lifecycle_expires_at > statement_timestamp()
    ), '[]'::jsonb)
  );
end;
$$;

alter function public.teacher_announcement_schools_v1()
  rename to teacher_announcement_schools_unscoped_core_v1;

revoke all on function public.teacher_announcement_schools_unscoped_core_v1()
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.teacher_announcement_schools_for_tenant_v1(
  p_tenant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_tenant public.tenants%rowtype;
begin
  v_actor_id := private.require_family_app_user();
  perform private.lock_family_messaging_tenant_v1(p_tenant_id);
  select tenant.* into v_tenant
  from public.tenants as tenant
  where tenant.id = p_tenant_id
    and public.family_has_role_v1(
      tenant.id, array['teacher']::public.app_role[], null, null
    )
    and exists (
      select 1
      from public.role_bindings as teacher_role
      join public.schools as school
        on school.tenant_id = teacher_role.tenant_id
        and school.id = teacher_role.school_id and school.active
      join public.classes as class_row
        on class_row.tenant_id = school.tenant_id
        and class_row.school_id = school.id and class_row.active
      join public.class_staff_bindings as staff_binding
        on staff_binding.tenant_id = class_row.tenant_id
        and staff_binding.class_id = class_row.id
        and staff_binding.teacher_user_id = teacher_role.app_user_id
        and staff_binding.active
        and staff_binding.starts_at <= statement_timestamp()
        and (staff_binding.ends_at is null
          or staff_binding.ends_at > statement_timestamp())
      where teacher_role.tenant_id = tenant.id
        and teacher_role.app_user_id = v_actor_id
        and teacher_role.role = 'teacher'
        and teacher_role.active
        and teacher_role.starts_at <= statement_timestamp()
        and (teacher_role.ends_at is null
          or teacher_role.ends_at > statement_timestamp())
        and teacher_role.lifecycle_expires_at > statement_timestamp()
    );
  if v_tenant.id is null then
    raise exception using errcode = '42501',
      message = 'teacher announcement access required';
  end if;

  return jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', v_tenant.id, 'displayName', v_tenant.display_name
    ),
    'schools', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', school.id, 'displayName', school.display_name
      ) order by school.display_name, school.id)
      from public.schools as school
      where school.tenant_id = v_tenant.id and school.active
        and private.family_actor_can_publish_school_v1(
          school.tenant_id, school.id
        )
    ), '[]'::jsonb)
  );
end;
$$;

-- Stop non-essential Family communication egress when the tenant switch is
-- turned off. Invitations and account-security notices remain independent;
-- message alerts and opt-in weekly digests are both Family communication.
create or replace function private.cancel_family_message_egress_on_tenant_gate_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
begin
  if old.family_messaging_enabled and not new.family_messaging_enabled then
    update public.notification_outbox
    set status = 'cancelled', claimed_at = null,
        claim_token = null, claim_expires_at = null
    where tenant_id = new.id
      and kind in ('family_message', 'weekly_family_digest')
      and status = 'pending';
  end if;
  return new;
end;
$$;

create trigger tenants_cancel_family_message_egress
after update of family_messaging_enabled on public.tenants
for each row
when (old.family_messaging_enabled is distinct from new.family_messaging_enabled)
execute function private.cancel_family_message_egress_on_tenant_gate_v1();

-- Do not create even a transient encrypted recipient row for a disabled or
-- lifecycle-expired Family relationship. Pre-send claim validation remains a
-- second boundary, not the first place the weekly digest gate is enforced.
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
      tenant.id as tenant_id, tenant.environment_id, tenant.data_mode,
      guardian.id as guardian_user_id,
      guardian.notification_email_digest,
      guardian.notification_email_ciphertext,
      preference.locale,
      count(distinct event.event_id)::integer as activity_count,
      count(distinct student_assignment.id) filter (
        where student_assignment.status <> 'completed'
      )::integer as open_assignment_count,
      count(distinct thread.id) filter (
        where exists (
          select 1
          from public.family_messages as message
          join public.app_users as sender
            on sender.id = message.sender_user_id
            and sender.status = 'active'
            and sender.lifecycle_expires_at > statement_timestamp()
          left join public.family_thread_reads as receipt
            on receipt.tenant_id = thread.tenant_id
            and receipt.thread_id = thread.id
            and receipt.app_user_id = guardian.id
            and receipt.lifecycle_expires_at > statement_timestamp()
          where message.tenant_id = thread.tenant_id
            and message.thread_id = thread.id
            and message.sender_user_id <> guardian.id
            and message.expires_at > statement_timestamp()
            and message.created_at > coalesce(
              receipt.last_read_at, '-infinity'::timestamptz
            )
        )
      )::integer as unread_thread_count
    from public.tenants as tenant
    join public.family_notification_preferences as preference
      on preference.tenant_id = tenant.id
      and preference.weekly_digest_enabled
      and preference.lifecycle_expires_at > statement_timestamp()
    join public.app_users as guardian
      on guardian.id = preference.app_user_id
      and guardian.status = 'active'
      and guardian.lifecycle_expires_at > statement_timestamp()
      and guardian.notification_email_digest is not null
      and guardian.notification_email_ciphertext is not null
    join public.role_bindings as guardian_role
      on guardian_role.tenant_id = tenant.id
      and guardian_role.app_user_id = guardian.id
      and guardian_role.role = 'guardian'
      and guardian_role.active
      and guardian_role.starts_at <= statement_timestamp()
      and (guardian_role.ends_at is null
        or guardian_role.ends_at > statement_timestamp())
      and guardian_role.lifecycle_expires_at > statement_timestamp()
    join public.guardian_links as guardian_link
      on guardian_link.tenant_id = tenant.id
      and guardian_link.guardian_user_id = guardian.id
      and guardian_link.status = 'active'
      and (guardian_link.expires_at is null
        or guardian_link.expires_at > statement_timestamp())
      and guardian_link.lifecycle_expires_at > statement_timestamp()
    join public.students as student
      on student.tenant_id = guardian_link.tenant_id
      and student.id = guardian_link.student_id and student.active
    join public.schools as school
      on school.tenant_id = student.tenant_id
      and school.id = student.school_id and school.active
    join public.enrollments as enrollment
      on enrollment.tenant_id = guardian_link.tenant_id
      and enrollment.student_id = guardian_link.student_id
      and enrollment.status = 'active'
      and enrollment.starts_at <= current_date
      and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
    join public.classes as class_row
      on class_row.tenant_id = enrollment.tenant_id
      and class_row.id = enrollment.class_id
      and class_row.school_id = student.school_id and class_row.active
    left join public.learning_events_v2 as event
      on event.tenant_id = guardian_link.tenant_id
      and event.student_id = guardian_link.student_id
      and event.expires_at > statement_timestamp()
      and event.occurred_at >= p_week_start::timestamptz
      and event.occurred_at < (p_week_start + 7)::timestamptz
    left join public.student_assignments as student_assignment
      on student_assignment.tenant_id = enrollment.tenant_id
      and student_assignment.enrollment_id = enrollment.id
    left join public.family_threads as thread
      on thread.tenant_id = guardian_link.tenant_id
      and thread.child_id = guardian_link.student_id
      and thread.guardian_user_id = guardian.id
      and private.family_thread_is_current_v1(thread.tenant_id, thread.id)
    where tenant.status = 'active'
      and tenant.family_portal_enabled
      and tenant.family_messaging_enabled
      and (tenant.lifecycle_expires_at is null
        or tenant.lifecycle_expires_at > statement_timestamp())
      and exists (
        select 1
        from public.provider_identities as guardian_identity
        where guardian_identity.app_user_id = guardian.id
          and guardian_identity.active
          and guardian_identity.lifecycle_expires_at > statement_timestamp()
      )
      and private.family_retention_days_v1(
        tenant.id, 'notification_outbox'
      ) is not null
      and not exists (
        select 1
        from public.email_suppressions as suppression
        where suppression.tenant_id = tenant.id
          and suppression.recipient_email_digest =
            guardian.notification_email_digest
          and suppression.lifecycle_expires_at > statement_timestamp()
      )
      and not exists (
        select 1
        from public.notification_outbox as existing_digest
        where existing_digest.tenant_id = tenant.id
          and existing_digest.idempotency_key =
            'weekly:' || tenant.id::text || ':' || guardian.id::text || ':'
              || to_char(p_week_start, 'IYYY-IW')
      )
    group by
      tenant.id, tenant.environment_id, tenant.data_mode, guardian.id,
      guardian.notification_email_digest,
      guardian.notification_email_ciphertext, preference.locale
    order by tenant.id, guardian.id
    limit p_limit
  loop
    v_retention_days := private.family_retention_days_v1(
      v_candidate.tenant_id, 'notification_outbox'
    );
    if v_retention_days is null then continue; end if;
    insert into public.notification_outbox (
      tenant_id, environment_id, data_mode, kind, recipient_user_id,
      recipient_email_digest, recipient_email_ciphertext, locale,
      idempotency_key, aggregate_type, aggregate_id, payload,
      retention_anchor_at, expires_at
    ) values (
      v_candidate.tenant_id, v_candidate.environment_id,
      v_candidate.data_mode, 'weekly_family_digest',
      v_candidate.guardian_user_id,
      v_candidate.notification_email_digest,
      v_candidate.notification_email_ciphertext, v_candidate.locale,
      'weekly:' || v_candidate.tenant_id::text || ':'
        || v_candidate.guardian_user_id::text || ':'
        || to_char(p_week_start, 'IYYY-IW'),
      'guardian_week', v_candidate.guardian_user_id,
      jsonb_build_object(
        'kind', 'weekly_family_digest',
        'activityCount', v_candidate.activity_count,
        'openAssignmentCount', v_candidate.open_assignment_count,
        'unreadThreadCount', v_candidate.unread_thread_count
      ), statement_timestamp(),
      statement_timestamp() + make_interval(days => v_retention_days)
    ) on conflict (tenant_id, idempotency_key) do nothing;
    get diagnostics v_rows = row_count;
    v_enqueued := v_enqueued + v_rows;
  end loop;

  return jsonb_build_object(
    'enqueued', v_enqueued, 'week_start', p_week_start
  );
end;
$$;

-- Preserve the existing lease/CAS implementation as a service-only core.
-- The wrapper cancels any race-created disabled message claim before it can be
-- handed to the mail worker. A bounded second pass avoids routine starvation
-- without turning this safety path into an unbounded loop.
alter function public.claim_family_notification_outbox_v1(integer)
  rename to claim_family_notification_outbox_pre_messaging_gate_v1;

revoke all on function
  public.claim_family_notification_outbox_pre_messaging_gate_v1(integer)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.claim_family_notification_outbox_v1(
  p_limit integer default 25
)
returns table (
  id uuid,
  tenant_id uuid,
  idempotency_key text,
  kind public.notification_kind,
  locale text,
  payload jsonb,
  recipient_email_ciphertext text,
  recipient_email_digest text,
  attempts integer,
  claim_token uuid,
  claim_expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_claim record;
  v_pass integer;
  v_returned integer := 0;
begin
  if p_limit not between 1 and 100 then
    raise exception using errcode = '22023',
      message = 'claim limit out of range';
  end if;
  for v_pass in 1..2 loop
    exit when v_returned >= p_limit;
    for v_claim in
      select *
      from public.claim_family_notification_outbox_pre_messaging_gate_v1(
        p_limit - v_returned
      )
    loop
      if v_claim.kind in ('family_message', 'weekly_family_digest')
        and not exists (
          select 1 from public.tenants as tenant
          where tenant.id = v_claim.tenant_id
            and tenant.status = 'active'
            and tenant.family_portal_enabled
            and tenant.family_messaging_enabled
            and (tenant.lifecycle_expires_at is null
              or tenant.lifecycle_expires_at > statement_timestamp())
        )
      then
        update public.notification_outbox as outbox
        set status = 'cancelled', claimed_at = null,
            claim_token = null, claim_expires_at = null
        where outbox.tenant_id = v_claim.tenant_id
          and outbox.id = v_claim.id
          and outbox.status = 'pending'
          and outbox.claim_token = v_claim.claim_token;
        continue;
      end if;

      id := v_claim.id;
      tenant_id := v_claim.tenant_id;
      idempotency_key := v_claim.idempotency_key;
      kind := v_claim.kind;
      locale := v_claim.locale;
      payload := v_claim.payload;
      recipient_email_ciphertext := v_claim.recipient_email_ciphertext;
      recipient_email_digest := v_claim.recipient_email_digest;
      attempts := v_claim.attempts;
      claim_token := v_claim.claim_token;
      claim_expires_at := v_claim.claim_expires_at;
      v_returned := v_returned + 1;
      return next;
    end loop;
  end loop;
end;
$$;

alter function public.validate_family_notification_claim_v1(uuid, uuid)
  rename to validate_family_notification_claim_pre_messaging_gate_v1;

revoke all on function
  public.validate_family_notification_claim_pre_messaging_gate_v1(uuid, uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.validate_family_notification_claim_v1(
  p_id uuid,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_core_valid boolean;
begin
  v_core_valid :=
    public.validate_family_notification_claim_pre_messaging_gate_v1(
      p_id, p_claim_token
    );
  if v_core_valid is not true then return false; end if;
  return exists (
    select 1
    from public.notification_outbox as outbox
    join public.tenants as tenant on tenant.id = outbox.tenant_id
    where outbox.id = p_id
      and outbox.claim_token = p_claim_token
      and (
        outbox.kind = 'guardian_invitation'
        or exists (
          select 1 from public.app_users as recipient
          where recipient.id = outbox.recipient_user_id
            and recipient.status = 'active'
            and recipient.lifecycle_expires_at > statement_timestamp()
            and exists (
              select 1
              from public.provider_identities as recipient_identity
              where recipient_identity.app_user_id = recipient.id
                and recipient_identity.active
                and recipient_identity.lifecycle_expires_at > statement_timestamp()
            )
        )
      )
      and (
        outbox.kind not in ('family_message', 'weekly_family_digest')
        or (
          tenant.status = 'active'
          and tenant.family_portal_enabled
          and tenant.family_messaging_enabled
          and (tenant.lifecycle_expires_at is null
            or tenant.lifecycle_expires_at > statement_timestamp())
        )
      )
      and (
        outbox.kind <> 'family_message'
        or exists (
          select 1
          from public.family_threads as thread
          where thread.tenant_id = outbox.tenant_id
            and thread.id = outbox.aggregate_id
            and private.family_thread_is_current_v1(
              thread.tenant_id, thread.id
            )
            and (
              outbox.recipient_user_id <> thread.guardian_user_id
              or exists (
                select 1
                from public.family_notification_preferences as preference
                where preference.tenant_id = thread.tenant_id
                  and preference.app_user_id = thread.guardian_user_id
                  and preference.message_email_enabled
                  and preference.lifecycle_expires_at > statement_timestamp()
              )
            )
        )
      )
      and (
        outbox.kind <> 'weekly_family_digest'
        or exists (
          select 1
          from public.family_notification_preferences as preference
          join public.role_bindings as guardian_role
            on guardian_role.tenant_id = preference.tenant_id
            and guardian_role.app_user_id = preference.app_user_id
            and guardian_role.role = 'guardian'
            and guardian_role.active
            and guardian_role.starts_at <= statement_timestamp()
            and (guardian_role.ends_at is null
              or guardian_role.ends_at > statement_timestamp())
            and guardian_role.lifecycle_expires_at > statement_timestamp()
          join public.guardian_links as guardian_link
            on guardian_link.tenant_id = preference.tenant_id
            and guardian_link.guardian_user_id = preference.app_user_id
            and guardian_link.status = 'active'
            and (guardian_link.expires_at is null
              or guardian_link.expires_at > statement_timestamp())
            and guardian_link.lifecycle_expires_at > statement_timestamp()
          where preference.tenant_id = outbox.tenant_id
            and preference.app_user_id = outbox.recipient_user_id
            and preference.weekly_digest_enabled
            and preference.lifecycle_expires_at > statement_timestamp()
        )
      )
  );
end;
$$;

-- The predecessor rebuild marked every projection row stale before it took
-- the per-student serialization lock. An online ingest could therefore hold
-- the student row while waiting for a projection row already locked by the
-- rebuild, while the rebuild waited for that same student row. Keep the
-- deterministic replay implementation owner-only and acquire every student
-- row that the replay can touch in one stable order before the predecessor is
-- allowed to lock projection rows.
alter function public.rebuild_family_projections_v1(integer)
  rename to rebuild_family_projections_unlocked_core_v1;

revoke all on function
  public.rebuild_family_projections_unlocked_core_v1(integer)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

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
  v_result jsonb;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_limit not between 1 and 10000 then
    raise exception using errcode = '22023',
      message = 'rebuild limit out of range';
  end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception using errcode = '25000',
      message = 'projection rebuild requires read committed isolation';
  end if;

  perform 1
  from public.students as locked_student
  where exists (
      select 1
      from public.learning_events_v2 as event
      where event.tenant_id = locked_student.tenant_id
        and event.student_id = locked_student.id
        and event.expires_at > statement_timestamp()
    )
    or exists (
      select 1
      from public.progress_projections_v1 as progress
      where progress.tenant_id = locked_student.tenant_id
        and progress.student_id = locked_student.id
    )
    or exists (
      select 1
      from public.skill_projections_v1 as skill
      where skill.tenant_id = locked_student.tenant_id
        and skill.student_id = locked_student.id
    )
  order by locked_student.tenant_id, locked_student.id
  for no key update;

  v_result := public.rebuild_family_projections_unlocked_core_v1(p_limit);
  return v_result;
end;
$$;

-- Least-privilege request and worker grants. Every renamed core is explicitly
-- owner-only; service_role is not reintroduced to browser/message cores.
revoke all on function public.family_authorization_context_v1()
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.family_workspace_for_tenant_v1(uuid, uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function
  public.update_family_notification_preferences_for_tenant_v1(
    uuid, boolean, boolean, text
  ) from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.mark_family_thread_read_v1(uuid, text)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.close_family_thread_v1(uuid, text)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.publish_school_announcement_v1(
  uuid, text, text, text, timestamptz
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.admin_family_access_workspace_for_tenant_v1(uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.teacher_family_inbox_for_tenant_v1(uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.authorize_school_announcement_publish_v1(uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.teacher_announcement_schools_for_tenant_v1(uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.claim_family_notification_outbox_v1(integer)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.validate_family_notification_claim_v1(uuid, uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.rebuild_family_projections_v1(integer)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.relinquish_guardian_link_v1(uuid, text)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function public.relinquish_guardian_child_access_v1(uuid, text)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

grant execute on function public.family_authorization_context_v1()
  to authenticated;
grant execute on function public.family_workspace_for_tenant_v1(uuid, uuid)
  to authenticated;
grant execute on function
  public.update_family_notification_preferences_for_tenant_v1(
    uuid, boolean, boolean, text
  ) to authenticated;
grant execute on function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) to authenticated;
grant execute on function public.mark_family_thread_read_v1(uuid, text)
  to authenticated;
grant execute on function public.close_family_thread_v1(uuid, text)
  to authenticated;
grant execute on function public.publish_school_announcement_v1(
  uuid, text, text, text, timestamptz
) to authenticated;
grant execute on function public.admin_family_access_workspace_for_tenant_v1(uuid)
  to authenticated;
grant execute on function public.authorize_school_announcement_publish_v1(uuid)
  to authenticated;
grant execute on function public.teacher_family_inbox_for_tenant_v1(uuid)
  to authenticated;
grant execute on function public.teacher_announcement_schools_for_tenant_v1(uuid)
  to authenticated;
grant execute on function public.claim_family_notification_outbox_v1(integer)
  to service_role;
grant execute on function public.validate_family_notification_claim_v1(uuid, uuid)
  to service_role;
grant execute on function public.rebuild_family_projections_v1(integer)
  to service_role;
grant execute on function public.relinquish_guardian_child_access_v1(uuid, text)
  to authenticated;

revoke all on function
  private.cancel_family_message_egress_on_tenant_gate_v1() from public;
revoke all on function private.lock_family_messaging_tenant_v1(uuid)
  from public;
revoke all on function private.family_thread_is_current_v1(uuid, uuid)
  from public;
revoke all on function private.family_current_children_json_v1(uuid, uuid)
  from public;
revoke all on function
  private.family_current_message_contacts_json_v1(uuid, uuid, uuid)
  from public;
revoke all on function
  private.family_current_notification_preference_json_v1(uuid, uuid)
  from public;
revoke all on function private.family_actor_can_publish_school_v1(uuid, uuid)
  from public;

comment on function public.family_workspace_for_tenant_v1(uuid, uuid) is
  'Guardian workspace scoped to one explicit opaque tenant locator. Signed identity, current guardian role/link, child, school, and enrollment are independently rechecked; no cross-tenant report is produced.';
comment on function
  public.update_family_notification_preferences_for_tenant_v1(
    uuid, boolean, boolean, text
  ) is
  'Guardian notification preferences for one explicitly selected, currently authorized tenant; exact idempotency replay is free and mismatched replay fails closed.';
comment on function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) is
  'Existing resource authorization and abuse-budget transaction plus a default-off database messaging gate; direct authenticated RPC cannot bypass the kill switch.';
comment on function public.admin_family_access_workspace_for_tenant_v1(uuid) is
  'Administrator family-access DTO scoped to one explicit, currently authorized tenant; expired identities, roles, and guardian relationships are excluded.';
comment on function public.claim_family_notification_outbox_v1(integer) is
  'Service-only leased outbox claim. Disabled-tenant message alerts and weekly family digests are cancelled and never returned for external egress.';
comment on function public.rebuild_family_projections_v1(integer) is
  'Service-only deterministic projection replay. It locks all affected student rows in canonical order before the owner-only rebuild core may stale or rewrite projection rows.';

commit;
