-- Run with `supabase test db` after migrations and the fictional seed load.

begin;

select set_config(
  'test.family_email_digest',
  repeat('5', 64),
  true
);
select set_config(
  'test.revoked_email_digest',
  repeat('6', 64),
  true
);

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select extensions.plan(489);

-- Test-only grants are rolled back with this file. Application migrations do
-- not expose the extensions schema or pgcrypto to browser roles.
grant usage on schema extensions
  to authenticated, service_role, family_webhook_writer,
    family_invitation_issuer;
grant execute on all functions in schema extensions
  to authenticated, service_role, family_webhook_writer,
    family_invitation_issuer;

select extensions.has_table('public', 'tenants', 'tenants table exists');
select extensions.has_table('public', 'app_users', 'app_users table exists');
select extensions.has_table('public', 'provider_identities', 'provider identities exist');
select extensions.has_table('public', 'role_bindings', 'role bindings exist');
select extensions.has_table(
  'public', 'tenant_identity_issuers', 'tenant issuer allowlist exists'
);
select extensions.has_table('public', 'classes', 'classes exist');
select extensions.has_table('public', 'enrollments', 'enrollments exist');
select extensions.has_table(
  'public', 'class_staff_bindings', 'class staff bindings exist'
);
select extensions.has_table('public', 'assignments', 'assignments exist');
select extensions.has_table(
  'public', 'student_assignments', 'student assignments exist'
);
select extensions.has_table(
  'public', 'family_content_release_memberships',
  'learning event release membership exists'
);
select extensions.has_table(
  'public', 'progress_projections_v1', 'progress projection exists'
);
select extensions.has_table(
  'public', 'skill_projections_v1', 'skill projection exists'
);
select extensions.has_table(
  'public', 'school_announcements', 'school announcements exist'
);
select extensions.has_table(
  'public', 'email_delivery_events', 'delivery events exist'
);
select extensions.has_function(
  'public', 'family_workspace_for_tenant_v1', array['uuid', 'uuid'],
  'tenant-scoped workspace RPC exists'
);
select extensions.has_function(
  'public', 'accept_guardian_invitation_v1',
  array['text', 'text', 'text'], 'accept RPC exists'
);
select extensions.has_function(
  'public', 'claim_family_notification_outbox_v1',
  array['integer'], 'outbox claim RPC exists'
);
select extensions.has_function(
  'public', 'record_family_email_delivery_event_v1',
  array['text', 'text', 'email_delivery_event_type', 'timestamp with time zone'],
  'delivery webhook RPC exists'
);
select extensions.alike(
  pg_get_functiondef(
    'public.ingest_learning_events_v2(jsonb)'::regprocedure
  ),
  '%transaction_isolation%read committed%for no key update of s%',
  'learning event ingestion requires RC and serializes one-assignment student batches'
);
select extensions.is(
  (
    select count(*)
    from unnest(array[
      'public.tenants', 'public.schools', 'public.students', 'public.classes',
      'public.enrollments', 'public.assignments',
      'public.student_assignments', 'public.progress_projections_v1',
      'public.skill_projections_v1', 'public.guardian_links',
      'public.family_threads', 'public.family_messages',
      'public.family_notification_preferences', 'public.school_announcements'
    ]) as base_table(name)
    where has_table_privilege('authenticated', base_table.name, 'select')
  ), 0::bigint,
  'authenticated has no direct SELECT privilege on family business tables'
);
select extensions.is(
  (
    select count(*)
    from unnest(array[
      'public.family_current_issuer_v1()',
      'public.family_current_subject_v1()',
      'public.family_current_app_user_id_v1()',
      'public.family_can_access_school_v1(uuid,uuid)',
      'public.family_can_access_student_v1(uuid,uuid)',
      'public.family_can_access_assignment_v1(uuid,uuid)',
      'public.family_can_access_class_v1(uuid,uuid)',
      'public.family_can_access_thread_v1(uuid,uuid)'
    ]) as helper(signature)
    where has_function_privilege(
      'authenticated', helper.signature, 'execute'
    )
  ), 0::bigint,
  'authenticated cannot execute internal identity and access helpers directly'
);
select extensions.is(
  has_function_privilege(
    'family_webhook_writer',
    'public.record_family_email_delivery_event_v1(text,text,public.email_delivery_event_type,timestamp with time zone)',
    'execute'
  ), true,
  'dedicated webhook writer can execute the delivery event boundary'
);
select extensions.is(
  has_function_privilege(
    'service_role',
    'public.record_family_email_delivery_event_v1(text,text,public.email_delivery_event_type,timestamp with time zone)',
    'execute'
  ), false,
  'service role cannot execute the dedicated webhook boundary'
);
select extensions.is(
  has_function_privilege(
    'anon',
    'public.record_family_email_delivery_event_v1(text,text,public.email_delivery_event_type,timestamp with time zone)',
    'execute'
  ), false,
  'anonymous role cannot execute the dedicated webhook boundary'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.record_family_email_delivery_event_v1(text,text,public.email_delivery_event_type,timestamp with time zone)',
    'execute'
  ), false,
  'authenticated role cannot execute the dedicated webhook boundary'
);
select extensions.is(
  pg_has_role('authenticator', 'family_webhook_writer', 'member'), true,
  'PostgREST authenticator can SET ROLE to the dedicated webhook writer'
);
select extensions.is(
  (
    select not (
      rolcanlogin or rolinherit or rolsuper or rolbypassrls
      or rolcreatedb or rolcreaterole or rolreplication
    )
    from pg_catalog.pg_roles
    where rolname = 'family_webhook_writer'
  ), true,
  'dedicated webhook writer has no login or elevated role attributes'
);
select extensions.is(
  not exists (
    select 1
    from pg_catalog.pg_auth_members as membership
    join pg_catalog.pg_roles as member_role
      on member_role.oid = membership.member
    where member_role.rolname = 'family_webhook_writer'
  )
  and (
    select count(*) = 1
    from pg_catalog.pg_auth_members as membership
    join pg_catalog.pg_roles as granted_role
      on granted_role.oid = membership.roleid
    join pg_catalog.pg_roles as member_role
      on member_role.oid = membership.member
    where granted_role.rolname = 'family_webhook_writer'
      and member_role.rolname = 'authenticator'
      and not membership.admin_option
  ), true,
  'dedicated webhook writer has only non-admin authenticator membership'
);
select extensions.is(
  (
    select count(*)
    from pg_catalog.pg_proc as proc
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and has_function_privilege(
        'family_webhook_writer', proc.oid, 'execute'
      )
  ), 1::bigint,
  'dedicated webhook writer can execute exactly one public function'
);
select extensions.is(
  (
    select count(*)
    from unnest(array[
      'public.notification_outbox', 'public.email_delivery_events',
      'public.email_suppressions', 'public.app_users'
    ]) as webhook_table(name)
    where has_table_privilege(
      'family_webhook_writer', webhook_table.name,
      'select,insert,update,delete'
    )
  ), 0::bigint,
  'dedicated webhook writer has no direct table privileges'
);
select extensions.is(
  (
    select count(*)
    from information_schema.sequences as sequence
    where sequence.sequence_schema = 'public'
      and has_sequence_privilege(
        'family_webhook_writer',
        format('%I.%I', sequence.sequence_schema, sequence.sequence_name),
        'usage,select,update'
      )
  ), 0::bigint,
  'dedicated webhook writer has no direct sequence privileges'
);
select extensions.is(
  has_schema_privilege('family_webhook_writer', 'public', 'usage')
    and not has_schema_privilege(
      'family_webhook_writer', 'public', 'create'
    )
    and not has_schema_privilege(
      'family_webhook_writer', 'private', 'usage'
    ), true,
  'dedicated webhook writer has public usage only and no private schema access'
);

set local role family_webhook_writer;
select set_config(
  'request.jwt.claims', '{"role":"family_webhook_writer"}', true
);
select extensions.lives_ok(
  $$select public.record_family_email_delivery_event_v1(
    'test-webhook-event-missing', 'test-webhook-email-missing',
    'delivered'::public.email_delivery_event_type, statement_timestamp()
  )$$,
  'verified dedicated webhook role reaches the non-enumerating RPC boundary'
);
select set_config(
  'request.jwt.claims', '{"role":"authenticated"}', true
);
select extensions.throws_ok(
  $$select public.record_family_email_delivery_event_v1(
    'test-webhook-event-wrong-role', 'test-webhook-email-wrong-role',
    'delivered'::public.email_delivery_event_type, statement_timestamp()
  )$$,
  '42501', 'dedicated family webhook writer required',
  'the webhook RPC rejects a mismatched signed JWT role claim'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);

select extensions.is(
  public.family_authorization_context_v1() ->> 'appUserId',
  '10000000-0000-4000-8000-000000000010',
  'issuer + subject maps guardian A'
);
select extensions.is(
  jsonb_array_length(public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', null
  ) -> 'children'), 1,
  'guardian workspace contains one linked child, not a school roster'
);
select extensions.is(
  public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', null
  ) ->> 'selectedChildId',
  '10000000-0000-4000-8000-000000000020',
  'guardian sees only their linked child'
);
select extensions.is(
  jsonb_array_length(public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', null
  ) -> 'threads'), 1,
  'guardian workspace contains only their child-specific thread'
);
select extensions.is(
  public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', null
  ) -> 'messageContacts' -> 0 ->> 'staffUserId',
  '10000000-0000-4000-8000-000000000012',
  'guardian message contacts include the current teacher for the selected enrollment'
);
select extensions.ok(
  not exists (
    select 1
    from jsonb_array_elements(
      public.family_workspace_for_tenant_v1(
        '10000000-0000-4000-8000-000000000001', null
      ) -> 'messageContacts'
    ) as contact
    where contact ->> 'staffUserId' =
      '20000000-0000-4000-8000-000000000012'
  ),
  'guardian message contacts exclude staff from another tenant and class'
);
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000021'::uuid
  )$$,
  'P0002', 'family workspace not found',
  'workspace rejects another guardian child'
);
select extensions.throws_ok(
  $$select * from public.send_family_message_v1(
    'Cross guardian attempt', null, 'test.cross.guardian.001',
    null, null, '10000000-0000-4000-8000-000000000902'::uuid, null
  )$$,
  'P0002', 'thread not found',
  'message RPC rejects another guardian thread'
);
select extensions.lives_ok(
  $$select * from public.send_family_message_v1(
    'A fictional follow-up from Avery', null, 'test.message.avery.001',
    null, null, '10000000-0000-4000-8000-000000000901'::uuid, null
  )$$,
  'guardian can append to their open thread'
);

reset role;
select extensions.is(
  (
    select count(*) from public.family_messages
    where idempotency_key = 'test.message.avery.001'
  ), 1::bigint,
  'authorized message is persisted once'
);

-- Terminal role behavior uses a disposable identity; canonical guardian-a is
-- retained for later lifecycle assertions because inactive roles cannot be
-- resurrected by design.
insert into public.app_users (
  id, display_name, locale, status
) values (
  '10000000-0000-4000-8000-000000000018',
  'Lifecycle Fictional Guardian', 'en', 'active'
);
insert into public.provider_identities (
  issuer, subject, app_user_id, active
) values (
  'urn:help-math:synthetic', 'lifecycle-guardian',
  '10000000-0000-4000-8000-000000000018', true
);
insert into public.role_bindings (
  id, tenant_id, environment_id, data_mode, app_user_id, role, active
) values (
  '10000000-0000-4000-8000-000000000209',
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000018', 'guardian', true
);
insert into public.guardian_links (
  tenant_id, environment_id, data_mode, id, guardian_user_id, student_id,
  relationship_kind, status, created_by_user_id, verified_at
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000804',
  '10000000-0000-4000-8000-000000000018',
  '10000000-0000-4000-8000-000000000020', 'caregiver', 'active',
  '10000000-0000-4000-8000-000000000013', statement_timestamp()
);
update public.role_bindings
set active = false, ends_at = statement_timestamp()
where id = '10000000-0000-4000-8000-000000000209';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"lifecycle-guardian"}',
  true
);
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020'
  )$$,
  'P0002', 'family workspace not found',
  'workspace rejects an inactive guardian role even while the link is active'
);
reset role;

update public.guardian_links
set created_at = statement_timestamp() - interval '2 days',
    expires_at = statement_timestamp() - interval '1 day'
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and guardian_user_id = '10000000-0000-4000-8000-000000000010'
  and student_id = '10000000-0000-4000-8000-000000000020'
  and status = 'active';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020'
  )$$,
  'P0002', 'family workspace not found',
  'workspace rejects an expired link before retention terminalizes it'
);
reset role;
update public.guardian_links
set expires_at = null
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and guardian_user_id = '10000000-0000-4000-8000-000000000010'
  and student_id = '10000000-0000-4000-8000-000000000020'
  and status = 'active';

update public.students set active = false
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and id = '10000000-0000-4000-8000-000000000020';
set local role authenticated;
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020'
  )$$,
  'P0002', 'family workspace not found',
  'workspace rejects an inactive student'
);
reset role;
update public.students set active = true
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and id = '10000000-0000-4000-8000-000000000020';

update public.schools set active = false
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and id = '10000000-0000-4000-8000-000000000101';
set local role authenticated;
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020'
  )$$,
  'P0002', 'family workspace not found',
  'workspace rejects an inactive school'
);
reset role;
update public.schools set active = true
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and id = '10000000-0000-4000-8000-000000000101';

update public.tenants set family_portal_enabled = false
where id = '10000000-0000-4000-8000-000000000001';
set local role authenticated;
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020'
  )$$,
  'P0002', 'family workspace not found',
  'workspace rejects a disabled family portal tenant'
);
reset role;
update public.tenants set family_portal_enabled = true
where id = '10000000-0000-4000-8000-000000000001';

-- Controlled inactive-identity fixture: acceptance must not silently revive
-- an expired guardian role through ON CONFLICT DO NOTHING.
insert into public.app_users (
  id, display_name, locale, status
) values (
  '10000000-0000-4000-8000-000000000019',
  'Inactive Fictional Guardian', 'en', 'active'
);
insert into public.provider_identities (
  issuer, subject, app_user_id, active
) values (
  'urn:help-math:synthetic', 'inactive-guardian',
  '10000000-0000-4000-8000-000000000019', true
);
insert into public.role_bindings (
  tenant_id, environment_id, data_mode, app_user_id, role,
  active, starts_at, ends_at
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000019', 'guardian', false,
  statement_timestamp() - interval '2 days',
  statement_timestamp() - interval '1 day'
);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select public.create_guardian_invitation_v1(
  '10000000-0000-4000-8000-000000000020'::uuid,
  repeat('9', 64), 'v1.synthetic.inactive.guardian.email',
  repeat('7', 64), 'v1.synthetic.inactive.guardian.token',
  statement_timestamp() + interval '7 days', 'test.invite.inactive.001'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"inactive-guardian"}',
  true
);
select extensions.throws_ok(
  $$select * from public.accept_guardian_invitation_v1(
    repeat('7', 64), repeat('9', 64), 'test.invite.inactive.002'
  )$$,
  '42501', 'guardian role inactive',
  'accept fails closed for an existing inactive guardian role'
);
reset role;
select extensions.is(
  (
    select status::text from public.guardian_invitations
    where create_idempotency_key = 'test.invite.inactive.001'
  ), 'pending',
  'failed inactive-role acceptance leaves the invitation pending'
);
select extensions.is(
  (
    select count(*) from public.guardian_links
    where guardian_user_id = '10000000-0000-4000-8000-000000000019'
      and status = 'active'
  ), 0::bigint,
  'failed inactive-role acceptance creates no active guardian link'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-b"}',
  true
);
select extensions.is(
  jsonb_array_length(public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', null
  ) -> 'children'), 1,
  'second guardian workspace also contains only one child'
);
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020'
  )$$,
  'P0002', 'family workspace not found',
  'revoked guardian link grants no student access'
);
select extensions.is(
  jsonb_array_length(public.family_authorization_context_v1() -> 'tenants'), 1,
  'guardian cannot cross tenant boundary'
);

select extensions.throws_ok(
  'select count(*) from public.learning_events_v2',
  '42501', 'permission denied for table learning_events_v2',
  'table without a browser policy and grant fails closed'
);
select extensions.throws_ok(
  'select count(*) from public.notification_outbox',
  '42501', 'permission denied for table notification_outbox',
  'outbox is not browser-readable'
);
select extensions.throws_ok(
  'select count(*) from public.app_users',
  '42501', 'permission denied for table app_users',
  'identity profile table is not browser-readable'
);
select extensions.throws_ok(
  'select count(*) from public.guardian_invitations',
  '42501', 'permission denied for table guardian_invitations',
  'invitation HMAC and token metadata are never browser-readable'
);
select extensions.throws_ok(
  'select count(*) from public.class_staff_bindings',
  '42501', 'permission denied for table class_staff_bindings',
  'class staff binding is service-only and fails closed'
);

reset role;
insert into public.students (
  tenant_id, environment_id, data_mode, id, school_id, local_reference,
  display_name, grade_label, locale, active
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000022',
  '10000000-0000-4000-8000-000000000101', 'CEDAR-UNBOUND',
  'Rowan Unbound Student', 'Grade 4', 'en', true
);
insert into public.classes (
  tenant_id, environment_id, data_mode, id, school_id, display_name,
  grade_label, academic_term, active
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000302',
  '10000000-0000-4000-8000-000000000101', 'Cedar Unbound Grade 4',
  'Grade 4', 'Synthetic Fall', true
);
insert into public.enrollments (
  tenant_id, environment_id, data_mode, id, student_id, class_id, status,
  starts_at
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000403',
  '10000000-0000-4000-8000-000000000022',
  '10000000-0000-4000-8000-000000000302', 'active', current_date
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"teacher-a"}',
  true
);
select extensions.is(
  has_table_privilege('authenticated', 'public.students', 'select'), false,
  'authenticated teacher has no direct students table access'
);
select extensions.is(
  has_table_privilege('authenticated', 'public.classes', 'select'), false,
  'authenticated teacher has no direct classes table access'
);
select extensions.is(
  has_table_privilege('authenticated', 'public.enrollments', 'select'), false,
  'authenticated teacher has no direct enrollments table access'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.is(
  jsonb_array_length(public.family_authorization_context_v1() -> 'tenants'), 1,
  'school admin is tenant-scoped'
);
select extensions.throws_ok(
  'select count(*) from public.family_threads',
  '42501', 'permission denied for table family_threads',
  'school admin cannot browse participant messages without break-glass access'
);
select extensions.throws_ok(
  $$select * from public.create_guardian_invitation_v1(
    '10000000-0000-4000-8000-000000000020'::uuid,
    current_setting('test.family_email_digest'),
    'v1.synthetic.new.guardian.email.ciphertext', repeat('f', 64),
    'v1.synthetic.new.invitation.token.ciphertext',
    statement_timestamp() + interval '7 days', 'test.invite.bootstrap.001'
  )$$,
  '42501', 'permission denied for function create_guardian_invitation_v1',
  'authenticated invitation creation fails closed without issuer attestation'
);
select extensions.throws_ok(
  $$select * from public.resend_guardian_invitation_v1(
    '10000000-0000-4000-8000-000000000701'::uuid,
    repeat('e', 64), 'v1.synthetic.resend.token.ciphertext',
    statement_timestamp() + interval '7 days', 'test.invite.resend.denied.001'
  )$$,
  '42501', 'permission denied for function resend_guardian_invitation_v1',
  'authenticated invitation resend fails closed without issuer attestation'
);

-- Controlled migration-owner fixture setup. This proves only that accept can
-- consume a correctly formed locked row; it does not claim an end-to-end
-- invitation issuance path or upstream attestation.
reset role;
select public.create_guardian_invitation_v1(
  '10000000-0000-4000-8000-000000000020'::uuid,
  current_setting('test.family_email_digest'),
  'v1.synthetic.new.guardian.email.ciphertext', repeat('f', 64),
  'v1.synthetic.new.invitation.token.ciphertext',
  statement_timestamp() + interval '7 days', 'test.invite.bootstrap.001'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'authenticated',
    'iss', 'urn:help-math:synthetic',
    'sub', 'new-guardian',
    'name', 'New Fictional Guardian',
    'locale', 'en'
  )::text,
  true
);
select extensions.lives_ok(
  $$select * from public.accept_guardian_invitation_v1(
    repeat('f', 64),
    current_setting('test.family_email_digest'),
    'test.invite.accept.001'
  )$$,
  'accept bootstraps an unmapped adult from a controlled owner fixture'
);

