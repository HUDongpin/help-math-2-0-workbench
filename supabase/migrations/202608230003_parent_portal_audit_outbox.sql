-- HELP Math family portal: immutable audit, outbox invariants, and terminal state guards.

begin;

create unique index notification_outbox_one_unread_thread_notice_idx
  on public.notification_outbox
    (tenant_id, kind, aggregate_id, recipient_user_id)
  where kind = 'family_message' and status = 'pending';

create or replace function private.assert_safe_audit_context(p_context jsonb)
returns void
language plpgsql
immutable
set search_path = pg_catalog
as $$
begin
  if jsonb_typeof(p_context) <> 'object' then
    raise exception using errcode = '22023', message = 'audit context must be an object';
  end if;
  if p_context ?| array[
    'body', 'message', 'email', 'recipient', 'subject', 'token', 'secret',
    'ciphertext', 'digest', 'password', 'authorization', 'cookie'
  ] then
    raise exception using errcode = '22023', message = 'secret-bearing audit key rejected';
  end if;
  if pg_column_size(p_context) > 4096 then
    raise exception using errcode = '22023', message = 'audit context is too large';
  end if;
end;
$$;

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
begin
  perform private.assert_safe_audit_context(p_context);
  select * into strict v_tenant
  from public.tenants
  where id = p_tenant_id;

  insert into public.audit_events (
    tenant_id, environment_id, data_mode, actor_user_id, action,
    entity_type, entity_id, context, retention_anchor_at, expires_at
  ) values (
    v_tenant.id, v_tenant.environment_id, v_tenant.data_mode,
    public.family_current_app_user_id_v1(), p_action, p_entity_type,
    p_entity_id, p_context, statement_timestamp(),
    statement_timestamp() + interval '30 days'
  );
end;
$$;

create or replace function private.audit_family_row_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_row jsonb;
  v_tenant_id uuid;
  v_entity_id uuid;
  v_context jsonb := '{}'::jsonb;
  v_action public.audit_action;
