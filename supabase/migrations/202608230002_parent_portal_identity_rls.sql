-- HELP Math family portal: exact provider identity mapping and deny-by-default RLS.

begin;

create or replace function private.jwt_claim(p_name text)
returns text
language sql
stable
set search_path = pg_catalog
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.' || p_name, true), ''),
    nullif(
      coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
        ->> p_name,
      ''
    )
  );
$$;

create or replace function public.family_current_issuer_v1()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select private.jwt_claim('iss');
$$;

create or replace function public.family_current_subject_v1()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select private.jwt_claim('sub');
$$;

create or replace function public.family_current_app_user_id_v1()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select pi.app_user_id
  from public.provider_identities as pi
  join public.app_users as au on au.id = pi.app_user_id
  where pi.issuer = private.jwt_claim('iss')
    and pi.subject = private.jwt_claim('sub')
    and pi.active
    and au.status = 'active'
  limit 1;
$$;

create or replace function public.family_has_role_v1(
  p_tenant_id uuid,
  p_roles public.app_role[],
  p_school_id uuid default null,
  p_student_id uuid default null
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
    from public.role_bindings as rb
    join public.tenants as t on t.id = rb.tenant_id
    where rb.tenant_id = p_tenant_id
      and rb.app_user_id = public.family_current_app_user_id_v1()
      and rb.role = any(p_roles)
      and rb.active
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
      and t.status = 'active'
      and t.family_portal_enabled
      and (
        p_school_id is null
        or exists (
          select 1 from public.schools as scoped_school
          where scoped_school.tenant_id = p_tenant_id
            and scoped_school.id = p_school_id
            and scoped_school.active
        )
      )
      and (
        p_student_id is null
        or exists (
          select 1
          from public.students as scoped_student
          join public.schools as student_school
            on student_school.tenant_id = scoped_student.tenant_id
            and student_school.id = scoped_student.school_id
          where scoped_student.tenant_id = p_tenant_id
            and scoped_student.id = p_student_id
            and scoped_student.active
            and student_school.active
        )
      )
      and (
        rb.role = 'district_admin'
        or (p_school_id is null and p_student_id is null)
        or (rb.role in ('teacher', 'school_admin') and rb.school_id = p_school_id)
        or (rb.role = 'learner' and rb.student_id = p_student_id)
        or rb.role = 'guardian'
      )
  );
$$;

create or replace function public.family_can_access_school_v1(
  p_tenant_id uuid,
  p_school_id uuid
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
    from public.tenants as enabled_tenant
    join public.schools as target_school
      on target_school.tenant_id = enabled_tenant.id
      and target_school.id = p_school_id
    where enabled_tenant.id = p_tenant_id
      and enabled_tenant.status = 'active'
      and enabled_tenant.family_portal_enabled
      and target_school.active
  ) and (
    public.family_has_role_v1(
      p_tenant_id,
      array['teacher', 'school_admin', 'district_admin']::public.app_role[],
      p_school_id,
      null
    )
    or exists (
      select 1
      from public.guardian_links as gl
      join public.students as s
        on s.tenant_id = gl.tenant_id and s.id = gl.student_id
      where gl.tenant_id = p_tenant_id
        and s.school_id = p_school_id
        and s.active
        and gl.guardian_user_id = public.family_current_app_user_id_v1()
        and gl.status = 'active'
        and (gl.expires_at is null or gl.expires_at > statement_timestamp())
        and exists (
          select 1 from public.role_bindings as guardian_role
          where guardian_role.tenant_id = gl.tenant_id
            and guardian_role.app_user_id = gl.guardian_user_id
            and guardian_role.role = 'guardian' and guardian_role.active
            and guardian_role.starts_at <= statement_timestamp()
            and (guardian_role.ends_at is null
              or guardian_role.ends_at > statement_timestamp())
        )
    )
    or exists (
      select 1
      from public.role_bindings as rb
      join public.students as s
        on s.tenant_id = rb.tenant_id and s.id = rb.student_id
      where rb.tenant_id = p_tenant_id
        and s.school_id = p_school_id
        and s.active
        and rb.app_user_id = public.family_current_app_user_id_v1()
        and rb.role = 'learner'
        and rb.active
        and rb.starts_at <= statement_timestamp()
        and (rb.ends_at is null or rb.ends_at > statement_timestamp())
    )
  );
