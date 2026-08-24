-- HELP Math family portal: synthetic-only learner assignment launch and
-- browser LearningEventV2 boundary.
--
-- This migration deliberately does not confer Current-JS registration,
-- publication, Flash fidelity, audio, human, Owner, or strict-completion
-- status. It only binds an already-authorized synthetic assignment to an
-- independently verified product placement allowlist.

begin;

alter table public.tenants
  add column learning_events_v2_enabled boolean not null default false;

create table public.assignment_learning_object_bindings (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  assignment_id uuid not null,
  page_ordinal integer not null,
  placement_id text not null,
  animation_id text not null,
  content_release_membership_id uuid not null,
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, assignment_id, page_ordinal),
  unique (tenant_id, assignment_id, placement_id),
  unique (tenant_id, assignment_id, content_release_membership_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, assignment_id)
    references public.assignments (tenant_id, id)
    on update restrict on delete cascade,
  foreign key (tenant_id, content_release_membership_id)
    references public.family_content_release_memberships (tenant_id, id)
    on update restrict on delete restrict,
  constraint assignment_learning_object_bindings_synthetic_only check (
    data_mode = 'synthetic'
  ),
  constraint assignment_learning_object_bindings_ordinal check (
    page_ordinal between 1 and 1000
  ),
  constraint assignment_learning_object_bindings_placement check (
    placement_id = btrim(placement_id)
    and char_length(placement_id) between 1 and 200
    and placement_id ~ '^[A-Za-z0-9._:-]+$'
  ),
  constraint assignment_learning_object_bindings_animation check (
    animation_id = btrim(animation_id)
    and char_length(animation_id) between 1 and 200
    and animation_id ~ '^[A-Za-z0-9._:-]+$'
  )
);

create index assignment_learning_object_bindings_active_idx
  on public.assignment_learning_object_bindings (
    tenant_id, assignment_id, page_ordinal
  ) where active;

create or replace function private.enforce_assignment_learning_object_binding_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_assignment public.assignments%rowtype;
  v_membership public.family_content_release_memberships%rowtype;
begin
  if tg_op = 'UPDATE' then
    if new.tenant_id <> old.tenant_id
      or new.environment_id <> old.environment_id
      or new.data_mode <> old.data_mode
      or new.id <> old.id
      or new.assignment_id <> old.assignment_id
      or new.page_ordinal <> old.page_ordinal
      or new.placement_id <> old.placement_id
      or new.animation_id <> old.animation_id
      or new.content_release_membership_id <>
        old.content_release_membership_id
      or new.created_at <> old.created_at
    then
      raise exception using errcode = '23514',
        message = 'learning assignment binding identity is immutable';
    end if;
    if not old.active and new.active then
      raise exception using errcode = '23514',
        message = 'inactive learning assignment binding is terminal';
    end if;
  end if;

  begin
    select * into strict v_assignment
    from public.assignments as assignment
    where assignment.tenant_id = new.tenant_id
      and assignment.id = new.assignment_id
      and assignment.environment_id = new.environment_id
      and assignment.data_mode = new.data_mode;

    select * into strict v_membership
    from public.family_content_release_memberships as membership
    where membership.tenant_id = new.tenant_id
      and membership.id = new.content_release_membership_id
      and membership.environment_id = new.environment_id
      and membership.data_mode = new.data_mode;
  exception
    when no_data_found or too_many_rows then
      raise exception using errcode = '23503',
        message = 'learning assignment binding target not found';
  end;

  if new.data_mode <> 'synthetic'
    or v_assignment.lesson_release_id <>
      'lesson-g04-l03-negative-numbers'
    or v_assignment.lesson_href <> '/courses/4/3'
    or v_assignment.total_pages <> 39
    or new.page_ordinal > v_assignment.total_pages
    or v_membership.lesson_release_id <> v_assignment.lesson_release_id
    or (new.active and not v_membership.published)
  then
    raise exception using errcode = '23514',
      message = 'learning assignment binding is inconsistent';
  end if;

  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger assignment_learning_object_bindings_enforce
before insert or update on public.assignment_learning_object_bindings
for each row execute function
  private.enforce_assignment_learning_object_binding_v1();

