-- HELP Math family portal: one-use invitation issuance capabilities and the
-- dedicated PostgREST issuer role. Ciphertext stays opaque to PostgreSQL; the
-- RPC accepts only the versioned v2 envelope written by the server keyring.

begin;

-- Invitation acceptance creates a guardian role and revalidates it within the
-- same outer SQL statement.  A clock_timestamp() default can be a few
-- microseconds later than statement_timestamp(), making the newly-created role
-- appear future-dated and causing the transaction to reject itself.  Keep the
-- lifecycle anchor at the statement boundary used by every authorization
-- predicate in the family RPCs.
alter table public.role_bindings
  alter column starts_at set default statement_timestamp();

do $invitation_issuer_role$
begin
  if not exists (
    select 1 from pg_catalog.pg_roles
    where rolname = 'family_invitation_issuer'
  ) then
    execute 'create role family_invitation_issuer nologin noinherit';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_roles
    where rolname = 'family_invitation_issuer'
      and (
        rolcanlogin or rolinherit or rolsuper or rolbypassrls
        or rolcreatedb or rolcreaterole or rolreplication
      )
  ) then
    raise exception using errcode = '42501',
      message = 'unsafe pre-existing family invitation issuer role';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_auth_members as membership
    join pg_catalog.pg_roles as member_role
      on member_role.oid = membership.member
    where member_role.rolname = 'family_invitation_issuer'
  ) then
    raise exception using errcode = '42501',
      message = 'family invitation issuer must not inherit role memberships';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_auth_members as membership
    join pg_catalog.pg_roles as granted_role
      on granted_role.oid = membership.roleid
    join pg_catalog.pg_roles as member_role
      on member_role.oid = membership.member
    where granted_role.rolname = 'family_invitation_issuer'
      and (member_role.rolname <> 'authenticator' or membership.admin_option)
  ) then
    raise exception using errcode = '42501',
      message = 'unexpected family invitation issuer role membership';
  end if;
end;
$invitation_issuer_role$;

grant family_invitation_issuer to authenticator;

create type public.family_invitation_issuance_operation
  as enum ('create', 'resend');

create table public.family_invitation_issuer_configs (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  issuer text not null,
  audience text not null,
  active boolean not null default false,
  not_before timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (tenant_id, issuer, audience),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  constraint family_invitation_issuer_configs_issuer check (
    issuer = btrim(issuer)
    and char_length(issuer) between 3 and 2048
    and issuer !~ '[[:space:]]'
  ),
  constraint family_invitation_issuer_configs_audience check (
    audience = btrim(audience)
    and char_length(audience) between 1 and 255
    and audience !~ '[[:space:]]'
  ),
  constraint family_invitation_issuer_configs_lifetime check (
    expires_at > not_before
  )
);

create table public.family_invitation_issuance_attestations (
  tenant_id uuid not null,
  environment_id text not null,
  data_mode public.parent_portal_data_mode not null,
  id uuid not null default extensions.gen_random_uuid(),
  operation public.family_invitation_issuance_operation not null,
  actor_user_id uuid not null references public.app_users(id) on delete cascade,
  actor_issuer text not null,
  actor_subject text not null,
  student_id uuid not null,
  invitation_id uuid not null,
  recipient_email_digest text,
  idempotency_key text not null,
  issued_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  issuer_jti uuid,
  primary key (tenant_id, id),
  unique (id),
  unique (tenant_id, actor_user_id, operation, idempotency_key),
  foreign key (tenant_id, environment_id, data_mode)
    references public.tenants (id, environment_id, data_mode)
    on update restrict on delete cascade,
  foreign key (tenant_id, student_id)
    references public.students (tenant_id, id)
    on update restrict on delete cascade,
  constraint family_invitation_attestations_actor_issuer check (
    actor_issuer = btrim(actor_issuer)
    and char_length(actor_issuer) between 3 and 500
    and actor_issuer !~ '[[:space:]]'
  ),
  constraint family_invitation_attestations_actor_subject check (
    actor_subject = btrim(actor_subject)
    and char_length(actor_subject) between 1 and 255
  ),
  constraint family_invitation_attestations_digest check (
    (operation = 'create' and recipient_email_digest ~ '^[0-9a-f]{64}$')
    or (operation = 'resend' and recipient_email_digest is null)
  ),
  constraint family_invitation_attestations_idempotency check (
    char_length(idempotency_key) between 8 and 128
    and idempotency_key ~ '^[A-Za-z0-9._:-]+$'
  ),
  constraint family_invitation_attestations_lifetime check (
    expires_at > issued_at
    and expires_at <= issued_at + interval '2 minutes'
  ),
  constraint family_invitation_attestations_consumption check (
    (consumed_at is null and issuer_jti is null)
    or (consumed_at is not null and issuer_jti is not null)
  )
);