$$;

create or replace function public.family_can_access_student_v1(
  p_tenant_id uuid,
  p_student_id uuid
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
    from public.guardian_links as gl
    join public.tenants as t on t.id = gl.tenant_id
    join public.students as s
      on s.tenant_id = gl.tenant_id and s.id = gl.student_id
    join public.schools as sc
      on sc.tenant_id = s.tenant_id and sc.id = s.school_id
    where gl.tenant_id = p_tenant_id
      and gl.student_id = p_student_id
      and gl.guardian_user_id = public.family_current_app_user_id_v1()
      and gl.status = 'active'
      and (gl.expires_at is null or gl.expires_at > statement_timestamp())
      and t.status = 'active'
      and t.family_portal_enabled
      and s.active and sc.active
      and exists (
        select 1 from public.role_bindings as guardian_role
        where guardian_role.tenant_id = gl.tenant_id
          and guardian_role.app_user_id = gl.guardian_user_id
          and guardian_role.role = 'guardian' and guardian_role.active
          and guardian_role.starts_at <= statement_timestamp()
          and (guardian_role.ends_at is null
            or guardian_role.ends_at > statement_timestamp())
      )
  ) or exists (
    select 1
    from public.role_bindings as rb
    join public.tenants as t on t.id = rb.tenant_id
    join public.students as s
      on s.tenant_id = rb.tenant_id and s.id = rb.student_id
    join public.schools as sc
      on sc.tenant_id = s.tenant_id and sc.id = s.school_id
    where rb.tenant_id = p_tenant_id
      and rb.student_id = p_student_id
      and rb.app_user_id = public.family_current_app_user_id_v1()
      and rb.role = 'learner'
      and rb.active
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
      and t.status = 'active'
      and t.family_portal_enabled
      and s.active and sc.active
  ) or exists (
    select 1
    from public.enrollments as e
    join public.tenants as t on t.id = e.tenant_id
    join public.class_staff_bindings as csb
      on csb.tenant_id = e.tenant_id and csb.class_id = e.class_id
    join public.role_bindings as rb
      on rb.tenant_id = csb.tenant_id
      and rb.app_user_id = csb.teacher_user_id
      and rb.role = 'teacher'
    join public.classes as c
      on c.tenant_id = e.tenant_id and c.id = e.class_id
    join public.students as s
      on s.tenant_id = e.tenant_id and s.id = e.student_id
    join public.schools as sc
      on sc.tenant_id = s.tenant_id and sc.id = s.school_id
    where e.tenant_id = p_tenant_id
      and e.student_id = p_student_id
      and e.status = 'active'
      and e.starts_at <= current_date
      and (e.ends_at is null or e.ends_at >= current_date)
      and csb.teacher_user_id = public.family_current_app_user_id_v1()
      and csb.active
      and csb.starts_at <= statement_timestamp()
      and (csb.ends_at is null or csb.ends_at > statement_timestamp())
      and rb.school_id = c.school_id
      and c.school_id = s.school_id
      and c.active and s.active and sc.active
      and rb.active
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
      and t.status = 'active'
      and t.family_portal_enabled
  ) or exists (
    select 1
    from public.students as s
    join public.schools as sc
      on sc.tenant_id = s.tenant_id and sc.id = s.school_id
    where s.tenant_id = p_tenant_id
      and s.id = p_student_id
      and s.active and sc.active
      and public.family_has_role_v1(
        p_tenant_id,
        array['school_admin', 'district_admin']::public.app_role[],
        s.school_id,
        null
      )
  );
$$;

