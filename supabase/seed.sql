-- Fully fictional local seed for the HELP Math family portal.
-- No row is derived from HELP Math 1.0, a real school, or a real person.

begin;

insert into public.tenants (
  id, slug, display_name, environment_id, data_mode,
  family_portal_enabled, family_messaging_enabled,
  learning_events_v2_enabled, status
) values
  ('10000000-0000-4000-8000-000000000001', 'cedar-lab',
    'Cedar Learning Lab', 'local.synthetic', 'synthetic',
    true, true, true, 'active'),
  ('20000000-0000-4000-8000-000000000001', 'maple-lab',
    'Maple Learning Lab', 'local.synthetic', 'synthetic',
    true, true, false, 'active');

insert into public.tenant_identity_issuers (
  tenant_id, environment_id, data_mode, issuer, active
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    'urn:help-math:synthetic', true),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    'urn:help-math:synthetic', true);

insert into public.family_invitation_issuer_configs (
  tenant_id, environment_id, data_mode, issuer, audience, active,
  not_before, expires_at
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    'urn:help-math:synthetic:invitation-issuer', 'authenticated', true,
    '2026-01-01T00:00:00Z', '2099-01-01T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    'urn:help-math:synthetic:invitation-issuer', 'authenticated', true,
    '2026-01-01T00:00:00Z', '2099-01-01T00:00:00Z');

insert into public.app_users (
  id, display_name, locale, notification_email_digest,
  notification_email_ciphertext, status
) values
  ('10000000-0000-4000-8000-000000000010', 'Avery Guardian', 'en',
    repeat('a', 64), 'v1.synthetic.avery.email.ciphertext', 'active'),
  ('10000000-0000-4000-8000-000000000011', 'Blake Guardian', 'es',
    repeat('b', 64), 'v1.synthetic.blake.email.ciphertext', 'active'),
  ('10000000-0000-4000-8000-000000000012', 'Casey Teacher', 'en',
    repeat('c', 64), 'v1.synthetic.casey.email.ciphertext', 'active'),
  ('10000000-0000-4000-8000-000000000013', 'Drew School Admin', 'en',
    null, null, 'active'),
  ('10000000-0000-4000-8000-000000000014', 'Emery District Admin', 'en',
    null, null, 'active'),
  ('10000000-0000-4000-8000-000000000015', 'Finley Learner', 'en',
    null, null, 'active'),
  ('10000000-0000-4000-8000-000000000016', 'Gray Learner', 'es',
    null, null, 'active'),
  ('20000000-0000-4000-8000-000000000010', 'Harper Guardian', 'en',
    repeat('d', 64), 'v1.synthetic.harper.email.ciphertext', 'active'),
  ('20000000-0000-4000-8000-000000000012', 'Indigo Teacher', 'en',
    repeat('e', 64), 'v1.synthetic.indigo.email.ciphertext', 'active'),
  ('20000000-0000-4000-8000-000000000013', 'Jordan School Admin', 'en',
    null, null, 'active'),
  ('20000000-0000-4000-8000-000000000015', 'Kai Learner', 'en',
    null, null, 'active');

insert into public.provider_identities (
  issuer, subject, app_user_id, active
) values
  ('urn:help-math:synthetic', 'guardian-a',
    '10000000-0000-4000-8000-000000000010', true),
  ('urn:help-math:synthetic', 'guardian-b',
    '10000000-0000-4000-8000-000000000011', true),
  ('urn:help-math:synthetic', 'teacher-a',
    '10000000-0000-4000-8000-000000000012', true),
  ('urn:help-math:synthetic', 'school-admin',
    '10000000-0000-4000-8000-000000000013', true),
  ('urn:help-math:synthetic', 'district-admin',
    '10000000-0000-4000-8000-000000000014', true),
  ('urn:help-math:synthetic', 'learner-a',
    '10000000-0000-4000-8000-000000000015', true),
  ('urn:help-math:synthetic', 'learner-b',
    '10000000-0000-4000-8000-000000000016', true),
  ('urn:help-math:synthetic', 'guardian-maple',
    '20000000-0000-4000-8000-000000000010', true),
  ('urn:help-math:synthetic', 'teacher-maple',
    '20000000-0000-4000-8000-000000000012', true),
  ('urn:help-math:synthetic', 'admin-maple',
    '20000000-0000-4000-8000-000000000013', true),
  ('urn:help-math:synthetic', 'learner-maple',
    '20000000-0000-4000-8000-000000000015', true);

