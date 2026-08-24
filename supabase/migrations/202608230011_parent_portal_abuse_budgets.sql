-- HELP Math family portal: database-enforced abuse budgets for invitations
-- and family messaging.
--
-- These controls are a bounded product/database layer. Unknown random
-- invitation-token probes cannot be associated with a tenant or invitation
-- without retaining another secret-derived identifier, so they deliberately
-- do not consume the per-invitation counter below. Volumetric edge, WAF, and
-- authenticated-session aggregate limits remain a separate release gate.

begin;

create type public.family_abuse_budget_operation as enum (
  'invitation_create_hour',
  'invitation_create_day',
  'invitation_resend_hour',
  'invitation_resend_day',
  'family_message_ten_minute',
  'family_message_day'
);

create type public.family_message_request_mode as enum (
  'legacy',
  'new_thread',
  'existing_thread'
);

create or replace function private.family_message_request_mode_v1()
returns public.family_message_request_mode
language sql
stable
set search_path = pg_catalog, public
as $$
  select case current_setting(
    'app.family_message_request_mode', true
  )
    when 'new_thread' then 'new_thread'::public.family_message_request_mode
    when 'existing_thread' then
      'existing_thread'::public.family_message_request_mode
    else 'legacy'::public.family_message_request_mode
  end;
$$;

alter table public.family_messages
  add column request_mode public.family_message_request_mode
    not null default private.family_message_request_mode_v1();

create table public.family_abuse_budget_windows (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  operation public.family_abuse_budget_operation not null,
  actor_user_id uuid not null
    references public.app_users(id) on delete cascade,
  student_id uuid,
  invitation_id uuid,
  thread_id uuid,
  window_started_at timestamptz not null,
  request_count smallint not null,
  retention_anchor_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, id),
  unique (id),
  constraint family_abuse_budget_windows_one_bucket
    unique nulls not distinct (
      tenant_id, operation, actor_user_id, student_id, invitation_id,
      thread_id, window_started_at
    ),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete cascade,
  foreign key (tenant_id, invitation_id)
    references public.guardian_invitations (tenant_id, id)
    on update restrict on delete cascade,
  foreign key (tenant_id, thread_id)
    references public.family_threads (tenant_id, id)
    on update restrict on delete cascade,
  constraint family_abuse_budget_windows_resource check (
    (
      operation in ('invitation_create_hour', 'invitation_create_day')
      and student_id is not null
      and invitation_id is null
      and thread_id is null
    ) or (
      operation in ('invitation_resend_hour', 'invitation_resend_day')
      and student_id is null
      and invitation_id is not null
      and thread_id is null
    ) or (
      operation in ('family_message_ten_minute', 'family_message_day')
      and student_id is null
      and invitation_id is null
      and thread_id is not null
    )
  ),
  constraint family_abuse_budget_windows_count check (
    request_count between 1 and case operation
      when 'invitation_create_hour' then 5
      when 'invitation_create_day' then 20
      when 'invitation_resend_hour' then 3
      when 'invitation_resend_day' then 10
      when 'family_message_ten_minute' then 20
      when 'family_message_day' then 100
    end
  ),
  constraint family_abuse_budget_windows_retention check (
    retention_anchor_at = window_started_at
    and expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '2 days'
  )
);

create index family_abuse_budget_windows_expiry_idx
  on public.family_abuse_budget_windows (expires_at, tenant_id, id);

alter table public.family_abuse_budget_windows enable row level security;

alter table public.guardian_invitations
  add column failed_accept_attempts smallint not null default 0,
  add column accept_locked_at timestamptz,
  add constraint guardian_invitations_accept_attempts check (
    failed_accept_attempts between 0 and 10
    and (
      (failed_accept_attempts < 10 and accept_locked_at is null)
      or (failed_accept_attempts = 10 and accept_locked_at is not null)
    )
  );

alter table public.family_invitation_issuance_attestations
  add column abuse_budget_charged_at timestamptz;

create or replace function private.family_abuse_budget_limit_v1(
  p_operation public.family_abuse_budget_operation
)
returns integer
language sql
immutable
set search_path = pg_catalog
as $$
  select case p_operation
    when 'invitation_create_hour' then 5
    when 'invitation_create_day' then 20
    when 'invitation_resend_hour' then 3
    when 'invitation_resend_day' then 10
    when 'family_message_ten_minute' then 20
    when 'family_message_day' then 100
  end;
$$;

create or replace function private.family_abuse_budget_window_seconds_v1(
  p_operation public.family_abuse_budget_operation
)
returns integer
language sql
immutable
set search_path = pg_catalog
as $$
  select case p_operation
    when 'invitation_create_hour' then 3600
    when 'invitation_create_day' then 86400
    when 'invitation_resend_hour' then 3600
    when 'invitation_resend_day' then 86400
    when 'family_message_ten_minute' then 600
    when 'family_message_day' then 86400
  end;
$$;

