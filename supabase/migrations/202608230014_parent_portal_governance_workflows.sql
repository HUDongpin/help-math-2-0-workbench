-- HELP Math Family Portal: controlled family rights, teacher suggestions,
-- audited time-limited message support, account activity, and invite decline.
--
-- Browser roles remain RPC-only. School administrators do not receive a
-- message directory. A distinct district administrator must approve an exact
-- support request before its requestor may read or redact one thread, and the
-- grant expires after at most fifteen minutes.

begin;

create type public.family_rights_request_kind as enum (
  'access', 'correction', 'deletion', 'relationship_dispute'
);
create type public.family_review_status as enum (
  'pending', 'completed', 'declined'
);
create type public.family_invitation_suggestion_status as enum (
  'pending', 'reviewed', 'dismissed'
);
create type public.family_support_access_status as enum (
  'pending', 'approved', 'denied', 'expired'
);

create table public.family_rights_requests (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  guardian_user_id uuid not null references public.app_users(id) on delete restrict,
  student_id uuid not null,
  request_kind public.family_rights_request_kind not null,
  details text,
  status public.family_review_status not null default 'pending',
  client_mutation_id text not null,
  decision_idempotency_key text,
  reviewed_by_user_id uuid references public.app_users(id) on delete restrict,
  submitted_at timestamptz not null default clock_timestamp(),
  decided_at timestamptz,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, guardian_user_id, client_mutation_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete restrict,
  constraint family_rights_requests_details check (
    details is null or (
      details = btrim(details) and char_length(details) between 1 and 1000
      and details !~ '[[:cntrl:]]'
    )
  ),
  constraint family_rights_requests_keys check (
    char_length(client_mutation_id) between 8 and 128
    and client_mutation_id ~ '^[A-Za-z0-9._:-]+$'
    and (
      decision_idempotency_key is null or (
        char_length(decision_idempotency_key) between 8 and 128
        and decision_idempotency_key ~ '^[A-Za-z0-9._:-]+$'
      )
    )
  ),
  constraint family_rights_requests_state check (
    (status = 'pending' and reviewed_by_user_id is null
      and decision_idempotency_key is null and decided_at is null)
    or (status in ('completed', 'declined') and reviewed_by_user_id is not null
      and decision_idempotency_key is not null and decided_at is not null)
  )
);

create index family_rights_requests_guardian_idx
  on public.family_rights_requests
    (tenant_id, guardian_user_id, submitted_at desc);
create index family_rights_requests_review_idx
  on public.family_rights_requests (tenant_id, status, submitted_at);

create table public.family_invitation_suggestions (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  school_id uuid not null,
  student_id uuid not null,
  teacher_user_id uuid not null references public.app_users(id) on delete restrict,
  note text,
  status public.family_invitation_suggestion_status not null default 'pending',
  client_mutation_id text not null,
  decision_idempotency_key text,
  reviewed_by_user_id uuid references public.app_users(id) on delete restrict,
  submitted_at timestamptz not null default clock_timestamp(),
  decided_at timestamptz,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, teacher_user_id, client_mutation_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, school_id)
    references public.schools (tenant_id, id)
    on update restrict on delete restrict,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete restrict,
  constraint family_invitation_suggestions_note check (
    note is null or (
      note = btrim(note) and char_length(note) between 1 and 500
      and note !~ '[[:cntrl:]]'
    )
  ),
  constraint family_invitation_suggestions_keys check (
    char_length(client_mutation_id) between 8 and 128
    and client_mutation_id ~ '^[A-Za-z0-9._:-]+$'
    and (
      decision_idempotency_key is null or (
        char_length(decision_idempotency_key) between 8 and 128
        and decision_idempotency_key ~ '^[A-Za-z0-9._:-]+$'
      )
    )
  ),
  constraint family_invitation_suggestions_state check (
    (status = 'pending' and reviewed_by_user_id is null
      and decision_idempotency_key is null and decided_at is null)
    or (status in ('reviewed', 'dismissed') and reviewed_by_user_id is not null
      and decision_idempotency_key is not null and decided_at is not null)
  )
);

create index family_invitation_suggestions_teacher_idx
  on public.family_invitation_suggestions
    (tenant_id, teacher_user_id, submitted_at desc);
create index family_invitation_suggestions_review_idx
  on public.family_invitation_suggestions
    (tenant_id, school_id, status, submitted_at);

