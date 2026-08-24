-- HELP Math family portal: revocation, messaging, learning ingestion, and outbox RPCs.

begin;

do $webhook_role$
begin
  if not exists (
    select 1 from pg_catalog.pg_roles where rolname = 'family_webhook_writer'
  ) then
    execute 'create role family_webhook_writer nologin noinherit';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_roles
    where rolname = 'family_webhook_writer'
      and (
        rolcanlogin or rolinherit or rolsuper or rolbypassrls
        or rolcreatedb or rolcreaterole or rolreplication
      )
  ) then
    raise exception using errcode = '42501',
      message = 'unsafe pre-existing family webhook writer role';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_auth_members as membership
    join pg_catalog.pg_roles as member_role
      on member_role.oid = membership.member
    where member_role.rolname = 'family_webhook_writer'
  ) then
    raise exception using errcode = '42501',
      message = 'family webhook writer must not inherit role memberships';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_auth_members as membership
    join pg_catalog.pg_roles as granted_role
      on granted_role.oid = membership.roleid
    join pg_catalog.pg_roles as member_role
      on member_role.oid = membership.member
    where granted_role.rolname = 'family_webhook_writer'
      and (member_role.rolname <> 'authenticator' or membership.admin_option)
  ) then
    raise exception using errcode = '42501',
      message = 'unexpected family webhook writer role membership';
  end if;
end;
$webhook_role$;

grant family_webhook_writer to authenticator;

create or replace function private.family_retention_days_v1(
  p_tenant_id uuid,
  p_data_class public.retention_data_class
)
returns integer
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select case
    when t.data_mode = 'synthetic' then least(
      30,
      coalesce((
        select rp.retention_days
        from public.retention_policies as rp
        where rp.tenant_id = t.id
          and rp.data_class = p_data_class
          and rp.enabled and not rp.legal_hold
        limit 1
      ), 30)
    )
    else (
      select rp.retention_days
      from public.retention_policies as rp
      where rp.tenant_id = t.id
        and rp.data_class = p_data_class
        and rp.enabled
        and not rp.legal_hold
        and rp.approved_at is not null
        and rp.approved_by_user_id is not null
      limit 1
    )
  end
  from public.tenants as t
  where t.id = p_tenant_id
    and t.status = 'active'
    and t.family_portal_enabled;
$$;