alter table public.guardian_invitations
  add column recipient_policy text not null default 'legacy-unverified',
  add constraint guardian_invitations_recipient_policy check (
    recipient_policy in ('legacy-unverified', 'synthetic-invalid-only')
  );

create index family_invitation_attestations_expiry_idx
  on public.family_invitation_issuance_attestations (expires_at, consumed_at);

alter table public.family_invitation_issuer_configs enable row level security;
alter table public.family_invitation_issuance_attestations
  enable row level security;

revoke all on public.family_invitation_issuer_configs
  from public, anon, authenticated, service_role, family_invitation_issuer;
revoke all on public.family_invitation_issuance_attestations
  from public, anon, authenticated, service_role, family_invitation_issuer;

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
    from public.tenants as t
    join public.students as s
      on s.tenant_id = t.id and s.id = p_student_id
    join public.schools as sc
      on sc.tenant_id = s.tenant_id and sc.id = s.school_id
    join public.app_users as actor on actor.id = p_actor_user_id
    join public.provider_identities as identity
      on identity.issuer = p_actor_issuer
      and identity.subject = p_actor_subject
      and identity.app_user_id = actor.id
    join public.tenant_identity_issuers as allowed_identity_issuer
      on allowed_identity_issuer.tenant_id = t.id
      and allowed_identity_issuer.issuer = identity.issuer
    where t.id = p_tenant_id
      and t.status = 'active'
      and t.family_portal_enabled
      and t.data_mode = 'synthetic'
      and s.active
      and sc.active
      and actor.status = 'active'
      and identity.active
      and allowed_identity_issuer.active
      and exists (
        select 1
        from public.enrollments as enrollment
        join public.classes as active_class
          on active_class.tenant_id = enrollment.tenant_id
          and active_class.id = enrollment.class_id
          and active_class.school_id = s.school_id
        where enrollment.tenant_id = s.tenant_id
          and enrollment.student_id = s.id
          and enrollment.status = 'active'
          and enrollment.starts_at <= current_date
          and (enrollment.ends_at is null
            or enrollment.ends_at >= current_date)
          and active_class.active
      )
      and exists (
        select 1
        from public.role_bindings as admin_role
        where admin_role.tenant_id = t.id
          and admin_role.app_user_id = actor.id
          and admin_role.role in ('school_admin', 'district_admin')
          and admin_role.active
          and admin_role.starts_at <= statement_timestamp()
          and (admin_role.ends_at is null
            or admin_role.ends_at > statement_timestamp())
          and (
            admin_role.role = 'district_admin'
            or (
              admin_role.role = 'school_admin'
              and admin_role.school_id = s.school_id
            )
          )
      )
  );
$$;

create or replace function private.family_invitation_ciphertext_v2_v1(
  p_ciphertext text
)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select coalesce(
    p_ciphertext ~
      '^v2\.[A-Za-z0-9_-]{1,32}\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$',
    false
  );
$$;