begin
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
    v_action := 'deleted';
  elsif tg_op = 'INSERT' then
    v_row := to_jsonb(new);
    v_action := 'inserted';
  else
    v_row := to_jsonb(new);
    v_action := 'updated';
  end if;

  v_tenant_id := (v_row ->> 'tenant_id')::uuid;
  v_entity_id := coalesce(
    nullif(v_row ->> 'id', '')::uuid,
    nullif(v_row ->> 'app_user_id', '')::uuid,
    nullif(v_row ->> 'event_id', '')::uuid,
    nullif(v_row ->> 'tenant_id', '')::uuid
  );

  case tg_table_name
    when 'role_bindings' then
      v_context := jsonb_build_object(
        'role', v_row ->> 'role', 'active', (v_row ->> 'active')::boolean,
        'schoolId', v_row ->> 'school_id', 'studentId', v_row ->> 'student_id'
      );
    when 'tenant_identity_issuers' then
      v_context := jsonb_build_object(
        'active', (v_row ->> 'active')::boolean
      );
    when 'class_staff_bindings' then
      v_context := jsonb_build_object(
        'active', (v_row ->> 'active')::boolean,
        'classId', v_row ->> 'class_id'
      );
    when 'guardian_links' then
      v_context := jsonb_build_object(
        'status', v_row ->> 'status', 'studentId', v_row ->> 'student_id'
      );
    when 'guardian_invitations' then
      v_context := jsonb_build_object(
        'status', v_row ->> 'status', 'studentId', v_row ->> 'student_id',
        'schoolId', v_row ->> 'school_id', 'sendCount', (v_row ->> 'send_count')::integer
      );
    when 'family_threads' then
      v_context := jsonb_build_object(
        'status', v_row ->> 'status', 'topic', v_row ->> 'topic',
        'studentId', v_row ->> 'child_id'
      );
    when 'family_messages' then
      v_context := jsonb_build_object(
        'threadId', v_row ->> 'thread_id',
        'redacted', (v_row ->> 'redacted_at') is not null
      );
    when 'family_notification_preferences' then
      v_context := jsonb_build_object(
        'messageEmailEnabled', (v_row ->> 'message_email_enabled')::boolean,
        'weeklyDigestEnabled', (v_row ->> 'weekly_digest_enabled')::boolean
      );
    when 'school_announcements' then
      v_context := jsonb_build_object(
        'schoolId', v_row ->> 'school_id', 'publishedAt', v_row ->> 'published_at'
      );
    when 'notification_outbox' then
      v_context := jsonb_build_object(
        'kind', v_row ->> 'kind', 'status', v_row ->> 'status',
        'aggregateType', v_row ->> 'aggregate_type',
        'aggregateId', v_row ->> 'aggregate_id'
      );
    else
      raise exception 'unsupported audited table %', tg_table_name;
  end case;

  perform private.write_family_audit(
    v_tenant_id,
    v_action,
    tg_table_name,
    v_entity_id,
    jsonb_strip_nulls(v_context)
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.validate_notification_outbox()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.payload ->> 'kind' is distinct from new.kind::text then
    raise exception using errcode = '22023', message = 'outbox kind mismatch';
  end if;
  if new.payload ?| array[
    'token', 'rawToken', 'body', 'messageBody', 'email', 'recipientEmail',
    'password', 'authorization', 'cookie'
  ] then
    raise exception using errcode = '22023', message = 'plaintext outbox field rejected';
  end if;
  if new.kind = 'guardian_invitation' and (
    not (new.payload ? 'encryptedInvitationToken')
    or char_length(new.payload ->> 'encryptedInvitationToken') < 16
  ) then
    raise exception using errcode = '22023', message = 'encrypted invitation token required';
  end if;
  if new.kind <> 'guardian_invitation' and new.payload ? 'encryptedInvitationToken' then
    raise exception using errcode = '22023', message = 'unexpected invitation token';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_guardian_link_terminal_state()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if old.status in ('revoked', 'expired') and new.status <> old.status then
    raise exception using errcode = '23514', message = 'guardian link state is terminal';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_invitation_terminal_state()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if old.status in ('accepted', 'revoked', 'expired') and new.status <> old.status then
    raise exception using errcode = '23514', message = 'invitation state is terminal';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_thread_terminal_state()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if old.status = 'closed' and new.status <> 'closed' then
    raise exception using errcode = '23514', message = 'closed family thread is terminal';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_message_append_only()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('help_math.family_retention', true) = 'on' then
      return old;
    end if;
    raise exception using errcode = '42501', message = 'family messages are append-only';
  end if;
  if current_setting('help_math.family_redaction', true) <> 'on' then
    raise exception using errcode = '42501', message = 'family messages are append-only';
  end if;
  if (to_jsonb(new) - array[
      'body', 'redacted_at', 'redacted_by_user_id',
      'redaction_reason', 'redaction_idempotency_key'
    ]) is distinct from (to_jsonb(old) - array[
      'body', 'redacted_at', 'redacted_by_user_id',
      'redaction_reason', 'redaction_idempotency_key'
    ])
    or old.redacted_at is not null
    or new.redacted_at is null
    or new.body <> '[redacted]'
    or new.redacted_by_user_id is null
    or new.redaction_reason is null
    or new.redaction_idempotency_key is null
  then
    raise exception using errcode = '42501', message = 'invalid message redaction';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_audit_append_only()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'UPDATE'
    or current_setting('help_math.family_retention', true) <> 'on'
  then
    raise exception using errcode = '42501', message = 'audit events are append-only';
  end if;
  return old;
end;
$$;

create or replace function private.derive_email_delivery_tenant()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
begin
  select nox.tenant_id, nox.environment_id, nox.data_mode
  into new.tenant_id, new.environment_id, new.data_mode
  from public.notification_outbox as nox
  where nox.provider_email_id = new.provider_email_id;

  if new.tenant_id is null then
    raise exception using errcode = '23503', message = 'unknown provider email id';
  end if;
  return new;
end;
$$;

create or replace function private.validate_family_relationship()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
declare
  v_new jsonb;
begin
  v_new := to_jsonb(new);
  if tg_table_name = 'enrollments' and not exists (
    select 1
    from public.students as s
    join public.classes as c on c.tenant_id = s.tenant_id
    where s.tenant_id = (v_new ->> 'tenant_id')::uuid
      and s.id = (v_new ->> 'student_id')::uuid
      and c.id = (v_new ->> 'class_id')::uuid and c.school_id = s.school_id
  ) then
    raise exception using errcode = '23514',
      message = 'enrollment student and class must share a school';
  elsif tg_table_name = 'class_staff_bindings' and not exists (
    select 1
    from public.classes as c
    join public.role_bindings as rb
      on rb.tenant_id = c.tenant_id and rb.school_id = c.school_id
    where c.tenant_id = (v_new ->> 'tenant_id')::uuid
      and c.id = (v_new ->> 'class_id')::uuid
      and rb.app_user_id = (v_new ->> 'teacher_user_id')::uuid
      and rb.role = 'teacher' and rb.active
  ) then
    raise exception using errcode = '23514',
      message = 'class staff binding requires an active school teacher role';
  elsif tg_table_name = 'assignments' and not exists (
    select 1
    from public.class_staff_bindings as csb
    where csb.tenant_id = (v_new ->> 'tenant_id')::uuid
      and csb.class_id = (v_new ->> 'class_id')::uuid
      and csb.teacher_user_id = (v_new ->> 'teacher_user_id')::uuid
      and csb.active
      and csb.starts_at <= statement_timestamp()
      and (csb.ends_at is null or csb.ends_at > statement_timestamp())
  ) then
    raise exception using errcode = '23514',
      message = 'assignment teacher requires an active class binding';
  elsif tg_table_name = 'student_assignments' and not exists (
    select 1
    from public.enrollments as e
    join public.assignments as a on a.tenant_id = e.tenant_id
    where e.tenant_id = (v_new ->> 'tenant_id')::uuid
      and e.id = (v_new ->> 'enrollment_id')::uuid
      and a.id = (v_new ->> 'assignment_id')::uuid and a.class_id = e.class_id
  ) then
    raise exception using errcode = '23514',
      message = 'student assignment must use the enrolled class';
  elsif tg_table_name = 'progress_projections_v1'
    and v_new ->> 'assignment_id' is not null
    and not exists (
      select 1
      from public.student_assignments as sa
      join public.enrollments as e
        on e.tenant_id = sa.tenant_id and e.id = sa.enrollment_id
      where sa.tenant_id = (v_new ->> 'tenant_id')::uuid
        and sa.assignment_id = (v_new ->> 'assignment_id')::uuid
        and e.student_id = (v_new ->> 'student_id')::uuid
    )
  then
    raise exception using errcode = '23514',
      message = 'progress projection assignment does not belong to student';
  elsif tg_table_name = 'family_threads' and not exists (
    select 1
    from public.enrollments as e
    join public.classes as c
      on c.tenant_id = e.tenant_id and c.id = e.class_id
    where e.tenant_id = (v_new ->> 'tenant_id')::uuid
      and e.id = (v_new ->> 'enrollment_id')::uuid
      and e.student_id = (v_new ->> 'child_id')::uuid
      and c.school_id = (v_new ->> 'school_id')::uuid
  ) then
    raise exception using errcode = '23514',
      message = 'family thread enrollment scope mismatch';
  end if;
  return new;
end;
$$;

create trigger notification_outbox_validate
before insert or update on public.notification_outbox
for each row execute function private.validate_notification_outbox();
create trigger guardian_links_terminal
before update on public.guardian_links
for each row execute function private.enforce_guardian_link_terminal_state();
create trigger guardian_invitations_terminal
before update on public.guardian_invitations
for each row execute function private.enforce_invitation_terminal_state();
create trigger family_threads_terminal
before update on public.family_threads
for each row execute function private.enforce_thread_terminal_state();
create trigger family_messages_append_only
before update or delete on public.family_messages
for each row execute function private.enforce_message_append_only();
create trigger audit_events_append_only
before update or delete on public.audit_events
for each row execute function private.enforce_audit_append_only();
create trigger email_delivery_events_derive_tenant
before insert on public.email_delivery_events
for each row execute function private.derive_email_delivery_tenant();

create trigger enrollments_relationship
before insert or update on public.enrollments
for each row execute function private.validate_family_relationship();
create trigger class_staff_bindings_relationship
before insert or update on public.class_staff_bindings
for each row execute function private.validate_family_relationship();
create trigger assignments_relationship
before insert or update on public.assignments
for each row execute function private.validate_family_relationship();
create trigger student_assignments_relationship
before insert or update on public.student_assignments
for each row execute function private.validate_family_relationship();
create trigger progress_projections_relationship
before insert or update on public.progress_projections_v1
for each row execute function private.validate_family_relationship();
create trigger family_threads_relationship
before insert or update on public.family_threads
for each row execute function private.validate_family_relationship();

do $audit_triggers$
declare
  table_name text;
begin
  foreach table_name in array array[
    'tenant_identity_issuers', 'role_bindings', 'class_staff_bindings',
    'guardian_links',
    'guardian_invitations',
    'family_threads', 'family_messages', 'family_notification_preferences',
    'school_announcements', 'notification_outbox'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.audit_family_row_change()',
      table_name || '_audit', table_name
    );
  end loop;
end;
$audit_triggers$;

revoke all on function private.assert_safe_audit_context(jsonb) from public;
revoke all on function private.write_family_audit(
  uuid, public.audit_action, text, uuid, jsonb
) from public;
revoke all on function private.audit_family_row_change() from public;
revoke all on function private.validate_notification_outbox() from public;
revoke all on function private.enforce_guardian_link_terminal_state() from public;
revoke all on function private.enforce_invitation_terminal_state() from public;
revoke all on function private.enforce_thread_terminal_state() from public;
revoke all on function private.enforce_message_append_only() from public;
revoke all on function private.enforce_audit_append_only() from public;
revoke all on function private.derive_email_delivery_tenant() from public;
revoke all on function private.validate_family_relationship() from public;

commit;