create or replace function public.revoke_guardian_link_v1(
  p_guardian_link_id uuid,
  p_idempotency_key text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_link public.guardian_links%rowtype;
  v_guardian public.app_users%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if p_reason is null or char_length(btrim(p_reason)) not between 1 and 500 then
    raise exception using errcode = '22023', message = 'invalid revocation reason';
  end if;
  v_actor_id := private.require_family_app_user();
  select * into v_link from public.guardian_links
  where id = p_guardian_link_id for update;
  if v_link.id is null
    or not public.family_can_manage_student_v1(v_link.tenant_id, v_link.student_id)
  then
    raise exception using errcode = 'P0002', message = 'guardian link not found';
  end if;
  if v_link.status = 'revoked'
    and v_link.revocation_idempotency_key = p_idempotency_key
  then
    return;
  end if;
  if v_link.status not in ('pending', 'active') then
    raise exception using errcode = 'P0002', message = 'guardian link not active';
  end if;

  update public.guardian_links
  set status = 'revoked', revoked_at = clock_timestamp(),
      revocation_idempotency_key = p_idempotency_key
  where tenant_id = v_link.tenant_id and id = v_link.id;
  update public.family_threads
  set status = 'closed', closed_at = clock_timestamp(),
      closed_idempotency_key = p_idempotency_key
  where tenant_id = v_link.tenant_id
    and child_id = v_link.student_id
    and guardian_user_id = v_link.guardian_user_id
    and status = 'open';
  update public.notification_outbox
  set status = 'cancelled', claimed_at = null,
      claim_token = null, claim_expires_at = null
  where tenant_id = v_link.tenant_id
    and recipient_user_id = v_link.guardian_user_id
    and status = 'pending'
    and (
      (
        kind = 'family_message'
        and aggregate_id in (
          select ft.id from public.family_threads as ft
          where ft.tenant_id = v_link.tenant_id
            and ft.child_id = v_link.student_id
            and ft.guardian_user_id = v_link.guardian_user_id
        )
      )
      or (
        kind = 'weekly_family_digest'
        and not exists (
          select 1 from public.guardian_links as remaining
          where remaining.tenant_id = v_link.tenant_id
            and remaining.guardian_user_id = v_link.guardian_user_id
            and remaining.status = 'active'
            and (remaining.expires_at is null
              or remaining.expires_at > statement_timestamp())
        )
      )
    );

  select * into v_guardian from public.app_users where id = v_link.guardian_user_id;
  if v_guardian.notification_email_digest is not null
    and not exists (
      select 1 from public.email_suppressions as es
      where es.tenant_id = v_link.tenant_id
        and es.recipient_email_digest = v_guardian.notification_email_digest
    )
  then
    insert into public.notification_outbox (
      tenant_id, environment_id, data_mode, kind, recipient_user_id,
      recipient_email_digest, recipient_email_ciphertext, locale,
      idempotency_key, aggregate_type, aggregate_id, payload
    ) values (
      v_link.tenant_id, v_link.environment_id, v_link.data_mode,
      'account_security', v_link.guardian_user_id,
      v_guardian.notification_email_digest,
      v_guardian.notification_email_ciphertext, v_guardian.locale,
      p_idempotency_key || ':security', 'guardian_link', v_link.id,
      jsonb_build_object('kind', 'account_security')
    ) on conflict do nothing;
  end if;
end;
$$;

create or replace function public.relinquish_guardian_link_v1(
  p_guardian_link_id uuid,
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
  v_link public.guardian_links%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  v_actor_id := private.require_family_app_user();
  select * into v_link from public.guardian_links
  where id = p_guardian_link_id for update;
  if v_link.id is null or v_link.guardian_user_id <> v_actor_id then
    raise exception using errcode = 'P0002', message = 'guardian link not found';
  end if;
  if v_link.status = 'revoked'
    and v_link.revocation_idempotency_key = p_idempotency_key
  then
    return;
  end if;
  if v_link.status <> 'active'
    or (v_link.expires_at is not null and v_link.expires_at <= statement_timestamp())
  then
    raise exception using errcode = 'P0002', message = 'guardian link not active';
  end if;

  update public.guardian_links
  set status = 'revoked', revoked_at = clock_timestamp(),
      revocation_idempotency_key = p_idempotency_key
  where tenant_id = v_link.tenant_id and id = v_link.id;
  update public.family_threads
  set status = 'closed', closed_at = clock_timestamp(),
      closed_idempotency_key = p_idempotency_key
  where tenant_id = v_link.tenant_id
    and child_id = v_link.student_id
    and guardian_user_id = v_actor_id
    and status = 'open';
  update public.notification_outbox
  set status = 'cancelled', claimed_at = null,
      claim_token = null, claim_expires_at = null
  where tenant_id = v_link.tenant_id
    and recipient_user_id = v_actor_id
    and status = 'pending'
    and (
      (
        kind = 'family_message'
        and aggregate_id in (
          select ft.id from public.family_threads as ft
          where ft.tenant_id = v_link.tenant_id
            and ft.child_id = v_link.student_id
            and ft.guardian_user_id = v_actor_id
        )
      )
      or (
        kind = 'weekly_family_digest'
        and not exists (
          select 1 from public.guardian_links as remaining
          where remaining.tenant_id = v_link.tenant_id
            and remaining.guardian_user_id = v_actor_id
            and remaining.status = 'active'
            and (remaining.expires_at is null
              or remaining.expires_at > statement_timestamp())
        )
      )
    );
end;
$$;

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
  v_thread public.family_threads%rowtype;
  v_student public.students%rowtype;
  v_enrollment public.enrollments%rowtype;
  v_guardian_id uuid;
  v_guardian_count integer;
  v_actor_is_guardian boolean;
  v_actor_is_teacher boolean;
  v_message public.family_messages%rowtype;
  v_recipient public.app_users%rowtype;
  v_retention_days integer;
  v_notify boolean := true;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  if p_body is null
    or p_body <> btrim(p_body)
    or char_length(p_body) not between 1 and 2000
    or p_body ~ '[[:cntrl:]]'
  then
    raise exception using errcode = '22023', message = 'invalid message body';
  end if;
  v_actor_id := private.require_family_app_user();

  if p_thread_id is not null then
    if p_child_id is not null or p_enrollment_id is not null
      or p_staff_user_id is not null or p_topic is not null
    then
      raise exception using errcode = '22023', message = 'unexpected new-thread fields';
    end if;
    select * into v_thread from public.family_threads
    where id = p_thread_id for update;
    if v_thread.id is null then
      raise exception using errcode = 'P0002', message = 'thread not found';
    end if;
  else
    if p_child_id is null or p_enrollment_id is null
      or p_staff_user_id is null or p_topic is null
    then
      raise exception using errcode = '22023', message = 'new-thread fields required';
    end if;
    select e.* into v_enrollment
    from public.enrollments as e
    where e.id = p_enrollment_id and e.student_id = p_child_id
      and e.status = 'active'
      and e.starts_at <= current_date
      and (e.ends_at is null or e.ends_at >= current_date);
    if v_enrollment.id is null then
      raise exception using errcode = 'P0002', message = 'enrollment not found';
    end if;
    select * into strict v_student from public.students
    where tenant_id = v_enrollment.tenant_id and id = v_enrollment.student_id and active;
    if not exists (
      select 1
      from public.tenants as t
      join public.schools as sc
        on sc.tenant_id = t.id and sc.id = v_student.school_id
      where t.id = v_student.tenant_id
        and t.status = 'active' and t.family_portal_enabled
        and sc.active
    ) or not exists (
      select 1 from public.classes as c
      where c.tenant_id = v_enrollment.tenant_id
        and c.id = v_enrollment.class_id
        and c.school_id = v_student.school_id
        and c.active
    ) or not exists (
      select 1 from public.role_bindings as rb
      where rb.tenant_id = v_student.tenant_id
        and rb.app_user_id = p_staff_user_id
        and rb.role = 'teacher'
        and rb.school_id = v_student.school_id
        and rb.active
        and rb.starts_at <= statement_timestamp()
        and (rb.ends_at is null or rb.ends_at > statement_timestamp())
    ) or not exists (
      select 1 from public.class_staff_bindings as csb
      where csb.tenant_id = v_enrollment.tenant_id
        and csb.class_id = v_enrollment.class_id
        and csb.teacher_user_id = p_staff_user_id
        and csb.active
        and csb.starts_at <= statement_timestamp()
        and (csb.ends_at is null or csb.ends_at > statement_timestamp())
    ) then
      raise exception using errcode = 'P0002', message = 'thread target not found';
    end if;

    v_actor_is_guardian := exists (
      select 1 from public.guardian_links as gl
      where gl.tenant_id = v_student.tenant_id
        and gl.student_id = v_student.id
        and gl.guardian_user_id = v_actor_id
        and gl.status = 'active'
        and (gl.expires_at is null or gl.expires_at > statement_timestamp())
    ) and public.family_has_role_v1(
      v_student.tenant_id,
      array['guardian']::public.app_role[],
      null,
      null
    );
    v_actor_is_teacher := v_actor_id = p_staff_user_id and exists (
      select 1 from public.role_bindings as rb
      where rb.tenant_id = v_student.tenant_id
        and rb.app_user_id = v_actor_id
        and rb.role = 'teacher'
        and rb.school_id = v_student.school_id
        and rb.active
        and rb.starts_at <= statement_timestamp()
        and (rb.ends_at is null or rb.ends_at > statement_timestamp())
        and exists (
          select 1 from public.class_staff_bindings as csb
          where csb.tenant_id = v_enrollment.tenant_id
            and csb.class_id = v_enrollment.class_id
            and csb.teacher_user_id = v_actor_id
            and csb.active
            and csb.starts_at <= statement_timestamp()
            and (csb.ends_at is null or csb.ends_at > statement_timestamp())
        )
    );
    if not v_actor_is_guardian and not v_actor_is_teacher then
      raise exception using errcode = 'P0002', message = 'thread target not found';
    end if;
    if v_actor_is_guardian then
      v_guardian_id := v_actor_id;
    else
      select (array_agg(gl.guardian_user_id order by gl.guardian_user_id))[1], count(*)
      into v_guardian_id, v_guardian_count
      from public.guardian_links as gl
      where gl.tenant_id = v_student.tenant_id
        and gl.student_id = v_student.id
        and gl.status = 'active'
        and (gl.expires_at is null or gl.expires_at > statement_timestamp())
        and exists (
          select 1 from public.role_bindings as guardian_role
          where guardian_role.tenant_id = gl.tenant_id
            and guardian_role.app_user_id = gl.guardian_user_id
            and guardian_role.role = 'guardian'
            and guardian_role.active
            and guardian_role.starts_at <= statement_timestamp()
            and (guardian_role.ends_at is null
              or guardian_role.ends_at > statement_timestamp())
        );
      if v_guardian_count <> 1 then
        raise exception using errcode = 'P0002', message = 'thread target not found';
      end if;
    end if;

    insert into public.family_threads (
      tenant_id, environment_id, data_mode, school_id, child_id,
      enrollment_id, guardian_user_id, staff_user_id, created_by_user_id,
      topic, status
    ) values (
      v_student.tenant_id, v_student.environment_id, v_student.data_mode,
      v_student.school_id, v_student.id, v_enrollment.id, v_guardian_id,
      p_staff_user_id, v_actor_id, p_topic, 'open'
    ) returning * into v_thread;
  end if;

  if not public.family_can_access_thread_v1(v_thread.tenant_id, v_thread.id) then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end if;

  v_actor_is_guardian := v_thread.guardian_user_id = v_actor_id and exists (
    select 1 from public.guardian_links as gl
    where gl.tenant_id = v_thread.tenant_id
      and gl.student_id = v_thread.child_id
      and gl.guardian_user_id = v_actor_id
      and gl.status = 'active'
      and (gl.expires_at is null or gl.expires_at > statement_timestamp())
  ) and public.family_has_role_v1(
    v_thread.tenant_id,
    array['guardian']::public.app_role[],
    null,
    null
  );
  v_actor_is_teacher := v_thread.staff_user_id = v_actor_id and exists (
    select 1
    from public.enrollments as e
    join public.class_staff_bindings as csb
      on csb.tenant_id = e.tenant_id and csb.class_id = e.class_id
    join public.role_bindings as rb
      on rb.tenant_id = csb.tenant_id
      and rb.app_user_id = csb.teacher_user_id
      and rb.role = 'teacher'
    where e.tenant_id = v_thread.tenant_id
      and e.id = v_thread.enrollment_id
      and e.student_id = v_thread.child_id
      and e.status = 'active'
      and e.starts_at <= current_date
      and (e.ends_at is null or e.ends_at >= current_date)
      and csb.teacher_user_id = v_actor_id
      and csb.active
      and csb.starts_at <= statement_timestamp()
      and (csb.ends_at is null or csb.ends_at > statement_timestamp())
      and rb.school_id = v_thread.school_id
      and rb.active
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
  );
  if not v_actor_is_guardian and not v_actor_is_teacher then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end if;
  if v_thread.status = 'closed' then
    raise exception using errcode = 'P0006', message = 'thread is closed';
  end if;

  select * into v_message from public.family_messages
  where tenant_id = v_thread.tenant_id
    and sender_user_id = v_actor_id
    and idempotency_key = p_client_mutation_id;
  if v_message.id is not null then
    if v_message.thread_id <> v_thread.id or v_message.body <> p_body then
      raise exception using errcode = '22023', message = 'idempotency key conflict';
    end if;
    return jsonb_build_object(
      'message_id', v_message.id,
      'thread_id', v_thread.id
    );
  end if;

  v_retention_days := private.family_retention_days_v1(
    v_thread.tenant_id, 'family_message'
  );
  if v_retention_days is null then
    raise exception using errcode = '42501',
      message = 'approved family-message retention policy required';
  end if;

  insert into public.family_messages (
    tenant_id, environment_id, data_mode, thread_id, sender_user_id,
    idempotency_key, body, retention_anchor_at, expires_at
  ) values (
    v_thread.tenant_id, v_thread.environment_id, v_thread.data_mode,
    v_thread.id, v_actor_id, p_client_mutation_id, p_body,
    statement_timestamp(),
    statement_timestamp() + make_interval(days => v_retention_days)
  ) returning * into v_message;
  update public.family_threads set updated_at = clock_timestamp()
  where tenant_id = v_thread.tenant_id and id = v_thread.id;

  if v_actor_is_guardian then
    select * into v_recipient from public.app_users where id = v_thread.staff_user_id;
  else
    select * into v_recipient from public.app_users where id = v_thread.guardian_user_id;
    select coalesce(fnp.message_email_enabled, false) into v_notify
    from (select 1) as singleton
    left join public.family_notification_preferences as fnp
      on fnp.tenant_id = v_thread.tenant_id
      and fnp.app_user_id = v_thread.guardian_user_id;
  end if;

  if v_notify
    and v_recipient.notification_email_digest is not null
    and not exists (
      select 1 from public.email_suppressions as es
      where es.tenant_id = v_thread.tenant_id
        and es.recipient_email_digest = v_recipient.notification_email_digest
    )
  then
    insert into public.notification_outbox (
      tenant_id, environment_id, data_mode, kind, recipient_user_id,
      recipient_email_digest, recipient_email_ciphertext, locale,
      idempotency_key, aggregate_type, aggregate_id, payload,
      retention_anchor_at, expires_at
    ) values (
      v_thread.tenant_id, v_thread.environment_id, v_thread.data_mode,
      'family_message', v_recipient.id, v_recipient.notification_email_digest,
      v_recipient.notification_email_ciphertext, v_recipient.locale,
      'message:' || v_message.id::text || ':recipient:' || v_recipient.id::text,
      'family_thread', v_thread.id,
      jsonb_build_object('kind', 'family_message'), statement_timestamp(),
      statement_timestamp() + make_interval(days => v_retention_days)
    ) on conflict do nothing;
  end if;

  return jsonb_build_object(
    'message_id', v_message.id,
    'thread_id', v_thread.id
  );
end;
$$;

create or replace function public.mark_family_thread_read_v1(
  p_thread_id uuid,
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
  v_thread public.family_threads%rowtype;
  v_last_message_id uuid;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  v_actor_id := private.require_family_app_user();
  select * into v_thread from public.family_threads where id = p_thread_id;
  if v_thread.id is null
    or not public.family_can_access_thread_v1(v_thread.tenant_id, v_thread.id)
  then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end if;
  select fm.id into v_last_message_id
  from public.family_messages as fm
  where fm.tenant_id = v_thread.tenant_id and fm.thread_id = v_thread.id
  order by fm.created_at desc, fm.id desc limit 1;

  insert into public.family_thread_reads (
    tenant_id, environment_id, data_mode, thread_id, app_user_id,
    last_read_message_id, last_read_at, idempotency_key
  ) values (
    v_thread.tenant_id, v_thread.environment_id, v_thread.data_mode,
    v_thread.id, v_actor_id, v_last_message_id, clock_timestamp(),
    p_client_mutation_id
  ) on conflict (tenant_id, thread_id, app_user_id) do update
  set last_read_message_id = excluded.last_read_message_id,
      last_read_at = excluded.last_read_at,
      idempotency_key = excluded.idempotency_key;

  update public.notification_outbox
  set status = 'cancelled', claimed_at = null,
      claim_token = null, claim_expires_at = null
  where tenant_id = v_thread.tenant_id
    and kind = 'family_message'
    and aggregate_id = v_thread.id
    and recipient_user_id = v_actor_id
    and status = 'pending';
end;
$$;

create or replace function public.close_family_thread_v1(
  p_thread_id uuid,
  p_client_mutation_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_thread public.family_threads%rowtype;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  perform private.require_family_app_user();
  select * into v_thread from public.family_threads
  where id = p_thread_id for update;
  if v_thread.id is null
    or not public.family_can_access_thread_v1(v_thread.tenant_id, v_thread.id)
  then
    raise exception using errcode = 'P0002', message = 'thread not found';
  end if;
  if v_thread.status = 'closed' then
    return;
  end if;
  update public.family_threads
  set status = 'closed', closed_at = clock_timestamp(),
      closed_idempotency_key = p_client_mutation_id
  where tenant_id = v_thread.tenant_id and id = v_thread.id;
  update public.notification_outbox
  set status = 'cancelled', claimed_at = null,
      claim_token = null, claim_expires_at = null
  where tenant_id = v_thread.tenant_id
    and kind = 'family_message'
    and aggregate_id = v_thread.id
    and status = 'pending';
end;
$$;

create or replace function public.update_family_notification_preferences_v1(
  p_message_email_enabled boolean,
  p_weekly_digest_enabled boolean,
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
  v_tenant public.tenants%rowtype;
  v_tenant_count integer;
  v_locale text;
begin
  perform private.assert_family_idempotency_key(p_client_mutation_id);
  v_actor_id := private.require_family_app_user();
  select (array_agg(distinct t.id order by t.id))[1], count(distinct t.id)
  into v_tenant.id, v_tenant_count
  from public.tenants as t
  join public.role_bindings as rb on rb.tenant_id = t.id
  where rb.app_user_id = v_actor_id and rb.role = 'guardian' and rb.active
    and rb.starts_at <= statement_timestamp()
    and (rb.ends_at is null or rb.ends_at > statement_timestamp())
    and t.status = 'active' and t.family_portal_enabled
    and exists (
      select 1
      from public.guardian_links as gl
      join public.students as s
        on s.tenant_id = gl.tenant_id and s.id = gl.student_id
      join public.schools as sc
        on sc.tenant_id = s.tenant_id and sc.id = s.school_id
      where gl.tenant_id = t.id and gl.guardian_user_id = v_actor_id
        and gl.status = 'active'
        and (gl.expires_at is null or gl.expires_at > statement_timestamp())
        and s.active and sc.active
    );
  if v_tenant_count <> 1 then
    raise exception using errcode = '42501',
      message = 'notification preference tenant is ambiguous';
  end if;
  select * into strict v_tenant from public.tenants where id = v_tenant.id;
  select locale into v_locale from public.app_users where id = v_actor_id;
  insert into public.family_notification_preferences (
    tenant_id, environment_id, data_mode, app_user_id,
    message_email_enabled, weekly_digest_enabled, locale, idempotency_key
  ) values (
    v_tenant.id, v_tenant.environment_id, v_tenant.data_mode, v_actor_id,
    p_message_email_enabled, p_weekly_digest_enabled, v_locale,
    p_client_mutation_id
  ) on conflict (tenant_id, app_user_id) do update
  set message_email_enabled = excluded.message_email_enabled,
      weekly_digest_enabled = excluded.weekly_digest_enabled,
      locale = excluded.locale,
      idempotency_key = excluded.idempotency_key;
end;
$$;

create or replace function public.ingest_learning_events_v2(p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_event jsonb;
  v_event_id uuid;
  v_seen_ids uuid[] := array[]::uuid[];
  v_assignment_id uuid;
  v_student_assignment_id uuid;
  v_enrollment_id uuid;
  v_student_id uuid;
  v_assignment public.assignments%rowtype;
  v_student_assignment public.student_assignments%rowtype;
  v_enrollment public.enrollments%rowtype;
  v_student public.students%rowtype;
  v_existing_event public.learning_events_v2%rowtype;
  v_inserted integer := 0;
  v_ignored integer := 0;
  v_rows integer;
  v_retention_days integer;
  v_skill_name text;
  v_skill_evidence integer;
  v_page_reviews integer;
begin
  v_actor_id := private.require_family_app_user();
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception using errcode = '25000',
      message = 'learning event ingestion requires read committed isolation';
  end if;
  if jsonb_typeof(p_events) <> 'array'
    or jsonb_array_length(p_events) not between 1 and 50
  then
    raise exception using errcode = '22023', message = 'invalid learning event batch';
  end if;
  if (
    select count(distinct event ->> 'assignmentId')
    from jsonb_array_elements(p_events) as item(event)
  ) > 1 then
    raise exception using errcode = '22023',
      message = 'learning event batch must belong to one assignment';
  end if;

  for v_event in select value from jsonb_array_elements(p_events)
  loop
    if jsonb_typeof(v_event) <> 'object'
      or exists (
        select 1 from jsonb_object_keys(v_event) as key
        where key <> all(array[
          'schemaVersion', 'activeDurationMs', 'assignmentId', 'occurredAt',
          'attemptNumber', 'clientMutationId', 'clientVersion',
          'contentReleaseId', 'eventId', 'eventType', 'idempotencyKey',
          'learningObjectVersionId', 'lessonReleaseId', 'locale', 'outcome',
          'sessionId', 'skillId'
        ])
      )
    then
      raise exception using errcode = '22023', message = 'invalid learning event shape';
    end if;
    v_event_id := (v_event ->> 'eventId')::uuid;
    if v_event_id = any(v_seen_ids) then
      raise exception using errcode = '22023', message = 'duplicate event id in batch';
    end if;
    v_seen_ids := array_append(v_seen_ids, v_event_id);
    perform private.assert_family_idempotency_key(v_event ->> 'clientMutationId');

    v_assignment_id := null;
    v_student_assignment_id := null;
    v_enrollment_id := null;
    v_student_id := null;
    begin
      select a.id, sa.id, e.id, s.id
      into strict
        v_assignment_id, v_student_assignment_id, v_enrollment_id, v_student_id
      from public.assignments as a
      join public.student_assignments as sa
        on sa.tenant_id = a.tenant_id and sa.assignment_id = a.id
      join public.enrollments as e
        on e.tenant_id = sa.tenant_id and e.id = sa.enrollment_id
        and e.class_id = a.class_id
      join public.students as s
        on s.tenant_id = e.tenant_id and s.id = e.student_id
      join public.classes as c
        on c.tenant_id = e.tenant_id and c.id = e.class_id
        and c.id = a.class_id
      join public.schools as sc
        on sc.tenant_id = s.tenant_id and sc.id = s.school_id
        and sc.id = c.school_id
      join public.tenants as t on t.id = s.tenant_id
      join public.role_bindings as rb
        on rb.tenant_id = s.tenant_id and rb.student_id = s.id
        and rb.app_user_id = v_actor_id and rb.role = 'learner' and rb.active
      where a.id = (v_event ->> 'assignmentId')::uuid
        and e.status = 'active'
        and e.starts_at <= current_date
        and (e.ends_at is null or e.ends_at >= current_date)
        and s.active and c.active and sc.active
        and t.status = 'active' and t.family_portal_enabled
        and rb.starts_at <= statement_timestamp()
        and (rb.ends_at is null or rb.ends_at > statement_timestamp())
      -- A batch is constrained to one assignment. A unique authorization
      -- mapping is required before this student row becomes the batch's one
      -- transaction lock; ambiguous learner/student/enrollment mappings fail
      -- closed instead of choosing a row through LIMIT.
      for no key update of s;
    exception
      when no_data_found or too_many_rows then
        raise exception using errcode = 'P0002',
          message = 'learning assignment not found';
    end;
    select * into strict v_assignment
    from public.assignments where id = v_assignment_id;
    select * into strict v_student_assignment
    from public.student_assignments where id = v_student_assignment_id;
    select * into strict v_enrollment
    from public.enrollments where id = v_enrollment_id;
    select * into strict v_student
    from public.students where id = v_student_id;
    if (v_event ->> 'schemaVersion')::integer <> 2
      or (v_event ->> 'lessonReleaseId') <> v_assignment.lesson_release_id
      or (v_event ->> 'activeDurationMs')::integer not between 0 and 14400000
      or (v_event ->> 'attemptNumber')::integer not between 1 and 10000
      or (v_event ->> 'occurredAt')::timestamptz > statement_timestamp() + interval '5 minutes'
      or v_event ->> 'eventType' not in (
        'lesson_started', 'lesson_resumed', 'page_visited', 'page_reviewed',
        'support_opened', 'practice_evaluated', 'lesson_exited'
      )
      or v_event ->> 'locale' not in ('en', 'es')
      or v_event ->> 'outcome' not in (
        'none', 'correct', 'incorrect', 'completed', 'abandoned'
      )
      or char_length(v_event ->> 'clientVersion') not between 1 and 64
      or char_length(v_event ->> 'contentReleaseId') not between 1 and 128
      or char_length(v_event ->> 'idempotencyKey') not between 8 and 160
      or char_length(v_event ->> 'learningObjectVersionId') not between 1 and 160
      or char_length(v_event ->> 'lessonReleaseId') not between 1 and 160
      or (
        v_event -> 'skillId' <> 'null'::jsonb
        and char_length(v_event ->> 'skillId') not between 1 and 160
      )
    then
      raise exception using errcode = '22023', message = 'invalid learning event';
    end if;

    v_skill_name := null;
    select membership.skill_name into v_skill_name
    from public.family_content_release_memberships as membership
    where membership.tenant_id = v_assignment.tenant_id
      and membership.content_release_id = v_event ->> 'contentReleaseId'
      and membership.lesson_release_id = v_event ->> 'lessonReleaseId'
      and membership.learning_object_version_id =
        v_event ->> 'learningObjectVersionId'
      and membership.skill_id is not distinct from nullif(v_event ->> 'skillId', '')
      and membership.published
      and membership.active_from <= (v_event ->> 'occurredAt')::timestamptz
      and (
        membership.active_until is null
        or membership.active_until > (v_event ->> 'occurredAt')::timestamptz
      )
    limit 1;
    if not found then
      raise exception using errcode = '22023',
        message = 'learning event release membership not published';
    end if;

    v_retention_days := private.family_retention_days_v1(
      v_assignment.tenant_id, 'learning_event'
    );
    if v_retention_days is null then
      raise exception using errcode = '42501',
        message = 'approved learning-event retention policy required';
    end if;

    v_existing_event.event_id := null;
    select le.* into v_existing_event
    from public.learning_events_v2 as le
    where le.tenant_id = v_assignment.tenant_id
      and (
        le.event_id = v_event_id
        or (
          le.recorded_by_user_id = v_actor_id
          and le.idempotency_key = v_event ->> 'idempotencyKey'
        )
        or (
          le.recorded_by_user_id = v_actor_id
          and le.client_mutation_id = v_event ->> 'clientMutationId'
        )
      )
    order by (le.event_id = v_event_id) desc, le.recorded_at, le.event_id
    limit 1
    for update;
    if v_existing_event.event_id is not null then
      if v_existing_event.event_id <> v_event_id
        or v_existing_event.student_id <> v_student.id
        or v_existing_event.assignment_id <> v_assignment.id
        or v_existing_event.enrollment_id <> v_enrollment.id
        or v_existing_event.event_type::text <> v_event ->> 'eventType'
        or v_existing_event.occurred_at <> (v_event ->> 'occurredAt')::timestamptz
        or v_existing_event.active_duration_ms <>
          (v_event ->> 'activeDurationMs')::integer
        or v_existing_event.attempt_number <> (v_event ->> 'attemptNumber')::integer
        or v_existing_event.client_mutation_id <> v_event ->> 'clientMutationId'
        or v_existing_event.client_version <> v_event ->> 'clientVersion'
        or v_existing_event.content_release_id <> v_event ->> 'contentReleaseId'
        or v_existing_event.idempotency_key <> v_event ->> 'idempotencyKey'
        or v_existing_event.learning_object_version_id <>
          v_event ->> 'learningObjectVersionId'
        or v_existing_event.lesson_release_id <> v_event ->> 'lessonReleaseId'
        or v_existing_event.locale <> v_event ->> 'locale'
        or v_existing_event.outcome::text <> v_event ->> 'outcome'
        or v_existing_event.session_id <> (v_event ->> 'sessionId')::uuid
        or v_existing_event.skill_id is distinct from
          nullif(v_event ->> 'skillId', '')
      then
        raise exception using errcode = '22023',
          message = 'learning event idempotency conflict';
      end if;
      v_ignored := v_ignored + 1;
      continue;
    end if;

    if v_event ->> 'eventType' = 'page_reviewed' and exists (
      select 1 from public.learning_events_v2 as semantic_event
      where semantic_event.tenant_id = v_assignment.tenant_id
        and semantic_event.student_id = v_student.id
        and semantic_event.assignment_id = v_assignment.id
        and semantic_event.learning_object_version_id =
          v_event ->> 'learningObjectVersionId'
        and semantic_event.event_type::text = v_event ->> 'eventType'
    ) then
      v_ignored := v_ignored + 1;
      continue;
    end if;

    insert into public.learning_events_v2 (
      tenant_id, environment_id, data_mode, event_id, student_id,
      assignment_id, enrollment_id, recorded_by_user_id, schema_version,
      event_type, occurred_at, active_duration_ms, attempt_number,
      client_mutation_id, client_version, content_release_id, idempotency_key,
      learning_object_version_id, lesson_release_id, locale, outcome,
      session_id, skill_id, retention_anchor_at, expires_at
    ) values (
      v_assignment.tenant_id, v_assignment.environment_id,
      v_assignment.data_mode, v_event_id, v_student.id, v_assignment.id,
      v_enrollment.id, v_actor_id, 2,
      (v_event ->> 'eventType')::public.learning_event_v2_type,
      (v_event ->> 'occurredAt')::timestamptz,
      (v_event ->> 'activeDurationMs')::integer,
      (v_event ->> 'attemptNumber')::integer,
      v_event ->> 'clientMutationId', v_event ->> 'clientVersion',
      v_event ->> 'contentReleaseId', v_event ->> 'idempotencyKey',
      v_event ->> 'learningObjectVersionId', v_event ->> 'lessonReleaseId',
      v_event ->> 'locale',
      (v_event ->> 'outcome')::public.learning_event_outcome,
      (v_event ->> 'sessionId')::uuid, nullif(v_event ->> 'skillId', ''),
      statement_timestamp(),
      statement_timestamp() + make_interval(days => v_retention_days)
    ) on conflict do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      -- The insert is the concurrency arbiter for every identity constraint.
      -- Re-read the winning row and apply the same full-payload idempotency
      -- contract; only a page_reviewed semantic collision may be ignored with
      -- a different caller identity.
      v_existing_event.event_id := null;
      select le.* into v_existing_event
      from public.learning_events_v2 as le
      where le.tenant_id = v_assignment.tenant_id
        and (
          le.event_id = v_event_id
          or (
            le.recorded_by_user_id = v_actor_id
            and le.idempotency_key = v_event ->> 'idempotencyKey'
          )
          or (
            le.recorded_by_user_id = v_actor_id
            and le.client_mutation_id = v_event ->> 'clientMutationId'
          )
          or (
            v_event ->> 'eventType' = 'page_reviewed'
            and le.student_id = v_student.id
            and le.assignment_id = v_assignment.id
            and le.learning_object_version_id =
              v_event ->> 'learningObjectVersionId'
            and le.event_type = 'page_reviewed'
          )
        )
      order by (
        le.event_id = v_event_id
        or (
          le.recorded_by_user_id = v_actor_id
          and le.idempotency_key = v_event ->> 'idempotencyKey'
        )
        or (
          le.recorded_by_user_id = v_actor_id
          and le.client_mutation_id = v_event ->> 'clientMutationId'
        )
      ) desc, le.recorded_at, le.event_id
      limit 1
      for update;
      if v_existing_event.event_id is null then
        raise exception using errcode = '22023',
          message = 'learning event idempotency conflict';
      end if;
      if (
        v_existing_event.event_id = v_event_id
        or (
          v_existing_event.recorded_by_user_id = v_actor_id
          and v_existing_event.idempotency_key = v_event ->> 'idempotencyKey'
        )
        or (
          v_existing_event.recorded_by_user_id = v_actor_id
          and v_existing_event.client_mutation_id = v_event ->> 'clientMutationId'
        )
      ) and (
        v_existing_event.event_id <> v_event_id
        or v_existing_event.student_id <> v_student.id
        or v_existing_event.assignment_id <> v_assignment.id
        or v_existing_event.enrollment_id <> v_enrollment.id
        or v_existing_event.event_type::text <> v_event ->> 'eventType'
        or v_existing_event.occurred_at <>
          (v_event ->> 'occurredAt')::timestamptz
        or v_existing_event.active_duration_ms <>
          (v_event ->> 'activeDurationMs')::integer
        or v_existing_event.attempt_number <>
          (v_event ->> 'attemptNumber')::integer
        or v_existing_event.client_mutation_id <> v_event ->> 'clientMutationId'
        or v_existing_event.client_version <> v_event ->> 'clientVersion'
        or v_existing_event.content_release_id <> v_event ->> 'contentReleaseId'
        or v_existing_event.idempotency_key <> v_event ->> 'idempotencyKey'
        or v_existing_event.learning_object_version_id <>
          v_event ->> 'learningObjectVersionId'
        or v_existing_event.lesson_release_id <> v_event ->> 'lessonReleaseId'
        or v_existing_event.locale <> v_event ->> 'locale'
        or v_existing_event.outcome::text <> v_event ->> 'outcome'
        or v_existing_event.session_id <> (v_event ->> 'sessionId')::uuid
        or v_existing_event.skill_id is distinct from
          nullif(v_event ->> 'skillId', '')
      ) then
        raise exception using errcode = '22023',
          message = 'learning event idempotency conflict';
      end if;
      v_ignored := v_ignored + 1;
      continue;
    else
      v_inserted := v_inserted + 1;
      if v_event ->> 'eventType' = 'page_reviewed' then
        select count(distinct le.learning_object_version_id)::integer
        into v_page_reviews
        from public.learning_events_v2 as le
        where le.tenant_id = v_assignment.tenant_id
          and le.student_id = v_student.id
          and le.assignment_id = v_assignment.id
          and le.event_type = 'page_reviewed';
        update public.student_assignments as sa
        set reviewed_pages = least(v_page_reviews, v_assignment.total_pages),
            status = case
              when least(v_page_reviews, v_assignment.total_pages)
                >= v_assignment.total_pages then 'completed'::public.family_assignment_status
              else 'in_progress'::public.family_assignment_status
            end,
            started_at = coalesce(sa.started_at, (v_event ->> 'occurredAt')::timestamptz),
            completed_at = case
              when least(v_page_reviews, v_assignment.total_pages)
                >= v_assignment.total_pages then coalesce(
                  sa.completed_at, (v_event ->> 'occurredAt')::timestamptz
                )
              else null
            end
        where sa.tenant_id = v_student_assignment.tenant_id
          and sa.id = v_student_assignment.id
        returning * into v_student_assignment;

        insert into public.progress_projections_v1 (
          tenant_id, environment_id, data_mode, student_id, assignment_id,
          lesson_release_id, lesson_title, reviewed_pages, total_pages,
          last_activity_at, last_event_occurred_at, last_event_id,
          computed_at, stale, retention_anchor_at, expires_at
        ) values (
          v_assignment.tenant_id, v_assignment.environment_id,
          v_assignment.data_mode, v_student.id, v_assignment.id,
          v_assignment.lesson_release_id, v_assignment.lesson_title,
          v_student_assignment.reviewed_pages, v_assignment.total_pages,
          (v_event ->> 'occurredAt')::timestamptz,
          (v_event ->> 'occurredAt')::timestamptz, v_event_id,
          clock_timestamp(), false,
          statement_timestamp(),
          statement_timestamp() + make_interval(days => v_retention_days)
        ) on conflict (tenant_id, student_id, lesson_release_id, assignment_id)
        do update set
          reviewed_pages = excluded.reviewed_pages,
          total_pages = excluded.total_pages,
          last_activity_at = greatest(
            public.progress_projections_v1.last_activity_at,
            excluded.last_activity_at
          ),
          last_event_id = case
            when public.progress_projections_v1.last_event_occurred_at is null
              or excluded.last_event_occurred_at >
                public.progress_projections_v1.last_event_occurred_at
              or (
                excluded.last_event_occurred_at =
                  public.progress_projections_v1.last_event_occurred_at
                and excluded.last_event_id >
                  public.progress_projections_v1.last_event_id
              ) then excluded.last_event_id
            else public.progress_projections_v1.last_event_id
          end,
          last_event_occurred_at = greatest(
            public.progress_projections_v1.last_event_occurred_at,
            excluded.last_event_occurred_at
          ),
          computed_at = excluded.computed_at,
          stale = false,
          retention_anchor_at = excluded.retention_anchor_at,
          expires_at = excluded.expires_at;
      end if;

      if nullif(v_event ->> 'skillId', '') is not null
        and v_event ->> 'eventType' = 'practice_evaluated'
        and v_event ->> 'outcome' in ('correct', 'incorrect')
      then
        select count(*)::integer into v_skill_evidence
        from public.learning_events_v2 as le
        where le.tenant_id = v_assignment.tenant_id
          and le.student_id = v_student.id
          and le.skill_id = v_event ->> 'skillId'
          and le.event_type = 'practice_evaluated'
          and le.outcome in ('correct', 'incorrect')
          and le.occurred_at >= statement_timestamp() - interval '30 days';

        insert into public.skill_projections_v1 (
          tenant_id, environment_id, data_mode, student_id, skill_id,
          skill_name, band, evidence_count, explanation,
          window_starts_at, window_ends_at, computed_at, stale,
          last_event_occurred_at, last_event_id, retention_anchor_at, expires_at
        ) values (
          v_assignment.tenant_id, v_assignment.environment_id,
          v_assignment.data_mode, v_student.id, v_event ->> 'skillId',
          v_skill_name,
          case
            when v_skill_evidence = 0 then 'insufficient_evidence'::public.family_skill_band
            when v_skill_evidence <= 2 then 'starting'::public.family_skill_band
            when v_skill_evidence <= 5 then 'growing'::public.family_skill_band
            else 'strong'::public.family_skill_band
          end,
          v_skill_evidence,
          v_skill_evidence::text || ' recent learning events contributed to this projection.',
          statement_timestamp() - interval '30 days', statement_timestamp(),
          clock_timestamp(), false, (v_event ->> 'occurredAt')::timestamptz,
          v_event_id, statement_timestamp(),
          statement_timestamp() + make_interval(days => v_retention_days)
        ) on conflict (tenant_id, student_id, skill_id) do update set
          skill_name = excluded.skill_name,
          band = excluded.band,
          evidence_count = excluded.evidence_count,
          explanation = excluded.explanation,
          window_starts_at = excluded.window_starts_at,
          window_ends_at = excluded.window_ends_at,
          computed_at = excluded.computed_at,
          stale = false,
          last_event_id = case
            when public.skill_projections_v1.last_event_occurred_at is null
              or excluded.last_event_occurred_at >
                public.skill_projections_v1.last_event_occurred_at
              or (
                excluded.last_event_occurred_at =
                  public.skill_projections_v1.last_event_occurred_at
                and excluded.last_event_id > public.skill_projections_v1.last_event_id
              ) then excluded.last_event_id
            else public.skill_projections_v1.last_event_id
          end,
          last_event_occurred_at = greatest(
            public.skill_projections_v1.last_event_occurred_at,
            excluded.last_event_occurred_at
          ),
          retention_anchor_at = excluded.retention_anchor_at,
          expires_at = excluded.expires_at;
      end if;
    end if;
  end loop;
  return jsonb_build_object('inserted', v_inserted, 'ignored', v_ignored);
end;
$$;

create or replace function public.claim_family_notification_outbox_v1(
  p_limit integer default 25
)
returns table (
  id uuid,
  tenant_id uuid,
  idempotency_key text,
  kind public.notification_kind,
  locale text,
  payload jsonb,
  recipient_email_ciphertext text,
  recipient_email_digest text,
  attempts integer,
  claim_token uuid,
  claim_expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_limit not between 1 and 100 then
    raise exception using errcode = '22023', message = 'claim limit out of range';
  end if;
  update public.notification_outbox as expired
  set status = 'cancelled', claimed_at = null, claim_token = null,
      claim_expires_at = null
  where expired.status = 'pending'
    and expired.expires_at <= statement_timestamp();

  update public.notification_outbox as exhausted
  set status = 'failed', claimed_at = null, claim_token = null,
      claim_expires_at = null
  where exhausted.status = 'pending'
    and exhausted.attempts >= 4;

  update public.notification_outbox as orphaned_lease
  set claimed_at = null, claim_token = null, claim_expires_at = null
  where orphaned_lease.status = 'pending'
    and orphaned_lease.claim_token is not null
    and orphaned_lease.claim_expires_at <= statement_timestamp()
    and orphaned_lease.attempts < 4;

  return query
  with candidates as (
    select nox.tenant_id, nox.id
    from public.notification_outbox as nox
    where nox.status = 'pending'
      and nox.available_at <= statement_timestamp()
      and nox.expires_at > statement_timestamp()
      and nox.attempts < 4
      and exists (
        select 1 from public.tenants as active_tenant
        where active_tenant.id = nox.tenant_id
          and active_tenant.status = 'active'
          and active_tenant.family_portal_enabled
      )
      and (
        nox.claim_token is null
        or nox.claim_expires_at <= statement_timestamp()
      )
      and not exists (
        select 1 from public.email_suppressions as es
        where es.tenant_id = nox.tenant_id
          and es.recipient_email_digest = nox.recipient_email_digest
      )
      and (
        nox.kind = 'guardian_invitation'
        or exists (
          select 1 from public.app_users as current_recipient
          where current_recipient.id = nox.recipient_user_id
            and current_recipient.status = 'active'
            and current_recipient.notification_email_digest =
              nox.recipient_email_digest
            and current_recipient.notification_email_ciphertext =
              nox.recipient_email_ciphertext
        )
      )
      and (
        nox.kind <> 'guardian_invitation'
        or exists (
          select 1
          from public.guardian_invitations as gi
          join public.tenants as t on t.id = gi.tenant_id
          where gi.tenant_id = nox.tenant_id
            and gi.id = nox.aggregate_id
            and gi.status = 'pending'
            and gi.expires_at > statement_timestamp()
            and t.status = 'active' and t.family_portal_enabled
        )
      )
    order by nox.available_at, nox.created_at, nox.id
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.notification_outbox as nox
    set claimed_at = clock_timestamp(),
        claim_token = extensions.gen_random_uuid(),
        claim_expires_at = clock_timestamp() + interval '5 minutes',
        last_attempt_at = clock_timestamp(),
        attempts = nox.attempts + 1
    from candidates as c
    where nox.tenant_id = c.tenant_id and nox.id = c.id
    returning nox.*
  )
  select
    c.id, c.tenant_id, c.idempotency_key, c.kind, c.locale, c.payload,
    c.recipient_email_ciphertext, c.recipient_email_digest, c.attempts,
    c.claim_token, c.claim_expires_at
  from claimed as c
  order by c.available_at, c.created_at, c.id;
end;
$$;

create or replace function public.validate_family_notification_claim_v1(
  p_id uuid,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  return exists (
    select 1
    from public.notification_outbox as nox
    join public.tenants as t on t.id = nox.tenant_id
    where nox.id = p_id
      and nox.status = 'pending'
      and nox.claim_token = p_claim_token
      and nox.claim_expires_at > statement_timestamp()
      and nox.expires_at > statement_timestamp()
      and t.status = 'active' and t.family_portal_enabled
      and (
        nox.kind = 'guardian_invitation'
        or exists (
          select 1 from public.app_users as current_recipient
          where current_recipient.id = nox.recipient_user_id
            and current_recipient.status = 'active'
            and current_recipient.notification_email_digest =
              nox.recipient_email_digest
            and current_recipient.notification_email_ciphertext =
              nox.recipient_email_ciphertext
        )
      )
      and not exists (
        select 1 from public.email_suppressions as es
        where es.tenant_id = nox.tenant_id
          and es.recipient_email_digest = nox.recipient_email_digest
      )
      and (
        (
          nox.kind = 'guardian_invitation'
          and exists (
            select 1 from public.guardian_invitations as gi
            where gi.tenant_id = nox.tenant_id
              and gi.id = nox.aggregate_id
              and gi.status = 'pending'
              and gi.expires_at > statement_timestamp()
          )
        )
        or (
          nox.kind = 'family_message'
          and exists (
            select 1
            from public.family_threads as ft
            join public.students as s
              on s.tenant_id = ft.tenant_id and s.id = ft.child_id
            join public.schools as sc
              on sc.tenant_id = s.tenant_id and sc.id = s.school_id
              and sc.id = ft.school_id
            join public.enrollments as e
              on e.tenant_id = ft.tenant_id and e.id = ft.enrollment_id
              and e.student_id = ft.child_id
            join public.classes as c
              on c.tenant_id = e.tenant_id and c.id = e.class_id
              and c.school_id = ft.school_id
            where ft.tenant_id = nox.tenant_id
              and ft.id = nox.aggregate_id
              and s.active and sc.active and c.active
              and e.status = 'active'
              and e.starts_at <= current_date
              and (e.ends_at is null or e.ends_at >= current_date)
              and (
                (
                  nox.recipient_user_id = ft.guardian_user_id
                  and exists (
                    select 1 from public.guardian_links as gl
                    where gl.tenant_id = ft.tenant_id
                      and gl.student_id = ft.child_id
                      and gl.guardian_user_id = ft.guardian_user_id
                      and gl.status = 'active'
                      and (gl.expires_at is null
                        or gl.expires_at > statement_timestamp())
                  )
                  and exists (
                    select 1 from public.role_bindings as guardian_role
                    where guardian_role.tenant_id = ft.tenant_id
                      and guardian_role.app_user_id = ft.guardian_user_id
                      and guardian_role.role = 'guardian'
                      and guardian_role.active
                      and guardian_role.starts_at <= statement_timestamp()
                      and (guardian_role.ends_at is null
                        or guardian_role.ends_at > statement_timestamp())
                  )
                  and exists (
                    select 1 from public.family_notification_preferences as fnp
                    where fnp.tenant_id = ft.tenant_id
                      and fnp.app_user_id = ft.guardian_user_id
                      and fnp.message_email_enabled
                  )
                )
                or (
                  nox.recipient_user_id = ft.staff_user_id
                  and exists (
                    select 1
                    from public.class_staff_bindings as csb
                    join public.role_bindings as teacher_role
                      on teacher_role.tenant_id = csb.tenant_id
                      and teacher_role.app_user_id = csb.teacher_user_id
                      and teacher_role.role = 'teacher'
                    where csb.tenant_id = ft.tenant_id
                      and csb.class_id = e.class_id
                      and csb.teacher_user_id = ft.staff_user_id
                      and csb.active
                      and csb.starts_at <= statement_timestamp()
                      and (csb.ends_at is null
                        or csb.ends_at > statement_timestamp())
                      and teacher_role.school_id = ft.school_id
                      and teacher_role.active
                      and teacher_role.starts_at <= statement_timestamp()
                      and (teacher_role.ends_at is null
                        or teacher_role.ends_at > statement_timestamp())
                  )
                )
              )
          )
        )
        or (
          nox.kind = 'weekly_family_digest'
          and nox.recipient_user_id = nox.aggregate_id
          and exists (
            select 1
            from public.family_notification_preferences as fnp
            join public.role_bindings as guardian_role
              on guardian_role.tenant_id = fnp.tenant_id
              and guardian_role.app_user_id = fnp.app_user_id
              and guardian_role.role = 'guardian'
            join public.guardian_links as gl
              on gl.tenant_id = fnp.tenant_id
              and gl.guardian_user_id = fnp.app_user_id
            join public.students as s
              on s.tenant_id = gl.tenant_id and s.id = gl.student_id
            join public.schools as sc
              on sc.tenant_id = s.tenant_id and sc.id = s.school_id
            join public.enrollments as e
              on e.tenant_id = s.tenant_id and e.student_id = s.id
            join public.classes as c
              on c.tenant_id = e.tenant_id and c.id = e.class_id
              and c.school_id = s.school_id
            where fnp.tenant_id = nox.tenant_id
              and fnp.app_user_id = nox.recipient_user_id
              and fnp.weekly_digest_enabled
              and guardian_role.active
              and guardian_role.starts_at <= statement_timestamp()
              and (guardian_role.ends_at is null
                or guardian_role.ends_at > statement_timestamp())
              and gl.status = 'active'
              and (gl.expires_at is null or gl.expires_at > statement_timestamp())
              and s.active and sc.active and c.active
              and e.status = 'active'
              and e.starts_at <= current_date
              and (e.ends_at is null or e.ends_at >= current_date)
          )
        )
        or (
          nox.kind = 'account_security'
          and exists (
            select 1 from public.app_users as recipient
            where recipient.id = nox.recipient_user_id
              and recipient.status = 'active'
              and recipient.notification_email_digest = nox.recipient_email_digest
              and recipient.notification_email_ciphertext =
                nox.recipient_email_ciphertext
          )
        )
      )
  );
end;
$$;

create or replace function public.complete_family_notification_outbox_v1(
  p_id uuid,
  p_claim_token uuid,
  p_succeeded boolean,
  p_provider_email_id text default null,
  p_error_code text default null
)
returns public.notification_outbox_status
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_outbox public.notification_outbox%rowtype;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_succeeded and (
    p_provider_email_id is null
    or char_length(p_provider_email_id) not between 1 and 255
    or p_error_code is not null
  ) then
    raise exception using errcode = '22023', message = 'invalid delivery completion';
  end if;
  if not p_succeeded and (
    p_provider_email_id is not null
    or p_error_code is null
    or char_length(p_error_code) not between 1 and 120
  ) then
    raise exception using errcode = '22023', message = 'invalid delivery failure';
  end if;

  update public.notification_outbox as nox
  set status = case
        when p_succeeded then 'sent'::public.notification_outbox_status
        when nox.attempts >= 4 then 'failed'::public.notification_outbox_status
        else 'pending'::public.notification_outbox_status
      end,
      provider_email_id = case when p_succeeded then p_provider_email_id else null end,
      available_at = case
        when not p_succeeded and nox.attempts < 4 then
          statement_timestamp() + make_interval(mins => least(60, (2 ^ nox.attempts)::integer))
        else nox.available_at
      end,
      claimed_at = null,
      claim_token = null,
      claim_expires_at = null,
      last_attempt_at = clock_timestamp()
  where nox.id = p_id
    and nox.status = 'pending'
    and nox.claim_token = p_claim_token
    and nox.claim_expires_at > statement_timestamp()
    and (
      not p_succeeded
      or nox.kind <> 'guardian_invitation'
      or exists (
        select 1 from public.guardian_invitations as gi
        where gi.tenant_id = nox.tenant_id
          and gi.id = nox.aggregate_id
          and gi.status = 'pending'
          and gi.expires_at > statement_timestamp()
      )
    )
  returning nox.* into v_outbox;
  if v_outbox.id is null then
    raise exception using errcode = 'P0002', message = 'outbox claim not found';
  end if;
  return v_outbox.status;
end;
$$;

create or replace function public.suppress_family_email_recipient_v1(
  p_provider_email_id text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_outbox public.notification_outbox%rowtype;
  v_reason public.email_delivery_event_type;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_reason not in ('bounced', 'complained', 'suppressed') then
    raise exception using errcode = '22023', message = 'invalid suppression reason';
  end if;
  v_reason := p_reason::public.email_delivery_event_type;
  select * into v_outbox from public.notification_outbox
  where provider_email_id = p_provider_email_id;
  if v_outbox.id is null then
    raise exception using errcode = 'P0002', message = 'delivery not found';
  end if;
  insert into public.email_suppressions (
    tenant_id, environment_id, data_mode, recipient_email_digest,
    reason, source_provider_email_id
  ) values (
    v_outbox.tenant_id, v_outbox.environment_id, v_outbox.data_mode,
    v_outbox.recipient_email_digest, v_reason, p_provider_email_id
  ) on conflict (tenant_id, recipient_email_digest) do update
  set reason = excluded.reason,
      source_provider_email_id = excluded.source_provider_email_id;
  update public.notification_outbox
  set status = 'failed', claimed_at = null, claim_token = null,
      claim_expires_at = null, delivery_status = v_reason
  where tenant_id = v_outbox.tenant_id
    and recipient_email_digest = v_outbox.recipient_email_digest
    and status = 'pending';
end;
$$;

create or replace function public.record_family_email_delivery_event_v1(
  p_provider_event_id text,
  p_provider_email_id text,
  p_event_type public.email_delivery_event_type,
  p_occurred_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_outbox public.notification_outbox%rowtype;
  v_retention_days integer;
  v_inserted integer;
begin
  if private.jwt_claim('role') is distinct from 'family_webhook_writer' then
    raise exception using errcode = '42501',
      message = 'dedicated family webhook writer required';
  end if;
  if p_provider_event_id is null
    or char_length(p_provider_event_id) not between 1 and 255
    or p_provider_email_id is null
    or char_length(p_provider_email_id) not between 1 and 255
    or p_event_type is null
    or p_occurred_at is null
    or p_occurred_at > statement_timestamp() + interval '5 minutes'
  then
    raise exception using errcode = '22023', message = 'invalid delivery event';
  end if;

  select * into v_outbox
  from public.notification_outbox as nox
  where nox.provider_email_id = p_provider_email_id
  for update;
  if v_outbox.id is null then
    return;
  end if;
  v_retention_days := private.family_retention_days_v1(
    v_outbox.tenant_id, 'email_delivery_event'
  );
  if v_retention_days is null then
    raise exception using errcode = '42501',
      message = 'approved delivery-event retention policy required';
  end if;

  insert into public.email_delivery_events (
    tenant_id, environment_id, data_mode, provider_event_id,
    provider_email_id, event_type, occurred_at,
    retention_anchor_at, expires_at
  ) values (
    v_outbox.tenant_id, v_outbox.environment_id, v_outbox.data_mode,
    p_provider_event_id, p_provider_email_id, p_event_type, p_occurred_at,
    statement_timestamp(),
    statement_timestamp() + make_interval(days => v_retention_days)
  ) on conflict (provider_event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return;
  end if;

  if p_event_type = 'delivered' then
    update public.notification_outbox
    set delivery_status = 'delivered'
    where tenant_id = v_outbox.tenant_id and id = v_outbox.id;
  else
    insert into public.email_suppressions (
      tenant_id, environment_id, data_mode, recipient_email_digest,
      reason, source_provider_email_id
    ) values (
      v_outbox.tenant_id, v_outbox.environment_id, v_outbox.data_mode,
      v_outbox.recipient_email_digest, p_event_type, p_provider_email_id
    ) on conflict (tenant_id, recipient_email_digest) do update
    set reason = excluded.reason,
        source_provider_email_id = excluded.source_provider_email_id;

    update public.notification_outbox
    set status = 'cancelled', claimed_at = null, claim_token = null,
        claim_expires_at = null,
        delivery_status = case
          when provider_email_id = p_provider_email_id then p_event_type
          else delivery_status
        end
    where tenant_id = v_outbox.tenant_id
      and recipient_email_digest = v_outbox.recipient_email_digest
      and status = 'pending';
    update public.notification_outbox
    set delivery_status = p_event_type
    where tenant_id = v_outbox.tenant_id and id = v_outbox.id;
  end if;
end;
$$;

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
  v_message public.family_messages%rowtype;
  v_thread public.family_threads%rowtype;
begin
  perform private.assert_family_idempotency_key(p_idempotency_key);
  if p_reason is null or char_length(btrim(p_reason)) not between 1 and 500 then
    raise exception using errcode = '22023', message = 'invalid redaction reason';
  end if;
  perform private.require_family_app_user();
  select * into v_message from public.family_messages
  where id = p_message_id for update;
  if v_message.id is null then
    raise exception using errcode = 'P0002', message = 'message not found';
  end if;
  select * into strict v_thread from public.family_threads
  where tenant_id = v_message.tenant_id and id = v_message.thread_id;
  if not public.family_has_role_v1(
    v_thread.tenant_id,
    array['school_admin', 'district_admin']::public.app_role[],
    v_thread.school_id,
    null
  ) then
    raise exception using errcode = 'P0002', message = 'message not found';
  end if;
  if v_message.redacted_at is not null then
    if v_message.redaction_idempotency_key = p_idempotency_key
      and v_message.redaction_reason = btrim(p_reason)
    then
      return;
    end if;
    raise exception using errcode = '22023', message = 'redaction conflict';
  end if;
  perform set_config('help_math.family_redaction', 'on', true);
  update public.family_messages
  set body = '[redacted]', redacted_at = clock_timestamp(),
      redacted_by_user_id = public.family_current_app_user_id_v1(),
      redaction_reason = btrim(p_reason),
      redaction_idempotency_key = p_idempotency_key
  where tenant_id = v_message.tenant_id and id = v_message.id;
end;
$$;

revoke all on function private.family_retention_days_v1(
  uuid, public.retention_data_class
) from public;
revoke all on function public.revoke_guardian_link_v1(uuid, text, text) from public;
revoke all on function public.relinquish_guardian_link_v1(uuid, text) from public;
revoke all on function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) from public;
revoke all on function public.mark_family_thread_read_v1(uuid, text) from public;
revoke all on function public.close_family_thread_v1(uuid, text) from public;
revoke all on function public.update_family_notification_preferences_v1(
  boolean, boolean, text
) from public;
revoke all on function public.ingest_learning_events_v2(jsonb) from public;
revoke all on function public.claim_family_notification_outbox_v1(integer) from public;
revoke all on function public.validate_family_notification_claim_v1(uuid, uuid)
  from public;
revoke all on function public.complete_family_notification_outbox_v1(
  uuid, uuid, boolean, text, text
) from public;
revoke all on function public.suppress_family_email_recipient_v1(text, text) from public;
revoke all on function public.record_family_email_delivery_event_v1(
  text, text, public.email_delivery_event_type, timestamptz
) from public;
revoke all on function public.record_family_email_delivery_event_v1(
  text, text, public.email_delivery_event_type, timestamptz
) from anon, authenticated, service_role;
revoke all on function public.redact_family_message_v1(uuid, text, text) from public;

grant execute on function public.revoke_guardian_link_v1(uuid, text, text)
  to authenticated;
grant execute on function public.relinquish_guardian_link_v1(uuid, text)
  to authenticated;
grant execute on function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) to authenticated;
grant execute on function public.mark_family_thread_read_v1(uuid, text)
  to authenticated;
grant execute on function public.close_family_thread_v1(uuid, text)
  to authenticated;
grant execute on function public.update_family_notification_preferences_v1(
  boolean, boolean, text
) to authenticated;
grant execute on function public.ingest_learning_events_v2(jsonb) to authenticated;
grant execute on function public.claim_family_notification_outbox_v1(integer)
  to service_role;
grant execute on function public.validate_family_notification_claim_v1(uuid, uuid)
  to service_role;
grant execute on function public.complete_family_notification_outbox_v1(
  uuid, uuid, boolean, text, text
) to service_role;
grant execute on function public.suppress_family_email_recipient_v1(text, text)
  to service_role;
grant execute on function public.redact_family_message_v1(uuid, text, text)
  to authenticated;

revoke all privileges on all tables in schema public
  from family_webhook_writer;
revoke all privileges on all sequences in schema public
  from family_webhook_writer;
revoke all privileges on all functions in schema public
  from family_webhook_writer;
revoke all on schema public from family_webhook_writer;
revoke all on schema private from family_webhook_writer;
revoke create on schema public from public;
grant usage on schema public to family_webhook_writer;
grant execute on function public.record_family_email_delivery_event_v1(
  text, text, public.email_delivery_event_type, timestamptz
) to family_webhook_writer;

comment on role family_webhook_writer is
  'NOLOGIN PostgREST webhook boundary. Authenticator may SET ROLE only for a separately signed server-held JWT whose role claim is family_webhook_writer.';
comment on function public.record_family_email_delivery_event_v1(
  text, text, public.email_delivery_event_type, timestamptz
) is
  'Dedicated webhook-writer RPC. Requires the exact verified family_webhook_writer JWT role and exposes no direct table or sequence access.';

comment on function public.send_family_message_v1(
  text, uuid, text, uuid, uuid, uuid, public.family_message_topic
) is
  'Derives tenant and actors from the locked thread/enrollment; production messaging fails closed without an approved active retention policy.';
comment on function public.claim_family_notification_outbox_v1(integer) is
  'Service-only SKIP LOCKED lease. Recipient email stays encrypted; the worker must revalidate the lease immediately before delivery and complete with token CAS.';

revoke update, delete on public.notification_outbox from service_role;

commit;
