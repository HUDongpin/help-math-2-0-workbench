-- HELP Math family portal: canonical tenant-safe schema.
--
-- This migration is synthetic-data-only at creation time. The schema supports
-- a later production tenant without changing table shapes, but every tenant is
-- fail-closed until family_portal_enabled is deliberately enabled.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

create type public.parent_portal_data_mode as enum ('synthetic', 'production');
create type public.tenant_status as enum ('active', 'suspended', 'closed');
create type public.app_user_status as enum ('active', 'disabled');
create type public.app_role as enum (
  'guardian', 'learner', 'teacher', 'school_admin', 'district_admin'
);
create type public.guardian_relationship_kind as enum (
  'parent', 'legal_guardian', 'caregiver'
);
create type public.guardian_link_status as enum (
  'pending', 'active', 'revoked', 'expired'
);
create type public.invitation_status as enum (
  'pending', 'accepted', 'revoked', 'expired'
);
create type public.enrollment_status as enum ('active', 'completed', 'withdrawn');
create type public.family_assignment_status as enum (
  'not_started', 'in_progress', 'completed', 'overdue'
);
create type public.family_skill_band as enum (
  'insufficient_evidence', 'starting', 'growing', 'strong'
);
create type public.family_message_topic as enum (
  'assignment', 'progress', 'access', 'technical', 'other'
);
create type public.family_thread_status as enum ('open', 'closed');
create type public.notification_kind as enum (
  'guardian_invitation', 'family_message', 'weekly_family_digest',
  'account_security'
);
create type public.notification_outbox_status as enum (
  'pending', 'sent', 'failed', 'cancelled'
);
create type public.email_delivery_event_type as enum (
  'delivered', 'bounced', 'complained', 'suppressed'
);
create type public.learning_event_v2_type as enum (
  'lesson_started', 'lesson_resumed', 'page_visited', 'page_reviewed',
  'support_opened', 'practice_evaluated', 'lesson_exited'
);
create type public.learning_event_outcome as enum (
  'none', 'correct', 'incorrect', 'completed', 'abandoned'
);
create type public.audit_action as enum ('inserted', 'updated', 'deleted');
create type public.retention_data_class as enum (
  'guardian_invitation', 'family_message', 'learning_event',
  'school_announcement', 'notification_outbox', 'email_delivery_event',
  'audit_event'
);
create type public.retention_run_status as enum ('running', 'succeeded', 'failed');

create table public.tenants (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null default 'synthetic',
  family_portal_enabled boolean not null default false,
  status public.tenant_status not null default 'active',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, environment_id, data_mode),
  constraint tenants_slug_format check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'
  ),
  constraint tenants_display_name_length check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 160
  ),
  constraint tenants_environment_id_format check (
    environment_id = lower(environment_id)
    and environment_id ~ '^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$'
  )
);

create table public.app_users (
  id uuid primary key default extensions.gen_random_uuid(),
  display_name text not null,
  locale text not null default 'en',
  notification_email_digest text,
  notification_email_ciphertext text,
  status public.app_user_status not null default 'active',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint app_users_display_name_length check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 120
  ),
  constraint app_users_locale check (locale in ('en', 'es')),
  constraint app_users_email_pair check (
    (notification_email_digest is null) =
      (notification_email_ciphertext is null)
  ),
  constraint app_users_email_digest check (
    notification_email_digest is null
    or notification_email_digest ~ '^[0-9a-f]{64}$'
  ),
  constraint app_users_email_ciphertext check (
    notification_email_ciphertext is null
    or char_length(notification_email_ciphertext) between 16 and 8192
  )
);

create table public.provider_identities (
  issuer text not null,
  subject text not null,
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  primary key (issuer, subject),
  constraint provider_identities_issuer check (
    issuer = btrim(issuer)
    and char_length(issuer) between 3 and 500
    and issuer !~ '[[:space:]]'
  ),
  constraint provider_identities_subject check (
    subject = btrim(subject) and char_length(subject) between 1 and 255
  ),
  constraint provider_identities_revocation check (
    (active and revoked_at is null) or (not active and revoked_at is not null)
  )
);

