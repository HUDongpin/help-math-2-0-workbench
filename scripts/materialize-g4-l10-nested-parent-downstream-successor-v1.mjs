#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {
  buildCourseTraceSpecs,
  canonicalJson,
} from "./build-course-trace-specs.mjs";
import {
  isPristineGeneratedStructuralRefresh,
  materializeLessonReleaseStructuralKeyframes,
} from "./materialize-lesson-release-structural-keyframes.mjs";
import {
  materializeReleaseSourceEvidencedCoverageV2,
} from "./materialize-release-source-evidenced-coverage-v2.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE =
  "scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.mjs";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const RELEASE_INDEX_RELATIVE =
  `migrations/lesson-release-trace-spec-indexes/${RELEASE_ID}.json`;
const RELEASE_CATALOG_RELATIVE = "catalog/lesson-releases.json";
const KEYFRAME_TEMPLATE_RELATIVE = "templates/flash-migration/keyframes.csv";
const NESTED_PARENT_REPORT_RELATIVE =
  "reports/g4-l10-nested-declared-parent-static-composites.json";
const HISTORICAL_PREAPPLY_SUITE_RELATIVE =
  "scripts/materialize-g4-l10-nested-declared-parent-static-composites.preapply-tests.mjs";
const CURRENT_POSTAPPLY_SUITE_RELATIVE =
  "scripts/materialize-g4-l10-nested-declared-parent-static-composites.test.mjs";
const REPORT_JSON_RELATIVE =
  "reports/g4-l10-nested-parent-downstream-successor-v1.json";
const REPORT_MD_RELATIVE =
  "reports/g4-l10-nested-parent-downstream-successor-v1.md";
const LOCK_RELATIVE =
  ".g4-l10-nested-parent-downstream-successor-v1.lock";
const ARCHIVE_PARENT_RELATIVE =
  "work/g4-l10-nested-parent-downstream-preimages";
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const execFile = promisify(execFileCallback);

/*
 * This deliberately small native boundary performs only a same-parent,
 * no-replace rename.  It has no recursive path walking, deletion, overwrite,
 * or project-root authority.  JavaScript pins and supplies the exact parent
 * and source identities; the helper repeats those checks descriptor-relative
 * immediately before and after renameatx_np.
 */
const DARWIN_NATIVE_NO_REPLACE_MOVER_SOURCE = String.raw`#define _DARWIN_C_SOURCE 1

#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

static void fail(const char *message) {
  const int saved_errno = errno;
  if (saved_errno != 0) {
    fprintf(stderr, "%s: %s\n", message, strerror(saved_errno));
  } else {
    fprintf(stderr, "%s\n", message);
  }
  exit(1);
}

static uint64_t parse_u64(const char *value, const char *label) {
  char *end = NULL;
  errno = 0;
  const uintmax_t parsed = strtoumax(value, &end, 10);
  if (errno != 0 || end == value || *end != '\0' || parsed > UINT64_MAX) {
    errno = 0;
    fprintf(stderr, "%s is not a canonical unsigned integer\n", label);
    exit(2);
  }
  return (uint64_t)parsed;
}

static void validate_leaf(const char *value, const char *label) {
  if (value[0] == '\0' || strcmp(value, ".") == 0 || strcmp(value, "..") == 0 ||
      strchr(value, '/') != NULL) {
    errno = 0;
    fprintf(stderr, "%s must be one safe leaf\n", label);
    exit(2);
  }
}

static int type_matches(mode_t mode, const char *expected_type) {
  if (strcmp(expected_type, "file") == 0) return S_ISREG(mode);
  if (strcmp(expected_type, "directory") == 0) return S_ISDIR(mode);
  return 0;
}

static uint64_t stat_mtime_ns(const struct stat *value) {
  if (value->st_mtimespec.tv_sec < 0 || value->st_mtimespec.tv_nsec < 0) {
    errno = 0;
    fail("negative source modification time is unsupported");
  }
  return ((uint64_t)value->st_mtimespec.tv_sec * UINT64_C(1000000000)) +
         (uint64_t)value->st_mtimespec.tv_nsec;
}

static uint64_t stat_ctime_ns(const struct stat *value) {
  if (value->st_ctimespec.tv_sec < 0 || value->st_ctimespec.tv_nsec < 0) {
    errno = 0;
    fail("negative source change time is unsupported");
  }
  return ((uint64_t)value->st_ctimespec.tv_sec * UINT64_C(1000000000)) +
         (uint64_t)value->st_ctimespec.tv_nsec;
}

static int source_matches_expected(
    const struct stat *value,
    const char *expected_type,
    uint64_t expected_dev,
    uint64_t expected_ino,
    uint64_t expected_uid,
    uint64_t expected_mode,
    uint64_t expected_nlink,
    uint64_t expected_size,
    uint64_t expected_mtime_ns,
    uint64_t expected_ctime_ns,
    int require_ctime) {
  return type_matches(value->st_mode, expected_type) &&
    (uint64_t)value->st_dev == expected_dev &&
    (uint64_t)value->st_ino == expected_ino &&
    (uint64_t)value->st_uid == expected_uid &&
    (uint64_t)(value->st_mode & 0777) == expected_mode &&
    (uint64_t)value->st_nlink == expected_nlink &&
    (uint64_t)value->st_size == expected_size &&
    stat_mtime_ns(value) == expected_mtime_ns &&
    (!require_ctime || stat_ctime_ns(value) == expected_ctime_ns);
}

static int same_full_identity(const struct stat *left, const struct stat *right) {
  return (uint64_t)left->st_dev == (uint64_t)right->st_dev &&
    (uint64_t)left->st_ino == (uint64_t)right->st_ino &&
    (uint64_t)left->st_uid == (uint64_t)right->st_uid &&
    (uint64_t)(left->st_mode & 0777) == (uint64_t)(right->st_mode & 0777) &&
    (uint64_t)left->st_nlink == (uint64_t)right->st_nlink &&
    (uint64_t)left->st_size == (uint64_t)right->st_size &&
    stat_mtime_ns(left) == stat_mtime_ns(right) &&
    stat_ctime_ns(left) == stat_ctime_ns(right);
}

int main(int argc, char **argv) {
  if (argc != 18) {
    fprintf(stderr,
      "usage: %s <move|delete> <parent> <source-leaf> <target-leaf> "
      "<parent-dev> <parent-ino> <parent-uid> <parent-mode> <source-dev> "
      "<source-ino> <source-uid> <source-mode> <source-nlink> <source-size> "
      "<source-mtime-ns> <source-ctime-ns> <file|directory>\n", argv[0]);
    return 2;
  }

  const char *operation = argv[1];
  if (strcmp(operation, "move") != 0 && strcmp(operation, "delete") != 0) {
    errno = 0;
    fail("operation must be move or delete");
  }
  validate_leaf(argv[3], "source leaf");
  validate_leaf(argv[4], "target leaf");
  const uint64_t parent_dev = parse_u64(argv[5], "parent device");
  const uint64_t parent_ino = parse_u64(argv[6], "parent inode");
  const uint64_t parent_uid = parse_u64(argv[7], "parent owner");
  const uint64_t parent_mode = parse_u64(argv[8], "parent mode");
  const uint64_t source_dev = parse_u64(argv[9], "source device");
  const uint64_t source_ino = parse_u64(argv[10], "source inode");
  const uint64_t source_uid = parse_u64(argv[11], "source owner");
  const uint64_t source_mode = parse_u64(argv[12], "source mode");
  const uint64_t source_nlink = parse_u64(argv[13], "source link count");
  const uint64_t source_size = parse_u64(argv[14], "source size");
  const uint64_t source_mtime_ns = parse_u64(argv[15], "source modification time");
  const uint64_t source_ctime_ns = parse_u64(argv[16], "source change time");
  const char *source_type = argv[17];
  if (strcmp(source_type, "file") != 0 && strcmp(source_type, "directory") != 0) {
    errno = 0;
    fail("source type must be file or directory");
  }
  if (strcmp(operation, "delete") == 0 && strcmp(source_type, "file") != 0) {
    errno = 0;
    fail("delete operation accepts only ordinary files");
  }

  const int parent_fd = open(argv[2], O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
  if (parent_fd < 0) fail("cannot open pinned move parent");
  struct stat parent_before;
  if (fstat(parent_fd, &parent_before) != 0) fail("cannot stat pinned move parent");
  if (!S_ISDIR(parent_before.st_mode) ||
      (uint64_t)parent_before.st_dev != parent_dev ||
      (uint64_t)parent_before.st_ino != parent_ino ||
      (uint64_t)parent_before.st_uid != parent_uid || parent_before.st_uid != geteuid() ||
      (uint64_t)(parent_before.st_mode & 0777) != parent_mode ||
      (parent_before.st_mode & 0022) != 0) {
    errno = 0;
    fail("move parent identity, owner, or mode contract changed");
  }

  struct stat unexpected_target;
  if (fstatat(parent_fd, argv[4], &unexpected_target, AT_SYMLINK_NOFOLLOW) == 0) {
    errno = EEXIST;
    fail("no-replace move target already exists");
  }
  if (errno != ENOENT) fail("cannot establish target absence under pinned parent");

  int source_open_flags = O_RDONLY | O_NOFOLLOW | O_CLOEXEC;
  if (strcmp(source_type, "directory") == 0) source_open_flags |= O_DIRECTORY;
  const int source_fd = openat(parent_fd, argv[3], source_open_flags);
  if (source_fd < 0) fail("cannot open move source under pinned parent");
  struct stat source_before;
  if (fstat(source_fd, &source_before) != 0) fail("cannot stat held move source");
  if (!source_matches_expected(&source_before, source_type, source_dev, source_ino,
      source_uid, source_mode, source_nlink, source_size, source_mtime_ns,
      source_ctime_ns, 1) || source_before.st_uid != geteuid() ||
      (strcmp(source_type, "file") == 0 && source_before.st_nlink != 1) ||
      (source_before.st_mode & 0022) != 0) {
    errno = 0;
    fail("move source type, identity, owner, link, or mode contract changed");
  }
  struct stat source_at_commit;
  if (fstatat(parent_fd, argv[3], &source_at_commit, AT_SYMLINK_NOFOLLOW) != 0 ||
      !same_full_identity(&source_before, &source_at_commit)) {
    errno = 0;
    fail("source leaf differs from held source immediately before commit");
  }

  if (renameatx_np(parent_fd, argv[3], parent_fd, argv[4],
                   RENAME_EXCL | RENAME_NOFOLLOW_ANY) != 0) {
    fail("native RENAME_EXCL|RENAME_NOFOLLOW_ANY move failed");
  }

  struct stat target_after;
  if (fstatat(parent_fd, argv[4], &target_after, AT_SYMLINK_NOFOLLOW) != 0) {
    fail("cannot stat committed target under pinned parent");
  }
  struct stat held_after;
  if (fstat(source_fd, &held_after) != 0) fail("cannot restat held source after move");
  if (!same_full_identity(&target_after, &held_after) ||
      !source_matches_expected(&held_after, source_type, source_dev, source_ino,
        source_uid, source_mode, source_nlink, source_size, source_mtime_ns,
        source_ctime_ns, 0)) {
    errno = 0;
    fail("committed target identity differs from the pinned source");
  }
  struct stat unexpected_source;
  if (fstatat(parent_fd, argv[3], &unexpected_source, AT_SYMLINK_NOFOLLOW) == 0) {
    errno = 0;
    fail("source leaf still exists after committed move");
  }
  if (errno != ENOENT) fail("cannot establish source absence after committed move");
  int deleted = 0;
  if (strcmp(operation, "delete") == 0) {
    if (unlinkat(parent_fd, argv[4], 0) != 0) {
      fail("cannot unlink exact moved custody source under pinned parent");
    }
    struct stat unexpected_custody;
    if (fstatat(parent_fd, argv[4], &unexpected_custody, AT_SYMLINK_NOFOLLOW) == 0) {
      errno = 0;
      fail("custody leaf still exists after exact unlinkat");
    }
    if (errno != ENOENT) fail("cannot establish custody absence after exact unlinkat");
    deleted = 1;
  }
  if (fsync(parent_fd) != 0) fail("cannot fsync move parent");
  if (close(source_fd) != 0) fail("cannot close held move source");
  if (close(parent_fd) != 0) fail("cannot close move parent");
  printf("{\"device\":\"%" PRIu64 "\",\"inode\":\"%" PRIu64
         "\",\"owner\":\"%" PRIu64 "\",\"mode\":\"%" PRIu64
         "\",\"nlink\":\"%" PRIu64 "\",\"size\":\"%" PRIu64
         "\",\"mtimeNs\":\"%" PRIu64 "\",\"ctimeNs\":\"%" PRIu64
         "\",\"type\":\"%s\",\"deleted\":%s}\n",
         (uint64_t)target_after.st_dev, (uint64_t)target_after.st_ino,
         (uint64_t)target_after.st_uid, (uint64_t)(target_after.st_mode & 0777),
         (uint64_t)target_after.st_nlink, (uint64_t)target_after.st_size,
         stat_mtime_ns(&target_after), stat_ctime_ns(&target_after), source_type,
         deleted ? "true" : "false");
  return 0;
}
`;
const DARWIN_NATIVE_NO_REPLACE_MOVER_SHA256 =
  "d377d43c16e862eadbc3922d2523ba4cb0a0d4b4af67e66286ee36cec28c6c07";

const TARGETS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l10-ts-007",
    ordinal: 42,
    currentDisposition: Object.freeze({
      path: "migrations/course-g04-l10-ts-007/audit/frame-domain-disposition.json",
      bytes: 100597,
      sha256: "b5495a553e3663dad5083bca04b82d06756912a8496617f8dc231014866c36da",
    }),
    predecessorRuntimePlan: Object.freeze({
      path: "migrations/course-g04-l10-ts-007/audit/machine/release-runtime-acquisition-plan.json",
      bytes: 19605,
      sha256: "728d924c03a57de665d29e28fcab1aea53844ecdb32f5e8e68f70032a05e954f",
    }),
    successorRuntimePlan:
      "migrations/course-g04-l10-ts-007/audit/machine/release-runtime-acquisition-plan-nested-parent-successor-v1.json",
  }),
  Object.freeze({
    animationId: "course-g04-l10-ts-008",
    ordinal: 43,
    currentDisposition: Object.freeze({
      path: "migrations/course-g04-l10-ts-008/audit/frame-domain-disposition.json",
      bytes: 83928,
      sha256: "8f4f4d32b532b58711ea09237184e27b121a721af1a05d378bb894cde1e54733",
    }),
    predecessorRuntimePlan: Object.freeze({
      path: "migrations/course-g04-l10-ts-008/audit/machine/release-runtime-acquisition-plan.json",
      bytes: 18228,
      sha256: "59cc7e180def99dcb26dfe419a6067a03e587f5a757c19406b2a1b1d497ac99f",
    }),
    successorRuntimePlan:
      "migrations/course-g04-l10-ts-008/audit/machine/release-runtime-acquisition-plan-nested-parent-successor-v1.json",
  }),
]);
const TARGET_IDS = new Set(TARGETS.map(({animationId}) => animationId));