create table public.family_support_access_requests (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  school_id uuid not null,
  thread_id uuid not null,
  requestor_user_id uuid not null references public.app_users(id) on delete restrict,
  approver_user_id uuid references public.app_users(id) on delete restrict,
  reason text not null,
  decision_note text,
  status public.family_support_access_status not null default 'pending',
  client_mutation_id text not null,
  decision_idempotency_key text,
  requested_at timestamptz not null default clock_timestamp(),
  decided_at timestamptz,
  access_expires_at timestamptz,
  retention_anchor_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, requestor_user_id, client_mutation_id),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, school_id)
    references public.schools (tenant_id, id)
    on update restrict on delete restrict,
  foreign key (tenant_id, thread_id)
    references public.family_threads (tenant_id, id)
    on update restrict on delete cascade,
  constraint family_support_access_requests_reason check (
    reason = btrim(reason) and char_length(reason) between 1 and 500
    and reason !~ '[[:cntrl:]]'
  ),
  constraint family_support_access_requests_note check (
    decision_note is null or (
      decision_note = btrim(decision_note)
      and char_length(decision_note) between 1 and 500
      and decision_note !~ '[[:cntrl:]]'
    )
  ),
  constraint family_support_access_requests_keys check (
    char_length(client_mutation_id) between 8 and 128
    and client_mutation_id ~ '^[A-Za-z0-9._:-]+$'
    and (
      decision_idempotency_key is null or (
        char_length(decision_idempotency_key) between 8 and 128
        and decision_idempotency_key ~ '^[A-Za-z0-9._:-]+$'
      )
    )
  ),
  constraint family_support_access_requests_state check (
    (status = 'pending' and approver_user_id is null
      and decision_idempotency_key is null and decided_at is null
      and access_expires_at is null)
    or (status = 'approved' and approver_user_id is not null
      and decision_idempotency_key is not null and decided_at is not null
      and access_expires_at > decided_at
      and access_expires_at <= decided_at + interval '15 minutes')
    or (status in ('denied', 'expired') and approver_user_id is not null
      and decision_idempotency_key is not null and decided_at is not null
      and access_expires_at is null)
  ),
  constraint family_support_access_separation check (
    approver_user_id is null or approver_user_id <> requestor_user_id
  )
);

create index family_support_access_requestor_idx
  on public.family_support_access_requests
    (tenant_id, requestor_user_id, requested_at desc);
create index family_support_access_review_idx
  on public.family_support_access_requests
    (tenant_id, status, requested_at);
create index family_support_access_current_idx
  on public.family_support_access_requests
    (tenant_id, requestor_user_id, thread_id, access_expires_at)
  where status = 'approved';

alter table public.family_rights_requests enable row level security;
alter table public.family_invitation_suggestions enable row level security;
alter table public.family_support_access_requests enable row level security;

revoke all on table public.family_rights_requests
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on table public.family_invitation_suggestions
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on table public.family_support_access_requests
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create trigger family_rights_requests_retention_policy
before insert or update on public.family_rights_requests
for each row execute function private.apply_family_record_retention_v2('audit_event');
create trigger family_invitation_suggestions_retention_policy
before insert or update on public.family_invitation_suggestions
for each row execute function private.apply_family_record_retention_v2('audit_event');
create trigger family_support_access_requests_retention_policy
before insert or update on public.family_support_access_requests
for each row execute function private.apply_family_record_retention_v2('audit_event');

