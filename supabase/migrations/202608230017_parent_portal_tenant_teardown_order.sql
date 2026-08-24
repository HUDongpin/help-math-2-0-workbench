-- HELP Math Family Portal: make tenant teardown honor relationship-trigger
-- lock/order requirements. The class-to-teacher binding must become inactive
-- while its school teacher role is still active; both transitions remain in
-- the same transaction and the tenant row remains the serialization lock.

begin;

create or replace function public.begin_family_tenant_teardown_v1(
  p_tenant_id uuid,
  p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_tenant public.tenants%rowtype;
  v_days integer;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  perform private.assert_family_idempotency_key(p_idempotency_key);
  select * into v_tenant from public.tenants where id = p_tenant_id for update;
  if v_tenant.id is null then
    raise exception using errcode = 'P0002', message = 'tenant not found';
  end if;
  if v_tenant.status = 'closed' then
    if v_tenant.teardown_idempotency_key = p_idempotency_key then return; end if;
    raise exception using errcode = '22023', message = 'tenant teardown conflict';
  end if;
  if v_tenant.data_mode = 'production' and exists (
    select 1
    from unnest(enum_range(null::public.retention_data_class)) as required(data_class)
    where private.family_approved_retention_days_v2(
      v_tenant.id, required.data_class
    ) is null
  ) then
    raise exception using errcode = '42501',
      message = 'complete approved tenant retention policy required';
  end if;
  v_days := private.family_approved_retention_days_v2(v_tenant.id, 'tenant_fixture');
  if v_days is null then
    raise exception using errcode = '42501',
      message = 'approved tenant teardown policy required';
  end if;

  update public.tenants
  set family_portal_enabled = false, status = 'closed', closed_at = clock_timestamp(),
      teardown_idempotency_key = p_idempotency_key,
      lifecycle_expires_at = least(
        coalesce(lifecycle_expires_at, statement_timestamp() + make_interval(days => v_days)),
        statement_timestamp() + make_interval(days => v_days)
      )
  where id = v_tenant.id;

  -- private.validate_family_relationship() requires the teacher role to be
  -- active while this child binding transitions to inactive. Reversing these
  -- two statements makes teardown fail and roll back for any staffed class.
  update public.class_staff_bindings
  set active = false, ends_at = coalesce(ends_at, clock_timestamp())
  where tenant_id = v_tenant.id and active;
  update public.role_bindings
  set active = false, ends_at = coalesce(ends_at, clock_timestamp())
  where tenant_id = v_tenant.id and active;

  update public.guardian_links
  set status = 'expired', expired_at = coalesce(expired_at, clock_timestamp())
  where tenant_id = v_tenant.id and status in ('pending', 'active');
  update public.guardian_invitations set status = 'expired'
  where tenant_id = v_tenant.id and status = 'pending';
  update public.family_threads
  set status = 'closed', closed_at = coalesce(closed_at, clock_timestamp())
  where tenant_id = v_tenant.id and status = 'open';
  update public.family_notification_preferences
  set message_email_enabled = false, weekly_digest_enabled = false
  where tenant_id = v_tenant.id;
  update public.notification_outbox
  set status = 'cancelled', claimed_at = null, claim_token = null,
      claim_expires_at = null
  where tenant_id = v_tenant.id and status = 'pending';
end;
$$;

revoke all on function public.begin_family_tenant_teardown_v1(uuid, text)
  from public, anon, authenticated, family_webhook_writer,
    family_invitation_issuer;
grant execute on function public.begin_family_tenant_teardown_v1(uuid, text)
  to service_role;

commit;