create index provider_identities_user_idx
  on public.provider_identities (app_user_id) where active;

create table public.tenant_identity_issuers (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  issuer text not null,
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, issuer),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint tenant_identity_issuers_issuer check (
    issuer = btrim(issuer)
    and char_length(issuer) between 3 and 500
    and issuer !~ '[[:space:]]'
  )
);

create table public.schools (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  school_key text not null,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, school_key),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint schools_key check (
    school_key = lower(school_key)
    and school_key ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'
  ),
  constraint schools_name check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 160
  )
);

create table public.students (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  school_id uuid not null,
  local_reference text,
  display_name text not null,
  grade_label text not null,
  locale text not null default 'en',
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, school_id, local_reference),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, school_id)
    references public.schools (tenant_id, id)
    on update restrict on delete restrict,
  constraint students_reference check (
    local_reference is null
    or (local_reference = btrim(local_reference)
      and char_length(local_reference) between 1 and 120)
  ),
  constraint students_name check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 120
  ),
  constraint students_grade check (
    grade_label = btrim(grade_label)
    and char_length(grade_label) between 1 and 40
  ),
  constraint students_locale check (locale in ('en', 'es'))
);

create index students_school_idx
  on public.students (tenant_id, school_id, active);

create table public.role_bindings (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  role public.app_role not null,
  school_id uuid,
  student_id uuid,
  active boolean not null default true,
  starts_at timestamptz not null default clock_timestamp(),
  ends_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, school_id)
    references public.schools (tenant_id, id)
    on update restrict on delete cascade,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete cascade,
  constraint role_bindings_scope check (
    (role = 'guardian' and school_id is null and student_id is null)
    or (role = 'learner' and school_id is null and student_id is not null)
    or (role in ('teacher', 'school_admin')
      and school_id is not null and student_id is null)
    or (role = 'district_admin' and school_id is null and student_id is null)
  ),
  constraint role_bindings_lifetime check (
    (active and ends_at is null) or (not active and ends_at is not null)
  )
);

create unique index role_bindings_tenant_role_unique
  on public.role_bindings (tenant_id, app_user_id, role)
  where school_id is null and student_id is null;
create unique index role_bindings_school_role_unique
  on public.role_bindings (tenant_id, app_user_id, role, school_id)
  where school_id is not null;
create unique index role_bindings_student_role_unique
  on public.role_bindings (tenant_id, app_user_id, role, student_id)
  where student_id is not null;
create index role_bindings_active_user_idx
  on public.role_bindings (app_user_id, tenant_id, role) where active;

create table public.classes (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  school_id uuid not null,
  display_name text not null,
  grade_label text not null,
  academic_term text,
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, school_id)
    references public.schools (tenant_id, id)
    on update restrict on delete restrict,
  constraint classes_name check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 160
  ),
  constraint classes_grade check (
    grade_label = btrim(grade_label)
    and char_length(grade_label) between 1 and 40
  ),
  constraint classes_term check (
    academic_term is null or char_length(btrim(academic_term)) between 1 and 80
  )
);

create table public.enrollments (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  student_id uuid not null,
  class_id uuid not null,
  status public.enrollment_status not null default 'active',
  starts_at date not null default current_date,
  ends_at date,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, student_id, class_id, starts_at),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete restrict,
  foreign key (tenant_id, class_id)
    references public.classes (tenant_id, id)
    on update restrict on delete restrict,
  constraint enrollments_dates check (ends_at is null or ends_at >= starts_at)
);

create table public.class_staff_bindings (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  class_id uuid not null,
  teacher_user_id uuid not null references public.app_users(id) on delete cascade,
  active boolean not null default true,
  starts_at timestamptz not null default clock_timestamp(),
  ends_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, class_id, teacher_user_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, class_id)
    references public.classes (tenant_id, id)
    on update restrict on delete cascade,
  constraint class_staff_bindings_lifetime check (
    (active and ends_at is null) or (not active and ends_at is not null)
  )
);