create or replace function private.family_admin_can_access_school_v1(
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
  select public.family_has_role_v1(
    p_tenant_id, array['district_admin']::public.app_role[], null, null
  ) or public.family_has_role_v1(
    p_tenant_id, array['school_admin']::public.app_role[], p_school_id, null
  );
$$;

create or replace function private.family_guardian_link_is_current_v1(
  p_tenant_id uuid,
  p_guardian_user_id uuid,
  p_student_id uuid
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
    from public.guardian_links as link
    join public.students as student
      on student.tenant_id = link.tenant_id and student.id = link.student_id
      and student.active
    join public.schools as school
      on school.tenant_id = student.tenant_id and school.id = student.school_id
      and school.active
    where link.tenant_id = p_tenant_id
      and link.guardian_user_id = p_guardian_user_id
      and link.student_id = p_student_id
      and link.status = 'active'
      and (link.expires_at is null or link.expires_at > statement_timestamp())
      and link.lifecycle_expires_at > statement_timestamp()
      and public.family_has_role_v1(
        p_tenant_id, array['guardian']::public.app_role[], null, null
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
  );
$$;

create or replace function private.family_teacher_can_suggest_student_v1(
  p_tenant_id uuid,
  p_teacher_user_id uuid,
  p_student_id uuid
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
    from public.students as student
    join public.schools as school
      on school.tenant_id = student.tenant_id and school.id = student.school_id
      and school.active
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
    join public.class_staff_bindings as staff
      on staff.tenant_id = class_row.tenant_id
      and staff.class_id = class_row.id
      and staff.teacher_user_id = p_teacher_user_id
      and staff.active and staff.starts_at <= statement_timestamp()
      and (staff.ends_at is null or staff.ends_at > statement_timestamp())
    where student.tenant_id = p_tenant_id and student.id = p_student_id
      and student.active
      and public.family_has_role_v1(
        p_tenant_id, array['teacher']::public.app_role[], student.school_id, null
      )
  );
$$;

create or replace function public.create_family_rights_request_v1(
  p_tenant_id uuid,
  p_student_id uuid,
  p_request_kind public.family_rights_request_kind,
  p_details text,
  p_client_mutation_id text
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
  v_existing public.family_rights_requests%rowtype;
  v_request public.family_rights_requests%rowtype;
  v_details text := nullif(btrim(p_details), '');
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  if p_request_kind is null
    or (v_details is not null and (
      char_length(v_details) > 1000 or v_details ~ '[[:cntrl:]]'
    ))
  then
    raise exception using errcode = '22023', message = 'invalid family request';
  end if;
  v_actor_id := private.require_family_app_user();
  select * into v_tenant from public.tenants
  where id = p_tenant_id and status = 'active' and family_portal_enabled
    and (lifecycle_expires_at is null
      or lifecycle_expires_at > statement_timestamp())
  for share;
  if v_tenant.id is null or not private.family_guardian_link_is_current_v1(
    p_tenant_id, v_actor_id, p_student_id
  ) then
    raise exception using errcode = 'P0002', message = 'family request not found';
  end if;
  select * into v_existing from public.family_rights_requests
  where tenant_id = p_tenant_id and guardian_user_id = v_actor_id
    and client_mutation_id = p_client_mutation_id;
  if v_existing.id is not null then
    if v_existing.student_id <> p_student_id
      or v_existing.request_kind <> p_request_kind
      or v_existing.details is distinct from v_details
    then
      raise exception using errcode = '22023', message = 'idempotency key conflict';
    end if;
    return jsonb_build_object(
      'requestId', v_existing.id,
      'submittedAt', v_existing.submitted_at
    );
  end if;
  insert into public.family_rights_requests (
    tenant_id, environment_id, data_mode, guardian_user_id, student_id,
    request_kind, details, client_mutation_id, retention_anchor_at, expires_at
  ) values (
    v_tenant.id, v_tenant.environment_id, v_tenant.data_mode, v_actor_id,
    p_student_id, p_request_kind, v_details, p_client_mutation_id,
    statement_timestamp(), statement_timestamp() + interval '30 days'
  ) returning * into v_request;
  perform private.write_family_audit(
    v_tenant.id, 'inserted', 'family_rights_request', v_request.id,
    jsonb_build_object(
      'kind', p_request_kind::text, 'status', 'pending',
      'studentId', p_student_id
    )
  );
  return jsonb_build_object(
    'requestId', v_request.id, 'submittedAt', v_request.submitted_at
  );
end;
$$;

create or replace function public.review_family_rights_request_v1(
  p_tenant_id uuid,
  p_request_id uuid,
  p_status public.family_review_status,
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
  v_request public.family_rights_requests%rowtype;
  v_school_id uuid;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  if p_status not in ('completed', 'declined') then
    raise exception using errcode = '22023', message = 'invalid review status';
  end if;
  v_actor_id := private.require_family_app_user();
  select * into v_request
  from public.family_rights_requests as request_row
  where request_row.tenant_id = p_tenant_id and request_row.id = p_request_id
    and request_row.expires_at > statement_timestamp()
  for update;
  select student.school_id into v_school_id
  from public.students as student
  where student.tenant_id = p_tenant_id
    and student.id = v_request.student_id and student.active;
  if v_request.id is null
    or not private.family_admin_can_access_school_v1(p_tenant_id, v_school_id)
  then
    raise exception using errcode = 'P0002', message = 'family request not found';
  end if;
  if v_request.status <> 'pending' then
    if v_request.status = p_status
      and v_request.decision_idempotency_key = p_client_mutation_id
      and v_request.reviewed_by_user_id = v_actor_id
    then return; end if;
    raise exception using errcode = '22023', message = 'review conflict';
  end if;
  update public.family_rights_requests
  set status = p_status, reviewed_by_user_id = v_actor_id,
      decision_idempotency_key = p_client_mutation_id,
      decided_at = clock_timestamp()
  where tenant_id = p_tenant_id and id = p_request_id;
  perform private.write_family_audit(
    p_tenant_id, 'updated', 'family_rights_request', p_request_id,
    jsonb_build_object('status', p_status::text, 'studentId', v_request.student_id)
  );
end;
$$;

create or replace function public.create_family_invitation_suggestion_v1(
  p_tenant_id uuid,
  p_student_id uuid,
  p_note text,
  p_client_mutation_id text
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
  v_school_id uuid;
  v_note text := nullif(btrim(p_note), '');
  v_existing public.family_invitation_suggestions%rowtype;
  v_suggestion public.family_invitation_suggestions%rowtype;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  if v_note is not null and (
    char_length(v_note) > 500 or v_note ~ '[[:cntrl:]]'
  ) then
    raise exception using errcode = '22023', message = 'invalid suggestion note';
  end if;
  v_actor_id := private.require_family_app_user();
  select * into v_tenant from public.tenants
  where id = p_tenant_id and status = 'active' and family_portal_enabled
    and (lifecycle_expires_at is null
      or lifecycle_expires_at > statement_timestamp())
  for share;
  select school_id into v_school_id from public.students
  where tenant_id = p_tenant_id and id = p_student_id and active;
  if v_tenant.id is null or v_school_id is null
    or not private.family_teacher_can_suggest_student_v1(
      p_tenant_id, v_actor_id, p_student_id
    )
  then
    raise exception using errcode = 'P0002', message = 'student not found';
  end if;
  select * into v_existing from public.family_invitation_suggestions
  where tenant_id = p_tenant_id and teacher_user_id = v_actor_id
    and client_mutation_id = p_client_mutation_id;
  if v_existing.id is not null then
    if v_existing.student_id <> p_student_id
      or v_existing.note is distinct from v_note
    then
      raise exception using errcode = '22023', message = 'idempotency key conflict';
    end if;
    return jsonb_build_object(
      'suggestionId', v_existing.id,
      'submittedAt', v_existing.submitted_at
    );
  end if;
  insert into public.family_invitation_suggestions (
    tenant_id, environment_id, data_mode, school_id, student_id,
    teacher_user_id, note, client_mutation_id, retention_anchor_at, expires_at
  ) values (
    v_tenant.id, v_tenant.environment_id, v_tenant.data_mode, v_school_id,
    p_student_id, v_actor_id, v_note, p_client_mutation_id,
    statement_timestamp(), statement_timestamp() + interval '30 days'
  ) returning * into v_suggestion;
  perform private.write_family_audit(
    p_tenant_id, 'inserted', 'family_invitation_suggestion', v_suggestion.id,
    jsonb_build_object('status', 'pending', 'studentId', p_student_id)
  );
  return jsonb_build_object(
    'suggestionId', v_suggestion.id, 'submittedAt', v_suggestion.submitted_at
  );
end;
$$;

create or replace function public.review_family_invitation_suggestion_v1(
  p_tenant_id uuid,
  p_suggestion_id uuid,
  p_status public.family_invitation_suggestion_status,
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
  v_suggestion public.family_invitation_suggestions%rowtype;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  if p_status not in ('reviewed', 'dismissed') then
    raise exception using errcode = '22023', message = 'invalid review status';
  end if;
  v_actor_id := private.require_family_app_user();
  select * into v_suggestion from public.family_invitation_suggestions
  where tenant_id = p_tenant_id and id = p_suggestion_id
    and expires_at > statement_timestamp()
  for update;
  if v_suggestion.id is null or not private.family_admin_can_access_school_v1(
    p_tenant_id, v_suggestion.school_id
  ) then
    raise exception using errcode = 'P0002', message = 'suggestion not found';
  end if;
  if v_suggestion.status <> 'pending' then
    if v_suggestion.status = p_status
      and v_suggestion.decision_idempotency_key = p_client_mutation_id
      and v_suggestion.reviewed_by_user_id = v_actor_id
    then return; end if;
    raise exception using errcode = '22023', message = 'review conflict';
  end if;
  update public.family_invitation_suggestions
  set status = p_status, reviewed_by_user_id = v_actor_id,
      decision_idempotency_key = p_client_mutation_id,
      decided_at = clock_timestamp()
  where tenant_id = p_tenant_id and id = p_suggestion_id;
  perform private.write_family_audit(
    p_tenant_id, 'updated', 'family_invitation_suggestion', p_suggestion_id,
    jsonb_build_object('status', p_status::text, 'studentId', v_suggestion.student_id)
  );
end;
$$;

create or replace function public.create_family_support_access_request_v1(
  p_tenant_id uuid,
  p_thread_id uuid,
  p_reason text,
  p_client_mutation_id text
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
  v_thread public.family_threads%rowtype;
  v_existing public.family_support_access_requests%rowtype;
  v_request public.family_support_access_requests%rowtype;
  v_reason text := btrim(p_reason);
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  if char_length(v_reason) not between 1 and 500
    or v_reason ~ '[[:cntrl:]]'
  then
    raise exception using errcode = '22023', message = 'invalid support reason';
  end if;
  v_actor_id := private.require_family_app_user();
  select * into v_tenant from public.tenants
  where id = p_tenant_id and status = 'active' and family_portal_enabled
    and (lifecycle_expires_at is null
      or lifecycle_expires_at > statement_timestamp())
  for share;
  select * into v_thread from public.family_threads
  where tenant_id = p_tenant_id and id = p_thread_id
    and private.family_thread_is_current_v1(tenant_id, id);
  if v_tenant.id is null or v_thread.id is null
    or not private.family_admin_can_access_school_v1(
      p_tenant_id, v_thread.school_id
    )
  then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end if;
  select * into v_existing from public.family_support_access_requests
  where tenant_id = p_tenant_id and requestor_user_id = v_actor_id
    and client_mutation_id = p_client_mutation_id;
  if v_existing.id is not null then
    if v_existing.thread_id <> p_thread_id or v_existing.reason <> v_reason then
      raise exception using errcode = '22023', message = 'idempotency key conflict';
    end if;
    return jsonb_build_object(
      'requestId', v_existing.id, 'requestedAt', v_existing.requested_at
    );
  end if;
  insert into public.family_support_access_requests (
    tenant_id, environment_id, data_mode, school_id, thread_id,
    requestor_user_id, reason, client_mutation_id,
    retention_anchor_at, expires_at
  ) values (
    v_tenant.id, v_tenant.environment_id, v_tenant.data_mode,
    v_thread.school_id, v_thread.id, v_actor_id, v_reason,
    p_client_mutation_id, statement_timestamp(),
    statement_timestamp() + interval '30 days'
  ) returning * into v_request;
  perform private.write_family_audit(
    p_tenant_id, 'inserted', 'family_support_access_request', v_request.id,
    jsonb_build_object('status', 'pending', 'threadId', p_thread_id)
  );
  return jsonb_build_object(
    'requestId', v_request.id, 'requestedAt', v_request.requested_at
  );
end;
$$;

create or replace function public.decide_family_support_access_request_v1(
  p_tenant_id uuid,
  p_request_id uuid,
  p_approved boolean,
  p_decision_note text,
  p_client_mutation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_request public.family_support_access_requests%rowtype;
  v_note text := nullif(btrim(p_decision_note), '');
  v_status public.family_support_access_status;
  v_decided_at timestamptz;
  v_access_expires_at timestamptz;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  if p_approved is null or (v_note is not null and (
    char_length(v_note) > 500 or v_note ~ '[[:cntrl:]]'
  )) then
    raise exception using errcode = '22023', message = 'invalid support decision';
  end if;
  v_actor_id := private.require_family_app_user();
  select * into v_request from public.family_support_access_requests
  where tenant_id = p_tenant_id and id = p_request_id
    and expires_at > statement_timestamp()
  for update;
  if v_request.id is null
    or v_request.requestor_user_id = v_actor_id
    or not public.family_has_role_v1(
      p_tenant_id, array['district_admin']::public.app_role[], null, null
    )
  then
    raise exception using errcode = 'P0002', message = 'support request not found';
  end if;
  v_status := case when p_approved then 'approved' else 'denied' end;
  if v_request.status <> 'pending' then
    if v_request.status = v_status
      and v_request.decision_note is not distinct from v_note
      and v_request.decision_idempotency_key = p_client_mutation_id
      and v_request.approver_user_id = v_actor_id
    then
      return jsonb_build_object(
        'requestId', v_request.id, 'status', v_request.status,
        'accessExpiresAt', v_request.access_expires_at
      );
    end if;
    raise exception using errcode = '22023', message = 'support decision conflict';
  end if;
  v_decided_at := clock_timestamp();
  v_access_expires_at := case when p_approved
    then v_decided_at + interval '15 minutes' else null end;
  update public.family_support_access_requests
  set status = v_status, approver_user_id = v_actor_id,
      decision_note = v_note, decision_idempotency_key = p_client_mutation_id,
      decided_at = v_decided_at, access_expires_at = v_access_expires_at
  where tenant_id = p_tenant_id and id = p_request_id;
  perform private.write_family_audit(
    p_tenant_id, 'updated', 'family_support_access_request', p_request_id,
    jsonb_build_object('status', v_status::text, 'threadId', v_request.thread_id)
  );
  return jsonb_build_object(
    'requestId', p_request_id, 'status', v_status,
    'accessExpiresAt', v_access_expires_at
  );
end;
$$;

create or replace function public.family_governance_workspace_v1(
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
  v_requests jsonb;
  v_activity jsonb;
begin
  v_actor_id := private.require_family_app_user();
  select * into v_tenant from public.tenants
  where id = p_tenant_id and status = 'active' and family_portal_enabled
    and (lifecycle_expires_at is null
      or lifecycle_expires_at > statement_timestamp());
  if v_tenant.id is null or not public.family_has_role_v1(
    p_tenant_id, array['guardian']::public.app_role[], null, null
  ) or not exists (
    select 1 from public.guardian_links as link
    where link.tenant_id = p_tenant_id and link.guardian_user_id = v_actor_id
      and link.status = 'active'
      and (link.expires_at is null or link.expires_at > statement_timestamp())
      and link.lifecycle_expires_at > statement_timestamp()
  ) then
    raise exception using errcode = 'P0002', message = 'family workspace not found';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', row.id, 'childId', row.student_id,
    'childDisplayName', student.display_name,
    'kind', row.request_kind, 'details', row.details,
    'status', row.status, 'submittedAt', row.submitted_at,
    'decidedAt', row.decided_at
  ) order by row.submitted_at desc, row.id), '[]'::jsonb)
  into v_requests
  from (
    select * from public.family_rights_requests
    where tenant_id = p_tenant_id and guardian_user_id = v_actor_id
      and expires_at > statement_timestamp()
    order by submitted_at desc, id limit 200
  ) as row
  join public.students as student
    on student.tenant_id = row.tenant_id and student.id = row.student_id
  where private.family_guardian_link_is_current_v1(
    row.tenant_id, v_actor_id, row.student_id
  );
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', event.id, 'action', event.action,
    'entityType', event.entity_type, 'occurredAt', event.occurred_at
  ) order by event.occurred_at desc, event.id), '[]'::jsonb)
  into v_activity
  from (
    select * from public.audit_events
    where tenant_id = p_tenant_id and actor_user_id = v_actor_id
      and expires_at > statement_timestamp()
      and entity_type in (
        'family_rights_request', 'family_messages', 'family_threads',
        'family_notification_preferences', 'guardian_links',
        'guardian_invitations'
      )
    order by occurred_at desc, id limit 50
  ) as event;
  return jsonb_build_object(
    'tenant', jsonb_build_object('id', v_tenant.id,
      'displayName', v_tenant.display_name),
    'rightsRequests', v_requests, 'accountActivity', v_activity
  );
end;
$$;

create or replace function public.teacher_invitation_suggestion_workspace_v1(
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
  v_children jsonb;
  v_suggestions jsonb;
begin
  v_actor_id := private.require_family_app_user();
  select * into v_tenant from public.tenants
  where id = p_tenant_id and status = 'active' and family_portal_enabled
    and (lifecycle_expires_at is null
      or lifecycle_expires_at > statement_timestamp());
  if v_tenant.id is null or not public.family_has_role_v1(
    p_tenant_id, array['teacher']::public.app_role[], null, null
  ) then
    raise exception using errcode = 'P0002', message = 'teacher workspace not found';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', child.id, 'displayName', child.display_name,
    'gradeLabel', child.grade_label, 'schoolName', child.school_name
  ) order by child.display_name, child.id), '[]'::jsonb)
  into v_children
  from (
    select distinct student.id, student.display_name, student.grade_label,
      school.display_name as school_name
    from public.students as student
    join public.schools as school
      on school.tenant_id = student.tenant_id and school.id = student.school_id
      and school.active
    where student.tenant_id = p_tenant_id and student.active
      and private.family_teacher_can_suggest_student_v1(
        p_tenant_id, v_actor_id, student.id
      )
    order by student.display_name, student.id limit 500
  ) as child;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', suggestion.id, 'childId', suggestion.student_id,
    'childDisplayName', student.display_name, 'note', suggestion.note,
    'status', suggestion.status, 'submittedAt', suggestion.submitted_at,
    'decidedAt', suggestion.decided_at
  ) order by suggestion.submitted_at desc, suggestion.id), '[]'::jsonb)
  into v_suggestions
  from (
    select * from public.family_invitation_suggestions
    where tenant_id = p_tenant_id and teacher_user_id = v_actor_id
      and expires_at > statement_timestamp()
    order by submitted_at desc, id limit 200
  ) as suggestion
  join public.students as student
    on student.tenant_id = suggestion.tenant_id
    and student.id = suggestion.student_id;
  return jsonb_build_object(
    'tenant', jsonb_build_object('id', v_tenant.id,
      'displayName', v_tenant.display_name),
    'eligibleChildren', v_children, 'suggestions', v_suggestions
  );
