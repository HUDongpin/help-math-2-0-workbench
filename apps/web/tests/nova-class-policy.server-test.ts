import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {after, before, it} from 'node:test';
import {Pool} from 'pg';

import type {AuthSession} from '../lib/auth-session';
import {
  listNovaSettings,
  readNovaClassAccess,
  setNovaClassPolicy,
  setNovaSchoolPolicy,
} from '../lib/nova-class-policy.server';

const testUrl = process.env.NOVA_POLICY_TEST_DATABASE_URL;
const localDatabase = testUrl && /^(?:postgres|postgresql):\/\/127\.0\.0\.1:\d+\//u.test(testUrl);
const schoolId = randomUUID();
const otherSchoolId = randomUUID();
const classId = randomUUID();
const otherClassId = randomUUID();
const connectionId = `test-${randomUUID()}`;
const wrongConnectionId = `test-${randomUUID()}`;
const pool = localDatabase ? new Pool({connectionString: testUrl}) : null;

function session(subject: string, connection = connectionId): AuthSession {
  return {
    status: 'signed-in',
    provider: 'clerk',
    providerSubject: `clerk-${subject}`,
    sessionId: `session-${subject}`,
    enterpriseIdentity: {connectionId: connection, subject},
  };
}

before(async () => {
  if (!pool || !testUrl) return;
  process.env.NOVA_POLICY_DATABASE_URL = testUrl;
  const migration = await readFile(new URL('../db/001_nova_class_policy.sql', import.meta.url), 'utf8');
  await pool.query(migration);
  await pool.query(`
    INSERT INTO nova_schools (id, name, sso_connection_id) VALUES
      ($1, 'Synthetic school', $3), ($2, 'Other school', $4)
  `, [schoolId, otherSchoolId, connectionId, connectionId]);
  await pool.query(`
    INSERT INTO nova_school_memberships (school_id, idp_subject, role) VALUES
      ($1, 'admin', 'admin'), ($1, 'teacher', 'teacher'),
      ($1, 'student', 'student'), ($2, 'other-teacher', 'teacher')
  `, [schoolId, otherSchoolId]);
  await pool.query(`
    INSERT INTO nova_classes (id, school_id, name) VALUES
      ($1, $3, 'Class A'), ($2, $4, 'Class B')
  `, [classId, otherClassId, schoolId, otherSchoolId]);
  await pool.query(`
    INSERT INTO nova_class_memberships (class_id, school_id, idp_subject, role) VALUES
      ($1, $2, 'teacher', 'teacher'), ($1, $2, 'student', 'student'),
      ($3, $4, 'other-teacher', 'teacher')
  `, [classId, schoolId, otherClassId, otherSchoolId]);
});

after(async () => {
  if (!pool) return;
  await pool.query('DELETE FROM nova_policy_audit WHERE school_id = ANY($1::uuid[])',
    [[schoolId, otherSchoolId]]);
  await pool.query('DELETE FROM nova_schools WHERE id = ANY($1::uuid[])',
    [[schoolId, otherSchoolId]]);
  await pool.end();
});

it('enforces school lock, class membership, version checks, revocation, and SSO binding',
  {skip: !localDatabase}, async () => {
    const teacher = session('teacher');
    const admin = session('admin');
    const student = session('student');
    assert.equal((await readNovaClassAccess(classId, student))?.allowed, false);
    assert.equal(await readNovaClassAccess(classId, session('visitor')), null);
    assert.equal(await readNovaClassAccess(otherClassId, teacher), null);
    assert.equal(await readNovaClassAccess(classId, session('student', wrongConnectionId)), null);
    assert.equal(await setNovaClassPolicy({classId, session: teacher, enabled: true, version: 1}), null);
    assert.equal(await setNovaSchoolPolicy({schoolId, session: teacher, enabled: true, version: 1}), null);
    assert.equal(await setNovaSchoolPolicy({schoolId, session: admin, enabled: true, version: 1}), 2);
    assert.equal((await readNovaClassAccess(classId, student))?.allowed, false);
    assert.equal(await setNovaClassPolicy({classId, session: student, enabled: true, version: 1}), null);
    assert.equal(await setNovaClassPolicy({classId, session: teacher, enabled: true, version: 1}), 2);
    assert.equal(await setNovaClassPolicy({classId, session: teacher, enabled: false, version: 1}), null);
    assert.equal((await readNovaClassAccess(classId, student))?.allowed, true);
    assert.equal((await listNovaSettings(teacher)).classes.length, 1);
    assert.equal((await listNovaSettings(admin)).schools.length, 1);
    assert.equal(await setNovaSchoolPolicy({schoolId, session: admin, enabled: false, version: 2}), 3);
    assert.equal((await readNovaClassAccess(classId, student))?.allowed, false);
    assert.equal(await setNovaSchoolPolicy({schoolId, session: admin, enabled: true, version: 3}), 4);
    assert.equal((await readNovaClassAccess(classId, student))?.allowed, false);
    const audit = await pool!.query('SELECT action FROM nova_policy_audit WHERE school_id = $1', [schoolId]);
    assert.equal(audit.rowCount, 5);
  });