insert into public.schools (
  tenant_id, environment_id, data_mode, id, school_key, display_name, active
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000101', 'cedar-school',
    'Cedar Demonstration School', true),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000101', 'maple-school',
    'Maple Demonstration School', true);

insert into public.students (
  tenant_id, environment_id, data_mode, id, school_id, local_reference,
  display_name, grade_label, locale, active
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000020',
    '10000000-0000-4000-8000-000000000101', 'CEDAR-001',
    'Finley Student', 'Grade 4', 'en', true),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000021',
    '10000000-0000-4000-8000-000000000101', 'CEDAR-002',
    'Gray Student', 'Grade 4', 'es', true),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000020',
    '20000000-0000-4000-8000-000000000101', 'MAPLE-001',
    'Kai Student', 'Grade 5', 'en', true);

insert into public.role_bindings (
  id, tenant_id, environment_id, data_mode, app_user_id, role,
  school_id, student_id, active
) values
  ('10000000-0000-4000-8000-000000000201',
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000010', 'guardian', null, null, true),
  ('10000000-0000-4000-8000-000000000202',
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000011', 'guardian', null, null, true),
  ('10000000-0000-4000-8000-000000000203',
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000012', 'teacher',
    '10000000-0000-4000-8000-000000000101', null, true),
  ('10000000-0000-4000-8000-000000000204',
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000013', 'school_admin',
    '10000000-0000-4000-8000-000000000101', null, true),
  ('10000000-0000-4000-8000-000000000205',
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000014', 'district_admin', null, null, true),
  ('10000000-0000-4000-8000-000000000206',
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000015', 'learner', null,
    '10000000-0000-4000-8000-000000000020', true),
  ('10000000-0000-4000-8000-000000000207',
    '10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000016', 'learner', null,
    '10000000-0000-4000-8000-000000000021', true),
  ('20000000-0000-4000-8000-000000000201',
    '20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000010', 'guardian', null, null, true),
  ('20000000-0000-4000-8000-000000000202',
    '20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000010', 'guardian', null, null, true),
  ('20000000-0000-4000-8000-000000000203',
    '20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000012', 'teacher',
    '20000000-0000-4000-8000-000000000101', null, true),
  ('20000000-0000-4000-8000-000000000204',
    '20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000013', 'school_admin',
    '20000000-0000-4000-8000-000000000101', null, true),
  ('20000000-0000-4000-8000-000000000206',
    '20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000015', 'learner', null,
    '20000000-0000-4000-8000-000000000020', true);

insert into public.classes (
  tenant_id, environment_id, data_mode, id, school_id, display_name,
  grade_label, academic_term, active
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000301',
    '10000000-0000-4000-8000-000000000101', 'Cedar Grade 4',
    'Grade 4', 'Synthetic Fall', true),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000301',
    '20000000-0000-4000-8000-000000000101', 'Maple Grade 5',
    'Grade 5', 'Synthetic Fall', true);

insert into public.enrollments (
  tenant_id, environment_id, data_mode, id, student_id, class_id, status,
  starts_at
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000401',
    '10000000-0000-4000-8000-000000000020',
    '10000000-0000-4000-8000-000000000301', 'active', current_date),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000402',
    '10000000-0000-4000-8000-000000000021',
    '10000000-0000-4000-8000-000000000301', 'active', current_date),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000401',
    '20000000-0000-4000-8000-000000000020',
    '20000000-0000-4000-8000-000000000301', 'active', current_date);