create or replace function public.family_can_manage_student_v1(
  p_tenant_id uuid,
  p_student_id uuid
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
    from public.students as s
    join public.schools as sc
      on sc.tenant_id = s.tenant_id and sc.id = s.school_id
    where s.tenant_id = p_tenant_id
      and s.id = p_student_id
      and s.active and sc.active
      and public.family_has_role_v1(
        p_tenant_id,
        array['school_admin', 'district_admin']::public.app_role[],
        s.school_id,
        null
      )
  );
$$;

create or replace function public.family_can_access_assignment_v1(
  p_tenant_id uuid,
  p_assignment_id uuid
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
    from public.assignments as a
    join public.tenants as t on t.id = a.tenant_id
    join public.classes as c
      on c.tenant_id = a.tenant_id and c.id = a.class_id
    join public.schools as sc
      on sc.tenant_id = c.tenant_id and sc.id = c.school_id
    where a.tenant_id = p_tenant_id
      and a.id = p_assignment_id
      and t.status = 'active' and t.family_portal_enabled
      and c.active and sc.active
      and (
        public.family_has_role_v1(
          p_tenant_id,
          array['school_admin', 'district_admin']::public.app_role[],
          c.school_id,
          null
        )
        or (
          a.teacher_user_id = public.family_current_app_user_id_v1()
          and exists (
            select 1 from public.class_staff_bindings as csb
            where csb.tenant_id = a.tenant_id and csb.class_id = a.class_id
              and csb.teacher_user_id = a.teacher_user_id and csb.active
              and csb.starts_at <= statement_timestamp()
              and (csb.ends_at is null or csb.ends_at > statement_timestamp())
          )
          and public.family_has_role_v1(
            a.tenant_id,
            array['teacher']::public.app_role[],
            c.school_id,
            null
          )
        )
        or exists (
          select 1
          from public.student_assignments as sa
          join public.enrollments as e
            on e.tenant_id = sa.tenant_id and e.id = sa.enrollment_id
          join public.students as s
            on s.tenant_id = e.tenant_id and s.id = e.student_id
          where sa.tenant_id = a.tenant_id
            and sa.assignment_id = a.id
            and e.class_id = a.class_id
            and e.status = 'active'
            and e.starts_at <= current_date
            and (e.ends_at is null or e.ends_at >= current_date)
            and s.active and s.school_id = c.school_id
            and (
              exists (
                select 1 from public.guardian_links as gl
                where gl.tenant_id = e.tenant_id
                  and gl.student_id = e.student_id
                  and gl.guardian_user_id = public.family_current_app_user_id_v1()
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
                  )
              )
              or public.family_has_role_v1(
                e.tenant_id,
                array['learner']::public.app_role[],
                null,
                e.student_id
              )
            )
        )
      )
  );
$$;

