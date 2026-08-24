-- HELP Math family portal: complete lifecycle retention, exact outbox DTOs,
-- and least-privilege teacher/admin read models.

-- Enum additions must commit before the values can be referenced by functions.
alter type public.retention_data_class add value if not exists 'tenant_fixture';
alter type public.retention_data_class add value if not exists 'app_user_contact';
alter type public.retention_data_class add value if not exists 'provider_identity';
alter type public.retention_data_class add value if not exists 'role_binding';
alter type public.retention_data_class add value if not exists 'guardian_link';
alter type public.retention_data_class add value if not exists 'family_thread';
alter type public.retention_data_class add value if not exists 'family_thread_read';
alter type public.retention_data_class add value if not exists 'notification_preference';
alter type public.retention_data_class add value if not exists 'email_suppression';
alter type public.retention_data_class add value if not exists 'retention_receipt';

begin;

alter table public.tenants
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz,
  add column closed_at timestamptz,
  add column teardown_idempotency_key text;
alter table public.app_users
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz;
alter table public.provider_identities
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz;
alter table public.role_bindings
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz;
alter table public.guardian_links
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz;
alter table public.family_threads
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz;
alter table public.family_thread_reads
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz;
alter table public.family_notification_preferences
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz;
alter table public.email_suppressions
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz;
alter table public.retention_runs
  add column lifecycle_retention_anchor_at timestamptz,
  add column lifecycle_expires_at timestamptz;

update public.tenants
set lifecycle_retention_anchor_at = created_at,
    lifecycle_expires_at = case
      when data_mode = 'synthetic' then created_at + interval '30 days'
      else null
    end;
update public.app_users
set lifecycle_retention_anchor_at = created_at,
    lifecycle_expires_at = created_at + interval '30 days';
update public.provider_identities
set lifecycle_retention_anchor_at = created_at,
    lifecycle_expires_at = created_at + interval '30 days';
update public.role_bindings
set lifecycle_retention_anchor_at = created_at,
    lifecycle_expires_at = created_at + interval '30 days';
update public.guardian_links
set lifecycle_retention_anchor_at = created_at,
    lifecycle_expires_at = created_at + interval '30 days';
update public.family_threads
set lifecycle_retention_anchor_at = created_at,
    lifecycle_expires_at = created_at + interval '30 days';
update public.family_thread_reads
set lifecycle_retention_anchor_at = updated_at,
    lifecycle_expires_at = updated_at + interval '30 days';
update public.family_notification_preferences
set lifecycle_retention_anchor_at = created_at,
    lifecycle_expires_at = created_at + interval '30 days';
update public.email_suppressions
set lifecycle_retention_anchor_at = created_at,
    lifecycle_expires_at = created_at + interval '30 days';
update public.retention_runs
set lifecycle_retention_anchor_at = started_at,
    lifecycle_expires_at = started_at + interval '30 days';

alter table public.tenants
  alter column lifecycle_retention_anchor_at set not null,
  alter column lifecycle_retention_anchor_at set default statement_timestamp(),
  add constraint tenants_lifecycle_retention check (
    (data_mode = 'production' and lifecycle_expires_at is null)
    or (
      lifecycle_expires_at is not null
      and
      lifecycle_expires_at > lifecycle_retention_anchor_at
      and lifecycle_expires_at <= lifecycle_retention_anchor_at + interval '30 days'
    )
  ),
  add constraint tenants_closed_state check (
    (status <> 'closed' and closed_at is null and teardown_idempotency_key is null)
    or (
      status = 'closed' and closed_at is not null
      and char_length(teardown_idempotency_key) between 8 and 128
      and teardown_idempotency_key ~ '^[A-Za-z0-9._:-]+$'
    )
  );

create or replace function private.initialize_tenant_lifecycle_retention_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  new.lifecycle_retention_anchor_at := coalesce(
    new.lifecycle_retention_anchor_at, statement_timestamp()
  );
  if new.data_mode = 'synthetic' and new.lifecycle_expires_at is null then
    new.lifecycle_expires_at :=
      new.lifecycle_retention_anchor_at + interval '30 days';
  end if;
  return new;
end;
$$;

create trigger tenants_initialize_lifecycle_retention
before insert on public.tenants
for each row execute function private.initialize_tenant_lifecycle_retention_v1();

do $lifecycle_constraints$
declare
  table_name text;
begin
  foreach table_name in array array[
    'app_users', 'provider_identities', 'role_bindings', 'guardian_links',
    'family_threads', 'family_thread_reads',
    'family_notification_preferences', 'email_suppressions', 'retention_runs'
  ] loop
    execute format(
      'alter table public.%I alter column lifecycle_retention_anchor_at set not null, alter column lifecycle_expires_at set not null, add constraint %I check (lifecycle_expires_at > lifecycle_retention_anchor_at and lifecycle_expires_at <= lifecycle_retention_anchor_at + interval ''30 days'')',
      table_name,
      table_name || '_lifecycle_retention'
    );
  end loop;
end;
$lifecycle_constraints$;

alter table public.app_users
  alter column lifecycle_retention_anchor_at set default statement_timestamp(),
  alter column lifecycle_expires_at set default (
    statement_timestamp() + interval '30 days'
  );
alter table public.provider_identities
  alter column lifecycle_retention_anchor_at set default statement_timestamp(),
  alter column lifecycle_expires_at set default (
    statement_timestamp() + interval '30 days'
  );

create index role_bindings_lifecycle_expiry_idx
  on public.role_bindings (tenant_id, lifecycle_expires_at);
create index guardian_links_lifecycle_expiry_idx
  on public.guardian_links (tenant_id, lifecycle_expires_at);
create index family_threads_lifecycle_expiry_idx
  on public.family_threads (tenant_id, lifecycle_expires_at);
create index family_thread_reads_lifecycle_expiry_idx
  on public.family_thread_reads (tenant_id, lifecycle_expires_at);
create index family_notification_preferences_lifecycle_expiry_idx
  on public.family_notification_preferences (tenant_id, lifecycle_expires_at);
create index email_suppressions_lifecycle_expiry_idx
  on public.email_suppressions (tenant_id, lifecycle_expires_at);
create index app_users_lifecycle_expiry_idx
  on public.app_users (lifecycle_expires_at);
create index provider_identities_lifecycle_expiry_idx
  on public.provider_identities (app_user_id, lifecycle_expires_at);