create index class_staff_bindings_teacher_idx
  on public.class_staff_bindings (tenant_id, teacher_user_id, class_id)
  where active;

create index enrollments_student_idx
  on public.enrollments (tenant_id, student_id, status);
create index enrollments_class_idx
  on public.enrollments (tenant_id, class_id, status);

create table public.assignments (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  class_id uuid not null,
  teacher_user_id uuid not null references public.app_users(id) on delete restrict,
  title text not null,
  lesson_release_id text not null,
  lesson_title text not null,
  lesson_href text,
  total_pages integer not null,
  family_note text,
  assigned_at timestamptz not null default clock_timestamp(),
  due_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, class_id)
    references public.classes (tenant_id, id)
    on update restrict on delete restrict,
  constraint assignments_title check (
    title = btrim(title) and char_length(title) between 1 and 200
  ),
  constraint assignments_release check (
    lesson_release_id = btrim(lesson_release_id)
    and char_length(lesson_release_id) between 1 and 160
  ),
  constraint assignments_lesson_title check (
    lesson_title = btrim(lesson_title)
    and char_length(lesson_title) between 1 and 200
  ),
  constraint assignments_lesson_href check (
    lesson_href is null
    or lesson_href ~ '^/(?:es/)?courses/[3-5]/[0-9]{1,2}$'
  ),
  constraint assignments_pages check (total_pages between 1 and 1000),
  constraint assignments_family_note check (
    family_note is null or char_length(family_note) <= 500
  ),
  constraint assignments_due check (due_at is null or due_at >= assigned_at)
);

create table public.student_assignments (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  enrollment_id uuid not null,
  assignment_id uuid not null,
  status public.family_assignment_status not null default 'not_started',
  reviewed_pages integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, enrollment_id, assignment_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, enrollment_id)
    references public.enrollments (tenant_id, id)
    on update restrict on delete cascade,
  foreign key (tenant_id, assignment_id)
    references public.assignments (tenant_id, id)
    on update restrict on delete cascade,
  constraint student_assignments_pages check (reviewed_pages between 0 and 1000),
  constraint student_assignments_completion check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index student_assignments_enrollment_idx
  on public.student_assignments (tenant_id, enrollment_id, status);

create table public.family_content_release_memberships (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  content_release_id text not null,
  lesson_release_id text not null,
  learning_object_version_id text not null,
  skill_id text,
  skill_name text,
  published boolean not null default false,
  active_from timestamptz not null default clock_timestamp(),
  active_until timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint family_content_release_ids check (
    char_length(content_release_id) between 1 and 128
    and char_length(lesson_release_id) between 1 and 160
    and char_length(learning_object_version_id) between 1 and 160
    and (skill_id is null or char_length(skill_id) between 1 and 160)
    and ((skill_id is null) = (skill_name is null))
    and (skill_name is null or char_length(skill_name) between 1 and 160)
  ),
  constraint family_content_release_window check (
    active_until is null or active_until > active_from
  )
);

create unique index family_content_release_memberships_exact_idx
  on public.family_content_release_memberships (
    tenant_id, content_release_id, lesson_release_id,
    learning_object_version_id, coalesce(skill_id, '')
  );

create table public.progress_projections_v1 (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  student_id uuid not null,
  assignment_id uuid,
  lesson_release_id text not null,
  lesson_title text not null,
  reviewed_pages integer not null,
  total_pages integer not null,
  last_activity_at timestamptz,
  last_event_occurred_at timestamptz,
  last_event_id uuid,
  computed_at timestamptz not null,
  stale boolean not null default false,
  support_title text,
  support_description text,
  support_source text,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, student_id, lesson_release_id, assignment_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete cascade,
  foreign key (tenant_id, assignment_id)
    references public.assignments (tenant_id, id)
    on update restrict on delete cascade,
  constraint progress_projection_release check (
    lesson_release_id = btrim(lesson_release_id)
    and char_length(lesson_release_id) between 1 and 160
  ),
  constraint progress_projection_title check (
    lesson_title = btrim(lesson_title)
    and char_length(lesson_title) between 1 and 200
  ),
  constraint progress_projection_pages check (
    total_pages between 1 and 1000
    and reviewed_pages between 0 and total_pages
  ),
  constraint progress_projection_watermark check (
    (last_event_occurred_at is null) = (last_event_id is null)
  ),
  constraint progress_projection_support check (
    (support_title is null and support_description is null and support_source is null)
    or (
      char_length(support_title) between 1 and 200
      and char_length(support_description) between 1 and 800
      and support_source in ('teacher', 'approved_curriculum')
    )
  ),
  constraint progress_projection_retention check (
    expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '30 days'
  )
);