create or replace function public.family_can_access_class_v1(
  p_tenant_id uuid,
  p_class_id uuid
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
    from public.classes as c
    join public.tenants as t on t.id = c.tenant_id
    join public.schools as sc
      on sc.tenant_id = c.tenant_id and sc.id = c.school_id
    where c.tenant_id = p_tenant_id
      and c.id = p_class_id
      and t.status = 'active' and t.family_portal_enabled
      and c.active and sc.active
      and (
        public.family_has_role_v1(
          p_tenant_id,
          array['school_admin', 'district_admin']::public.app_role[],
          c.school_id,
          null
        )
        or exists (
          select 1 from public.class_staff_bindings as csb
          where csb.tenant_id = c.tenant_id and csb.class_id = c.id
            and csb.teacher_user_id = public.family_current_app_user_id_v1()
            and csb.active
            and csb.starts_at <= statement_timestamp()
            and (csb.ends_at is null or csb.ends_at > statement_timestamp())
            and public.family_has_role_v1(
              c.tenant_id,
              array['teacher']::public.app_role[],
              c.school_id,
              null
            )
        )
        or exists (
          select 1
          from public.enrollments as e
          join public.students as s
            on s.tenant_id = e.tenant_id and s.id = e.student_id
          where e.tenant_id = c.tenant_id
            and e.class_id = c.id
            and e.status = 'active'
            and e.starts_at <= current_date
            and (e.ends_at is null or e.ends_at >= current_date)
            and s.active and s.school_id = c.school_id
            and (
              exists (
                select 1 from public.guardian_links as gl
                where gl.tenant_id = e.tenant_id
                  and gl.student_id = e.student_id
                  and gl.guardian_user_id = public.family_current_app_user_id_v1()
                  and gl.status = 'active'
                  and (gl.expires_at is null
                    or gl.expires_at > statement_timestamp())
                  and exists (
                    select 1 from public.role_bindings as guardian_role
                    where guardian_role.tenant_id = gl.tenant_id
                      and guardian_role.app_user_id = gl.guardian_user_id
                      and guardian_role.role = 'guardian'
                      and guardian_role.active
                      and guardian_role.starts_at <= statement_timestamp()
                      and (guardian_role.ends_at is null
                        or guardian_role.ends_at > statement_timestamp())
                  )
              )
              or public.family_has_role_v1(
                e.tenant_id,
                array['learner']::public.app_role[],
                null,
                e.student_id
              )
            )
        )
      )
  );
$$;

create or replace function public.family_can_access_thread_v1(
  p_tenant_id uuid,
  p_thread_id uuid
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
    from public.family_threads as ft
    join public.tenants as t on t.id = ft.tenant_id
    join public.students as s
      on s.tenant_id = ft.tenant_id and s.id = ft.child_id
    join public.schools as sc
      on sc.tenant_id = ft.tenant_id and sc.id = ft.school_id
      and sc.id = s.school_id
    where ft.tenant_id = p_tenant_id
      and ft.id = p_thread_id
      and t.status = 'active'
      and t.family_portal_enabled
      and s.active and sc.active
      and (
        (
          ft.guardian_user_id = public.family_current_app_user_id_v1()
          and exists (
            select 1 from public.guardian_links as gl
            where gl.tenant_id = ft.tenant_id
              and gl.student_id = ft.child_id
              and gl.guardian_user_id = ft.guardian_user_id
              and gl.status = 'active'
              and (gl.expires_at is null or gl.expires_at > statement_timestamp())
              and exists (
                select 1 from public.role_bindings as rb
                where rb.tenant_id = ft.tenant_id
                  and rb.app_user_id = ft.guardian_user_id
                  and rb.role = 'guardian'
                  and rb.active
                  and rb.starts_at <= statement_timestamp()
                  and (rb.ends_at is null or rb.ends_at > statement_timestamp())
              )
          )
        )
        or (
          ft.staff_user_id = public.family_current_app_user_id_v1()
          and exists (
            select 1
            from public.enrollments as e
            join public.class_staff_bindings as csb
              on csb.tenant_id = e.tenant_id and csb.class_id = e.class_id
            join public.classes as c
              on c.tenant_id = e.tenant_id and c.id = e.class_id
            join public.role_bindings as rb
              on rb.tenant_id = csb.tenant_id
              and rb.app_user_id = csb.teacher_user_id
              and rb.role = 'teacher'
            where e.tenant_id = ft.tenant_id and e.id = ft.enrollment_id
              and e.student_id = ft.child_id
              and e.status = 'active'
              and e.starts_at <= current_date
              and (e.ends_at is null or e.ends_at >= current_date)
              and csb.teacher_user_id = ft.staff_user_id
              and csb.active
              and csb.starts_at <= statement_timestamp()
              and (csb.ends_at is null or csb.ends_at > statement_timestamp())
              and c.school_id = ft.school_id
              and c.active
              and rb.school_id = ft.school_id
              and rb.active
              and rb.starts_at <= statement_timestamp()
              and (rb.ends_at is null or rb.ends_at > statement_timestamp())
          )
        )
      )
  );
$$;