const EXPECTED = Object.freeze({
  releaseMembers: 47,
  requirements: 520,
  targetRequirements: 60,
  predecessorMutable: Object.freeze({
    count: 110,
    bytes: 2965517,
    setSha256:
      "5ef4e4e4b1f9853115023440355961061ceaaf2800835226ea35d2ea3cb891af",
    categories: Object.freeze({
      coverage: Object.freeze({
        count: 2,
        bytes: 193684,
        setSha256:
          "763d71bcdbf96e0bccb2c0c6224dc5dec460705cb2f4fc1d0b41f5f1c37775fe",
      }),
      trace: Object.freeze({
        count: 60,
        bytes: 1160884,
        setSha256:
          "f67e883082edd1fcddaf2b04cc0efb68da2f61f482983f50cc84f8ac0c2aab7a",
      }),
      index: Object.freeze({
        count: 1,
        bytes: 706051,
        setSha256:
          "d33cf4ddca16efae70e1ff1eb7ed361604269a03c22de52079f0e374a9905c75",
      }),
      keyframes: Object.freeze({
        count: 47,
        bytes: 904898,
        setSha256:
          "7e34973370c5dcbb90862b23155bf9ccf5b4d2ed2590358c5e68579131d882c7",
      }),
    }),
  }),
  nestedParentReport: Object.freeze({
    path: NESTED_PARENT_REPORT_RELATIVE,
    bytes: 263901,
    sha256: "0b31c8f8c9188bb9e2b35010389adf81214a0969a84e5cc969d6e3d09d659c01",
  }),
  historicalPreapplySuite: Object.freeze({
    path: HISTORICAL_PREAPPLY_SUITE_RELATIVE,
    bytes: 19379,
    sha256: "be315ace74e62deafd4fce433ad1e95ef8ee08ff56cdb5ed86b6d5c4764a44c9",
  }),
  currentPostapplySuite: Object.freeze({
    path: CURRENT_POSTAPPLY_SUITE_RELATIVE,
    bytes: 11955,
    sha256: "b67a129114bec0b45525331a2c2c2272d82923fbe0eff00b5c806ad91041bc14",
  }),
  releaseCatalog: Object.freeze({
    path: RELEASE_CATALOG_RELATIVE,
    bytes: 115651,
    sha256: "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
  }),
  generators: Object.freeze([
    Object.freeze({
      path: "scripts/materialize-release-source-evidenced-coverage-v2.mjs",
      bytes: 46613,
      sha256: "f223c8058ddf8f03860508fe476cf6d06b661449c737426dc91e833d704ad963",
    }),
    Object.freeze({
      path: "scripts/build-course-trace-specs.mjs",
      bytes: 176260,
      sha256: "bfba7fd2430d0bf445bc6478b78d17eab5e8274b7b924be0f0513e8837b25e54",
    }),
    Object.freeze({
      path: "scripts/materialize-lesson-release-structural-keyframes.mjs",
      bytes: 54778,
      sha256: "27b57c1ead7466ed1aad0f7aa720b37b0d42ed1fbc4cc70248c9b9bee35faad9",
    }),
    Object.freeze({
      path: "scripts/evidence-projections.mjs",
      bytes: 10849,
      sha256: "0a5a4126fd72fa8137af6105a8a22759ebbaab8a46f7538bd13074af7d9e7a08",
    }),
  ]),
  keyframeTemplate: Object.freeze({
    path: KEYFRAME_TEMPLATE_RELATIVE,
    bytes: 288,
    sha256: "a7467cbf7587d15943a6488e8efb404e2b0d71315b87209287f6f3dc8a69a723",
  }),
  runtimeAggregate: Object.freeze({
    json: Object.freeze({
      path: "reports/g04-l10-perimeter-area-runtime-acquisition-planning-readiness.json",
      bytes: 85806,
      sha256: "32771bb6b416a752772307dfe9d435480f25c16235b1b949cbd162a68136eabb",
    }),
    markdown: Object.freeze({
      path: "reports/g04-l10-perimeter-area-runtime-acquisition-planning-readiness.md",
      bytes: 1879,
      sha256: "6d79be9b8749f6eb985ce9703e574b90c0f52ef7d96f506ef2f88d2c0c2e1e56",
    }),
  }),
  desiredIndexTotals: Object.freeze({
    memberCount: 47,
    requirementCount: 520,
    unresolvedCount: 426,
    frameDomainDispositionUnresolvedCount: 70,
    frameDomainDispositionIndependentRequiredCount: 0,
    frameAccurateRootReadyCount: 94,
    naturalScheduleReadyCount: 0,
    readyTraceCount: 94,
  }),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function compareText(left, right) {
  return left.localeCompare(right, "en");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (
    !path.isAbsolute(relative) &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`)
  );
}

async function lstatOrNull(absolutePath) {
  return lstat(absolutePath, {bigint: true}).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
}

function nativeIdentity(metadata) {
  return {
    device: String(metadata.dev),
    inode: String(metadata.ino),
    owner: String(metadata.uid),
    mode: String(metadata.mode & 0o777n),
  };
}

function nativeSourceIdentity(metadata, type) {
  return {
    ...nativeIdentity(metadata),
    nlink: String(metadata.nlink),
    size: String(metadata.size),
    mtimeNs: String(metadata.mtimeNs),
    ctimeNs: String(metadata.ctimeNs),
    type,
  };
}

function sameNativeIdentity(left, right) {
  return left?.device === right?.device &&
    left?.inode === right?.inode &&
    left?.owner === right?.owner &&
    left?.mode === right?.mode;
}

function sameNativeStableSourceIdentity(left, right) {
  return sameNativeIdentity(left, right) &&
    left?.nlink === right?.nlink &&
    left?.size === right?.size &&
    left?.mtimeNs === right?.mtimeNs &&
    left?.type === right?.type;
}

function sameNativeFullSourceIdentity(left, right) {
  return sameNativeStableSourceIdentity(left, right) &&
    left?.ctimeNs === right?.ctimeNs;
}

async function assertRealDirectoryAncestors(directory, label = "directory") {
  const absolute = path.resolve(directory);
  const parsed = path.parse(absolute);
  let cursor = parsed.root;
  const components = absolute.slice(parsed.root.length)
    .split(path.sep).filter(Boolean);
  const rootInfo = await lstat(cursor, {bigint: true});
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    `${label}: filesystem root is not one real directory`);
  for (const component of components) {
    cursor = path.join(cursor, component);
    const info = await lstat(cursor, {bigint: true});
    invariant(info.isDirectory() && !info.isSymbolicLink(),
      `${label}: ancestor is missing, non-directory, or symbolic link: ${cursor}`);
  }
  invariant(await realpath(absolute) === absolute,
    `${label}: physical path contains an alias or symbolic-link ancestor: ${absolute}`);
  return lstat(absolute, {bigint: true});
}

function assertOwnerControlledNoGroupOtherWrite(metadata, label) {
  invariant(typeof process.geteuid === "function",
    `${label}: effective-user identity is unavailable`);
  invariant(metadata.uid === BigInt(process.geteuid()),
    `${label}: path is not owned by the effective user`);
  invariant((metadata.mode & 0o022n) === 0n,
    `${label}: group/other write bits are forbidden`);
}

function nativeMoverProvenance() {
  const bytes = Buffer.byteLength(DARWIN_NATIVE_NO_REPLACE_MOVER_SOURCE, "utf8");
  invariant(SHA256_PATTERN.test(DARWIN_NATIVE_NO_REPLACE_MOVER_SHA256) &&
    sha256(Buffer.from(DARWIN_NATIVE_NO_REPLACE_MOVER_SOURCE, "utf8")) ===
      DARWIN_NATIVE_NO_REPLACE_MOVER_SHA256,
  "embedded Darwin native no-replace mover source hash pin drifted");
  return {
    sourceKind: "embedded-hash-pinned-c11",
    containerPath: SCRIPT_RELATIVE,
    bytes,
    sha256: DARWIN_NATIVE_NO_REPLACE_MOVER_SHA256,
    compiler: "/usr/bin/cc",
    compileArguments: ["-std=c11", "-Wall", "-Wextra", "-Werror", "-Os"],
    primitive: "renameatx_np(RENAME_EXCL|RENAME_NOFOLLOW_ANY)",
    cleanupPrimitive:
      "held-fd exact identity + renameatx_np(RENAME_EXCL|RENAME_NOFOLLOW_ANY) + unlinkat + fsync",
    nonDarwinBehavior: "fail-closed-before-project-move",
  };
}

async function cleanupNativeBuild(native) {
  if (!native) return;
  const rootInfo = await lstatOrNull(native.buildRoot);
  if (!rootInfo) return;
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink() &&
    sameNativeIdentity(nativeIdentity(rootInfo), native.buildIdentity),
  `native mover build root identity changed; preserving ${native.buildRoot}`);
  invariant(await realpath(native.buildRoot) === native.buildRoot,
    `native mover build root gained an alias; preserving ${native.buildRoot}`);
  const entries = (await readdir(native.buildRoot)).sort(compareText);
  invariant(JSON.stringify(entries) ===
    JSON.stringify([path.basename(native.executable), path.basename(native.sourcePath)]
      .sort(compareText)),
  `native mover build root contains foreign entries; preserving ${native.buildRoot}`);
  for (const [candidate, expected] of [
    [native.sourcePath, native.sourceIdentity],
    [native.executable, native.executableIdentity],
  ]) {
    const info = await lstat(candidate, {bigint: true});
    invariant(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n &&
      sameNativeIdentity(nativeIdentity(info), expected),
    `native mover build entry changed; preserving ${native.buildRoot}`);
  }
  await rm(native.buildRoot, {recursive: true, force: false});
}

async function compileDarwinNoReplaceMover(projectRoot) {
  invariant(process.platform === "darwin",
    "native no-replace moves require Darwin renameatx_np; refusing project writes");
  const provenance = nativeMoverProvenance();
  const physicalProjectRoot = await realpath(path.resolve(projectRoot));
  const tempRoot = await realpath(path.resolve(os.tmpdir()));
  await assertRealDirectoryAncestors(tempRoot, "native mover build parent");
  invariant(!isWithin(physicalProjectRoot, tempRoot) && tempRoot !== physicalProjectRoot,
    "native mover build parent must remain physically outside the project root");
  const buildRoot = await mkdtemp(path.join(
    tempRoot,
    ".g4-l10-native-no-replace-",
  ));
  const buildInfo = await assertRealDirectoryAncestors(
    buildRoot,
    "native mover build root",
  );
  assertOwnerControlledNoGroupOtherWrite(buildInfo, "native mover build root");
  invariant(Number(buildInfo.mode & 0o777n) === 0o700,
    "native mover build root must be mode 0700");
  const sourcePath = path.join(buildRoot, "move-no-replace.c");
  const executable = path.join(buildRoot, "move-no-replace");
  let native = null;
  try {
    const sourceHandle = await open(sourcePath, "wx+", 0o600);
    try {
      await sourceHandle.writeFile(DARWIN_NATIVE_NO_REPLACE_MOVER_SOURCE, "utf8");
      await sourceHandle.sync();
      await sourceHandle.chmod(0o400);
      await sourceHandle.sync();
    } finally {
      await sourceHandle.close();
    }
    const sourceInfo = await lstat(sourcePath, {bigint: true});
    invariant(sourceInfo.isFile() && !sourceInfo.isSymbolicLink() &&
      sourceInfo.nlink === 1n &&
      sha256(await readFile(sourcePath)) === provenance.sha256,
    "materialized native mover source differs from its exact embedded hash pin");
    await execFile("/usr/bin/cc", [
      ...provenance.compileArguments,
      sourcePath,
      "-o",
      executable,
    ], {
      encoding: "utf8",
      timeout: 30_000,
      env: {PATH: "/usr/bin:/bin:/usr/sbin:/sbin", LANG: "C", LC_ALL: "C"},
    });
    const executableHandle = await open(executable, "r");
    try {
      await executableHandle.chmod(0o500);
      await executableHandle.sync();
    } finally {
      await executableHandle.close();
    }
    const executableInfo = await lstat(executable, {bigint: true});
    invariant(executableInfo.isFile() && !executableInfo.isSymbolicLink() &&
      executableInfo.nlink === 1n &&
      Number(executableInfo.mode & 0o777n) === 0o500,
    "compiled native mover must be one private executable ordinary file");
    native = {
      provenance,
      buildRoot,
      buildIdentity: nativeIdentity(buildInfo),
      sourcePath,
      sourceIdentity: nativeIdentity(sourceInfo),
      executable,
      executableIdentity: nativeIdentity(executableInfo),
    };
    return native;
  } catch (error) {
    if (native) await cleanupNativeBuild(native).catch(() => {});
    else {
      const currentRoot = await lstatOrNull(buildRoot);
      if (currentRoot && currentRoot.isDirectory() && !currentRoot.isSymbolicLink() &&
        sameNativeIdentity(nativeIdentity(currentRoot), nativeIdentity(buildInfo))) {
        await rm(buildRoot, {recursive: true, force: false}).catch(() => {});
      }
    }
    throw error;
  }
}

async function nativeMoveNoReplace({
  native,
  sourcePath,
  targetPath,
  role,
  transactionHooks = {},
}) {
  invariant(native?.executable,
    `${role}: compiled native no-replace mover is unavailable`);
  const source = path.resolve(sourcePath);
  const target = path.resolve(targetPath);
  const parent = path.dirname(source);
  invariant(path.dirname(target) === parent,
    `${role}: source and target must be direct children of the same parent`);
  const sourceLeaf = path.basename(source);
  const targetLeaf = path.basename(target);
  invariant(!["", ".", ".."].includes(sourceLeaf) &&
    !["", ".", ".."].includes(targetLeaf),
  `${role}: source and target leaves must be safe`);
  const parentInfo = await assertRealDirectoryAncestors(parent, `${role} parent`);
  assertOwnerControlledNoGroupOtherWrite(parentInfo, `${role} parent`);
  const parentIdentity = nativeIdentity(parentInfo);
  const sourceInfo = await lstat(source, {bigint: true});
  const sourceType = sourceInfo.isFile() && !sourceInfo.isSymbolicLink()
    ? "file"
    : sourceInfo.isDirectory() && !sourceInfo.isSymbolicLink()
      ? "directory"
      : null;
  invariant(sourceType,
    `${role}: source must be one ordinary file or real directory`);
  if (sourceType === "file") {
    invariant(sourceInfo.nlink === 1n,
      `${role}: ordinary-file source must have nlink=1`);
  }
  assertOwnerControlledNoGroupOtherWrite(sourceInfo, `${role} source`);
  const sourceIdentity = nativeSourceIdentity(sourceInfo, sourceType);
  invariant(await lstatOrNull(target) === null,
    `${role}: no-replace target already exists: ${target}`);
  await transactionHooks.beforeNativeMove?.({
    role,
    parent,
    sourcePath: source,
    targetPath: target,
    parentIdentity,
    sourceIdentity,
    sourceType,
  });
  let result;
  try {
    result = await execFile(native.executable, [
      "move",
      parent,
      sourceLeaf,
      targetLeaf,
      parentIdentity.device,
      parentIdentity.inode,
      parentIdentity.owner,
      parentIdentity.mode,
      sourceIdentity.device,
      sourceIdentity.inode,
      sourceIdentity.owner,
      sourceIdentity.mode,
      sourceIdentity.nlink,
      sourceIdentity.size,
      sourceIdentity.mtimeNs,
      sourceIdentity.ctimeNs,
      sourceType,
    ], {encoding: "utf8", timeout: 30_000});
  } catch (error) {
    const detail = String(error?.stderr || error?.message || error).trim();
    throw new Error(`${role}: native no-replace move failed closed: ${detail}`);
  }
  let receipt;
  try {
    receipt = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${role}: native mover returned invalid JSON: ${error.message}`);
  }
  invariant(sameNativeStableSourceIdentity(receipt, sourceIdentity) &&
    receipt.deleted === false,
  `${role}: native receipt differs from the pinned source identity`);
  const parentAfter = await assertRealDirectoryAncestors(parent, `${role} parent`);
  invariant(sameNativeIdentity(nativeIdentity(parentAfter), parentIdentity),
    `${role}: parent identity changed across commit`);
  const targetInfo = await lstat(target, {bigint: true});
  const targetIdentity = nativeSourceIdentity(targetInfo, sourceType);
  invariant((sourceType === "file" ? targetInfo.isFile() : targetInfo.isDirectory()) &&
    !targetInfo.isSymbolicLink() &&
    (sourceType !== "file" || targetInfo.nlink === 1n) &&
    sameNativeFullSourceIdentity(targetIdentity, receipt) &&
    sameNativeStableSourceIdentity(targetIdentity, sourceIdentity),
  `${role}: committed target differs from the pinned source identity`);
  invariant(await lstatOrNull(source) === null,
    `${role}: source still exists after committed move`);
  return {
    role,
    primitive: native.provenance.primitive,
    parentIdentity,
    committedIdentity: targetIdentity,
    sourceType,
  };
}

async function nativeDeleteExact({
  native,
  root,
  absolutePath,
  expected,
  role,
  transactionHooks = {},
}) {
  invariant(native?.executable,
    `${role}: compiled native custody-delete helper is unavailable`);
  const source = path.resolve(absolutePath);
  const relativePath = portable(path.relative(root, source));
  invariant(!path.isAbsolute(relativePath) && relativePath !== ".." &&
    !relativePath.startsWith("../"),
  `${role}: cleanup source escapes project root`);
  const current = await readOrdinary(root, relativePath, {allowMissing: true});
  if (!current.exists) return {deleted: false, alreadyAbsent: true};
  invariant(expected?.exists && sameSnapshot(current, expected),
    `${role}: cleanup source changed; preserving foreign or unexplained bytes at ${source}`);
  await transactionHooks.afterCleanupSnapshot?.({
    role,
    sourcePath: source,
    snapshot: current,
  });
  const parent = path.dirname(source);
  const parentInfo = await assertRealDirectoryAncestors(parent, `${role} parent`);
  assertOwnerControlledNoGroupOtherWrite(parentInfo, `${role} parent`);
  const parentIdentity = nativeIdentity(parentInfo);
  const sourceInfo = await lstat(source, {bigint: true});
  invariant(sourceInfo.isFile() && !sourceInfo.isSymbolicLink() &&
    sourceInfo.nlink === 1n,
  `${role}: cleanup source must remain one ordinary nlink=1 file`);
  invariant(JSON.stringify(identityFor(sourceInfo)) ===
    JSON.stringify(current.identity),
  `${role}: cleanup source changed after its exact snapshot; preserving foreign or unexplained bytes at ${source}`);
  assertOwnerControlledNoGroupOtherWrite(sourceInfo, `${role} source`);
  const sourceIdentity = nativeSourceIdentity(sourceInfo, "file");
  const custodyLeaf = `.${path.basename(source)}.${process.pid}-${randomBytes(12)
    .toString("hex")}.delete-custody`;
  const custodyPath = path.join(parent, custodyLeaf);
  invariant(await lstatOrNull(custodyPath) === null,
    `${role}: native cleanup custody target already exists: ${custodyPath}`);
  await transactionHooks.beforeNativeCleanup?.({
    role,
    parent,
    sourcePath: source,
    custodyPath,
    parentIdentity,
    sourceIdentity,
  });
  let result;
  try {
    result = await execFile(native.executable, [
      "delete",
      parent,
      path.basename(source),
      custodyLeaf,
      parentIdentity.device,
      parentIdentity.inode,
      parentIdentity.owner,
      parentIdentity.mode,
      sourceIdentity.device,
      sourceIdentity.inode,
      sourceIdentity.owner,
      sourceIdentity.mode,
      sourceIdentity.nlink,
      sourceIdentity.size,
      sourceIdentity.mtimeNs,
      sourceIdentity.ctimeNs,
      sourceIdentity.type,
    ], {encoding: "utf8", timeout: 30_000});
  } catch (error) {
    const detail = String(error?.stderr || error?.message || error).trim();
    const [sourceAfter, custodyAfter] = await Promise.all([
      lstatOrNull(source),
      lstatOrNull(custodyPath),
    ]);
    throw new Error(
      `${role}: native custody-delete failed closed: ${detail}; ` +
      `source ${sourceAfter ? "preserved" : "absent"} at ${source}; ` +
      `custody ${custodyAfter ? "preserved" : "absent"} at ${custodyPath}`,
      {cause: error},
    );
  }
  let receipt;
  try {
    receipt = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(
      `${role}: native custody-delete returned invalid JSON; source/custody state requires review: ${error.message}`,
    );
  }
  invariant(receipt.deleted === true &&
    sameNativeStableSourceIdentity(receipt, sourceIdentity),
  `${role}: native custody-delete receipt differs from the pinned source identity`);
  invariant(await lstatOrNull(source) === null &&
    await lstatOrNull(custodyPath) === null,
  `${role}: native custody-delete reported success but source or custody remains`);
  const parentAfter = await assertRealDirectoryAncestors(parent, `${role} parent`);
  invariant(sameNativeIdentity(nativeIdentity(parentAfter), parentIdentity),
    `${role}: cleanup parent identity changed across native custody-delete`);
  return {
    deleted: true,
    alreadyAbsent: false,
    primitive: native.provenance.cleanupPrimitive,
    parentIdentity,
    deletedIdentity: sourceIdentity,
    custodyPath,
  };
}

function safeRelative(relativePath, label = "Project-relative path") {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    `${label} is empty`);
  invariant(!path.isAbsolute(relativePath), `${label} must be relative`);
  const normalized = portable(path.normalize(relativePath));
  invariant(normalized !== ".." && !normalized.startsWith("../"),
    `${label} escapes the project root: ${relativePath}`);
  invariant(normalized === relativePath, `${label} is not canonical: ${relativePath}`);
  return normalized;
}