reset role;
select extensions.is(
  (
    select count(*) from public.provider_identities
    where issuer = 'urn:help-math:synthetic' and subject = 'new-guardian'
  ), 1::bigint,
  'bootstrap creates one exact provider identity'
);
select extensions.is(
  (
    select count(*)
    from public.guardian_links as gl
    join public.provider_identities as pi on pi.app_user_id = gl.guardian_user_id
    where pi.issuer = 'urn:help-math:synthetic'
      and pi.subject = 'new-guardian'
      and gl.student_id = '10000000-0000-4000-8000-000000000020'
      and gl.status = 'active'
  ), 1::bigint,
  'bootstrap creates one active guardian link'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'authenticated',
    'iss', 'urn:help-math:synthetic',
    'sub', 'unmapped-with-wrong-email-proof'
  )::text,
  true
);
select extensions.is_empty(
  $$select * from public.accept_guardian_invitation_v1(
    repeat('f', 64),
    repeat('4', 64),
    'test.invite.accept.002'
  )$$,
  'identity bootstrap returns the same empty receipt without the server-derived email HMAC'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
-- A second controlled migration-owner fixture exercises authenticated revoke
-- without reopening the disabled create path.
reset role;
select public.create_guardian_invitation_v1(
  '10000000-0000-4000-8000-000000000021'::uuid,
  current_setting('test.revoked_email_digest'),
  'v1.synthetic.revoked.email.ciphertext', repeat('8', 64),
  'v1.synthetic.revoked.invitation.token.ciphertext',
  statement_timestamp() + interval '7 days', 'test.invite.revoke.001'
);

select set_config(
  'test.revoked_invitation_id',
  (
    select id::text from public.guardian_invitations
    where create_idempotency_key = 'test.invite.revoke.001'
  ),
  true
);
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
create temporary table test_claimed_invitation as
select claimed.*
from public.claim_family_notification_outbox_v1(100) as claimed
where claimed.kind = 'guardian_invitation'
  and claimed.idempotency_key = 'test.invite.revoke.001:invite';
select extensions.is(
  (select count(*) from test_claimed_invitation),
  1::bigint,
  'pending invitation can receive one bounded worker lease'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.lives_ok(
  $$select public.revoke_guardian_invitation_v1(
    current_setting('test.revoked_invitation_id')::uuid,
    'test.invite.revoke.002', 'Fictional duplicate invitation'
  )$$,
  'admin can revoke a pending invitation'
);

reset role;
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.is(
  public.validate_family_notification_claim_v1(
    (select id from test_claimed_invitation),
    (select claim_token from test_claimed_invitation)
  ),
  false,
  'revocation invalidates an already claimed invitation before delivery'
);

reset role;
select extensions.is(
  (
    select status::text from public.guardian_invitations
    where create_idempotency_key = 'test.invite.revoke.001'
  ), 'revoked',
  'revoked invitation is terminal'
);
select extensions.is(
  (
    select status::text from public.notification_outbox
    where idempotency_key = 'test.invite.revoke.001:invite'
  ), 'cancelled',
  'revocation cancels its pending outbox item'
);

insert into public.tenants (
  id, slug, display_name, environment_id, data_mode,
  family_portal_enabled, status
) values (
  '30000000-0000-4000-8000-000000000001', 'production-shape-test',
  'Production Shape Test', 'test.production', 'production', true, 'active'
);
select extensions.is(
  private.family_retention_days_v1(
    '30000000-0000-4000-8000-000000000001', 'family_message'
  ), null::integer,
  'production tenant has no messaging path without approved retention'
);
select extensions.throws_ok(
  $$insert into public.role_bindings (
      tenant_id, environment_id, data_mode, app_user_id, role, active
    ) values (
      '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
      '10000000-0000-4000-8000-000000000014', 'district_admin', true
    )$$,
  '42501', 'approved identity retention policies required',
  'production identity association fails closed without contact and provider retention policies'
);
delete from public.tenants
where id = '30000000-0000-4000-8000-000000000001';

update public.family_threads
set status = 'closed', closed_at = statement_timestamp(),
  closed_idempotency_key = 'test.thread.close.001'
where id = '10000000-0000-4000-8000-000000000901';
select extensions.throws_ok(
  $$update public.family_threads
    set status = 'open', closed_at = null
    where id = '10000000-0000-4000-8000-000000000901'$$,
  '23514', 'closed family thread is terminal',
  'closed thread cannot reopen'
);
select set_config('help_math.family_redaction', 'off', true);
select extensions.throws_ok(
  $$update public.family_messages set body = 'Changed'
    where id = '10000000-0000-4000-8000-000000000911'$$,
  '42501', 'family messages are append-only',
  'sender message content cannot be edited'
);

create temporary table test_learning_event_payload (payload jsonb not null);
insert into test_learning_event_payload values (
  jsonb_build_array(jsonb_build_object(
    'schemaVersion', 2,
    'activeDurationMs', 1500,
    'assignmentId', '10000000-0000-4000-8000-000000000501',
    'occurredAt', statement_timestamp(),
    'attemptNumber', 1,
    'clientMutationId', 'test.learning.001',
    'clientVersion', 'synthetic-test-v1',
    'contentReleaseId', 'synthetic-content-v1',
    'eventId', '10000000-0000-4000-8000-00000000a001',
    'eventType', 'page_reviewed',
    'idempotencyKey', 'test.learning.event.001',
    'learningObjectVersionId', 'synthetic-object-v1',
    'lessonReleaseId', 'synthetic-g04-l03-v1',
    'locale', 'en',
    'outcome', 'completed',
    'sessionId', '10000000-0000-4000-8000-00000000b001',
    'skillId', 'synthetic.fractions.compare'
  ))
);
grant select on test_learning_event_payload to authenticated;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-a"}',
  true
);
reset role;
insert into public.role_bindings (
  id, tenant_id, environment_id, data_mode, app_user_id, role,
  school_id, student_id, active
) values (
  '10000000-0000-4000-8000-000000000208',
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000015', 'learner', null,
  '10000000-0000-4000-8000-000000000021', true
);
-- Migration 012 makes the general ingestion implementation owner-internal.
-- These lower-level projection tests keep the signed learner fixture claims,
-- but deliberately exercise the implementation as the migration owner. The
-- public authenticated denial is asserted again in the 012 block below.
reset role;
select extensions.throws_ok(
  $$select public.ingest_learning_events_v2(
    (select payload from test_learning_event_payload)
  )$$,
  'P0002', 'learning assignment not found',
  'ingest rejects an ambiguous learner to assignment mapping'
);
reset role;
delete from public.role_bindings
where id = '10000000-0000-4000-8000-000000000208';
reset role;
select extensions.throws_ok(
  $$select public.ingest_learning_events_v2(
    jsonb_set(
      (select payload from test_learning_event_payload),
      '{0,contentReleaseId}', to_jsonb('wrong-content'::text)
    )
  )$$,
  '22023', 'learning event release membership not published',
  'ingest rejects an unregistered content release'
);
select extensions.throws_ok(
  $$select public.ingest_learning_events_v2(
    jsonb_set(
      (select payload from test_learning_event_payload),
      '{0,learningObjectVersionId}', to_jsonb('wrong-object'::text)
    )
  )$$,
  '22023', 'learning event release membership not published',
  'ingest rejects an unregistered learning object version'
);
select extensions.throws_ok(
  $$select public.ingest_learning_events_v2(
    jsonb_set(
      (select payload from test_learning_event_payload),
      '{0,skillId}', to_jsonb('wrong.skill'::text)
    )
  )$$,
  '22023', 'learning event release membership not published',
  'ingest rejects an unregistered skill membership'
);
select extensions.lives_ok(
  $$select public.ingest_learning_events_v2(
    (select payload from test_learning_event_payload)
  )$$,
  'ingest accepts an exact published event membership'
);
select extensions.is(
  (
    public.ingest_learning_events_v2(
      (select payload from test_learning_event_payload)
    ) ->> 'ignored'
  )::integer,
  1,
  'replaying an event id is ignored exactly once'
);
select extensions.throws_ok(
  $$select public.ingest_learning_events_v2(
    jsonb_build_array(
      ((select payload -> 0 from test_learning_event_payload) ||
        jsonb_build_object('outcome', 'incorrect'))
    )
  )$$,
  '22023', 'learning event idempotency conflict',
  'the same idempotency identity with a different payload fails closed'
);
select extensions.is(
  (
    public.ingest_learning_events_v2(
      jsonb_build_array(
        ((select payload -> 0 from test_learning_event_payload) ||
          jsonb_build_object(
            'eventId', '10000000-0000-4000-8000-00000000a003',
            'clientMutationId', 'test.learning.duplicate.business.001',
            'idempotencyKey', 'test.learning.duplicate.business.event.001'
          ))
      )
    ) ->> 'ignored'
  )::integer,
  1,
  'a new UUID cannot replay the same student-assignment-object page review'
);
reset role;
select extensions.is(
  (
    select reviewed_pages from public.progress_projections_v1
    where assignment_id = '10000000-0000-4000-8000-000000000501'
      and student_id = '10000000-0000-4000-8000-000000000020'
  ),
  1,
  'duplicate event does not increment reviewed pages'
);
select extensions.is(
  (
    select evidence_count from public.skill_projections_v1
    where student_id = '10000000-0000-4000-8000-000000000020'
      and skill_id = 'synthetic.fractions.compare'
  ),
  8,
  'page_reviewed is not an approved skill evidence event'
);
reset role;
select extensions.lives_ok(
  $$select public.ingest_learning_events_v2(
    jsonb_build_array(
      ((select payload -> 0 from test_learning_event_payload) ||
        jsonb_build_object(
          'eventId', '10000000-0000-4000-8000-00000000a002',
          'eventType', 'practice_evaluated',
          'outcome', 'correct',
          'clientMutationId', 'test.learning.practice.001',
          'idempotencyKey', 'test.learning.practice.event.001'
        ))
    )
  )$$,
  'approved practice outcome is accepted as skill evidence'
);
reset role;
select extensions.is(
  (
    select evidence_count from public.skill_projections_v1
    where student_id = '10000000-0000-4000-8000-000000000020'
      and skill_id = 'synthetic.fractions.compare'
  ),
  1,
  'only the approved practice event contributes to skill evidence'
);
reset role;
select extensions.lives_ok(
  $$select public.ingest_learning_events_v2(
    jsonb_build_array(
      ((select payload -> 0 from test_learning_event_payload) ||
        jsonb_build_object(
          'eventId', '10000000-0000-4000-8000-00000000a004',
          'eventType', 'practice_evaluated',
          'outcome', 'incorrect',
          'attemptNumber', 2,
          'clientMutationId', 'test.learning.practice.002',
          'idempotencyKey', 'test.learning.practice.event.002'
        ))
    )
  )$$,
  'a later approved practice attempt remains valid skill evidence'
);
reset role;
select extensions.is(
  (
    select evidence_count from public.skill_projections_v1
    where student_id = '10000000-0000-4000-8000-000000000020'
      and skill_id = 'synthetic.fractions.compare'
  ),
  2,
  'page uniqueness does not suppress a distinct approved practice attempt'
);

reset role;
create temporary table test_online_projection_snapshot as
select
  jsonb_build_object(
    'reviewedPages', reviewed_pages,
    'lastEventOccurredAt', last_event_occurred_at,
    'lastEventId', last_event_id
  ) as progress,
  (
    select jsonb_build_object(
      'evidenceCount', sp.evidence_count,
      'lastEventOccurredAt', sp.last_event_occurred_at,
      'lastEventId', sp.last_event_id
    )
    from public.skill_projections_v1 as sp
    where sp.tenant_id = pp.tenant_id and sp.student_id = pp.student_id
      and sp.skill_id = 'synthetic.fractions.compare'
  ) as skill
from public.progress_projections_v1 as pp
where pp.assignment_id = '10000000-0000-4000-8000-000000000501'
  and pp.student_id = '10000000-0000-4000-8000-000000000020';
update public.progress_projections_v1
set reviewed_pages = 0, stale = true,
  last_event_occurred_at = null, last_event_id = null
where assignment_id = '10000000-0000-4000-8000-000000000501'
  and student_id = '10000000-0000-4000-8000-000000000020';
update public.skill_projections_v1
set evidence_count = 0, stale = true,
  last_event_occurred_at = null, last_event_id = null
where skill_id = 'synthetic.fractions.compare'
  and student_id = '10000000-0000-4000-8000-000000000020';

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.lives_ok(
  'select public.rebuild_family_projections_v1(1000)',
  'service projection rebuild completes'
);
reset role;
select extensions.is(
  (
    select jsonb_build_object(
      'reviewedPages', reviewed_pages,
      'lastEventOccurredAt', last_event_occurred_at,
      'lastEventId', last_event_id
    )
    from public.progress_projections_v1
    where assignment_id = '10000000-0000-4000-8000-000000000501'
      and student_id = '10000000-0000-4000-8000-000000000020'
  ),
  (select progress from test_online_projection_snapshot),
  'rebuilt progress and event watermark equal the online projection'
);
select extensions.is(
  (
    select jsonb_build_object(
      'evidenceCount', evidence_count,
      'lastEventOccurredAt', last_event_occurred_at,
      'lastEventId', last_event_id
    )
    from public.skill_projections_v1
    where skill_id = 'synthetic.fractions.compare'
      and student_id = '10000000-0000-4000-8000-000000000020'
  ),
  (select skill from test_online_projection_snapshot),
  'rebuilt skill and event watermark equal the online projection'
);
select extensions.is(
  (
    select stale from public.progress_projections_v1
    where assignment_id = '10000000-0000-4000-8000-000000000501'
      and student_id = '10000000-0000-4000-8000-000000000020'
  ),
  false,
  'rebuild clears stale only for a replayed projection'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"wrong-subject"}',
  true
);
select extensions.throws_ok(
  'select public.family_authorization_context_v1()',
  '42501', 'family identity is not mapped',
  'issuer without exact subject does not map'
);

reset role;
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.lives_ok(
  $$select public.enqueue_weekly_family_digests_v1(
    date_trunc('week', current_date)::date, 1000
  )$$,
  'weekly digest enqueue runs for explicitly opted-in guardians'
);
select extensions.lives_ok(
  $$select public.enqueue_weekly_family_digests_v1(
    date_trunc('week', current_date)::date, 1000
  )$$,
  'weekly digest enqueue is safely repeatable'
);
select extensions.is(
  (
    select count(*) from public.notification_outbox
    where kind = 'weekly_family_digest'
      and recipient_user_id = '10000000-0000-4000-8000-000000000010'
  ),
  1::bigint,
  'guardian receives at most one digest per ISO week'
);
create temporary table test_claimed_outbox as
select * from public.claim_family_notification_outbox_v1(25);
select extensions.ok(
  exists (
    select 1 from test_claimed_outbox as claimed
    where char_length(claimed.recipient_email_ciphertext) >= 16
      and claimed.recipient_email_digest ~ '^[0-9a-f]{64}$'
      and claimed.claim_token is not null
      and claimed.claim_expires_at > statement_timestamp()
  ),
  'service claim returns encrypted recipient material and a bounded lease'
);
select extensions.ok(
  public.validate_family_notification_claim_v1(
    (select id from test_claimed_outbox order by id limit 1),
    (select claim_token from test_claimed_outbox order by id limit 1)
  ),
  'claimed notification must be revalidated immediately before delivery'
);
select extensions.throws_ok(
  $$select public.complete_family_notification_outbox_v1(
    (select id from test_claimed_outbox order by id limit 1),
    'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid,
    true, 'synthetic-provider-id', null
  )$$,
  'P0002', 'outbox claim not found',
  'completion rejects a stale or incorrect lease token'
);

reset role;
insert into public.notification_outbox (
  tenant_id, environment_id, data_mode, id, kind, recipient_user_id,
  recipient_email_digest, recipient_email_ciphertext, locale,
  idempotency_key, aggregate_type, aggregate_id, payload, status, attempts,
  retention_anchor_at, expires_at
)
select
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000d001', 'account_security', au.id,
  au.notification_email_digest, au.notification_email_ciphertext, au.locale,
  'test.retention.expired.001', 'guardian_link',
  '10000000-0000-4000-8000-000000000801',
  '{"kind":"account_security"}'::jsonb, 'pending', 0,
  statement_timestamp() - interval '2 days',
  statement_timestamp() - interval '1 day'
from public.app_users as au
where au.id = '10000000-0000-4000-8000-000000000010';
insert into public.notification_outbox (
  tenant_id, environment_id, data_mode, id, kind, recipient_user_id,
  recipient_email_digest, recipient_email_ciphertext, locale,
  idempotency_key, aggregate_type, aggregate_id, payload, status, attempts,
  retention_anchor_at, expires_at
)
select
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000d002', 'account_security', au.id,
  au.notification_email_digest, au.notification_email_ciphertext, au.locale,
  'test.retention.exhausted.001', 'guardian_link',
  '10000000-0000-4000-8000-000000000801',
  '{"kind":"account_security"}'::jsonb, 'pending', 4,
  statement_timestamp(), statement_timestamp() + interval '7 days'
from public.app_users as au
where au.id = '10000000-0000-4000-8000-000000000010';
insert into public.notification_outbox (
  tenant_id, environment_id, data_mode, id, kind, recipient_user_id,
  recipient_email_digest, recipient_email_ciphertext, locale,
  idempotency_key, aggregate_type, aggregate_id, payload, status, attempts,
  claimed_at, claim_token, claim_expires_at,
  retention_anchor_at, expires_at
)
select
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000d003', 'account_security', au.id,
  au.notification_email_digest, au.notification_email_ciphertext, au.locale,
  'test.retention.orphaned.001', 'guardian_link',
  '10000000-0000-4000-8000-000000000801',
  '{"kind":"account_security"}'::jsonb, 'pending', 1,
  statement_timestamp() - interval '10 minutes',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
  statement_timestamp() - interval '5 minutes',
  statement_timestamp(), statement_timestamp() + interval '7 days'
from public.app_users as au
where au.id = '10000000-0000-4000-8000-000000000010';

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select public.run_family_retention_v1(1000);
reset role;
select extensions.is(
  (
    select count(*) from public.notification_outbox
    where id = '10000000-0000-4000-8000-00000000d001'
  ), 0::bigint,
  'expired pending outbox is terminalized before eligible deletion'
);
select extensions.is(
  (
    select status::text || ':' || (claim_token is null)::text
    from public.notification_outbox
    where id = '10000000-0000-4000-8000-00000000d002'
  ), 'failed:true',
  'max-attempt outbox becomes failed and clears its lease'
);
select extensions.is(
  (
    select status::text || ':' || (claim_token is null)::text
    from public.notification_outbox
    where id = '10000000-0000-4000-8000-00000000d003'
  ), 'pending:true',
  'expired orphan lease is released for a later bounded claim'
);

select extensions.has_function(
  'public', 'teacher_family_inbox_for_tenant_v1', array['uuid'],
  'teacher family inbox RPC exists'
);
select extensions.has_function(
  'public', 'teacher_announcement_schools_for_tenant_v1', array['uuid'],
  'teacher announcement school allowlist RPC exists'
);
select extensions.has_function(
  'public', 'authorize_school_announcement_publish_v1', array['uuid'],
  'school announcement publish preflight exists'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.teacher_announcement_schools_for_tenant_v1(uuid)', 'execute'
  ), true,
  'authenticated callers may execute the teacher announcement allowlist'
);
select extensions.is(
  has_function_privilege(
    'anon', 'public.teacher_announcement_schools_for_tenant_v1(uuid)', 'execute'
  ), false,
  'anonymous callers cannot execute the teacher announcement allowlist'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.authorize_school_announcement_publish_v1(uuid)', 'execute'
  ), true,
  'authenticated callers may execute the resource publish preflight'
);
select extensions.is(
  has_function_privilege(
    'anon', 'public.authorize_school_announcement_publish_v1(uuid)', 'execute'
  ), false,
  'anonymous callers cannot execute the resource publish preflight'
);
select extensions.has_function(
  'public', 'admin_family_access_workspace_for_tenant_v1', array['uuid'],
  'admin family access workspace RPC exists'
);
select extensions.has_function(
  'public', 'relinquish_guardian_child_access_v1', array['uuid', 'text'],
  'guardian child-access relinquishment RPC exists'
);
select extensions.alike(
  pg_get_functiondef(
    'public.rebuild_family_projections_v1(integer)'::regprocedure
  ),
  '%transaction_isolation%read committed%order by locked_student.tenant_id, locked_student.id%for no key update%rebuild_family_projections_unlocked_core_v1%',
  'projection rebuild locks every affected student in canonical order before the stale-row core'
);
select extensions.is(
  has_function_privilege(
    'service_role',
    'public.rebuild_family_projections_unlocked_core_v1(integer)', 'execute'
  ), false,
  'service role cannot bypass the ordered-lock projection rebuild wrapper'
);
select extensions.is(
  has_function_privilege(
    'service_role', 'public.rebuild_family_projections_v1(integer)', 'execute'
  ), true,
  'service role can execute only the ordered-lock projection rebuild boundary'
);
select extensions.is(
  cardinality(enum_range(null::public.retention_data_class)),
  17,
  'retention policy enum covers identity, relationship, communication, and operations data'
);

select extensions.throws_ok(
  $$insert into public.notification_outbox (
      tenant_id, environment_id, data_mode, kind, recipient_user_id,
      recipient_email_digest, recipient_email_ciphertext, locale,
      idempotency_key, aggregate_type, aggregate_id, payload,
      retention_anchor_at, expires_at
    ) select
      '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
      'account_security', au.id, au.notification_email_digest,
      au.notification_email_ciphertext, au.locale,
      'test.outbox.nested-forbidden', 'guardian_link',
      '10000000-0000-4000-8000-000000000801',
      '{"kind":"account_security","metadata":{"email":"forbidden"}}'::jsonb,
      statement_timestamp(), statement_timestamp() + interval '7 days'
    from public.app_users as au
    where au.id = '10000000-0000-4000-8000-000000000010'$$,
  '22023', 'forbidden nested outbox field rejected',
  'outbox validation rejects forbidden keys at nested depth'
);
select extensions.throws_ok(
  $$insert into public.notification_outbox (
      tenant_id, environment_id, data_mode, kind, recipient_user_id,
      recipient_email_digest, recipient_email_ciphertext, locale,
      idempotency_key, aggregate_type, aggregate_id, payload,
      retention_anchor_at, expires_at
    ) select
      '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
      'account_security', au.id, au.notification_email_digest,
      au.notification_email_ciphertext, au.locale,
      'test.outbox.unexpected-key', 'guardian_link',
      '10000000-0000-4000-8000-000000000801',
      '{"kind":"account_security","extra":"forbidden"}'::jsonb,
      statement_timestamp(), statement_timestamp() + interval '7 days'
    from public.app_users as au
    where au.id = '10000000-0000-4000-8000-000000000010'$$,
  '22023', 'invalid account security outbox payload',
  'outbox validation rejects keys outside the exact kind DTO'
);
select extensions.throws_ok(
  $$select private.assert_safe_outbox_payload_v2(
    'account_security'::public.notification_kind,
    '{"kind":"account_security","a":{"b":{"c":{"d":{"e":true}}}}}'::jsonb
  )$$,
  '22023', 'outbox payload complexity exceeded',
  'outbox validation rejects payload trees deeper than four edges'
);
select extensions.throws_ok(
  $$select private.assert_safe_outbox_payload_v2(
    'account_security'::public.notification_kind,
    jsonb_build_object(
      'kind', 'account_security', 'padding', repeat('x', 12289)
    )
  )$$,
  '22023', 'invalid outbox payload envelope',
  'outbox validation enforces the serialized twelve-KiB cap before dispatch'
);

-- The retention worker and browser mutations run in separate production
-- transactions. This file deliberately uses one outer transaction, so restore
-- the audit trigger guard before exercising the teacher request boundary.
reset role;
select set_config('help_math.family_retention', 'off', true);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"teacher-a"}',
  true
);
select extensions.ok(
  jsonb_array_length(public.teacher_family_inbox_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  ) -> 'threads') > 0,
  'assigned teacher receives current participant threads'
);
select extensions.ok(
  (public.teacher_family_inbox_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  ) -> 'threads' -> 0) ? 'topic'
    and not ((public.teacher_family_inbox_for_tenant_v1(
      '10000000-0000-4000-8000-000000000001'
    ) -> 'threads' -> 0) ? 'subject'),
  'teacher inbox emits the strict topic enum consumed by the localized UI adapter'
);
select extensions.is(
  public.teacher_announcement_schools_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  ) -> 'tenant' ->> 'id',
  '10000000-0000-4000-8000-000000000001',
  'teacher announcement allowlist derives the one current tenant'
);
select extensions.is(
  jsonb_array_length(public.teacher_announcement_schools_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  ) -> 'schools'),
  1,
  'teacher announcement allowlist contains only a current staffed school'
);
select extensions.ok(
  public.teacher_announcement_schools_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  ) ?& array['tenant', 'schools']
    and (public.teacher_announcement_schools_for_tenant_v1(
      '10000000-0000-4000-8000-000000000001'
    ) -> 'schools' -> 0)
      ?& array['id', 'displayName']
    and (
      select count(*)
      from jsonb_object_keys(
        public.teacher_announcement_schools_for_tenant_v1(
          '10000000-0000-4000-8000-000000000001'
        ) -> 'schools' -> 0
      )
    ) = 2,
  'teacher announcement allowlist exposes only opaque id and display label'
);
select extensions.is(
  public.authorize_school_announcement_publish_v1(
    '10000000-0000-4000-8000-000000000101'
  ) ->> 'tenantId',
  '10000000-0000-4000-8000-000000000001',
  'teacher publish preflight derives the school tenant'
);
select extensions.throws_ok(
  $$select public.authorize_school_announcement_publish_v1(
    '20000000-0000-4000-8000-000000000101'
  )$$,
  'P0002', 'school announcement target not found',
  'teacher publish preflight does not enumerate another tenant school'
);
select extensions.throws_ok(
  $$select * from public.publish_school_announcement_v1(
    '10000000-0000-4000-8000-000000000101',
    'Synthetic schedule reminder',
    E'Unsafe control\ncharacter',
    'test.teacher.announcement.invalid.001', null
  )$$,
  '22023', 'invalid announcement',
  'teacher announcement publish rejects control characters'
);
select extensions.lives_ok(
  $$select * from public.publish_school_announcement_v1(
    '10000000-0000-4000-8000-000000000101',
    'Synthetic schedule reminder',
    'This fictional reminder exists only for the local database test.',
    'test.teacher.announcement.001', null
  )$$,
  'teacher can publish a plain-text announcement to a current staffed school'
);
select extensions.lives_ok(
  $$select * from public.publish_school_announcement_v1(
    '10000000-0000-4000-8000-000000000101',
    'Synthetic schedule reminder',
    'This fictional reminder exists only for the local database test.',
    'test.teacher.announcement.001', null
  )$$,
  'teacher announcement publish replay is idempotent'
);
reset role;
select extensions.is(
  (
    select count(*) from public.school_announcements
    where idempotency_key = 'test.teacher.announcement.001'
  ), 1::bigint,
  'teacher announcement idempotency key persists exactly one row'
);
select extensions.is(
  (
    select count(*) from public.audit_events
    where entity_type = 'school_announcements'
      and actor_user_id = '10000000-0000-4000-8000-000000000012'
      and exists (
        select 1
        from public.school_announcements as announcement
        where announcement.tenant_id = audit_events.tenant_id
          and announcement.id = audit_events.entity_id
          and announcement.idempotency_key = 'test.teacher.announcement.001'
      )
  ), 1::bigint,
  'teacher announcement publish writes one privacy-safe immutable audit event'
);
select set_config('help_math.family_retention', 'on', true);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.throws_ok(
  $$select public.teacher_announcement_schools_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  )$$,
  '42501', 'teacher announcement access required',
  'guardian cannot read the teacher announcement school allowlist'
);
select extensions.throws_ok(
  $$select public.teacher_family_inbox_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  )$$,
  '42501', 'teacher family access required',
  'non-teacher cannot read the teacher inbox'
);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.is(
  public.authorize_school_announcement_publish_v1(
    '10000000-0000-4000-8000-000000000101'
  ) ->> 'schoolId',
  '10000000-0000-4000-8000-000000000101',
  'scoped school administrator passes the resource publish preflight'
);
reset role;
select extensions.lives_ok(
  $$update public.class_staff_bindings
    set active = false, ends_at = statement_timestamp()
    where id = '10000000-0000-4000-8000-000000000451'$$,
  'teacher class staff binding may transition to its terminal inactive state'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"teacher-a"}',
  true
);
select extensions.throws_ok(
  $$select public.teacher_announcement_schools_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  )$$,
  '42501', 'teacher announcement access required',
  'teacher announcement allowlist fails closed after staff binding removal'
);
select extensions.throws_ok(
  $$select public.authorize_school_announcement_publish_v1(
    '10000000-0000-4000-8000-000000000101'
  )$$,
  'P0002', 'school announcement target not found',
  'teacher publish preflight fails closed after staff binding removal'
);
select extensions.throws_ok(
  $$select * from public.publish_school_announcement_v1(
    '10000000-0000-4000-8000-000000000101',
    'Lifecycle bypass attempt',
    'This direct RPC call must fail after the current staff binding ends.',
    'test.teacher.announcement.denied.001', null
  )$$,
  'P0002', 'school announcement target not found',
  'direct teacher publish RPC fails closed after staff binding removal'
);
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-b"}',
  true
);
select extensions.lives_ok(
  $$select public.relinquish_guardian_child_access_v1(
    '10000000-0000-4000-8000-000000000021', 'test.guardian.child.relinquish.001'
  )$$,
  'guardian can relinquish a current child link without receiving its link id'
);
reset role;
select extensions.is(
  (
    select status::text from public.guardian_links
    where id = '10000000-0000-4000-8000-000000000802'
  ), 'revoked',
  'child-access relinquishment terminalizes the authoritative link'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-b"}',
  true
);
select extensions.lives_ok(
  $$select public.relinquish_guardian_child_access_v1(
    '10000000-0000-4000-8000-000000000021', 'test.guardian.child.relinquish.001'
  )$$,
  'child-access relinquishment is idempotent for the same mutation key'
);
select extensions.throws_ok(
  $$select public.relinquish_guardian_child_access_v1(
    'ffffffff-ffff-4fff-8fff-ffffffffffff', 'test.guardian.child.unknown.001'
  )$$,
  'P0002', 'guardian access not found',
  'unknown and unauthorized child ids share a non-enumerating failure'
);
reset role;
select set_config(
  'test.accepted_invitation_id',
  (
    select id::text from public.guardian_invitations
    where create_idempotency_key = 'test.invite.bootstrap.001'
  ),
  true
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"new-guardian"}',
  true
);
select extensions.lives_ok(
  $$select public.relinquish_guardian_child_access_v1(
    '10000000-0000-4000-8000-000000000020', 'test.guardian.accepted.relinquish.001'
  )$$,
  'an accepted guardian can relinquish access through the child-only DTO'
);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.ok(
  jsonb_array_length(
    public.admin_family_access_workspace_for_tenant_v1(
      '10000000-0000-4000-8000-000000000001'
    ) -> 'children'
  ) > 0,
  'scoped school administrator receives current child management rows'
);
select extensions.ok(
  public.admin_family_access_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  )::text !~
    '(recipient_email|ciphertext|digest|token|"body")',
  'admin access DTO excludes message bodies and invitation/contact secrets'
);
select extensions.is(
  (
    select invitation ->> 'status'
    from jsonb_array_elements(
      public.admin_family_access_workspace_for_tenant_v1(
        '10000000-0000-4000-8000-000000000001'
      ) -> 'invitations'
    ) as invitation
    where invitation ->> 'id' = current_setting('test.accepted_invitation_id')
  ), 'revoked',
  'admin reload derives revoked status when an accepted relationship is no longer active'
);
select extensions.is(
  (
    select invitation -> 'guardianLinkId'
    from jsonb_array_elements(
      public.admin_family_access_workspace_for_tenant_v1(
        '10000000-0000-4000-8000-000000000001'
      ) -> 'invitations'
    ) as invitation
    where invitation ->> 'id' = current_setting('test.accepted_invitation_id')
  ), 'null'::jsonb,
  'admin reload does not expose a terminal guardian link id'
);
select extensions.throws_ok(
  $$select public.begin_family_tenant_teardown_v1(
    '10000000-0000-4000-8000-000000000001', 'test.tenant.teardown.denied'
  )$$,
  '42501', 'permission denied for function begin_family_tenant_teardown_v1',
  'authenticated administrators cannot invoke service-only tenant teardown'
);
reset role;