create table public.skill_projections_v1 (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  student_id uuid not null,
  skill_id text not null,
  skill_name text not null,
  band public.family_skill_band not null,
  evidence_count integer not null,
  explanation text not null,
  window_starts_at timestamptz not null,
  window_ends_at timestamptz not null,
  computed_at timestamptz not null,
  stale boolean not null default false,
  last_event_occurred_at timestamptz,
  last_event_id uuid,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, student_id, skill_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete cascade,
  constraint skill_projection_skill check (
    skill_id = btrim(skill_id) and char_length(skill_id) between 1 and 160
    and skill_name = btrim(skill_name) and char_length(skill_name) between 1 and 160
  ),
  constraint skill_projection_evidence check (evidence_count between 0 and 1000000),
  constraint skill_projection_explanation check (
    explanation = btrim(explanation)
    and char_length(explanation) between 1 and 500
  ),
  constraint skill_projection_window check (window_ends_at >= window_starts_at),
  constraint skill_projection_watermark check (
    (last_event_occurred_at is null) = (last_event_id is null)
  ),
  constraint skill_projection_retention check (
    expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '30 days'
  )
);

create table public.guardian_links (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  guardian_user_id uuid not null references public.app_users(id) on delete restrict,
  student_id uuid not null,
  relationship_kind public.guardian_relationship_kind not null default 'parent',
  status public.guardian_link_status not null default 'pending',
  created_by_user_id uuid not null references public.app_users(id) on delete restrict,
  verified_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  expired_at timestamptz,
  revocation_idempotency_key text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete restrict,
  constraint guardian_links_state check (
    (status = 'pending' and verified_at is null and revoked_at is null and expired_at is null)
    or (status = 'active' and verified_at is not null and revoked_at is null and expired_at is null)
    or (status = 'revoked' and revoked_at is not null and expired_at is null)
    or (status = 'expired' and expired_at is not null and revoked_at is null)
  ),
  constraint guardian_links_expiry check (
    expires_at is null or expires_at > created_at
  ),
  constraint guardian_links_idempotency check (
    revocation_idempotency_key is null
    or (char_length(revocation_idempotency_key) between 8 and 128
      and revocation_idempotency_key ~ '^[A-Za-z0-9._:-]+$')
  )
);

create unique index guardian_links_one_current_idx
  on public.guardian_links (tenant_id, guardian_user_id, student_id)
  where status in ('pending', 'active');
create index guardian_links_guardian_idx
  on public.guardian_links (tenant_id, guardian_user_id, student_id)
  where status = 'active';
create index guardian_links_student_idx
  on public.guardian_links (tenant_id, student_id, guardian_user_id)
  where status = 'active';