function resolveProjectPath(root, relativePath) {
  safeRelative(relativePath);
  const absolute = path.resolve(root, relativePath);
  invariant(isWithin(path.resolve(root), absolute),
    `${relativePath}: resolved path escapes project root`);
  return absolute;
}

function identityFor(metadata) {
  return {
    dev: String(metadata.dev),
    ino: String(metadata.ino),
    mode: String(metadata.mode),
    nlink: String(metadata.nlink),
    size: String(metadata.size),
    mtimeNs: String(metadata.mtimeNs),
    ctimeNs: String(metadata.ctimeNs),
  };
}

async function readOrdinary(root, relativePath, {allowMissing = false} = {}) {
  const absolutePath = resolveProjectPath(root, relativePath);
  let metadata;
  try {
    metadata = await lstat(absolutePath, {bigint: true});
  } catch (error) {
    if (allowMissing && error?.code === "ENOENT") {
      return {path: relativePath, absolutePath, exists: false};
    }
    throw error;
  }
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected an ordinary file`);
  invariant(metadata.nlink === 1n,
    `${relativePath}: ordinary-file evidence must have nlink=1`);
  const contents = await readFile(absolutePath);
  const postMetadata = await lstat(absolutePath, {bigint: true});
  invariant(BigInt(contents.length) === metadata.size &&
    JSON.stringify(identityFor(postMetadata)) ===
      JSON.stringify(identityFor(metadata)),
  `${relativePath}: identity changed while reading`);
  return {
    path: relativePath,
    absolutePath,
    exists: true,
    contents,
    bytes: contents.length,
    sha256: sha256(contents),
    identity: identityFor(metadata),
    mode: Number(metadata.mode & 0o777n),
  };
}

function descriptor(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function modeOctal(mode) {
  return Number(mode).toString(8).padStart(4, "0");
}

function matchesDescriptor(record, expected) {
  return record?.exists === true &&
    record.path === expected.path &&
    record.bytes === expected.bytes &&
    record.sha256 === expected.sha256;
}

function assertDescriptor(record, expected, label = expected.path) {
  invariant(matchesDescriptor(record, expected),
    `${label}: expected ${expected.bytes}/${expected.sha256}, observed ` +
    `${record?.exists ? `${record.bytes}/${record.sha256}` : "absent"}`);
  return record;
}

function recordForRendered(relativePath, rendered, extra = {}) {
  const contents = Buffer.isBuffer(rendered) ? rendered : Buffer.from(rendered, "utf8");
  return {
    path: relativePath,
    exists: true,
    contents,
    rendered: contents.toString("utf8"),
    bytes: contents.length,
    sha256: sha256(contents),
    ...extra,
  };
}

function descriptorSet(records) {
  const files = records.map(descriptor).sort((left, right) =>
    compareText(left.path, right.path));
  return {
    count: files.length,
    bytes: files.reduce((sum, item) => sum + item.bytes, 0),
    setSha256: sha256(Buffer.from(JSON.stringify(stable(files)))),
    files,
  };
}

function assertSet(actual, expected, label) {
  invariant(
    actual.count === expected.count &&
    actual.bytes === expected.bytes &&
    actual.setSha256 === expected.setSha256,
    `${label}: expected ${expected.count}/${expected.bytes}/${expected.setSha256}, ` +
      `observed ${actual.count}/${actual.bytes}/${actual.setSha256}`,
  );
}

async function readJsonRecord(root, relativePath, options) {
  const record = await readOrdinary(root, relativePath, options);
  if (!record.exists) return record;
  try {
    return {...record, document: JSON.parse(record.contents.toString("utf8"))};
  } catch (error) {
    throw new Error(`${relativePath}: invalid JSON: ${error.message}`);
  }
}

async function verifySnapshot(root, snapshot, {hash = true} = {}) {
  const current = await readOrdinary(root, snapshot.path, {allowMissing: true});
  invariant(current.exists === snapshot.exists,
    `${snapshot.path}: existence changed after preflight`);
  if (!current.exists) return;
  invariant(JSON.stringify(current.identity) === JSON.stringify(snapshot.identity),
    `${snapshot.path}: file identity changed after preflight`);
  if (hash) {
    invariant(current.bytes === snapshot.bytes && current.sha256 === snapshot.sha256,
      `${snapshot.path}: file bytes changed after preflight`);
  }
}

async function verifyReadSet(root, records) {
  for (const record of records) await verifySnapshot(root, record);
}

function dedupeRecords(records) {
  const byPath = new Map();
  for (const record of records) {
    const prior = byPath.get(record.path);
    if (prior) {
      invariant(prior.bytes === record.bytes && prior.sha256 === record.sha256,
        `${record.path}: read-set observations disagree`);
    } else byPath.set(record.path, record);
  }
  return [...byPath.values()].sort((left, right) =>
    compareText(left.path, right.path));
}

function mutablePathGroups(index) {
  invariant(index?.artifactType === "lesson-release-original-runtime-trace-spec-index",
    "release trace index artifact type drifted");
  invariant(index.releaseCatalog?.releaseId === RELEASE_ID,
    "release trace index release ID drifted");
  invariant(index.memberCount === EXPECTED.releaseMembers &&
    index.members?.length === EXPECTED.releaseMembers,
  "release trace index member count drifted");
  const targetMembers = TARGETS.map((target) => {
    const matches = index.members.filter(({animationId}) =>
      animationId === target.animationId);
    invariant(matches.length === 1,
      `${target.animationId}: trace index membership is not unique`);
    invariant(matches[0].releaseMembership?.ordinal === target.ordinal,
      `${target.animationId}: release ordinal drifted`);
    return matches[0];
  });
  const coverage = TARGETS.map(({animationId}) =>
    `migrations/${animationId}/evidence/full-frame-coverage.json`);
  const trace = targetMembers.flatMap((member) =>
    member.traceSpecs.map(({file}) => safeRelative(file,
      `${member.animationId}: trace-spec path`)));
  const releaseIndex = [RELEASE_INDEX_RELATIVE];
  const keyframes = index.members.map(({animationId}) =>
    `migrations/${animationId}/keyframes.csv`);
  invariant(coverage.length === 2 && trace.length === EXPECTED.targetRequirements &&
    releaseIndex.length === 1 && keyframes.length === EXPECTED.releaseMembers,
  "mutable downstream path cardinality drifted");
  const all = [...coverage, ...trace, ...releaseIndex, ...keyframes];
  invariant(new Set(all).size === 110,
    "mutable downstream path set must contain exactly 110 unique files");
  return {coverage, trace, index: releaseIndex, keyframes, all};
}

async function loadFixedFoundation(root) {
  const expectedFiles = [
    EXPECTED.nestedParentReport,
    EXPECTED.historicalPreapplySuite,
    EXPECTED.currentPostapplySuite,
    EXPECTED.releaseCatalog,
    EXPECTED.keyframeTemplate,
    EXPECTED.runtimeAggregate.json,
    EXPECTED.runtimeAggregate.markdown,
    ...EXPECTED.generators,
    ...TARGETS.flatMap((target) => [
      target.currentDisposition,
      target.predecessorRuntimePlan,
    ]),
  ];
  const records = [];
  for (const expected of expectedFiles) {
    records.push(assertDescriptor(await readOrdinary(root, expected.path), expected));
  }
  const self = await readOrdinary(root, SCRIPT_RELATIVE);
  records.push(self);
  const reportRecord = await readJsonRecord(root, NESTED_PARENT_REPORT_RELATIVE);
  assertDescriptor(reportRecord, EXPECTED.nestedParentReport);
  const report = reportRecord.document;
  invariant(report.reportType ===
    "g4-l10-nested-declared-parent-static-composite-successor" &&
    report.releaseId === RELEASE_ID &&
    report.mutationScope?.exactTargetCount === 5,
  "nested-parent five-file successor receipt drifted");
  for (const target of TARGETS) {
    const transition = report.downstreamBoundary?.dispositionTransitions?.find(
      ({animationId}) => animationId === target.animationId,
    );
    invariant(transition?.successor?.path === target.currentDisposition.path &&
      transition.successor.bytes === target.currentDisposition.bytes &&
      transition.successor.sha256 === target.currentDisposition.sha256,
    `${target.animationId}: five-file receipt does not bind current raw disposition`);
  }
  const catalog = JSON.parse((records.find(({path: value}) =>
    value === RELEASE_CATALOG_RELATIVE)).contents.toString("utf8"));
  const release = catalog.releases?.find(({releaseId}) =>
    releaseId === RELEASE_ID);
  invariant(release?.members?.length === EXPECTED.releaseMembers,
    "lesson release catalog membership drifted");
  const runtimePlanRecords = [];
  const runtimeAggregateRecord = records.find(({path: value}) =>
    value === EXPECTED.runtimeAggregate.json.path);
  const runtimeAggregate = JSON.parse(
    runtimeAggregateRecord.contents.toString("utf8"),
  );
  invariant(runtimeAggregate.reportType ===
    "release-runtime-acquisition-planning-readiness" &&
    runtimeAggregate.identity?.releaseId === RELEASE_ID &&
    runtimeAggregate.items?.length === 47,
  "historical runtime aggregate identity/membership drifted");
  const aggregateItems = new Map(runtimeAggregate.items.map((item) =>
    [item.animationId, item]));
  invariant(aggregateItems.size === 47,
    "historical runtime aggregate contains duplicate members");
  for (const member of release.members) {
    const relativePath =
      `migrations/${member.animationId}/audit/machine/release-runtime-acquisition-plan.json`;
    const record = await readOrdinary(root, relativePath);
    const aggregateItem = aggregateItems.get(member.animationId);
    invariant(aggregateItem?.ordinal === member.ordinal &&
      aggregateItem.artifact?.path === relativePath &&
      aggregateItem.artifact.bytes === record.bytes &&
      aggregateItem.artifact.sha256 === record.sha256,
    `${member.animationId}: historical runtime plan differs from exact aggregate`);
    const runtimeDocument = JSON.parse(record.contents.toString("utf8"));
    invariant(runtimeDocument.artifactFingerprintSha256 ===
      aggregateItem.artifact.fingerprintSha256,
    `${member.animationId}: historical runtime artifact fingerprint drifted`);
    const target = TARGETS.find(({animationId}) =>
      animationId === member.animationId);
    if (target) assertDescriptor(record, target.predecessorRuntimePlan);
    runtimePlanRecords.push(record);
    records.push(record);
  }
  invariant(runtimePlanRecords.length === 47,
    "historical runtime-plan resolution set must contain 47 members");
  const indexRecord = await readJsonRecord(root, RELEASE_INDEX_RELATIVE);
  const groups = mutablePathGroups(indexRecord.document);
  return {
    records: dedupeRecords([...records, indexRecord]),
    self,
    reportRecord,
    report,
    catalog,
    release,
    runtimePlanRecords,
    indexRecord,
    groups,
  };
}

async function readMutableRecords(root, groups) {
  const records = [];
  for (const relativePath of groups.all) {
    records.push(await readOrdinary(root, relativePath));
  }
  return records;
}

function validatePredecessorMutable(records, groups) {
  const byPath = new Map(records.map((record) => [record.path, record]));
  for (const [name, paths] of Object.entries(groups)) {
    if (name === "all") continue;
    const set = descriptorSet(paths.map((value) => byPath.get(value)));
    assertSet(set, EXPECTED.predecessorMutable.categories[name],
      `predecessor ${name} set`);
  }
  const complete = descriptorSet(records);
  assertSet(complete, EXPECTED.predecessorMutable,
    "predecessor 110-file mutable set");
  return complete;
}

async function collectCloneClosurePaths(root, index) {
  const paths = new Set([
    RELEASE_CATALOG_RELATIVE,
    KEYFRAME_TEMPLATE_RELATIVE,
    RELEASE_INDEX_RELATIVE,
    SCRIPT_RELATIVE,
    ...EXPECTED.generators.map(({path: value}) => value),
  ]);
  for (const member of index.members) {
    const workspace = `migrations/${member.animationId}`;
    const manifestPath = `${workspace}/migration.json`;
    const baselinePath = `${workspace}/baseline/ffdec-root-frames.json`;
    for (const relativePath of [
      manifestPath,
      `${workspace}/evidence/full-frame-coverage.json`,
      `${workspace}/audit/scenario-inventory.json`,
      `${workspace}/audit/frame-domain-disposition.json`,
      baselinePath,
      `${workspace}/keyframes.csv`,
      ...member.traceSpecs.map(({file}) => file),
    ]) paths.add(safeRelative(relativePath));
    const manifest = (await readJsonRecord(root, manifestPath)).document;
    paths.add(safeRelative(manifest.source?.swf,
      `${member.animationId}: preserved SWF path`));
    const baseline = (await readJsonRecord(root, baselinePath)).document;
    const archiveRoot = safeRelative(baseline.archive?.root,
      `${member.animationId}: structural baseline archive root`);
    invariant(baseline.frames?.length === manifest.runtime?.frameCount,
      `${member.animationId}: structural baseline frame count drifted`);
    for (const frame of baseline.frames) {
      paths.add(safeRelative(`${archiveRoot}/${frame.file}`,
        `${member.animationId}: structural baseline frame path`));
    }
  }
  return [...paths].sort(compareText);
}

async function copyOrdinaryWithSnapshot(sourceRoot, cloneRoot, relativePath) {
  const source = await readOrdinary(sourceRoot, relativePath);
  const destination = resolveProjectPath(cloneRoot, relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(source.absolutePath, destination);
  const copied = await readOrdinary(cloneRoot, relativePath);
  invariant(copied.bytes === source.bytes && copied.sha256 === source.sha256,
    `${relativePath}: clone copy differs from live source`);
  invariant(copied.identity.nlink === "1",
    `${relativePath}: clone copy must remain an ordinary nlink=1 file`);
  return source;
}

async function makeSameVolumeClone(root, {tempParent} = {}) {
  const requestedParent = path.resolve(tempParent || path.dirname(root));
  await assertRealDirectoryAncestors(
    requestedParent,
    "temporary-clone parent",
  );
  const parent = await realpath(requestedParent);
  const physicalRoot = await realpath(path.resolve(root));
  invariant(parent !== physicalRoot && !isWithin(physicalRoot, parent),
    "temporary-clone parent must remain physically outside the project root");
  const cloneRoot = await mkdtemp(path.join(
    parent,
    ".g4-l10-nested-parent-downstream-v1-",
  ));
  await assertRealDirectoryAncestors(cloneRoot, "temporary clone root");
  const cloneRootInfo = await lstat(cloneRoot, {bigint: true});
  invariant(Number(cloneRootInfo.mode & 0o777n) === 0o700,
    "temporary clone root must be created as mode 0700");
  const [rootInfo, cloneInfo] = await Promise.all([
    lstat(root, {bigint: true}),
    lstat(cloneRoot, {bigint: true}),
  ]);
  invariant(rootInfo.dev === cloneInfo.dev,
    "temporary clone must reside on the same filesystem as the project root");
  return cloneRoot;
}

async function createGeneratorClone(root, foundation, options = {}) {
  const cloneRoot = await makeSameVolumeClone(root, options);
  const readSet = [];
  try {
    const closure = await collectCloneClosurePaths(
      root,
      foundation.indexRecord.document,
    );
    invariant(closure.some((value) => value.startsWith("migrations/")) &&
      closure.some((value) => value.startsWith("catalog/")) &&
      closure.some((value) => value.startsWith("templates/")) &&
      closure.some((value) => value.startsWith("source-assets/")) &&
      closure.some((value) => value.startsWith("scripts/")),
    "clone closure must contain migrations/catalog/templates/source-assets/scripts");
    for (const relativePath of closure) {
      readSet.push(await copyOrdinaryWithSnapshot(root, cloneRoot, relativePath));
    }
    return {cloneRoot, readSet: dedupeRecords(readSet), closure};
  } catch (error) {
    await rm(cloneRoot, {recursive: true, force: true});
    throw error;
  }
}

async function buildDesiredMutable(root, foundation, options = {}) {
  const {cloneRoot, readSet, closure} = await createGeneratorClone(
    root,
    foundation,
    options,
  );
  try {
    const coverage = await materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: cloneRoot,
      releaseId: RELEASE_ID,
      ids: TARGETS.map(({animationId}) => animationId),
    });
    invariant(coverage.selectedMemberCount === 2 &&
      coverage.requirementCount === EXPECTED.targetRequirements &&
      Number.isInteger(coverage.changedMemberCount) &&
      coverage.changedMemberCount >= 0 && coverage.changedMemberCount <= 2,
    "coverage successor generation result drifted");
    const nonTargetTracePaths = foundation.indexRecord.document.members
      .filter(({animationId}) => !TARGET_IDS.has(animationId))
      .flatMap((member) => member.traceSpecs.map(({file}) => file));
    invariant(nonTargetTracePaths.length === 460,
      "full-release trace control set must contain 460 non-target specs");
    const nonTargetBefore = new Map();
    for (const relativePath of nonTargetTracePaths) {
      nonTargetBefore.set(relativePath, await readOrdinary(cloneRoot, relativePath));
    }
    const trace = await buildCourseTraceSpecs({
      projectRoot: cloneRoot,
      releaseId: RELEASE_ID,
    });
    invariant(trace.memberCount === EXPECTED.releaseMembers &&
      trace.requirementCount === EXPECTED.requirements &&
      trace.frameDomainDispositionUnresolvedCount ===
        EXPECTED.desiredIndexTotals.frameDomainDispositionUnresolvedCount &&
      trace.frameDomainDispositionIndependentRequiredCount === 0 &&
      trace.index === RELEASE_INDEX_RELATIVE,
    "full-release trace successor generation result drifted");
    for (const relativePath of nonTargetTracePaths) {
      const before = nonTargetBefore.get(relativePath);
      const after = await readOrdinary(cloneRoot, relativePath);
      invariant(before.bytes === after.bytes && before.sha256 === after.sha256,
        `${relativePath}: full-release generation changed a non-target trace spec`);
    }
    trace.nonTargetTraceSpecUnchangedCount = nonTargetTracePaths.length;
    trace.targetTraceSpecSuccessorCount = EXPECTED.targetRequirements;
    const keyframes = await materializeLessonReleaseStructuralKeyframes({
      projectRoot: cloneRoot,
      releaseId: RELEASE_ID,
      mode: "apply",
      skipLock: true,
    });
    invariant(keyframes.selectedMemberCount === EXPECTED.releaseMembers &&
      Number.isInteger(keyframes.changedMemberCount) &&
      keyframes.changedMemberCount >= 0 &&
      keyframes.changedMemberCount <= EXPECTED.releaseMembers &&
      keyframes.pristineGeneratedRefreshMemberCount ===
        keyframes.changedMemberCount &&
      keyframes.acceptanceBoundary?.strictComplete === false &&
      keyframes.acceptanceBoundary?.published === false,
    "keyframe successor generation result drifted");
    const desired = [];
    for (const relativePath of foundation.groups.all) {
      desired.push(await readOrdinary(cloneRoot, relativePath));
    }
    invariant(desired.length === 110,
      "desired mutable output count must be exactly 110");
    return {
      desired,
      readSet,
      closure,
      generatorResults: {coverage, trace, keyframes},
    };
  } finally {
    await rm(cloneRoot, {recursive: true, force: true});
  }
}

function validateDesiredMutable({desired, predecessor, groups}) {
  const desiredByPath = new Map(desired.map((record) => [record.path, record]));
  const predecessorByPath = new Map(predecessor.map((record) =>
    [record.path, record]));
  invariant(desiredByPath.size === 110 && predecessorByPath.size === 110,
    "predecessor/desired mutable path set drifted");
  for (const relativePath of groups.all) {
    const before = predecessorByPath.get(relativePath);
    const after = desiredByPath.get(relativePath);
    invariant(before && after && before.sha256 !== after.sha256,
      `${relativePath}: expected an exact downstream successor byte change`);
  }
  for (const relativePath of groups.keyframes) {
    invariant(isPristineGeneratedStructuralRefresh(
      predecessorByPath.get(relativePath).contents,
      desiredByPath.get(relativePath).contents,
    ), `${relativePath}: desired keyframe is not a pristine generated refresh`);
  }
  const desiredIndex = JSON.parse(
    desiredByPath.get(RELEASE_INDEX_RELATIVE).contents.toString("utf8"),
  );
  for (const [key, expected] of Object.entries(EXPECTED.desiredIndexTotals)) {
    invariant(desiredIndex[key] === expected,
      `desired complete trace index ${key} drifted`);
  }
  invariant(desiredIndex.releaseSelection?.scope === "complete-atomic-release" &&
    desiredIndex.releaseSelection.fullAtomicReleaseSelected === true &&
    desiredIndex.releaseSelection.selectedMemberCount === EXPECTED.releaseMembers,
  "desired trace index lost complete atomic-release identity");
  for (const target of TARGETS) {
    const member = desiredIndex.members.find(({animationId}) =>
      animationId === target.animationId);
    invariant(member?.technicalBindings?.frameDomainDisposition?.sha256 ===
      target.currentDisposition.sha256,
    `${target.animationId}: desired index does not bind current raw disposition`);
    const coveragePath = `migrations/${target.animationId}/evidence/full-frame-coverage.json`;
    const coverage = JSON.parse(
      desiredByPath.get(coveragePath).contents.toString("utf8"),
    );
    invariant(coverage.materialization?.frameDomainDisposition?.sha256 ===
      target.currentDisposition.sha256,
    `${target.animationId}: desired coverage does not bind current raw disposition`);
  }
  return descriptorSet(desired);
}

function archiveRelativeRoot() {
  return `${ARCHIVE_PARENT_RELATIVE}/${EXPECTED.nestedParentReport.sha256}`;
}

function buildArchiveManifest(predecessorSet, predecessor) {
  const predecessorByPath = new Map(predecessor.map((record) =>
    [record.path, record]));
  const document = {
    schemaVersion: 1,
    artifactType: "g4-l10-nested-parent-downstream-preimage-archive-v1",
    status: "immutable-ordinary-byte-copy-preimages",
    releaseId: RELEASE_ID,
    transitionAuthority: {...EXPECTED.nestedParentReport},
    mutablePreimageCount: predecessorSet.count,
    mutablePreimageBytes: predecessorSet.bytes,
    mutablePreimageSetSha256: predecessorSet.setSha256,
    storage: {
      root: archiveRelativeRoot(),
      filePrefix: "files/",
      ordinaryFilesOnly: true,
      symbolicLinksAllowed: false,
      hardLinksAllowed: false,
      manifestModeOctal: "0444",
      archivedFileModeOctal: "0444",
      publicationParentModeOctal: "0700",
      persistsAcrossFormalRollback: true,
      removedByTransaction: false,
      retryPolicy: "validate-exact-tree-and-reuse",
    },
    files: predecessorSet.files.map((item) => {
      const source = predecessorByPath.get(item.path);
      invariant(source, `${item.path}: archive source record is missing`);
      return {
        ...item,
        sourceModeOctal: modeOctal(source.sourceMode ?? source.mode),
        archiveModeOctal: "0444",
        archivePath: `${archiveRelativeRoot()}/files/${item.path}`,
      };
    }),
    acceptanceEffects: {
      originalRuntimeAccepted: false,
      behaviorAccepted: false,
      bilingualAccepted: false,
      audioAccepted: false,
      visualFidelityAccepted: false,
      fullFrameRmseAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    strictAcceptanceEffect: "none",
  };
  return recordForRendered(
    `${archiveRelativeRoot()}/manifest.json`,
    stableJson(document),
    {document},
  );
}

function acceptanceEffects() {
  return {
    originalRuntimeAccepted: false,
    behaviorAccepted: false,
    bilingualAccepted: false,
    audioAccepted: false,
    visualFidelityAccepted: false,
    fullFrameRmseAccepted: false,
    humanReviewAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    releaseAccepted: false,
    published: false,
  };
}

function assertAcceptanceFalse(document, label) {
  for (const [key, value] of Object.entries(document.acceptanceEffects || {})) {
    invariant(value === false, `${label}: acceptanceEffects.${key} must be false`);
  }
  invariant(Object.keys(document.acceptanceEffects || {}).length >= 10,
    `${label}: acceptance-effects boundary is incomplete`);
  invariant(String(document.strictAcceptanceEffect || "").startsWith("none"),
    `${label}: strict acceptance effect must remain none`);
}

function fingerprintDocument(document, field = "artifactFingerprintSha256") {
  const projection = structuredClone(document);
  delete projection[field];
  return sha256(Buffer.from(canonicalJson(projection)));
}

function targetDesiredSets(target, desired, groups) {
  const byPath = new Map(desired.map((record) => [record.path, record]));
  const tracePaths = groups.trace.filter((relativePath) =>
    relativePath.startsWith(`migrations/${target.animationId}/`));
  return {
    coverage: descriptor(byPath.get(
      `migrations/${target.animationId}/evidence/full-frame-coverage.json`,
    )),
    traceSpecs: descriptorSet(tracePaths.map((value) => byPath.get(value))),
    keyframes: descriptor(byPath.get(
      `migrations/${target.animationId}/keyframes.csv`,
    )),
    completeTraceIndex: descriptor(byPath.get(RELEASE_INDEX_RELATIVE)),
  };
}

function buildReceiptCore({foundation, desiredSet, archiveManifest, desired}) {
  const desiredByPath = new Map(desired.map((record) => [record.path, record]));
  return {
    schemaVersion: 1,
    receiptType: "g4-l10-nested-parent-downstream-successor-core-v1",
    releaseId: RELEASE_ID,
    fiveFileDispositionSuccessor: descriptor(foundation.reportRecord),
    currentRawDispositions: TARGETS.map(({animationId, currentDisposition}) => ({
      animationId,
      ...currentDisposition,
    })),
    desiredMutableSet: {
      count: desiredSet.count,
      bytes: desiredSet.bytes,
      setSha256: desiredSet.setSha256,
    },
    desiredCompleteTraceIndex: descriptor(
      desiredByPath.get(RELEASE_INDEX_RELATIVE),
    ),
    preimageArchiveManifest: descriptor(archiveManifest),
    nativeNoReplaceMover: {
      ...nativeMoverProvenance(),
      container: descriptor(foundation.self),
    },
    acceptanceEffects: acceptanceEffects(),
    strictAcceptanceEffect: "none",
  };
}

function buildRuntimeSuccessor({
  target,
  foundation,
  desired,
  groups,
  receiptCoreSha256,
}) {
  const sets = targetDesiredSets(target, desired, groups);
  const member = foundation.release.members.find(({animationId}) =>
    animationId === target.animationId);
  invariant(member?.ordinal === target.ordinal,
    `${target.animationId}: release member identity drifted`);
  const document = {
    schemaVersion: 1,
    artifactType: "g4-l10-release-runtime-acquisition-plan-nested-parent-successor-v1",
    status: "current-static-planning-successor-empty-non-runnable",
    identity: {
      releaseId: RELEASE_ID,
      animationId: target.animationId,
      ordinal: target.ordinal,
      assetId: member.assetId,
      sourcePath: member.source.path,
      sourceSha256: member.source.sha256,
    },
    provenance: {
      downstreamSuccessorGenerator: descriptor(foundation.self),
      predecessorRuntimePlan: target.predecessorRuntimePlan,
      predecessorAggregatePlanning: {
        json: EXPECTED.runtimeAggregate.json,
        markdown: EXPECTED.runtimeAggregate.markdown,
        historicalOnly: true,
        rewritten: false,
      },
      nestedParentFiveFileSuccessor: descriptor(foundation.reportRecord),
      currentRawFrameDomainDisposition: target.currentDisposition,
      downstreamSuccessorReceiptContract: {
        path: REPORT_JSON_RELATIVE,
        receiptCoreSha256,
        futureRuntimeV4BindingRequirement:
          "Any later runtime-v4 successor must bind both this exact raw frame-domain disposition and the exact downstream successor receipt file SHA-256.",
      },
      desiredCoverageV2: sets.coverage,
      desiredTraceSpecSet: {
        count: sets.traceSpecs.count,
        bytes: sets.traceSpecs.bytes,
        setSha256: sets.traceSpecs.setSha256,
      },
      desiredCompleteTraceIndex: sets.completeTraceIndex,
      desiredStructuralKeyframes: sets.keyframes,
      generators: EXPECTED.generators.slice(0, 3),
    },
    emptyRuntimeAcquisitionWorksheet: {
      assignedOperator: null,
      authorizedOriginalRuntime: null,
      executionSessions: [],
      originalRuntimeCaptures: [],
      audioCueBindings: [],
      implementationCaptures: [],
      rmseComparisons: [],
      humanReview: [],
      ownerReview: [],
    },
    executionGate: {
      runnable: false,
      authoritativeRuntimeSessionsExecuted: 0,
      originalRuntimeFramesCaptured: 0,
      implementationFramesCaptured: 0,
      rmseComparisonsCompleted: 0,
      humanReviewsCompleted: 0,
      ownerReviewsCompleted: 0,
      reason:
        "This companion is a static downstream-planning successor only; it creates no operator assignment, runtime execution, capture, comparison, review, or acceptance evidence.",
    },
    acceptanceEffects: acceptanceEffects(),
    strictAcceptanceEffect:
      "none; current disposition-bound downstream planning only; original runtime, behavior, bilingual and audio fidelity, implementation, full-frame/RMSE, human, owner, strict-completion, release, and publication gates remain false",
  };
  document.artifactFingerprintSha256 = fingerprintDocument(document);
  assertAcceptanceFalse(document, target.animationId);
  return recordForRendered(target.successorRuntimePlan, stableJson(document), {
    document,
    absentOnly: true,
  });
}

function buildReportMarkdown(report) {
  const lines = [
    "# G4 L10 nested-parent downstream successor v1",
    "",
    `- Release: \`${report.releaseId}\``,
    `- Status: \`${report.status}\``,
    `- Receipt core SHA-256: \`${report.receiptCoreSha256}\``,
    `- Mutable live successors: ${report.summary.mutableLiveSuccessorCount}`,
    `- Companion runtime successors: ${report.summary.companionRuntimeSuccessorCount}`,
    `- Append-only reports: ${report.summary.appendOnlyReportCount}`,
    `- Formally managed outputs: ${report.summary.formallyManagedOutputCount}`,
    `- Preimage archive files: ${report.preimageArchive.mutablePreimageCount} ordinary byte copies plus one manifest`,
    "- Preimage archive custody: persistent across formal rollback; exact-tree validation is required before retry reuse",
    `- Atomic move primitive: \`${report.generatedFrom.nativeNoReplaceMover.primitive}\``,
    "",
    "The transaction regenerates two coverage files and sixty target trace specifications, merges those two members into the complete 47-member trace index, and refreshes all 47 generated keyframe specifications because each binds the complete index SHA-256.",
    "",
    "The two historical runtime plans and their JSON/Markdown aggregate remain unchanged. Two versioned, empty, non-runnable companion successors bind the new static downstream state.",
    "",
    "No original-runtime session, renderer, bilingual/audio acceptance, full-frame or RMSE comparison, human review, owner acceptance, strict completion, release acceptance, or publication is established.",
    "",
  ];
  return lines.join("\n");
}

