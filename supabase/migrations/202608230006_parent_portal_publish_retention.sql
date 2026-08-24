-- HELP Math family portal: retention-gated publishing and bounded purge worker.

begin;

create or replace function private.family_retention_delete_allowed_v1(
  p_tenant_id uuid,
  p_data_class public.retention_data_class
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select case
    when exists (
      select 1 from public.retention_policies as hold
      where hold.tenant_id = t.id
        and hold.data_class = p_data_class
        and hold.legal_hold
    ) then false
    when t.data_mode = 'synthetic' then true
    else exists (
      select 1 from public.retention_policies as rp
      where rp.tenant_id = t.id
        and rp.data_class = p_data_class
        and rp.enabled
        and not rp.legal_hold
        and rp.approved_at is not null
        and rp.approved_by_user_id is not null
    )
  end
  from public.tenants as t
  where t.id = p_tenant_id;
$$;

create or replace function public.publish_school_announcement_v1(
  p_school_id uuid,
  p_title text,
  p_body text,
  p_idempotency_key text,
  p_expires_at timestamptz default null
)
returns table (announcement_id uuid, published_at timestamptz, expires_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_school public.schools%rowtype;
  v_announcement public.school_announcements%rowtype;
  v_retention_days integer;
  v_max_expiry timestamptz;
  v_expiry timestamptz;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if p_title is null or p_title <> btrim(p_title)
    or char_length(p_title) not between 1 and 200
    or p_body is null or p_body <> btrim(p_body)
    or char_length(p_body) not between 1 and 2000
    or p_title ~ '[[:cntrl:]]' or p_body ~ '[[:cntrl:]]'
  then
    raise exception using errcode = '22023', message = 'invalid announcement';
  end if;
  v_actor_id := private.require_family_app_user();
  select * into v_school from public.schools where id = p_school_id and active;
  if v_school.id is null or not public.family_has_role_v1(
    v_school.tenant_id,
    array['teacher', 'school_admin', 'district_admin']::public.app_role[],
    v_school.id,
    null
  ) then
    raise exception using errcode = 'P0002', message = 'school not found';
  end if;

  select * into v_announcement
  from public.school_announcements
  where tenant_id = v_school.tenant_id
    and publisher_user_id = v_actor_id
    and idempotency_key = p_idempotency_key;
  if v_announcement.id is not null then
    if v_announcement.school_id <> p_school_id
      or v_announcement.title <> p_title or v_announcement.body <> p_body
    then
      raise exception using errcode = '22023', message = 'idempotency key conflict';
    end if;
    return query select
      v_announcement.id, v_announcement.published_at, v_announcement.expires_at;
    return;
  end if;

  v_retention_days := private.family_retention_days_v1(
    v_school.tenant_id, 'school_announcement'
  );
  if v_retention_days is null then
    raise exception using errcode = '42501',
      message = 'approved announcement retention policy required';
  end if;
  v_max_expiry := statement_timestamp() + make_interval(days => v_retention_days);
  v_expiry := coalesce(p_expires_at, v_max_expiry);
  if v_expiry <= statement_timestamp() or v_expiry > v_max_expiry then
    raise exception using errcode = '22023', message = 'announcement expiry out of range';
  end if;

  insert into public.school_announcements (
    tenant_id, environment_id, data_mode, school_id, publisher_user_id,
    idempotency_key, title, body, published_at, retention_anchor_at, expires_at
  ) values (
    v_school.tenant_id, v_school.environment_id, v_school.data_mode,
    v_school.id, v_actor_id, p_idempotency_key, p_title, p_body,
    clock_timestamp(), statement_timestamp(), v_expiry
  ) returning * into v_announcement;
  return query select
    v_announcement.id, v_announcement.published_at, v_announcement.expires_at;
end;
$$;

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
  v_tenant public.tenants%rowtype;
  v_run_id uuid;
  v_count integer;
  v_counts jsonb;
  v_runs jsonb := '[]'::jsonb;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_batch_size not between 1 and 10000 then
    raise exception using errcode = '22023', message = 'retention batch out of range';
  end if;
  perform set_config('help_math.family_retention', 'on', true);

  for v_tenant in
    select * from public.tenants order by id
  loop
    insert into public.retention_runs (
      tenant_id, environment_id, data_mode, status, cutoff_snapshot
    ) values (
      v_tenant.id, v_tenant.environment_id, v_tenant.data_mode, 'running',
      jsonb_build_object('cutoffAt', statement_timestamp(), 'batchSize', p_batch_size)
    ) returning id into v_run_id;
    v_counts := '{}'::jsonb;

    begin
      update public.guardian_links
      set status = 'expired', expired_at = clock_timestamp()
      where tenant_id = v_tenant.id and status in ('pending', 'active')
        and expires_at is not null and expires_at <= statement_timestamp();
      get diagnostics v_count = row_count;
      v_counts := v_counts || jsonb_build_object('expiredGuardianLinks', v_count);

      update public.guardian_invitations
      set status = 'expired'
      where tenant_id = v_tenant.id and status = 'pending'
        and expires_at <= statement_timestamp();
      get diagnostics v_count = row_count;
      v_counts := v_counts || jsonb_build_object('expiredInvitations', v_count);

      update public.notification_outbox
      set status = 'cancelled', claimed_at = null, claim_token = null,
          claim_expires_at = null
      where tenant_id = v_tenant.id
        and status = 'pending'
        and expires_at <= statement_timestamp();
      get diagnostics v_count = row_count;
      v_counts := v_counts || jsonb_build_object('expiredOutbox', v_count);

      update public.notification_outbox
      set status = 'failed', claimed_at = null, claim_token = null,
          claim_expires_at = null
      where tenant_id = v_tenant.id
        and status = 'pending'
        and attempts >= 4
        and (
          claim_token is null
          or claim_expires_at <= statement_timestamp()
        );
      get diagnostics v_count = row_count;
      v_counts := v_counts || jsonb_build_object('exhaustedOutbox', v_count);

      update public.notification_outbox
      set claimed_at = null, claim_token = null, claim_expires_at = null
      where tenant_id = v_tenant.id
        and status = 'pending'
        and attempts < 4
        and claim_token is not null
        and claim_expires_at <= statement_timestamp();
      get diagnostics v_count = row_count;
      v_counts := v_counts || jsonb_build_object('releasedOutboxLeases', v_count);

      if private.family_retention_delete_allowed_v1(
        v_tenant.id, 'family_message'
      ) then
        delete from public.family_messages
        where ctid in (
          select ctid from public.family_messages
          where tenant_id = v_tenant.id and expires_at <= statement_timestamp()
          order by expires_at limit p_batch_size
        );
        get diagnostics v_count = row_count;
        v_counts := v_counts || jsonb_build_object('familyMessages', v_count);
      end if;

      if private.family_retention_delete_allowed_v1(
        v_tenant.id, 'learning_event'
      ) then
        delete from public.learning_events_v2
        where ctid in (
          select ctid from public.learning_events_v2
          where tenant_id = v_tenant.id and expires_at <= statement_timestamp()
          order by expires_at limit p_batch_size
        );
        get diagnostics v_count = row_count;
        v_counts := v_counts || jsonb_build_object('learningEvents', v_count);
        delete from public.progress_projections_v1
        where ctid in (
          select ctid from public.progress_projections_v1
          where tenant_id = v_tenant.id and expires_at <= statement_timestamp()
          order by expires_at limit p_batch_size
        );
        get diagnostics v_count = row_count;
        v_counts := v_counts || jsonb_build_object('progressProjections', v_count);
        delete from public.skill_projections_v1
        where ctid in (
          select ctid from public.skill_projections_v1
          where tenant_id = v_tenant.id and expires_at <= statement_timestamp()
          order by expires_at limit p_batch_size
        );
        get diagnostics v_count = row_count;
        v_counts := v_counts || jsonb_build_object('skillProjections', v_count);
      end if;

      if private.family_retention_delete_allowed_v1(
        v_tenant.id, 'guardian_invitation'
      ) then
        delete from public.guardian_invitations
        where ctid in (
          select ctid from public.guardian_invitations
          where tenant_id = v_tenant.id and expires_at <= statement_timestamp()
            and status in ('accepted', 'revoked', 'expired')
          order by expires_at limit p_batch_size
        );
        get diagnostics v_count = row_count;
        v_counts := v_counts || jsonb_build_object('guardianInvitations', v_count);
      end if;

      if private.family_retention_delete_allowed_v1(
        v_tenant.id, 'school_announcement'
      ) then
        delete from public.school_announcements
        where ctid in (
          select ctid from public.school_announcements
          where tenant_id = v_tenant.id and expires_at <= statement_timestamp()
          order by expires_at limit p_batch_size
        );
        get diagnostics v_count = row_count;
        v_counts := v_counts || jsonb_build_object('schoolAnnouncements', v_count);
      end if;

      if private.family_retention_delete_allowed_v1(
        v_tenant.id, 'email_delivery_event'
      ) then
        delete from public.email_delivery_events
        where ctid in (
          select ctid from public.email_delivery_events
          where tenant_id = v_tenant.id and expires_at <= statement_timestamp()
          order by expires_at limit p_batch_size
        );
        get diagnostics v_count = row_count;
        v_counts := v_counts || jsonb_build_object('emailDeliveryEvents', v_count);
      end if;

      if private.family_retention_delete_allowed_v1(
        v_tenant.id, 'notification_outbox'
      ) then
        delete from public.notification_outbox
        where ctid in (
          select ctid from public.notification_outbox
          where tenant_id = v_tenant.id and expires_at <= statement_timestamp()
            and status <> 'pending'
          order by expires_at limit p_batch_size
        );
        get diagnostics v_count = row_count;
        v_counts := v_counts || jsonb_build_object('notificationOutbox', v_count);
      end if;

      if private.family_retention_delete_allowed_v1(
        v_tenant.id, 'audit_event'
      ) then
        delete from public.audit_events
        where ctid in (
          select ctid from public.audit_events
          where tenant_id = v_tenant.id and expires_at <= statement_timestamp()
          order by expires_at limit p_batch_size
        );
        get diagnostics v_count = row_count;
        v_counts := v_counts || jsonb_build_object('auditEvents', v_count);
      end if;

      update public.retention_runs
      set status = 'succeeded', deleted_counts = v_counts,
          completed_at = clock_timestamp()
      where tenant_id = v_tenant.id and id = v_run_id;
      v_runs := v_runs || jsonb_build_array(jsonb_build_object(
        'tenantId', v_tenant.id, 'runId', v_run_id,
        'status', 'succeeded', 'deletedCounts', v_counts
      ));
    exception when others then
      update public.retention_runs
      set status = 'failed', error_code = 'RETENTION_FAILED',
          completed_at = clock_timestamp()
      where tenant_id = v_tenant.id and id = v_run_id;
      -- Retention is fail-closed: a tenant failure aborts the RPC instead of
      -- returning a success-shaped JSON value that a worker could ignore.
      raise;
    end;
  end loop;
  return jsonb_build_object('runs', v_runs);
end;
$$;

revoke all on function private.family_retention_delete_allowed_v1(
  uuid, public.retention_data_class
) from public;
revoke all on function public.publish_school_announcement_v1(
  uuid, text, text, text, timestamptz
) from public;
revoke all on function public.run_family_retention_v1(integer) from public;

grant execute on function public.publish_school_announcement_v1(
  uuid, text, text, text, timestamptz
) to authenticated;
grant execute on function public.run_family_retention_v1(integer)
  to service_role;

comment on function public.publish_school_announcement_v1(
  uuid, text, text, text, timestamptz
) is
  'Resource-derived school/tenant publish path; production fails closed without an approved active retention policy.';
comment on function public.run_family_retention_v1(integer) is
  'Service-only bounded purge. Legal holds always win; audit and message deletion require the retention worker transaction flag.';

commit;