alter table public.assignment_learning_object_bindings
  enable row level security;

create or replace function private.family_learning_assignment_context_v1(
  p_assignment_id uuid,
  p_actor_user_id uuid
)
returns table (
  tenant_id uuid,
  environment_id text,
  data_mode public.parent_portal_data_mode,
  assignment_id uuid,
  enrollment_id uuid,
  student_id uuid,
  lesson_release_id text,
  lesson_href text,
  total_pages integer
)
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select
    assignment.tenant_id,
    assignment.environment_id,
    assignment.data_mode,
    assignment.id,
    enrollment.id,
    student.id,
    assignment.lesson_release_id,
    assignment.lesson_href,
    assignment.total_pages
  from public.assignments as assignment
  join public.student_assignments as student_assignment
    on student_assignment.tenant_id = assignment.tenant_id
    and student_assignment.assignment_id = assignment.id
  join public.enrollments as enrollment
    on enrollment.tenant_id = student_assignment.tenant_id
    and enrollment.id = student_assignment.enrollment_id
    and enrollment.class_id = assignment.class_id
  join public.students as student
    on student.tenant_id = enrollment.tenant_id
    and student.id = enrollment.student_id
  join public.classes as class_row
    on class_row.tenant_id = enrollment.tenant_id
    and class_row.id = enrollment.class_id
    and class_row.id = assignment.class_id
  join public.schools as school
    on school.tenant_id = student.tenant_id
    and school.id = student.school_id
    and school.id = class_row.school_id
  join public.tenants as tenant on tenant.id = assignment.tenant_id
  join public.app_users as actor_user
    on actor_user.id = p_actor_user_id
  join public.provider_identities as actor_identity
    on actor_identity.app_user_id = actor_user.id
    and actor_identity.issuer = private.jwt_claim('iss')
    and actor_identity.subject = private.jwt_claim('sub')
  join public.role_bindings as role_binding
    on role_binding.tenant_id = student.tenant_id
    and role_binding.app_user_id = p_actor_user_id
    and role_binding.role = 'learner'
    and role_binding.student_id = student.id
  join public.tenant_identity_issuers as identity_issuer
    on identity_issuer.tenant_id = tenant.id
    and identity_issuer.issuer = private.jwt_claim('iss')
  where assignment.id = p_assignment_id
    and assignment.lesson_release_id =
      'lesson-g04-l03-negative-numbers'
    and assignment.lesson_href = '/courses/4/3'
    and assignment.total_pages = 39
    and assignment.data_mode = 'synthetic'
    and student_assignment.data_mode = 'synthetic'
    and enrollment.data_mode = 'synthetic'
    and student.data_mode = 'synthetic'
    and class_row.data_mode = 'synthetic'
    and school.data_mode = 'synthetic'
    and tenant.data_mode = 'synthetic'
    and role_binding.data_mode = 'synthetic'
    and identity_issuer.data_mode = 'synthetic'
    and actor_user.status = 'active'
    and actor_user.lifecycle_expires_at > statement_timestamp()
    and actor_identity.active
    and actor_identity.lifecycle_expires_at > statement_timestamp()
    and enrollment.status = 'active'
    and enrollment.starts_at <= current_date
    and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
    and student.active
    and class_row.active
    and school.active
    and tenant.status = 'active'
    and tenant.family_portal_enabled
    and tenant.learning_events_v2_enabled
    and (
      tenant.lifecycle_expires_at is null
      or tenant.lifecycle_expires_at > statement_timestamp()
    )
    and role_binding.active
    and role_binding.starts_at <= statement_timestamp()
    and (
      role_binding.ends_at is null
      or role_binding.ends_at > statement_timestamp()
    )
    and role_binding.lifecycle_expires_at > statement_timestamp()
    and identity_issuer.active;
$$;