select extensions.lives_ok(
  $$update public.role_bindings
    set active = false, ends_at = clock_timestamp()
    where id = '10000000-0000-4000-8000-000000000207'$$,
  'a role binding may transition to its terminal inactive state'
);
select extensions.throws_ok(
  $$update public.role_bindings
    set active = true, ends_at = null
    where id = '10000000-0000-4000-8000-000000000207'$$,
  '23514', 'inactive role binding is terminal',
  'an inactive role binding cannot be resurrected'
);
select extensions.throws_ok(
  $$update public.guardian_links
    set lifecycle_expires_at = lifecycle_expires_at + interval '1 second'
    where id = '10000000-0000-4000-8000-000000000801'$$,
  '23514', 'family lifecycle retention clock cannot be extended',
  'relationship retention expiry cannot be extended by an update'
);
select extensions.ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'app_users'
      and column_name = 'lifecycle_expires_at' and is_nullable = 'NO'
  ),
  'app user encrypted-contact lifecycle has a mandatory expiry'
);

-- 008: a browser admin can mint only a short-lived, resource-bound
-- authorization. A separately verified custom PostgREST role is the sole
-- caller that can consume it and write invitation/outbox rows.
select extensions.has_table(
  'public', 'family_invitation_issuer_configs',
  'tenant-scoped invitation issuer configuration exists'
);
select extensions.has_table(
  'public', 'family_invitation_issuance_attestations',
  'one-use invitation issuance attestations exist'
);
select extensions.has_function(
  'public', 'authorize_guardian_invitation_creation_v1',
  array['uuid', 'text', 'text'], 'invitation creation preflight exists'
);
select extensions.has_function(
  'public', 'authorize_guardian_invitation_resend_v1',
  array['uuid', 'text'], 'invitation resend preflight exists'
);
select extensions.has_function(
  'public', 'create_guardian_invitation_v1',
  array[
    'uuid', 'uuid', 'uuid', 'text', 'text', 'text', 'text',
    'timestamp with time zone', 'text'
  ],
  'issuer-only invitation creation overload exists'
);
select extensions.has_function(
  'public', 'resend_guardian_invitation_v1',
  array[
    'uuid', 'uuid', 'text', 'text', 'timestamp with time zone', 'text'
  ],
  'issuer-only invitation resend overload exists'
);
select extensions.is(
  pg_has_role('authenticator', 'family_invitation_issuer', 'member'), true,
  'PostgREST authenticator can SET ROLE to the invitation issuer'
);
select extensions.is(
  (
    select not (
      rolcanlogin or rolinherit or rolsuper or rolbypassrls
      or rolcreatedb or rolcreaterole or rolreplication
    )
    from pg_catalog.pg_roles
    where rolname = 'family_invitation_issuer'
  ), true,
  'invitation issuer has no login or elevated role attributes'
);
select extensions.is(
  not exists (
    select 1
    from pg_catalog.pg_auth_members as membership
    join pg_catalog.pg_roles as member_role
      on member_role.oid = membership.member
    where member_role.rolname = 'family_invitation_issuer'
  ) and (
    select count(*) = 1
    from pg_catalog.pg_auth_members as membership
    join pg_catalog.pg_roles as granted_role
      on granted_role.oid = membership.roleid
    join pg_catalog.pg_roles as member_role
      on member_role.oid = membership.member
    where granted_role.rolname = 'family_invitation_issuer'
      and member_role.rolname = 'authenticator'
      and not membership.admin_option
  ), true,
  'invitation issuer has only non-admin authenticator membership'
);
select extensions.is(
  has_table_privilege(
    'family_invitation_issuer',
    'public.family_invitation_issuance_attestations', 'select'
  ), false,
  'invitation issuer cannot read attestation rows directly'
);
select extensions.is(
  has_table_privilege(
    'family_invitation_issuer', 'public.guardian_invitations', 'insert'
  ), false,
  'invitation issuer cannot insert invitation rows directly'
);
select extensions.is(
  has_function_privilege(
    'family_invitation_issuer',
    'public.create_guardian_invitation_v1(uuid,uuid,uuid,text,text,text,text,timestamp with time zone,text)',
    'execute'
  ), true,
  'invitation issuer can execute only the attested creation overload'
);
select extensions.is(
  has_function_privilege(
    'family_invitation_issuer',
    'public.resend_guardian_invitation_v1(uuid,uuid,text,text,timestamp with time zone,text)',
    'execute'
  ), true,
  'invitation issuer can execute the attested resend overload'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.create_guardian_invitation_v1(uuid,uuid,uuid,text,text,text,text,timestamp with time zone,text)',
    'execute'
  ), false,
  'ordinary authenticated callers cannot consume creation attestations'
);
select extensions.is(
  has_function_privilege(
    'service_role',
    'public.create_guardian_invitation_v1(uuid,uuid,uuid,text,text,text,text,timestamp with time zone,text)',
    'execute'
  ), false,
  'service role cannot consume creation attestations'
);
select extensions.is(
  has_function_privilege(
    'anon',
    'public.create_guardian_invitation_v1(uuid,uuid,uuid,text,text,text,text,timestamp with time zone,text)',
    'execute'
  ), false,
  'anonymous callers cannot consume creation attestations'
);
select extensions.is(
  has_function_privilege(
    'family_invitation_issuer',
    'public.create_guardian_invitation_v1(uuid,text,text,text,text,timestamp with time zone,text)',
    'execute'
  ), false,
  'invitation issuer cannot execute the owner-fixture creation overload'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.authorize_guardian_invitation_creation_v1(uuid,text,text)',
    'execute'
  ), true,
  'authenticated administrators can execute only the creation preflight'
);
select extensions.is(
  has_function_privilege(
    'family_invitation_issuer',
    'public.authorize_guardian_invitation_creation_v1(uuid,text,text)',
    'execute'
  ), false,
  'invitation issuer cannot mint its own attestations'
);
select extensions.is(
  has_function_privilege(
    'service_role',
    'public.cleanup_family_invitation_issuance_attestations_v1(integer)',
    'execute'
  ), true,
  'service worker can clean expired issuance attestations'
);
select extensions.is(
  has_function_privilege(
    'family_invitation_issuer',
    'public.cleanup_family_invitation_issuance_attestations_v1(integer)',
    'execute'
  ), false,
  'invitation issuer cannot clean or enumerate attestations'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.accept_guardian_invitation_core_v1(text,text,text)', 'execute'
  ), false,
  'authenticated callers cannot bypass the cutover-safe accept wrapper'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select set_config(
  'test.issuer.create.authorization',
  public.authorize_guardian_invitation_creation_v1(
    '10000000-0000-4000-8000-000000000021', repeat('2', 64),
    'test.issuer.create.001'
  )::text,
  true
);
reset role;
select extensions.ok(
  (current_setting('test.issuer.create.authorization')::jsonb
    ->> 'tenantId')::uuid = '10000000-0000-4000-8000-000000000001'
  and (current_setting('test.issuer.create.authorization')::jsonb
    ->> 'expiresAt')::timestamptz > statement_timestamp()
  and (current_setting('test.issuer.create.authorization')::jsonb
    ->> 'expiresAt')::timestamptz
      <= statement_timestamp() + interval '2 minutes',
  'admin preflight returns a bounded tenant-derived authorization'
);

set local role family_invitation_issuer;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'family_invitation_issuer',
    'sub', 'family_invitation_issuer',
    'family_purpose', 'wrong-purpose',
    'iss', 'urn:help-math:synthetic:invitation-issuer',
    'aud', 'authenticated',
    'jti', '10000000-0000-4000-8000-000000000091',
    'iat', floor(extract(epoch from statement_timestamp()))::bigint,
    'nbf', floor(extract(epoch from statement_timestamp()))::bigint - 1,
    'exp', floor(extract(epoch from statement_timestamp()))::bigint + 120
  )::text,
  true
);
select extensions.throws_ok(
  $$select public.create_guardian_invitation_v1(
    (current_setting('test.issuer.create.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    '10000000-0000-4000-8000-000000000021', repeat('2', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.emailCipher.AAAAAAAAAAAAAAAAAAAAAA',
    repeat('2', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.tokenCipher.AAAAAAAAAAAAAAAAAAAAAA',
    statement_timestamp() + interval '7 days', 'test.issuer.create.001'
  )$$,
  '42501', 'dedicated family invitation issuer required',
  'wrong-purpose custom-role JWT cannot consume an attestation'
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'family_invitation_issuer',
    'sub', 'family_invitation_issuer',
    'family_purpose', 'family_invitation_issue_v1',
    'iss', 'urn:help-math:synthetic:invitation-issuer',
    'aud', 'authenticated',
    'jti', '10000000-0000-4000-8000-000000000092',
    'iat', floor(extract(epoch from statement_timestamp()))::bigint,
    'nbf', floor(extract(epoch from statement_timestamp()))::bigint - 1,
    'exp', floor(extract(epoch from statement_timestamp()))::bigint + 120
  )::text,
  true
);
select extensions.lives_ok(
  $$select public.create_guardian_invitation_v1(
    (current_setting('test.issuer.create.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    '10000000-0000-4000-8000-000000000021', repeat('2', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.emailCipher.AAAAAAAAAAAAAAAAAAAAAA',
    repeat('2', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.tokenCipher.AAAAAAAAAAAAAAAAAAAAAA',
    statement_timestamp() + interval '7 days', 'test.issuer.create.001'
  )$$,
  'dedicated issuer consumes a current admin attestation atomically'
);
reset role;
select extensions.is(
  (
    select count(*)
    from public.guardian_invitations as invitation
    join public.notification_outbox as outbox
      on outbox.tenant_id = invitation.tenant_id
      and outbox.aggregate_id = invitation.id
    where invitation.id = (
      current_setting('test.issuer.create.authorization')::jsonb
        ->> 'invitationId'
    )::uuid
      and invitation.status = 'pending'
      and invitation.recipient_policy = 'synthetic-invalid-only'
      and outbox.kind = 'guardian_invitation'
      and outbox.status = 'pending'
      and outbox.payload ->> 'invitationId' = invitation.id::text
  ), 1::bigint,
  'attested create writes one pending invitation and exact outbox DTO'
);
select extensions.is(
  (
    select consumed_at is not null
      and issuer_jti = '10000000-0000-4000-8000-000000000092'
    from public.family_invitation_issuance_attestations
    where id = (
      current_setting('test.issuer.create.authorization')::jsonb
        ->> 'attestationId'
    )::uuid
  ), true,
  'successful issuance consumes the capability and records the issuer JTI'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select set_config(
  'test.issuer.resend.authorization',
  public.authorize_guardian_invitation_resend_v1(
    (current_setting('test.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    'test.issuer.resend.001'
  )::text,
  true
);
reset role;
select extensions.ok(
  (current_setting('test.issuer.resend.authorization')::jsonb
    ->> 'invitationId') =
      (current_setting('test.issuer.create.authorization')::jsonb
        ->> 'invitationId'),
  'resend preflight remains bound to the locked pending invitation'
);
set local role family_invitation_issuer;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'family_invitation_issuer',
    'sub', 'family_invitation_issuer',
    'family_purpose', 'family_invitation_issue_v1',
    'iss', 'urn:help-math:synthetic:invitation-issuer',
    'aud', 'authenticated',
    'jti', '10000000-0000-4000-8000-000000000093',
    'iat', floor(extract(epoch from statement_timestamp()))::bigint,
    'nbf', floor(extract(epoch from statement_timestamp()))::bigint - 1,
    'exp', floor(extract(epoch from statement_timestamp()))::bigint + 120
  )::text,
  true
);
select extensions.lives_ok(
  $$select public.resend_guardian_invitation_v1(
    (current_setting('test.issuer.resend.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.issuer.resend.authorization')::jsonb
      ->> 'invitationId')::uuid,
    repeat('3', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.newTokenCipher.AAAAAAAAAAAAAAAAAAAAAA',
    statement_timestamp() + interval '7 days', 'test.issuer.resend.001'
  )$$,
  'dedicated issuer consumes a resend attestation atomically'
);
reset role;
select extensions.is(
  (
    select invitation.send_count::text || ':' || invitation.token_digest
      || ':' || count(*) filter (where outbox.status = 'pending')::text
      || ':' || count(*) filter (where outbox.status = 'cancelled')::text
    from public.guardian_invitations as invitation
    join public.notification_outbox as outbox
      on outbox.tenant_id = invitation.tenant_id
      and outbox.aggregate_id = invitation.id
    where invitation.id = (
      current_setting('test.issuer.create.authorization')::jsonb
        ->> 'invitationId'
    )::uuid
    group by invitation.id, invitation.send_count, invitation.token_digest
  ), '2:' || repeat('3', 64) || ':1:1',
  'resend rotates the token and leaves one pending delivery'
);

-- Supabase cutover reuses a unique active email-HMAC account rather than
-- silently creating a second business identity. Ambiguous HMAC matches fail
-- before a provider identity, role, or guardian link can be committed.
insert into public.tenant_identity_issuers (
  tenant_id, environment_id, data_mode, issuer, active
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  'urn:help-math:synthetic:supabase', true
);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select public.create_guardian_invitation_v1(
  '10000000-0000-4000-8000-000000000020', repeat('c', 64),
  'v2.test_key.AAAAAAAAAAAAAAAA.caseyEmail.AAAAAAAAAAAAAAAAAAAAAA',
  repeat('0', 64), 'v1.synthetic.casey.cutover.token',
  statement_timestamp() + interval '7 days', 'test.cutover.unique.001'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic:supabase","sub":"casey-cutover"}',
  true
);
select extensions.lives_ok(
  $$select * from public.accept_guardian_invitation_v1(
    repeat('0', 64), repeat('c', 64), 'test.cutover.unique.accept.001'
  )$$,
  'accept links a new provider subject to the unique email-HMAC account'
);
reset role;
select extensions.is(
  (
    select app_user_id
    from public.provider_identities
    where issuer = 'urn:help-math:synthetic:supabase'
      and subject = 'casey-cutover'
  ), '10000000-0000-4000-8000-000000000012'::uuid,
  'provider cutover deterministically reuses the existing app user'
);
select extensions.is(
  (
    select count(*) from public.app_users
    where status = 'active' and notification_email_digest = repeat('c', 64)
  ), 1::bigint,
  'provider cutover does not duplicate the active email identity'
);
select extensions.is(
  (
    select count(*)
    from public.guardian_links
    where guardian_user_id = '10000000-0000-4000-8000-000000000012'
      and student_id = '10000000-0000-4000-8000-000000000020'
      and status = 'active'
  ), 1::bigint,
  'provider cutover attaches guardian access to the reused app user'
);

insert into public.app_users (
  id, display_name, locale, notification_email_digest,
  notification_email_ciphertext, status
) values (
  '10000000-0000-4000-8000-0000000000a3', 'Revoked Identity Candidate',
  'en', repeat('4', 64), 'v1.synthetic.revoked.identity.email', 'active'
);
insert into public.provider_identities (
  issuer, subject, app_user_id, active, revoked_at
) values (
  'urn:help-math:legacy', 'revoked-old-provider',
  '10000000-0000-4000-8000-0000000000a3', false, clock_timestamp()
);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select public.create_guardian_invitation_v1(
  '10000000-0000-4000-8000-000000000021', repeat('4', 64),
  'v1.synthetic.revoked.identity.invitation.email', repeat('4', 64),
  'v1.synthetic.revoked.identity.invitation.token',
  statement_timestamp() + interval '7 days', 'test.cutover.revoked.001'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic:supabase","sub":"revoked-identity-cutover"}',
  true
);
select extensions.throws_ok(
  $$select * from public.accept_guardian_invitation_v1(
    repeat('4', 64), repeat('4', 64), 'test.cutover.revoked.accept.001'
  )$$,
  '42501', 'provider identity conflict',
  'ordinary invitation acceptance cannot bypass a revoked provider identity'
);
reset role;
select extensions.is(
  (
    select count(*)
    from public.provider_identities
    where issuer = 'urn:help-math:synthetic:supabase'
      and subject = 'revoked-identity-cutover'
  ), 0::bigint,
  'revoked-identity cutover creates no replacement provider mapping'
);
select extensions.is(
  (
    select status::text
    from public.guardian_invitations
    where create_idempotency_key = 'test.cutover.revoked.001'
  ), 'pending',
  'revoked-identity cutover leaves the invitation pending'
);

insert into public.app_users (
  id, display_name, locale, notification_email_digest,
  notification_email_ciphertext, status
) values
  ('10000000-0000-4000-8000-0000000000a1', 'Duplicate One', 'en',
    repeat('1', 64), 'v1.synthetic.duplicate.one.email', 'active'),
  ('10000000-0000-4000-8000-0000000000a2', 'Duplicate Two', 'en',
    repeat('1', 64), 'v1.synthetic.duplicate.two.email', 'active');
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select public.create_guardian_invitation_v1(
  '10000000-0000-4000-8000-000000000021', repeat('1', 64),
  'v1.synthetic.duplicate.invitation.email', repeat('1', 64),
  'v1.synthetic.duplicate.invitation.token',
  statement_timestamp() + interval '7 days', 'test.cutover.duplicate.001'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic:supabase","sub":"ambiguous-cutover"}',
  true
);
select extensions.throws_ok(
  $$select * from public.accept_guardian_invitation_v1(
    repeat('1', 64), repeat('1', 64), 'test.cutover.duplicate.accept.001'
  )$$,
  '42501', 'provider identity conflict',
  'ambiguous active email-HMAC integrity failure rethrows and fails closed'
);
reset role;
select extensions.is(
  (
    select count(*)
    from public.provider_identities
    where issuer = 'urn:help-math:synthetic:supabase'
      and subject = 'ambiguous-cutover'
  ), 0::bigint,
  'failed ambiguous cutover leaves no provider identity mapping'
);

-- Migration 015: a production tenant may issue only through a current school
-- administrator, complete approved retention, and the dedicated issuer role.
select extensions.has_column(
  'public', 'tenant_identity_issuers', 'requires_database_session',
  'production identity issuers declare the database session requirement'
);
select extensions.has_column(
  'public', 'family_invitation_issuance_attestations', 'actor_session_id',
  'production invitation attestations bind the administrator session'
);
create table if not exists auth.sessions (
  id uuid primary key,
  user_id uuid not null,
  not_after timestamptz
);
insert into public.tenants (
  id, slug, display_name, environment_id, data_mode,
  family_portal_enabled, status
) values (
  '30000000-0000-4000-8000-000000000001', 'production-shape-test',
  'Production Shape Test', 'test.production', 'production', true, 'active'
);
insert into public.tenant_identity_issuers (
  tenant_id, environment_id, data_mode, issuer, active,
  requires_database_session
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  'https://test-project.supabase.co/auth/v1', true, true
);
insert into public.provider_identities (
  issuer, subject, app_user_id, active
) values (
  'https://test-project.supabase.co/auth/v1',
  '30000000-0000-4000-8000-000000000013',
  '10000000-0000-4000-8000-000000000013', true
);
insert into auth.sessions (id, user_id, not_after) values (
  '30000000-0000-4000-8000-000000000099',
  '30000000-0000-4000-8000-000000000013',
  statement_timestamp() + interval '1 day'
);
insert into public.family_invitation_issuer_configs (
  tenant_id, environment_id, data_mode, issuer, audience, active,
  not_before, expires_at
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  'urn:help-math:synthetic:invitation-issuer', 'authenticated', true,
  statement_timestamp() - interval '1 day',
  statement_timestamp() + interval '1 day'
);
insert into public.schools (
  tenant_id, environment_id, data_mode, id, school_key, display_name, active
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '30000000-0000-4000-8000-000000000101', 'production-school',
  'Production School', true
);
insert into public.students (
  tenant_id, environment_id, data_mode, id, school_id, local_reference,
  display_name, grade_label, locale, active
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '30000000-0000-4000-8000-000000000020',
  '30000000-0000-4000-8000-000000000101', 'PROD-STUDENT',
  'Production Student', 'Grade 4', 'en', true
);
insert into public.classes (
  tenant_id, environment_id, data_mode, id, school_id, display_name,
  grade_label, academic_term, active
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '30000000-0000-4000-8000-000000000301',
  '30000000-0000-4000-8000-000000000101', 'Production Grade 4',
  'Grade 4', 'Production Term', true
);
insert into public.enrollments (
  tenant_id, environment_id, data_mode, id, student_id, class_id, status,
  starts_at
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '30000000-0000-4000-8000-000000000401',
  '30000000-0000-4000-8000-000000000020',
  '30000000-0000-4000-8000-000000000301', 'active', current_date
);
insert into public.retention_policies (
  tenant_id, environment_id, data_mode, data_class, retention_days,
  legal_hold, enabled, approved_at, approved_by_user_id, updated_by_user_id
)
select
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  data_class, 30, false, true, statement_timestamp(),
  '10000000-0000-4000-8000-000000000013',
  '10000000-0000-4000-8000-000000000013'
from unnest(enum_range(null::public.retention_data_class)) as data_class;
insert into public.role_bindings (
  id, tenant_id, environment_id, data_mode, app_user_id, role,
  school_id, active
) values (
  '30000000-0000-4000-8000-000000000204',
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '10000000-0000-4000-8000-000000000013', 'school_admin',
  '30000000-0000-4000-8000-000000000101', true
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"https://test-project.supabase.co/auth/v1","sub":"30000000-0000-4000-8000-000000000013","session_id":"30000000-0000-4000-8000-000000000099"}',
  true
);
select set_config(
  'test.production.invite.authorization',
  public.authorize_guardian_invitation_creation_v1(
    '30000000-0000-4000-8000-000000000020', repeat('5', 64),
    'test.production.invite.create.001'
  )::text,
  true
);
select extensions.is(
  current_setting('test.production.invite.authorization')::jsonb
    ->> 'tenantId',
  '30000000-0000-4000-8000-000000000001',
  'current production admin mints one tenant-bound issuance attestation'
);
reset role;

insert into public.family_invitation_issuance_attestations (
  tenant_id, environment_id, data_mode, id, operation, actor_user_id,
  actor_issuer, actor_subject, student_id, invitation_id,
  recipient_email_digest, idempotency_key, expires_at
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '30000000-0000-4000-8000-000000000799', 'create',
  '10000000-0000-4000-8000-000000000013',
  'https://test-project.supabase.co/auth/v1',
  '30000000-0000-4000-8000-000000000013',
  '30000000-0000-4000-8000-000000000020',
  '30000000-0000-4000-8000-000000000701', repeat('5', 64),
  'test.production.issuer.denied.001',
  statement_timestamp() + interval '90 seconds'
);
set local role family_invitation_issuer;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'family_invitation_issuer',
    'sub', 'family_invitation_issuer',
    'family_purpose', 'family_invitation_issue_v1',
    'iss', 'urn:help-math:synthetic:invitation-issuer',
    'aud', 'authenticated',
    'jti', '30000000-0000-4000-8000-000000000099',
    'iat', floor(extract(epoch from statement_timestamp()))::bigint,
    'nbf', floor(extract(epoch from statement_timestamp()))::bigint - 1,
    'exp', floor(extract(epoch from statement_timestamp()))::bigint + 120
  )::text,
  true
);
reset role;
delete from auth.sessions
where id = '30000000-0000-4000-8000-000000000099';
set local role family_invitation_issuer;
select extensions.throws_ok(
  $$select public.create_guardian_invitation_v1(
    '30000000-0000-4000-8000-000000000799',
    '30000000-0000-4000-8000-000000000701',
    '30000000-0000-4000-8000-000000000020', repeat('5', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.prodEmail.AAAAAAAAAAAAAAAAAAAAAA',
    repeat('5', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.prodToken.AAAAAAAAAAAAAAAAAAAAAA',
    statement_timestamp() + interval '7 days',
    'test.production.issuer.denied.001'
  )$$,
  '42501', 'current production provider session required',
  'revoked production administrator session invalidates an unconsumed attestation'
);
reset role;
insert into auth.sessions (id, user_id, not_after) values (
  '30000000-0000-4000-8000-000000000099',
  '30000000-0000-4000-8000-000000000013',
  statement_timestamp() + interval '1 day'
);
set local role family_invitation_issuer;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'family_invitation_issuer',
    'sub', 'family_invitation_issuer',
    'family_purpose', 'family_invitation_issue_v1',
    'iss', 'urn:help-math:synthetic:invitation-issuer',
    'aud', 'authenticated',
    'jti', '30000000-0000-4000-8000-000000000097',
    'iat', floor(extract(epoch from statement_timestamp()))::bigint,
    'nbf', floor(extract(epoch from statement_timestamp()))::bigint - 1,
    'exp', floor(extract(epoch from statement_timestamp()))::bigint + 120
  )::text,
  true
);
select extensions.lives_ok(
  $$select public.create_guardian_invitation_v1(
    '30000000-0000-4000-8000-000000000799',
    '30000000-0000-4000-8000-000000000701',
    '30000000-0000-4000-8000-000000000020', repeat('5', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.prodEmail.AAAAAAAAAAAAAAAAAAAAAA',
    repeat('5', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.prodToken.AAAAAAAAAAAAAAAAAAAAAA',
    statement_timestamp() + interval '7 days',
    'test.production.issuer.denied.001'
  )$$,
  'dedicated issuer consumes a retention-approved production attestation'
);
reset role;
select extensions.is(
  (select recipient_policy from public.guardian_invitations
    where id = '30000000-0000-4000-8000-000000000701'),
  'school-verified-production',
  'production issuance persists the explicit school-verified policy'
);
select extensions.alike(
  pg_get_functiondef(
    'public.resend_guardian_invitation_unchecked_replay_core_v1(uuid,uuid,text,text,timestamp with time zone,text)'::regprocedure
  ),
  '%school-verified-production%',
  'resend derives the production recipient policy from attested data mode'
);

update public.retention_policies
set enabled = false
where tenant_id = '30000000-0000-4000-8000-000000000001'
  and data_class = 'guardian_link';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"https://test-project.supabase.co/auth/v1","sub":"30000000-0000-4000-8000-000000000013","session_id":"30000000-0000-4000-8000-000000000099"}',
  true
);
select extensions.throws_ok(
  $$select public.authorize_guardian_invitation_creation_v1(
    '30000000-0000-4000-8000-000000000020', repeat('6', 64),
    'test.production.retention.denied.001'
  )$$,
  'P0002', 'student not found',
  'production preflight fails closed when one required retention policy is disabled'
);
reset role;
update public.retention_policies
set enabled = true
where tenant_id = '30000000-0000-4000-8000-000000000001'
  and data_class = 'guardian_link';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"https://test-project.supabase.co/auth/v1","sub":"30000000-0000-4000-8000-000000000013","session_id":"30000000-0000-4000-8000-000000000099"}',
  true
);
select set_config(
  'test.production.resend.authorization',
  public.authorize_guardian_invitation_resend_v1(
    '30000000-0000-4000-8000-000000000701',
    'test.production.invite.resend.001'
  )::text,
  true
);
select extensions.is(
  current_setting('test.production.resend.authorization')::jsonb
    ->> 'invitationId',
  '30000000-0000-4000-8000-000000000701',
  'production resend preflight remains bound to the existing invitation'
);
reset role;
set local role family_invitation_issuer;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'family_invitation_issuer',
    'sub', 'family_invitation_issuer',
    'family_purpose', 'family_invitation_issue_v1',
    'iss', 'urn:help-math:synthetic:invitation-issuer',
    'aud', 'authenticated',
    'jti', '30000000-0000-4000-8000-000000000098',
    'iat', floor(extract(epoch from statement_timestamp()))::bigint,
    'nbf', floor(extract(epoch from statement_timestamp()))::bigint - 1,
    'exp', floor(extract(epoch from statement_timestamp()))::bigint + 120
  )::text,
  true
);
select extensions.lives_ok(
  $$select public.resend_guardian_invitation_v1(
    (current_setting('test.production.resend.authorization')::jsonb
      ->> 'attestationId')::uuid,
    '30000000-0000-4000-8000-000000000701', repeat('6', 64),
    'v2.test_key.AAAAAAAAAAAAAAAA.prodToken2.AAAAAAAAAAAAAAAAAAAAAA',
    statement_timestamp() + interval '6 days',
    'test.production.invite.resend.001'
  )$$,
  'dedicated issuer rotates a production invitation token without changing policy'
);
reset role;
select extensions.ok(
  (select send_count = 2
      and recipient_policy = 'school-verified-production'
      and token_digest = repeat('6', 64)
    from public.guardian_invitations
    where id = '30000000-0000-4000-8000-000000000701'),
  'production resend persists one new delivery while preserving recipient policy'
);

