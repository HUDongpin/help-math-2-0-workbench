-- HELP Math Family Portal: signed-identity aggregate budget for invitation
-- acceptance probes that cannot be mapped to a tenant or invitation.
--
-- This is deliberately not an IP/WAF control. It derives a high-entropy digest
-- from the verified JWT issuer+subject, stores no raw claim/token/email/session,
-- and keeps only two short fixed windows. Anonymous network volumetric defense
-- remains a deployment/release requirement.

begin;

create type public.family_invitation_probe_operation as enum (
  'accept_probe_ten_minute',
  'accept_probe_day'
);

create table public.family_invitation_probe_windows (
  id uuid primary key default extensions.gen_random_uuid(),
  operation public.family_invitation_probe_operation not null,
  identity_digest text not null,
  window_started_at timestamptz not null,
  request_count smallint not null,
  retention_anchor_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint family_invitation_probe_windows_one_bucket
    unique (operation, identity_digest, window_started_at),
  constraint family_invitation_probe_windows_digest check (
    identity_digest ~ '^[0-9a-f]{64}$'
  ),
  constraint family_invitation_probe_windows_count check (
    request_count between 1 and case operation
      when 'accept_probe_ten_minute' then 20
      when 'accept_probe_day' then 100
    end
  ),
  constraint family_invitation_probe_windows_retention check (
    retention_anchor_at = window_started_at
    and expires_at > retention_anchor_at
    and expires_at <= retention_anchor_at + interval '2 days'
  )
);

create index family_invitation_probe_windows_expiry_idx
  on public.family_invitation_probe_windows (expires_at, id);

alter table public.family_invitation_probe_windows enable row level security;

create or replace function private.consume_family_invitation_probe_budget_v1()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
set row_security = off
as $$
declare
  v_issuer text := private.jwt_claim('iss');
  v_subject text := private.jwt_claim('sub');
  v_identity_digest text;
  v_operation public.family_invitation_probe_operation;
  v_limit integer;
  v_window_seconds integer;
  v_window_started_at timestamptz;
  v_count integer;
