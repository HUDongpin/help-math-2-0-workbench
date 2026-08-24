-- HELP Math Family Portal: bind production authorization to the live
-- Supabase Auth session registry. Access-token signature/expiry alone cannot
-- prove an administrator or guardian session was not revoked meanwhile.

begin;

alter table public.tenant_identity_issuers
  add column requires_database_session boolean not null default false;
alter table public.tenant_identity_issuers
  add constraint tenant_identity_issuers_production_session check (
    data_mode <> 'production' or requires_database_session
  );

alter table public.family_invitation_issuance_attestations
  add column actor_session_id uuid;
alter table public.family_invitation_issuance_attestations
  add constraint family_invitation_attestations_actor_session check (
    (data_mode = 'synthetic' and actor_session_id is null)
    or (data_mode = 'production' and actor_session_id is not null)
  );

create or replace function private.family_provider_session_is_current_v1(
  p_issuer text,
  p_subject text,
  p_session_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_requires_session boolean;
  v_session_id uuid := p_session_id;
  v_subject_id uuid;
  v_current boolean := false;
begin
  select exists (
    select 1
    from public.tenant_identity_issuers as allowed
    where allowed.issuer = p_issuer
      and allowed.active
      and allowed.requires_database_session
  ) into v_requires_session;
  if not v_requires_session then
    return true;
  end if;

  begin
    v_subject_id := p_subject::uuid;
    if v_session_id is null then
      if private.jwt_claim('role') is distinct from 'authenticated'
        or private.jwt_claim('iss') is distinct from p_issuer
        or private.jwt_claim('sub') is distinct from p_subject
      then
        return false;
      end if;
      v_session_id := private.jwt_claim('session_id')::uuid;
    end if;
  exception when others then
    return false;
  end;

  if to_regclass('auth.sessions') is null then
    return false;
  end if;
  begin
    execute
      'select exists (select 1 from auth.sessions where id = $1 and user_id = $2 and (not_after is null or not_after > statement_timestamp()))'
      into v_current
      using v_session_id, v_subject_id;
  exception when undefined_table or undefined_column or insufficient_privilege then
    return false;
  end;
  return coalesce(v_current, false);
end;
$$;

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
    and private.family_provider_session_is_current_v1(
      identity.issuer, identity.subject, null
    )
  limit 1;
$$;

create or replace function private.bind_family_invitation_actor_session_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_claim_session_id uuid;
begin
  if new.data_mode = 'synthetic' then
    if new.actor_session_id is not null then
      raise exception using errcode = '42501',
        message = 'invitation actor session mismatch';
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    begin
      if private.jwt_claim('role') is distinct from 'authenticated'
        or private.jwt_claim('iss') is distinct from new.actor_issuer
        or private.jwt_claim('sub') is distinct from new.actor_subject
      then
        raise exception 'invalid claims';
      end if;
      v_claim_session_id := private.jwt_claim('session_id')::uuid;
    exception when others then
      raise exception using errcode = '42501',
        message = 'current production provider session required';
    end;
    if not private.family_provider_session_is_current_v1(
      new.actor_issuer, new.actor_subject, v_claim_session_id
    ) then
      raise exception using errcode = '42501',
        message = 'current production provider session required';
    end if;
    new.actor_session_id := v_claim_session_id;
    return new;
  end if;

  if new.actor_session_id is distinct from old.actor_session_id then
    raise exception using errcode = '42501',
      message = 'invitation actor session is immutable';
  end if;
  if private.jwt_claim('role') = 'authenticated' then
    begin
      v_claim_session_id := private.jwt_claim('session_id')::uuid;
    exception when others then
      raise exception using errcode = '42501',
        message = 'current production provider session required';
    end;
    if v_claim_session_id is distinct from old.actor_session_id then
      raise exception using errcode = '42501',
        message = 'current production provider session required';
    end if;
  end if;
  if not private.family_provider_session_is_current_v1(
    old.actor_issuer, old.actor_subject, old.actor_session_id
  ) then
    raise exception using errcode = '42501',
      message = 'current production provider session required';
  end if;
  return new;
end;
$$;

create trigger family_invitation_attestations_actor_session
before insert or update on public.family_invitation_issuance_attestations
for each row execute function private.bind_family_invitation_actor_session_v1();

-- Invitation acceptance is unusual because a verified adult might not have an
-- app_user/provider_identity mapping until this transaction creates one.  The
-- ordinary family_current_app_user_id_v1 guard therefore cannot run before the
-- identity bootstrap.  Bind the terminal pending -> accepted transition to the
-- live provider session instead, after the invitation itself has established
-- the authoritative tenant/data mode and before any part of the transaction
-- can commit.
create or replace function private.enforce_production_invitation_terminal_session_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
begin
  if old.data_mode = 'production'
    and old.status = 'pending'
    and new.status in ('accepted', 'revoked')
    and not private.family_provider_session_is_current_v1(
      private.jwt_claim('iss'), private.jwt_claim('sub'), null
    )
  then
    raise exception using errcode = '42501',
      message = 'current production provider session required';
  end if;
  return new;
end;
$$;

create trigger guardian_invitations_production_accept_session
before update on public.guardian_invitations
for each row
execute function private.enforce_production_invitation_terminal_session_v1();

-- A newly invited adult can have a valid verified Supabase session before an
-- app_user/provider_identity mapping exists.  Declining must not force the
-- adult to accept merely to create that mapping.  Synthetic behavior keeps its
-- existing mapped-user requirement; production instead binds the exact tenant
-- issuer and live auth.sessions row, then records a nullable actor until the
-- school-approved identity bootstrap has actually occurred.
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
  v_issuer text := private.jwt_claim('iss');
  v_subject text := private.jwt_claim('sub');
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if p_token_digest !~ '^[0-9a-f]{64}$'
    or p_verified_email_digest !~ '^[0-9a-f]{64}$'
  then return; end if;

  select * into v_invitation
  from public.guardian_invitations
  where token_digest = p_token_digest
  for update;
  if v_invitation.id is null
    or v_invitation.recipient_email_digest <> p_verified_email_digest
  then return; end if;

  if v_invitation.data_mode = 'production' then
    if private.jwt_claim('role') is distinct from 'authenticated'
      or v_issuer is null or v_subject is null
      or not exists (
        select 1
        from public.tenant_identity_issuers as allowed
        where allowed.tenant_id = v_invitation.tenant_id
          and allowed.issuer = v_issuer
          and allowed.active
          and allowed.requires_database_session
      )
      or not private.family_provider_session_is_current_v1(
        v_issuer, v_subject, null
      )
    then
      raise exception using errcode = '42501',
        message = 'current production provider session required';
    end if;
    select public.family_current_app_user_id_v1() into v_actor_id;
  else
    v_actor_id := private.require_family_app_user();
  end if;

  if v_invitation.status = 'revoked'
    and v_invitation.revocation_idempotency_key = p_idempotency_key
    and v_invitation.revoked_by_user_id is not distinct from v_actor_id
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

-- Rebind the production administrator predicate used by both authenticated
-- attestation preflight and the dedicated issuer consumption path. During
-- consumption the attestation trigger independently checks the stored session.
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
        or (
          allowed_issuer.requires_database_session
          and private.family_production_invitation_retention_ready_v1(tenant.id)
        )
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

revoke all on function private.family_provider_session_is_current_v1(
  text, text, uuid
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.family_current_app_user_id_v1()
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function private.bind_family_invitation_actor_session_v1()
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function
  private.enforce_production_invitation_terminal_session_v1()
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function private.family_invitation_admin_is_current_v1(
  uuid, uuid, uuid, text, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.decline_guardian_invitation_v1(text, text, text)
  from public, anon, service_role,
    family_invitation_issuer, family_webhook_writer;
grant execute on function public.decline_guardian_invitation_v1(
  text, text, text
) to authenticated;

comment on column public.tenant_identity_issuers.requires_database_session is
  'Production providers must bind every Family authorization to a live auth.sessions row so local/others/global provider revocation takes effect at the database boundary.';
comment on column public.family_invitation_issuance_attestations.actor_session_id is
  'Production attestations bind the creating administrator session; issuer consumption fails atomically after that session is revoked.';
comment on function private.enforce_production_invitation_terminal_session_v1() is
  'Fails closed when a production invitation would be accepted or revoked from a provider session absent from the live auth.sessions registry.';

commit;