delete from auth.sessions
where id = '30000000-0000-4000-8000-000000000099';
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"https://test-project.supabase.co/auth/v1","sub":"30000000-0000-4000-8000-000000000013","session_id":"30000000-0000-4000-8000-000000000099"}',
  true
);
select extensions.throws_ok(
  $$update public.guardian_invitations
    set status = 'accepted',
        accepted_at = clock_timestamp(),
        accepted_by_user_id = '10000000-0000-4000-8000-000000000013',
        acceptance_idempotency_key = 'test.production.accept.revoked.001'
    where id = '30000000-0000-4000-8000-000000000701'$$,
  '42501', 'current production provider session required',
  'revoked production adult session cannot commit invitation acceptance'
);
insert into auth.sessions (id, user_id, not_after) values (
  '30000000-0000-4000-8000-000000000099',
  '30000000-0000-4000-8000-000000000013',
  statement_timestamp() + interval '1 day'
);

insert into auth.sessions (id, user_id, not_after) values (
  '30000000-0000-4000-8000-000000000098',
  '30000000-0000-4000-8000-000000000014',
  statement_timestamp() + interval '1 day'
);
insert into public.guardian_invitations (
  tenant_id, environment_id, data_mode, id, school_id, student_id,
  invited_by_user_id, recipient_email_digest, recipient_email_ciphertext,
  token_digest, create_idempotency_key, last_delivery_idempotency_key,
  recipient_policy, retention_anchor_at, expires_at
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '30000000-0000-4000-8000-000000000702',
  '30000000-0000-4000-8000-000000000101',
  '30000000-0000-4000-8000-000000000020',
  '10000000-0000-4000-8000-000000000013', repeat('8', 64),
  'v2.test_key.AAAAAAAAAAAAAAAA.prodDecline.AAAAAAAAAAAAAAAAAAAAAA',
  repeat('9', 64), 'test.production.decline.create.001',
  'test.production.decline.delivery.001', 'school-verified-production',
  statement_timestamp(), statement_timestamp() + interval '7 days'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"https://test-project.supabase.co/auth/v1","sub":"30000000-0000-4000-8000-000000000014","session_id":"30000000-0000-4000-8000-000000000098"}',
  true
);
select extensions.lives_ok(
  $$select public.decline_guardian_invitation_v1(
    repeat('9', 64), repeat('8', 64),
    'test.production.decline.accepted.001'
  )$$,
  'verified production adult can decline before an app identity mapping exists'
);
select extensions.lives_ok(
  $$select public.decline_guardian_invitation_v1(
    repeat('9', 64), repeat('8', 64),
    'test.production.decline.accepted.001'
  )$$,
  'unmapped production invitation decline has an exact idempotent replay'
);
reset role;
select extensions.ok(
  (select status = 'revoked'
      and revoked_by_user_id is null
    from public.guardian_invitations
    where id = '30000000-0000-4000-8000-000000000702'),
  'production decline persists a terminal state without inventing an app user'
);

-- Migration 011: database-enforced invitation and message abuse budgets.
-- Unknown random token probes intentionally cannot be tenant-associated and
-- therefore are outside the per-invitation counter. Edge/WAF and aggregate
-- authenticated-session limits remain a separate release gate.
select set_config('help_math.family_retention', 'off', true);
select extensions.has_table(
  'public', 'family_abuse_budget_windows',
  'abuse budget window table exists'
);
select extensions.has_column(
  'public', 'family_messages', 'request_mode',
  'messages persist immutable request mode'
);
select extensions.has_column(
  'public', 'guardian_invitations', 'failed_accept_attempts',
  'known invitations persist bounded failed acceptance attempts'
);
select extensions.is(
  (
    select relrowsecurity from pg_class
    where oid = 'public.family_abuse_budget_windows'::regclass
  ), true,
  'abuse budget table has RLS enabled'
);
select extensions.is(
  (
    select count(*) from pg_policies
    where schemaname = 'public'
      and tablename = 'family_abuse_budget_windows'
  ), 0::bigint,
  'abuse budget table has zero browser policies'
);
select extensions.is(
  has_table_privilege(
    'authenticated', 'public.family_abuse_budget_windows', 'select'
  ), false,
  'authenticated has no abuse budget table read privilege'
);
select extensions.is(
  has_table_privilege(
    'service_role', 'public.family_abuse_budget_windows', 'select'
  ) or has_table_privilege(
    'service_role', 'public.family_abuse_budget_windows', 'insert'
  ) or has_table_privilege(
    'service_role', 'public.family_abuse_budget_windows', 'update'
  ) or has_table_privilege(
    'service_role', 'public.family_abuse_budget_windows', 'delete'
  ), false,
  'service role has no direct abuse budget table privilege'
);
select extensions.is(
  has_table_privilege(
    'family_invitation_issuer', 'public.family_abuse_budget_windows', 'select'
  ) or has_table_privilege(
    'family_invitation_issuer', 'public.family_abuse_budget_windows', 'insert'
  ) or has_table_privilege(
    'family_invitation_issuer', 'public.family_abuse_budget_windows', 'update'
  ) or has_table_privilege(
    'family_invitation_issuer', 'public.family_abuse_budget_windows', 'delete'
  ) or has_table_privilege(
    'family_webhook_writer', 'public.family_abuse_budget_windows', 'select'
  ) or has_table_privilege(
    'family_webhook_writer', 'public.family_abuse_budget_windows', 'insert'
  ) or has_table_privilege(
    'family_webhook_writer', 'public.family_abuse_budget_windows', 'update'
  ) or has_table_privilege(
    'family_webhook_writer', 'public.family_abuse_budget_windows', 'delete'
  ), false,
  'dedicated infrastructure roles have no direct abuse budget privilege'
);
select extensions.is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'family_abuse_budget_windows'
      and column_name ~
        '(email|token|digest|ciphertext|body|message|provider|subject)'
  ), 0::bigint,
  'abuse budget table has no secret, identity-provider, or message field'
);
select extensions.is(
  enum_range(null::public.family_abuse_budget_operation)::text,
  '{invitation_create_hour,invitation_create_day,invitation_resend_hour,invitation_resend_day,family_message_ten_minute,family_message_day}',
  'abuse operations freeze the six approved fixed windows'
);
select extensions.is(
  array(
    select operation::text || ':'
      || private.family_abuse_budget_limit_v1(operation)::text
    from unnest(
      enum_range(null::public.family_abuse_budget_operation)
    ) as item(operation)
  ),
  array[
    'invitation_create_hour:5', 'invitation_create_day:20',
    'invitation_resend_hour:3', 'invitation_resend_day:10',
    'family_message_ten_minute:20', 'family_message_day:100'
  ],
  'database limit helper freezes every approved per-resource budget'
);
select extensions.is(
  array(
    select operation::text || ':'
      || private.family_abuse_budget_window_seconds_v1(operation)::text
    from unnest(
      enum_range(null::public.family_abuse_budget_operation)
    ) as item(operation)
  ),
  array[
    'invitation_create_hour:3600', 'invitation_create_day:86400',
    'invitation_resend_hour:3600', 'invitation_resend_day:86400',
    'family_message_ten_minute:600', 'family_message_day:86400'
  ],
  'database window helper freezes hourly ten-minute and UTC-day durations'
);
select extensions.is(
  enum_range(null::public.family_message_request_mode)::text,
  '{legacy,new_thread,existing_thread}',
  'message mode preserves legacy ambiguity without inventing request history'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.authorize_guardian_invitation_creation_unbudgeted_core_v1(uuid,text,text)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.authorize_guardian_invitation_resend_unbudgeted_core_v1(uuid,text)',
    'execute'
  ), false,
  'authenticated cannot bypass budgeted invitation authorization wrappers'
);
select extensions.is(
  has_function_privilege(
    'family_invitation_issuer',
    'public.create_guardian_invitation_unchecked_replay_core_v1(uuid,uuid,uuid,text,text,text,text,timestamp with time zone,text)',
    'execute'
  ) or has_function_privilege(
    'family_invitation_issuer',
    'public.resend_guardian_invitation_unchecked_replay_core_v1(uuid,uuid,text,text,timestamp with time zone,text)',
    'execute'
  ), false,
  'dedicated issuer cannot bypass immutable-material replay wrappers'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.accept_guardian_invitation_identity_core_v1(text,text,text)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.send_family_message_unbudgeted_core_v1(text,uuid,text,uuid,uuid,uuid,public.family_message_topic)',
    'execute'
  ), false,
  'authenticated cannot bypass accept or message abuse wrappers'
);
select extensions.is(
  has_function_privilege(
    'service_role',
    'public.run_family_retention_pre_abuse_v1(integer)', 'execute'
  ), false,
  'service role cannot bypass abuse-window retention cleanup'
);
select extensions.alike(
  pg_get_functiondef(
    'private.consume_family_abuse_budget_v1(public.family_abuse_budget_operation,uuid,uuid,uuid)'::regprocedure
  ),
  '%on conflict on constraint family_abuse_budget_windows_one_bucket%where family_abuse_budget_windows.request_count < v_limit%',
  'one atomic upsert serializes each unique last-slot budget decision'
);
select extensions.alike(
  pg_get_functiondef(
    'public.accept_guardian_invitation_pre_probe_budget_v1(text,text,text)'::regprocedure
  ),
  '%when sqlstate ''P0003''%or sqlstate ''P0004''%or sqlstate ''P0005''%',
  'accept converts only the explicit expected invitation SQLSTATE allowlist'
);
select extensions.unalike(
  pg_get_functiondef(
    'public.accept_guardian_invitation_pre_probe_budget_v1(text,text,text)'::regprocedure
  ),
  '%exception%when others%',
  'accept does not swallow operational or integrity failures'
);
select extensions.is(
  (
    select coalesce(sum(failed_accept_attempts), 0)
    from public.guardian_invitations
    where create_idempotency_key in (
      'test.invite.inactive.001',
      'test.cutover.revoked.001',
      'test.cutover.duplicate.001'
    )
  ), 0::bigint,
  'inactive-role revoked-identity and ambiguous-identity errors consume no attempt'
);

-- Isolated synthetic resources avoid inheriting counts from earlier tests.
insert into public.students (
  tenant_id, environment_id, data_mode, id, school_id, local_reference,
  display_name, grade_label, locale, active
) values
  (
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000b20',
    '10000000-0000-4000-8000-000000000101', 'ABUSE-BUDGET-A',
    'Budget Student A', 'Grade 4', 'en', true
  ),
  (
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000c20',
    '10000000-0000-4000-8000-000000000101', 'ABUSE-BUDGET-B',
    'Budget Student B', 'Grade 4', 'en', true
  );
insert into public.enrollments (
  tenant_id, environment_id, data_mode, id, student_id, class_id,
  status, starts_at
) values
  (
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000b40',
    '10000000-0000-4000-8000-000000000b20',
    '10000000-0000-4000-8000-000000000301', 'active', current_date
  ),
  (
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000c40',
    '10000000-0000-4000-8000-000000000c20',
    '10000000-0000-4000-8000-000000000301', 'active', current_date
  );