insert into public.class_staff_bindings (
  tenant_id, environment_id, data_mode, id, class_id, teacher_user_id, active
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000451',
    '10000000-0000-4000-8000-000000000301',
    '10000000-0000-4000-8000-000000000012', true),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000451',
    '20000000-0000-4000-8000-000000000301',
    '20000000-0000-4000-8000-000000000012', true);

insert into public.assignments (
  tenant_id, environment_id, data_mode, id, class_id, teacher_user_id,
  title, lesson_release_id, lesson_title, lesson_href, total_pages,
  family_note, assigned_at, due_at
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000501',
    '10000000-0000-4000-8000-000000000301',
    '10000000-0000-4000-8000-000000000012', 'Fraction Review',
    'synthetic-g04-l03-v1', 'Fractions on a Number Line', '/courses/4/3',
    39, 'Review pages 1 through 5 together.',
    statement_timestamp() - interval '2 days',
    statement_timestamp() + interval '5 days'),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000501',
    '20000000-0000-4000-8000-000000000301',
    '20000000-0000-4000-8000-000000000012', 'Decimal Review',
    'synthetic-g05-l04-v1', 'Decimals and Place Value', '/courses/5/4',
    54, null, statement_timestamp() - interval '1 day',
    statement_timestamp() + interval '6 days'),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000503',
    '10000000-0000-4000-8000-000000000301',
    '10000000-0000-4000-8000-000000000012',
    'G4 L3 signed-in learner slice',
    'lesson-g04-l03-negative-numbers', 'Negative Numbers', '/courses/4/3',
    39, 'Synthetic-only browser LearningEventV2 verification assignment.',
    statement_timestamp() - interval '1 hour',
    statement_timestamp() + interval '7 days');

insert into public.family_content_release_memberships (
  tenant_id, environment_id, data_mode, id, content_release_id,
  lesson_release_id, learning_object_version_id, skill_id, skill_name,
  published
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000551', 'synthetic-content-v1',
    'synthetic-g04-l03-v1', 'synthetic-object-v1',
    'synthetic.fractions.compare', 'Compare fractions', true),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000551', 'synthetic-content-v1',
    'synthetic-g05-l04-v1', 'synthetic-object-v1',
    'synthetic.decimals.place-value', 'Decimal place value', true);

insert into public.family_content_release_memberships (
  tenant_id, environment_id, data_mode, id, content_release_id,
  lesson_release_id, learning_object_version_id, skill_id, skill_name,
  published
)
select
  '10000000-0000-4000-8000-000000000001'::uuid,
  'local.synthetic',
  'synthetic'::public.parent_portal_data_mode,
  ('10000000-0000-4000-8100-' || lpad(page.ordinal::text, 12, '0'))::uuid,
  'synthetic-g04-l03-browser-v2',
  'lesson-g04-l03-negative-numbers',
  page.placement_id || '-v1',
  null,
  null,
  true
from (values
  (1, 'g04-l03-placement-001'),
  (2, 'g04-l03-placement-002'),
  (3, 'g04-l03-placement-003'),
  (4, 'g04-l03-placement-004'),
  (5, 'g04-l03-placement-005'),
  (6, 'g04-l03-placement-006'),
  (7, 'g04-l03-placement-007'),
  (8, 'g04-l03-placement-008'),
  (9, 'g04-l03-placement-009'),
  (10, 'g04-l03-placement-010'),
  (11, 'g04-l03-placement-011'),
  (12, 'g04-l03-placement-012'),
  (13, 'g04-l03-placement-013'),
  (14, 'g04-l03-placement-014'),
  (15, 'g04-l03-placement-015'),
  (16, 'g04-l03-placement-016'),
  (17, 'g04-l03-placement-017'),
  (18, 'g04-l03-placement-018'),
  (19, 'g04-l03-placement-019'),
  (20, 'g04-l03-placement-020'),
  (21, 'g04-l03-placement-021'),
  (22, 'g04-l03-placement-022'),
  (23, 'g04-l03-placement-023'),
  (24, 'g04-l03-placement-024'),
  (25, 'g04-l03-placement-025'),
  (26, 'g04-l03-placement-026'),
  (27, 'g04-l03-placement-027'),
  (28, 'g04-l03-placement-028'),
  (29, 'g04-l03-placement-029'),
  (30, 'g04-l03-placement-030'),
  (31, 'g04-l03-placement-031'),
  (32, 'g04-l03-placement-032'),
  (33, 'g04-l03-placement-033'),
  (34, 'g04-l03-placement-034'),
  (35, 'g04-l03-placement-035'),
  (36, 'g04-l03-placement-036'),
  (37, 'g04-l03-placement-037'),
  (38, 'g04-l03-placement-038'),
  (39, 'g04-l03-placement-039')
) as page(ordinal, placement_id);