function buildFormalOutputs({
  foundation,
  predecessorSet,
  archiveManifest,
  desired,
  desiredSet,
}) {
  const receiptCore = buildReceiptCore({
    foundation,
    desiredSet,
    archiveManifest,
    desired,
  });
  const receiptCoreSha256 = sha256(Buffer.from(canonicalJson(receiptCore)));
  const runtimes = TARGETS.map((target) => buildRuntimeSuccessor({
    target,
    foundation,
    desired,
    groups: foundation.groups,
    receiptCoreSha256,
  }));
  const runtimeByAnimationId = new Map(runtimes.map((record) =>
    [record.document.identity.animationId, record]));
  const historicalRuntimeByPath = new Map(
    foundation.runtimePlanRecords.map((record) => [record.path, record]),
  );
  const runtimeResolution = foundation.release.members.map((member) => {
    const successor = runtimeByAnimationId.get(member.animationId);
    if (successor) {
      return {
        animationId: member.animationId,
        ordinal: member.ordinal,
        resolution: "nested-parent-successor-v1-companion",
        artifact: descriptor(successor),
      };
    }
    const relativePath =
      `migrations/${member.animationId}/audit/machine/release-runtime-acquisition-plan.json`;
    const historical = historicalRuntimeByPath.get(relativePath);
    invariant(historical,
      `${member.animationId}: historical runtime resolution is missing`);
    return {
      animationId: member.animationId,
      ordinal: member.ordinal,
      resolution: "unchanged-member-predecessor-remains-current",
      artifact: descriptor(historical),
    };
  });
  invariant(runtimeResolution.length === 47 &&
    runtimeResolution.filter(({resolution}) =>
      resolution === "nested-parent-successor-v1-companion").length === 2 &&
    runtimeResolution.filter(({resolution}) =>
      resolution === "unchanged-member-predecessor-remains-current").length === 45,
  "47-member runtime resolution partition drifted");
  const runtimeResolutionSetSha256 = sha256(Buffer.from(canonicalJson(
    runtimeResolution,
  )));
  const formalOutputPathAllowlist = [
    ...foundation.groups.all,
    ...runtimes.map(({path: value}) => value),
    REPORT_JSON_RELATIVE,
    REPORT_MD_RELATIVE,
  ];
  invariant(formalOutputPathAllowlist.length === 114 &&
    new Set(formalOutputPathAllowlist).size === 114,
  "formal output path allowlist must contain exactly 114 unique paths");
  const formalOutputPathAllowlistSha256 = sha256(Buffer.from(canonicalJson(
    formalOutputPathAllowlist,
  )));
  const desiredByPath = new Map(desired.map((record) => [record.path, record]));
  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-nested-parent-downstream-successor-v1",
    status: "current-static-downstream-successor-acceptance-neutral",
    releaseId: RELEASE_ID,
    generatedBy: descriptor(foundation.self),
    receiptCore,
    receiptCoreSha256,
    generatedFrom: {
      nestedParentFiveFileSuccessor: descriptor(foundation.reportRecord),
      historicalPreapplySuite: EXPECTED.historicalPreapplySuite,
      currentPostapplySuite: EXPECTED.currentPostapplySuite,
      currentRawDispositions: TARGETS.map(({animationId, currentDisposition}) => ({
        animationId,
        ...currentDisposition,
      })),
      generators: EXPECTED.generators,
      nativeNoReplaceMover: {
        ...nativeMoverProvenance(),
        container: descriptor(foundation.self),
      },
      historicalRuntimePlanning: {
        memberPlans: TARGETS.map(({animationId, predecessorRuntimePlan}) => ({
          animationId,
          ...predecessorRuntimePlan,
        })),
        aggregateJson: EXPECTED.runtimeAggregate.json,
        aggregateMarkdown: EXPECTED.runtimeAggregate.markdown,
        rewritten: false,
      },
    },
    preimageArchive: {
      root: archiveRelativeRoot(),
      manifest: descriptor(archiveManifest),
      mutablePreimageCount: predecessorSet.count,
      mutablePreimageBytes: predecessorSet.bytes,
      mutablePreimageSetSha256: predecessorSet.setSha256,
      ordinaryByteCopiesOnly: true,
      outsideFormallyManaged114Count: true,
      persistentCustody: true,
      persistsAcrossFormalRollback: true,
      removedByTransaction: false,
      retryPolicy: "validate-exact-tree-and-reuse",
      acceptanceNeutral: true,
    },
    mutationScope: {
      formallyManagedOutputCount: 114,
      mutableLiveSuccessorCount: 110,
      absentOnlyOutputCount: 4,
      formalOutputPathAllowlist,
      formalOutputPathAllowlistSha256,
      coverageSuccessors: foundation.groups.coverage.map((value) =>
        descriptor(desiredByPath.get(value))),
      targetTraceSpecSuccessorSet: descriptorSet(
        foundation.groups.trace.map((value) => desiredByPath.get(value)),
      ),
      completeTraceIndexSuccessor: descriptor(
        desiredByPath.get(RELEASE_INDEX_RELATIVE),
      ),
      structuralKeyframeSuccessorSet: descriptorSet(
        foundation.groups.keyframes.map((value) => desiredByPath.get(value)),
      ),
      companionRuntimeSuccessors: runtimes.map(descriptor),
      currentRuntimeResolution: {
        memberCount: 47,
        unchangedPredecessorCount: 45,
        nestedParentSuccessorCount: 2,
        setSha256: runtimeResolutionSetSha256,
        members: runtimeResolution,
      },
      appendOnlyReports: [REPORT_JSON_RELATIVE, REPORT_MD_RELATIVE],
      explicitlyUnchangedHistoricalArtifacts: [
        ...TARGETS.map(({predecessorRuntimePlan}) => predecessorRuntimePlan),
        EXPECTED.runtimeAggregate.json,
        EXPECTED.runtimeAggregate.markdown,
        EXPECTED.nestedParentReport,
        EXPECTED.historicalPreapplySuite,
      ],
    },
    summary: {
      mutableLiveSuccessorCount: 110,
      coverageSuccessorCount: 2,
      targetTraceSpecSuccessorCount: 60,
      completeTraceIndexSuccessorCount: 1,
      structuralKeyframeSuccessorCount: 47,
      companionRuntimeSuccessorCount: 2,
      currentRuntimeResolutionMemberCount: 47,
      unchangedRuntimePredecessorCount: 45,
      appendOnlyReportCount: 2,
      formallyManagedOutputCount: 114,
      desiredMutableBytes: desiredSet.bytes,
      desiredMutableSetSha256: desiredSet.setSha256,
      authoritativeRuntimeSessionsExecuted: 0,
      originalRuntimeFramesCaptured: 0,
      implementationFramesCaptured: 0,
      rmseComparisonsCompleted: 0,
      humanReviewsCompleted: 0,
      ownerReviewsCompleted: 0,
      strictCompletions: 0,
      publishedMembers: 0,
    },
    downstreamBoundary: {
      oldRuntimePlansRemainHistoricalAndStale: true,
      futureRuntimeV4BindingRequirement:
        "A future runtime-v4 artifact must bind both the exact raw disposition SHA-256 and the exact SHA-256 of this downstream receipt; neither path identity nor this receipt-core hash alone is sufficient.",
      rendererCreated: false,
      runtimeExecuted: false,
      reviewPerformed: false,
    },
    acceptanceEffects: acceptanceEffects(),
    strictAcceptanceEffect:
      "none; 110 generated static downstream bindings, two empty companion planning artifacts, and two append-only reports do not establish any runtime, renderer, bilingual/audio, visual, RMSE, human, owner, strict-completion, release, or publication acceptance",
  };
  report.reportFingerprintSha256 = fingerprintDocument(
    report,
    "reportFingerprintSha256",
  );
  assertAcceptanceFalse(report, "downstream successor report");
  const json = recordForRendered(REPORT_JSON_RELATIVE, stableJson(report), {
    document: report,
    absentOnly: true,
  });
  const markdown = recordForRendered(
    REPORT_MD_RELATIVE,
    buildReportMarkdown(report),
    {absentOnly: true},
  );
  return {runtimes, json, markdown, receiptCoreSha256};
}