begin
  if private.jwt_claim('role') is distinct from 'authenticated'
    or v_issuer is null or char_length(v_issuer) not between 1 and 512
    or v_subject is null or char_length(v_subject) not between 1 and 512
    or v_issuer ~ '[[:cntrl:]]' or v_subject ~ '[[:cntrl:]]'
    or not private.family_provider_session_is_current_v1(
      v_issuer, v_subject, null
    )
  then
    raise exception using errcode = '42501',
      message = 'current provider identity required';
  end if;

  v_identity_digest := encode(
    extensions.digest(
      convert_to(v_issuer || chr(31) || v_subject, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  -- The caught private exception rolls both window increments back, so a
  -- denied day or ten-minute slot cannot consume only the other window.
  begin
    foreach v_operation in array array[
      'accept_probe_ten_minute'::public.family_invitation_probe_operation,
      'accept_probe_day'::public.family_invitation_probe_operation
    ]
    loop
      if v_operation = 'accept_probe_ten_minute' then
        v_limit := 20;
        v_window_seconds := 600;
      else
        v_limit := 100;
        v_window_seconds := 86400;
      end if;
      v_window_started_at := to_timestamp(
        floor(extract(epoch from statement_timestamp()) / v_window_seconds)
          * v_window_seconds
      );
      v_count := null;
      insert into public.family_invitation_probe_windows (
        operation, identity_digest, window_started_at, request_count,
        retention_anchor_at, expires_at
      ) values (
        v_operation, v_identity_digest, v_window_started_at, 1,
        v_window_started_at,
        v_window_started_at + case v_operation
          when 'accept_probe_ten_minute' then interval '1 day'
          else interval '2 days'
        end
      )
      on conflict on constraint family_invitation_probe_windows_one_bucket
      do update set
        request_count = family_invitation_probe_windows.request_count + 1,
        updated_at = clock_timestamp()
      where family_invitation_probe_windows.request_count < v_limit
      returning request_count into v_count;
      if v_count is null then
        raise exception using errcode = 'P0010',
          message = 'invitation probe budget unavailable';
      end if;
    end loop;
    return true;
  exception when sqlstate 'P0010' then
    return false;
  end;
end;
$$;

alter function public.accept_guardian_invitation_v1(text, text, text)
  rename to accept_guardian_invitation_pre_probe_budget_v1;

revoke all on function public.accept_guardian_invitation_pre_probe_budget_v1(
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
  v_actor_id uuid;
  v_exact_replay boolean := false;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if private.jwt_claim('role') is distinct from 'authenticated'
    or private.jwt_claim('iss') is null
    or private.jwt_claim('sub') is null
  then
    raise exception using errcode = '42501',
      message = 'provider identity required';
  end if;

  -- A previously committed exact immutable replay is free. The mapped actor,
  -- token, verified-email proof and idempotency key must all match; every other
  -- malformed, unknown, failed, or first successful attempt consumes the
  -- signed-identity aggregate budget before entering the invitation core.
  if p_token_digest ~ '^[0-9a-f]{64}$'
    and p_verified_email_digest ~ '^[0-9a-f]{64}$'
  then
    select * into v_invitation
    from public.guardian_invitations
    where token_digest = p_token_digest;
    if v_invitation.id is not null
      and v_invitation.status = 'accepted'
      and v_invitation.recipient_email_digest = p_verified_email_digest
      and v_invitation.acceptance_idempotency_key = p_idempotency_key
    then
      select public.family_current_app_user_id_v1() into v_actor_id;
      v_exact_replay := v_actor_id is not null
        and v_invitation.accepted_by_user_id = v_actor_id;
    end if;
  end if;

  if not v_exact_replay
    and not private.consume_family_invitation_probe_budget_v1()
  then
    return;
  end if;

  return query
  select accepted.guardian_link_id, accepted.student_id, accepted.tenant_id
  from public.accept_guardian_invitation_pre_probe_budget_v1(
    p_token_digest, p_verified_email_digest, p_idempotency_key
  ) as accepted;
end;
$$;

alter function public.run_family_retention_v1(integer)
  rename to run_family_retention_pre_invitation_probe_v1;

revoke all on function public.run_family_retention_pre_invitation_probe_v1(
  integer
) from public, anon, authenticated, service_role,
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
begin
  if private.jwt_claim('role') is distinct from 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_batch_size not between 1 and 10000 then
    raise exception using errcode = '22023',
      message = 'retention batch out of range';
  end if;
  v_previous := public.run_family_retention_pre_invitation_probe_v1(
    p_batch_size
  );
  if jsonb_typeof(v_previous -> 'runs') <> 'array' then
    raise exception using errcode = 'XX000',
      message = 'invalid retention receipt';
  end if;
  delete from public.family_invitation_probe_windows
  where id in (
    select id from public.family_invitation_probe_windows
    where expires_at <= statement_timestamp()
    order by expires_at, id
    limit p_batch_size
    for update skip locked
  );
  return v_previous;
end;
$$;

revoke all on table public.family_invitation_probe_windows
  from public, anon, authenticated, service_role,
    family_invitation_issuer, family_webhook_writer;
revoke all on function private.consume_family_invitation_probe_budget_v1()
  from public;
revoke all on function public.accept_guardian_invitation_v1(
  text, text, text
) from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;
revoke all on function public.run_family_retention_v1(integer)
  from public, anon, authenticated, service_role,
  family_invitation_issuer, family_webhook_writer;

grant execute on function public.accept_guardian_invitation_v1(
  text, text, text
) to authenticated;
grant execute on function public.run_family_retention_v1(integer)
  to service_role;

comment on table public.family_invitation_probe_windows is
  'Deny-by-default signed-identity invitation-accept probe counters. Stores only SHA-256(issuer+separator+subject), fixed windows/counts, and <=2-day lifecycle metadata; never token, email, raw claims, IP, or session identifiers.';
comment on function public.accept_guardian_invitation_v1(text, text, text) is
  'Authenticated no-existence-leak acceptance wrapper with 20/10-minute and 100/day signed-identity aggregate budgets. Exact committed immutable replay is free; anonymous edge/WAF protection remains external.';
comment on function public.run_family_retention_v1(integer) is
  'Service-only existing retention transaction plus bounded global invitation-probe window cleanup; the public receipt shape remains unchanged.';

commit;