insert into public.guardian_links (
  tenant_id, environment_id, data_mode, id, guardian_user_id, student_id,
  status, created_by_user_id, verified_at
) values
  (
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000b71',
    '10000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000b20', 'active',
    '10000000-0000-4000-8000-000000000013', statement_timestamp()
  ),
  (
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000c71',
    '10000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000c20', 'active',
    '10000000-0000-4000-8000-000000000013', statement_timestamp()
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.lives_ok(
  $$select public.authorize_guardian_invitation_creation_v1(
    '10000000-0000-4000-8000-000000000b20',
    repeat('a', 64),
    'test.abuse.create.' || lpad(series::text, 3, '0')
  ) from generate_series(1, 5) as series$$,
  'five invitation-create attempts fit the per-student hourly budget'
);
select extensions.throws_ok(
  $$select public.authorize_guardian_invitation_creation_v1(
    '10000000-0000-4000-8000-000000000b20', repeat('a', 64),
    'test.abuse.create.006'
  )$$,
  '42501', 'invitation request unavailable',
  'sixth invitation-create attempt is denied by direct RPC'
);
reset role;
select extensions.is(
  (
    select string_agg(operation::text || ':' || request_count, ','
      order by operation::text)
    from public.family_abuse_budget_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000013'
      and student_id = '10000000-0000-4000-8000-000000000b20'
  ),
  'invitation_create_day:5,invitation_create_hour:5',
  'create hourly and daily counters commit the exact five allowed attempts'
);
set local role authenticated;
select extensions.lives_ok(
  $$select public.authorize_guardian_invitation_creation_v1(
    '10000000-0000-4000-8000-000000000b20', repeat('a', 64),
    'test.abuse.create.001'
  )$$,
  'exact create-preflight replay remains free after the limit'
);
reset role;
select extensions.is(
  (
    select sum(request_count)
    from public.family_abuse_budget_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000013'
      and student_id = '10000000-0000-4000-8000-000000000b20'
  ), 10::bigint,
  'free create replay increments neither fixed window'
);
set local role authenticated;
select extensions.throws_ok(
  $$select public.authorize_guardian_invitation_creation_v1(
    '10000000-0000-4000-8000-000000000b20', repeat('b', 64),
    'test.abuse.create.001'
  )$$,
  '22023', 'idempotency key conflict',
  'same create idempotency key with a changed email proof conflicts'
);
reset role;

insert into public.guardian_invitations (
  tenant_id, environment_id, data_mode, id, school_id, student_id,
  invited_by_user_id, recipient_email_digest, recipient_email_ciphertext,
  token_digest, create_idempotency_key, last_delivery_idempotency_key,
  expires_at
) values
  (
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000b70',
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000b20',
    '10000000-0000-4000-8000-000000000013', repeat('a', 64),
    'v1.synthetic.abuse.resend.email',
    encode(extensions.digest('abuse-resend-token-a', 'sha256'), 'hex'),
    'test.abuse.resend.create.a', 'test.abuse.resend.create.a',
    statement_timestamp() + interval '7 days'
  ),
  (
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000b72',
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000b20',
    '10000000-0000-4000-8000-000000000013', repeat('b', 64),
    'v1.synthetic.abuse.resend.other',
    encode(extensions.digest('abuse-resend-token-b', 'sha256'), 'hex'),
    'test.abuse.resend.create.b', 'test.abuse.resend.create.b',
    statement_timestamp() + interval '7 days'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.lives_ok(
  $$select public.authorize_guardian_invitation_resend_v1(
    '10000000-0000-4000-8000-000000000b70',
    'test.abuse.resend.' || lpad(series::text, 3, '0')
  ) from generate_series(1, 3) as series$$,
  'three invitation-resend attempts fit the per-invitation hourly budget'
);
select extensions.throws_ok(
  $$select public.authorize_guardian_invitation_resend_v1(
    '10000000-0000-4000-8000-000000000b70',
    'test.abuse.resend.004'
  )$$,
  '42501', 'invitation request unavailable',
  'fourth invitation-resend attempt is denied by direct RPC'
);
reset role;
select extensions.is(
  (
    select string_agg(operation::text || ':' || request_count, ','
      order by operation::text)
    from public.family_abuse_budget_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000013'
      and invitation_id = '10000000-0000-4000-8000-000000000b70'
  ),
  'invitation_resend_day:3,invitation_resend_hour:3',
  'resend hourly and daily counters commit the exact three allowed attempts'
);
set local role authenticated;
select extensions.lives_ok(
  $$select public.authorize_guardian_invitation_resend_v1(
    '10000000-0000-4000-8000-000000000b70',
    'test.abuse.resend.001'
  )$$,
  'exact resend-preflight replay remains free after the limit'
);
reset role;
select extensions.is(
  (
    select sum(request_count)
    from public.family_abuse_budget_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000013'
      and invitation_id = '10000000-0000-4000-8000-000000000b70'
  ), 6::bigint,
  'free resend replay increments neither fixed window'
);
set local role authenticated;
select extensions.throws_ok(
  $$select public.authorize_guardian_invitation_resend_v1(
    '10000000-0000-4000-8000-000000000b72',
    'test.abuse.resend.001'
  )$$,
  '22023', 'idempotency key conflict',
  'same resend idempotency key with a changed invitation conflicts'
);
reset role;

-- A complete create request is bound across the browser authorization and
-- dedicated issuer boundaries. Exact post-issuance replay is free; changing
-- any persisted cryptographic material or expiry is a conflict.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select set_config(
  'test.abuse.issuer.create.authorization',
  public.authorize_guardian_invitation_creation_v1(
    '10000000-0000-4000-8000-000000000c20',
    encode(extensions.digest('abuse-known-email', 'sha256'), 'hex'),
    'test.abuse.issuer.create.001'
  )::text,
  true
);
reset role;
select set_config(
  'test.abuse.issuer.create.expires_at',
  (statement_timestamp() + interval '7 days')::text,
  true
);
select extensions.is(
  (
    current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'alreadyIssued'
  )::boolean,
  false,
  'first create authorization is a newly charged request'
);

set local role family_invitation_issuer;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'family_invitation_issuer',
    'sub', 'family_invitation_issuer',
    'family_purpose', 'family_invitation_issue_v1',
    'iss', 'urn:help-math:synthetic:invitation-issuer',
    'aud', 'authenticated',
    'jti', '10000000-0000-4000-8000-000000000094',
    'iat', floor(extract(epoch from statement_timestamp()))::bigint,
    'nbf', floor(extract(epoch from statement_timestamp()))::bigint - 1,
    'exp', floor(extract(epoch from statement_timestamp()))::bigint + 120
  )::text,
  true
);
select extensions.lives_ok(
  $$select public.create_guardian_invitation_v1(
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    '10000000-0000-4000-8000-000000000c20',
    encode(extensions.digest('abuse-known-email', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.abuseEmail.AAAAAAAAAAAAAAAAAAAAAA',
    encode(extensions.digest('abuse-known-token-v1', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.abuseToken.AAAAAAAAAAAAAAAAAAAAAA',
    current_setting('test.abuse.issuer.create.expires_at')::timestamptz,
    'test.abuse.issuer.create.001'
  )$$,
  'dedicated issuer persists the complete authorized invitation material'
);
select extensions.lives_ok(
  $$select public.create_guardian_invitation_v1(
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    '10000000-0000-4000-8000-000000000c20',
    encode(extensions.digest('abuse-known-email', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.abuseEmail.AAAAAAAAAAAAAAAAAAAAAA',
    encode(extensions.digest('abuse-known-token-v1', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.abuseToken.AAAAAAAAAAAAAAAAAAAAAA',
    current_setting('test.abuse.issuer.create.expires_at')::timestamptz,
    'test.abuse.issuer.create.001'
  )$$,
  'exact issuer create replay returns the original receipt'
);
select extensions.throws_ok(
  $$select public.create_guardian_invitation_v1(
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    '10000000-0000-4000-8000-000000000c20',
    encode(extensions.digest('abuse-known-email', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.changedEmail.AAAAAAAAAAAAAAAAAAAAA',
    encode(extensions.digest('abuse-known-token-v1', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.abuseToken.AAAAAAAAAAAAAAAAAAAAAA',
    current_setting('test.abuse.issuer.create.expires_at')::timestamptz,
    'test.abuse.issuer.create.001'
  )$$,
  '22023', 'idempotency key conflict',
  'create replay with changed encrypted email material conflicts'
);
select extensions.throws_ok(
  $$select public.create_guardian_invitation_v1(
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    '10000000-0000-4000-8000-000000000c20',
    encode(extensions.digest('abuse-known-email', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.abuseEmail.AAAAAAAAAAAAAAAAAAAAAA',
    encode(extensions.digest('abuse-known-token-changed', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.abuseToken.AAAAAAAAAAAAAAAAAAAAAA',
    current_setting('test.abuse.issuer.create.expires_at')::timestamptz,
    'test.abuse.issuer.create.001'
  )$$,
  '22023', 'idempotency key conflict',
  'create replay with changed token digest conflicts'
);
select extensions.throws_ok(
  $$select public.create_guardian_invitation_v1(
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    '10000000-0000-4000-8000-000000000c20',
    encode(extensions.digest('abuse-known-email', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.abuseEmail.AAAAAAAAAAAAAAAAAAAAAA',
    encode(extensions.digest('abuse-known-token-v1', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.changedToken.AAAAAAAAAAAAAAAAAAAAA',
    current_setting('test.abuse.issuer.create.expires_at')::timestamptz
      + interval '1 minute',
    'test.abuse.issuer.create.001'
  )$$,
  '22023', 'idempotency key conflict',
  'create replay with changed encrypted token and expiry conflicts'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select set_config(
  'test.abuse.issuer.create.replay',
  public.authorize_guardian_invitation_creation_v1(
    '10000000-0000-4000-8000-000000000c20',
    encode(extensions.digest('abuse-known-email', 'sha256'), 'hex'),
    'test.abuse.issuer.create.001'
  )::text,
  true
);
reset role;
select extensions.ok(
  (current_setting('test.abuse.issuer.create.replay')::jsonb
    ->> 'alreadyIssued')::boolean
  and (current_setting('test.abuse.issuer.create.replay')::jsonb
    ->> 'invitationExpiresAt')::timestamptz =
      current_setting('test.abuse.issuer.create.expires_at')::timestamptz,
  'post-issuance create preflight returns the original expiry as a free replay'
);
select extensions.is(
  (
    select sum(request_count)
    from public.family_abuse_budget_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000013'
      and student_id = '10000000-0000-4000-8000-000000000c20'
  ), 2::bigint,
  'new create consumes exactly one hourly and one daily slot'
);

-- Unknown probes share the same zero-row surface but cannot safely be mapped
-- to a tenant or invitation and therefore consume no per-invitation attempt.
select set_config(
  'test.abuse.accept.total_before_unknown',
  (select coalesce(sum(failed_accept_attempts), 0)::text
   from public.guardian_invitations),
  true
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"abuse-unknown-probe"}',
  true
);
select extensions.is_empty(
  $$select * from public.accept_guardian_invitation_v1(
    encode(extensions.digest('abuse-unknown-token', 'sha256'), 'hex'),
    encode(extensions.digest('abuse-unknown-email', 'sha256'), 'hex'),
    'test.abuse.accept.unknown.001'
  )$$,
  'unknown random token uses the non-enumerating zero-row receipt'
);
reset role;
select extensions.is(
  (select coalesce(sum(failed_accept_attempts), 0)
   from public.guardian_invitations),
  current_setting('test.abuse.accept.total_before_unknown')::bigint,
  'unknown random token creates no tenant-associated failure count'
);

-- The created known invitation is locked after ten expected email failures.
-- Each expected failure returns zero rows and no identity data.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"abuse-locked-guardian"}',
  true
);
select extensions.is_empty(
  $$select accepted.*
    from generate_series(1, 10) as attempt
    cross join lateral public.accept_guardian_invitation_v1(
      encode(extensions.digest('abuse-known-token-v1', 'sha256'), 'hex'),
      encode(extensions.digest('abuse-wrong-email', 'sha256'), 'hex'),
      'test.abuse.accept.failed.' || lpad(attempt::text, 3, '0')
    ) as accepted$$,
  'ten expected known-invitation failures all use the zero-row receipt'
);
reset role;
select extensions.is(
  (
    select failed_accept_attempts::text || ':'
      || (accept_locked_at is not null)::text
    from public.guardian_invitations
    where id = (
      current_setting('test.abuse.issuer.create.authorization')::jsonb
        ->> 'invitationId'
    )::uuid
  ),
  '10:true',
  'known invitation locks exactly at ten expected failures'
);
select extensions.is(
  (
    select count(*) from public.provider_identities
    where issuer = 'urn:help-math:synthetic'
      and subject = 'abuse-locked-guardian'
  ), 0::bigint,
  'failed acceptance attempts create no provider identity'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"abuse-locked-guardian"}',
  true
);
select extensions.is_empty(
  $$select * from public.accept_guardian_invitation_v1(
    encode(extensions.digest('abuse-known-token-v1', 'sha256'), 'hex'),
    encode(extensions.digest('abuse-wrong-email', 'sha256'), 'hex'),
    'test.abuse.accept.failed.011'
  )$$,
  'eleventh known-invitation failure remains a zero-row receipt'
);
select extensions.is_empty(
  $$select * from public.accept_guardian_invitation_v1(
    encode(extensions.digest('abuse-known-token-v1', 'sha256'), 'hex'),
    encode(extensions.digest('abuse-known-email', 'sha256'), 'hex'),
    'test.abuse.accept.correct.after-lock.001'
  )$$,
  'correct proof cannot accept a lifetime-locked invitation'
);
reset role;
select extensions.is(
  (
    select failed_accept_attempts
    from public.guardian_invitations
    where id = (
      current_setting('test.abuse.issuer.create.authorization')::jsonb
        ->> 'invitationId'
    )::uuid
  ), 10::smallint,
  'locked invitation never exceeds the ten-attempt bound'
);

-- A production-shaped resend rotates material without resetting the known
-- invitation lifetime counter, and its complete replay meaning is immutable.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select set_config(
  'test.abuse.issuer.resend.authorization',
  public.authorize_guardian_invitation_resend_v1(
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    'test.abuse.issuer.resend.001'
  )::text,
  true
);
reset role;
select set_config(
  'test.abuse.issuer.resend.expires_at',
  (statement_timestamp() + interval '7 days')::text,
  true
);
set local role family_invitation_issuer;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'role', 'family_invitation_issuer',
    'sub', 'family_invitation_issuer',
    'family_purpose', 'family_invitation_issue_v1',
    'iss', 'urn:help-math:synthetic:invitation-issuer',
    'aud', 'authenticated',
    'jti', '10000000-0000-4000-8000-000000000095',
    'iat', floor(extract(epoch from statement_timestamp()))::bigint,
    'nbf', floor(extract(epoch from statement_timestamp()))::bigint - 1,
    'exp', floor(extract(epoch from statement_timestamp()))::bigint + 120
  )::text,
  true
);
select extensions.lives_ok(
  $$select public.resend_guardian_invitation_v1(
    (current_setting('test.abuse.issuer.resend.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.abuse.issuer.resend.authorization')::jsonb
      ->> 'invitationId')::uuid,
    encode(extensions.digest('abuse-known-token-v2', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.resendToken.AAAAAAAAAAAAAAAAAAAAAA',
    current_setting('test.abuse.issuer.resend.expires_at')::timestamptz,
    'test.abuse.issuer.resend.001'
  )$$,
  'dedicated resend rotates the known invitation token'
);
select extensions.lives_ok(
  $$select public.resend_guardian_invitation_v1(
    (current_setting('test.abuse.issuer.resend.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.abuse.issuer.resend.authorization')::jsonb
      ->> 'invitationId')::uuid,
    encode(extensions.digest('abuse-known-token-v2', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.resendToken.AAAAAAAAAAAAAAAAAAAAAA',
    current_setting('test.abuse.issuer.resend.expires_at')::timestamptz,
    'test.abuse.issuer.resend.001'
  )$$,
  'exact issuer resend replay returns the original receipt'
);
select extensions.throws_ok(
  $$select public.resend_guardian_invitation_v1(
    (current_setting('test.abuse.issuer.resend.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.abuse.issuer.resend.authorization')::jsonb
      ->> 'invitationId')::uuid,
    encode(extensions.digest('abuse-known-token-v3', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.resendToken.AAAAAAAAAAAAAAAAAAAAAA',
    current_setting('test.abuse.issuer.resend.expires_at')::timestamptz,
    'test.abuse.issuer.resend.001'
  )$$,
  '22023', 'idempotency key conflict',
  'resend replay with changed token digest conflicts'
);
select extensions.throws_ok(
  $$select public.resend_guardian_invitation_v1(
    (current_setting('test.abuse.issuer.resend.authorization')::jsonb
      ->> 'attestationId')::uuid,
    (current_setting('test.abuse.issuer.resend.authorization')::jsonb
      ->> 'invitationId')::uuid,
    encode(extensions.digest('abuse-known-token-v2', 'sha256'), 'hex'),
    'v2.test_key.AAAAAAAAAAAAAAAA.changedSend.AAAAAAAAAAAAAAAAAAAAAA',
    current_setting('test.abuse.issuer.resend.expires_at')::timestamptz
      + interval '1 minute',
    'test.abuse.issuer.resend.001'
  )$$,
  '22023', 'idempotency key conflict',
  'resend replay with changed encrypted token and expiry conflicts'
);
reset role;
select extensions.is(
  (
    select failed_accept_attempts::text || ':'
      || (accept_locked_at is not null)::text || ':' || send_count::text
    from public.guardian_invitations
    where id = (
      current_setting('test.abuse.issuer.create.authorization')::jsonb
        ->> 'invitationId'
    )::uuid
  ),
  '10:true:2',
  'resend does not reset the non-resetting lifetime acceptance lock'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select set_config(
  'test.abuse.issuer.resend.replay',
  public.authorize_guardian_invitation_resend_v1(
    (current_setting('test.abuse.issuer.create.authorization')::jsonb
      ->> 'invitationId')::uuid,
    'test.abuse.issuer.resend.001'
  )::text,
  true
);
reset role;
select extensions.ok(
  (current_setting('test.abuse.issuer.resend.replay')::jsonb
    ->> 'alreadyIssued')::boolean
  and (current_setting('test.abuse.issuer.resend.replay')::jsonb
    ->> 'invitationExpiresAt')::timestamptz =
      current_setting('test.abuse.issuer.resend.expires_at')::timestamptz,
  'post-issuance resend preflight returns the original expiry as a free replay'
);
select extensions.is(
  (
    select sum(request_count)
    from public.family_abuse_budget_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000013'
      and invitation_id = (
        current_setting('test.abuse.issuer.create.authorization')::jsonb
          ->> 'invitationId'
      )::uuid
  ), 2::bigint,
  'new resend consumes exactly one hourly and one daily slot'
);

-- A separate known invitation proves exact successful acceptance replay and
-- changed-payload conflict without inheriting the lock fixture.
insert into public.guardian_invitations (
  tenant_id, environment_id, data_mode, id, school_id, student_id,
  invited_by_user_id, recipient_email_digest, recipient_email_ciphertext,
  token_digest, create_idempotency_key, last_delivery_idempotency_key,
  expires_at
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000c74',
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000c20',
  '10000000-0000-4000-8000-000000000013',
  encode(extensions.digest('abuse-success-email', 'sha256'), 'hex'),
  'v1.synthetic.abuse.success.email',
  encode(extensions.digest('abuse-success-token', 'sha256'), 'hex'),
  'test.abuse.accept.success.create',
  'test.abuse.accept.success.create', statement_timestamp() + interval '7 days'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"abuse-success-guardian"}',
  true
);
select extensions.is(
  (
    select count(*)
    from public.accept_guardian_invitation_v1(
      encode(extensions.digest('abuse-success-token', 'sha256'), 'hex'),
      encode(extensions.digest('abuse-success-email', 'sha256'), 'hex'),
      'test.abuse.accept.success.001'
    )
  ), 1::bigint,
  'successful known-invitation acceptance returns exactly one row'
);
select extensions.is(
  (
    select count(*)
    from public.accept_guardian_invitation_v1(
      encode(extensions.digest('abuse-success-token', 'sha256'), 'hex'),
      encode(extensions.digest('abuse-success-email', 'sha256'), 'hex'),
      'test.abuse.accept.success.001'
    )
  ), 1::bigint,
  'exact accepted invitation replay returns exactly one row for the same link'
);
select extensions.throws_ok(
  $$select * from public.accept_guardian_invitation_v1(
    encode(extensions.digest('abuse-success-token', 'sha256'), 'hex'),
    encode(extensions.digest('abuse-success-email-changed', 'sha256'), 'hex'),
    'test.abuse.accept.success.001'
  )$$,
  '22023', 'idempotency key conflict',
  'accepted replay with changed email proof is an immutable-request conflict'
);
reset role;
select extensions.is(
  (
    select status::text || ':' || failed_accept_attempts::text
    from public.guardian_invitations
    where id = '10000000-0000-4000-8000-000000000c74'
  ),
  'accepted:0',
  'successful acceptance and its exact replay consume no failure attempt'
);

insert into public.guardian_invitations (
  tenant_id, environment_id, data_mode, id, school_id, student_id,
  invited_by_user_id, recipient_email_digest, recipient_email_ciphertext,
  token_digest, create_idempotency_key, last_delivery_idempotency_key,
  retention_anchor_at, expires_at
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000c75',
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000c20',
  '10000000-0000-4000-8000-000000000013',
  encode(extensions.digest('abuse-expired-email', 'sha256'), 'hex'),
  'v1.synthetic.abuse.expired.email',
  encode(extensions.digest('abuse-expired-token', 'sha256'), 'hex'),
  'test.abuse.accept.expired.create',
  'test.abuse.accept.expired.create',
  statement_timestamp() - interval '7 days',
  statement_timestamp() - interval '1 day'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"abuse-expired-guardian"}',
  true
);
select extensions.is_empty(
  $$select * from public.accept_guardian_invitation_v1(
    encode(extensions.digest('abuse-expired-token', 'sha256'), 'hex'),
    encode(extensions.digest('abuse-expired-email', 'sha256'), 'hex'),
    'test.abuse.accept.expired.001'
  )$$,
  'expired known invitation converts P0004 into the same zero-row receipt'
);
reset role;
select extensions.is(
  (
    select status::text || ':' || failed_accept_attempts::text
    from public.guardian_invitations
    where id = '10000000-0000-4000-8000-000000000c75'
  ), 'pending:1',
  'expired known invitation records exactly one expected lifecycle failure'
);

-- A fresh fictional teacher keeps the message budget fixtures independent of
-- the earlier terminal class-staff lifecycle tests.
insert into public.app_users (
  id, display_name, locale, notification_email_digest,
  notification_email_ciphertext, status
) values (
  '10000000-0000-4000-8000-000000000b12',
  'Budget Fictional Teacher', 'en',
  encode(extensions.digest('budget-teacher-email', 'sha256'), 'hex'),
  'v1.synthetic.budget.teacher.email', 'active'
);
insert into public.provider_identities (
  issuer, subject, app_user_id, active
) values (
  'urn:help-math:synthetic', 'budget-teacher',
  '10000000-0000-4000-8000-000000000b12', true
);
insert into public.role_bindings (
  id, tenant_id, environment_id, data_mode, app_user_id, role,
  school_id, active
) values (
  '10000000-0000-4000-8000-000000000b23',
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000b12', 'teacher',
  '10000000-0000-4000-8000-000000000101', true
);
insert into public.class_staff_bindings (
  tenant_id, environment_id, data_mode, id, class_id, teacher_user_id,
  active
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000b33',
  '10000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000b12', true
);
insert into public.family_threads (
  tenant_id, environment_id, data_mode, id, school_id, child_id,
  enrollment_id, guardian_user_id, staff_user_id, created_by_user_id,
  topic, status
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-000000000b60',
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000b20',
  '10000000-0000-4000-8000-000000000b40',
  '10000000-0000-4000-8000-000000000010',
  '10000000-0000-4000-8000-000000000b12',
  '10000000-0000-4000-8000-000000000010', 'other', 'open'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.lives_ok(
  $$select public.send_family_message_v1(
    'Budget thread message ' || lpad(series::text, 3, '0'),
    null, 'test.abuse.message.existing.' || lpad(series::text, 3, '0'),
    null, null, '10000000-0000-4000-8000-000000000b60', null
  ) from generate_series(1, 20) as series$$,
  'twenty family messages fit the per-thread ten-minute budget'
);
select extensions.throws_ok(
  $$select public.send_family_message_v1(
    'Budget thread message 021', null,
    'test.abuse.message.existing.021', null, null,
    '10000000-0000-4000-8000-000000000b60', null
  )$$,
  '42501', 'family message unavailable',
  'twenty-first family message is denied by direct RPC'
);
reset role;
select extensions.is(
  (
    select string_agg(operation::text || ':' || request_count, ','
      order by operation::text)
    from public.family_abuse_budget_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000010'
      and thread_id = '10000000-0000-4000-8000-000000000b60'
  ),
  'family_message_day:20,family_message_ten_minute:20',
  'message counters commit the exact twenty allowed attempts in both windows'
);
select extensions.is(
  (
    select count(*) from public.family_messages
    where thread_id = '10000000-0000-4000-8000-000000000b60'
  ), 20::bigint,
  'denied message rolls back without a twenty-first message row'
);

set local role authenticated;
select extensions.lives_ok(
  $$select public.send_family_message_v1(
    'Budget thread message 001', null,
    'test.abuse.message.existing.001', null, null,
    '10000000-0000-4000-8000-000000000b60', null
  )$$,
  'exact existing-thread message replay remains free after the limit'
);
reset role;
select extensions.is(
  (
    select sum(request_count)
    from public.family_abuse_budget_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000010'
      and thread_id = '10000000-0000-4000-8000-000000000b60'
  ), 40::bigint,
  'exact existing-thread replay increments neither message window'
);
set local role authenticated;
select extensions.throws_ok(
  $$select public.send_family_message_v1(
    'Changed budget thread message', null,
    'test.abuse.message.existing.001', null, null,
    '10000000-0000-4000-8000-000000000b60', null
  )$$,
  '22023', 'idempotency key conflict',
  'same message key with changed body conflicts'
);
select extensions.throws_ok(
  $$select public.send_family_message_v1(
    'Budget thread message 001',
    '10000000-0000-4000-8000-000000000b20',
    'test.abuse.message.existing.001',
    '10000000-0000-4000-8000-000000000b40',
    '10000000-0000-4000-8000-000000000b12', null, 'other'
  )$$,
  '22023', 'idempotency key conflict',
  'existing-thread request cannot replay through the new-thread shape'
);

select set_config(
  'test.abuse.message.new.receipt',
  public.send_family_message_v1(
    'A private new-thread budget message',
    '10000000-0000-4000-8000-000000000c20',
    'test.abuse.message.new.001',
    '10000000-0000-4000-8000-000000000c40',
    '10000000-0000-4000-8000-000000000b12', null, 'other'
  )::text,
  true
);
select extensions.ok(
  (current_setting('test.abuse.message.new.receipt')::jsonb
    ->> 'message_id')::uuid is not null
  and (current_setting('test.abuse.message.new.receipt')::jsonb
    ->> 'thread_id')::uuid is not null,
  'new-thread send returns the strict persisted message and thread receipt'
);
select extensions.lives_ok(
  $$select public.send_family_message_v1(
    'A private new-thread budget message',
    '10000000-0000-4000-8000-000000000c20',
    'test.abuse.message.new.001',
    '10000000-0000-4000-8000-000000000c40',
    '10000000-0000-4000-8000-000000000b12', null, 'other'
  )$$,
  'exact new-thread tuple replays through the persisted private thread'
);
select extensions.throws_ok(
  $$select public.send_family_message_v1(
    'A private new-thread budget message', null,
    'test.abuse.message.new.001', null, null,
    (current_setting('test.abuse.message.new.receipt')::jsonb
      ->> 'thread_id')::uuid, null
  )$$,
  '22023', 'idempotency key conflict',
  'new-thread request cannot replay through the generated existing-thread shape'
);
select extensions.throws_ok(
  $$select public.send_family_message_v1(
    'A private new-thread budget message',
    '10000000-0000-4000-8000-000000000b20',
    'test.abuse.message.new.001',
    '10000000-0000-4000-8000-000000000b40',
    '10000000-0000-4000-8000-000000000b12', null, 'progress'
  )$$,
  '22023', 'idempotency key conflict',
  'new-thread replay with changed child enrollment and topic conflicts'
);
reset role;
select extensions.is(
  (
    select request_mode::text from public.family_messages
    where idempotency_key = 'test.abuse.message.new.001'
  ), 'new_thread',
  'new-thread message persists its exact original request mode'
);
select extensions.is(
  (
    select count(*) from public.family_messages
    where thread_id = '10000000-0000-4000-8000-000000000b60'
      and request_mode = 'existing_thread'
  ), 20::bigint,
  'existing-thread messages persist their exact original request mode'
);
select extensions.is(
  (
    select request_mode::text from public.family_messages
    where id = '10000000-0000-4000-8000-000000000911'
  ), 'legacy',
  'pre-011 seed messages remain legacy and cannot gain a fabricated replay mode'
);
select extensions.is(
  (
    select sum(request_count)
    from public.family_abuse_budget_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000010'
      and thread_id = (
        current_setting('test.abuse.message.new.receipt')::jsonb
          ->> 'thread_id'
      )::uuid
  ), 2::bigint,
  'new-thread exact replay consumes only the first hourly pair of message slots'
);

-- Product revocation, redaction, and relinquishment remain available even
-- after the related invitation or message budget has tripped.
select set_config(
  'test.abuse.message.redact.id',
  (
    select id::text from public.family_messages
    where idempotency_key = 'test.abuse.message.existing.020'
  ),
  true
);
insert into public.family_support_access_requests (
  tenant_id, environment_id, data_mode, id, school_id, thread_id,
  requestor_user_id, approver_user_id, reason, status,
  client_mutation_id, decision_idempotency_key, requested_at, decided_at,
  access_expires_at, retention_anchor_at, expires_at
)
select message.tenant_id, message.environment_id, message.data_mode,
  '10000000-0000-4000-8000-00000000e101', thread.school_id,
  message.thread_id, '10000000-0000-4000-8000-000000000013',
  '10000000-0000-4000-8000-000000000014', 'Synthetic support review',
  'approved', 'test.support.seed.request.101',
  'test.support.seed.approve.101', statement_timestamp(),
  statement_timestamp(), statement_timestamp() + interval '15 minutes',
  statement_timestamp(), statement_timestamp() + interval '30 days'
from public.family_messages as message
join public.family_threads as thread
  on thread.tenant_id = message.tenant_id and thread.id = message.thread_id
where message.id = current_setting('test.abuse.message.redact.id')::uuid;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.lives_ok(
  $$select public.redact_family_message_v1(
    current_setting('test.abuse.message.redact.id')::uuid,
    'Synthetic support review', 'test.abuse.message.redact.001'
  )$$,
  'approved school support redaction remains available after the message budget trips'
);
select extensions.lives_ok(
  $$select public.revoke_guardian_invitation_v1(
    '10000000-0000-4000-8000-000000000b70',
    'test.abuse.invitation.revoke.001', 'Synthetic abuse review'
  )$$,
  'invitation revocation remains ungated after the resend budget trips'
);
reset role;
select extensions.is(
  (
    select body from public.family_messages
    where id = current_setting('test.abuse.message.redact.id')::uuid
  ), '[redacted]',
  'support-gated redaction commits only the tombstone body'
);
select extensions.is(
  (
    select status::text from public.guardian_invitations
    where id = '10000000-0000-4000-8000-000000000b70'
  ), 'revoked',
  'ungated invitation revocation commits its terminal state'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.is_empty(
  $$select * from public.accept_guardian_invitation_v1(
    encode(extensions.digest('abuse-resend-token-a', 'sha256'), 'hex'),
    repeat('a', 64), 'test.abuse.accept.revoked.001'
  )$$,
  'revoked known invitation converts P0003 into the same zero-row receipt'
);
reset role;
select extensions.is(
  (
    select status::text || ':' || failed_accept_attempts::text
    from public.guardian_invitations
    where id = '10000000-0000-4000-8000-000000000b70'
  ), 'revoked:1',
  'revoked known invitation records one expected lifecycle failure'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.lives_ok(
  $$select public.relinquish_guardian_child_access_v1(
    '10000000-0000-4000-8000-000000000b20',
    'test.abuse.guardian.relinquish.001'
  )$$,
  'guardian relinquishment remains ungated after the thread budget trips'
);
reset role;
select extensions.is(
  (
    select status::text from public.guardian_links
    where id = '10000000-0000-4000-8000-000000000b71'
  ), 'revoked',
  'ungated guardian relinquishment commits its terminal state'
);

select extensions.ok(
  exists (
    select 1 from public.audit_events
    where entity_type in (
      'family_abuse_budget_windows', 'family_abuse_budget'
    )
  ),
  'abuse budget changes write immutable privacy-safe audit events'
);
select extensions.is(
  (
    select count(*) from public.audit_events
    where entity_type in (
      'family_abuse_budget_windows', 'family_abuse_budget'
    )
      and context::text ~*
        '(email|token|digest|ciphertext|body|provider|subject)'
  ), 0::bigint,
  'abuse audit context contains no email token message or provider material'
);

-- Retention stays service-only and removes only expired window rows. Move one
-- current synthetic row to a valid past fixed window, then prove the wrapper
-- merges its bounded cleanup count into the existing retention receipt.
update public.family_abuse_budget_windows
set window_started_at = statement_timestamp() - interval '4 hours',
    retention_anchor_at = statement_timestamp() - interval '4 hours',
    expires_at = statement_timestamp() - interval '3 hours',
    updated_at = clock_timestamp()
where operation = 'invitation_create_hour'
  and student_id = '10000000-0000-4000-8000-000000000c20';
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select set_config(
  'test.abuse.retention.receipt',
  public.run_family_retention_v1(1000)::text,
  true
);
reset role;
select extensions.is(
  (
    select count(*) from public.family_abuse_budget_windows
    where operation = 'invitation_create_hour'
      and student_id = '10000000-0000-4000-8000-000000000c20'
  ), 0::bigint,
  'service retention removes the expired abuse window row'
);
select extensions.ok(
  exists (
    select 1
    from jsonb_array_elements(
      current_setting('test.abuse.retention.receipt')::jsonb -> 'runs'
    ) as run
    where run ->> 'tenantId' =
      '10000000-0000-4000-8000-000000000001'
      and (run -> 'deletedCounts' ->> 'familyAbuseBudgetWindows')::integer = 1
  ),
  'retention receipt reports the one bounded abuse-window deletion'
);


-- Migration 012: synthetic-only signed learner assignment launch and product
-- LearningEventV2 caller. Append immediately before extensions.finish().

select extensions.has_column(
  'public', 'tenants', 'learning_events_v2_enabled',
  'tenant LearningEventV2 kill switch exists'
);
select extensions.has_table(
  'public', 'assignment_learning_object_bindings',
  'assignment learning-object allowlist exists'
);
select extensions.is(
  (
    select relrowsecurity
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'assignment_learning_object_bindings'
  ), true,
  'assignment learning-object allowlist has RLS enabled'
);
select extensions.has_function(
  'public', 'learning_assignment_launch_v1', array['uuid'],
  'signed learner assignment launch RPC exists'
);
select extensions.has_function(
  'public', 'record_assignment_learning_events_v2', array['jsonb'],
  'assignment-scoped LearningEventV2 RPC exists'
);
select extensions.is(
  has_function_privilege(
    'authenticated', 'public.learning_assignment_launch_v1(uuid)', 'execute'
  ), true,
  'authenticated callers may execute the learner launch RPC'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.record_assignment_learning_events_v2(jsonb)', 'execute'
  ), true,
  'authenticated callers may execute the assignment event RPC'
);
select extensions.is(
  has_function_privilege(
    'anon', 'public.learning_assignment_launch_v1(uuid)', 'execute'
  ), false,
  'anonymous callers cannot execute the learner launch RPC'
);
select extensions.is(
  has_function_privilege(
    'anon', 'public.record_assignment_learning_events_v2(jsonb)', 'execute'
  ), false,
  'anonymous callers cannot execute the assignment event RPC'
);
select extensions.is(
  has_function_privilege(
    'service_role', 'public.learning_assignment_launch_v1(uuid)', 'execute'
  ), false,
  'service role cannot execute the learner launch RPC'
);
select extensions.is(
  has_function_privilege(
    'service_role',
    'public.record_assignment_learning_events_v2(jsonb)', 'execute'
  ), false,
  'service role cannot execute the assignment event RPC'
);
select extensions.is(
  has_function_privilege(
    'authenticated', 'public.ingest_learning_events_v2(jsonb)', 'execute'
  ), false,
  'authenticated callers cannot bypass the assignment event wrapper'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'private.family_learning_assignment_context_v1(uuid,uuid)', 'execute'
  ), false,
  'authenticated callers cannot execute the private launch helper'
);
select extensions.is(
  has_table_privilege(
    'authenticated', 'public.assignment_learning_object_bindings', 'select'
  ), false,
  'authenticated callers cannot read the assignment allowlist table'
);
select extensions.is(
  has_table_privilege(
    'service_role', 'public.assignment_learning_object_bindings',
    'select,insert,update,delete'
  ), false,
  'service role has no direct assignment allowlist table privileges'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.is(
  (
    select string_agg(
      concat(tenant ->> 'id', ':', tenant -> 'roles' ->> 0),
      ',' order by tenant ->> 'id'
    )
    from jsonb_array_elements(
      public.family_authorization_context_v1() -> 'tenants'
    ) as tenant
  ),
  '10000000-0000-4000-8000-000000000001:guardian,20000000-0000-4000-8000-000000000001:guardian',
  'one signed guardian identity receives two distinct role-scoped tenant options'
);
select extensions.is(
  (
    with workspace as (
      select public.family_workspace_for_tenant_v1(
        '10000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000020'
      ) as value
    )
    select concat_ws(
      ':', value #>> '{tenant,id}', value ->> 'selectedChildId',
      not exists (
        select 1
        from jsonb_array_elements(value -> 'children') as child
        where child ->> 'id' = '20000000-0000-4000-8000-000000000020'
      ),
      not exists (
        select 1
        from jsonb_array_elements(value -> 'threads') as thread
        where thread ->> 'childId' = '20000000-0000-4000-8000-000000000020'
      ),
      jsonb_array_length(value -> 'threads'),
      value #>> '{threads,0,childId}'
    )
    from workspace
  ),
  '10000000-0000-4000-8000-000000000001:10000000-0000-4000-8000-000000000020:t:t:0',
  'explicit Cedar child locator returns no Maple child or stale staff thread data'
);
select extensions.is(
  (
    with workspace as (
      select public.family_workspace_for_tenant_v1(
        '20000000-0000-4000-8000-000000000001',
        '20000000-0000-4000-8000-000000000020'
      ) as value
    )
    select concat_ws(
      ':', value #>> '{tenant,id}', value ->> 'selectedChildId',
      jsonb_array_length(value -> 'children'),
      value #>> '{children,0,id}', jsonb_array_length(value -> 'threads')
    )
    from workspace
  ),
  '20000000-0000-4000-8000-000000000001:20000000-0000-4000-8000-000000000020:1:20000000-0000-4000-8000-000000000020:0',
  'explicit Maple child locator returns only Maple child data and no Cedar thread'
);
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000021'
  )$$,
  'P0002', 'family workspace not found',
  'an unlinked child locator cannot grant a multi-tenant guardian access'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-a"}',
  true
);
select extensions.is(
  (
    with launch as (
      select public.learning_assignment_launch_v1(
        '10000000-0000-4000-8000-000000000503'
      ) as value
    )
    select concat_ws(
      ':', value ->> 'tenantId', value ->> 'assignmentId',
      value ->> 'lessonHref', value ->> 'lessonReleaseId',
      value ->> 'totalPages', jsonb_array_length(value -> 'objects'),
      value #>> '{objects,0,pageOrdinal}',
      value #>> '{objects,0,placementId}',
      value #>> '{objects,38,pageOrdinal}',
      value #>> '{objects,38,placementId}'
    )
    from launch
  ),
  '10000000-0000-4000-8000-000000000001:10000000-0000-4000-8000-000000000503:/courses/4/3:lesson-g04-l03-negative-numbers:39:39:1:course-g04-l03-ir-001-341242cc:39:course-g04-l03-fq-003',
  'learner launch is tenant-bound and returns the exact contiguous G4 L3 slice'
);
select extensions.throws_ok(
  $$select count(*) from public.assignment_learning_object_bindings$$,
  '42501', 'permission denied for table assignment_learning_object_bindings',
  'authenticated direct allowlist reads fail closed'
);
select extensions.throws_ok(
  $$select public.ingest_learning_events_v2('[]'::jsonb)$$,
  '42501', 'permission denied for function ingest_learning_events_v2',
  'authenticated callers cannot invoke general ingestion directly'
);

select set_config(
  'test.assignment_learning_event',
  jsonb_build_object(
    'schemaVersion', 2,
    'activeDurationMs', 1250,
    'assignmentId', '10000000-0000-4000-8000-000000000503',
    'occurredAt', statement_timestamp(),
    'attemptNumber', 1,
    'clientMutationId', 'test.assignment.learning.client.001',
    'clientVersion', 'pgtap-assignment-v2',
    'contentReleaseId', 'synthetic-g04-l03-browser-v2',
    'eventId', '90000000-0000-4000-8000-00000000c001',
    'eventType', 'page_reviewed',
    'idempotencyKey', 'test.assignment.learning.idempotency.001',
    'learningObjectVersionId', 'g04-l03-placement-001-v1',
    'lessonReleaseId', 'lesson-g04-l03-negative-numbers',
    'locale', 'en',
    'outcome', 'completed',
    'sessionId', '90000000-0000-4000-8000-00000000d001',
    'skillId', null
  )::text,
  true
);
select extensions.is(
  (
    select concat_ws(
      ':', receipt ->> 'tenantId', receipt ->> 'inserted',
      receipt ->> 'ignored'
    )
    from (
      select public.record_assignment_learning_events_v2(
        jsonb_build_array(current_setting('test.assignment_learning_event')::jsonb)
      ) as receipt
    ) as result
  ),
  '10000000-0000-4000-8000-000000000001:1:0',
  'authorized assignment event receipt is tenant-bound and inserted once'
);
select extensions.is(
  (
    select concat_ws(
      ':', receipt ->> 'tenantId', receipt ->> 'inserted',
      receipt ->> 'ignored'
    )
    from (
      select public.record_assignment_learning_events_v2(
        jsonb_build_array(current_setting('test.assignment_learning_event')::jsonb)
      ) as receipt
    ) as result
  ),
  '10000000-0000-4000-8000-000000000001:0:1',
  'exact assignment event replay is idempotently ignored'
);
select extensions.throws_ok(
  $$select public.record_assignment_learning_events_v2(
    jsonb_build_array(
      jsonb_set(
        current_setting('test.assignment_learning_event')::jsonb,
        '{eventType}', '"practice_evaluated"'::jsonb
      )
    )
  )$$,
  '22023', 'invalid assignment learning event',
  'product assignment wrapper rejects practice_evaluated'
);
select extensions.throws_ok(
  $$select public.record_assignment_learning_events_v2(
    jsonb_build_array(
      jsonb_set(
        current_setting('test.assignment_learning_event')::jsonb,
        '{outcome}', '"none"'::jsonb
      )
    )
  )$$,
  '22023', 'invalid assignment learning event',
  'product assignment wrapper requires completed page-review evidence'
);
select extensions.throws_ok(
  $$select public.record_assignment_learning_events_v2(
    jsonb_build_array(
      jsonb_set(
        current_setting('test.assignment_learning_event')::jsonb,
        '{occurredAt}', to_jsonb(statement_timestamp() - interval '25 hours')
      )
    )
  )$$,
  '22023', 'learning event backfill is not allowed',
  'product assignment wrapper rejects historical backfill'
);
select extensions.throws_ok(
  $$select public.record_assignment_learning_events_v2(
    jsonb_build_array(
      jsonb_set(
        current_setting('test.assignment_learning_event')::jsonb,
        '{learningObjectVersionId}', '"forged-object-v1"'::jsonb
      )
    )
  )$$,
  '22023', 'learning event binding not published',
  'product assignment wrapper rejects a forged release object'
);
reset role;
select extensions.is(
  (
    select count(*)
    from public.learning_events_v2
    where event_id = '90000000-0000-4000-8000-00000000c001'
      and student_id = '10000000-0000-4000-8000-000000000020'
      and assignment_id = '10000000-0000-4000-8000-000000000503'
  ), 1::bigint,
  'authorized product event is attributed only to the database-derived learner'
);
select extensions.is(
  (
    select reviewed_pages
    from public.progress_projections_v1
    where tenant_id = '10000000-0000-4000-8000-000000000001'
      and student_id = '10000000-0000-4000-8000-000000000020'
      and assignment_id = '10000000-0000-4000-8000-000000000503'
  ), 1,
  'authorized page review updates the assignment projection exactly once'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-b"}',
  true
);
select extensions.throws_ok(
  $$select public.learning_assignment_launch_v1(
    '10000000-0000-4000-8000-000000000503'
  )$$,
  'P0002', 'learning assignment not found',
  'another learner in the same class cannot launch an unassigned assignment'
);
reset role;

savepoint assignment_learning_tenant_disabled;
update public.tenants
set learning_events_v2_enabled = false
where id = '10000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-a"}',
  true
);
select extensions.throws_ok(
  $$select public.learning_assignment_launch_v1(
    '10000000-0000-4000-8000-000000000503'
  )$$,
  'P0002', 'learning assignment not found',
  'tenant LearningEventV2 kill switch denies learner launch'
);
reset role;
rollback to savepoint assignment_learning_tenant_disabled;

savepoint assignment_learning_tenant_expired;
update public.tenants
set lifecycle_expires_at =
  lifecycle_retention_anchor_at + interval '1 microsecond'
where id = '10000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-a"}',
  true
);
select extensions.throws_ok(
  $$select public.learning_assignment_launch_v1(
    '10000000-0000-4000-8000-000000000503'
  )$$,
  'P0002', 'learning assignment not found',
  'expired synthetic tenant denies learner launch before retention cleanup'
);
reset role;
rollback to savepoint assignment_learning_tenant_expired;

savepoint assignment_learning_role_expired;
update public.role_bindings
set lifecycle_expires_at =
  lifecycle_retention_anchor_at + interval '1 microsecond'
where id = '10000000-0000-4000-8000-000000000206';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-a"}',
  true
);
select extensions.throws_ok(
  $$select public.learning_assignment_launch_v1(
    '10000000-0000-4000-8000-000000000503'
  )$$,
  'P0002', 'learning assignment not found',
  'expired learner role denies assignment launch'
);
reset role;
rollback to savepoint assignment_learning_role_expired;

savepoint assignment_learning_provider_expired;
update public.provider_identities
set lifecycle_expires_at =
  lifecycle_retention_anchor_at + interval '1 microsecond'
where issuer = 'urn:help-math:synthetic' and subject = 'learner-a';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-a"}',
  true
);
select extensions.throws_ok(
  $$select public.learning_assignment_launch_v1(
    '10000000-0000-4000-8000-000000000503'
  )$$,
  '42501', 'family identity is not mapped',
  'expired signed provider identity denies assignment launch'
);
reset role;
rollback to savepoint assignment_learning_provider_expired;

savepoint assignment_learning_enrollment_future;
update public.enrollments
set starts_at = current_date + 1
where id = '10000000-0000-4000-8000-000000000401';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-a"}',
  true
);
select extensions.throws_ok(
  $$select public.learning_assignment_launch_v1(
    '10000000-0000-4000-8000-000000000503'
  )$$,
  'P0002', 'learning assignment not found',
  'future enrollment denies assignment launch'
);
reset role;
rollback to savepoint assignment_learning_enrollment_future;

savepoint assignment_learning_school_inactive;
update public.schools
set active = false
where id = '10000000-0000-4000-8000-000000000101';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-a"}',
  true
);
select extensions.throws_ok(
  $$select public.learning_assignment_launch_v1(
    '10000000-0000-4000-8000-000000000503'
  )$$,
  'P0002', 'learning assignment not found',
  'inactive school denies assignment launch'
);
reset role;
rollback to savepoint assignment_learning_school_inactive;

savepoint assignment_learning_incomplete;
update public.assignment_learning_object_bindings
set active = false
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and assignment_id = '10000000-0000-4000-8000-000000000503'
  and page_ordinal = 39;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"learner-a"}',
  true
);
select extensions.throws_ok(
  $$select public.learning_assignment_launch_v1(
    '10000000-0000-4000-8000-000000000503'
  )$$,
  'P0002', 'learning assignment not found',
  'incomplete placement allowlist denies assignment launch'
);
reset role;
rollback to savepoint assignment_learning_incomplete;

-- Complete the disposable production-shape fixture far enough that the
-- synthetic-only binding trigger, rather than an unrelated teacher-binding
-- prerequisite, is the rejecting boundary under test.
insert into public.role_bindings (
  id, tenant_id, environment_id, data_mode, app_user_id, role,
  school_id, active
) values (
  '30000000-0000-4000-8000-000000000203',
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '10000000-0000-4000-8000-000000000013', 'teacher',
  '30000000-0000-4000-8000-000000000101', true
);
insert into public.class_staff_bindings (
  tenant_id, environment_id, data_mode, id, class_id, teacher_user_id, active
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '30000000-0000-4000-8000-000000000451',
  '30000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000013', true
);
insert into public.assignments (
  tenant_id, environment_id, data_mode, id, class_id, teacher_user_id,
  title, lesson_release_id, lesson_title, lesson_href, total_pages,
  assigned_at
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '30000000-0000-4000-8000-000000000503',
  '30000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000013', 'Production G4 L3',
  'lesson-g04-l03-negative-numbers', 'Negative Numbers', '/courses/4/3', 39,
  statement_timestamp()
);
insert into public.family_content_release_memberships (
  tenant_id, environment_id, data_mode, id, content_release_id,
  lesson_release_id, learning_object_version_id, published
) values (
  '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
  '30000000-0000-4000-8000-000000000551', 'production-forbidden-v2',
  'lesson-g04-l03-negative-numbers', 'production-forbidden-object-v1', true
);
select extensions.throws_ok(
  $$insert into public.assignment_learning_object_bindings (
    tenant_id, environment_id, data_mode, id, assignment_id, page_ordinal,
    placement_id, animation_id, content_release_membership_id
  ) values (
    '30000000-0000-4000-8000-000000000001', 'test.production', 'production',
    '30000000-0000-4000-8000-000000000851',
    '30000000-0000-4000-8000-000000000503', 1,
    'production-forbidden-placement-001',
    'course-g04-l03-ir-001-341242cc',
    '30000000-0000-4000-8000-000000000551'
  )$$,
  '23514', 'learning assignment binding is inconsistent',
  'production-mode assignment bindings fail closed in SQL'
);

-- 013: explicit guardian-tenant workspaces and the database-authoritative
-- lower bound for the approved Family messaging kill switch.
select extensions.has_column(
  'public', 'tenants', 'family_messaging_enabled',
  'tenants expose the default-off database messaging gate'
);
select extensions.is(
  (
    select column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = 'tenants'
      and column_name = 'family_messaging_enabled'
  ),
  'false',
  'new tenant messaging gates fail closed by default'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.family_workspace_for_tenant_v1(uuid,uuid)', 'execute'
  ), true,
  'authenticated guardians can execute only the tenant-scoped workspace RPC'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.family_workspace_unscoped_core_v1(uuid)', 'execute'
  ), false,
  'authenticated callers cannot execute the unscoped workspace core'
);
select extensions.is(
  has_function_privilege(
    'service_role',
    'public.family_workspace_for_tenant_v1(uuid,uuid)', 'execute'
  ), false,
  'service role is not a guardian workspace request identity'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.update_family_notification_preferences_for_tenant_v1(uuid,boolean,boolean,text)',
    'execute'
  ), true,
  'authenticated guardians can update preferences only through a tenant locator'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.update_family_notification_preferences_unscoped_core_v1(boolean,boolean,text)',
    'execute'
  ), false,
  'authenticated callers cannot execute ambiguous preference inference'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.send_family_message_pre_messaging_gate_v1(text,uuid,text,uuid,uuid,uuid,public.family_message_topic)',
    'execute'
  ), false,
  'authenticated callers cannot bypass the message gate through its core'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.is(
  (
    select string_agg(
      concat(tenant ->> 'id', ':', tenant ->> 'messagingEnabled'),
      ',' order by tenant ->> 'id'
    )
    from jsonb_array_elements(
      public.family_authorization_context_v1() -> 'tenants'
    ) as tenant
  ),
  '10000000-0000-4000-8000-000000000001:true,20000000-0000-4000-8000-000000000001:true',
  'server authorization context binds the database messaging gate to each tenant'
);
select extensions.ok(
  public.family_authorization_context_v1()::text !~
    '(providerIssuer|providerSubject|sessionId)',
  'browser-callable authorization context excludes provider and session identifiers'
);
select extensions.is(
  public.family_workspace_for_tenant_v1(
    '20000000-0000-4000-8000-000000000001', null
  ) ->> 'selectedChildId',
  '20000000-0000-4000-8000-000000000020',
  'a null child locator resolves only inside the explicitly selected Maple tenant'
);
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020'
  )$$,
  'P0002', 'family workspace not found',
  'a Cedar child cannot cross the explicit Maple tenant boundary'
);
select extensions.lives_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', true, false,
    'test.tenant.preference.cedar.001'
  )$$,
  'guardian can update Cedar preferences through the selected tenant'
);
select extensions.lives_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '20000000-0000-4000-8000-000000000001', true, false,
    'test.tenant.preference.maple.001'
  )$$,
  'the same guardian can independently update Maple preferences'
);
reset role;
select extensions.is(
  (
    select count(*)
    from public.family_notification_preferences
    where app_user_id = '10000000-0000-4000-8000-000000000010'
      and tenant_id in (
        '10000000-0000-4000-8000-000000000001',
        '20000000-0000-4000-8000-000000000001'
      )
  ), 2::bigint,
  'tenant preference writes never merge two authorized tenants'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.lives_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '20000000-0000-4000-8000-000000000001', true, false,
    'test.tenant.preference.maple.001'
  )$$,
  'exact tenant preference replay is idempotent'
);
select extensions.throws_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '20000000-0000-4000-8000-000000000001', false, false,
    'test.tenant.preference.maple.001'
  )$$,
  '22023', 'idempotency key conflict',
  'changed preference payload cannot reuse an idempotency key'
);
reset role;