async function assertArchiveTreeExact(root, archiveFilePaths) {
  const archiveRootRelative = archiveRelativeRoot();
  const archiveRootAbsolute = resolveProjectPath(root, archiveRootRelative);
  const rootBefore = await lstat(archiveRootAbsolute, {bigint: true});
  invariant(rootBefore.isDirectory() && !rootBefore.isSymbolicLink(),
    "preimage archive root must be one real directory");
  assertOwnerControlledNoGroupOtherWrite(rootBefore, "preimage archive root");
  invariant(Number(rootBefore.mode & 0o777n) === 0o700,
    "preimage archive root must retain mode 0700");
  const expectedFiles = ["manifest.json", ...archiveFilePaths].sort(compareText);
  const expectedDirectories = new Set(["files"]);
  for (const relativePath of expectedFiles) {
    let directory = portable(path.dirname(relativePath));
    while (directory !== ".") {
      expectedDirectories.add(directory);
      directory = portable(path.dirname(directory));
    }
  }
  const observedFiles = [];
  const observedDirectories = [];
  async function walkArchive(absolute, relative = "") {
    for (const entry of await readdir(absolute, {withFileTypes: true})) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const childAbsolute = path.join(absolute, entry.name);
      const childInfo = await lstat(childAbsolute, {bigint: true});
      invariant(!entry.isSymbolicLink() && !childInfo.isSymbolicLink(),
        `${archiveRootRelative}/${childRelative}: archive symlink is forbidden`);
      if (entry.isDirectory() && childInfo.isDirectory()) {
        observedDirectories.push(childRelative);
        await walkArchive(childAbsolute, childRelative);
      } else {
        invariant(entry.isFile() && childInfo.isFile() && childInfo.nlink === 1n,
          `${archiveRootRelative}/${childRelative}: archive entry is not an ordinary nlink=1 file`);
        observedFiles.push(childRelative);
      }
    }
  }
  await walkArchive(archiveRootAbsolute);
  const rootAfter = await lstat(archiveRootAbsolute, {bigint: true});
  invariant(JSON.stringify(identityFor(rootAfter)) ===
    JSON.stringify(identityFor(rootBefore)),
  "preimage archive root identity changed during exact-tree validation");
  invariant(JSON.stringify(observedFiles.sort(compareText)) ===
    JSON.stringify(expectedFiles) &&
    JSON.stringify(observedDirectories.sort(compareText)) ===
      JSON.stringify([...expectedDirectories].sort(compareText)),
  "preimage archive contains missing or extra file/directory debris");
}