create or replace function private.consume_family_abuse_budget_v1(
  p_operation public.family_abuse_budget_operation,
  p_tenant_id uuid,
  p_actor_user_id uuid,
  p_resource_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_tenant public.tenants%rowtype;
  v_limit integer;
  v_window_seconds integer;
  v_window_started_at timestamptz;
  v_count integer;
begin
  if p_actor_user_id is null or p_resource_id is null then
    raise exception using errcode = '22023',
      message = 'abuse budget identity required';
  end if;
  select * into v_tenant
  from public.tenants
  where id = p_tenant_id;
  if v_tenant.id is null then
    raise exception using errcode = 'P0002', message = 'tenant not found';
  end if;

  v_limit := private.family_abuse_budget_limit_v1(p_operation);
  v_window_seconds :=
    private.family_abuse_budget_window_seconds_v1(p_operation);
  if v_limit is null or v_window_seconds is null then
    raise exception using errcode = '22023',
      message = 'unsupported abuse budget operation';
  end if;
  v_window_started_at := to_timestamp(
    floor(extract(epoch from statement_timestamp()) / v_window_seconds)
      * v_window_seconds
  );

  if p_operation in ('invitation_create_hour', 'invitation_create_day') then
    if not exists (
      select 1 from public.students as student
      where student.tenant_id = v_tenant.id
        and student.id = p_resource_id
        and student.environment_id = v_tenant.environment_id
        and student.data_mode = v_tenant.data_mode
    ) then
      raise exception using errcode = 'P0002',
        message = 'abuse budget resource not found';
    end if;
    insert into public.family_abuse_budget_windows (
      tenant_id, environment_id, data_mode, operation, actor_user_id,
      student_id, window_started_at, request_count,
      retention_anchor_at, expires_at
    ) values (
      v_tenant.id, v_tenant.environment_id, v_tenant.data_mode,
      p_operation, p_actor_user_id, p_resource_id,
      v_window_started_at, 1, v_window_started_at,
      v_window_started_at + make_interval(secs => v_window_seconds)
        + interval '1 day'
    )
    on conflict on constraint family_abuse_budget_windows_one_bucket
    do update set
      request_count = family_abuse_budget_windows.request_count + 1,
      updated_at = clock_timestamp()
    where family_abuse_budget_windows.request_count < v_limit
    returning request_count into v_count;
  elsif p_operation in ('invitation_resend_hour', 'invitation_resend_day') then
    if not exists (
      select 1 from public.guardian_invitations as invitation
      where invitation.tenant_id = v_tenant.id
        and invitation.id = p_resource_id
        and invitation.environment_id = v_tenant.environment_id
        and invitation.data_mode = v_tenant.data_mode
    ) then
      raise exception using errcode = 'P0002',
        message = 'abuse budget resource not found';
    end if;
    insert into public.family_abuse_budget_windows (
      tenant_id, environment_id, data_mode, operation, actor_user_id,
      invitation_id, window_started_at, request_count,
      retention_anchor_at, expires_at
    ) values (
      v_tenant.id, v_tenant.environment_id, v_tenant.data_mode,
      p_operation, p_actor_user_id, p_resource_id,
      v_window_started_at, 1, v_window_started_at,
      v_window_started_at + make_interval(secs => v_window_seconds)
        + interval '1 day'
    )
    on conflict on constraint family_abuse_budget_windows_one_bucket
    do update set
      request_count = family_abuse_budget_windows.request_count + 1,
      updated_at = clock_timestamp()
    where family_abuse_budget_windows.request_count < v_limit
    returning request_count into v_count;
  else
    if not exists (
      select 1 from public.family_threads as thread
      where thread.tenant_id = v_tenant.id
        and thread.id = p_resource_id
        and thread.environment_id = v_tenant.environment_id
        and thread.data_mode = v_tenant.data_mode
    ) then
      raise exception using errcode = 'P0002',
        message = 'abuse budget resource not found';
    end if;
    insert into public.family_abuse_budget_windows (
      tenant_id, environment_id, data_mode, operation, actor_user_id,
      thread_id, window_started_at, request_count,
      retention_anchor_at, expires_at
    ) values (
      v_tenant.id, v_tenant.environment_id, v_tenant.data_mode,
      p_operation, p_actor_user_id, p_resource_id,
      v_window_started_at, 1, v_window_started_at,
      v_window_started_at + make_interval(secs => v_window_seconds)
        + interval '1 day'
    )
    on conflict on constraint family_abuse_budget_windows_one_bucket
    do update set
      request_count = family_abuse_budget_windows.request_count + 1,
      updated_at = clock_timestamp()
    where family_abuse_budget_windows.request_count < v_limit
    returning request_count into v_count;
  end if;

  return v_count is not null;
end;
$$;

create or replace function private.audit_family_abuse_budget_window_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_row public.family_abuse_budget_windows%rowtype;
  v_action public.audit_action;
  v_resource_kind text;
begin
  if current_setting('help_math.family_retention', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    v_row := old;
    v_action := 'deleted';
  elsif tg_op = 'INSERT' then
    v_row := new;
    v_action := 'inserted';
  else
    v_row := new;
    v_action := 'updated';
  end if;
  v_resource_kind := case
    when v_row.student_id is not null then 'student'
    when v_row.invitation_id is not null then 'invitation'
    else 'thread'
  end;
  perform private.write_family_audit(
    v_row.tenant_id,
    v_action,
    'family_abuse_budget_windows',
    v_row.id,
    jsonb_build_object(
      'operation', v_row.operation,
      'requestCount', v_row.request_count,
      'limitValue', private.family_abuse_budget_limit_v1(v_row.operation),
      'windowSeconds',
        private.family_abuse_budget_window_seconds_v1(v_row.operation),
      'resourceKind', v_resource_kind
    )
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger family_abuse_budget_windows_audit
after insert or update or delete on public.family_abuse_budget_windows
for each row execute function private.audit_family_abuse_budget_window_v1();

create or replace function private.cleanup_family_abuse_budgets_v1(
  p_tenant_id uuid,
  p_batch_size integer
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
declare
  v_count integer;
begin
  if p_batch_size not between 1 and 10000 then
    raise exception using errcode = '22023',
      message = 'retention batch out of range';
  end if;
  delete from public.family_abuse_budget_windows as budget
  where budget.ctid in (
    select candidate.ctid
    from public.family_abuse_budget_windows as candidate
    where candidate.tenant_id = p_tenant_id
      and candidate.expires_at <= statement_timestamp()
    order by candidate.expires_at, candidate.id
    limit p_batch_size
    for update skip locked
  );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Serialize a client idempotency key before the legacy authorization body can
-- race its unique attestation insert. The renamed functions stay owner-only;
-- request roles can reach only the budgeted wrappers below.
alter function public.authorize_guardian_invitation_creation_v1(
  uuid, text, text
) rename to authorize_guardian_invitation_creation_unbudgeted_core_v1;

alter function public.authorize_guardian_invitation_resend_v1(
  uuid, text
) rename to authorize_guardian_invitation_resend_unbudgeted_core_v1;

revoke all on function
  public.authorize_guardian_invitation_creation_unbudgeted_core_v1(
    uuid, text, text
  ) from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function
  public.authorize_guardian_invitation_resend_unbudgeted_core_v1(
    uuid, text
  ) from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.authorize_guardian_invitation_creation_v1(
  p_student_id uuid,
  p_email_digest text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_user_id uuid;
  v_actor_issuer text := private.jwt_claim('iss');
  v_actor_subject text := private.jwt_claim('sub');
  v_receipt jsonb;
  v_attestation_id uuid;
  v_invitation_id uuid;
  v_tenant_id uuid;
  v_attestation public.family_invitation_issuance_attestations%rowtype;
  v_invitation public.guardian_invitations%rowtype;
  v_student public.students%rowtype;
  v_already_issued boolean := false;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  v_actor_user_id := private.require_family_app_user();
  perform pg_advisory_xact_lock(hashtextextended(
    'family-invitation-create' || chr(31) || v_actor_user_id::text
      || chr(31) || p_idempotency_key,
    73295641
  ));

  -- The 008 core generates a candidate invitation UUID before loading an
  -- existing unconsumed attestation. Without this outer exact-replay branch,
  -- a retry would compare that new UUID with the persisted one and conflict.
  -- Recheck the same current admin lifecycle before returning the original
  -- resource-bound receipt; the advisory lock serializes this with issuance.
  select * into v_student
  from public.students
  where id = p_student_id;
  if v_student.id is null
    or not private.family_invitation_admin_is_current_v1(
      v_student.tenant_id, v_student.id, v_actor_user_id,
      v_actor_issuer, v_actor_subject
    )
  then
    raise exception using errcode = 'P0002', message = 'student not found';
  end if;
  select * into v_attestation
  from public.family_invitation_issuance_attestations
  where tenant_id = v_student.tenant_id
    and actor_user_id = v_actor_user_id
    and operation = 'create'
    and idempotency_key = p_idempotency_key
  for update;
  if v_attestation.id is not null then
    if v_attestation.student_id <> v_student.id
      or v_attestation.recipient_email_digest <> p_email_digest
      or v_attestation.actor_issuer <> v_actor_issuer
      or v_attestation.actor_subject <> v_actor_subject
    then
      raise exception using errcode = '22023',
        message = 'idempotency key conflict';
    end if;
    if v_attestation.consumed_at is null then
      update public.family_invitation_issuance_attestations
      set issued_at = statement_timestamp(),
          expires_at = statement_timestamp() + interval '90 seconds'
      where tenant_id = v_attestation.tenant_id and id = v_attestation.id
      returning * into v_attestation;
    end if;
    v_receipt := jsonb_build_object(
      'attestationId', v_attestation.id,
      'expiresAt', v_attestation.expires_at,
      'invitationId', v_attestation.invitation_id,
      'tenantId', v_attestation.tenant_id
    );
  else
    v_receipt :=
      public.authorize_guardian_invitation_creation_unbudgeted_core_v1(
        p_student_id, p_email_digest, p_idempotency_key
      );
  end if;
  begin
    if jsonb_typeof(v_receipt) <> 'object'
      or array(select jsonb_object_keys(v_receipt) order by 1) is distinct from
        array['attestationId', 'expiresAt', 'invitationId', 'tenantId']::text[]
    then
      raise exception 'invalid receipt';
    end if;
    v_attestation_id := (v_receipt ->> 'attestationId')::uuid;
    v_invitation_id := (v_receipt ->> 'invitationId')::uuid;
    v_tenant_id := (v_receipt ->> 'tenantId')::uuid;
    perform (v_receipt ->> 'expiresAt')::timestamptz;
  exception when others then
    raise exception using errcode = 'XX000',
      message = 'invalid invitation authorization receipt';
  end;

  select * into strict v_attestation
  from public.family_invitation_issuance_attestations
  where tenant_id = v_tenant_id and id = v_attestation_id
  for update;
  if v_attestation.operation <> 'create'
    or v_attestation.actor_user_id <> v_actor_user_id
    or v_attestation.student_id <> p_student_id
    or v_attestation.invitation_id <> v_invitation_id
    or v_attestation.recipient_email_digest <> p_email_digest
    or v_attestation.idempotency_key <> p_idempotency_key
  then
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  end if;

  select * into v_invitation
  from public.guardian_invitations
  where tenant_id = v_attestation.tenant_id
    and id = v_attestation.invitation_id;
  if v_invitation.id is not null then
    if v_invitation.student_id <> p_student_id
      or v_invitation.invited_by_user_id <> v_actor_user_id
      or v_invitation.recipient_email_digest <> p_email_digest
      or v_invitation.create_idempotency_key <> p_idempotency_key
    then
      raise exception using errcode = '22023',
        message = 'idempotency key conflict';
    end if;
    v_already_issued := true;
  elsif v_attestation.abuse_budget_charged_at is null then
    if not private.consume_family_abuse_budget_v1(
      'invitation_create_hour', v_attestation.tenant_id,
      v_actor_user_id, p_student_id
    ) or not private.consume_family_abuse_budget_v1(
      'invitation_create_day', v_attestation.tenant_id,
      v_actor_user_id, p_student_id
    ) then
      raise exception using errcode = '42501',
        message = 'invitation request unavailable';
    end if;
    update public.family_invitation_issuance_attestations
    set abuse_budget_charged_at = clock_timestamp()
    where tenant_id = v_attestation.tenant_id and id = v_attestation.id;
  end if;

  return v_receipt || jsonb_build_object(
    'alreadyIssued', v_already_issued,
    'invitationExpiresAt', case
      when v_already_issued then v_invitation.expires_at
      else null
    end
  );
end;
$$;

create or replace function public.authorize_guardian_invitation_resend_v1(
  p_invitation_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_user_id uuid;
  v_receipt jsonb;
  v_attestation_id uuid;
  v_receipt_invitation_id uuid;
  v_tenant_id uuid;
  v_attestation public.family_invitation_issuance_attestations%rowtype;
  v_invitation public.guardian_invitations%rowtype;
  v_already_issued boolean := false;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  v_actor_user_id := private.require_family_app_user();
  perform pg_advisory_xact_lock(hashtextextended(
    'family-invitation-resend' || chr(31) || v_actor_user_id::text
      || chr(31) || p_idempotency_key,
    73295642
  ));

  v_receipt :=
    public.authorize_guardian_invitation_resend_unbudgeted_core_v1(
      p_invitation_id, p_idempotency_key
    );
  begin
    if jsonb_typeof(v_receipt) <> 'object'
      or array(select jsonb_object_keys(v_receipt) order by 1) is distinct from
        array['attestationId', 'expiresAt', 'invitationId', 'tenantId']::text[]
    then
      raise exception 'invalid receipt';
    end if;
    v_attestation_id := (v_receipt ->> 'attestationId')::uuid;
    v_receipt_invitation_id := (v_receipt ->> 'invitationId')::uuid;
    v_tenant_id := (v_receipt ->> 'tenantId')::uuid;
    perform (v_receipt ->> 'expiresAt')::timestamptz;
  exception when others then
    raise exception using errcode = 'XX000',
      message = 'invalid invitation authorization receipt';
  end;

  select * into strict v_attestation
  from public.family_invitation_issuance_attestations
  where tenant_id = v_tenant_id and id = v_attestation_id
  for update;
  if v_attestation.operation <> 'resend'
    or v_attestation.actor_user_id <> v_actor_user_id
    or v_attestation.invitation_id <> p_invitation_id
    or v_receipt_invitation_id <> p_invitation_id
    or v_attestation.idempotency_key <> p_idempotency_key
  then
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  end if;

  select * into strict v_invitation
  from public.guardian_invitations
  where tenant_id = v_attestation.tenant_id
    and id = v_attestation.invitation_id;
  if p_idempotency_key = v_invitation.create_idempotency_key then
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  end if;
  if v_invitation.last_delivery_idempotency_key = p_idempotency_key then
    if v_invitation.send_count <= 1 then
      raise exception using errcode = '22023',
        message = 'idempotency key conflict';
    end if;
    v_already_issued := true;
  elsif exists (
    select 1 from public.notification_outbox as outbox
    where outbox.tenant_id = v_invitation.tenant_id
      and outbox.kind = 'guardian_invitation'
      and outbox.aggregate_id = v_invitation.id
      and outbox.idempotency_key = p_idempotency_key || ':invite'
  ) then
    -- A non-current historical resend key cannot truthfully replay the active
    -- token material, so it is a conflict rather than a free receipt.
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  elsif v_attestation.abuse_budget_charged_at is null then
    if not private.consume_family_abuse_budget_v1(
      'invitation_resend_hour', v_attestation.tenant_id,
      v_actor_user_id, p_invitation_id
    ) or not private.consume_family_abuse_budget_v1(
      'invitation_resend_day', v_attestation.tenant_id,
      v_actor_user_id, p_invitation_id
    ) then
      raise exception using errcode = '42501',
        message = 'invitation request unavailable';
    end if;
    update public.family_invitation_issuance_attestations
    set abuse_budget_charged_at = clock_timestamp()
    where tenant_id = v_attestation.tenant_id and id = v_attestation.id;
  end if;

  return v_receipt || jsonb_build_object(
    'alreadyIssued', v_already_issued,
    'invitationExpiresAt', case
      when v_already_issued then v_invitation.expires_at
      else null
    end
  );
end;
$$;

-- The dedicated issuer already validates its short-lived capability and the
-- authenticated actor attestation. These outer wrappers add the missing full
-- immutable-material comparison before an idempotent receipt can be returned.
alter function public.create_guardian_invitation_v1(
  uuid, uuid, uuid, text, text, text, text, timestamptz, text
) rename to create_guardian_invitation_unchecked_replay_core_v1;

alter function public.resend_guardian_invitation_v1(
  uuid, uuid, text, text, timestamptz, text
) rename to resend_guardian_invitation_unchecked_replay_core_v1;

revoke all on function
  public.create_guardian_invitation_unchecked_replay_core_v1(
    uuid, uuid, uuid, text, text, text, text, timestamptz, text
  ) from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function
  public.resend_guardian_invitation_unchecked_replay_core_v1(
    uuid, uuid, text, text, timestamptz, text
  ) from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

create or replace function public.create_guardian_invitation_v1(
  p_attestation_id uuid,
  p_invitation_id uuid,
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
  v_receipt jsonb;
  v_invitation public.guardian_invitations%rowtype;
  v_matching_outbox_count integer;
begin
  v_receipt := public.create_guardian_invitation_unchecked_replay_core_v1(
    p_attestation_id, p_invitation_id, p_student_id, p_email_digest,
    p_email_ciphertext, p_token_digest, p_encrypted_outbox_token,
    p_expires_at, p_idempotency_key
  );

  select * into v_invitation
  from public.guardian_invitations
  where id = p_invitation_id;
  if v_invitation.id is null
    or v_invitation.student_id <> p_student_id
    or v_invitation.recipient_email_digest <> p_email_digest
    or v_invitation.recipient_email_ciphertext <> p_email_ciphertext
    or v_invitation.token_digest <> p_token_digest
    or v_invitation.create_idempotency_key <> p_idempotency_key
    or v_invitation.last_delivery_idempotency_key <> p_idempotency_key
    or v_invitation.expires_at <> p_expires_at
    or (v_receipt ->> 'invitation_id') is distinct from p_invitation_id::text
    or (v_receipt ->> 'expires_at') is null
    or (v_receipt ->> 'expires_at')::timestamptz
      is distinct from p_expires_at
  then
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  end if;

  select count(*) into v_matching_outbox_count
  from public.notification_outbox as outbox
  where outbox.tenant_id = v_invitation.tenant_id
    and outbox.kind = 'guardian_invitation'
    and outbox.aggregate_type = 'guardian_invitation'
    and outbox.aggregate_id = v_invitation.id
    and outbox.idempotency_key = p_idempotency_key || ':invite'
    and outbox.recipient_email_digest = p_email_digest
    and outbox.recipient_email_ciphertext = p_email_ciphertext
    and outbox.expires_at = p_expires_at
    and outbox.payload ->> 'invitationId' = p_invitation_id::text
    and outbox.payload ->> 'encryptedInvitationToken' =
      p_encrypted_outbox_token;
  if v_matching_outbox_count <> 1 then
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  end if;
  return v_receipt;
exception
  when invalid_text_representation or datetime_field_overflow then
    raise exception using errcode = 'XX000',
      message = 'invalid invitation issuer receipt';
end;
$$;

create or replace function public.resend_guardian_invitation_v1(
  p_attestation_id uuid,
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
  v_receipt jsonb;
  v_invitation public.guardian_invitations%rowtype;
  v_matching_outbox_count integer;
begin
  v_receipt := public.resend_guardian_invitation_unchecked_replay_core_v1(
    p_attestation_id, p_invitation_id, p_token_digest,
    p_encrypted_outbox_token, p_expires_at, p_idempotency_key
  );

  select * into v_invitation
  from public.guardian_invitations
  where id = p_invitation_id;
  if v_invitation.id is null
    or v_invitation.token_digest <> p_token_digest
    or v_invitation.last_delivery_idempotency_key <> p_idempotency_key
    or v_invitation.expires_at <> p_expires_at
    or (v_receipt ->> 'invitation_id') is distinct from p_invitation_id::text
    or (v_receipt ->> 'expires_at') is null
    or (v_receipt ->> 'expires_at')::timestamptz
      is distinct from p_expires_at
  then
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  end if;

  select count(*) into v_matching_outbox_count
  from public.notification_outbox as outbox
  where outbox.tenant_id = v_invitation.tenant_id
    and outbox.kind = 'guardian_invitation'
    and outbox.aggregate_type = 'guardian_invitation'
    and outbox.aggregate_id = v_invitation.id
    and outbox.idempotency_key = p_idempotency_key || ':invite'
    and outbox.recipient_email_digest =
      v_invitation.recipient_email_digest
    and outbox.recipient_email_ciphertext =
      v_invitation.recipient_email_ciphertext
    and outbox.expires_at = p_expires_at
    and outbox.payload ->> 'invitationId' = p_invitation_id::text
    and outbox.payload ->> 'encryptedInvitationToken' =
      p_encrypted_outbox_token;
  if v_matching_outbox_count <> 1 then
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  end if;
  return v_receipt;
exception
  when invalid_text_representation or datetime_field_overflow then
    raise exception using errcode = 'XX000',
      message = 'invalid invitation issuer receipt';
end;
$$;

-- Keep provider-cutover identity work in the 008 core. The public wrapper
-- below catches only the three documented invitation/email/lifecycle states;
-- configuration, authorization, integrity, and operational SQLSTATEs rethrow
-- and do not consume a failed attempt.
alter function public.accept_guardian_invitation_v1(text, text, text)
  rename to accept_guardian_invitation_identity_core_v1;

revoke all on function public.accept_guardian_invitation_identity_core_v1(
  text, text, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;

create or replace function public.accept_guardian_invitation_v1(
  p_token_digest text,
  p_verified_email_digest text,
  p_idempotency_key text
)
returns table (guardian_link_id uuid, student_id uuid, tenant_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_invitation public.guardian_invitations%rowtype;
  v_issuer text := private.jwt_claim('iss');
  v_subject text := private.jwt_claim('sub');
  v_guardian_link_id uuid;
  v_student_id uuid;
  v_tenant_id uuid;
  v_failed_count integer;
  v_expected_failure boolean := false;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if v_issuer is null or v_subject is null then
    raise exception using errcode = '42501',
      message = 'provider identity required';
  end if;
  if p_token_digest !~ '^[0-9a-f]{64}$'
    or p_verified_email_digest !~ '^[0-9a-f]{64}$'
  then
    return;
  end if;

  select * into v_invitation
  from public.guardian_invitations
  where token_digest = p_token_digest
  for update;
  if v_invitation.id is null then
    -- A random unknown token has no safe tenant/resource association. It uses
    -- the same empty receipt but does not create a per-invitation counter row.
    return;
  end if;
  if v_invitation.status = 'accepted'
    and v_invitation.acceptance_idempotency_key = p_idempotency_key
    and v_invitation.recipient_email_digest <> p_verified_email_digest
  then
    -- Once a receipt exists, the idempotency key is bound to the complete
    -- known-invitation request. A changed email proof is not a free replay and
    -- must not be hidden inside the expected-failure budget.
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  end if;
  if v_invitation.failed_accept_attempts >= 10
    and not (
      v_invitation.status = 'accepted'
      and v_invitation.acceptance_idempotency_key = p_idempotency_key
    )
  then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    v_issuer || chr(31) || v_subject,
    73295631
  ));
  perform pg_advisory_xact_lock(hashtextextended(
    'family-email-digest' || chr(31) || p_verified_email_digest,
    73295632
  ));

  -- Ambiguous app-user identity is an integrity/configuration failure, not an
  -- expected bad invitation attempt. Detect it before the identity core can
  -- report its legacy P0005 code so it always rethrows and consumes nothing.
  if not exists (
    select 1 from public.provider_identities
    where issuer = v_issuer and subject = v_subject
  ) and (
    select count(*) from public.app_users
    where status = 'active'
      and notification_email_digest = p_verified_email_digest
  ) > 1 then
    raise exception using errcode = '42501',
      message = 'provider identity conflict';
  end if;

  begin
    select
      accepted.guardian_link_id,
      accepted.student_id,
      accepted.tenant_id
    into v_guardian_link_id, v_student_id, v_tenant_id
    from public.accept_guardian_invitation_identity_core_v1(
      p_token_digest, p_verified_email_digest, p_idempotency_key
    ) as accepted;
    if v_guardian_link_id is null
      or v_student_id is null
      or v_tenant_id is null
    then
      raise exception using errcode = 'P0003',
        message = 'invalid invitation';
    end if;
  exception
    when sqlstate 'P0003'
      or sqlstate 'P0004'
      or sqlstate 'P0005'
    then
      v_expected_failure := true;
  end;

  if v_expected_failure then
    update public.guardian_invitations as invitation
    set failed_accept_attempts = failed_accept_attempts + 1,
        accept_locked_at = case
          when failed_accept_attempts + 1 = 10 then clock_timestamp()
          else null
        end,
        updated_at = clock_timestamp()
    where invitation.tenant_id = v_invitation.tenant_id
      and invitation.id = v_invitation.id
      and invitation.failed_accept_attempts < 10
    returning failed_accept_attempts into v_failed_count;
    if v_failed_count is not null then
      perform private.write_family_audit(
        v_invitation.tenant_id,
        'updated',
        'family_abuse_budget',
        v_invitation.id,
        jsonb_build_object(
          'operation', 'invitation_accept_failure',
          'requestCount', v_failed_count,
          'limitValue', 10,
          'resourceKind', 'invitation'
        )
      );
    end if;
    return;
  end if;

  return query select v_guardian_link_id, v_student_id, v_tenant_id;
end;
$$;

-- Preserve the existing message authorization/outbox transaction as an
-- owner-only core. The public wrapper serializes idempotency, verifies the
-- complete immutable request meaning, and charges both message windows only
-- for a newly inserted message.
alter function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) rename to send_family_message_unbudgeted_core_v1;

revoke all on function public.send_family_message_unbudgeted_core_v1(
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
  v_actor_id uuid;
  v_requested_tenant_id uuid;
  v_existing_message public.family_messages%rowtype;
  v_existing_thread public.family_threads%rowtype;
  v_message public.family_messages%rowtype;
  v_thread public.family_threads%rowtype;
  v_receipt jsonb;
  v_message_id uuid;
  v_thread_id uuid;
  v_request_mode public.family_message_request_mode;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  if p_body is null
    or p_body <> btrim(p_body)
    or char_length(p_body) not between 1 and 2000
    or p_body ~ '[[:cntrl:]]'
  then
    raise exception using errcode = '22023',
      message = 'invalid message body';
  end if;
  if p_thread_id is not null then
    if p_child_id is not null or p_enrollment_id is not null
      or p_staff_user_id is not null or p_topic is not null
    then
      raise exception using errcode = '22023',
        message = 'unexpected new-thread fields';
    end if;
  elsif p_child_id is null or p_enrollment_id is null
    or p_staff_user_id is null or p_topic is null
  then
    raise exception using errcode = '22023',
      message = 'new-thread fields required';
  end if;
  v_request_mode := case
    when p_thread_id is null then 'new_thread'
    else 'existing_thread'
  end;

  v_actor_id := private.require_family_app_user();
  perform pg_advisory_xact_lock(hashtextextended(
    'family-message-idempotency' || chr(31) || v_actor_id::text
      || chr(31) || p_client_mutation_id,
    73295643
  ));

  if p_thread_id is not null then
    select thread.tenant_id into v_requested_tenant_id
    from public.family_threads as thread
    where thread.id = p_thread_id;
  else
    select enrollment.tenant_id into v_requested_tenant_id
    from public.enrollments as enrollment
    where enrollment.id = p_enrollment_id
      and enrollment.student_id = p_child_id
      and enrollment.status = 'active'
      and enrollment.starts_at <= current_date
      and (enrollment.ends_at is null
        or enrollment.ends_at >= current_date);
  end if;

  if v_requested_tenant_id is not null then
    select message.* into v_existing_message
    from public.family_messages as message
    where message.tenant_id = v_requested_tenant_id
      and message.sender_user_id = v_actor_id
      and message.idempotency_key = p_client_mutation_id;
    if v_existing_message.id is not null then
      select * into strict v_existing_thread
      from public.family_threads
      where tenant_id = v_existing_message.tenant_id
        and id = v_existing_message.thread_id;
    end if;
  end if;

  if v_existing_message.id is not null then
    if v_existing_message.request_mode <> v_request_mode
      or v_existing_message.body <> p_body
      or (
        p_thread_id is not null
        and v_existing_thread.id <> p_thread_id
      )
      or (
        p_thread_id is null
        and (
          v_existing_thread.child_id <> p_child_id
          or v_existing_thread.enrollment_id <> p_enrollment_id
          or v_existing_thread.staff_user_id <> p_staff_user_id
          or v_existing_thread.topic <> p_topic
        )
      )
    then
      raise exception using errcode = '22023',
        message = 'idempotency key conflict';
    end if;

    if p_thread_id is not null then
      return public.send_family_message_unbudgeted_core_v1(
        p_body, null, p_client_mutation_id, null, null,
        p_thread_id, null
      );
    end if;
    -- The original new-thread tuple was verified above. Re-entering the core
    -- through the persisted thread prevents a retry from creating a second
    -- empty thread while still rechecking current participant authorization.
    return public.send_family_message_unbudgeted_core_v1(
      p_body, null, p_client_mutation_id, null, null,
      v_existing_thread.id, null
    );
  end if;

  perform set_config(
    'app.family_message_request_mode', v_request_mode::text, true
  );
  v_receipt := public.send_family_message_unbudgeted_core_v1(
    p_body, p_child_id, p_client_mutation_id, p_enrollment_id,
    p_staff_user_id, p_thread_id, p_topic
  );
  begin
    if jsonb_typeof(v_receipt) <> 'object'
      or array(select jsonb_object_keys(v_receipt) order by 1) is distinct from
        array['message_id', 'thread_id']::text[]
    then
      raise exception 'invalid receipt';
    end if;
    v_message_id := (v_receipt ->> 'message_id')::uuid;
    v_thread_id := (v_receipt ->> 'thread_id')::uuid;
  exception when others then
    raise exception using errcode = 'XX000',
      message = 'invalid family message receipt';
  end;

  select * into strict v_message
  from public.family_messages
  where id = v_message_id;
  select * into strict v_thread
  from public.family_threads
  where tenant_id = v_message.tenant_id and id = v_thread_id;
  if v_message.thread_id <> v_thread.id
    or v_message.sender_user_id <> v_actor_id
    or v_message.idempotency_key <> p_client_mutation_id
    or v_message.request_mode <> v_request_mode
    or v_message.body <> p_body
    or (
      p_thread_id is not null and v_thread.id <> p_thread_id
    )
    or (
      p_thread_id is null and (
        v_thread.child_id <> p_child_id
        or v_thread.enrollment_id <> p_enrollment_id
        or v_thread.staff_user_id <> p_staff_user_id
        or v_thread.topic <> p_topic
      )
    )
  then
    raise exception using errcode = '22023',
      message = 'idempotency key conflict';
  end if;

  if not private.consume_family_abuse_budget_v1(
    'family_message_ten_minute', v_thread.tenant_id,
    v_actor_id, v_thread.id
  ) or not private.consume_family_abuse_budget_v1(
    'family_message_day', v_thread.tenant_id,
    v_actor_id, v_thread.id
  ) then
    raise exception using errcode = '42501',
      message = 'family message unavailable';
  end if;
  return v_receipt;
end;
$$;

alter function public.run_family_retention_v1(integer)
  rename to run_family_retention_pre_abuse_v1;

revoke all on function public.run_family_retention_pre_abuse_v1(integer)
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
  v_budget_count integer;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501',
      message = 'service role required';
  end if;
  if p_batch_size not between 1 and 10000 then
    raise exception using errcode = '22023',
      message = 'retention batch out of range';
  end if;
  v_previous := public.run_family_retention_pre_abuse_v1(p_batch_size);
  if jsonb_typeof(v_previous -> 'runs') <> 'array' then
    raise exception using errcode = 'XX000',
      message = 'invalid retention receipt';
  end if;

  for v_run in select value from jsonb_array_elements(v_previous -> 'runs')
  loop
    v_tenant_id := (v_run ->> 'tenantId')::uuid;
    v_run_id := (v_run ->> 'runId')::uuid;
    v_budget_count := private.cleanup_family_abuse_budgets_v1(
      v_tenant_id, p_batch_size
    );
    v_counts := coalesce(v_run -> 'deletedCounts', '{}'::jsonb)
      || jsonb_build_object(
        'familyAbuseBudgetWindows', v_budget_count
      );
    update public.retention_runs
    set deleted_counts = v_counts
    where tenant_id = v_tenant_id and id = v_run_id;
    v_runs := v_runs || jsonb_build_array(
      v_run || jsonb_build_object('deletedCounts', v_counts)
    );
  end loop;
  return jsonb_build_object('runs', v_runs);
end;
$$;

revoke all on table public.family_abuse_budget_windows
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;

revoke all on function private.family_abuse_budget_limit_v1(
  public.family_abuse_budget_operation
) from public;
revoke all on function private.family_message_request_mode_v1()
  from public;
revoke all on function private.family_abuse_budget_window_seconds_v1(
  public.family_abuse_budget_operation
) from public;
revoke all on function private.consume_family_abuse_budget_v1(
  public.family_abuse_budget_operation, uuid, uuid, uuid
) from public;
revoke all on function private.audit_family_abuse_budget_window_v1()
  from public;
revoke all on function private.cleanup_family_abuse_budgets_v1(uuid, integer)
  from public;

revoke all on function public.authorize_guardian_invitation_creation_v1(
  uuid, text, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.authorize_guardian_invitation_resend_v1(
  uuid, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.create_guardian_invitation_v1(
  uuid, uuid, uuid, text, text, text, text, timestamptz, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.resend_guardian_invitation_v1(
  uuid, uuid, text, text, timestamptz, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.accept_guardian_invitation_v1(
  text, text, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.run_family_retention_v1(integer)
  from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;

grant execute on function public.authorize_guardian_invitation_creation_v1(
  uuid, text, text
) to authenticated;
grant execute on function public.authorize_guardian_invitation_resend_v1(
  uuid, text
) to authenticated;
grant execute on function public.create_guardian_invitation_v1(
  uuid, uuid, uuid, text, text, text, text, timestamptz, text
) to family_invitation_issuer;
grant execute on function public.resend_guardian_invitation_v1(
  uuid, uuid, text, text, timestamptz, text
) to family_invitation_issuer;
grant execute on function public.accept_guardian_invitation_v1(
  text, text, text
) to authenticated;
grant execute on function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) to authenticated;
grant execute on function public.run_family_retention_v1(integer)
  to service_role;

comment on table public.family_abuse_budget_windows is
  'Deny-by-default, privacy-safe actor+tenant+resource counters. Fixed windows: create 5/hour and 20/day; resend 3/hour and 10/day; message 20/10 minutes and 100/day.';
comment on column public.guardian_invitations.failed_accept_attempts is
  'Known-invitation expected failures only; locks at 10 for the invitation lifetime and is not reset by resend.';
comment on column public.family_messages.request_mode is
  'Immutable request meaning for idempotent replay. Pre-011 legacy rows are never treated as free new-thread or existing-thread replays.';
comment on function public.accept_guardian_invitation_v1(text, text, text) is
  'Authenticated, no-existence-leak acceptance wrapper. Expected P0003/P0004/P0005 failures return zero rows; operational/configuration/integrity errors rethrow.';
comment on function public.run_family_retention_v1(integer) is
  'Service-only existing retention transaction plus bounded expired abuse-window cleanup; product revoke, relinquish, and redaction paths are never budget-gated.';

commit;
