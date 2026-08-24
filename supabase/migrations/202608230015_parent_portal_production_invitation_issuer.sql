-- HELP Math Family Portal: reviewed production invitation issuance boundary.
--
-- The browser still cannot issue invitations directly. An authenticated
-- school/district administrator may mint a one-use, resource-bound
-- attestation; only the dedicated NOLOGIN PostgREST issuer role can consume
-- it. Production is additionally fail-closed on current identity/enrollment,
-- an exact issuer configuration, and approved retention for every record the
-- invitation/acceptance lifecycle can create.

begin;

alter table public.guardian_invitations
  drop constraint guardian_invitations_recipient_policy;
alter table public.guardian_invitations
  add constraint guardian_invitations_recipient_policy check (
    recipient_policy in (
      'legacy-unverified',
      'school-verified-production',
      'synthetic-invalid-only'
    )
  );

create or replace function private.family_production_invitation_retention_ready_v1(
  p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select count(*) = 7
  from (
    values
      ('guardian_invitation'::public.retention_data_class),
      ('notification_outbox'::public.retention_data_class),
      ('audit_event'::public.retention_data_class),
      ('app_user_contact'::public.retention_data_class),
      ('provider_identity'::public.retention_data_class),
      ('role_binding'::public.retention_data_class),
      ('guardian_link'::public.retention_data_class)
  ) as required(data_class)
  where private.family_approved_retention_days_v2(
    p_tenant_id, required.data_class
  ) is not null;
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
set search_path = pg_catalog, public, private
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
      and tenant.data_mode in ('synthetic', 'production')
      and (tenant.lifecycle_expires_at is null
        or tenant.lifecycle_expires_at > statement_timestamp())
      and (
        tenant.data_mode = 'synthetic'
        or private.family_production_invitation_retention_ready_v1(tenant.id)
      )
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
      and (tenant.lifecycle_expires_at is null
        or tenant.lifecycle_expires_at > statement_timestamp())
      and tenant.data_mode in ('synthetic', 'production')
      and config.data_mode = tenant.data_mode
      and (
        tenant.data_mode = 'synthetic'
        or private.family_production_invitation_retention_ready_v1(tenant.id)
      )
  ) then
    raise exception using errcode = '42501',
      message = 'dedicated family invitation issuer required';
  end if;
  return v_jti::uuid;
end;
$$;

-- This owner-only core is consumed only through the exact-material wrapper
-- installed by migration 011. The caller cannot choose the recipient policy;
-- it is derived from the attested tenant data mode.
create or replace function public.create_guardian_invitation_unchecked_replay_core_v1(
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
  v_recipient_policy text;
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
  v_recipient_policy := case v_attestation.data_mode
    when 'synthetic' then 'synthetic-invalid-only'
    when 'production' then 'school-verified-production'
    else null
  end;
  if v_recipient_policy is null
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
      or v_invitation.recipient_policy <> v_recipient_policy
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
  if v_student.id is null
    or v_student.data_mode <> v_attestation.data_mode
  then
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
    v_recipient_policy, statement_timestamp(), p_expires_at
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

create or replace function public.resend_guardian_invitation_unchecked_replay_core_v1(
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
  v_recipient_policy text;
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
  v_recipient_policy := case v_attestation.data_mode
    when 'synthetic' then 'synthetic-invalid-only'
    when 'production' then 'school-verified-production'
    else null
  end;
  if v_recipient_policy is null
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
  if v_invitation.recipient_policy <> v_recipient_policy then
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

revoke all on function private.family_production_invitation_retention_ready_v1(
  uuid
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function private.family_invitation_admin_is_current_v1(
  uuid, uuid, uuid, text, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function private.require_family_invitation_issuer_v1(uuid)
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
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

-- Reassert the public gateway ACL after replacing owner-only helpers. The
-- dedicated issuer keeps exactly the two material-consuming RPCs.
revoke all on function public.create_guardian_invitation_v1(
  uuid, uuid, uuid, text, text, text, text, timestamptz, text
) from public, anon, authenticated, service_role, family_webhook_writer;
revoke all on function public.resend_guardian_invitation_v1(
  uuid, uuid, text, text, timestamptz, text
) from public, anon, authenticated, service_role, family_webhook_writer;
grant execute on function public.create_guardian_invitation_v1(
  uuid, uuid, uuid, text, text, text, text, timestamptz, text
) to family_invitation_issuer;
grant execute on function public.resend_guardian_invitation_v1(
  uuid, uuid, text, text, timestamptz, text
) to family_invitation_issuer;

comment on function private.family_production_invitation_retention_ready_v1(
  uuid
) is
  'Production invitation issuance requires approved, active, non-hold retention for invitation, outbox, audit, identity, role, and guardian-link records.';
comment on constraint guardian_invitations_recipient_policy
  on public.guardian_invitations is
  'Recipient handling is explicit: legacy rows remain inert, synthetic rows are loopback-only, and production rows require a school-verified address plus the dedicated issuer path.';

commit;