async function loadArchivePredecessor(root, groups, {required = false} = {}) {
  const manifestRelative = `${archiveRelativeRoot()}/manifest.json`;
  const manifest = await readJsonRecord(root, manifestRelative, {allowMissing: true});
  if (!manifest.exists) {
    const archiveParentInfo = await lstatOrNull(
      resolveProjectPath(root, ARCHIVE_PARENT_RELATIVE),
    );
    invariant(!archiveParentInfo,
      `${ARCHIVE_PARENT_RELATIVE}: predecessor-first archive publication parent must be absent`);
    invariant(!required, `${manifestRelative}: preimage archive is missing`);
    return null;
  }
  invariant(manifest.document?.artifactType ===
    "g4-l10-nested-parent-downstream-preimage-archive-v1" &&
    manifest.document.mutablePreimageCount === 110 &&
    manifest.document.mutablePreimageSetSha256 ===
      EXPECTED.predecessorMutable.setSha256 &&
    manifest.document.storage?.manifestModeOctal === "0444" &&
    manifest.document.storage?.archivedFileModeOctal === "0444" &&
    manifest.document.storage?.publicationParentModeOctal === "0700" &&
    manifest.document.storage?.persistsAcrossFormalRollback === true &&
    manifest.document.storage?.removedByTransaction === false &&
    manifest.mode === 0o444,
  "preimage archive manifest identity drifted");
  invariant(manifest.document.files?.length === 110,
    "preimage archive manifest file allowlist drifted");
  const manifestRows = new Map(manifest.document.files.map((row) =>
    [row.path, row]));
  invariant(manifestRows.size === 110,
    "preimage archive manifest contains duplicate paths");
  const records = [];
  const archiveReadSet = [manifest];
  for (const relativePath of groups.all) {
    const archived = await readOrdinary(
      root,
      `${archiveRelativeRoot()}/files/${relativePath}`,
    );
    const row = manifestRows.get(relativePath);
    invariant(row?.archiveModeOctal === "0444" &&
      /^[0-7]{4}$/u.test(row.sourceModeOctal || "") &&
      archived.mode === 0o444,
    `${relativePath}: archived mode contract drifted`);
    archiveReadSet.push(archived);
    records.push({
      ...archived,
      path: relativePath,
      archivePath: archived.path,
      sourceMode: Number.parseInt(row.sourceModeOctal, 8),
    });
  }
  validatePredecessorMutable(records, groups);
  await assertArchiveTreeExact(
    root,
    groups.all.map((relativePath) => `files/${relativePath}`),
  );
  return {manifest, records, readSet: archiveReadSet};
}

async function loadPredecessor(root, current, groups) {
  const archived = await loadArchivePredecessor(root, groups);
  if (archived) return {
    records: archived.records,
    archive: archived,
    readSet: archived.readSet,
  };
  validatePredecessorMutable(current, groups);
  return {records: current, archive: null, readSet: []};
}

function outputState(current, predecessor, desired, auxiliaries) {
  const currentByPath = new Map(current.map((record) => [record.path, record]));
  const predecessorByPath = new Map(predecessor.map((record) =>
    [record.path, record]));
  const desiredByPath = new Map(desired.map((record) => [record.path, record]));
  const mutablePredecessor = [...currentByPath].every(([relativePath, record]) => {
    const expected = predecessorByPath.get(relativePath);
    return expected && record.bytes === expected.bytes &&
      record.sha256 === expected.sha256;
  });
  const mutableSuccessor = [...currentByPath].every(([relativePath, record]) => {
    const expected = desiredByPath.get(relativePath);
    return expected && record.bytes === expected.bytes &&
      record.sha256 === expected.sha256;
  });
  const auxiliaryAbsent = auxiliaries.every((record) => !record.exists);
  const auxiliarySuccessor = auxiliaries.every((record) => {
    const expected = desiredByPath.get(record.path);
    return record.exists && expected && record.bytes === expected.bytes &&
      record.sha256 === expected.sha256;
  });
  if (mutablePredecessor && auxiliaryAbsent) return "predecessor";
  if (mutableSuccessor && auxiliarySuccessor) return "successor";
  return "invalid-partial-or-foreign";
}

async function acquireLock(root, mode, {
  native,
  transactionHooks = {},
} = {}) {
  const lockPath = resolveProjectPath(root, LOCK_RELATIVE);
  const handle = await open(lockPath, "wx+", 0o600).catch((error) => {
    if (error?.code === "EEXIST") {
      throw new Error(`another downstream successor transaction holds ${LOCK_RELATIVE}`);
    }
    throw error;
  });
  let initialSnapshot;
  try {
    await handle.chmod(0o600);
    await handle.sync();
    const initialInfo = await handle.stat({bigint: true});
    const initialPathInfo = await lstat(lockPath, {bigint: true});
    invariant(JSON.stringify(identityFor(initialInfo)) ===
      JSON.stringify(identityFor(initialPathInfo)),
    `${LOCK_RELATIVE}: newly created lock differs from its open file descriptor`);
    initialSnapshot = await readOrdinary(root, LOCK_RELATIVE);
    await transactionHooks.beforeLockWrite?.({lockPath, handle, initialSnapshot});
    await handle.writeFile(`${JSON.stringify({pid: process.pid, mode})}\n`, "utf8");
    await handle.sync();
    const [handleInfo, pathInfo] = await Promise.all([
      handle.stat({bigint: true}),
      lstat(lockPath, {bigint: true}),
    ]);
    invariant(handleInfo.isFile() && pathInfo.isFile() &&
      !pathInfo.isSymbolicLink() && handleInfo.nlink === 1n &&
      JSON.stringify(identityFor(handleInfo)) === JSON.stringify(identityFor(pathInfo)),
    `${LOCK_RELATIVE}: lock path differs from its open file descriptor`);
    const snapshot = await readOrdinary(root, LOCK_RELATIVE);
    return {handle, lockPath, identity: identityFor(pathInfo), snapshot};
  } catch (error) {
    let cleanupExpected = initialSnapshot;
    try {
      const handleInfo = await handle.stat({bigint: true});
      const pathInfo = await lstatOrNull(lockPath);
      if (pathInfo && JSON.stringify(identityFor(handleInfo)) ===
        JSON.stringify(identityFor(pathInfo))) {
        cleanupExpected = await readOrdinary(root, LOCK_RELATIVE);
      }
    } catch {
      // A closed or replaced handle/path is intentionally handled by native CAS below.
    }
    await handle.close().catch(() => {});
    if (cleanupExpected) {
      try {
        await nativeDeleteExact({
          native,
          root,
          absolutePath: lockPath,
          expected: cleanupExpected,
          role: "lock-acquire-failure-cleanup",
          transactionHooks,
        });
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          `lock acquisition failed and exact native cleanup preserved unexplained custody`,
        );
      }
    }
    throw error;
  }
}

async function validateExistingArchive(root, manifestRecord, predecessor) {
  const observedManifest = await readOrdinary(root, manifestRecord.path);
  invariant(observedManifest.bytes === manifestRecord.bytes &&
    observedManifest.sha256 === manifestRecord.sha256 &&
    observedManifest.mode === 0o444,
  "existing preimage archive manifest differs from the deterministic manifest");
  const predecessorByPath = new Map(predecessor.map((record) =>
    [record.path, record]));
  for (const relativePath of predecessorByPath.keys()) {
    const archived = await readOrdinary(
      root,
      `${archiveRelativeRoot()}/files/${relativePath}`,
    );
    const expected = predecessorByPath.get(relativePath);
    invariant(archived.bytes === expected.bytes &&
      archived.sha256 === expected.sha256 && archived.mode === 0o444,
    `${relativePath}: existing preimage archive differs from predecessor`);
  }
  await assertArchiveTreeExact(
    root,
    manifestRecord.document.files.map(({path: relativePath}) =>
      `files/${relativePath}`),
  );
}

async function writeExactOrdinaryExclusive(absolutePath, contents, mode, label) {
  const bytes = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  const handle = await open(absolutePath, "wx+", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(mode);
    await handle.sync();
    const handleInfo = await handle.stat({bigint: true});
    const pathInfo = await lstat(absolutePath, {bigint: true});
    invariant(handleInfo.isFile() && pathInfo.isFile() &&
      !pathInfo.isSymbolicLink() && handleInfo.nlink === 1n &&
      JSON.stringify(identityFor(handleInfo)) === JSON.stringify(identityFor(pathInfo)) &&
      handleInfo.size === BigInt(bytes.length) &&
      Number(handleInfo.mode & 0o777n) === mode,
    `${label}: descriptor/path identity, size, link, or mode drifted after exclusive write`);
    return {identity: identityFor(handleInfo), bytes: bytes.length, sha256: sha256(bytes)};
  } finally {
    await handle.close();
  }
}

async function ensurePrivateArchiveParent(root, transactionHooks = {}) {
  const parent = resolveProjectPath(root, ARCHIVE_PARENT_RELATIVE);
  invariant(await lstatOrNull(parent) === null,
    `${ARCHIVE_PARENT_RELATIVE}: predecessor-first archive parent must still be absent immediately before creation`);
  let anchor = parent;
  while (await lstatOrNull(anchor) === null) {
    const next = path.dirname(anchor);
    invariant(next !== anchor,
      `${ARCHIVE_PARENT_RELATIVE}: cannot find an existing creation anchor`);
    anchor = next;
  }
  await assertRealDirectoryAncestors(anchor, "preimage archive creation anchor");
  invariant(isWithin(path.resolve(root), parent),
    "preimage archive parent escapes project root");
  let cursor = anchor;
  const created = [];
  for (const component of path.relative(anchor, parent)
    .split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    invariant(await lstatOrNull(cursor) === null,
      `${portable(path.relative(root, cursor))}: archive creation component unexpectedly exists`);
    await transactionHooks.beforeArchiveDirectoryCreate?.({
      root,
      directoryPath: cursor,
      relativePath: portable(path.relative(root, cursor)),
      isArchiveParent: cursor === parent,
    });
    try {
      await mkdir(cursor, {mode: 0o700});
    } catch (error) {
      if (error?.code === "EEXIST") {
        throw new Error(
          `${portable(path.relative(root, cursor))}: exclusive archive directory creation lost an EEXIST race; foreign path preserved without chmod`,
          {cause: error},
        );
      }
      throw error;
    }
    const info = await lstat(cursor, {bigint: true});
    invariant(info.isDirectory() && !info.isSymbolicLink(),
      `${portable(path.relative(root, cursor))}: archive path component is not one real directory`);
    assertOwnerControlledNoGroupOtherWrite(
      info,
      `${portable(path.relative(root, cursor))}: created archive directory`,
    );
    invariant(Number(info.mode & 0o777n) === 0o700,
      `${portable(path.relative(root, cursor))}: created archive directory must be mode 0700`);
    created.push({path: cursor, identity: nativeIdentity(info)});
  }
  const parentInfo = await assertRealDirectoryAncestors(
    parent,
    "preimage archive publication parent",
  );
  assertOwnerControlledNoGroupOtherWrite(
    parentInfo,
    "preimage archive publication parent",
  );
  invariant(Number(parentInfo.mode & 0o777n) === 0o700,
    "preimage archive publication parent must be mode 0700");
  const createdParent = created.at(-1);
  invariant(createdParent?.path === parent &&
    sameNativeIdentity(createdParent.identity, nativeIdentity(parentInfo)),
  "preimage archive publication parent differs from the transaction-created inode");
  return {parent, parentIdentity: createdParent.identity, created};
}