create or replace function public.learning_assignment_launch_v1(
  p_assignment_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_user_id uuid;
  v_context record;
  v_object_count integer;
  v_min_page_ordinal integer;
  v_max_page_ordinal integer;
  v_objects jsonb;
begin
  if private.jwt_claim('role') is distinct from 'authenticated'
    or p_assignment_id is null
  then
    raise exception using errcode = '42501',
      message = 'learning assignment not authorized';
  end if;
  v_actor_user_id := private.require_family_app_user();

  begin
    select * into strict v_context
    from private.family_learning_assignment_context_v1(
      p_assignment_id, v_actor_user_id
    );
  exception
    when no_data_found or too_many_rows then
      raise exception using errcode = 'P0002',
        message = 'learning assignment not found';
  end;

  select
    count(*)::integer,
    min(binding.page_ordinal),
    max(binding.page_ordinal),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'pageOrdinal', binding.page_ordinal,
          'placementId', binding.placement_id,
          'animationId', binding.animation_id,
          'contentReleaseId', membership.content_release_id,
          'learningObjectVersionId',
            membership.learning_object_version_id,
          'skillId', membership.skill_id
        ) order by binding.page_ordinal
      ),
      '[]'::jsonb
    )
  into
    v_object_count,
    v_min_page_ordinal,
    v_max_page_ordinal,
    v_objects
  from public.assignment_learning_object_bindings as binding
  join public.family_content_release_memberships as membership
    on membership.tenant_id = binding.tenant_id
    and membership.id = binding.content_release_membership_id
  where binding.tenant_id = v_context.tenant_id
    and binding.assignment_id = v_context.assignment_id
    and binding.data_mode = 'synthetic'
    and binding.active
    and membership.data_mode = 'synthetic'
    and membership.lesson_release_id = v_context.lesson_release_id
    and membership.published
    and membership.active_from <= statement_timestamp()
    and (
      membership.active_until is null
      or membership.active_until > statement_timestamp()
    );

  -- Unique ordinals, the table's 1..total bound, exact count, and these
  -- endpoints together make the allowlist a contiguous 1..total sequence.
  if v_object_count <> v_context.total_pages
    or v_min_page_ordinal <> 1
    or v_max_page_ordinal <> v_context.total_pages
  then
    raise exception using errcode = 'P0002',
      message = 'learning assignment not found';
  end if;

  return jsonb_build_object(
    'assignmentId', v_context.assignment_id,
    'tenantId', v_context.tenant_id,
    'lessonHref', v_context.lesson_href,
    'lessonReleaseId', v_context.lesson_release_id,
    'totalPages', v_context.total_pages,
    'objects', v_objects
  );
end;
$$;