create table public.guardian_invitations (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  school_id uuid not null,
  student_id uuid not null,
  invited_by_user_id uuid not null references public.app_users(id) on delete restrict,
  recipient_email_digest text not null,
  recipient_email_ciphertext text not null,
  token_digest text not null unique,
  create_idempotency_key text not null,
  last_delivery_idempotency_key text not null,
  acceptance_idempotency_key text,
  revocation_idempotency_key text,
  send_count integer not null default 1,
  status public.invitation_status not null default 'pending',
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null,
  last_sent_at timestamptz not null default clock_timestamp(),
  accepted_at timestamptz,
  accepted_by_user_id uuid references public.app_users(id) on delete restrict,
  revoked_at timestamptz,
  revoked_by_user_id uuid references public.app_users(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, school_id)
    references public.schools (tenant_id, id)
    on update restrict on delete restrict,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete restrict,
  constraint guardian_invitations_email_digest check (
    recipient_email_digest ~ '^[0-9a-f]{64}$'
  ),
  constraint guardian_invitations_token_digest check (
    token_digest ~ '^[0-9a-f]{64}$'
  ),
  constraint guardian_invitations_ciphertext check (
    char_length(recipient_email_ciphertext) between 16 and 8192
  ),
  constraint guardian_invitations_idempotency check (
    char_length(create_idempotency_key) between 8 and 128
    and create_idempotency_key ~ '^[A-Za-z0-9._:-]+$'
    and char_length(last_delivery_idempotency_key) between 8 and 128
    and last_delivery_idempotency_key ~ '^[A-Za-z0-9._:-]+$'
    and (
      acceptance_idempotency_key is null
      or (char_length(acceptance_idempotency_key) between 8 and 128
        and acceptance_idempotency_key ~ '^[A-Za-z0-9._:-]+$')
    )
    and (
      revocation_idempotency_key is null
      or (char_length(revocation_idempotency_key) between 8 and 128
        and revocation_idempotency_key ~ '^[A-Za-z0-9._:-]+$')
    )
  ),
  constraint guardian_invitations_send_count check (send_count between 1 and 100),
  constraint guardian_invitations_expiration check (
    expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '8 days'
  ),
  constraint guardian_invitations_state check (
    (status = 'pending' and accepted_at is null and revoked_at is null)
    or (status = 'accepted' and accepted_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
    or (status = 'expired' and accepted_at is null and revoked_at is null)
  )
);

create unique index guardian_invitations_create_idempotency_idx
  on public.guardian_invitations
    (tenant_id, invited_by_user_id, create_idempotency_key);
create index guardian_invitations_recipient_idx
  on public.guardian_invitations
    (recipient_email_digest, status, expires_at);

create table public.family_threads (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  school_id uuid not null,
  child_id uuid not null,
  enrollment_id uuid not null,
  guardian_user_id uuid not null references public.app_users(id) on delete restrict,
  staff_user_id uuid not null references public.app_users(id) on delete restrict,
  created_by_user_id uuid not null references public.app_users(id) on delete restrict,
  topic public.family_message_topic not null,
  status public.family_thread_status not null default 'open',
  closed_at timestamptz,
  closed_idempotency_key text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, school_id)
    references public.schools (tenant_id, id)
    on update restrict on delete restrict,
  foreign key (tenant_id, child_id)
    references public.students (tenant_id, id)
    on update restrict on delete restrict,
  foreign key (tenant_id, enrollment_id)
    references public.enrollments (tenant_id, id)
    on update restrict on delete restrict,
  constraint family_threads_state check (
    (status = 'open' and closed_at is null)
    or (status = 'closed' and closed_at is not null)
  ),
  constraint family_threads_idempotency check (
    closed_idempotency_key is null
    or (char_length(closed_idempotency_key) between 8 and 128
      and closed_idempotency_key ~ '^[A-Za-z0-9._:-]+$')
  )
);

create index family_threads_child_idx
  on public.family_threads (tenant_id, child_id, status, updated_at desc);
create index family_threads_staff_idx
  on public.family_threads (tenant_id, staff_user_id, status, updated_at desc);