async function ensurePrivateArchiveStageDirectory({
  stageRoot,
  stageIdentity,
  directory,
  identities,
}) {
  const target = path.resolve(directory);
  invariant(isWithin(stageRoot, target),
    "archive stage directory escapes the private stage root");
  const rootInfo = await lstat(stageRoot, {bigint: true});
  invariant(sameNativeIdentity(nativeIdentity(rootInfo), stageIdentity),
    "archive stage root changed during private subdirectory creation");
  let cursor = stageRoot;
  for (const component of path.relative(stageRoot, target)
    .split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const prior = identities.get(cursor);
    if (prior) {
      const current = await lstat(cursor, {bigint: true});
      invariant(current.isDirectory() && !current.isSymbolicLink() &&
        sameNativeIdentity(nativeIdentity(current), prior),
      `${cursor}: archive stage directory identity changed`);
      continue;
    }
    invariant(await lstatOrNull(cursor) === null,
      `${cursor}: unowned archive stage entry already exists`);
    try {
      await mkdir(cursor, {mode: 0o700});
    } catch (error) {
      if (error?.code === "EEXIST") {
        throw new Error(`${cursor}: private archive stage mkdir lost an EEXIST race; preserving foreign entry`, {cause: error});
      }
      throw error;
    }
    const info = await lstat(cursor, {bigint: true});
    invariant(info.isDirectory() && !info.isSymbolicLink() &&
      Number(info.mode & 0o777n) === 0o700,
    `${cursor}: created archive stage directory contract drifted`);
    assertOwnerControlledNoGroupOtherWrite(info, `${cursor}: archive stage directory`);
    identities.set(cursor, nativeIdentity(info));
  }
}