end;
$$;

create or replace function public.admin_family_operations_workspace_v1(
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
  v_rights jsonb;
  v_suggestions jsonb;
  v_support jsonb;
begin
  v_actor_id := private.require_family_app_user();
  select * into v_tenant from public.tenants
  where id = p_tenant_id and status = 'active' and family_portal_enabled
    and (lifecycle_expires_at is null
      or lifecycle_expires_at > statement_timestamp());
  if v_tenant.id is null or not public.family_has_role_v1(
    p_tenant_id,
    array['school_admin', 'district_admin']::public.app_role[], null, null
  ) then
    raise exception using errcode = 'P0002', message = 'operations workspace not found';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', request_row.id, 'childId', request_row.student_id,
    'childDisplayName', student.display_name,
    'guardianLabel', guardian.display_name,
    'kind', request_row.request_kind, 'details', request_row.details,
    'status', request_row.status, 'submittedAt', request_row.submitted_at,
    'decidedAt', request_row.decided_at
  ) order by request_row.submitted_at desc, request_row.id), '[]'::jsonb)
  into v_rights
  from (
    select * from public.family_rights_requests
    where tenant_id = p_tenant_id and expires_at > statement_timestamp()
    order by submitted_at desc, id limit 500
  ) as request_row
  join public.students as student
    on student.tenant_id = request_row.tenant_id
    and student.id = request_row.student_id
  join public.app_users as guardian on guardian.id = request_row.guardian_user_id
  where private.family_admin_can_access_school_v1(
    p_tenant_id, student.school_id
  );
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', suggestion.id, 'childId', suggestion.student_id,
    'childDisplayName', student.display_name,
    'teacherLabel', teacher.display_name, 'note', suggestion.note,
    'status', suggestion.status, 'submittedAt', suggestion.submitted_at,
    'decidedAt', suggestion.decided_at
  ) order by suggestion.submitted_at desc, suggestion.id), '[]'::jsonb)
  into v_suggestions
  from (
    select * from public.family_invitation_suggestions
    where tenant_id = p_tenant_id and expires_at > statement_timestamp()
    order by submitted_at desc, id limit 500
  ) as suggestion
  join public.students as student
    on student.tenant_id = suggestion.tenant_id
    and student.id = suggestion.student_id
  join public.app_users as teacher on teacher.id = suggestion.teacher_user_id
  where private.family_admin_can_access_school_v1(
    p_tenant_id, suggestion.school_id
  );
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', support.id, 'threadId', support.thread_id,
    'requestorLabel', requestor.display_name,
    'reason', support.reason, 'decisionNote', support.decision_note,
    'canAccess', support.requestor_user_id = v_actor_id
      and support.status = 'approved'
      and support.access_expires_at > statement_timestamp(),
    'status', case when support.status = 'approved'
      and support.access_expires_at <= statement_timestamp()
      then 'expired' else support.status::text end,
    'requestedAt', support.requested_at, 'decidedAt', support.decided_at,
    'accessExpiresAt', support.access_expires_at
  ) order by support.requested_at desc, support.id), '[]'::jsonb)
  into v_support
  from (
    select * from public.family_support_access_requests
    where tenant_id = p_tenant_id and expires_at > statement_timestamp()
    order by requested_at desc, id limit 500
  ) as support
  join public.app_users as requestor on requestor.id = support.requestor_user_id
  where (support.requestor_user_id = v_actor_id
    or public.family_has_role_v1(
      p_tenant_id, array['district_admin']::public.app_role[], null, null
    )) and private.family_admin_can_access_school_v1(
      p_tenant_id, support.school_id
    );
  return jsonb_build_object(
    'tenant', jsonb_build_object('id', v_tenant.id,
      'displayName', v_tenant.display_name),
    'rightsRequests', v_rights,
    'invitationSuggestions', v_suggestions,
    'supportRequests', v_support
  );