create table public.family_messages (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  thread_id uuid not null,
  sender_user_id uuid not null references public.app_users(id) on delete restrict,
  idempotency_key text not null,
  body text not null,
  redacted_at timestamptz,
  redacted_by_user_id uuid references public.app_users(id) on delete restrict,
  redaction_reason text,
  redaction_idempotency_key text,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  created_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, sender_user_id, idempotency_key),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, thread_id)
    references public.family_threads (tenant_id, id)
    on update restrict on delete cascade,
  constraint family_messages_idempotency check (
    char_length(idempotency_key) between 8 and 128
    and idempotency_key ~ '^[A-Za-z0-9._:-]+$'
  ),
  constraint family_messages_body check (
    body = btrim(body) and char_length(body) between 1 and 2000
    and body !~ '[[:cntrl:]]'
  ),
  constraint family_messages_redaction check (
    (
      redacted_at is null and redacted_by_user_id is null
      and redaction_reason is null and redaction_idempotency_key is null
    ) or (
      redacted_at is not null and redacted_by_user_id is not null
      and body = '[redacted]'
      and redaction_reason = btrim(redaction_reason)
      and char_length(redaction_reason) between 1 and 500
      and char_length(redaction_idempotency_key) between 8 and 128
      and redaction_idempotency_key ~ '^[A-Za-z0-9._:-]+$'
    )
  ),
  constraint family_messages_retention check (
    expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '30 days'
  )
);

create index family_messages_thread_idx
  on public.family_messages (tenant_id, thread_id, created_at, id);

create table public.family_thread_reads (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  thread_id uuid not null,
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  last_read_message_id uuid,
  last_read_at timestamptz not null default clock_timestamp(),
  idempotency_key text not null,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, thread_id, app_user_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, thread_id)
    references public.family_threads (tenant_id, id)
    on update restrict on delete cascade,
  foreign key (tenant_id, last_read_message_id)
    references public.family_messages (tenant_id, id)
    on update restrict on delete set null,
  constraint family_thread_reads_idempotency check (
    char_length(idempotency_key) between 8 and 128
    and idempotency_key ~ '^[A-Za-z0-9._:-]+$'
  )
);

create table public.family_notification_preferences (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  message_email_enabled boolean not null default false,
  weekly_digest_enabled boolean not null default false,
  locale text not null default 'en',
  idempotency_key text not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, app_user_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint family_notification_preferences_locale check (locale in ('en', 'es')),
  constraint family_notification_preferences_idempotency check (
    char_length(idempotency_key) between 8 and 128
    and idempotency_key ~ '^[A-Za-z0-9._:-]+$'
  )
);

create table public.school_announcements (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  school_id uuid not null,
  publisher_user_id uuid not null references public.app_users(id) on delete restrict,
  idempotency_key text not null,
  title text not null,
  body text not null,
  published_at timestamptz not null default clock_timestamp(),
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, publisher_user_id, idempotency_key),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, school_id)
    references public.schools (tenant_id, id)
    on update restrict on delete cascade,
  constraint school_announcements_title check (
    title = btrim(title) and char_length(title) between 1 and 200
  ),
  constraint school_announcements_body check (
    body = btrim(body) and char_length(body) between 1 and 2000
  ),
  constraint school_announcements_idempotency check (
    char_length(idempotency_key) between 8 and 128
    and idempotency_key ~ '^[A-Za-z0-9._:-]+$'
  ),
  constraint school_announcements_expiry check (
    expires_at is not null
    and expires_at > greatest(published_at, retention_anchor_at)
    and expires_at <= retention_anchor_at + interval '30 days'
  )
);

