import 'server-only';

import {Pool} from 'pg';

import type {AuthSession} from './auth-session';

export const NOVA_CLASS_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type PolicyRow = {
  class_id: string;
  school_id: string;
  school_allowed: boolean;
  class_enabled: boolean;
  role: 'teacher' | 'student';
};

export type NovaClassAccess = Readonly<{
  classId: string;
  schoolId: string;
  role: 'teacher' | 'student';
  allowed: boolean;
}>;

export type NovaSchoolSetting = Readonly<{
  id: string;
  name: string;
  allowed: boolean;
  version: number;
}>;

export type NovaClassSetting = Readonly<{
  id: string;
  schoolId: string;
  name: string;
  schoolName: string;
  schoolAllowed: boolean;
  enabled: boolean;
  version: number;
}>;

let policyPool: Pool | undefined;

function database() {
  const url = process.env.NOVA_POLICY_DATABASE_URL;
  if (!url || !/^postgres(?:ql)?:\/\//u.test(url)) {
    throw new Error('Nova class policy database is unavailable');
  }
  if (!policyPool) {
    policyPool = new Pool({
      connectionString: url,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    policyPool.on('error', () => {
      // A later query will report the unavailable database to its caller.
    });
  }
  return policyPool;
}

function identityFrom(session: AuthSession) {
  return session.status === 'signed-in' && session.enterpriseIdentity
    ? {
        clerkSubject: session.providerSubject,
        connectionId: session.enterpriseIdentity.connectionId,
        idpSubject: session.enterpriseIdentity.subject,
      }
    : null;
}

/** A browser-supplied class ID is only a lookup key; membership comes from the session. */
export async function readNovaClassAccess(
  classId: string | undefined,
  session: AuthSession,
): Promise<NovaClassAccess | null> {
  const identity = identityFrom(session);
  if (!classId || !NOVA_CLASS_ID_PATTERN.test(classId) || !identity) return null;
  const {rows} = await database().query<PolicyRow>(`
    SELECT c.id AS class_id, c.school_id,
           s.teacher_choice_allowed AS school_allowed,
           c.nova_enabled AS class_enabled, cm.role
      FROM nova_classes c
      JOIN nova_schools s ON s.id = c.school_id
      JOIN nova_class_memberships cm
        ON cm.class_id = c.id AND cm.school_id = c.school_id
      JOIN nova_school_memberships sm
        ON sm.school_id = c.school_id AND sm.idp_subject = cm.idp_subject
       AND sm.role = cm.role
     WHERE c.id = $1 AND cm.idp_subject = $3
       AND s.sso_connection_id = $2
     LIMIT 1
  `, [classId, identity.connectionId,
    identity.idpSubject]);
  const row = rows[0];
  if (!row) return null;
  return {
    classId: row.class_id,
    schoolId: row.school_id,
    role: row.role,
    allowed: row.school_allowed && row.class_enabled,
  };
}

export async function listNovaSettings(session: AuthSession): Promise<{
  schools: NovaSchoolSetting[];
  classes: NovaClassSetting[];
}> {
  const identity = identityFrom(session);
  if (!identity) return {schools: [], classes: []};
  const sql = database();
  const [schoolRows, classRows] = await Promise.all([
    sql.query<{
      id: string; name: string; allowed: boolean; version: number;
    }>(`
      SELECT s.id, s.name, s.teacher_choice_allowed AS allowed,
             s.policy_version AS version
        FROM nova_schools s
        JOIN nova_school_memberships m ON m.school_id = s.id
       WHERE m.idp_subject = $1 AND m.role = 'admin'
         AND s.sso_connection_id = $2
       ORDER BY s.name, s.id
    `, [identity.idpSubject, identity.connectionId]),
    sql.query<{
      id: string; school_id: string; name: string; school_name: string;
      school_allowed: boolean; enabled: boolean; version: number;
    }>(`
      SELECT c.id, c.school_id, c.name, s.name AS school_name,
             s.teacher_choice_allowed AS school_allowed,
             c.nova_enabled AS enabled, c.policy_version AS version
        FROM nova_classes c
        JOIN nova_schools s ON s.id = c.school_id
        JOIN nova_class_memberships cm
          ON cm.class_id = c.id AND cm.school_id = c.school_id
        JOIN nova_school_memberships sm
          ON sm.school_id = c.school_id AND sm.idp_subject = cm.idp_subject
       WHERE cm.idp_subject = $1 AND cm.role = 'teacher'
         AND sm.role = 'teacher'
         AND s.sso_connection_id = $2
       ORDER BY s.name, c.name, c.id
    `, [identity.idpSubject, identity.connectionId]),
  ]);
  const schools = schoolRows.rows;
  const classes = classRows.rows;
  return {
    schools,
    classes: classes.map((row) => ({
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      schoolName: row.school_name,
      schoolAllowed: row.school_allowed,
      enabled: row.enabled,
      version: row.version,
    })),
  };
}

/** Compare-and-swap plus audit in one statement. Disabling a school clears its classes. */
export async function setNovaSchoolPolicy(input: {
  schoolId: string;
  session: AuthSession;
  enabled: boolean;
  version: number;
}): Promise<number | null> {
  const identity = identityFrom(input.session);
  if (!identity || !NOVA_CLASS_ID_PATTERN.test(input.schoolId)) return null;
  const {rows} = await database().query<{version: number}>(`
    WITH before AS (
      SELECT s.id, s.teacher_choice_allowed
        FROM nova_schools s
        JOIN nova_school_memberships m ON m.school_id = s.id
       WHERE s.id = $1 AND s.policy_version = $2
         AND m.idp_subject = $6 AND m.role = 'admin'
         AND s.sso_connection_id = $5
       FOR UPDATE OF s
    ), changed AS (
      UPDATE nova_schools s
         SET teacher_choice_allowed = $3,
             policy_version = s.policy_version + 1
        FROM before b
       WHERE s.id = b.id
       RETURNING s.id, s.policy_version, b.teacher_choice_allowed AS previous
    ), reset_classes AS (
      UPDATE nova_classes c
         SET nova_enabled = false, policy_version = c.policy_version + 1
       WHERE c.school_id IN (SELECT id FROM changed)
         AND $3 = false AND c.nova_enabled = true
       RETURNING c.id, c.school_id
    ), audit_school AS (
      INSERT INTO nova_policy_audit
        (school_id, actor_subject, action, previous_value, next_value)
      SELECT id, $4, 'school_allow', previous, $3 FROM changed
    ), audit_classes AS (
      INSERT INTO nova_policy_audit
        (school_id, class_id, actor_subject, action, previous_value, next_value)
      SELECT school_id, id, $4, 'class_enable', true, false FROM reset_classes
    )
    SELECT policy_version AS version FROM changed
  `, [input.schoolId, input.version, input.enabled,
    identity.clerkSubject, identity.connectionId,
    identity.idpSubject]);
  return rows[0]?.version ?? null;
}

/** Only the class's teacher can enable it; a school lock serializes against this write. */
export async function setNovaClassPolicy(input: {
  classId: string;
  session: AuthSession;
  enabled: boolean;
  version: number;
}): Promise<number | null> {
  const identity = identityFrom(input.session);
  if (!identity || !NOVA_CLASS_ID_PATTERN.test(input.classId)) return null;
  const {rows} = await database().query<{version: number}>(`
    WITH before AS (
      SELECT c.id, c.nova_enabled
        FROM nova_classes c
        JOIN nova_schools s ON s.id = c.school_id
        JOIN nova_class_memberships cm
          ON cm.class_id = c.id AND cm.school_id = c.school_id
        JOIN nova_school_memberships sm
          ON sm.school_id = c.school_id AND sm.idp_subject = cm.idp_subject
       WHERE c.id = $1 AND c.policy_version = $2
         AND cm.idp_subject = $6 AND cm.role = 'teacher'
         AND sm.role = 'teacher'
         AND s.sso_connection_id = $5
         AND ($3 = false OR s.teacher_choice_allowed = true)
       FOR UPDATE OF s, c
    ), changed AS (
      UPDATE nova_classes c
         SET nova_enabled = $3, policy_version = c.policy_version + 1
        FROM before b
       WHERE c.id = b.id
       RETURNING c.id, c.school_id, c.policy_version, b.nova_enabled AS previous
    ), audit AS (
      INSERT INTO nova_policy_audit
        (school_id, class_id, actor_subject, action, previous_value, next_value)
      SELECT school_id, id, $4, 'class_enable', previous, $3 FROM changed
    )
    SELECT policy_version AS version FROM changed
  `, [input.classId, input.version, input.enabled,
    identity.clerkSubject, identity.connectionId,
    identity.idpSubject]);
  return rows[0]?.version ?? null;
}