insert into public.assignment_learning_object_bindings (
  tenant_id, environment_id, data_mode, id, assignment_id, page_ordinal,
  placement_id, animation_id, content_release_membership_id, active
)
select
  '10000000-0000-4000-8000-000000000001'::uuid,
  'local.synthetic',
  'synthetic'::public.parent_portal_data_mode,
  ('10000000-0000-4000-8200-' || lpad(page.ordinal::text, 12, '0'))::uuid,
  '10000000-0000-4000-8000-000000000503'::uuid,
  page.ordinal,
  page.animation_id,
  page.animation_id,
  membership.id,
  true
from (values
  (1, 'g04-l03-placement-001', 'course-g04-l03-ir-001-341242cc'),
  (2, 'g04-l03-placement-002', 'course-g04-l03-rw-002'),
  (3, 'g04-l03-placement-003', 'course-g04-l03-rw-003'),
  (4, 'g04-l03-placement-004', 'course-g04-l03-rw-004'),
  (5, 'g04-l03-placement-005', 'course-g04-l03-vb-002'),
  (6, 'g04-l03-placement-006', 'course-g04-l03-vb-003'),
  (7, 'g04-l03-placement-007', 'course-g04-l03-vb-004'),
  (8, 'g04-l03-placement-008', 'course-g04-l03-vb-005'),
  (9, 'g04-l03-placement-009', 'course-g04-l03-vb-006'),
  (10, 'g04-l03-placement-010', 'course-g04-l03-vb-007'),
  (11, 'g04-l03-placement-011', 'course-g04-l03-vb-008'),
  (12, 'g04-l03-placement-012', 'course-g04-l03-vb-009'),
  (13, 'g04-l03-placement-013', 'course-g04-l03-in-002'),
  (14, 'g04-l03-placement-014', 'course-g04-l03-in-003'),
  (15, 'g04-l03-placement-015', 'course-g04-l03-in-004'),
  (16, 'g04-l03-placement-016', 'course-g04-l03-in-005'),
  (17, 'g04-l03-placement-017', 'course-g04-l03-in-006'),
  (18, 'g04-l03-placement-018', 'course-g04-l03-in-007'),
  (19, 'g04-l03-placement-019', 'course-g04-l03-in-008'),
  (20, 'g04-l03-placement-020', 'course-g04-l03-in-009'),
  (21, 'g04-l03-placement-021', 'course-g04-l03-in-010'),
  (22, 'g04-l03-placement-022', 'course-g04-l03-in-011'),
  (23, 'g04-l03-placement-023', 'course-g04-l03-in-012'),
  (24, 'g04-l03-placement-024', 'course-g04-l03-ti-002'),
  (25, 'g04-l03-placement-025', 'course-g04-l03-ti-003'),
  (26, 'g04-l03-placement-026', 'course-g04-l03-ti-004'),
  (27, 'g04-l03-placement-027', 'course-g04-l03-ti-005'),
  (28, 'g04-l03-placement-028', 'course-g04-l03-ti-006'),
  (29, 'g04-l03-placement-029', 'course-g04-l03-gs-002'),
  (30, 'g04-l03-placement-030', 'course-g04-l03-ts-002'),
  (31, 'g04-l03-placement-031', 'course-g04-l03-ts-003'),
  (32, 'g04-l03-placement-032', 'course-g04-l03-ts-004'),
  (33, 'g04-l03-placement-033', 'course-g04-l03-ts-005'),
  (34, 'g04-l03-placement-034', 'course-g04-l03-ts-006'),
  (35, 'g04-l03-placement-035', 'course-g04-l03-ts-007'),
  (36, 'g04-l03-placement-036', 'course-g04-l03-ts-008'),
  (37, 'g04-l03-placement-037', 'course-g04-l03-fq-001'),
  (38, 'g04-l03-placement-038', 'course-g04-l03-fq-002'),
  (39, 'g04-l03-placement-039', 'course-g04-l03-fq-003')
) as page(ordinal, learning_object_key, animation_id)
join public.family_content_release_memberships as membership
  on membership.tenant_id =
    '10000000-0000-4000-8000-000000000001'::uuid
  and membership.content_release_id = 'synthetic-g04-l03-browser-v2'
  and membership.lesson_release_id = 'lesson-g04-l03-negative-numbers'
  and membership.learning_object_version_id = page.learning_object_key || '-v1';