end;
$$;

create or replace function public.family_support_case_v1(
  p_tenant_id uuid,
  p_request_id uuid
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
  v_request public.family_support_access_requests%rowtype;
  v_thread public.family_threads%rowtype;
  v_child_label text;
  v_guardian_label text;
  v_staff_label text;
  v_tenant_display_name text;
  v_messages jsonb;
begin
  v_actor_id := private.require_family_app_user();
  select tenant.display_name into v_tenant_display_name
  from public.tenants as tenant
  where tenant.id = p_tenant_id and tenant.status = 'active'
    and tenant.family_portal_enabled
    and tenant.lifecycle_expires_at > statement_timestamp();
  select * into v_request from public.family_support_access_requests
  where tenant_id = p_tenant_id and id = p_request_id
    and requestor_user_id = v_actor_id and status = 'approved'
    and access_expires_at > statement_timestamp()
    and expires_at > statement_timestamp();
  if v_request.id is null
    or not private.family_admin_can_access_school_v1(
      p_tenant_id, v_request.school_id
    )
  then
    raise exception using errcode = 'P0002', message = 'support case not found';
  end if;
  select * into v_thread from public.family_threads as thread_row
  where thread_row.tenant_id = p_tenant_id
    and thread_row.id = v_request.thread_id
    and private.family_thread_is_current_v1(thread_row.tenant_id, thread_row.id);
  if v_thread.id is null then
    raise exception using errcode = 'P0002', message = 'support case not found';
  end if;
  select student.display_name, guardian.display_name, staff.display_name
  into v_child_label, v_guardian_label, v_staff_label
  from public.students as student
  join public.app_users as guardian on guardian.id = v_thread.guardian_user_id
  join public.app_users as staff on staff.id = v_thread.staff_user_id
  where student.tenant_id = v_thread.tenant_id
    and student.id = v_thread.child_id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', message.id, 'body', message.body,
    'redacted', message.redacted_at is not null,
    'senderLabel', sender.display_name, 'sentAt', message.created_at
  ) order by message.created_at, message.id), '[]'::jsonb)
  into v_messages
  from (
    select * from public.family_messages
    where tenant_id = p_tenant_id and thread_id = v_thread.id
      and expires_at > statement_timestamp()
    order by created_at desc, id desc limit 200
  ) as message
  join public.app_users as sender on sender.id = message.sender_user_id;
  return jsonb_build_object(
    'tenantId', p_tenant_id,
    'tenantDisplayName', v_tenant_display_name,
    'request', jsonb_build_object(
      'id', v_request.id, 'reason', v_request.reason,
      'accessExpiresAt', v_request.access_expires_at
    ),
    'thread', jsonb_build_object(
      'id', v_thread.id, 'childLabel', v_child_label,
      'guardianLabel', v_guardian_label, 'staffLabel', v_staff_label,
      'status', v_thread.status, 'topic', v_thread.topic,
      'messages', v_messages
    )
  );