create or replace function public.family_authorization_context_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  v_app_user_id uuid;
  v_context jsonb;
begin
  v_app_user_id := public.family_current_app_user_id_v1();
  if v_app_user_id is null then
    raise exception using errcode = '42501', message = 'family identity is not mapped';
  end if;

  with tenant_roles as (
    select
      rb.tenant_id,
      t.display_name,
      t.environment_id,
      t.data_mode,
      jsonb_agg(distinct rb.role::text order by rb.role::text) as roles
    from public.role_bindings as rb
    join public.tenants as t on t.id = rb.tenant_id
    where rb.app_user_id = v_app_user_id
      and rb.active
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
      and t.status = 'active'
      and t.family_portal_enabled
    group by rb.tenant_id, t.display_name, t.environment_id, t.data_mode
  )
  select jsonb_build_object(
    'appUserId', v_app_user_id,
    'providerIssuer', private.jwt_claim('iss'),
    'providerSubject', private.jwt_claim('sub'),
    'tenants', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', tr.tenant_id,
          'displayName', tr.display_name,
          'environmentId', tr.environment_id,
          'dataMode', tr.data_mode,
          'roles', tr.roles
        ) order by tr.display_name, tr.tenant_id
      ),
      '[]'::jsonb
    )
  )
  into v_context
  from tenant_roles as tr;

  return v_context;
end;
$$;

-- Every API-visible table has RLS. Tables with no policy are intentionally
-- inaccessible to browser roles even if a future grant is added accidentally.
do $rls$
declare
  table_name text;