insert into public.student_assignments (
  tenant_id, environment_id, data_mode, id, enrollment_id, assignment_id,
  status, reviewed_pages, started_at
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000601',
    '10000000-0000-4000-8000-000000000401',
    '10000000-0000-4000-8000-000000000501', 'in_progress', 7,
    statement_timestamp() - interval '1 day'),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000602',
    '10000000-0000-4000-8000-000000000402',
    '10000000-0000-4000-8000-000000000501', 'not_started', 0, null),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000601',
    '20000000-0000-4000-8000-000000000401',
    '20000000-0000-4000-8000-000000000501', 'in_progress', 3,
    statement_timestamp() - interval '12 hours'),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000603',
    '10000000-0000-4000-8000-000000000401',
    '10000000-0000-4000-8000-000000000503', 'not_started', 0, null);

insert into public.progress_projections_v1 (
  tenant_id, environment_id, data_mode, id, student_id, assignment_id,
  lesson_release_id, lesson_title, reviewed_pages, total_pages,
  last_activity_at, computed_at, stale, support_title, support_description,
  support_source, retention_anchor_at, expires_at
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000701',
    '10000000-0000-4000-8000-000000000020',
    '10000000-0000-4000-8000-000000000501', 'synthetic-g04-l03-v1',
    'Fractions on a Number Line', 7, 39, statement_timestamp() - interval '1 hour',
    statement_timestamp(), false, 'Try a visual model',
    'Use the approved fraction strip activity before the next review.',
    'approved_curriculum', statement_timestamp(),
    statement_timestamp() + interval '30 days'),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000701',
    '20000000-0000-4000-8000-000000000020',
    '20000000-0000-4000-8000-000000000501', 'synthetic-g05-l04-v1',
    'Decimals and Place Value', 3, 54, statement_timestamp() - interval '2 hours',
    statement_timestamp(), false, null, null, null, statement_timestamp(),
    statement_timestamp() + interval '30 days');

insert into public.skill_projections_v1 (
  tenant_id, environment_id, data_mode, id, student_id, skill_id, skill_name,
  band, evidence_count, explanation, window_starts_at, window_ends_at,
  computed_at, stale, retention_anchor_at, expires_at
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000711',
    '10000000-0000-4000-8000-000000000020', 'synthetic.fractions.compare',
    'Compare fractions', 'growing', 8,
    'Recent synthetic evidence shows consistent progress with visual models.',
    statement_timestamp() - interval '14 days', statement_timestamp(),
    statement_timestamp(), false, statement_timestamp(),
    statement_timestamp() + interval '30 days'),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000711',
    '20000000-0000-4000-8000-000000000020', 'synthetic.decimals.place-value',
    'Decimal place value', 'starting', 4,
    'Synthetic evidence is still limited for this skill.',
    statement_timestamp() - interval '14 days', statement_timestamp(),
    statement_timestamp(), false, statement_timestamp(),
    statement_timestamp() + interval '30 days');