create or replace function private.family_approved_retention_days_v2(
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
    when t.data_mode = 'synthetic' then least(30, coalesce((
      select rp.retention_days
      from public.retention_policies as rp
      where rp.tenant_id = t.id and rp.data_class = p_data_class
        and rp.enabled and not rp.legal_hold
    ), 30))
    else (
      select rp.retention_days
      from public.retention_policies as rp
      where rp.tenant_id = t.id and rp.data_class = p_data_class
        and rp.enabled and not rp.legal_hold
        and rp.approved_at is not null and rp.approved_by_user_id is not null
    )
  end
  from public.tenants as t
  where t.id = p_tenant_id;
$$;

create or replace function private.apply_family_lifecycle_retention_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_old jsonb;
  v_tenant_id uuid;
  v_anchor timestamptz;
  v_expiry timestamptz;
  v_days integer;
  v_contact_days integer;
  v_provider_days integer;
begin
  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    if v_row ->> 'lifecycle_retention_anchor_at' is distinct from
        v_old ->> 'lifecycle_retention_anchor_at'
      or (v_row ->> 'lifecycle_expires_at')::timestamptz >
        (v_old ->> 'lifecycle_expires_at')::timestamptz
    then
      raise exception using errcode = '23514',
        message = 'family lifecycle retention clock cannot be extended';
    end if;
    return new;
  end if;

  v_tenant_id := nullif(v_row ->> 'tenant_id', '')::uuid;
  if tg_table_name = 'role_bindings' then
    v_contact_days := private.family_approved_retention_days_v2(
      v_tenant_id, 'app_user_contact'
    );
    v_provider_days := private.family_approved_retention_days_v2(
      v_tenant_id, 'provider_identity'
    );
    if v_contact_days is null or v_provider_days is null then
      raise exception using errcode = '42501',
        message = 'approved identity retention policies required';
    end if;
    update public.app_users
    set lifecycle_expires_at = least(
      lifecycle_expires_at,
      lifecycle_retention_anchor_at + make_interval(days => least(v_contact_days, 30))
    )
    where id = new.app_user_id;
    update public.provider_identities
    set lifecycle_expires_at = least(
      lifecycle_expires_at,
      lifecycle_retention_anchor_at + make_interval(days => least(v_provider_days, 30))
    )
    where app_user_id = new.app_user_id;
  end if;
  v_days := private.family_approved_retention_days_v2(
    v_tenant_id, tg_argv[0]::public.retention_data_class
  );
  if v_days is null then
    raise exception using errcode = '42501',
      message = 'approved lifecycle retention policy required';
  end if;
  v_anchor := coalesce(
    nullif(v_row ->> 'lifecycle_retention_anchor_at', '')::timestamptz,
    nullif(v_row ->> 'created_at', '')::timestamptz,
    statement_timestamp()
  );
  v_expiry := coalesce(
    nullif(v_row ->> 'lifecycle_expires_at', '')::timestamptz,
    v_anchor + make_interval(days => v_days)
  );
  if v_expiry <= v_anchor
    or v_expiry > v_anchor + make_interval(days => least(v_days, 30))
  then
    raise exception using errcode = '23514',
      message = 'invalid family lifecycle retention clock';
  end if;
  new := jsonb_populate_record(new, jsonb_build_object(
    'lifecycle_retention_anchor_at', v_anchor,
    'lifecycle_expires_at', v_expiry
  ));
  return new;
end;
$$;

create or replace function private.enforce_global_family_identity_lifecycle_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_days integer;
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
begin
  if new.lifecycle_retention_anchor_at is distinct from
      old.lifecycle_retention_anchor_at
    or new.lifecycle_expires_at > old.lifecycle_expires_at
  then
    raise exception using errcode = '23514',
      message = 'global identity retention clock cannot be extended';
  end if;
  if tg_table_name = 'app_users'
    and v_old ->> 'status' = 'disabled'
    and v_new ->> 'status' is distinct from v_old ->> 'status'
  then
    raise exception using errcode = '23514', message = 'disabled app user is terminal';
  end if;
  if tg_table_name = 'app_users'
    and (
      v_new ->> 'notification_email_digest' is distinct from
        v_old ->> 'notification_email_digest'
      or v_new ->> 'notification_email_ciphertext' is distinct from
        v_old ->> 'notification_email_ciphertext'
    )
  then
    select min(private.family_approved_retention_days_v2(scope.tenant_id, 'app_user_contact'))
    into v_days
    from (
      select rb.tenant_id
      from public.role_bindings as rb
      where rb.app_user_id = (v_new ->> 'id')::uuid and rb.active
      union
      select gl.tenant_id
      from public.guardian_links as gl
      where gl.guardian_user_id = (v_new ->> 'id')::uuid and gl.status = 'active'
    ) as scope;
    if exists (
      select 1
      from (
        select rb.tenant_id
        from public.role_bindings as rb
        where rb.app_user_id = (v_new ->> 'id')::uuid and rb.active
        union
        select gl.tenant_id
        from public.guardian_links as gl
        where gl.guardian_user_id = (v_new ->> 'id')::uuid and gl.status = 'active'
      ) as scope
      where private.family_approved_retention_days_v2(
        scope.tenant_id, 'app_user_contact'
      ) is null
    ) then
      raise exception using errcode = '42501',
        message = 'approved contact retention policy required';
    end if;
    if v_days is not null then
      new.lifecycle_expires_at := least(
        new.lifecycle_expires_at,
        new.lifecycle_retention_anchor_at + make_interval(days => least(v_days, 30))
      );
    end if;
  end if;
  if tg_table_name = 'provider_identities'
    and not (v_old ->> 'active')::boolean
    and (v_new ->> 'active')::boolean
  then
    raise exception using errcode = '23514', message = 'revoked provider identity is terminal';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_tenant_and_role_terminal_state_v1()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_table_name = 'tenants' then
    if old.status = 'closed' and new.status <> 'closed' then
      raise exception using errcode = '23514', message = 'closed tenant is terminal';
    end if;
    if new.lifecycle_retention_anchor_at is distinct from
        old.lifecycle_retention_anchor_at
      or (
        old.lifecycle_expires_at is not null
        and new.lifecycle_expires_at > old.lifecycle_expires_at
      )
    then
      raise exception using errcode = '23514',
        message = 'tenant lifecycle retention clock cannot be extended';
    end if;
  elsif tg_table_name in ('role_bindings', 'class_staff_bindings')
    and not old.active and new.active
  then
    raise exception using errcode = '23514', message = 'inactive role binding is terminal';
  end if;
  return new;
end;
$$;

create or replace function private.apply_family_record_retention_v2()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_old jsonb;
  v_tenant_id uuid;
  v_anchor timestamptz;
  v_expiry timestamptz;
  v_days integer;
begin
  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    new := jsonb_populate_record(new, jsonb_build_object(
      'retention_anchor_at', least(
        (v_old ->> 'retention_anchor_at')::timestamptz,
        (v_row ->> 'retention_anchor_at')::timestamptz
      ),
      'expires_at', least(
        (v_old ->> 'expires_at')::timestamptz,
        (v_row ->> 'expires_at')::timestamptz
      )
    ));
    return new;
  end if;
  v_tenant_id := (v_row ->> 'tenant_id')::uuid;
  v_days := private.family_approved_retention_days_v2(
    v_tenant_id, tg_argv[0]::public.retention_data_class
  );
  if v_days is null then
    raise exception using errcode = '42501',
      message = 'approved record retention policy required';
  end if;
  v_anchor := (v_row ->> 'retention_anchor_at')::timestamptz;
  v_expiry := (v_row ->> 'expires_at')::timestamptz;
  if v_expiry <= v_anchor
    or v_expiry > v_anchor + make_interval(days => least(v_days, 30))
  then
    raise exception using errcode = '23514', message = 'record expiry exceeds retention policy';
  end if;
  return new;
end;
$$;

do $lifecycle_triggers$
declare
  table_name text;
  data_class text;
begin
  for table_name, data_class in values
    ('role_bindings', 'role_binding'),
    ('guardian_links', 'guardian_link'),
    ('family_threads', 'family_thread'),
    ('family_thread_reads', 'family_thread_read'),
    ('family_notification_preferences', 'notification_preference'),
    ('email_suppressions', 'email_suppression'),
    ('retention_runs', 'retention_receipt')
  loop
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function private.apply_family_lifecycle_retention_v1(%L)',
      table_name || '_lifecycle_retention', table_name, data_class
    );
  end loop;