select extensions.has_table(
  'public', 'family_notification_preference_mutations',
  'tenant preference mutation receipts exist'
);
select extensions.is(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.family_notification_preference_mutations'::regclass
  ), true,
  'tenant preference mutation receipts have RLS enabled'
);
select extensions.is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'family_notification_preference_mutations'
  ), 0::bigint,
  'tenant preference mutation receipts expose zero browser policies'
);
select extensions.is(
  has_table_privilege(
    'authenticated', 'public.family_notification_preference_mutations',
    'select'
  ) or has_table_privilege(
    'authenticated', 'public.family_notification_preference_mutations',
    'insert'
  ) or has_table_privilege(
    'authenticated', 'public.family_notification_preference_mutations',
    'update'
  ) or has_table_privilege(
    'authenticated', 'public.family_notification_preference_mutations',
    'delete'
  ), false,
  'authenticated has no direct preference receipt privilege'
);
select extensions.is(
  (
    select count(*)
    from unnest(array[
      'service_role', 'family_invitation_issuer', 'family_webhook_writer'
    ]) as principal(role_name)
    where has_table_privilege(
      principal.role_name,
      'public.family_notification_preference_mutations', 'select'
    ) or has_table_privilege(
      principal.role_name,
      'public.family_notification_preference_mutations', 'insert'
    ) or has_table_privilege(
      principal.role_name,
      'public.family_notification_preference_mutations', 'update'
    ) or has_table_privilege(
      principal.role_name,
      'public.family_notification_preference_mutations', 'delete'
    )
  ), 0::bigint,
  'infrastructure roles have no direct preference receipt privilege'
);
select extensions.is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'family_notification_preference_mutations'
      and column_name ~
        '(email|token|digest|ciphertext|body|message|provider|subject|student)'
  ), 2::bigint,
  'preference receipts contain only the approved message and digest booleans and no sensitive payload'
);
select extensions.is(
  (
    select count(*)
    from unnest(array[
      'public.family_workspace_unscoped_core_v1(uuid)',
      'public.relinquish_guardian_link_v1(uuid,text)',
      'public.update_family_notification_preferences_unscoped_core_v1(boolean,boolean,text)',
      'public.send_family_message_pre_messaging_gate_v1(text,uuid,text,uuid,uuid,uuid,public.family_message_topic)',
      'public.mark_family_thread_read_pre_messaging_gate_v1(uuid,text)',
      'public.close_family_thread_pre_messaging_gate_v1(uuid,text)',
      'public.authorize_school_announcement_publish_unscoped_core_v1(uuid)',
      'public.publish_school_announcement_pre_messaging_gate_v1(uuid,text,text,text,timestamp with time zone)',
      'public.admin_family_access_workspace_unscoped_core_v1()',
      'public.teacher_family_inbox_pre_messaging_gate_v1()',
      'public.teacher_announcement_schools_unscoped_core_v1()',
      'public.claim_family_notification_outbox_pre_messaging_gate_v1(integer)',
      'public.validate_family_notification_claim_pre_messaging_gate_v1(uuid,uuid)'
    ]) as core(signature)
    where has_function_privilege('authenticated', core.signature, 'execute')
  ), 0::bigint,
  'authenticated cannot execute any unscoped or pre-gate core'
);
select extensions.is(
  (
    select count(*)
    from unnest(array[
      'public.family_workspace_for_tenant_v1(uuid,uuid)',
      'public.update_family_notification_preferences_for_tenant_v1(uuid,boolean,boolean,text)',
      'public.send_family_message_v1(text,uuid,text,uuid,uuid,uuid,public.family_message_topic)',
      'public.mark_family_thread_read_v1(uuid,text)',
      'public.close_family_thread_v1(uuid,text)',
      'public.authorize_school_announcement_publish_v1(uuid)',
      'public.publish_school_announcement_v1(uuid,text,text,text,timestamp with time zone)',
      'public.admin_family_access_workspace_for_tenant_v1(uuid)',
      'public.teacher_family_inbox_for_tenant_v1(uuid)',
      'public.teacher_announcement_schools_for_tenant_v1(uuid)'
    ]) as scoped(signature)
    where has_function_privilege('authenticated', scoped.signature, 'execute')
  ), 10::bigint,
  'authenticated can execute the ten tenant-scoped or gated request RPCs'
);
select extensions.ok(
  not has_function_privilege(
    'service_role',
    'public.claim_family_notification_outbox_pre_messaging_gate_v1(integer)',
    'execute'
  ) and not has_function_privilege(
    'service_role',
    'public.validate_family_notification_claim_pre_messaging_gate_v1(uuid,uuid)',
    'execute'
  ) and has_function_privilege(
    'service_role', 'public.claim_family_notification_outbox_v1(integer)',
    'execute'
  ) and has_function_privilege(
    'service_role',
    'public.validate_family_notification_claim_v1(uuid,uuid)', 'execute'
  ),
  'service worker can execute only the lifecycle-aware outbox wrappers'
);
select extensions.ok(
  (
    select bool_and(
      strpos(pg_get_functiondef(signature), 'lock_family_messaging_tenant_v1') > 0
      and strpos(pg_get_functiondef(signature), 'lock_family_messaging_tenant_v1')
        < strpos(pg_get_functiondef(signature), core_marker)
    )
    from (values
      (
        'public.send_family_message_v1(text,uuid,text,uuid,uuid,uuid,public.family_message_topic)'::regprocedure,
        'send_family_message_pre_messaging_gate_v1'
      ),
      (
        'public.mark_family_thread_read_v1(uuid,text)'::regprocedure,
        'mark_family_thread_read_pre_messaging_gate_v1'
      ),
      (
        'public.close_family_thread_v1(uuid,text)'::regprocedure,
        'close_family_thread_pre_messaging_gate_v1'
      ),
      (
        'public.authorize_school_announcement_publish_v1(uuid)'::regprocedure,
        'authorize_school_announcement_publish_unscoped_core_v1'
      ),
      (
        'public.publish_school_announcement_v1(uuid,text,text,text,timestamp with time zone)'::regprocedure,
        'publish_school_announcement_pre_messaging_gate_v1'
      )
    ) as protected_write(signature, core_marker)
  ),
  'all messaging writes lock the authoritative tenant before any resource core'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.lives_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', true, true,
    'test.tenant.preference.nonadjacent.a'
  )$$,
  'first non-adjacent preference intent is accepted'
);
select extensions.lives_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', false, false,
    'test.tenant.preference.nonadjacent.b'
  )$$,
  'later preference intent supersedes the visible state'
);
select extensions.lives_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', true, true,
    'test.tenant.preference.nonadjacent.a'
  )$$,
  'late exact replay is accepted without applying stale intent'
);
reset role;
select extensions.is(
  (
    select message_email_enabled::text || ':' || weekly_digest_enabled::text
    from public.family_notification_preferences
    where tenant_id = '10000000-0000-4000-8000-000000000001'
      and app_user_id = '10000000-0000-4000-8000-000000000010'
  ), 'false:false',
  'late replay cannot roll visible preferences back'
);
select extensions.is(
  (
    select count(*)
    from public.family_notification_preference_mutations
    where tenant_id = '10000000-0000-4000-8000-000000000001'
      and app_user_id = '10000000-0000-4000-8000-000000000010'
      and client_mutation_id like 'test.tenant.preference.nonadjacent.%'
  ), 2::bigint,
  'each immutable non-adjacent preference intent has one receipt'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.throws_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', false, true,
    'test.tenant.preference.nonadjacent.a'
  )$$,
  '22023', 'idempotency key conflict',
  'late changed-payload replay fails closed'
);
reset role;