insert into public.guardian_links (
  tenant_id, environment_id, data_mode, id, guardian_user_id, student_id,
  relationship_kind, status, created_by_user_id, verified_at, revoked_at
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000801',
    '10000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000020', 'parent', 'active',
    '10000000-0000-4000-8000-000000000013', statement_timestamp(), null),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000802',
    '10000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000021', 'parent', 'active',
    '10000000-0000-4000-8000-000000000013', statement_timestamp(), null),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000803',
    '10000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000020', 'caregiver', 'revoked',
    '10000000-0000-4000-8000-000000000013', statement_timestamp() - interval '5 days',
    statement_timestamp() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000801',
    '20000000-0000-4000-8000-000000000010',
    '20000000-0000-4000-8000-000000000020', 'parent', 'active',
    '20000000-0000-4000-8000-000000000013', statement_timestamp(), null),
  ('20000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '20000000-0000-4000-8000-000000000802',
    '10000000-0000-4000-8000-000000000010',
    '20000000-0000-4000-8000-000000000020', 'parent', 'active',
    '20000000-0000-4000-8000-000000000013', statement_timestamp(), null);

insert into public.family_threads (
  tenant_id, environment_id, data_mode, id, school_id, child_id,
  enrollment_id, guardian_user_id, staff_user_id, created_by_user_id,
  topic, status
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000901',
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000020',
    '10000000-0000-4000-8000-000000000401',
    '10000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000010', 'progress', 'open'),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000902',
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000021',
    '10000000-0000-4000-8000-000000000402',
    '10000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000011', 'assignment', 'open');

insert into public.family_messages (
  tenant_id, environment_id, data_mode, id, thread_id, sender_user_id,
  idempotency_key, body, retention_anchor_at, expires_at
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000911',
    '10000000-0000-4000-8000-000000000901',
    '10000000-0000-4000-8000-000000000012', 'seed.msg.casey.001',
    'Finley made steady progress in the fictional fraction activity.',
    statement_timestamp(), statement_timestamp() + interval '30 days'),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000912',
    '10000000-0000-4000-8000-000000000902',
    '10000000-0000-4000-8000-000000000011', 'seed.msg.blake.001',
    'Could you suggest a fictional review activity for tonight?',
    statement_timestamp(), statement_timestamp() + interval '30 days');

insert into public.family_notification_preferences (
  tenant_id, environment_id, data_mode, app_user_id,
  message_email_enabled, weekly_digest_enabled, locale, idempotency_key
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000010', true, true, 'en',
    'seed.preference.avery'),
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000011', false, false, 'es',
    'seed.preference.blake');

insert into public.school_announcements (
  tenant_id, environment_id, data_mode, id, school_id, publisher_user_id,
  idempotency_key, title, body, published_at, retention_anchor_at, expires_at
) values
  ('10000000-0000-4000-8000-000000000001', 'local.synthetic', 'synthetic',
    '10000000-0000-4000-8000-000000000921',
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000013', 'seed.announcement.001',
    'Fictional family math evening',
    'This synthetic announcement exists only for local portal verification.',
    statement_timestamp(), statement_timestamp(),
    statement_timestamp() + interval '30 days');

insert into public.retention_policies (
  tenant_id, environment_id, data_mode, data_class, retention_days,
  legal_hold, enabled, approved_at, approved_by_user_id, updated_by_user_id
)
select
  tenant.id, tenant.environment_id, tenant.data_mode, data_class, 30,
  false, true, statement_timestamp(), admin.id, admin.id
from (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid,
      '10000000-0000-4000-8000-000000000013'::uuid),
    ('20000000-0000-4000-8000-000000000001'::uuid,
      '20000000-0000-4000-8000-000000000013'::uuid)
) as selected(tenant_id, admin_id)
join public.tenants as tenant on tenant.id = selected.tenant_id
join public.app_users as admin on admin.id = selected.admin_id
cross join unnest(enum_range(null::public.retention_data_class)) as data_class;

commit;