end;
$lifecycle_triggers$;

do $record_retention_triggers$
declare
  table_name text;
  data_class text;
begin
  for table_name, data_class in values
    ('family_messages', 'family_message'),
    ('learning_events_v2', 'learning_event'),
    ('progress_projections_v1', 'learning_event'),
    ('skill_projections_v1', 'learning_event'),
    ('school_announcements', 'school_announcement'),
    ('notification_outbox', 'notification_outbox'),
    ('email_delivery_events', 'email_delivery_event'),
    ('audit_events', 'audit_event')
  loop
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function private.apply_family_record_retention_v2(%L)',
      table_name || '_retention_policy', table_name, data_class
    );
  end loop;
end;
$record_retention_triggers$;

create trigger app_users_identity_lifecycle
before update on public.app_users
for each row execute function private.enforce_global_family_identity_lifecycle_v1();
create trigger provider_identities_identity_lifecycle
before update on public.provider_identities
for each row execute function private.enforce_global_family_identity_lifecycle_v1();
create trigger tenants_terminal_lifecycle
before update on public.tenants
for each row execute function private.enforce_tenant_and_role_terminal_state_v1();
create trigger role_bindings_terminal_lifecycle
before update on public.role_bindings
for each row execute function private.enforce_tenant_and_role_terminal_state_v1();
create trigger class_staff_bindings_terminal_lifecycle
before update on public.class_staff_bindings
for each row execute function private.enforce_tenant_and_role_terminal_state_v1();

create or replace function private.assert_safe_outbox_payload_v2(
  p_kind public.notification_kind,
  p_payload jsonb
)
returns void
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_depth integer;
  v_nodes integer;