create or replace function private.require_family_invitation_issuer_v1(
  p_tenant_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_issuer text := private.jwt_claim('iss');
  v_audience text := private.jwt_claim('aud');
  v_jti text := private.jwt_claim('jti');
  v_issued_at text := private.jwt_claim('iat');
  v_not_before text := private.jwt_claim('nbf');
  v_expires_at text := private.jwt_claim('exp');
  v_now bigint := floor(extract(epoch from statement_timestamp()))::bigint;
begin
  if private.jwt_claim('role') is distinct from 'family_invitation_issuer'
    or private.jwt_claim('sub') is distinct from 'family_invitation_issuer'
    or private.jwt_claim('family_purpose') is distinct from
      'family_invitation_issue_v1'
    or v_issuer is null
    or v_audience is null
    or v_jti is null
    or v_issued_at is null
    or v_not_before is null
    or v_expires_at is null
    or v_jti !~
      '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or v_issued_at !~ '^[0-9]{10,11}$'
    or v_not_before !~ '^[0-9]{10,11}$'
    or v_expires_at !~ '^[0-9]{10,11}$'
  then
    raise exception using errcode = '42501',
      message = 'dedicated family invitation issuer required';
  end if;
  if v_issued_at::bigint > v_now + 5
    or v_not_before::bigint > v_now + 5
    or v_not_before::bigint < v_issued_at::bigint - 30
    or v_expires_at::bigint <= v_now
    or v_expires_at::bigint - v_issued_at::bigint > 300
  then
    raise exception using errcode = '42501',
      message = 'dedicated family invitation issuer required';
  end if;
  if not exists (
    select 1
    from public.family_invitation_issuer_configs as config
    join public.tenants as tenant on tenant.id = config.tenant_id
    where config.tenant_id = p_tenant_id
      and config.issuer = v_issuer
      and config.audience = v_audience
      and config.active
      and config.not_before <= statement_timestamp()
      and config.expires_at > statement_timestamp()
      and tenant.status = 'active'
      and tenant.family_portal_enabled
      and tenant.data_mode = 'synthetic'
      and config.data_mode = 'synthetic'
  ) then
    raise exception using errcode = '42501',
      message = 'dedicated family invitation issuer required';
  end if;
  return v_jti::uuid;
end;
$$;

create or replace function private.cleanup_family_invitation_attestations_v1(
  p_limit integer
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
declare
  v_deleted integer;
begin
  if p_limit not between 1 and 5000 then
    raise exception using errcode = '22023', message = 'cleanup limit out of range';
  end if;
  with expired as (
    select tenant_id, id
    from public.family_invitation_issuance_attestations
    where (
      consumed_at is null and expires_at <= statement_timestamp()
    ) or consumed_at <= statement_timestamp() - interval '5 minutes'
    order by expires_at, id
    limit p_limit
    for update skip locked
  )
  delete from public.family_invitation_issuance_attestations as attestation
  using expired
  where attestation.tenant_id = expired.tenant_id
    and attestation.id = expired.id;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Preserve the real admin actor in row-trigger audit events after the gateway
-- has switched to the infrastructure role. Authenticated request RPCs always
-- have a mapped current actor and therefore cannot override their identity.
create or replace function private.write_family_audit(
  p_tenant_id uuid,
  p_action public.audit_action,
  p_entity_type text,
  p_entity_id uuid,
  p_context jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_tenant public.tenants%rowtype;
  v_actor_user_id uuid;
begin
  perform private.assert_safe_audit_context(p_context);
  select * into strict v_tenant
  from public.tenants
  where id = p_tenant_id;

  v_actor_user_id := public.family_current_app_user_id_v1();
  if v_actor_user_id is null
    and private.jwt_claim('role') = 'family_invitation_issuer'
  then
    begin
      v_actor_user_id := nullif(
        current_setting('app.family_audit_actor_user_id', true), ''
      )::uuid;
    exception when others then
      raise exception using errcode = '42501',
        message = 'family audit actor required';
    end;
    if not exists (
      select 1 from public.app_users
      where id = v_actor_user_id and status = 'active'
    ) then
      raise exception using errcode = '42501',
        message = 'family audit actor required';
    end if;
  end if;

  insert into public.audit_events (
    tenant_id, environment_id, data_mode, actor_user_id, action,
    entity_type, entity_id, context, retention_anchor_at, expires_at
  ) values (
    v_tenant.id, v_tenant.environment_id, v_tenant.data_mode,
    v_actor_user_id, p_action, p_entity_type, p_entity_id, p_context,
    statement_timestamp(), statement_timestamp() + interval '30 days'
  );
end;
$$;

create or replace function public.authorize_guardian_invitation_creation_v1(
  p_student_id uuid,
  p_email_digest text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
set row_security = off
as $$
declare
  v_actor_user_id uuid;
  v_actor_issuer text := private.jwt_claim('iss');
  v_actor_subject text := private.jwt_claim('sub');
  v_student public.students%rowtype;
  v_invitation public.guardian_invitations%rowtype;
  v_attestation public.family_invitation_issuance_attestations%rowtype;
  v_invitation_id uuid;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if p_email_digest !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid email proof';
  end if;
  v_actor_user_id := private.require_family_app_user();
  select * into v_student
  from public.students where id = p_student_id;
  if v_student.id is null
    or not private.family_invitation_admin_is_current_v1(
      v_student.tenant_id, v_student.id, v_actor_user_id,
      v_actor_issuer, v_actor_subject
    )
  then
    raise exception using errcode = 'P0002', message = 'student not found';
  end if;
  perform private.cleanup_family_invitation_attestations_v1(500);

  select * into v_invitation
  from public.guardian_invitations
  where tenant_id = v_student.tenant_id
    and invited_by_user_id = v_actor_user_id
    and create_idempotency_key = p_idempotency_key;
  if v_invitation.id is not null then
    if v_invitation.student_id <> v_student.id
      or v_invitation.recipient_email_digest <> p_email_digest
    then
      raise exception using errcode = '22023',
        message = 'idempotency key conflict';
    end if;
    v_invitation_id := v_invitation.id;
  else
    v_invitation_id := extensions.gen_random_uuid();
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
      or v_attestation.invitation_id <> v_invitation_id
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
  else
    insert into public.family_invitation_issuance_attestations (
      tenant_id, environment_id, data_mode, operation, actor_user_id,
      actor_issuer, actor_subject, student_id, invitation_id,
      recipient_email_digest, idempotency_key, expires_at
    ) values (
      v_student.tenant_id, v_student.environment_id, v_student.data_mode,
      'create', v_actor_user_id, v_actor_issuer, v_actor_subject,
      v_student.id, v_invitation_id, p_email_digest, p_idempotency_key,
      statement_timestamp() + interval '90 seconds'
    ) returning * into v_attestation;
  end if;

  return jsonb_build_object(
    'attestationId', v_attestation.id,
    'expiresAt', v_attestation.expires_at,
    'invitationId', v_attestation.invitation_id,
    'tenantId', v_attestation.tenant_id
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
  v_actor_issuer text := private.jwt_claim('iss');
  v_actor_subject text := private.jwt_claim('sub');
  v_invitation public.guardian_invitations%rowtype;
  v_attestation public.family_invitation_issuance_attestations%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  v_actor_user_id := private.require_family_app_user();
  select * into v_invitation
  from public.guardian_invitations
  where id = p_invitation_id
  for update;
  if v_invitation.id is null
    or v_invitation.status <> 'pending'
    or not private.family_invitation_admin_is_current_v1(
      v_invitation.tenant_id, v_invitation.student_id, v_actor_user_id,
      v_actor_issuer, v_actor_subject
    )
  then
    raise exception using errcode = 'P0002', message = 'invitation not found';
  end if;
  perform private.cleanup_family_invitation_attestations_v1(500);

  select * into v_attestation
  from public.family_invitation_issuance_attestations
  where tenant_id = v_invitation.tenant_id
    and actor_user_id = v_actor_user_id
    and operation = 'resend'
    and idempotency_key = p_idempotency_key
  for update;
  if v_attestation.id is not null then
    if v_attestation.student_id <> v_invitation.student_id
      or v_attestation.invitation_id <> v_invitation.id
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
  else
    insert into public.family_invitation_issuance_attestations (
      tenant_id, environment_id, data_mode, operation, actor_user_id,
      actor_issuer, actor_subject, student_id, invitation_id,
      idempotency_key, expires_at
    ) values (
      v_invitation.tenant_id, v_invitation.environment_id,
      v_invitation.data_mode, 'resend', v_actor_user_id, v_actor_issuer,
      v_actor_subject, v_invitation.student_id, v_invitation.id,
      p_idempotency_key, statement_timestamp() + interval '90 seconds'
    ) returning * into v_attestation;
  end if;

  return jsonb_build_object(
    'attestationId', v_attestation.id,
    'expiresAt', v_attestation.expires_at,
    'invitationId', v_attestation.invitation_id,
    'tenantId', v_attestation.tenant_id
  );
end;
$$;

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
  v_attestation public.family_invitation_issuance_attestations%rowtype;
  v_student public.students%rowtype;
  v_invitation public.guardian_invitations%rowtype;
  v_issuer_jti uuid;
begin
  if private.jwt_claim('role') is distinct from 'family_invitation_issuer' then
    raise exception using errcode = '42501',
      message = 'dedicated family invitation issuer required';
  end if;
  perform private.assert_family_idempotency_key(p_idempotency_key);
  select * into v_attestation
  from public.family_invitation_issuance_attestations
  where id = p_attestation_id
  for update;
  if v_attestation.id is null then
    raise exception using errcode = 'P0002',
      message = 'invitation issuance authorization not found';
  end if;
  v_issuer_jti := private.require_family_invitation_issuer_v1(
    v_attestation.tenant_id
  );
  if v_attestation.data_mode <> 'synthetic'
    or v_attestation.operation <> 'create'
    or v_attestation.invitation_id <> p_invitation_id
    or v_attestation.student_id <> p_student_id
    or v_attestation.recipient_email_digest <> p_email_digest
    or v_attestation.idempotency_key <> p_idempotency_key
    or not private.family_invitation_admin_is_current_v1(
      v_attestation.tenant_id, v_attestation.student_id,
      v_attestation.actor_user_id, v_attestation.actor_issuer,
      v_attestation.actor_subject
    )
  then
    raise exception using errcode = 'P0002',
      message = 'invitation issuance authorization not found';
  end if;

  select * into v_invitation
  from public.guardian_invitations
  where tenant_id = v_attestation.tenant_id
    and (
      id = v_attestation.invitation_id
      or (
        invited_by_user_id = v_attestation.actor_user_id
        and create_idempotency_key = v_attestation.idempotency_key
      )
    )
  for update;
  if v_invitation.id is not null then
    if v_invitation.id <> p_invitation_id
      or v_invitation.student_id <> p_student_id
      or v_invitation.recipient_email_digest <> p_email_digest
      or v_invitation.recipient_policy <> 'synthetic-invalid-only'
    then
      raise exception using errcode = '22023',
        message = 'idempotency key conflict';
    end if;
    return jsonb_build_object(
      'invitation_id', v_invitation.id,
      'expires_at', v_invitation.expires_at
    );
  end if;
  if v_attestation.consumed_at is not null
    or v_attestation.expires_at <= statement_timestamp()
  then
    raise exception using errcode = 'P0002',
      message = 'invitation issuance authorization not found';
  end if;
  if p_email_digest !~ '^[0-9a-f]{64}$'
    or p_token_digest !~ '^[0-9a-f]{64}$'
    or not private.family_invitation_ciphertext_v2_v1(p_email_ciphertext)
    or not private.family_invitation_ciphertext_v2_v1(
      p_encrypted_outbox_token
    )
    or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '8 days'
  then
    raise exception using errcode = '22023',
      message = 'invalid invitation material';
  end if;
  select * into v_student
  from public.students
  where tenant_id = v_attestation.tenant_id and id = p_student_id and active;
  if v_student.id is null then
    raise exception using errcode = 'P0002', message = 'student not found';
  end if;

  perform set_config(
    'app.family_audit_actor_user_id',
    v_attestation.actor_user_id::text,
    true
  );
  insert into public.guardian_invitations (
    tenant_id, environment_id, data_mode, id, school_id, student_id,
    invited_by_user_id, recipient_email_digest, recipient_email_ciphertext,
    token_digest, create_idempotency_key, last_delivery_idempotency_key,
    recipient_policy, retention_anchor_at, expires_at
  ) values (
    v_student.tenant_id, v_student.environment_id, v_student.data_mode,
    p_invitation_id, v_student.school_id, v_student.id,
    v_attestation.actor_user_id, p_email_digest, p_email_ciphertext,
    p_token_digest, p_idempotency_key, p_idempotency_key,
    'synthetic-invalid-only', statement_timestamp(), p_expires_at
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
      'invitationId', v_invitation.id,
      'encryptedInvitationToken', p_encrypted_outbox_token
    ),
    statement_timestamp(), least(
      p_expires_at, statement_timestamp() + interval '30 days'
    )
  );
  update public.family_invitation_issuance_attestations
  set consumed_at = clock_timestamp(), issuer_jti = v_issuer_jti
  where tenant_id = v_attestation.tenant_id and id = v_attestation.id;

  return jsonb_build_object(
    'invitation_id', v_invitation.id,
    'expires_at', v_invitation.expires_at
  );
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
  v_attestation public.family_invitation_issuance_attestations%rowtype;
  v_invitation public.guardian_invitations%rowtype;
  v_issuer_jti uuid;
begin
  if private.jwt_claim('role') is distinct from 'family_invitation_issuer' then
    raise exception using errcode = '42501',
      message = 'dedicated family invitation issuer required';
  end if;
  perform private.assert_family_idempotency_key(p_idempotency_key);
  select * into v_attestation
  from public.family_invitation_issuance_attestations
  where id = p_attestation_id
  for update;
  if v_attestation.id is null then
    raise exception using errcode = 'P0002',
      message = 'invitation issuance authorization not found';
  end if;
  v_issuer_jti := private.require_family_invitation_issuer_v1(
    v_attestation.tenant_id
  );
  if v_attestation.data_mode <> 'synthetic'
    or v_attestation.operation <> 'resend'
    or v_attestation.invitation_id <> p_invitation_id
    or v_attestation.idempotency_key <> p_idempotency_key
    or not private.family_invitation_admin_is_current_v1(
      v_attestation.tenant_id, v_attestation.student_id,
      v_attestation.actor_user_id, v_attestation.actor_issuer,
      v_attestation.actor_subject
    )
  then
    raise exception using errcode = 'P0002',
      message = 'invitation issuance authorization not found';
  end if;
  select * into v_invitation
  from public.guardian_invitations
  where tenant_id = v_attestation.tenant_id and id = p_invitation_id
  for update;
  if v_invitation.id is null or v_invitation.status <> 'pending' then
    raise exception using errcode = 'P0002', message = 'invitation not found';
  end if;
  if v_invitation.recipient_policy <> 'synthetic-invalid-only' then
    raise exception using errcode = '42501',
      message = 'invitation recipient policy required';
  end if;
  if v_invitation.last_delivery_idempotency_key = p_idempotency_key then
    return jsonb_build_object(
      'invitation_id', v_invitation.id,
      'expires_at', v_invitation.expires_at
    );
  end if;
  if v_attestation.consumed_at is not null
    or v_attestation.expires_at <= statement_timestamp()
  then
    raise exception using errcode = 'P0002',
      message = 'invitation issuance authorization not found';
  end if;
  if p_token_digest !~ '^[0-9a-f]{64}$'
    or not private.family_invitation_ciphertext_v2_v1(
      p_encrypted_outbox_token
    )
    or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '8 days'
  then
    raise exception using errcode = '22023',
      message = 'invalid invitation material';
  end if;

  perform set_config(
    'app.family_audit_actor_user_id',
    v_attestation.actor_user_id::text,
    true
  );
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
    v_invitation.tenant_id, v_invitation.environment_id,
    v_invitation.data_mode, 'guardian_invitation',
    v_invitation.recipient_email_digest,
    v_invitation.recipient_email_ciphertext, student.locale,
    p_idempotency_key || ':invite', 'guardian_invitation', v_invitation.id,
    jsonb_build_object(
      'kind', 'guardian_invitation',
      'invitationId', v_invitation.id,
      'encryptedInvitationToken', p_encrypted_outbox_token
    ),
    statement_timestamp(), least(
      p_expires_at, statement_timestamp() + interval '30 days'
    )
  from public.students as student
  where student.tenant_id = v_invitation.tenant_id
    and student.id = v_invitation.student_id
    and student.active;
  if not found then
    raise exception using errcode = 'P0002', message = 'student not found';
  end if;
  update public.family_invitation_issuance_attestations
  set consumed_at = clock_timestamp(), issuer_jti = v_issuer_jti
  where tenant_id = v_attestation.tenant_id and id = v_attestation.id;

  return jsonb_build_object(
    'invitation_id', v_invitation.id,
    'expires_at', v_invitation.expires_at
  );
end;
$$;

create or replace function public.cleanup_family_invitation_issuance_attestations_v1(
  p_limit integer default 1000
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, private
set row_security = off
as $$
begin
  if private.jwt_claim('role') is distinct from 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  return private.cleanup_family_invitation_attestations_v1(p_limit);
end;
$$;

-- Preserve the fully locked acceptance transaction from migration 004 as an
-- owner-only core. The public wrapper below adds deterministic provider-cutover
-- identity resolution before entering that transaction. Both steps share the
-- caller transaction, so a later lifecycle or invitation failure rolls the
-- provisional identity mapping back.
alter function public.accept_guardian_invitation_v1(text, text, text)
  rename to accept_guardian_invitation_core_v1;

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
  v_existing_identity public.provider_identities%rowtype;
  v_email_user_id uuid;
  v_email_user_count bigint;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if p_token_digest !~ '^[0-9a-f]{64}$'
    or p_verified_email_digest !~ '^[0-9a-f]{64}$'
  then
    raise exception using errcode = 'P0003', message = 'invalid invitation';
  end if;
  if v_issuer is null or v_subject is null then
    raise exception using errcode = '42501',
      message = 'provider identity required';
  end if;

  select * into v_invitation
  from public.guardian_invitations
  where token_digest = p_token_digest
  for update;
  if v_invitation.id is null then
    raise exception using errcode = 'P0003', message = 'invalid invitation';
  end if;
  if p_verified_email_digest <> v_invitation.recipient_email_digest then
    raise exception using errcode = 'P0005',
      message = 'verified email mismatch';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_issuer || chr(31) || v_subject, 73295631)
  );
  perform pg_advisory_xact_lock(
    hashtextextended(
      'family-email-digest' || chr(31) || p_verified_email_digest,
      73295632
    )
  );

  select * into v_existing_identity
  from public.provider_identities
  where issuer = v_issuer and subject = v_subject
  for update;
  if v_existing_identity.issuer is null then
    select count(*)
    into v_email_user_count
    from public.app_users
    where status = 'active'
      and notification_email_digest = p_verified_email_digest;

    if v_email_user_count > 1 then
      raise exception using errcode = 'P0005',
        message = 'verified email mapping is ambiguous';
    end if;
    if v_email_user_count = 1 then
      select id into v_email_user_id
      from public.app_users
      where status = 'active'
        and notification_email_digest = p_verified_email_digest
      order by id
      limit 1
      for update;
      if v_email_user_id is null then
        raise exception using errcode = '42501',
          message = 'provider identity conflict';
      end if;

      -- Invitation acceptance is not a provider-migration ceremony. A second
      -- subject from the same provider, or any revoked identity on the global
      -- app user, requires a separate audited cutover flow and fails closed.
      if exists (
        select 1
        from public.provider_identities
        where app_user_id = v_email_user_id
          and (issuer = v_issuer or not active)
      ) then
        raise exception using errcode = '42501',
          message = 'provider identity conflict';
      end if;

      insert into public.provider_identities (
        issuer, subject, app_user_id, active, last_seen_at
      ) values (
        v_issuer, v_subject, v_email_user_id, true, clock_timestamp()
      );

      -- A v2 invitation is a controlled opportunity to replace legacy v1
      -- contact ciphertext without changing its keyed email identity.
      if private.family_invitation_ciphertext_v2_v1(
        v_invitation.recipient_email_ciphertext
      ) then
        update public.app_users
        set notification_email_ciphertext =
              v_invitation.recipient_email_ciphertext,
            updated_at = clock_timestamp()
        where id = v_email_user_id
          and notification_email_digest = p_verified_email_digest;
      end if;
    end if;
  end if;

  return query
  select accepted.guardian_link_id, accepted.student_id, accepted.tenant_id
  from public.accept_guardian_invitation_core_v1(
    p_token_digest, p_verified_email_digest, p_idempotency_key
  ) as accepted;
end;
$$;

revoke all on function private.family_invitation_admin_is_current_v1(
  uuid, uuid, uuid, text, text
) from public;
revoke all on function private.family_invitation_ciphertext_v2_v1(text)
  from public;
revoke all on function private.require_family_invitation_issuer_v1(uuid)
  from public;
revoke all on function private.cleanup_family_invitation_attestations_v1(integer)
  from public;
revoke all on function private.write_family_audit(
  uuid, public.audit_action, text, uuid, jsonb
) from public;

revoke all on function public.authorize_guardian_invitation_creation_v1(
  uuid, text, text
) from public, anon, authenticated, service_role, family_invitation_issuer;
revoke all on function public.authorize_guardian_invitation_resend_v1(
  uuid, text
) from public, anon, authenticated, service_role, family_invitation_issuer;
revoke all on function public.create_guardian_invitation_v1(
  uuid, uuid, uuid, text, text, text, text, timestamptz, text
) from public, anon, authenticated, service_role, family_invitation_issuer;
revoke all on function public.resend_guardian_invitation_v1(
  uuid, uuid, text, text, timestamptz, text
) from public, anon, authenticated, service_role, family_invitation_issuer;
revoke all on function public.cleanup_family_invitation_issuance_attestations_v1(
  integer
) from public, anon, authenticated, service_role, family_invitation_issuer;
revoke all on function public.accept_guardian_invitation_core_v1(
  text, text, text
) from public, anon, authenticated, service_role, family_invitation_issuer;
revoke all on function public.accept_guardian_invitation_v1(
  text, text, text
) from public, anon, authenticated, service_role, family_invitation_issuer;

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
grant execute on function public.cleanup_family_invitation_issuance_attestations_v1(
  integer
) to service_role;
grant execute on function public.accept_guardian_invitation_v1(
  text, text, text
) to authenticated;

revoke all privileges on all tables in schema public
  from family_invitation_issuer;
revoke all privileges on all sequences in schema public
  from family_invitation_issuer;
revoke all privileges on all functions in schema public
  from family_invitation_issuer;
revoke all on schema public from family_invitation_issuer;
revoke all on schema private from family_invitation_issuer;
revoke create on schema public from public;
grant usage on schema public to family_invitation_issuer;
grant execute on function public.create_guardian_invitation_v1(
  uuid, uuid, uuid, text, text, text, text, timestamptz, text
) to family_invitation_issuer;
grant execute on function public.resend_guardian_invitation_v1(
  uuid, uuid, text, text, timestamptz, text
) to family_invitation_issuer;

-- Old owner-fixture overloads remain present for rollback-compatible test
-- setup only. They stay unreachable from every API role, including the issuer.
revoke all on function public.create_guardian_invitation_v1(
  uuid, text, text, text, text, timestamptz, text
) from public, anon, authenticated, service_role, family_invitation_issuer;
revoke all on function public.resend_guardian_invitation_v1(
  uuid, text, text, timestamptz, text
) from public, anon, authenticated, service_role, family_invitation_issuer;

revoke execute on all functions in schema public from public;

comment on role family_invitation_issuer is
  'NOLOGIN PostgREST role for consuming one-use admin attestations. Authenticator may SET ROLE only from a separately signed, short-lived server JWT.';
comment on function public.authorize_guardian_invitation_creation_v1(
  uuid, text, text
) is
  'Authenticated admin preflight only. Creates no invitation or outbox row; returns a 90-second resource-bound one-use capability.';
comment on function public.create_guardian_invitation_v1(
  uuid, uuid, uuid, text, text, text, text, timestamptz, text
) is
  'Dedicated issuer only. Consumes a database-minted capability, rechecks the current admin scope, and accepts only purpose-bound v2 ciphertext envelopes.';

commit;