savepoint lifecycle_provider_identity;
update public.provider_identities
set lifecycle_expires_at = lifecycle_retention_anchor_at + interval '1 microsecond'
where issuer = 'urn:help-math:synthetic' and subject = 'guardian-a';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.throws_ok(
  'select public.family_authorization_context_v1()',
  '42501', 'family identity is not mapped',
  'expired provider identity cannot call the authorization context directly'
);
reset role;
rollback to savepoint lifecycle_provider_identity;

savepoint lifecycle_guardian_link;
update public.family_notification_preferences
set message_email_enabled = true
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and app_user_id = '10000000-0000-4000-8000-000000000010';
update public.guardian_links
set lifecycle_expires_at = lifecycle_retention_anchor_at + interval '1 microsecond'
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and guardian_user_id = '10000000-0000-4000-8000-000000000010'
  and status = 'active';
insert into public.notification_outbox (
  tenant_id, environment_id, data_mode, id, kind, recipient_user_id,
  recipient_email_digest, recipient_email_ciphertext, locale,
  idempotency_key, aggregate_type, aggregate_id, payload, status,
  claimed_at, claim_token, claim_expires_at, retention_anchor_at, expires_at
)
select
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000d170', 'family_message', actor.id,
  actor.notification_email_digest, actor.notification_email_ciphertext,
  actor.locale, 'test.lifecycle.guardian.outbox.001', 'family_thread',
  '10000000-0000-4000-8000-000000000901',
  '{"kind":"family_message"}'::jsonb, 'pending', statement_timestamp(),
  '10000000-0000-4000-8000-00000000d171',
  statement_timestamp() + interval '5 minutes', statement_timestamp(),
  statement_timestamp() + interval '30 days'
from public.app_users as actor
where actor.id = '10000000-0000-4000-8000-000000000010';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.throws_ok(
  $$select public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020'
  )$$,
  'P0002', 'family workspace not found',
  'expired guardian link immediately removes workspace access'
);
select extensions.throws_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', false, false,
    'test.lifecycle.guardian.preference.001'
  )$$,
  'P0002', 'family notification preference not found',
  'expired guardian link immediately removes preference access'
);
select extensions.throws_ok(
  $$select public.send_family_message_v1(
    'Expired guardian link must not send.', null,
    'test.lifecycle.guardian.send.001', null, null,
    '10000000-0000-4000-8000-000000000901', null
  )$$,
  'P0002', 'thread not found',
  'expired guardian link cannot send through the direct message RPC'
);
select extensions.throws_ok(
  $$select public.mark_family_thread_read_v1(
    '10000000-0000-4000-8000-000000000901',
    'test.lifecycle.guardian.read.001'
  )$$,
  'P0002', 'thread not found',
  'expired guardian link cannot mutate a read receipt'
);
select extensions.throws_ok(
  $$select public.close_family_thread_v1(
    '10000000-0000-4000-8000-000000000901',
    'test.lifecycle.guardian.close.001'
  )$$,
  'P0002', 'thread not found',
  'expired guardian link cannot close a thread'
);
select extensions.throws_ok(
  $$select public.relinquish_guardian_child_access_v1(
    '10000000-0000-4000-8000-000000000020',
    'test.lifecycle.guardian.relinquish.001'
  )$$,
  'P0002', 'guardian access not found',
  'expired guardian link cannot be relinquished through a stale direct retry'
);
reset role;
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.is(
  public.validate_family_notification_claim_v1(
    '10000000-0000-4000-8000-00000000d170',
    '10000000-0000-4000-8000-00000000d171'
  ), false,
  'expired guardian link invalidates a leased message notification'
);
reset role;
rollback to savepoint lifecycle_guardian_link;

savepoint lifecycle_workspace_rows;
update public.family_threads
set lifecycle_expires_at = lifecycle_retention_anchor_at + interval '1 microsecond'
where id = '10000000-0000-4000-8000-000000000901';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.ok(
  not exists (
    select 1
    from jsonb_array_elements(public.family_workspace_for_tenant_v1(
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000020'
    ) -> 'threads') as thread
    where thread ->> 'id' = '10000000-0000-4000-8000-000000000901'
  ),
  'expired thread is absent from the guardian workspace DTO'
);
reset role;
rollback to savepoint lifecycle_workspace_rows;

savepoint lifecycle_workspace_message;
insert into public.family_messages (
  tenant_id, environment_id, data_mode, id, thread_id, sender_user_id,
  idempotency_key, body, retention_anchor_at, expires_at
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000d180',
  '10000000-0000-4000-8000-000000000901',
  '10000000-0000-4000-8000-000000000012',
  'test.lifecycle.message.expired.001',
  'Expired synthetic body must never cross the Family DTO.',
  statement_timestamp() - interval '2 days',
  statement_timestamp() - interval '1 day'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.ok(
  not exists (
    select 1
    from jsonb_array_elements(public.family_workspace_for_tenant_v1(
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000020'
    ) -> 'threads') as thread
    cross join lateral jsonb_array_elements(thread -> 'messages') as message
    where message ->> 'id' = '10000000-0000-4000-8000-00000000d180'
  ),
  'expired message body is absent from bounded thread history'
);
reset role;
rollback to savepoint lifecycle_workspace_message;

savepoint lifecycle_preference;
update public.family_notification_preferences
set lifecycle_expires_at = lifecycle_retention_anchor_at + interval '1 microsecond'
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and app_user_id = '10000000-0000-4000-8000-000000000010';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.is(
  public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020'
  ) #>> '{notificationPreference,messageEmailEnabled}',
  'false',
  'expired preference is rendered as disabled instead of reused'
);
select extensions.throws_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', true, false,
    'test.lifecycle.preference.expired.001'
  )$$,
  'P0002', 'family notification preference not found',
  'expired preference cannot be silently revived before retention purge'
);
reset role;
rollback to savepoint lifecycle_preference;

savepoint lifecycle_teacher_role;
update public.role_bindings
set lifecycle_expires_at = lifecycle_retention_anchor_at + interval '1 microsecond'
where id = '10000000-0000-4000-8000-000000000b23';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"budget-teacher"}',
  true
);
select extensions.throws_ok(
  $$select public.teacher_family_inbox_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  )$$,
  '42501', 'teacher family access required',
  'expired teacher role cannot read the tenant inbox'
);
select extensions.throws_ok(
  $$select public.teacher_announcement_schools_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  )$$,
  '42501', 'teacher announcement access required',
  'expired teacher role cannot list announcement schools'
);
select extensions.throws_ok(
  $$select public.authorize_school_announcement_publish_v1(
    '10000000-0000-4000-8000-000000000101'
  )$$,
  'P0002', 'school announcement target not found',
  'expired teacher role cannot authorize announcement publishing'
);
reset role;
rollback to savepoint lifecycle_teacher_role;

savepoint lifecycle_thread_staff_identity;
update public.provider_identities
set lifecycle_expires_at = lifecycle_retention_anchor_at + interval '1 microsecond'
where app_user_id = '10000000-0000-4000-8000-000000000012'
  and active;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.ok(
  not exists (
    select 1
    from jsonb_array_elements(public.family_workspace_for_tenant_v1(
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000020'
    ) -> 'threads') as thread
    where thread ->> 'id' = '10000000-0000-4000-8000-000000000901'
  ),
  'thread with an expired staff provider identity is absent from Family DTOs'
);
select extensions.is(
  (
    select assignment ->> 'teacherDisplayName'
    from jsonb_array_elements(public.family_workspace_for_tenant_v1(
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000020'
    ) -> 'assignments') as assignment
    where assignment ->> 'id' = '10000000-0000-4000-8000-000000000501'
  ),
  'School staff',
  'expired teacher identity is replaced by a non-identifying assignment label'
);
reset role;
rollback to savepoint lifecycle_thread_staff_identity;

savepoint lifecycle_admin_role;
update public.role_bindings
set lifecycle_expires_at = lifecycle_retention_anchor_at + interval '1 microsecond'
where id = '10000000-0000-4000-8000-000000000204';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.throws_ok(
  $$select public.admin_family_access_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  )$$,
  '42501', 'family administrator access required',
  'expired administrator role cannot read the selected-tenant access workspace'
);
select extensions.throws_ok(
  $$select public.authorize_guardian_invitation_creation_v1(
    '10000000-0000-4000-8000-000000000020', repeat('9', 64),
    'test.lifecycle.admin.invitation.001'
  )$$,
  'P0002', 'student not found',
  'expired administrator role cannot mint an invitation issuer attestation'
);
reset role;
rollback to savepoint lifecycle_admin_role;

insert into public.family_threads (
  tenant_id, environment_id, data_mode, id, school_id, child_id,
  enrollment_id, guardian_user_id, staff_user_id, created_by_user_id,
  topic, status
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000d160',
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000020',
  '10000000-0000-4000-8000-000000000401',
  '10000000-0000-4000-8000-000000000010',
  '10000000-0000-4000-8000-000000000b12',
  '10000000-0000-4000-8000-000000000010', 'technical', 'open'
);

insert into public.notification_outbox (
  tenant_id, environment_id, data_mode, id, kind, recipient_user_id,
  recipient_email_digest, recipient_email_ciphertext, locale,
  idempotency_key, aggregate_type, aggregate_id, payload,
  retention_anchor_at, expires_at
)
select
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000d130', 'family_message', actor.id,
  actor.notification_email_digest, actor.notification_email_ciphertext,
  actor.locale, 'test.messaging.gate.pending.001', 'family_thread',
  '10000000-0000-4000-8000-00000000d160',
  '{"kind":"family_message"}'::jsonb,
  statement_timestamp(), statement_timestamp() + interval '30 days'
from public.app_users as actor
where actor.id = '10000000-0000-4000-8000-000000000010';

insert into public.notification_outbox (
  tenant_id, environment_id, data_mode, id, kind, recipient_user_id,
  recipient_email_digest, recipient_email_ciphertext, locale,
  idempotency_key, aggregate_type, aggregate_id, payload,
  retention_anchor_at, expires_at
)
select
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000d132', 'weekly_family_digest', actor.id,
  actor.notification_email_digest, actor.notification_email_ciphertext,
  actor.locale, 'test.messaging.gate.digest.pending.001', 'guardian_week',
  actor.id, jsonb_build_object(
    'kind', 'weekly_family_digest', 'activityCount', 0,
    'openAssignmentCount', 0, 'unreadThreadCount', 0
  ), statement_timestamp(), statement_timestamp() + interval '30 days'
from public.app_users as actor
where actor.id = '10000000-0000-4000-8000-000000000010';

update public.family_notification_preferences
set message_email_enabled = true, weekly_digest_enabled = true
where tenant_id = '10000000-0000-4000-8000-000000000001'
  and app_user_id = '10000000-0000-4000-8000-000000000010';
update public.tenants
set family_messaging_enabled = false
where id = '10000000-0000-4000-8000-000000000001';

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.is(
  public.enqueue_weekly_family_digests_v1(
    date_trunc('week', current_date - interval '7 days')::date, 1000
  ) ->> 'enqueued',
  '0',
  'disabled tenants never enqueue a new weekly digest recipient row'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.is(
  public.family_authorization_context_v1()
    #>> '{tenants,0,messagingEnabled}',
  'false',
  'authorization reflects a disabled tenant messaging gate'
);
select extensions.is(
  public.family_workspace_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', null
  ) ->> 'selectedChildId',
  '10000000-0000-4000-8000-000000000020',
  'messaging kill switch preserves read-only Family growth workspace access'
);
select extensions.throws_ok(
  $$select public.send_family_message_v1(
    'This disabled message must roll back.', null,
    'test.messaging.gate.send.denied.001', null, null,
    '10000000-0000-4000-8000-00000000d160', null
  )$$,
  '42501', 'family messaging disabled',
  'authenticated direct message RPC cannot bypass the tenant kill switch'
);
select extensions.throws_ok(
  $$select public.mark_family_thread_read_v1(
    '10000000-0000-4000-8000-00000000d160',
    'test.messaging.gate.read.denied.001'
  )$$,
  '42501', 'family messaging disabled',
  'authenticated read-receipt mutation cannot bypass the tenant kill switch'
);
select extensions.throws_ok(
  $$select public.close_family_thread_v1(
    '10000000-0000-4000-8000-00000000d160',
    'test.messaging.gate.close.denied.001'
  )$$,
  '42501', 'family messaging disabled',
  'authenticated close-thread mutation cannot bypass the tenant kill switch'
);
select extensions.throws_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', true, true,
    'test.messaging.gate.preference.denied.001'
  )$$,
  '42501', 'family messaging disabled',
  'disabled messaging prevents enabling family email preferences'
);
select extensions.lives_ok(
  $$select public.update_family_notification_preferences_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001', false, false,
    'test.messaging.gate.preference.disable.001'
  )$$,
  'disabled messaging still permits a guardian to turn email preferences off'
);
select extensions.throws_ok(
  $$select public.family_workspace_unscoped_core_v1(null::uuid)$$,
  '42501', 'permission denied for function family_workspace_unscoped_core_v1',
  'authenticated callers cannot fall back to the unscoped workspace core'
);
reset role;

select extensions.is(
  (
    select status::text || ':' || (claim_token is null)::text
    from public.notification_outbox
    where id = '10000000-0000-4000-8000-00000000d130'
  ),
  'cancelled:true',
  'turning messaging off terminalizes pending message egress and clears leases'
);
select extensions.is(
  (
    select status::text || ':' || (claim_token is null)::text
    from public.notification_outbox
    where id = '10000000-0000-4000-8000-00000000d132'
  ),
  'cancelled:true',
  'turning messaging off terminalizes opt-in weekly digest egress'
);

-- Simulate the narrow race where a database-owned insert commits after the
-- tenant-toggle trigger. The service wrapper must cancel it rather than return
-- it to an external mail transport.
insert into public.notification_outbox (
  tenant_id, environment_id, data_mode, id, kind, recipient_user_id,
  recipient_email_digest, recipient_email_ciphertext, locale,
  idempotency_key, aggregate_type, aggregate_id, payload,
  retention_anchor_at, expires_at
)
select
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000d131', 'family_message', actor.id,
  actor.notification_email_digest, actor.notification_email_ciphertext,
  actor.locale, 'test.messaging.gate.race.001', 'family_thread',
  '10000000-0000-4000-8000-00000000d160',
  '{"kind":"family_message"}'::jsonb,
  statement_timestamp(), statement_timestamp() + interval '30 days'
from public.app_users as actor
where actor.id = '10000000-0000-4000-8000-000000000010';
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
create temporary table test_messaging_gate_claims as
select * from public.claim_family_notification_outbox_v1(100);
reset role;
select extensions.ok(
  not exists (
    select 1 from test_messaging_gate_claims
    where id = '10000000-0000-4000-8000-00000000d131'
  ),
  'service claim never returns a disabled-tenant family-message notification'
);
select extensions.is(
  (
    select status::text || ':' || (claim_token is null)::text
    from public.notification_outbox
    where id = '10000000-0000-4000-8000-00000000d131'
  ),
  'cancelled:true',
  'claim race handling terminalizes disabled message egress'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"budget-teacher"}',
  true
);
select extensions.throws_ok(
  $$select public.teacher_family_inbox_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  )$$,
  '42501', 'family messaging disabled',
  'teacher inbox direct RPC is unavailable while tenant messaging is disabled'
);
select extensions.throws_ok(
  $$select * from public.publish_school_announcement_v1(
    '10000000-0000-4000-8000-000000000101',
    'Disabled announcement', 'This row must roll back.',
    'test.messaging.gate.announcement.denied.001', null
  )$$,
  '42501', 'family messaging disabled',
  'announcement publish direct RPC cannot bypass the messaging kill switch'
);
reset role;

