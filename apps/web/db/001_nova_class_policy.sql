-- Apply to an isolated Neon database before enabling classroom access.
-- Identity is the immutable Clerk subject established by a reviewed district SSO connection.
CREATE TABLE IF NOT EXISTS nova_schools (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  sso_connection_id text NOT NULL CHECK (length(sso_connection_id) BETWEEN 1 AND 160),
  teacher_choice_allowed boolean NOT NULL DEFAULT false,
  policy_version integer NOT NULL DEFAULT 1 CHECK (policy_version > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nova_schools_sso_connection_idx
  ON nova_schools(sso_connection_id);

CREATE TABLE IF NOT EXISTS nova_school_memberships (
  school_id uuid NOT NULL REFERENCES nova_schools(id) ON DELETE CASCADE,
  idp_subject text NOT NULL CHECK (length(idp_subject) BETWEEN 1 AND 320),
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  PRIMARY KEY (school_id, idp_subject)
);

CREATE TABLE IF NOT EXISTS nova_classes (
  id uuid PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES nova_schools(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  nova_enabled boolean NOT NULL DEFAULT false,
  policy_version integer NOT NULL DEFAULT 1 CHECK (policy_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, school_id)
);

CREATE TABLE IF NOT EXISTS nova_class_memberships (
  class_id uuid NOT NULL,
  school_id uuid NOT NULL,
  idp_subject text NOT NULL,
  role text NOT NULL CHECK (role IN ('teacher', 'student')),
  PRIMARY KEY (class_id, idp_subject),
  FOREIGN KEY (class_id, school_id) REFERENCES nova_classes(id, school_id) ON DELETE CASCADE,
  FOREIGN KEY (school_id, idp_subject)
    REFERENCES nova_school_memberships(school_id, idp_subject) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS nova_class_memberships_subject_idx
  ON nova_class_memberships(idp_subject, class_id);

CREATE TABLE IF NOT EXISTS nova_policy_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES nova_schools(id),
  class_id uuid REFERENCES nova_classes(id),
  actor_subject text NOT NULL,
  action text NOT NULL CHECK (action IN ('school_allow', 'class_enable')),
  previous_value boolean NOT NULL,
  next_value boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