create or replace function public.record_assignment_learning_events_v2(
  p_events jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_user_id uuid;
  v_assignment_id uuid;
  v_context record;
  v_event jsonb;
  v_occurred_at timestamptz;
  v_binding_id uuid;
  v_receipt jsonb;
begin
  if private.jwt_claim('role') is distinct from 'authenticated' then
    raise exception using errcode = '42501',
      message = 'learning assignment not authorized';
  end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    raise exception using errcode = '22023',
      message = 'invalid learning event batch';
  end if;
  if jsonb_array_length(p_events) not between 1 and 50
    or jsonb_typeof(p_events -> 0) <> 'object'
    or coalesce(p_events -> 0 ->> 'assignmentId', '')
      !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    raise exception using errcode = '22023',
      message = 'invalid learning event batch';
  end if;

  v_actor_user_id := private.require_family_app_user();
  v_assignment_id := (p_events -> 0 ->> 'assignmentId')::uuid;
  begin
    select * into strict v_context
    from private.family_learning_assignment_context_v1(
      v_assignment_id, v_actor_user_id
    );
  exception
    when no_data_found or too_many_rows then
      raise exception using errcode = 'P0002',
        message = 'learning assignment not found';
  end;

  -- Use the same first lock as ingest_learning_events_v2 and the projection
  -- rebuild. Taking the database-derived student row before any lifecycle or
  -- assignment row prevents a wrapper-versus-rebuild lock-order inversion;
  -- every authorization row is still revalidated under lock below.
  perform 1
  from public.students as locked_student
  where locked_student.tenant_id = v_context.tenant_id
    and locked_student.id = v_context.student_id
  for no key update;
  if not found then
    raise exception using errcode = 'P0002',
      message = 'learning assignment not found';
  end if;

  -- Hold the tenant lifecycle/kill-switch row stable until the authoritative
  -- ingestion function finishes. A runtime flag change cannot race this call.
  perform 1
  from public.tenants as tenant
  where tenant.id = v_context.tenant_id
    and tenant.data_mode = 'synthetic'
    and tenant.status = 'active'
    and tenant.family_portal_enabled
    and tenant.learning_events_v2_enabled
    and (
      tenant.lifecycle_expires_at is null
      or tenant.lifecycle_expires_at > statement_timestamp()
    )
  for share;
  if not found then
    raise exception using errcode = 'P0002',
      message = 'learning assignment not found';
  end if;

  -- Lock every identity/authorization/lifecycle row that makes this write
  -- reachable. Revocation, expiry, enrollment changes, or school/student
  -- deactivation cannot race an already-authorized event batch to commit.
  perform 1
  from public.app_users as actor_user
  join public.provider_identities as actor_identity
    on actor_identity.app_user_id = actor_user.id
    and actor_identity.issuer = private.jwt_claim('iss')
    and actor_identity.subject = private.jwt_claim('sub')
  join public.role_bindings as role_binding
    on role_binding.app_user_id = actor_user.id
    and role_binding.tenant_id = v_context.tenant_id
    and role_binding.role = 'learner'
    and role_binding.student_id = v_context.student_id
  join public.tenant_identity_issuers as identity_issuer
    on identity_issuer.tenant_id = role_binding.tenant_id
    and identity_issuer.issuer = private.jwt_claim('iss')
  join public.assignments as assignment
    on assignment.tenant_id = v_context.tenant_id
    and assignment.id = v_context.assignment_id
  join public.student_assignments as student_assignment
    on student_assignment.tenant_id = assignment.tenant_id
    and student_assignment.assignment_id = assignment.id
    and student_assignment.enrollment_id = v_context.enrollment_id
  join public.enrollments as enrollment
    on enrollment.tenant_id = student_assignment.tenant_id
    and enrollment.id = student_assignment.enrollment_id
    and enrollment.class_id = assignment.class_id
  join public.students as student
    on student.tenant_id = enrollment.tenant_id
    and student.id = enrollment.student_id
    and student.id = v_context.student_id
  join public.classes as class_row
    on class_row.tenant_id = enrollment.tenant_id
    and class_row.id = enrollment.class_id
  join public.schools as school
    on school.tenant_id = student.tenant_id
    and school.id = student.school_id
    and school.id = class_row.school_id
  where actor_user.id = v_actor_user_id
    and actor_user.status = 'active'
    and actor_user.lifecycle_expires_at > statement_timestamp()
    and actor_identity.active
    and actor_identity.lifecycle_expires_at > statement_timestamp()
    and role_binding.data_mode = 'synthetic'
    and role_binding.active
    and role_binding.starts_at <= statement_timestamp()
    and (
      role_binding.ends_at is null
      or role_binding.ends_at > statement_timestamp()
    )
    and role_binding.lifecycle_expires_at > statement_timestamp()
    and identity_issuer.data_mode = 'synthetic'
    and identity_issuer.active
    and assignment.data_mode = 'synthetic'
    and assignment.lesson_release_id =
      'lesson-g04-l03-negative-numbers'
    and assignment.lesson_href = '/courses/4/3'
    and assignment.total_pages = 39
    and student_assignment.data_mode = 'synthetic'
    and enrollment.data_mode = 'synthetic'
    and enrollment.status = 'active'
    and enrollment.starts_at <= current_date
    and (enrollment.ends_at is null or enrollment.ends_at >= current_date)
    and student.data_mode = 'synthetic'
    and student.active
    and class_row.data_mode = 'synthetic'
    and class_row.active
    and school.data_mode = 'synthetic'
    and school.active
  for share of
    actor_user, actor_identity, role_binding, identity_issuer, assignment,
    student_assignment, enrollment, student, class_row, school;
  if not found then
    raise exception using errcode = 'P0002',
      message = 'learning assignment not found';
  end if;

  for v_event in select value from jsonb_array_elements(p_events)
  loop
    if jsonb_typeof(v_event) <> 'object'
      or v_event ->> 'assignmentId' is distinct from v_assignment_id::text
      or v_event ->> 'eventType' = 'practice_evaluated'
      or (
        v_event ->> 'eventType' = 'page_reviewed'
        and v_event ->> 'outcome' is distinct from 'completed'
      )
      or (
        v_event ->> 'eventType' <> 'page_reviewed'
        and v_event ->> 'outcome' is distinct from 'none'
      )
    then
      raise exception using errcode = '22023',
        message = 'invalid assignment learning event';
    end if;

    begin
      v_occurred_at := (v_event ->> 'occurredAt')::timestamptz;
    exception
      when invalid_datetime_format or datetime_field_overflow then
        raise exception using errcode = '22023',
          message = 'invalid assignment learning event';
    end;
    if v_occurred_at < statement_timestamp() - interval '24 hours' then
      raise exception using errcode = '22023',
        message = 'learning event backfill is not allowed';
    end if;

    begin
      select binding.id into strict v_binding_id
      from public.assignment_learning_object_bindings as binding
      join public.family_content_release_memberships as membership
        on membership.tenant_id = binding.tenant_id
        and membership.id = binding.content_release_membership_id
      where binding.tenant_id = v_context.tenant_id
        and binding.assignment_id = v_context.assignment_id
        and binding.data_mode = 'synthetic'
        and binding.active
        and membership.data_mode = 'synthetic'
        and membership.content_release_id = v_event ->> 'contentReleaseId'
        and membership.lesson_release_id = v_event ->> 'lessonReleaseId'
        and membership.learning_object_version_id =
          v_event ->> 'learningObjectVersionId'
        and membership.skill_id is not distinct from
          nullif(v_event ->> 'skillId', '')
        and membership.published
        and membership.active_from <= v_occurred_at
        and (
          membership.active_until is null
          or membership.active_until > v_occurred_at
        )
      for share of binding, membership;
    exception
      when no_data_found or too_many_rows then
        raise exception using errcode = '22023',
          message = 'learning event binding not published';
    end;
  end loop;

  v_receipt := public.ingest_learning_events_v2(p_events);
  return jsonb_build_object('tenantId', v_context.tenant_id) || v_receipt;
end;
$$;

revoke all on table public.assignment_learning_object_bindings
  from public, anon, authenticated, service_role;

revoke all on function
  private.enforce_assignment_learning_object_binding_v1() from public;
revoke all on function private.family_learning_assignment_context_v1(
  uuid, uuid
) from public;
revoke all on function public.learning_assignment_launch_v1(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.record_assignment_learning_events_v2(jsonb)
  from public, anon, authenticated, service_role;

-- The old general-purpose endpoint must not bypass the Phase-1 tenant flag or
-- assignment-placement allowlist. It remains an owner-internal implementation
-- called only by record_assignment_learning_events_v2.
revoke execute on function public.ingest_learning_events_v2(jsonb)
  from authenticated, anon, service_role;

grant execute on function public.learning_assignment_launch_v1(uuid)
  to authenticated;
grant execute on function public.record_assignment_learning_events_v2(jsonb)
  to authenticated;

comment on column public.tenants.learning_events_v2_enabled is
  'Default-off tenant kill switch. Migration 012 additionally hard-limits every product caller to synthetic data_mode.';
comment on table public.assignment_learning_object_bindings is
  'Migration-owned, synthetic-only G4 L3 assignment telemetry allowlist; it does not alter or confer Current-JS registration, publication, fidelity, audio, human, Owner, or strict-completion evidence.';
comment on function public.learning_assignment_launch_v1(uuid) is
  'Returns the strict synthetic G4 L3 learner-assignment placement allowlist derived from signed identity and current database authorization; accepts no tenant, student, or actor parameter.';
comment on function public.record_assignment_learning_events_v2(jsonb) is
  'Synthetic-only browser LearningEventV2 wrapper. Rechecks signed learner authorization, assignment-scoped placement membership, and the bounded page-review outcome contract before authoritative ingestion; practice_evaluated and backfill are rejected.';

commit;