begin
  if jsonb_typeof(p_payload) <> 'object'
    or octet_length(p_payload::text) > 12288
  then
    raise exception using errcode = '22023', message = 'invalid outbox payload envelope';
  end if;

  with recursive payload_nodes(value, depth) as (
    select p_payload, 0
    union all
    select child.value, parent.depth + 1
    from payload_nodes as parent
    cross join lateral (
      select object_child.value
      from jsonb_each(case when jsonb_typeof(parent.value) = 'object'
        then parent.value else '{}'::jsonb end) as object_child
      union all
      select array_child.value
      from jsonb_array_elements(case when jsonb_typeof(parent.value) = 'array'
        then parent.value else '[]'::jsonb end) as array_child
    ) as child
    where parent.depth < 5
  )
  select max(depth), count(*) into v_depth, v_nodes from payload_nodes;
  if v_depth > 4 or v_nodes > 64 then
    raise exception using errcode = '22023', message = 'outbox payload complexity exceeded';
  end if;

  if exists (
    with recursive payload_nodes(value, depth) as (
      select p_payload, 0
      union all
      select child.value, parent.depth + 1
      from payload_nodes as parent
      cross join lateral (
        select object_child.value
        from jsonb_each(case when jsonb_typeof(parent.value) = 'object'
          then parent.value else '{}'::jsonb end) as object_child
        union all
        select array_child.value
        from jsonb_array_elements(case when jsonb_typeof(parent.value) = 'array'
          then parent.value else '[]'::jsonb end) as array_child
      ) as child
      where parent.depth < 5
    )
    select 1
    from payload_nodes as node
    cross join lateral jsonb_object_keys(case
      when jsonb_typeof(node.value) = 'object' then node.value
      else '{}'::jsonb
    end) as payload_key(key)
    where lower(payload_key.key) = any(array[
      'token', 'rawtoken', 'body', 'messagebody', 'email', 'recipientemail',
      'password', 'authorization', 'cookie', 'secret', 'plaintext',
      'recipient', 'ciphertext', 'digest'
    ])
  ) then
    raise exception using errcode = '22023', message = 'forbidden nested outbox field rejected';
  end if;

  if p_payload ->> 'kind' is distinct from p_kind::text then
    raise exception using errcode = '22023', message = 'outbox kind mismatch';
  end if;
  case p_kind
    when 'guardian_invitation' then
      if not (
          array(select jsonb_object_keys(p_payload) order by 1) =
            array['encryptedInvitationToken', 'kind']::text[]
          or array(select jsonb_object_keys(p_payload) order by 1) =
            array['encryptedInvitationToken', 'invitationId', 'kind']::text[]
        )
        or jsonb_typeof(p_payload -> 'encryptedInvitationToken') <> 'string'
        or char_length(p_payload ->> 'encryptedInvitationToken') not between 16 and 8192
        or (
          p_payload ? 'invitationId'
          and (
            jsonb_typeof(p_payload -> 'invitationId') <> 'string'
            or (p_payload ->> 'invitationId') !~
              '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          )
        )
      then
        raise exception using errcode = '22023', message = 'invalid invitation outbox payload';
      end if;
    when 'family_message' then
      if array(select jsonb_object_keys(p_payload) order by 1) is distinct from
          array['kind']::text[]
      then
        raise exception using errcode = '22023', message = 'invalid family message outbox payload';
      end if;
    when 'account_security' then
      if array(select jsonb_object_keys(p_payload) order by 1) is distinct from
          array['kind']::text[]
      then
        raise exception using errcode = '22023', message = 'invalid account security outbox payload';
      end if;
    when 'weekly_family_digest' then
      if array(select jsonb_object_keys(p_payload) order by 1) is distinct from
          array['activityCount', 'kind', 'openAssignmentCount', 'unreadThreadCount']::text[]
        or jsonb_typeof(p_payload -> 'activityCount') <> 'number'
        or jsonb_typeof(p_payload -> 'openAssignmentCount') <> 'number'
        or jsonb_typeof(p_payload -> 'unreadThreadCount') <> 'number'
      then
        raise exception using errcode = '22023', message = 'invalid weekly digest outbox payload';
      end if;
      begin
        if (p_payload ->> 'activityCount')::numeric <>
            trunc((p_payload ->> 'activityCount')::numeric)
          or (p_payload ->> 'openAssignmentCount')::numeric <>
            trunc((p_payload ->> 'openAssignmentCount')::numeric)
          or (p_payload ->> 'unreadThreadCount')::numeric <>
            trunc((p_payload ->> 'unreadThreadCount')::numeric)
          or (p_payload ->> 'activityCount')::numeric not between 0 and 1000000
          or (p_payload ->> 'openAssignmentCount')::numeric not between 0 and 1000000
          or (p_payload ->> 'unreadThreadCount')::numeric not between 0 and 1000000
        then
          raise exception using errcode = '22023',
            message = 'invalid weekly digest outbox payload';
        end if;
      exception when others then
        raise exception using errcode = '22023',
          message = 'invalid weekly digest outbox payload';
      end;
  end case;
end;
$$;

create or replace function private.validate_notification_outbox()
returns trigger
language plpgsql
set search_path = pg_catalog, private
as $$
begin
  perform private.assert_safe_outbox_payload_v2(new.kind, new.payload);
  return new;
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
  v_days integer;
begin
  perform private.assert_safe_audit_context(p_context);
  select * into strict v_tenant from public.tenants where id = p_tenant_id;
  v_days := private.family_approved_retention_days_v2(
    v_tenant.id, 'audit_event'
  );
  if v_days is null then
    raise exception using errcode = '42501',
      message = 'approved audit retention policy required';
  end if;
  insert into public.audit_events (
    tenant_id, environment_id, data_mode, actor_user_id, action,
    entity_type, entity_id, context, retention_anchor_at, expires_at
  ) values (
    v_tenant.id, v_tenant.environment_id, v_tenant.data_mode,
    public.family_current_app_user_id_v1(), p_action, p_entity_type,
    p_entity_id, p_context, statement_timestamp(),
    statement_timestamp() + make_interval(days => v_days)
  );
end;
$$;

-- Retention deletion must not create a new audit row whose clock starts after
-- the source row. Ordinary changes retain the exact privacy-safe audit DTO.
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
  if current_setting('help_math.family_retention', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old); v_action := 'deleted';
  elsif tg_op = 'INSERT' then
    v_row := to_jsonb(new); v_action := 'inserted';
  else
    v_row := to_jsonb(new); v_action := 'updated';
  end if;
  v_tenant_id := (v_row ->> 'tenant_id')::uuid;
  v_entity_id := coalesce(
    nullif(v_row ->> 'id', '')::uuid,
    nullif(v_row ->> 'app_user_id', '')::uuid,
    nullif(v_row ->> 'event_id', '')::uuid,
    nullif(v_row ->> 'tenant_id', '')::uuid
  );
  case tg_table_name
    when 'role_bindings' then v_context := jsonb_build_object(
      'role', v_row ->> 'role', 'active', (v_row ->> 'active')::boolean,
      'schoolId', v_row ->> 'school_id', 'studentId', v_row ->> 'student_id');
    when 'tenant_identity_issuers' then v_context := jsonb_build_object(
      'active', (v_row ->> 'active')::boolean);
    when 'class_staff_bindings' then v_context := jsonb_build_object(
      'active', (v_row ->> 'active')::boolean, 'classId', v_row ->> 'class_id');
    when 'guardian_links' then v_context := jsonb_build_object(
      'status', v_row ->> 'status', 'studentId', v_row ->> 'student_id');
    when 'guardian_invitations' then v_context := jsonb_build_object(
      'status', v_row ->> 'status', 'studentId', v_row ->> 'student_id',
      'schoolId', v_row ->> 'school_id', 'sendCount', (v_row ->> 'send_count')::integer);
    when 'family_threads' then v_context := jsonb_build_object(
      'status', v_row ->> 'status', 'topic', v_row ->> 'topic',
      'studentId', v_row ->> 'child_id');
    when 'family_messages' then v_context := jsonb_build_object(
      'threadId', v_row ->> 'thread_id',
      'redacted', (v_row ->> 'redacted_at') is not null);
    when 'family_notification_preferences' then v_context := jsonb_build_object(
      'messageEmailEnabled', (v_row ->> 'message_email_enabled')::boolean,
      'weeklyDigestEnabled', (v_row ->> 'weekly_digest_enabled')::boolean);
    when 'school_announcements' then v_context := jsonb_build_object(
      'schoolId', v_row ->> 'school_id', 'publishedAt', v_row ->> 'published_at');
    when 'notification_outbox' then v_context := jsonb_build_object(
      'kind', v_row ->> 'kind', 'status', v_row ->> 'status',
      'aggregateType', v_row ->> 'aggregate_type',
      'aggregateId', v_row ->> 'aggregate_id');
    else raise exception 'unsupported audited table %', tg_table_name;
  end case;
  perform private.write_family_audit(
    v_tenant_id, v_action, tg_table_name, v_entity_id,
    jsonb_strip_nulls(v_context)
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

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
  update public.role_bindings
  set active = false, ends_at = coalesce(ends_at, clock_timestamp())
  where tenant_id = v_tenant.id and active;
  update public.class_staff_bindings
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

create or replace function private.purge_family_lifecycle_v2(
  p_tenant_id uuid,
  p_batch_size integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_tenant public.tenants%rowtype;
  v_count integer;
  v_counts jsonb := '{}'::jsonb;
  v_candidate_users uuid[] := array[]::uuid[];
begin
  select * into v_tenant from public.tenants where id = p_tenant_id for update;
  if v_tenant.id is null then return v_counts; end if;

  if v_tenant.data_mode = 'synthetic'
    and v_tenant.status <> 'closed'
    and v_tenant.lifecycle_expires_at <= statement_timestamp()
  then
    perform public.begin_family_tenant_teardown_v1(
      v_tenant.id, 'retention:auto:' || v_tenant.id::text
    );
    select * into strict v_tenant from public.tenants where id = p_tenant_id;
  end if;

  select coalesce(array_agg(distinct candidate.user_id), array[]::uuid[])
  into v_candidate_users
  from (
    select app_user_id as user_id from public.role_bindings where tenant_id = v_tenant.id
    union select guardian_user_id from public.guardian_links where tenant_id = v_tenant.id
    union select created_by_user_id from public.guardian_links where tenant_id = v_tenant.id
    union select teacher_user_id from public.class_staff_bindings where tenant_id = v_tenant.id
    union select teacher_user_id from public.assignments where tenant_id = v_tenant.id
    union select invited_by_user_id from public.guardian_invitations where tenant_id = v_tenant.id
    union select accepted_by_user_id from public.guardian_invitations
      where tenant_id = v_tenant.id and accepted_by_user_id is not null
    union select revoked_by_user_id from public.guardian_invitations
      where tenant_id = v_tenant.id and revoked_by_user_id is not null
    union select guardian_user_id from public.family_threads where tenant_id = v_tenant.id
    union select staff_user_id from public.family_threads where tenant_id = v_tenant.id
    union select created_by_user_id from public.family_threads where tenant_id = v_tenant.id
    union select sender_user_id from public.family_messages where tenant_id = v_tenant.id
    union select redacted_by_user_id from public.family_messages
      where tenant_id = v_tenant.id and redacted_by_user_id is not null
    union select recorded_by_user_id from public.learning_events_v2 where tenant_id = v_tenant.id
    union select publisher_user_id from public.school_announcements where tenant_id = v_tenant.id
    union select app_user_id from public.family_notification_preferences where tenant_id = v_tenant.id
    union select recipient_user_id from public.notification_outbox
      where tenant_id = v_tenant.id and recipient_user_id is not null
    union select actor_user_id from public.audit_events
      where tenant_id = v_tenant.id and actor_user_id is not null
    union select approved_by_user_id from public.retention_policies
      where tenant_id = v_tenant.id and approved_by_user_id is not null
  ) as candidate;

  if private.family_retention_delete_allowed_v1(v_tenant.id, 'family_thread')
    and private.family_retention_delete_allowed_v1(v_tenant.id, 'family_thread_read')
    and private.family_retention_delete_allowed_v1(v_tenant.id, 'family_message')
  then
    delete from public.family_threads
    where ctid in (
      select candidate.ctid from public.family_threads as candidate
      where candidate.tenant_id = v_tenant.id and candidate.status = 'closed'
        and candidate.lifecycle_expires_at <= statement_timestamp()
        and not exists (
          select 1 from public.family_messages as fm
          where fm.tenant_id = candidate.tenant_id
            and fm.thread_id = candidate.id
        )
      order by candidate.lifecycle_expires_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('familyThreads', v_count);
  end if;

  if private.family_retention_delete_allowed_v1(
    v_tenant.id, 'family_thread_read'
  ) then
    delete from public.family_thread_reads
    where ctid in (
      select ctid from public.family_thread_reads
      where tenant_id = v_tenant.id
        and lifecycle_expires_at <= statement_timestamp()
      order by lifecycle_expires_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('familyThreadReads', v_count);
  end if;

  if private.family_retention_delete_allowed_v1(v_tenant.id, 'guardian_link') then
    delete from public.guardian_links
    where ctid in (
      select ctid from public.guardian_links
      where tenant_id = v_tenant.id and status in ('revoked', 'expired')
        and lifecycle_expires_at <= statement_timestamp()
      order by lifecycle_expires_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('guardianLinks', v_count);
  end if;

  if private.family_retention_delete_allowed_v1(v_tenant.id, 'role_binding') then
    delete from public.role_bindings
    where ctid in (
      select ctid from public.role_bindings
      where tenant_id = v_tenant.id and not active
        and lifecycle_expires_at <= statement_timestamp()
      order by lifecycle_expires_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('roleBindings', v_count);
  end if;

  if private.family_retention_delete_allowed_v1(
    v_tenant.id, 'notification_preference'
  ) then
    delete from public.family_notification_preferences
    where ctid in (
      select ctid from public.family_notification_preferences
      where tenant_id = v_tenant.id
        and lifecycle_expires_at <= statement_timestamp()
      order by lifecycle_expires_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('notificationPreferences', v_count);
  end if;

  if private.family_retention_delete_allowed_v1(
    v_tenant.id, 'email_suppression'
  ) then
    delete from public.email_suppressions
    where ctid in (
      select candidate.ctid from public.email_suppressions as candidate
      where candidate.tenant_id = v_tenant.id
        and candidate.lifecycle_expires_at <= statement_timestamp()
        and not exists (
          select 1 from public.app_users as au
          where au.notification_email_digest =
            candidate.recipient_email_digest
        )
        and not exists (
          select 1 from public.guardian_invitations as gi
          where gi.tenant_id = candidate.tenant_id
            and gi.recipient_email_digest =
              candidate.recipient_email_digest
            and gi.status = 'pending'
            and gi.expires_at > statement_timestamp()
        )
        and not exists (
          select 1 from public.notification_outbox as nox
          where nox.tenant_id = candidate.tenant_id
            and nox.recipient_email_digest =
              candidate.recipient_email_digest
            and nox.expires_at > statement_timestamp()
        )
      order by candidate.lifecycle_expires_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('emailSuppressions', v_count);
  end if;

  if private.family_retention_delete_allowed_v1(
    v_tenant.id, 'retention_receipt'
  ) then
    delete from public.retention_runs
    where ctid in (
      select ctid from public.retention_runs
      where tenant_id = v_tenant.id and status <> 'running'
        and lifecycle_expires_at <= statement_timestamp()
      order by lifecycle_expires_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('retentionReceipts', v_count);
  end if;

  if private.family_retention_delete_allowed_v1(
    v_tenant.id, 'app_user_contact'
  ) then
    update public.app_users as au
    set notification_email_digest = null,
        notification_email_ciphertext = null,
        status = 'disabled'
    where au.id = any(v_candidate_users)
      and au.lifecycle_expires_at <= statement_timestamp()
      and not exists (
        select 1 from public.role_bindings as rb
        join public.tenants as active_tenant on active_tenant.id = rb.tenant_id
        where rb.app_user_id = au.id and rb.active
          and active_tenant.status = 'active' and active_tenant.family_portal_enabled
      )
      and not exists (
        select 1 from public.guardian_links as gl
        join public.tenants as active_tenant on active_tenant.id = gl.tenant_id
        where gl.guardian_user_id = au.id and gl.status = 'active'
          and (gl.expires_at is null or gl.expires_at > statement_timestamp())
          and active_tenant.status = 'active' and active_tenant.family_portal_enabled
      );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('appUserContacts', v_count);
  end if;

  if private.family_retention_delete_allowed_v1(
    v_tenant.id, 'provider_identity'
  ) then
    update public.provider_identities as pi
    set active = false, revoked_at = coalesce(revoked_at, clock_timestamp())
    from public.app_users as au
    where pi.app_user_id = au.id and au.id = any(v_candidate_users)
      and au.status = 'disabled' and pi.active;
    delete from public.provider_identities as pi
    using public.app_users as au
    where pi.app_user_id = au.id and au.id = any(v_candidate_users)
      and au.status = 'disabled' and not pi.active
      and pi.lifecycle_expires_at <= statement_timestamp();
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('providerIdentities', v_count);
  end if;

  -- The tenant row is retained as a terminal tombstone, so its identifier
  -- cannot be reopened. Once the tenant teardown clock and every policy allow
  -- deletion, bounded passes remove the remaining relationship fixtures in
  -- child-before-parent order. NOT EXISTS guards make intermediate passes
  -- retry-safe while content-class rows are still draining.
  if v_tenant.status = 'closed'
    and v_tenant.lifecycle_expires_at <= statement_timestamp()
    and not exists (
      select 1
      from unnest(enum_range(null::public.retention_data_class)) as required(data_class)
      where not private.family_retention_delete_allowed_v1(
        v_tenant.id, required.data_class
      )
    )
  then
    delete from public.student_assignments
    where ctid in (
      select ctid from public.student_assignments
      where tenant_id = v_tenant.id order by created_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('studentAssignments', v_count);

    delete from public.family_content_release_memberships
    where ctid in (
      select ctid from public.family_content_release_memberships
      where tenant_id = v_tenant.id order by created_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('contentReleaseMemberships', v_count);

    delete from public.assignments as a
    where a.ctid in (
      select candidate.ctid
      from public.assignments as candidate
      where candidate.tenant_id = v_tenant.id
        and not exists (
          select 1 from public.student_assignments as sa
          where sa.tenant_id = candidate.tenant_id
            and sa.assignment_id = candidate.id
        )
        and not exists (
          select 1 from public.learning_events_v2 as le
          where le.tenant_id = candidate.tenant_id
            and le.assignment_id = candidate.id
        )
        and not exists (
          select 1 from public.progress_projections_v1 as pp
          where pp.tenant_id = candidate.tenant_id
            and pp.assignment_id = candidate.id
        )
      order by candidate.created_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('assignments', v_count);

    delete from public.class_staff_bindings
    where ctid in (
      select ctid from public.class_staff_bindings
      where tenant_id = v_tenant.id and not active
      order by created_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('classStaffBindings', v_count);

    delete from public.enrollments as e
    where e.ctid in (
      select candidate.ctid
      from public.enrollments as candidate
      where candidate.tenant_id = v_tenant.id
        and not exists (
          select 1 from public.student_assignments as sa
          where sa.tenant_id = candidate.tenant_id
            and sa.enrollment_id = candidate.id
        )
        and not exists (
          select 1 from public.learning_events_v2 as le
          where le.tenant_id = candidate.tenant_id
            and le.enrollment_id = candidate.id
        )
        and not exists (
          select 1 from public.family_threads as ft
          where ft.tenant_id = candidate.tenant_id
            and ft.enrollment_id = candidate.id
        )
      order by candidate.created_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('enrollments', v_count);

    delete from public.students as s
    where s.ctid in (
      select candidate.ctid
      from public.students as candidate
      where candidate.tenant_id = v_tenant.id
        and not exists (
          select 1 from public.enrollments as e
          where e.tenant_id = candidate.tenant_id
            and e.student_id = candidate.id
        )
        and not exists (
          select 1 from public.guardian_links as gl
          where gl.tenant_id = candidate.tenant_id
            and gl.student_id = candidate.id
        )
        and not exists (
          select 1 from public.guardian_invitations as gi
          where gi.tenant_id = candidate.tenant_id
            and gi.student_id = candidate.id
        )
        and not exists (
          select 1 from public.family_threads as ft
          where ft.tenant_id = candidate.tenant_id
            and ft.child_id = candidate.id
        )
        and not exists (
          select 1 from public.learning_events_v2 as le
          where le.tenant_id = candidate.tenant_id
            and le.student_id = candidate.id
        )
        and not exists (
          select 1 from public.progress_projections_v1 as pp
          where pp.tenant_id = candidate.tenant_id
            and pp.student_id = candidate.id
        )
        and not exists (
          select 1 from public.skill_projections_v1 as sp
          where sp.tenant_id = candidate.tenant_id
            and sp.student_id = candidate.id
        )
        and not exists (
          select 1 from public.role_bindings as rb
          where rb.tenant_id = candidate.tenant_id
            and rb.student_id = candidate.id
        )
      order by candidate.created_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('students', v_count);

    delete from public.classes as c
    where c.ctid in (
      select candidate.ctid
      from public.classes as candidate
      where candidate.tenant_id = v_tenant.id
        and not exists (
          select 1 from public.enrollments as e
          where e.tenant_id = candidate.tenant_id
            and e.class_id = candidate.id
        )
        and not exists (
          select 1 from public.assignments as a
          where a.tenant_id = candidate.tenant_id
            and a.class_id = candidate.id
        )
        and not exists (
          select 1 from public.class_staff_bindings as csb
          where csb.tenant_id = candidate.tenant_id
            and csb.class_id = candidate.id
        )
      order by candidate.created_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('classes', v_count);

    delete from public.tenant_identity_issuers
    where ctid in (
      select ctid from public.tenant_identity_issuers
      where tenant_id = v_tenant.id order by created_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('tenantIdentityIssuers', v_count);

    delete from public.schools as sc
    where sc.ctid in (
      select candidate.ctid
      from public.schools as candidate
      where candidate.tenant_id = v_tenant.id
        and not exists (
          select 1 from public.students as s
          where s.tenant_id = candidate.tenant_id
            and s.school_id = candidate.id
        )
        and not exists (
          select 1 from public.classes as c
          where c.tenant_id = candidate.tenant_id
            and c.school_id = candidate.id
        )
        and not exists (
          select 1 from public.role_bindings as rb
          where rb.tenant_id = candidate.tenant_id
            and rb.school_id = candidate.id
        )
        and not exists (
          select 1 from public.guardian_invitations as gi
          where gi.tenant_id = candidate.tenant_id
            and gi.school_id = candidate.id
        )
        and not exists (
          select 1 from public.family_threads as ft
          where ft.tenant_id = candidate.tenant_id
            and ft.school_id = candidate.id
        )
        and not exists (
          select 1 from public.school_announcements as sa
          where sa.tenant_id = candidate.tenant_id
            and sa.school_id = candidate.id
        )
      order by candidate.created_at limit p_batch_size
    );
    get diagnostics v_count = row_count;
    v_counts := v_counts || jsonb_build_object('schools', v_count);

    if not exists (
      select 1 from public.schools where tenant_id = v_tenant.id
      union all select 1 from public.students where tenant_id = v_tenant.id
      union all select 1 from public.classes where tenant_id = v_tenant.id
      union all select 1 from public.assignments where tenant_id = v_tenant.id
      union all select 1 from public.role_bindings where tenant_id = v_tenant.id
      union all select 1 from public.guardian_links where tenant_id = v_tenant.id
      union all select 1 from public.family_threads where tenant_id = v_tenant.id
      union all select 1 from public.notification_outbox where tenant_id = v_tenant.id
    ) then
      update public.tenants
      set display_name = 'Closed family tenant'
      where id = v_tenant.id and display_name <> 'Closed family tenant';
      get diagnostics v_count = row_count;
      v_counts := v_counts || jsonb_build_object('tenantMetadataScrubbed', v_count);
    end if;
  end if;

  return v_counts;
end;
$$;

alter function public.run_family_retention_v1(integer)
  rename to run_family_retention_legacy_v1;
revoke all on function public.run_family_retention_legacy_v1(integer)
  from public, anon, authenticated, service_role;

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
  v_legacy jsonb;
  v_run jsonb;
  v_counts jsonb;
  v_runs jsonb := '[]'::jsonb;
  v_tenant_id uuid;
  v_run_id uuid;
begin
  if private.jwt_claim('role') <> 'service_role' then
    raise exception using errcode = '42501', message = 'service role required';
  end if;
  if p_batch_size not between 1 and 10000 then
    raise exception using errcode = '22023', message = 'retention batch out of range';
  end if;
  v_legacy := public.run_family_retention_legacy_v1(p_batch_size);
  for v_run in select value from jsonb_array_elements(v_legacy -> 'runs')
  loop
    v_tenant_id := (v_run ->> 'tenantId')::uuid;
    v_run_id := (v_run ->> 'runId')::uuid;
    v_counts := coalesce(v_run -> 'deletedCounts', '{}'::jsonb) ||
      private.purge_family_lifecycle_v2(v_tenant_id, p_batch_size);
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

create or replace function public.teacher_family_inbox_v1()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_tenant public.tenants%rowtype;
begin
  v_actor_id := private.require_family_app_user();
  begin
    select distinct t.* into strict v_tenant
    from public.tenants as t
    join public.role_bindings as rb
      on rb.tenant_id = t.id and rb.app_user_id = v_actor_id
      and rb.role = 'teacher' and rb.active
    join public.class_staff_bindings as csb
      on csb.tenant_id = t.id and csb.teacher_user_id = v_actor_id
      and csb.active
    join public.classes as c
      on c.tenant_id = csb.tenant_id and c.id = csb.class_id and c.active
    join public.schools as sc
      on sc.tenant_id = c.tenant_id and sc.id = c.school_id and sc.active
    where t.status = 'active' and t.family_portal_enabled
      and (t.lifecycle_expires_at is null
        or t.lifecycle_expires_at > statement_timestamp())
      and rb.school_id = sc.id
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
      and csb.starts_at <= statement_timestamp()
      and (csb.ends_at is null or csb.ends_at > statement_timestamp());
  exception when no_data_found or too_many_rows then
    raise exception using errcode = '42501', message = 'teacher family access required';
  end;

  return jsonb_build_object(
    'tenant', jsonb_build_object('id', v_tenant.id, 'displayName', v_tenant.display_name),
    'threads', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ft.id,
        'childId', s.id,
        'guardianLabel', guardian.display_name,
        'childLabel', s.display_name,
        'gradeLabel', s.grade_label,
        'topic', ft.topic,
        'unreadCount', (
          select least(count(*), 200)::integer from public.family_messages as unread
          left join public.family_thread_reads as ftr
            on ftr.tenant_id = ft.tenant_id and ftr.thread_id = ft.id
            and ftr.app_user_id = v_actor_id
          where unread.tenant_id = ft.tenant_id and unread.thread_id = ft.id
            and unread.sender_user_id <> v_actor_id
            and unread.created_at > coalesce(ftr.last_read_at, '-infinity'::timestamptz)
            and unread.expires_at > statement_timestamp()
        ),
        'status', ft.status,
        'messages', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', fm.id,
            'senderLabel', sender.display_name,
            'sentAt', fm.created_at,
            'body', fm.body,
            'mine', fm.sender_user_id = v_actor_id
          ) order by fm.created_at, fm.id)
          from (
            select candidate.*
            from public.family_messages as candidate
            where candidate.tenant_id = ft.tenant_id
              and candidate.thread_id = ft.id
              and candidate.expires_at > statement_timestamp()
            order by candidate.created_at desc, candidate.id desc
            limit 200
          ) as fm
          join public.app_users as sender on sender.id = fm.sender_user_id
        ), '[]'::jsonb)
      ) order by ft.updated_at desc, ft.id)
      from (
        select candidate.*
        from public.family_threads as candidate
        where candidate.tenant_id = v_tenant.id
          and candidate.staff_user_id = v_actor_id
        order by candidate.updated_at desc, candidate.id
        limit 500
      ) as ft
      join public.enrollments as e
        on e.tenant_id = ft.tenant_id and e.id = ft.enrollment_id
        and e.student_id = ft.child_id and e.status = 'active'
        and e.starts_at <= current_date
        and (e.ends_at is null or e.ends_at >= current_date)
      join public.classes as c
        on c.tenant_id = e.tenant_id and c.id = e.class_id and c.active
      join public.class_staff_bindings as csb
        on csb.tenant_id = c.tenant_id and csb.class_id = c.id
        and csb.teacher_user_id = v_actor_id and csb.active
        and csb.starts_at <= statement_timestamp()
        and (csb.ends_at is null or csb.ends_at > statement_timestamp())
      join public.role_bindings as teacher_role
        on teacher_role.tenant_id = c.tenant_id
        and teacher_role.app_user_id = v_actor_id
        and teacher_role.role = 'teacher' and teacher_role.active
        and teacher_role.school_id = c.school_id
        and teacher_role.starts_at <= statement_timestamp()
        and (teacher_role.ends_at is null
          or teacher_role.ends_at > statement_timestamp())
      join public.students as s
        on s.tenant_id = e.tenant_id and s.id = e.student_id and s.active
      join public.schools as sc
        on sc.tenant_id = c.tenant_id and sc.id = c.school_id
        and sc.id = ft.school_id and sc.active
      join public.guardian_links as gl
        on gl.tenant_id = ft.tenant_id and gl.student_id = s.id
        and gl.guardian_user_id = ft.guardian_user_id and gl.status = 'active'
        and (gl.expires_at is null or gl.expires_at > statement_timestamp())
      join public.role_bindings as guardian_role
        on guardian_role.tenant_id = gl.tenant_id
        and guardian_role.app_user_id = gl.guardian_user_id
        and guardian_role.role = 'guardian' and guardian_role.active
        and guardian_role.starts_at <= statement_timestamp()
        and (guardian_role.ends_at is null
          or guardian_role.ends_at > statement_timestamp())
      join public.app_users as guardian
        on guardian.id = ft.guardian_user_id and guardian.status = 'active'
      where ft.tenant_id = v_tenant.id and ft.staff_user_id = v_actor_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_family_access_workspace_v1()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_tenant public.tenants%rowtype;
begin
  v_actor_id := private.require_family_app_user();
  begin
    select distinct t.* into strict v_tenant
    from public.tenants as t
    join public.role_bindings as rb
      on rb.tenant_id = t.id and rb.app_user_id = v_actor_id
      and rb.role in ('school_admin', 'district_admin') and rb.active
    left join public.schools as sc
      on sc.tenant_id = rb.tenant_id and sc.id = rb.school_id and sc.active
    where t.status = 'active' and t.family_portal_enabled
      and (t.lifecycle_expires_at is null
        or t.lifecycle_expires_at > statement_timestamp())
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
      and (rb.role = 'district_admin' or sc.id is not null);
  exception when no_data_found or too_many_rows then
    raise exception using errcode = '42501', message = 'family administrator access required';
  end;

  return jsonb_build_object(
    'tenant', jsonb_build_object('id', v_tenant.id, 'displayName', v_tenant.display_name),
    'children', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', child.id, 'displayName', child.display_name,
        'gradeLabel', child.grade_label, 'schoolName', sc.display_name
      ) order by child.display_name, child.id)
      from (
        select distinct s.id, s.display_name, s.grade_label, s.school_id
        from public.students as s
        join public.schools as scoped_school
          on scoped_school.tenant_id = s.tenant_id
          and scoped_school.id = s.school_id and scoped_school.active
        join public.enrollments as e
          on e.tenant_id = s.tenant_id and e.student_id = s.id
          and e.status = 'active' and e.starts_at <= current_date
          and (e.ends_at is null or e.ends_at >= current_date)
        join public.classes as c
          on c.tenant_id = e.tenant_id and c.id = e.class_id
          and c.school_id = s.school_id and c.active
        where s.tenant_id = v_tenant.id and s.active
          and public.family_has_role_v1(
            v_tenant.id,
            array['school_admin', 'district_admin']::public.app_role[],
            s.school_id, null
          )
        order by s.display_name, s.id
        limit 5000
      ) as child
      join public.schools as sc
        on sc.tenant_id = v_tenant.id and sc.id = child.school_id
    ), '[]'::jsonb),
    'invitations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', gi.id,
        'guardianLinkId', case
          when gi.status = 'accepted' then current_link.id
          else null
        end,
        'childId', s.id,
        'childDisplayName', s.display_name,
        'gradeLabel', s.grade_label,
        'guardianLabel', coalesce(guardian.display_name, 'Verified adult'),
        'destinationLabel', 'Verified adult destination',
        'status', case
          when gi.status = 'accepted' and current_link.id is not null then 'accepted'
          when gi.status = 'pending' and gi.expires_at > statement_timestamp() then 'pending'
          else 'revoked'
        end,
        'expiresAt', gi.expires_at
      ) order by gi.created_at desc, gi.id)
      from public.guardian_invitations as gi
      join public.students as s
        on s.tenant_id = gi.tenant_id and s.id = gi.student_id and s.active
      join public.schools as sc
        on sc.tenant_id = gi.tenant_id and sc.id = gi.school_id
        and sc.id = s.school_id and sc.active
      left join public.app_users as guardian on guardian.id = gi.accepted_by_user_id
      left join lateral (
        select gl.id
        from public.guardian_links as gl
        join public.app_users as current_guardian
          on current_guardian.id = gl.guardian_user_id
          and current_guardian.status = 'active'
        join public.role_bindings as guardian_role
          on guardian_role.tenant_id = gl.tenant_id
          and guardian_role.app_user_id = gl.guardian_user_id
          and guardian_role.role = 'guardian' and guardian_role.active
          and guardian_role.starts_at <= statement_timestamp()
          and (guardian_role.ends_at is null
            or guardian_role.ends_at > statement_timestamp())
        where gl.tenant_id = gi.tenant_id and gl.student_id = gi.student_id
          and gl.guardian_user_id = gi.accepted_by_user_id
          and gl.status = 'active'
          and (gl.expires_at is null or gl.expires_at > statement_timestamp())
        order by gl.created_at desc limit 1
      ) as current_link on true
      where gi.tenant_id = v_tenant.id
        and gi.status in ('pending', 'accepted', 'revoked', 'expired')
        and gi.id in (
          select limited.id
          from public.guardian_invitations as limited
          where limited.tenant_id = v_tenant.id
          order by limited.created_at desc, limited.id
          limit 5000
        )
        and exists (
          select 1
          from public.enrollments as e
          join public.classes as c
            on c.tenant_id = e.tenant_id and c.id = e.class_id
            and c.school_id = gi.school_id and c.active
          where e.tenant_id = gi.tenant_id and e.student_id = gi.student_id
            and e.status = 'active' and e.starts_at <= current_date
            and (e.ends_at is null or e.ends_at >= current_date)
        )
        and public.family_has_role_v1(
          v_tenant.id,
          array['school_admin', 'district_admin']::public.app_role[],
          gi.school_id, null
        )
    ), '[]'::jsonb) || coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', gl.id,
        'guardianLinkId', gl.id,
        'childId', s.id,
        'childDisplayName', s.display_name,
        'gradeLabel', s.grade_label,
        'guardianLabel', guardian.display_name,
        'destinationLabel', 'Verified adult destination',
        'status', 'accepted',
        'expiresAt', gl.expires_at
      ) order by gl.created_at desc, gl.id)
      from public.guardian_links as gl
      join public.students as s
        on s.tenant_id = gl.tenant_id and s.id = gl.student_id and s.active
      join public.schools as sc
        on sc.tenant_id = s.tenant_id and sc.id = s.school_id and sc.active
      join public.app_users as guardian
        on guardian.id = gl.guardian_user_id and guardian.status = 'active'
      join public.role_bindings as guardian_role
        on guardian_role.tenant_id = gl.tenant_id
        and guardian_role.app_user_id = gl.guardian_user_id
        and guardian_role.role = 'guardian' and guardian_role.active
        and guardian_role.starts_at <= statement_timestamp()
        and (guardian_role.ends_at is null
          or guardian_role.ends_at > statement_timestamp())
      where gl.tenant_id = v_tenant.id and gl.status = 'active'
        and (gl.expires_at is null or gl.expires_at > statement_timestamp())
        and exists (
          select 1
          from public.enrollments as e
          join public.classes as c
            on c.tenant_id = e.tenant_id and c.id = e.class_id
            and c.school_id = s.school_id and c.active
          where e.tenant_id = s.tenant_id and e.student_id = s.id
            and e.status = 'active' and e.starts_at <= current_date
            and (e.ends_at is null or e.ends_at >= current_date)
        )
        and public.family_has_role_v1(
          v_tenant.id,
          array['school_admin', 'district_admin']::public.app_role[],
          s.school_id, null
        )
        and not exists (
          select 1 from public.guardian_invitations as accepted_invitation
          where accepted_invitation.tenant_id = gl.tenant_id
            and accepted_invitation.student_id = gl.student_id
            and accepted_invitation.accepted_by_user_id = gl.guardian_user_id
            and accepted_invitation.status = 'accepted'
        )
        and gl.id in (
          select limited.id
          from public.guardian_links as limited
          where limited.tenant_id = v_tenant.id and limited.status = 'active'
          order by limited.created_at desc, limited.id
          limit 5000
        )
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.relinquish_guardian_child_access_v1(
  p_child_id uuid,
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

  select gl.* into v_link
  from public.guardian_links as gl
  join public.tenants as t
    on t.id = gl.tenant_id and t.environment_id = gl.environment_id
    and t.data_mode = gl.data_mode and t.status = 'active'
    and t.family_portal_enabled
    and (t.lifecycle_expires_at is null
      or t.lifecycle_expires_at > statement_timestamp())
  join public.students as s
    on s.tenant_id = gl.tenant_id and s.id = gl.student_id and s.active
  join public.schools as sc
    on sc.tenant_id = s.tenant_id and sc.id = s.school_id and sc.active
  join public.role_bindings as rb
    on rb.tenant_id = gl.tenant_id and rb.app_user_id = v_actor_id
    and rb.role = 'guardian' and rb.active
    and rb.starts_at <= statement_timestamp()
    and (rb.ends_at is null or rb.ends_at > statement_timestamp())
  where gl.student_id = p_child_id and gl.guardian_user_id = v_actor_id
    and (
      (
        gl.status = 'active'
        and (gl.expires_at is null or gl.expires_at > statement_timestamp())
      )
      or (
        gl.status = 'revoked'
        and gl.revocation_idempotency_key = p_idempotency_key
      )
    )
    and exists (
      select 1
      from public.enrollments as e
      join public.classes as c
        on c.tenant_id = e.tenant_id and c.id = e.class_id
        and c.school_id = s.school_id and c.active
      where e.tenant_id = s.tenant_id and e.student_id = s.id
        and e.status = 'active' and e.starts_at <= current_date
        and (e.ends_at is null or e.ends_at >= current_date)
    )
  order by (gl.status = 'active') desc, gl.created_at desc
  limit 1
  for update of gl;

  if v_link.id is null then
    raise exception using errcode = 'P0002',
      message = 'guardian access not found';
  end if;
  perform public.relinquish_guardian_link_v1(v_link.id, p_idempotency_key);
end;
$$;

revoke all on function private.family_approved_retention_days_v2(
  uuid, public.retention_data_class
) from public;
revoke all on function private.initialize_tenant_lifecycle_retention_v1()
  from public;
revoke all on function private.apply_family_lifecycle_retention_v1() from public;
revoke all on function private.enforce_global_family_identity_lifecycle_v1() from public;
revoke all on function private.enforce_tenant_and_role_terminal_state_v1() from public;
revoke all on function private.apply_family_record_retention_v2() from public;
revoke all on function private.assert_safe_outbox_payload_v2(
  public.notification_kind, jsonb
) from public;
revoke all on function private.purge_family_lifecycle_v2(uuid, integer) from public;
revoke all on function public.begin_family_tenant_teardown_v1(uuid, text)
  from public, anon, authenticated, family_webhook_writer;
revoke all on function public.run_family_retention_v1(integer)
  from public, anon, authenticated, family_webhook_writer;
revoke all on function public.teacher_family_inbox_v1()
  from public, anon, service_role, family_webhook_writer;
revoke all on function public.admin_family_access_workspace_v1()
  from public, anon, service_role, family_webhook_writer;
revoke all on function public.relinquish_guardian_child_access_v1(uuid, text)
  from public, anon, service_role, family_webhook_writer;

grant execute on function public.begin_family_tenant_teardown_v1(uuid, text)
  to service_role;
grant execute on function public.run_family_retention_v1(integer) to service_role;
grant execute on function public.teacher_family_inbox_v1() to authenticated;
grant execute on function public.admin_family_access_workspace_v1() to authenticated;
grant execute on function public.relinquish_guardian_child_access_v1(uuid, text)
  to authenticated;

comment on function public.begin_family_tenant_teardown_v1(uuid, text) is
  'Service-only, idempotent terminal tenant shutdown. Access and pending egress stop before physical retention purge.';
comment on function public.teacher_family_inbox_v1() is
  'JWT-derived, current-lifecycle teacher participant inbox. Message bodies are returned only for threads assigned to the current teacher.';
comment on function public.admin_family_access_workspace_v1() is
  'JWT-derived school/district family-access DTO. It excludes message bodies, invitation secrets, email digests, and ciphertext.';
comment on function public.relinquish_guardian_child_access_v1(uuid, text) is
  'JWT-derived, non-enumerating guardian self-relinquishment by child id. The authoritative link id never crosses the browser boundary.';

commit;