async function installPreimageArchive(root, manifestRecord, predecessor, {
  native,
  transactionHooks = {},
} = {}) {
  const finalRoot = resolveProjectPath(root, archiveRelativeRoot());
  try {
    const info = await lstat(finalRoot, {bigint: true});
    invariant(info.isDirectory() && !info.isSymbolicLink(),
      "preimage archive root exists but is not an ordinary directory");
    await validateExistingArchive(root, manifestRecord, predecessor);
    return {
      created: false,
      reused: true,
      persistent: true,
      finalRoot,
    };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const archiveParent = await ensurePrivateArchiveParent(root, transactionHooks);
  const {parent} = archiveParent;
  const transactionId = `${process.pid}-${randomBytes(10).toString("hex")}`;
  const stageRoot = path.join(parent, `.${EXPECTED.nestedParentReport.sha256}.${transactionId}.stage`);
  invariant(await lstatOrNull(stageRoot) === null,
    "archive stage target must be absent before exclusive creation");
  await mkdir(stageRoot, {recursive: false, mode: 0o700});
  const stageRootInfo = await lstat(stageRoot, {bigint: true});
  invariant(stageRootInfo.isDirectory() && !stageRootInfo.isSymbolicLink() &&
    Number(stageRootInfo.mode & 0o777n) === 0o700,
  "archive stage root must be one transaction-created mode-0700 directory");
  assertOwnerControlledNoGroupOtherWrite(stageRootInfo, "archive stage root");
  const stageIdentity = nativeIdentity(stageRootInfo);
  const stageDirectoryIdentities = new Map([[stageRoot, stageIdentity]]);
  try {
    for (const record of predecessor) {
      const destination = path.join(stageRoot, "files", ...record.path.split("/"));
      await ensurePrivateArchiveStageDirectory({
        stageRoot,
        stageIdentity,
        directory: path.dirname(destination),
        identities: stageDirectoryIdentities,
      });
      const written = await writeExactOrdinaryExclusive(
        destination,
        record.contents,
        0o444,
        `${record.path}: staged preimage archive copy`,
      );
      const copiedInfo = await lstat(destination, {bigint: true});
      const copied = await readFile(destination);
      invariant(copiedInfo.isFile() && !copiedInfo.isSymbolicLink() &&
        copiedInfo.nlink === 1n && copied.length === record.bytes &&
        Number(copiedInfo.mode & 0o777n) === 0o444 &&
        sha256(copied) === record.sha256 &&
        written.bytes === record.bytes && written.sha256 === record.sha256,
      `${record.path}: staged preimage archive copy drifted`);
    }
    const stageManifest = path.join(stageRoot, "manifest.json");
    await writeExactOrdinaryExclusive(
      stageManifest,
      manifestRecord.contents,
      0o444,
      "staged preimage archive manifest",
    );
    const stageManifestInfo = await lstat(stageManifest, {bigint: true});
    invariant(sha256(await readFile(stageManifest)) === manifestRecord.sha256 &&
      Number(stageManifestInfo.mode & 0o777n) === 0o444,
      "staged preimage archive manifest drifted");
    const parentBeforePublish = await lstat(parent, {bigint: true});
    invariant(sameNativeIdentity(nativeIdentity(parentBeforePublish),
      archiveParent.parentIdentity),
    "archive publication parent changed after exclusive creation");
    const stageBeforePublish = await lstat(stageRoot, {bigint: true});
    invariant(sameNativeIdentity(nativeIdentity(stageBeforePublish), stageIdentity),
      "archive stage root changed before native publication");
    const publication = await nativeMoveNoReplace({
      native,
      sourcePath: stageRoot,
      targetPath: finalRoot,
      role: "archive-stage-to-final",
      transactionHooks,
    });
    await validateExistingArchive(root, manifestRecord, predecessor);
    return {
      created: true,
      reused: false,
      persistent: true,
      finalRoot,
      publication,
    };
  } catch (error) {
    const preservedPath = await lstatOrNull(finalRoot) ? finalRoot :
      await lstatOrNull(stageRoot) ? stageRoot : null;
    if (!preservedPath) throw error;
    throw new Error(
      `${error.message}; unpublished or published archive custody was preserved fail-closed at ${preservedPath}`,
      {cause: error},
    );
  }
}

function sameSnapshot(current, expected) {
  return current?.exists === expected?.exists && current?.exists === true &&
    current.bytes === expected.bytes && current.sha256 === expected.sha256 &&
    JSON.stringify(current.identity) === JSON.stringify(expected.identity);
}

function sameMovedPreimage(current, expected) {
  if (!current?.exists || !expected?.exists ||
    current.bytes !== expected.bytes || current.sha256 !== expected.sha256) {
    return false;
  }
  for (const key of ["dev", "ino", "mode", "size", "mtimeNs"]) {
    if (current.identity[key] !== expected.identity[key]) return false;
  }
  return true;
}

async function cleanupExactOwnedOrdinary(
  root,
  absolutePath,
  expected,
  label,
  {native, transactionHooks} = {},
) {
  return nativeDeleteExact({
    native,
    root,
    absolutePath,
    expected,
    role: label,
    transactionHooks,
  });
}

async function restoreMovedNoReplace(root, entry, {
  native,
  transactionHooks,
} = {}) {
  try {
    await nativeMoveNoReplace({
      native,
      sourcePath: entry.backupPath,
      targetPath: entry.absolutePath,
      role: "backup-to-live",
      transactionHooks,
    });
  } catch (error) {
    entry.preserveBackup = true;
    throw new Error(
      `${error.message}; unique moved bytes preserved at ${entry.backupPath}`,
    );
  }
  entry.phase = "restored";
}

async function rollbackInstalledNoReplace(root, entry, {
  native,
  transactionHooks,
} = {}) {
  const rollbackPath = `${entry.stagePath}.rollback`;
  entry.rollbackPath = rollbackPath;
  await nativeMoveNoReplace({
    native,
    sourcePath: entry.absolutePath,
    targetPath: rollbackPath,
    role: "installed-to-rollback",
    transactionHooks,
  });
  const moved = await readOrdinary(
    root,
    portable(path.relative(root, rollbackPath)),
  );
  if (!sameMovedPreimage(moved, entry.installedSnapshot)) {
    try {
      await nativeMoveNoReplace({
        native,
        sourcePath: rollbackPath,
        targetPath: entry.absolutePath,
        role: "rollback-to-live",
        transactionHooks,
      });
      entry.rollbackPath = null;
    } catch (error) {
      entry.preserveRollback = true;
      if (entry.expectedPreimage) entry.preserveBackup = true;
      throw new Error(
        `${error.message}; foreign bytes preserved at ${rollbackPath}`,
      );
    }
    if (entry.expectedPreimage) entry.preserveBackup = true;
    throw new Error(
      `${entry.path}: installed successor was replaced by foreign bytes; ` +
      `${entry.expectedPreimage ? `preimage preserved at ${entry.backupPath}` : "no predecessor existed"}`,
    );
  }
  if (entry.expectedPreimage) {
    await restoreMovedNoReplace(root, entry, {native, transactionHooks});
  } else entry.phase = "restored";
  await cleanupExactOwnedOrdinary(
    root,
    rollbackPath,
    moved,
    `${entry.path}: rolled-back successor cleanup`,
    {native, transactionHooks},
  );
  entry.rollbackPath = null;
}

async function commitFormalOutputs({
  root,
  entries,
  readSet,
  predecessor,
  livePreimages,
  archiveManifest,
  transactionHooks = {},
  testFailAfterInstall,
}) {
  invariant(entries.length === 114,
    "formal downstream transaction must contain exactly 114 outputs");
  invariant(entries.slice(-2).map(({path: value}) => value).join("\n") ===
    `${REPORT_JSON_RELATIVE}\n${REPORT_MD_RELATIVE}`,
  "append-only report pair must install last");
  const predecessorByPath = new Map(predecessor.map((record) =>
    [record.path, record]));
  const livePreimageByPath = new Map(livePreimages.map((record) =>
    [record.path, record]));
  let native = null;
  let lock = null;
  let archive = null;
  const transactionId = `${process.pid}-${randomBytes(12).toString("hex")}`;
  const prepared = [];
  let commitPointReached = false;
  try {
    native = await compileDarwinNoReplaceMover(root);
    lock = await acquireLock(root, "apply", {native, transactionHooks});
    await verifyReadSet(root, readSet);
    archive = await installPreimageArchive(
      root,
      archiveManifest,
      predecessor,
      {native, transactionHooks},
    );
    for (const entry of entries) {
      const absolutePath = resolveProjectPath(root, entry.path);
      const realRoot = await realpath(root);
      const parentInfo = await assertRealDirectoryAncestors(
        path.dirname(absolutePath),
        `${entry.path}: formal output parent`,
      );
      assertOwnerControlledNoGroupOtherWrite(
        parentInfo,
        `${entry.path}: formal output parent`,
      );
      const realParent = await realpath(path.dirname(absolutePath));
      invariant(isWithin(realRoot, realParent),
        `${entry.path}: output parent escapes project root`);
      const current = await readOrdinary(root, entry.path, {allowMissing: true});
      const expectedPreimage = predecessorByPath.get(entry.path);
      const livePreimage = livePreimageByPath.get(entry.path);
      if (expectedPreimage) {
        invariant(livePreimage && sameSnapshot(current, livePreimage) &&
          current.bytes === expectedPreimage.bytes &&
          current.sha256 === expectedPreimage.sha256,
        `${entry.path}: mutable preimage CAS failed before staging`);
      } else {
        invariant(!current.exists,
          `${entry.path}: absent-only runtime/report output already exists`);
      }
      const stagePath = path.join(
        path.dirname(absolutePath),
        `.${path.basename(absolutePath)}.${transactionId}.stage`,
      );
      const backupPath = path.join(
        path.dirname(absolutePath),
        `.${path.basename(absolutePath)}.${transactionId}.backup`,
      );
      await writeExactOrdinaryExclusive(
        stagePath,
        entry.contents,
        livePreimage?.mode || 0o644,
        `${entry.path}: formal successor stage`,
      );
      const stageRelative = portable(path.relative(root, stagePath));
      const staged = await readOrdinary(root, stageRelative);
      invariant(staged.bytes === entry.bytes && staged.sha256 === entry.sha256,
        `${entry.path}: staged successor identity mismatch`);
      prepared.push({
        ...entry,
        absolutePath,
        stagePath,
        backupPath,
        expectedPreimage,
        livePreimage,
        stagedSnapshot: staged,
        phase: "staged",
      });
    }
    await transactionHooks.afterStage?.({root, entries: prepared});
    await verifyReadSet(root, readSet);
    for (const [index, entry] of prepared.entries()) {
      const current = await readOrdinary(root, entry.path, {allowMissing: true});
      if (entry.expectedPreimage) {
        invariant(sameSnapshot(current, entry.livePreimage) &&
          current.bytes === entry.expectedPreimage.bytes &&
          current.sha256 === entry.expectedPreimage.sha256,
        `${entry.path}: mutable preimage CAS failed before install`);
        await nativeMoveNoReplace({
          native,
          sourcePath: entry.absolutePath,
          targetPath: entry.backupPath,
          role: "live-to-backup",
          transactionHooks,
        });
        entry.phase = "moved-unverified";
        const moved = await readOrdinary(
          root,
          portable(path.relative(root, entry.backupPath)),
        );
        if (!sameMovedPreimage(moved, entry.livePreimage)) {
          await restoreMovedNoReplace(root, entry, {native, transactionHooks});
          throw new Error(
            `${entry.path}: target inode changed during atomic move; foreign bytes restored`,
          );
        }
        entry.backupSnapshot = moved;
        entry.phase = "original-moved";
      } else {
        invariant(!current.exists,
          `${entry.path}: absent-only output appeared before install`);
      }
      await transactionHooks.beforeInstall?.({
        root,
        entry,
        index,
        entries: prepared,
      });
      await nativeMoveNoReplace({
        native,
        sourcePath: entry.stagePath,
        targetPath: entry.absolutePath,
        role: "stage-to-live",
        transactionHooks,
      });
      entry.phase = "installed";
      const installed = await readOrdinary(root, entry.path);
      invariant(installed.bytes === entry.bytes && installed.sha256 === entry.sha256 &&
        sameMovedPreimage(installed, entry.stagedSnapshot),
        `${entry.path}: installed successor identity mismatch`);
      entry.installedSnapshot = installed;
      await transactionHooks.afterInstall?.({root, entry, index, entries: prepared});
      if (testFailAfterInstall === index + 1) {
        throw new Error(`Injected transaction failure after ${index + 1} install(s)`);
      }
    }
    for (const entry of prepared) {
      const installed = await readOrdinary(root, entry.path);
      invariant(installed.bytes === entry.bytes && installed.sha256 === entry.sha256,
        `${entry.path}: final installed successor identity mismatch`);
    }
    commitPointReached = true;
    const backupCleanupErrors = [];
    try {
      await transactionHooks.beforeBackupCleanup?.({root, entries: prepared});
    } catch (error) {
      backupCleanupErrors.push(error);
    }
    try {
      await validateExistingArchive(root, archiveManifest, predecessor);
    } catch (error) {
      backupCleanupErrors.push(error);
    }
    for (const entry of prepared) {
      if (entry.expectedPreimage) {
        try {
          const installed = await readOrdinary(root, entry.path);
          invariant(sameSnapshot(installed, entry.installedSnapshot) &&
            installed.bytes === entry.bytes && installed.sha256 === entry.sha256,
            `${entry.path}: installed successor changed before backup release`);
          const backup = await readOrdinary(
            root,
            portable(path.relative(root, entry.backupPath)),
          );
          invariant(sameMovedPreimage(backup, entry.backupSnapshot),
            `${entry.path}: preimage backup changed before release`);
          await cleanupExactOwnedOrdinary(
            root,
            entry.backupPath,
            backup,
            `${entry.path}: committed preimage backup release`,
            {native, transactionHooks},
          );
          entry.phase = "committed";
        } catch (error) {
          entry.preserveBackup = true;
          backupCleanupErrors.push(error);
        }
      }
    }
    if (backupCleanupErrors.length) {
      throw new AggregateError(
        backupCleanupErrors,
        `downstream transaction committed but ${backupCleanupErrors.length} backup cleanup action(s) failed`,
      );
    }
  } catch (error) {
    if (commitPointReached) throw error;
    const rollbackErrors = [];
    for (const entry of [...prepared].reverse()) {
      try {
        if (entry.phase === "installed") {
          await rollbackInstalledNoReplace(root, entry, {
            native,
            transactionHooks,
          });
        } else if (entry.phase === "original-moved") {
          await restoreMovedNoReplace(root, entry, {
            native,
            transactionHooks,
          });
        } else if (entry.phase === "moved-unverified") {
          entry.preserveBackup = true;
          throw new Error(
            `${entry.path}: unverified moved bytes preserved at ${entry.backupPath}`,
          );
        }
        await cleanupExactOwnedOrdinary(
          root,
          entry.stagePath,
          entry.stagedSnapshot,
          `${entry.path}: uninstalled stage cleanup`,
          {native, transactionHooks},
        );
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        `downstream transaction failed and ${rollbackErrors.length} rollback action(s) failed`,
      );
    }
    throw error;
  } finally {
    const finalCleanupErrors = [];
    for (const entry of prepared) {
      await cleanupExactOwnedOrdinary(
        root,
        entry.stagePath,
        entry.stagedSnapshot,
        `${entry.path}: final stage cleanup`,
        {native, transactionHooks},
      ).catch((error) => finalCleanupErrors.push(error));
    }
    if (lock) {
      await lock.handle.close().catch((error) => finalCleanupErrors.push(error));
      try {
        await transactionHooks.beforeLockRelease?.({
          root,
          lockPath: lock.lockPath,
          snapshot: lock.snapshot,
        });
      } catch (error) {
        finalCleanupErrors.push(error);
      }
      await nativeDeleteExact({
        native,
        root,
        absolutePath: lock.lockPath,
        expected: lock.snapshot,
        role: "normal-lock-release",
        transactionHooks,
      }).catch((error) => finalCleanupErrors.push(error));
    }
    await cleanupNativeBuild(native).catch((error) => finalCleanupErrors.push(error));
    if (finalCleanupErrors.length) {
      throw new AggregateError(
        finalCleanupErrors,
        `downstream transaction cleanup left ${finalCleanupErrors.length} error(s) after lock-release attempts`,
      );
    }
  }
}

async function readFormalAuxiliaries(root) {
  const paths = [
    ...TARGETS.map(({successorRuntimePlan}) => successorRuntimePlan),
    REPORT_JSON_RELATIVE,
    REPORT_MD_RELATIVE,
  ];
  return Promise.all(paths.map((relativePath) =>
    readOrdinary(root, relativePath, {allowMissing: true})));
}

async function assertNoTransactionDebris(root, groups) {
  const lock = await readOrdinary(root, LOCK_RELATIVE, {allowMissing: true});
  invariant(!lock.exists,
    `${LOCK_RELATIVE}: preexisting transaction lock/debris is present`);
  const formalPaths = [
    ...groups.all,
    ...TARGETS.map(({successorRuntimePlan}) => successorRuntimePlan),
    REPORT_JSON_RELATIVE,
    REPORT_MD_RELATIVE,
  ];
  const directories = new Set(formalPaths.map((relativePath) =>
    portable(path.dirname(relativePath))));
  for (const relativeDirectory of directories) {
    const absoluteDirectory = resolveProjectPath(root, relativeDirectory);
    let entries;
    try {
      entries = await readdir(absoluteDirectory, {withFileTypes: true});
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    const debris = entries.filter(({name}) =>
      /^\..+\.\d+-[a-f0-9]{24}\.(?:(?:stage|backup)(?:\.rollback)?|delete-custody)$/u.test(name));
    invariant(debris.length === 0,
      `${relativeDirectory}: preexisting downstream transaction debris: ` +
      debris.map(({name}) => name).sort(compareText).join(", "));
  }
  const rootCustody = (await readdir(root, {withFileTypes: true}))
    .filter(({name}) =>
      /^\.\.g4-l10-nested-parent-downstream-successor-v1\.lock\.\d+-[a-f0-9]{24}\.delete-custody$/u.test(name));
  invariant(rootCustody.length === 0,
    `project root contains preexisting native lock custody debris: ` +
    rootCustody.map(({name}) => name).sort(compareText).join(", "));
  const archiveParent = resolveProjectPath(root, ARCHIVE_PARENT_RELATIVE);
  try {
    const debris = (await readdir(archiveParent, {withFileTypes: true}))
      .filter(({name}) => /^\.[a-f0-9]{64}\.\d+-[a-f0-9]{20}\.stage$/u.test(name));
    invariant(debris.length === 0,
      `${ARCHIVE_PARENT_RELATIVE}: preexisting archive stage debris`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function materializeG4L10NestedParentDownstreamSuccessorV1({
  mode = "dry-run",
  projectRoot: projectRootOption = PROJECT_ROOT,
  tempParent,
  transactionHooks = {},
  testFailAfterInstall,
} = {}) {
  invariant(["dry-run", "apply", "check"].includes(mode),
    `unknown mode: ${mode}`);
  const root = await realpath(path.resolve(projectRootOption));
  const rootInfo = await lstat(root, {bigint: true});
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    "project root must be a real directory, not a symlink");
  const foundation = await loadFixedFoundation(root);
  await assertNoTransactionDebris(root, foundation.groups);
  const current = await readMutableRecords(root, foundation.groups);
  const auxiliariesBefore = await readFormalAuxiliaries(root);
  const auxiliaryExistenceCount = auxiliariesBefore.filter(({exists}) => exists).length;
  invariant(auxiliaryExistenceCount === 0 || auxiliaryExistenceCount === 4,
    "absent-only runtime/report successor set is partial");
  const predecessorState = await loadPredecessor(
    root,
    current,
    foundation.groups,
  );
  const predecessor = predecessorState.records;
  const predecessorSet = validatePredecessorMutable(predecessor, foundation.groups);
  const archiveManifest = buildArchiveManifest(predecessorSet, predecessor);
  if (predecessorState.archive) {
    invariant(predecessorState.archive.manifest.bytes === archiveManifest.bytes &&
      predecessorState.archive.manifest.sha256 === archiveManifest.sha256,
    "installed preimage archive manifest differs from deterministic successor plan");
  }
  const built = await buildDesiredMutable(root, foundation, {tempParent});
  const desiredMutableSet = validateDesiredMutable({
    desired: built.desired,
    predecessor,
    groups: foundation.groups,
  });
  const formal = buildFormalOutputs({
    foundation,
    predecessorSet,
    archiveManifest,
    desired: built.desired,
    desiredSet: desiredMutableSet,
  });
  const entries = [
    ...built.desired,
    ...formal.runtimes,
    formal.json,
    formal.markdown,
  ];
  invariant(entries.length === 114 && new Set(entries.map(({path: value}) => value)).size === 114,
    "formal output set must contain 114 unique paths");
  invariant(JSON.stringify(entries.map(({path: value}) => value)) ===
    JSON.stringify(formal.json.document.mutationScope.formalOutputPathAllowlist),
  "formal output entries differ from the report's exact 114-path allowlist");
  const desiredByPath = new Map(entries.map((entry) => [entry.path, entry]));
  const state = outputState(current, predecessor, entries,
    auxiliariesBefore.map((record) => ({
      ...record,
      expected: desiredByPath.get(record.path),
    })));
  invariant(state !== "invalid-partial-or-foreign",
    "live downstream state is neither the exact predecessor nor exact successor; refusing partial/foreign state");
  const readSet = dedupeRecords([
    ...foundation.records,
    ...current,
    ...built.readSet,
    ...auxiliariesBefore,
    ...predecessorState.readSet,
  ].filter(({exists}) => exists));
  await verifyReadSet(root, readSet);
  if (mode === "check") {
    invariant(state === "successor",
      "downstream successor check requires the exact 114-output successor state");
  } else if (mode === "apply" && state === "predecessor") {
    await commitFormalOutputs({
      root,
      entries,
      readSet,
      predecessor,
      livePreimages: current,
      archiveManifest,
      transactionHooks,
      testFailAfterInstall,
    });
    const [installedMutable, installedAuxiliaries] = await Promise.all([
      readMutableRecords(root, foundation.groups),
      readFormalAuxiliaries(root),
    ]);
    invariant(outputState(installedMutable, predecessor, entries,
      installedAuxiliaries) === "successor",
    "formal successor state was not installed exactly");
    await loadArchivePredecessor(root, foundation.groups, {required: true});
  }
  return {
    action: mode === "check" ? "verified" :
      mode === "apply" ? (state === "successor" ? "already-current" : "installed") :
        "planned",
    inputState: state,
    mode,
    releaseId: RELEASE_ID,
    formallyManagedOutputCount: entries.length,
    mutableLiveSuccessorCount: built.desired.length,
    absentOnlyOutputCount: 4,
    predecessorMutableSet: {
      count: predecessorSet.count,
      bytes: predecessorSet.bytes,
      setSha256: predecessorSet.setSha256,
    },
    desiredMutableSet: {
      count: desiredMutableSet.count,
      bytes: desiredMutableSet.bytes,
      setSha256: desiredMutableSet.setSha256,
    },
    archiveManifest: descriptor(archiveManifest),
    runtimeSuccessors: formal.runtimes.map(descriptor),
    report: descriptor(formal.json),
    markdown: descriptor(formal.markdown),
    receiptCoreSha256: formal.receiptCoreSha256,
    generatorResults: built.generatorResults,
    cloneClosureFileCount: built.closure.length,
    acceptanceEffects: acceptanceEffects(),
    strictAcceptanceEffect: "none",
  };
}

export async function copyG4L10NestedParentDownstreamPredecessorFixture({
  sourceRoot: sourceRootOption = PROJECT_ROOT,
  destinationRoot,
} = {}) {
  invariant(destinationRoot, "destinationRoot is required");
  const sourceRoot = path.resolve(sourceRootOption);
  const destination = path.resolve(destinationRoot);
  invariant(sourceRoot !== destination && !isWithin(sourceRoot, destination),
    "fixture destination must remain outside the source project root");
  const foundation = await loadFixedFoundation(sourceRoot);
  const current = await readMutableRecords(sourceRoot, foundation.groups);
  const predecessor = (await loadPredecessor(
    sourceRoot,
    current,
    foundation.groups,
  )).records;
  const predecessorByPath = new Map(predecessor.map((record) =>
    [record.path, record]));
  const closure = await collectCloneClosurePaths(
    sourceRoot,
    foundation.indexRecord.document,
  );
  const fixed = [
    NESTED_PARENT_REPORT_RELATIVE,
    HISTORICAL_PREAPPLY_SUITE_RELATIVE,
    CURRENT_POSTAPPLY_SUITE_RELATIVE,
    EXPECTED.runtimeAggregate.json.path,
    EXPECTED.runtimeAggregate.markdown.path,
    ...foundation.runtimePlanRecords.map(({path: value}) => value),
  ];
  const paths = [...new Set([...closure, ...fixed])].sort(compareText);
  await mkdir(destination, {recursive: true});
  for (const relativePath of paths) {
    const predecessorRecord = predecessorByPath.get(relativePath);
    const sourcePath = predecessorRecord?.archivePath
      ? resolveProjectPath(sourceRoot, predecessorRecord.archivePath)
      : resolveProjectPath(sourceRoot, relativePath);
    const targetPath = resolveProjectPath(destination, relativePath);
    await mkdir(path.dirname(targetPath), {recursive: true});
    await copyFile(sourcePath, targetPath);
    const copied = await readOrdinary(destination, relativePath);
    const expected = predecessorRecord || await readOrdinary(sourceRoot, relativePath);
    invariant(copied.bytes === expected.bytes && copied.sha256 === expected.sha256,
      `${relativePath}: predecessor fixture copy drifted`);
  }
  return {destinationRoot: destination, copiedFileCount: paths.length};
}

export function parseArguments(argv) {
  const modes = argv.filter((argument) =>
    ["--dry-run", "--apply", "--check"].includes(argument));
  const unknown = argv.filter((argument) =>
    !["--dry-run", "--apply", "--check", "--help", "-h", "--json"].includes(argument));
  invariant(unknown.length === 0, `unknown argument(s): ${unknown.join(", ")}`);
  if (argv.includes("--help") || argv.includes("-h")) {
    return {help: true, mode: "", json: argv.includes("--json")};
  }
  invariant(modes.length === 1,
    "choose exactly one of --dry-run, --apply, or --check");
  return {
    help: false,
    mode: modes[0].slice(2),
    json: argv.includes("--json"),
  };
}

function usage() {
  return `Usage: node ${SCRIPT_RELATIVE} --dry-run|--apply|--check [--json]\n\n` +
    "Builds the exact G4 L10 TS007/TS008 nested-parent downstream successor. " +
    "Desired coverage, trace, complete-index, and all 47 keyframe bytes are " +
    "generated only inside a same-volume ordinary-copy clone. Apply installs " +
    "exactly 114 formally managed outputs with preimage custody, CAS, a dedicated " +
    "lock, same-directory staging/backups, rollback, and absent-only runtime/report " +
    "protection. No runtime, renderer, source asset, acceptance, or publication " +
    "state is created.\n";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await materializeG4L10NestedParentDownstreamSuccessorV1({
    mode: options.mode,
  });
  if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    process.stdout.write(
      `${result.action}: ${result.formallyManagedOutputCount} outputs; ` +
      `${result.mutableLiveSuccessorCount} mutable + ${result.absentOnlyOutputCount} absent-only; ` +
      `receipt core ${result.receiptCoreSha256}; strict acceptance unchanged.\n`,
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