savepoint messaging_gate_containment;
update public.tenants
set family_messaging_enabled = false
where id = '20000000-0000-4000-8000-000000000001';
insert into public.family_support_access_requests (
  tenant_id, environment_id, data_mode, id, school_id, thread_id,
  requestor_user_id, approver_user_id, reason, status,
  client_mutation_id, decision_idempotency_key, requested_at, decided_at,
  access_expires_at, retention_anchor_at, expires_at
)
select message.tenant_id, message.environment_id, message.data_mode,
  '10000000-0000-4000-8000-00000000e102', thread.school_id,
  message.thread_id, '10000000-0000-4000-8000-000000000013',
  '10000000-0000-4000-8000-000000000014',
  'Synthetic messaging incident review', 'approved',
  'test.support.seed.request.102', 'test.support.seed.approve.102',
  statement_timestamp(), statement_timestamp(),
  statement_timestamp() + interval '15 minutes', statement_timestamp(),
  statement_timestamp() + interval '30 days'
from public.family_messages as message
join public.family_threads as thread
  on thread.tenant_id = message.tenant_id and thread.id = message.thread_id
where message.id = '10000000-0000-4000-8000-000000000911';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.lives_ok(
  $$select public.revoke_guardian_link_v1(
    '10000000-0000-4000-8000-000000000801',
    'test.messaging.gate.revoke.001',
    'Messaging incident containment'
  )$$,
  'relationship revocation remains available while messaging is disabled'
);
select extensions.lives_ok(
  $$select public.redact_family_message_v1(
    '10000000-0000-4000-8000-000000000911',
    'Synthetic messaging incident review',
    'test.messaging.gate.redaction.001'
  )$$,
  'approved support redaction remains available while messaging is disabled'
);
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.lives_ok(
  $$select public.relinquish_guardian_child_access_v1(
    '20000000-0000-4000-8000-000000000020',
    'test.messaging.gate.relinquish.001'
  )$$,
  'guardian relinquishment remains available while messaging is disabled'
);
reset role;
rollback to savepoint messaging_gate_containment;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.lives_ok(
  $$select public.run_family_retention_v1(100)$$,
  'retention remains available while messaging is disabled'
);
reset role;

update public.tenants
set family_messaging_enabled = true
where id = '10000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"budget-teacher"}',
  true
);
select extensions.ok(
  jsonb_typeof(public.teacher_family_inbox_for_tenant_v1(
    '10000000-0000-4000-8000-000000000001'
  )) = 'object',
  'teacher inbox is available again after an explicit staged re-enable'
);
reset role;

-- Migration 014: controlled governance workflows, audited exact-thread support,
-- safe account activity, and invitation decline.
select extensions.has_table(
  'public', 'family_rights_requests', 'family rights request table exists'
);
select extensions.has_table(
  'public', 'family_invitation_suggestions',
  'teacher invitation suggestion table exists'
);
select extensions.has_table(
  'public', 'family_support_access_requests',
  'time-limited support access table exists'
);
select extensions.ok(
  (select relrowsecurity from pg_class
    where oid = 'public.family_rights_requests'::regclass),
  'family rights requests have RLS enabled'
);
select extensions.ok(
  (select relrowsecurity from pg_class
    where oid = 'public.family_invitation_suggestions'::regclass),
  'family invitation suggestions have RLS enabled'
);
select extensions.ok(
  (select relrowsecurity from pg_class
    where oid = 'public.family_support_access_requests'::regclass),
  'family support requests have RLS enabled'
);
select extensions.is(
  (select count(*) from pg_policies where schemaname = 'public'
    and tablename in (
      'family_rights_requests', 'family_invitation_suggestions',
      'family_support_access_requests'
    )), 0::bigint,
  'governance tables remain deny-by-default with no row policies'
);
select extensions.is(
  (select count(*) from unnest(array[
    'public.family_rights_requests',
    'public.family_invitation_suggestions',
    'public.family_support_access_requests'
  ]) as governed(name)
  where has_table_privilege('authenticated', governed.name, 'select,insert,update,delete')),
  0::bigint, 'authenticated has no governance base-table privileges'
);
select extensions.has_function(
  'public', 'family_governance_workspace_v1', array['uuid'],
  'guardian governance workspace RPC exists'
);
select extensions.has_function(
  'public', 'teacher_invitation_suggestion_workspace_v1', array['uuid'],
  'teacher suggestion workspace RPC exists'
);
select extensions.has_function(
  'public', 'admin_family_operations_workspace_v1', array['uuid'],
  'administrator operations workspace RPC exists'
);
select extensions.has_function(
  'public', 'family_support_case_v1', array['uuid', 'uuid'],
  'exact support case RPC exists'
);
select extensions.has_function(
  'public', 'create_family_rights_request_v1',
  array['uuid', 'uuid', 'family_rights_request_kind', 'text', 'text'],
  'guardian rights request mutation exists'
);
select extensions.has_function(
  'public', 'review_family_rights_request_v1',
  array['uuid', 'uuid', 'family_review_status', 'text'],
  'administrator rights review mutation exists'
);
select extensions.has_function(
  'public', 'create_family_invitation_suggestion_v1',
  array['uuid', 'uuid', 'text', 'text'],
  'teacher suggestion mutation exists'
);
select extensions.has_function(
  'public', 'review_family_invitation_suggestion_v1',
  array['uuid', 'uuid', 'family_invitation_suggestion_status', 'text'],
  'administrator suggestion review mutation exists'
);
select extensions.has_function(
  'public', 'create_family_support_access_request_v1',
  array['uuid', 'uuid', 'text', 'text'],
  'administrator support request mutation exists'
);
select extensions.has_function(
  'public', 'decide_family_support_access_request_v1',
  array['uuid', 'uuid', 'boolean', 'text', 'text'],
  'district support decision mutation exists'
);
select extensions.has_function(
  'public', 'decline_guardian_invitation_v1',
  array['text', 'text', 'text'], 'guardian invitation decline mutation exists'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.redact_family_message_governance_core_v1(uuid,text,text)',
    'execute'
  ), false, 'authenticated cannot bypass support-gated redaction core'
);
select extensions.is(
  has_function_privilege(
    'service_role', 'public.run_family_retention_v1(integer)', 'execute'
  ), true, 'service retention includes governance records'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.lives_ok(
  $$select public.create_family_rights_request_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020', 'correction',
    'Please review the fictional display label.',
    'test.governance.rights.create.001'
  )$$,
  'current guardian can create a reviewed correction request'
);
select set_config(
  'test.governance.rights.id',
  public.create_family_rights_request_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020', 'correction',
    'Please review the fictional display label.',
    'test.governance.rights.create.001'
  ) ->> 'requestId', true
);
select extensions.is(
  (public.family_governance_workspace_v1(
    '10000000-0000-4000-8000-000000000001'
  ) #>> '{rightsRequests,0,id}'),
  current_setting('test.governance.rights.id'),
  'guardian workspace returns the exact persisted request on replay'
);
select extensions.throws_ok(
  $$select public.create_family_rights_request_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000021', 'access', null,
    'test.governance.rights.cross.001'
  )$$,
  'P0002', 'family request not found',
  'guardian cannot submit a request for an unlinked child'
);
select extensions.ok(
  jsonb_array_length(public.family_governance_workspace_v1(
    '10000000-0000-4000-8000-000000000001'
  ) -> 'accountActivity') >= 1,
  'guardian account activity exposes a bounded safe audit summary'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"budget-teacher"}',
  true
);
select extensions.lives_ok(
  $$select public.create_family_invitation_suggestion_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020',
    'Family asked how to access the portal.',
    'test.governance.suggestion.create.001'
  )$$,
  'current classroom teacher can suggest a family invitation without granting access'
);
select set_config(
  'test.governance.suggestion.id',
  public.create_family_invitation_suggestion_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020',
    'Family asked how to access the portal.',
    'test.governance.suggestion.create.001'
  ) ->> 'suggestionId', true
);
select extensions.is(
  public.teacher_invitation_suggestion_workspace_v1(
    '10000000-0000-4000-8000-000000000001'
  ) #>> '{suggestions,0,id}',
  current_setting('test.governance.suggestion.id'),
  'teacher suggestion workspace returns its exact idempotent request'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.throws_ok(
  $$select public.create_family_invitation_suggestion_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000020', null,
    'test.governance.suggestion.guardian.001'
  )$$,
  'P0002', 'student not found',
  'guardian cannot call the teacher invitation suggestion boundary'
);
reset role;

insert into public.family_threads (
  tenant_id, environment_id, data_mode, id, school_id, child_id,
  enrollment_id, guardian_user_id, staff_user_id, created_by_user_id,
  topic, status
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000e400',
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000020',
  '10000000-0000-4000-8000-000000000401',
  '10000000-0000-4000-8000-000000000010',
  '10000000-0000-4000-8000-000000000b12',
  '10000000-0000-4000-8000-000000000013', 'technical', 'open'
);
insert into public.family_messages (
  tenant_id, environment_id, data_mode, id, thread_id, sender_user_id,
  idempotency_key, body, retention_anchor_at, expires_at
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000e401',
  '10000000-0000-4000-8000-00000000e400',
  '10000000-0000-4000-8000-000000000010',
  'test.governance.support.message.001',
  'Synthetic complaint content for exact-thread support testing.',
  statement_timestamp(), statement_timestamp() + interval '30 days'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.is(
  public.admin_family_operations_workspace_v1(
    '10000000-0000-4000-8000-000000000001'
  ) #>> '{rightsRequests,0,id}',
  current_setting('test.governance.rights.id'),
  'school administrator sees only its scoped family rights queue'
);
select extensions.lives_ok(
  format(
    'select public.review_family_rights_request_v1(%L,%L,%L,%L)',
    '10000000-0000-4000-8000-000000000001',
    current_setting('test.governance.rights.id'), 'completed',
    'test.governance.rights.review.001'
  ), 'school administrator can complete a controlled rights request'
);
select extensions.lives_ok(
  format(
    'select public.review_family_invitation_suggestion_v1(%L,%L,%L,%L)',
    '10000000-0000-4000-8000-000000000001',
    current_setting('test.governance.suggestion.id'), 'reviewed',
    'test.governance.suggestion.review.001'
  ), 'school administrator can review but does not automatically grant an invitation'
);
select extensions.lives_ok(
  $$select public.create_family_support_access_request_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-00000000e400',
    'Investigate the synthetic complaint for this exact thread.',
    'test.governance.support.create.001'
  )$$,
  'school administrator can request access to one opaque thread'
);
select set_config(
  'test.governance.support.id',
  public.create_family_support_access_request_v1(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-00000000e400',
    'Investigate the synthetic complaint for this exact thread.',
    'test.governance.support.create.001'
  ) ->> 'requestId', true
);
select extensions.is(
  public.admin_family_operations_workspace_v1(
    '10000000-0000-4000-8000-000000000001'
  ) #>> '{supportRequests,0,status}',
  'pending', 'support access remains pending before an independent decision'
);
select extensions.throws_ok(
  format(
    'select public.decide_family_support_access_request_v1(%L,%L,true,null,%L)',
    '10000000-0000-4000-8000-000000000001',
    current_setting('test.governance.support.id'),
    'test.governance.support.self.001'
  ), 'P0002', 'support request not found',
  'support requestor cannot self-approve exact-thread access'
);
select extensions.throws_ok(
  format(
    'select public.family_support_case_v1(%L,%L)',
    '10000000-0000-4000-8000-000000000001',
    current_setting('test.governance.support.id')
  ), 'P0002', 'support case not found',
  'pending request does not expose a family message body'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"district-admin"}',
  true
);
select extensions.lives_ok(
  format(
    'select public.decide_family_support_access_request_v1(%L,%L,true,%L,%L)',
    '10000000-0000-4000-8000-000000000001',
    current_setting('test.governance.support.id'),
    'Approved for synthetic incident review.',
    'test.governance.support.approve.001'
  ), 'different district administrator can approve a fifteen-minute grant'
);
select extensions.is(
  public.admin_family_operations_workspace_v1(
    '10000000-0000-4000-8000-000000000001'
  ) #>> '{supportRequests,0,status}',
  'approved', 'district operations queue records the approved support grant'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"school-admin"}',
  true
);
select extensions.is(
  public.family_support_case_v1(
    '10000000-0000-4000-8000-000000000001',
    current_setting('test.governance.support.id')::uuid
  ) #>> '{thread,id}',
  '10000000-0000-4000-8000-00000000e400',
  'approved requestor reads only the exact requested thread'
);
select extensions.is(
  public.family_support_case_v1(
    '10000000-0000-4000-8000-000000000001',
    current_setting('test.governance.support.id')::uuid
  ) #>> '{tenantDisplayName}',
  'Cedar Learning Lab',
  'approved exact-thread support case carries the reviewed tenant label'
);
select extensions.lives_ok(
  $$select public.redact_family_message_v1(
    '10000000-0000-4000-8000-00000000e401',
    'Synthetic complaint resolution', 'test.governance.redact.001'
  )$$,
  'approved support requestor can redact one message with a reason'
);
reset role;
select extensions.is(
  (select body from public.family_messages
    where id = '10000000-0000-4000-8000-00000000e401'),
  '[redacted]', 'approved support redaction leaves an immutable tombstone'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"budget-teacher"}',
  true
);
select extensions.throws_ok(
  format(
    'select public.family_support_case_v1(%L,%L)',
    '10000000-0000-4000-8000-000000000001',
    current_setting('test.governance.support.id')
  ), 'P0002', 'support case not found',
  'non-requestor teacher cannot read an approved support case'
);
select extensions.is(
  public.teacher_invitation_suggestion_workspace_v1(
    '10000000-0000-4000-8000-000000000001'
  ) #>> '{suggestions,0,status}',
  'reviewed', 'teacher can see the reviewed status of its own suggestion'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.is(
  public.family_governance_workspace_v1(
    '10000000-0000-4000-8000-000000000001'
  ) #>> '{rightsRequests,0,status}',
  'completed', 'guardian can see the reviewed outcome without a record mutation surface'
);
select extensions.lives_ok(
  $$select public.decline_guardian_invitation_v1(
    repeat('f', 64), repeat('e', 64), 'test.governance.decline.unknown.001'
  )$$,
  'unknown invitation decline is non-enumerating and returns no detail'
);
reset role;

insert into public.guardian_invitations (
  tenant_id, environment_id, data_mode, id, school_id, student_id,
  invited_by_user_id, recipient_email_digest, recipient_email_ciphertext,
  token_digest, create_idempotency_key, last_delivery_idempotency_key,
  expires_at, retention_anchor_at
) select
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000e201',
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000020',
  '10000000-0000-4000-8000-000000000013',
  guardian.notification_email_digest,
  guardian.notification_email_ciphertext, repeat('d', 64),
  'test.governance.decline.create.001',
  'test.governance.decline.delivery.001',
  statement_timestamp() + interval '7 days', statement_timestamp()
from public.app_users as guardian
where guardian.id = '10000000-0000-4000-8000-000000000010';
select set_config(
  'test.governance.decline.email',
  (select notification_email_digest from public.app_users
    where id = '10000000-0000-4000-8000-000000000010'),
  true
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"guardian-a"}',
  true
);
select extensions.lives_ok(
  $$select public.decline_guardian_invitation_v1(
    repeat('d', 64),
    current_setting('test.governance.decline.email'),
    'test.governance.decline.accepted.001'
  )$$,
  'verified adult can decline the one-time invitation without accepting a link'
);
select extensions.lives_ok(
  $$select public.decline_guardian_invitation_v1(
    repeat('d', 64),
    current_setting('test.governance.decline.email'),
    'test.governance.decline.accepted.001'
  )$$,
  'exact invitation decline replay is idempotent'
);
reset role;
select extensions.is(
  (select status::text from public.guardian_invitations
    where id = '10000000-0000-4000-8000-00000000e201'),
  'revoked', 'declining an invitation persists a terminal revoked state'
);

select extensions.has_table(
  'public', 'family_invitation_probe_windows',
  'signed-identity invitation probe budget table exists'
);
select extensions.ok(
  (select relrowsecurity from pg_catalog.pg_class
    where oid = 'public.family_invitation_probe_windows'::regclass),
  'invitation probe budget table has RLS enabled'
);
select extensions.is(
  (select count(*) from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'family_invitation_probe_windows'),
  0::bigint, 'invitation probe budget table has zero direct RLS policies'
);
select extensions.is(
  has_table_privilege(
    'authenticated', 'public.family_invitation_probe_windows', 'select'
  ) or has_table_privilege(
    'service_role', 'public.family_invitation_probe_windows', 'select'
  ), false,
  'browser and service roles have no direct invitation probe table read'
);
select extensions.is(
  (select count(*) from information_schema.columns
    where table_schema = 'public'
      and table_name = 'family_invitation_probe_windows'
      and column_name ~ '(token|email|issuer|subject|session|ip|body|cipher)'),
  0::bigint,
  'invitation probe budget stores no token email raw claim session IP or body'
);
select extensions.is(
  has_function_privilege(
    'authenticated',
    'public.accept_guardian_invitation_pre_probe_budget_v1(text,text,text)',
    'execute'
  ), false,
  'authenticated cannot bypass the invitation probe aggregate wrapper'
);
select extensions.alike(
  pg_get_functiondef(
    'private.consume_family_invitation_probe_budget_v1()'::regprocedure
  ),
  '%on conflict on constraint family_invitation_probe_windows_one_bucket%where family_invitation_probe_windows.request_count < v_limit%',
  'one atomic upsert serializes each signed-identity probe window'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"probe-budget-actor"}',
  true
);
select extensions.is_empty(
  $$select accepted.*
    from generate_series(1, 20) as attempt
    cross join lateral public.accept_guardian_invitation_v1(
      encode(extensions.digest('probe-budget-unknown-token', 'sha256'), 'hex'),
      encode(extensions.digest('probe-budget-unknown-email', 'sha256'), 'hex'),
      'test.probe.aggregate.' || lpad(attempt::text, 3, '0')
    ) as accepted$$,
  'twenty unknown tokens retain the same non-enumerating zero-row shape'
);
reset role;
select extensions.is(
  (select sum(request_count)
   from public.family_invitation_probe_windows
   where identity_digest = encode(extensions.digest(
     convert_to(
       'urn:help-math:synthetic' || chr(31) || 'probe-budget-actor',
       'UTF8'
     ), 'sha256'
   ), 'hex')),
  40::bigint,
  'twenty probes consume exactly twenty ten-minute and twenty daily slots'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"probe-budget-actor"}',
  true
);
select extensions.is_empty(
  $$select * from public.accept_guardian_invitation_v1(
    encode(extensions.digest('probe-budget-unknown-token-21', 'sha256'), 'hex'),
    encode(extensions.digest('probe-budget-unknown-email', 'sha256'), 'hex'),
    'test.probe.aggregate.021'
  )$$,
  'the exhausted signed-identity window keeps the zero-row invitation shape'
);
reset role;
select extensions.is(
  (select sum(request_count)
   from public.family_invitation_probe_windows
   where identity_digest = encode(extensions.digest(
     convert_to(
       'urn:help-math:synthetic' || chr(31) || 'probe-budget-actor',
       'UTF8'
     ), 'sha256'
   ), 'hex')),
  40::bigint,
  'a denied probe consumes neither aggregate window'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"probe-budget-other"}',
  true
);
select extensions.is_empty(
  $$select * from public.accept_guardian_invitation_v1(
    'malformed-token', 'malformed-email', 'test.probe.other.001'
  )$$,
  'a separate signed identity receives an independent malformed-probe budget'
);
reset role;
select extensions.is(
  (select sum(request_count)
   from public.family_invitation_probe_windows
   where identity_digest = encode(extensions.digest(
     convert_to(
       'urn:help-math:synthetic' || chr(31) || 'probe-budget-other',
       'UTF8'
     ), 'sha256'
   ), 'hex')),
  2::bigint,
  'one malformed probe consumes one slot in each independent window'
);
select extensions.ok(
  not exists (
    select 1 from public.family_invitation_probe_windows
    where identity_digest !~ '^[0-9a-f]{64}$'
      or identity_digest in ('probe-budget-actor', 'probe-budget-other')
  ),
  'probe counters retain only fixed-length claim digests'
);

select extensions.is(
  (select sum(request_count)
   from public.family_invitation_probe_windows
   where identity_digest = encode(extensions.digest(
     convert_to(
       'urn:help-math:synthetic' || chr(31) || 'abuse-success-guardian',
       'UTF8'
     ), 'sha256'
   ), 'hex')),
  2::bigint,
  'the first successful acceptance charged exactly one aggregate attempt'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","iss":"urn:help-math:synthetic","sub":"abuse-success-guardian"}',
  true
);
select extensions.is(
  (select count(*) from public.accept_guardian_invitation_v1(
    encode(extensions.digest('abuse-success-token', 'sha256'), 'hex'),
    encode(extensions.digest('abuse-success-email', 'sha256'), 'hex'),
    'test.abuse.accept.success.001'
  )),
  1::bigint, 'exact committed acceptance replay still returns its one receipt'
);
reset role;
select extensions.is(
  (select sum(request_count)
   from public.family_invitation_probe_windows
   where identity_digest = encode(extensions.digest(
     convert_to(
       'urn:help-math:synthetic' || chr(31) || 'abuse-success-guardian',
       'UTF8'
     ), 'sha256'
   ), 'hex')),
  2::bigint, 'exact committed acceptance replay consumes no aggregate slot'
);

update public.family_invitation_probe_windows
set window_started_at = statement_timestamp() - interval '2 days',
    retention_anchor_at = statement_timestamp() - interval '2 days',
    expires_at = statement_timestamp() - interval '1 second'
where identity_digest = encode(extensions.digest(
  convert_to(
    'urn:help-math:synthetic' || chr(31) || 'probe-budget-other',
    'UTF8'
  ), 'sha256'
), 'hex');

insert into public.family_rights_requests (
  tenant_id, environment_id, data_mode, id, guardian_user_id, student_id,
  request_kind, details, client_mutation_id,
  retention_anchor_at, expires_at
) values (
  '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
  '10000000-0000-4000-8000-00000000e301',
  '10000000-0000-4000-8000-000000000010',
  '10000000-0000-4000-8000-000000000020', 'access', null,
  'test.governance.retention.001', statement_timestamp() - interval '30 days',
  statement_timestamp() - interval '1 second'
);
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.lives_ok(
  $$select public.run_family_retention_v1(1000)$$,
  'service retention processes expired governance workflow records'
);
reset role;
select extensions.is(
  (select count(*) from public.family_rights_requests
    where id = '10000000-0000-4000-8000-00000000e301'),
  0::bigint, 'expired governance record is deleted by bounded retention'
);
select extensions.is(
  (select count(*) from public.family_invitation_probe_windows
   where identity_digest = encode(extensions.digest(
     convert_to(
       'urn:help-math:synthetic' || chr(31) || 'probe-budget-other',
       'UTF8'
     ), 'sha256'
   ), 'hex')),
  0::bigint, 'service retention removes expired global invitation probe windows'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select extensions.lives_ok(
  $$select public.begin_family_tenant_teardown_v1(
    '20000000-0000-4000-8000-000000000001',
    'test.tenant.teardown.order.001'
  )$$,
  'service teardown disables staffed classes before their teacher roles'
);
select extensions.lives_ok(
  $$select public.begin_family_tenant_teardown_v1(
    '20000000-0000-4000-8000-000000000001',
    'test.tenant.teardown.order.001'
  )$$,
  'exact tenant teardown replay is idempotent'
);
reset role;
select extensions.is(
  (select status::text from public.tenants
    where id = '20000000-0000-4000-8000-000000000001'),
  'closed', 'tenant teardown persists a terminal closed tenant'
);
select extensions.is(
  (select count(*) from public.class_staff_bindings
    where tenant_id = '20000000-0000-4000-8000-000000000001' and active),
  0::bigint, 'tenant teardown leaves no active class staff bindings'
);
select extensions.is(
  (select count(*) from public.role_bindings
    where tenant_id = '20000000-0000-4000-8000-000000000001' and active),
  0::bigint, 'tenant teardown leaves no active role bindings'
);
select extensions.is(
  (select status::text from public.guardian_links
    where id = '20000000-0000-4000-8000-000000000801'),
  'expired', 'tenant teardown expires the active guardian relationship'
);
select extensions.is(
  (select count(*) from public.family_threads
    where tenant_id = '20000000-0000-4000-8000-000000000001'
      and status = 'open'),
  0::bigint, 'tenant teardown leaves no open family message threads'
);

select * from extensions.finish();
rollback;
