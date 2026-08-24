-- HELP Math family portal: least-privilege school-announcement publishing.

begin;

create or replace function public.teacher_announcement_schools_v1()
returns jsonb
language plpgsql
stable
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
    select tenant.* into strict v_tenant
    from public.tenants as tenant
    where tenant.status = 'active'
      and tenant.family_portal_enabled
      and (
        tenant.lifecycle_expires_at is null
        or tenant.lifecycle_expires_at > statement_timestamp()
      )
      and exists (
        select 1
        from public.role_bindings as teacher_role
        join public.schools as school
          on school.tenant_id = teacher_role.tenant_id
          and school.id = teacher_role.school_id
          and school.active
        join public.classes as class
          on class.tenant_id = school.tenant_id
          and class.school_id = school.id
          and class.active
        join public.class_staff_bindings as staff_binding
          on staff_binding.tenant_id = class.tenant_id
          and staff_binding.class_id = class.id
          and staff_binding.teacher_user_id = teacher_role.app_user_id
          and staff_binding.active
          and staff_binding.starts_at <= statement_timestamp()
          and (
            staff_binding.ends_at is null
            or staff_binding.ends_at > statement_timestamp()
          )
        where teacher_role.tenant_id = tenant.id
          and teacher_role.app_user_id = v_actor_id
          and teacher_role.role = 'teacher'
          and teacher_role.active
          and teacher_role.starts_at <= statement_timestamp()
          and (
            teacher_role.ends_at is null
            or teacher_role.ends_at > statement_timestamp()
          )
      );
  exception
    when no_data_found or too_many_rows then
      raise exception using
        errcode = '42501',
        message = 'teacher announcement access required';
  end;

  return jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', v_tenant.id,
      'displayName', v_tenant.display_name
    ),
    'schools', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', eligible_school.id,
          'displayName', eligible_school.display_name
        )
        order by eligible_school.display_name, eligible_school.id
      )
      from public.schools as eligible_school
      where eligible_school.tenant_id = v_tenant.id
        and eligible_school.active
        and exists (
          select 1
          from public.role_bindings as teacher_role
          join public.classes as class
            on class.tenant_id = teacher_role.tenant_id
            and class.school_id = teacher_role.school_id
            and class.active
          join public.class_staff_bindings as staff_binding
            on staff_binding.tenant_id = class.tenant_id
            and staff_binding.class_id = class.id
            and staff_binding.teacher_user_id = teacher_role.app_user_id
            and staff_binding.active
            and staff_binding.starts_at <= statement_timestamp()
            and (
              staff_binding.ends_at is null
              or staff_binding.ends_at > statement_timestamp()
            )
          where teacher_role.tenant_id = eligible_school.tenant_id
            and teacher_role.school_id = eligible_school.id
            and teacher_role.app_user_id = v_actor_id
            and teacher_role.role = 'teacher'
            and teacher_role.active
            and teacher_role.starts_at <= statement_timestamp()
            and (
              teacher_role.ends_at is null
              or teacher_role.ends_at > statement_timestamp()
            )
        )
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.authorize_school_announcement_publish_v1(
  p_school_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_actor_id uuid;
  v_school public.schools%rowtype;
begin
  v_actor_id := private.require_family_app_user();

  select school.* into v_school
  from public.schools as school
  join public.tenants as tenant
    on tenant.id = school.tenant_id
    and tenant.status = 'active'
    and tenant.family_portal_enabled
    and (
      tenant.lifecycle_expires_at is null
      or tenant.lifecycle_expires_at > statement_timestamp()
    )
  where school.id = p_school_id
    and school.active
    and (
      exists (
        select 1
        from public.role_bindings as teacher_role
        join public.classes as class
          on class.tenant_id = teacher_role.tenant_id
          and class.school_id = teacher_role.school_id
          and class.active
        join public.class_staff_bindings as staff_binding
          on staff_binding.tenant_id = class.tenant_id
          and staff_binding.class_id = class.id
          and staff_binding.teacher_user_id = teacher_role.app_user_id
          and staff_binding.active
          and staff_binding.starts_at <= statement_timestamp()
          and (
            staff_binding.ends_at is null
            or staff_binding.ends_at > statement_timestamp()
          )
        where teacher_role.tenant_id = school.tenant_id
          and teacher_role.school_id = school.id
          and teacher_role.app_user_id = v_actor_id
          and teacher_role.role = 'teacher'
          and teacher_role.active
          and teacher_role.starts_at <= statement_timestamp()
          and (
            teacher_role.ends_at is null
            or teacher_role.ends_at > statement_timestamp()
          )
      )
      or exists (
        select 1
        from public.role_bindings as school_admin_role
        where school_admin_role.tenant_id = school.tenant_id
          and school_admin_role.school_id = school.id
          and school_admin_role.app_user_id = v_actor_id
          and school_admin_role.role = 'school_admin'
          and school_admin_role.active
          and school_admin_role.starts_at <= statement_timestamp()
          and (
            school_admin_role.ends_at is null
            or school_admin_role.ends_at > statement_timestamp()
          )
      )
      or exists (
        select 1
        from public.role_bindings as district_admin_role
        where district_admin_role.tenant_id = school.tenant_id
          and district_admin_role.app_user_id = v_actor_id
          and district_admin_role.role = 'district_admin'
          and district_admin_role.school_id is null
          and district_admin_role.active
          and district_admin_role.starts_at <= statement_timestamp()
          and (
            district_admin_role.ends_at is null
            or district_admin_role.ends_at > statement_timestamp()
          )
      )
    );

  if v_school.id is null then
    raise exception using errcode = 'P0002', message = 'school not found';
  end if;

  return jsonb_build_object(
    'tenantId', v_school.tenant_id,
    'schoolId', v_school.id
  );
end;
$$;

-- Keep the browser-callable mutation itself behind the same resource and
-- lifecycle boundary as the application preflight. The preflight improves the
-- action's error handling, but it is never an authorization substitute.
create or replace function public.publish_school_announcement_v1(
  p_school_id uuid,
  p_title text,
  p_body text,
  p_idempotency_key text,
  p_expires_at timestamptz default null
)
returns table (
  announcement_id uuid,
  published_at timestamptz,
  expires_at timestamptz
)
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
  select school.* into v_school
  from public.schools as school
  join public.tenants as tenant
    on tenant.id = school.tenant_id
    and tenant.status = 'active'
    and tenant.family_portal_enabled
    and (
      tenant.lifecycle_expires_at is null
      or tenant.lifecycle_expires_at > statement_timestamp()
    )
  where school.id = p_school_id
    and school.active
    and (
      exists (
        select 1
        from public.role_bindings as teacher_role
        join public.classes as class
          on class.tenant_id = teacher_role.tenant_id
          and class.school_id = teacher_role.school_id
          and class.active
        join public.class_staff_bindings as staff_binding
          on staff_binding.tenant_id = class.tenant_id
          and staff_binding.class_id = class.id
          and staff_binding.teacher_user_id = teacher_role.app_user_id
          and staff_binding.active
          and staff_binding.starts_at <= statement_timestamp()
          and (
            staff_binding.ends_at is null
            or staff_binding.ends_at > statement_timestamp()
          )
        where teacher_role.tenant_id = school.tenant_id
          and teacher_role.school_id = school.id
          and teacher_role.app_user_id = v_actor_id
          and teacher_role.role = 'teacher'
          and teacher_role.active
          and teacher_role.starts_at <= statement_timestamp()
          and (
            teacher_role.ends_at is null
            or teacher_role.ends_at > statement_timestamp()
          )
      )
      or exists (
        select 1
        from public.role_bindings as school_admin_role
        where school_admin_role.tenant_id = school.tenant_id
          and school_admin_role.school_id = school.id
          and school_admin_role.app_user_id = v_actor_id
          and school_admin_role.role = 'school_admin'
          and school_admin_role.active
          and school_admin_role.starts_at <= statement_timestamp()
          and (
            school_admin_role.ends_at is null
            or school_admin_role.ends_at > statement_timestamp()
          )
      )
      or exists (
        select 1
        from public.role_bindings as district_admin_role
        where district_admin_role.tenant_id = school.tenant_id
          and district_admin_role.app_user_id = v_actor_id
          and district_admin_role.role = 'district_admin'
          and district_admin_role.school_id is null
          and district_admin_role.active
          and district_admin_role.starts_at <= statement_timestamp()
          and (
            district_admin_role.ends_at is null
            or district_admin_role.ends_at > statement_timestamp()
          )
      )
    );

  if v_school.id is null then
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

revoke all on function public.teacher_announcement_schools_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.authorize_school_announcement_publish_v1(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.publish_school_announcement_v1(
  uuid, text, text, text, timestamptz
) from public, anon, authenticated, service_role;

grant execute on function public.teacher_announcement_schools_v1()
  to authenticated;
grant execute on function public.authorize_school_announcement_publish_v1(uuid)
  to authenticated;
grant execute on function public.publish_school_announcement_v1(
  uuid, text, text, text, timestamptz
) to authenticated;

comment on function public.teacher_announcement_schools_v1() is
  'Minimal teacher announcement school allowlist. It fails closed unless one current tenant, school role, active class, and current staff binding agree.';
comment on function public.authorize_school_announcement_publish_v1(uuid) is
  'Resource-derived publish preflight for a current teacher, school admin, or district admin; returns only opaque tenant and school ids.';
comment on function public.publish_school_announcement_v1(
  uuid, text, text, text, timestamptz
) is
  'Resource-derived announcement publish path. Teachers require a current active class staff binding; scoped administrators retain their active role lifecycle boundary.';

commit;