create table public.learning_events_v2 (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  event_id uuid not null,
  student_id uuid not null,
  assignment_id uuid not null,
  enrollment_id uuid not null,
  recorded_by_user_id uuid not null references public.app_users(id) on delete restrict,
  schema_version smallint not null default 2,
  event_type public.learning_event_v2_type not null,
  occurred_at timestamptz not null,
  active_duration_ms integer not null,
  attempt_number integer not null,
  client_mutation_id text not null,
  client_version text not null,
  content_release_id text not null,
  idempotency_key text not null,
  learning_object_version_id text not null,
  lesson_release_id text not null,
  locale text not null,
  outcome public.learning_event_outcome not null,
  session_id uuid not null,
  skill_id text,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  recorded_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, event_id),
  unique (event_id),
  unique (tenant_id, recorded_by_user_id, idempotency_key),
  unique (tenant_id, recorded_by_user_id, client_mutation_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete restrict,
  foreign key (tenant_id, assignment_id)
    references public.assignments (tenant_id, id)
    on update restrict on delete restrict,
  foreign key (tenant_id, enrollment_id)
    references public.enrollments (tenant_id, id)
    on update restrict on delete restrict,
  constraint learning_events_v2_schema check (schema_version = 2),
  constraint learning_events_v2_duration check (
    active_duration_ms between 0 and 14400000
  ),
  constraint learning_events_v2_attempt check (attempt_number between 1 and 10000),
  constraint learning_events_v2_mutation check (
    char_length(client_mutation_id) between 8 and 128
    and client_mutation_id ~ '^[A-Za-z0-9._:-]+$'
  ),
  constraint learning_events_v2_versions check (
    char_length(client_version) between 1 and 64
    and char_length(content_release_id) between 1 and 128
    and char_length(learning_object_version_id) between 1 and 160
    and char_length(lesson_release_id) between 1 and 160
  ),
  constraint learning_events_v2_idempotency check (
    char_length(idempotency_key) between 8 and 160
  ),
  constraint learning_events_v2_locale check (locale in ('en', 'es')),
  constraint learning_events_v2_skill check (
    skill_id is null or char_length(skill_id) between 1 and 160
  ),
  constraint learning_events_v2_clock check (
    occurred_at <= recorded_at + interval '5 minutes'
  ),
  constraint learning_events_v2_retention check (
    expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '30 days'
  )
);

create index learning_events_v2_student_idx
  on public.learning_events_v2 (tenant_id, student_id, occurred_at desc);

create unique index learning_events_v2_page_reviewed_once_idx
  on public.learning_events_v2 (
    tenant_id, student_id, assignment_id, learning_object_version_id
  ) where event_type = 'page_reviewed';

create table public.notification_outbox (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  kind public.notification_kind not null,
  recipient_user_id uuid references public.app_users(id) on delete restrict,
  recipient_email_digest text not null,
  recipient_email_ciphertext text not null,
  locale text not null default 'en',
  idempotency_key text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null,
  status public.notification_outbox_status not null default 'pending',
  available_at timestamptz not null default clock_timestamp(),
  attempts integer not null default 0,
  claimed_at timestamptz,
  claim_token uuid,
  claim_expires_at timestamptz,
  last_attempt_at timestamptz,
  provider_email_id text,
  delivery_status public.email_delivery_event_type,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, idempotency_key),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint notification_outbox_digest check (
    recipient_email_digest ~ '^[0-9a-f]{64}$'
  ),
  constraint notification_outbox_ciphertext check (
    char_length(recipient_email_ciphertext) between 16 and 8192
  ),
  constraint notification_outbox_locale check (locale in ('en', 'es')),
  constraint notification_outbox_idempotency check (
    char_length(idempotency_key) between 8 and 160
  ),
  constraint notification_outbox_aggregate check (
    aggregate_type ~ '^[a-z][a-z0-9_]*$'
    and char_length(aggregate_type) between 1 and 80
  ),
  constraint notification_outbox_payload check (jsonb_typeof(payload) = 'object'),
  constraint notification_outbox_attempts check (attempts between 0 and 100),
  constraint notification_outbox_claim check (
    (
      claimed_at is null and claim_token is null and claim_expires_at is null
    ) or (
      status = 'pending' and claimed_at is not null
      and claim_token is not null and claim_expires_at > claimed_at
    )
  ),
  constraint notification_outbox_provider check (
    provider_email_id is null or char_length(provider_email_id) between 1 and 255
  ),
  constraint notification_outbox_retention check (
    expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '30 days'
  )
);

create index notification_outbox_claim_idx
  on public.notification_outbox (available_at, created_at)
  where status = 'pending';
create unique index notification_outbox_provider_email_idx
  on public.notification_outbox (provider_email_id)
  where provider_email_id is not null;