end;
$$;

-- The earlier administrator redaction function remains the hardened mutation
-- core, but browser callers now require one current approved support grant.
alter function public.redact_family_message_v1(uuid, text, text)
  rename to redact_family_message_governance_core_v1;
revoke all on function public.redact_family_message_governance_core_v1(
  uuid, text, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;

create or replace function public.redact_family_message_v1(
  p_message_id uuid,
  p_reason text,
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
  v_message public.family_messages%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  v_actor_id := private.require_family_app_user();
  select * into v_message from public.family_messages
  where id = p_message_id and expires_at > statement_timestamp();
  if v_message.id is null or not exists (
    select 1 from public.family_support_access_requests as support
    where support.tenant_id = v_message.tenant_id
      and support.thread_id = v_message.thread_id
      and support.requestor_user_id = v_actor_id
      and support.status = 'approved'
      and support.access_expires_at > statement_timestamp()
      and support.expires_at > statement_timestamp()
  ) then
    raise exception using errcode = 'P0002', message = 'message not found';
  end if;
  perform public.redact_family_message_governance_core_v1(
    p_message_id, p_reason, p_idempotency_key
  );
end;
$$;

create or replace function public.decline_guardian_invitation_v1(
  p_token_digest text,
  p_verified_email_digest text,
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
  v_invitation public.guardian_invitations%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if p_token_digest !~ '^[0-9a-f]{64}$'
    or p_verified_email_digest !~ '^[0-9a-f]{64}$'
  then return; end if;
  v_actor_id := private.require_family_app_user();
  select * into v_invitation from public.guardian_invitations
  where token_digest = p_token_digest for update;
  if v_invitation.id is null
    or v_invitation.recipient_email_digest <> p_verified_email_digest
  then return; end if;
  if v_invitation.status = 'revoked'
    and v_invitation.revocation_idempotency_key = p_idempotency_key
    and v_invitation.revoked_by_user_id = v_actor_id
  then return; end if;
  if v_invitation.status <> 'pending'
    or v_invitation.expires_at <= statement_timestamp()
  then return; end if;
  update public.guardian_invitations
  set status = 'revoked', revoked_at = clock_timestamp(),
      revoked_by_user_id = v_actor_id,
      revocation_idempotency_key = p_idempotency_key,
      updated_at = clock_timestamp()
  where tenant_id = v_invitation.tenant_id and id = v_invitation.id;
  update public.notification_outbox
  set status = 'cancelled', claimed_at = null, claim_token = null,
      claim_expires_at = null
  where tenant_id = v_invitation.tenant_id
    and kind = 'guardian_invitation'
    and aggregate_id = v_invitation.id and status = 'pending';
end;
$$;

alter function public.run_family_retention_v1(integer)
  rename to run_family_retention_pre_governance_v1;
revoke all on function public.run_family_retention_pre_governance_v1(integer)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.run_family_retention_v1(
  p_batch_size integer default 1000
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_previous jsonb;
  v_run jsonb;
  v_runs jsonb := '[]'::jsonb;
  v_tenant_id uuid;
  v_run_id uuid;
  v_counts jsonb;
  v_rights integer;
  v_suggestions integer;
  v_support integer;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_batch_size not between 1 and 10000 then
    raise exception using errcode = '22023', message = 'retention batch out of range';
  end if;
  v_previous := public.run_family_retention_pre_governance_v1(p_batch_size);
  if jsonb_typeof(v_previous -> 'runs') <> 'array' then
    raise exception using errcode = 'XX000', message = 'invalid retention receipt';
  end if;
  perform set_config('help_math.family_retention', 'on', true);
  for v_run in select value from jsonb_array_elements(v_previous -> 'runs')
  loop
    v_tenant_id := (v_run ->> 'tenantId')::uuid;
    v_run_id := (v_run ->> 'runId')::uuid;
    with removed as (
      delete from public.family_rights_requests where (tenant_id, id) in (
        select tenant_id, id from public.family_rights_requests
        where tenant_id = v_tenant_id and expires_at <= statement_timestamp()
        order by expires_at, id limit p_batch_size for update skip locked
      ) returning 1
    ) select count(*)::integer into v_rights from removed;
    with removed as (
      delete from public.family_invitation_suggestions where (tenant_id, id) in (
        select tenant_id, id from public.family_invitation_suggestions
        where tenant_id = v_tenant_id and expires_at <= statement_timestamp()
        order by expires_at, id limit p_batch_size for update skip locked
      ) returning 1
    ) select count(*)::integer into v_suggestions from removed;
    with removed as (
      delete from public.family_support_access_requests where (tenant_id, id) in (
        select tenant_id, id from public.family_support_access_requests
        where tenant_id = v_tenant_id and expires_at <= statement_timestamp()
        order by expires_at, id limit p_batch_size for update skip locked
      ) returning 1
    ) select count(*)::integer into v_support from removed;
    v_counts := coalesce(v_run -> 'deletedCounts', '{}'::jsonb)
      || jsonb_build_object(
        'familyRightsRequests', v_rights,
        'familyInvitationSuggestions', v_suggestions,
        'familySupportAccessRequests', v_support
      );
    update public.retention_runs set deleted_counts = v_counts
    where tenant_id = v_tenant_id and id = v_run_id;
    v_runs := v_runs || jsonb_build_array(
      v_run || jsonb_build_object('deletedCounts', v_counts)
    );
  end loop;
  return jsonb_build_object('runs', v_runs);
end;
$$;

revoke all on function private.family_admin_can_access_school_v1(uuid, uuid)
  from public;
revoke all on function private.family_guardian_link_is_current_v1(uuid, uuid, uuid)
  from public;
revoke all on function private.family_teacher_can_suggest_student_v1(uuid, uuid, uuid)
  from public;

revoke all on function public.create_family_rights_request_v1(
  uuid, uuid, public.family_rights_request_kind, text, text
) from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.review_family_rights_request_v1(
  uuid, uuid, public.family_review_status, text
) from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.create_family_invitation_suggestion_v1(
  uuid, uuid, text, text
) from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.review_family_invitation_suggestion_v1(
  uuid, uuid, public.family_invitation_suggestion_status, text
) from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.create_family_support_access_request_v1(
  uuid, uuid, text, text
) from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.decide_family_support_access_request_v1(
  uuid, uuid, boolean, text, text
) from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.family_governance_workspace_v1(uuid)
  from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.teacher_invitation_suggestion_workspace_v1(uuid)
  from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.admin_family_operations_workspace_v1(uuid)
  from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.family_support_case_v1(uuid, uuid)
  from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.redact_family_message_v1(uuid, text, text)
  from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.decline_guardian_invitation_v1(text, text, text)
  from public, anon, service_role, family_invitation_issuer, family_webhook_writer;
revoke all on function public.run_family_retention_v1(integer)
  from public, anon, authenticated, family_invitation_issuer, family_webhook_writer;

grant execute on function public.create_family_rights_request_v1(
  uuid, uuid, public.family_rights_request_kind, text, text
) to authenticated;
grant execute on function public.review_family_rights_request_v1(
  uuid, uuid, public.family_review_status, text
) to authenticated;
grant execute on function public.create_family_invitation_suggestion_v1(
  uuid, uuid, text, text
) to authenticated;
grant execute on function public.review_family_invitation_suggestion_v1(
  uuid, uuid, public.family_invitation_suggestion_status, text
) to authenticated;
grant execute on function public.create_family_support_access_request_v1(
  uuid, uuid, text, text
) to authenticated;
grant execute on function public.decide_family_support_access_request_v1(
  uuid, uuid, boolean, text, text
) to authenticated;
grant execute on function public.family_governance_workspace_v1(uuid)
  to authenticated;
grant execute on function public.teacher_invitation_suggestion_workspace_v1(uuid)
  to authenticated;
grant execute on function public.admin_family_operations_workspace_v1(uuid)
  to authenticated;
grant execute on function public.family_support_case_v1(uuid, uuid)
  to authenticated;
grant execute on function public.redact_family_message_v1(uuid, text, text)
  to authenticated;
grant execute on function public.decline_guardian_invitation_v1(text, text, text)
  to authenticated;
grant execute on function public.run_family_retention_v1(integer)
  to service_role;

comment on function public.family_support_case_v1(uuid, uuid) is
  'Reads one exact family message thread only for the active requestor of a separately approved, audited support grant that expires within fifteen minutes.';
comment on function public.family_governance_workspace_v1(uuid) is
  'Guardian-only safe request history and account activity summary for one explicitly selected tenant; no provider identity or raw audit context is returned.';
comment on table public.family_support_access_requests is
  'Audited, time-limited, exact-thread support access. School administrators have no default message directory and cannot self-approve.';

commit;