begin
  foreach table_name in array array[
    'tenants', 'app_users', 'provider_identities', 'tenant_identity_issuers',
    'schools', 'students',
    'role_bindings', 'classes', 'enrollments', 'class_staff_bindings',
    'assignments',
    'student_assignments', 'family_content_release_memberships',
    'progress_projections_v1', 'skill_projections_v1',
    'guardian_links', 'guardian_invitations', 'family_threads',
    'family_messages', 'family_thread_reads',
    'family_notification_preferences', 'school_announcements',
    'learning_events_v2', 'notification_outbox', 'email_delivery_events',
    'email_suppressions', 'audit_events', 'retention_policies', 'retention_runs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$rls$;

create policy provider_identities_select_self
on public.provider_identities for select to authenticated
using (
  active
  and issuer = public.family_current_issuer_v1()
  and subject = public.family_current_subject_v1()
);

create policy role_bindings_select_self
on public.role_bindings for select to authenticated
using (
  active and app_user_id = public.family_current_app_user_id_v1()
);

create policy tenants_select_member
on public.tenants for select to authenticated
using (
  family_portal_enabled
  and status = 'active'
  and public.family_has_role_v1(
    id,
    array[
      'guardian', 'learner', 'teacher', 'school_admin', 'district_admin'
    ]::public.app_role[]
  )
);

create policy schools_select_authorized
on public.schools for select to authenticated
using (public.family_can_access_school_v1(tenant_id, id));

create policy students_select_authorized
on public.students for select to authenticated
using (public.family_can_access_student_v1(tenant_id, id));

create policy classes_select_authorized
on public.classes for select to authenticated
using (public.family_can_access_class_v1(tenant_id, id));

create policy enrollments_select_authorized
on public.enrollments for select to authenticated
using (public.family_can_access_student_v1(tenant_id, student_id));

create policy assignments_select_authorized
on public.assignments for select to authenticated
using (public.family_can_access_assignment_v1(tenant_id, id));

create policy student_assignments_select_authorized
on public.student_assignments for select to authenticated
using (
  exists (
    select 1 from public.enrollments as e
    where e.tenant_id = student_assignments.tenant_id
      and e.id = student_assignments.enrollment_id
      and public.family_can_access_student_v1(e.tenant_id, e.student_id)
  )
);

create policy progress_projections_select_authorized
on public.progress_projections_v1 for select to authenticated
using (public.family_can_access_student_v1(tenant_id, student_id));

create policy skill_projections_select_authorized
on public.skill_projections_v1 for select to authenticated
using (public.family_can_access_student_v1(tenant_id, student_id));

create policy guardian_links_select_authorized
on public.guardian_links for select to authenticated
using (
  (
    guardian_user_id = public.family_current_app_user_id_v1()
    and status = 'active'
    and (expires_at is null or expires_at > statement_timestamp())
    and public.family_can_access_student_v1(tenant_id, student_id)
  )
  or public.family_can_manage_student_v1(tenant_id, student_id)
);

create policy family_threads_select_authorized
on public.family_threads for select to authenticated
using (public.family_can_access_thread_v1(tenant_id, id));

create policy family_messages_select_authorized
on public.family_messages for select to authenticated
using (public.family_can_access_thread_v1(tenant_id, thread_id));

create policy family_thread_reads_select_self
on public.family_thread_reads for select to authenticated
using (
  app_user_id = public.family_current_app_user_id_v1()
  and public.family_can_access_thread_v1(tenant_id, thread_id)
);

create policy family_notification_preferences_select_self
on public.family_notification_preferences for select to authenticated
using (
  app_user_id = public.family_current_app_user_id_v1()
  and exists (
    select 1
    from public.tenants as t
    join public.role_bindings as rb
      on rb.tenant_id = t.id
      and rb.app_user_id = family_notification_preferences.app_user_id
    where t.id = family_notification_preferences.tenant_id
      and t.status = 'active' and t.family_portal_enabled
      and rb.role = 'guardian' and rb.active
      and rb.starts_at <= statement_timestamp()
      and (rb.ends_at is null or rb.ends_at > statement_timestamp())
      and exists (
        select 1
        from public.guardian_links as gl
        join public.students as s
          on s.tenant_id = gl.tenant_id and s.id = gl.student_id
        join public.schools as sc
          on sc.tenant_id = s.tenant_id and sc.id = s.school_id
        where gl.tenant_id = t.id
          and gl.guardian_user_id = family_notification_preferences.app_user_id
          and gl.status = 'active'
          and (gl.expires_at is null or gl.expires_at > statement_timestamp())
          and s.active and sc.active
      )
  )
);

create policy school_announcements_select_authorized
on public.school_announcements for select to authenticated
using (
  published_at <= statement_timestamp()
  and (expires_at is null or expires_at > statement_timestamp())
  and public.family_can_access_school_v1(tenant_id, school_id)
);

revoke all on all tables in schema public from public, anon, authenticated;

-- The browser surface is RPC-only. RLS remains defense in depth, but no
-- authenticated role can compose a new repository query against base tables.

grant select, insert, update, delete on all tables in schema public to service_role;

revoke all on function private.jwt_claim(text) from public;
revoke all on function public.family_current_issuer_v1() from public;
revoke all on function public.family_current_subject_v1() from public;
revoke all on function public.family_current_app_user_id_v1() from public;
revoke all on function public.family_has_role_v1(uuid, public.app_role[], uuid, uuid) from public;
revoke all on function public.family_can_access_school_v1(uuid, uuid) from public;
revoke all on function public.family_can_access_student_v1(uuid, uuid) from public;
revoke all on function public.family_can_manage_student_v1(uuid, uuid) from public;
revoke all on function public.family_can_access_assignment_v1(uuid, uuid) from public;
revoke all on function public.family_can_access_class_v1(uuid, uuid) from public;
revoke all on function public.family_can_access_thread_v1(uuid, uuid) from public;
revoke all on function public.family_authorization_context_v1() from public;

grant execute on function public.family_authorization_context_v1()
  to authenticated;

comment on function public.family_current_app_user_id_v1() is
  'Maps only the signed JWT issuer + subject pair to an active app user; email is not consulted.';
comment on function public.family_authorization_context_v1() is
  'Returns every enabled tenant/role context for the mapped identity; it accepts no actor or tenant parameter.';

commit;