create table public.email_delivery_events (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  provider_event_id text not null unique,
  provider_email_id text not null,
  event_type public.email_delivery_event_type not null,
  occurred_at timestamptz not null,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  recorded_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint email_delivery_events_provider_event check (
    char_length(provider_event_id) between 1 and 255
  ),
  constraint email_delivery_events_provider_email check (
    char_length(provider_email_id) between 1 and 255
  ),
  constraint email_delivery_events_clock check (
    occurred_at <= recorded_at + interval '5 minutes'
  ),
  constraint email_delivery_events_retention check (
    expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '30 days'
  )
);

create table public.email_suppressions (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  recipient_email_digest text not null,
  reason public.email_delivery_event_type not null,
  source_provider_email_id text not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, recipient_email_digest),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint email_suppressions_digest check (
    recipient_email_digest ~ '^[0-9a-f]{64}$'
  )
);

create table public.audit_events (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  actor_user_id uuid references public.app_users(id) on delete set null,
  action public.audit_action not null,
  entity_type text not null,
  entity_id uuid not null,
  context jsonb not null default '{}'::jsonb,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  occurred_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint audit_events_entity check (
    entity_type ~ '^[a-z][a-z0-9_]*$'
    and char_length(entity_type) between 1 and 80
  ),
  constraint audit_events_context check (jsonb_typeof(context) = 'object'),
  constraint audit_events_retention check (
    expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '30 days'
  )
);

create index audit_events_entity_idx
  on public.audit_events (tenant_id, entity_type, entity_id, occurred_at desc);

create table public.retention_policies (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  data_class public.retention_data_class not null,
  retention_days integer not null,
  legal_hold boolean not null default false,
  enabled boolean not null default true,
  approved_at timestamptz,
  approved_by_user_id uuid references public.app_users(id) on delete set null,
  updated_by_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, data_class),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint retention_policies_days check (retention_days between 1 and 30),
  constraint retention_policies_approval check (
    (approved_at is null) = (approved_by_user_id is null)
  )
);

create table public.retention_runs (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  status public.retention_run_status not null default 'running',
  initiated_by_user_id uuid references public.app_users(id) on delete set null,
  cutoff_snapshot jsonb not null default '{}'::jsonb,
  deleted_counts jsonb not null default '{}'::jsonb,
  error_code text,
  started_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  primary key (tenant_id, id),
  unique (id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint retention_runs_json check (
    jsonb_typeof(cutoff_snapshot) = 'object'
    and jsonb_typeof(deleted_counts) = 'object'
  ),
  constraint retention_runs_state check (
    (status = 'running' and completed_at is null and error_code is null)
    or (status = 'succeeded' and completed_at is not null and error_code is null)
    or (status = 'failed' and completed_at is not null and error_code is not null)
  )
);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

revoke all on function private.touch_updated_at() from public;

do $triggers$
declare
  table_name text;
begin
  foreach table_name in array array[
    'tenants', 'app_users', 'tenant_identity_issuers',
    'schools', 'students', 'role_bindings', 'classes',
    'enrollments', 'class_staff_bindings', 'assignments',
    'student_assignments', 'family_content_release_memberships',
    'guardian_links',
    'guardian_invitations', 'family_threads', 'family_thread_reads',
    'family_notification_preferences', 'school_announcements',
    'notification_outbox', 'retention_policies'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.touch_updated_at()',
      table_name || '_touch_updated_at', table_name
    );
  end loop;
end;
$triggers$;

comment on table public.provider_identities is
  'Exact issuer + subject bindings. Email is never an authentication key.';
comment on table public.guardian_links is
  'Explicit and revocable guardian authorization edges; active status alone is insufficient after expires_at.';
comment on table public.notification_outbox is
  'Service-only encrypted-recipient delivery intents. Raw invitation tokens, plaintext email, and message bodies are prohibited.';
comment on table public.audit_events is
  'Append-only metadata audit trail; secret-bearing and message-body keys are rejected by a later migration.';
comment on table public.family_content_release_memberships is
  'Family-event ingestion allowlist only. Published here does not confer Current-JS, fidelity, acceptance, release, or publication status.';

commit;
