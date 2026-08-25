#define _DARWIN_C_SOURCE 1

#include <CommonCrypto/CommonDigest.h>
#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <limits.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/file.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#ifndef __APPLE__
#error "adaptive-canvas-atomic-commit is Darwin-only"
#endif
#ifndef RENAME_SWAP
#error "RENAME_SWAP is required"
#endif
#ifndef RENAME_EXCL
#error "RENAME_EXCL is required"
#endif
#ifndef RENAME_NOFOLLOW_ANY
#error "RENAME_NOFOLLOW_ANY is required"
#endif
#ifndef RENAME_RESOLVE_BENEATH
#error "RENAME_RESOLVE_BENEATH is required"
#endif
#ifndef O_NOFOLLOW_ANY
#error "O_NOFOLLOW_ANY is required"
#endif
#ifndef O_RESOLVE_BENEATH
#error "O_RESOLVE_BENEATH is required"
#endif
#ifndef AT_SYMLINK_NOFOLLOW_ANY
#error "AT_SYMLINK_NOFOLLOW_ANY is required"
#endif
#ifndef AT_RESOLVE_BENEATH
#error "AT_RESOLVE_BENEATH is required"
#endif

#ifndef ADAPTIVE_ATOMIC_STATIC_CONTRACT_SHA256
#error "ADAPTIVE_ATOMIC_STATIC_CONTRACT_SHA256 must be supplied by the reviewed build"
#endif
#ifndef ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT
#define ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT 286
#endif
#ifndef ADAPTIVE_ATOMIC_PRODUCTION
#define ADAPTIVE_ATOMIC_PRODUCTION 1
#endif

#define PROTOCOL "darwin-dirfd-renameatx-nofollow-atomic-batch-v2"
#define STATIC_SCHEMA "help-math-adaptive-canvas-atomic-static-contract/v1"
#define PRECONDITION_SCHEMA "help-math-adaptive-canvas-atomic-precondition/v1"
#define TRANSACTION_SCHEMA "help-math-adaptive-canvas-atomic-transaction/v2"
#define MANIFEST_MAGIC "HMACA1"
#define BASE_LEAF ".adaptive-canvas-atomic-v1"
#define MAX_MANIFEST_BYTES (1024U * 1024U)
#define MAX_ENTRY_COUNT 286U
#define IO_CHUNK (1024U * 1024U)
#define BUNDLE_FD 4
#define ZERO_SHA "0000000000000000000000000000000000000000000000000000000000000000"

typedef enum {
  PRESTATE_PRESENT = 1,
  PRESTATE_ABSENT = 2,
} prestate_kind;

typedef enum {
  ENTRY_NEEDS_STAGE = 1,
  ENTRY_UNCOMMITTED = 2,
  ENTRY_COMMITTED = 3,
  ENTRY_FOREIGN = 4,
} entry_state;

typedef struct {
  uint32_t ordinal;
  prestate_kind prestate;
  mode_t output_mode;
  uint64_t input_bytes;
  char input_sha[65];
  uint64_t output_bytes;
  char output_sha[65];
  uint64_t bundle_offset;
  uint64_t dev;
  uint64_t ino;
  uint64_t full_mode;
  uint64_t uid;
  uint64_t gid;
  uint64_t nlink;
  uint64_t mtime_ns;
  uint64_t ctime_ns;
  char *path;
  int parent_fd;
  char *leaf;
} manifest_entry;

typedef struct {
  char transaction[65];
  char static_contract_sha[65];
  uint64_t root_dev;
  uint64_t root_ino;
  uint64_t bundle_bytes;
  char bundle_sha[65];
  char plan_sha[65];
  char provenance_sha[65];
  char proof_sha[65];
  uint32_t entry_count;
  manifest_entry *entries;
  unsigned char *raw;
  size_t raw_length;
  char manifest_sha[65];
} manifest_document;

typedef struct {
  int exists;
  struct stat info;
  char sha[65];
} file_snapshot;

static const char *failure_code = "NATIVE_FAILURE";
static const char *failure_step = "unknown";
static int failure_errno = 0;

static int set_failure(const char *code, const char *step) {
  failure_code = code;
  failure_step = step;
  failure_errno = errno;
  return -1;
}

static int set_failure_without_errno(const char *code, const char *step) {
  failure_code = code;
  failure_step = step;
  failure_errno = 0;
  return -1;
}

static void hex_digest(const unsigned char digest[CC_SHA256_DIGEST_LENGTH], char out[65]) {
  static const char hex[] = "0123456789abcdef";
  for (size_t index = 0; index < CC_SHA256_DIGEST_LENGTH; index += 1) {
    out[index * 2] = hex[digest[index] >> 4];
    out[index * 2 + 1] = hex[digest[index] & 0x0f];
  }
  out[64] = '\0';
}

static void sha256_bytes(const void *bytes, size_t length, char out[65]) {
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  (void)CC_SHA256(bytes, (CC_LONG)length, digest);
  hex_digest(digest, out);
}

static int sha256_pattern(const char *value) {
  if (value == NULL || strlen(value) != 64) return 0;
  for (size_t index = 0; index < 64; index += 1) {
    const char byte = value[index];
    if (!((byte >= '0' && byte <= '9') || (byte >= 'a' && byte <= 'f'))) return 0;
  }
  return 1;
}

static int canonical_u64(const char *value, uint64_t *result) {
  if (value == NULL || value[0] == '\0') return 0;
  if (value[0] == '0' && value[1] != '\0') return 0;
  for (const char *cursor = value; *cursor != '\0'; cursor += 1) {
    if (*cursor < '0' || *cursor > '9') return 0;
  }
  errno = 0;
  char *end = NULL;
  const uintmax_t parsed = strtoumax(value, &end, 10);
  if (errno != 0 || end == value || *end != '\0' || parsed > UINT64_MAX) return 0;
  *result = (uint64_t)parsed;
  return 1;
}

static int canonical_octal_mode(const char *value, mode_t *result) {
  if (value == NULL || strlen(value) != 4) return 0;
  unsigned int mode = 0;
  for (size_t index = 0; index < 4; index += 1) {
    if (value[index] < '0' || value[index] > '7') return 0;
    mode = (mode << 3) | (unsigned int)(value[index] - '0');
  }
  if (mode > 0777U) return 0;
  *result = (mode_t)mode;
  return 1;
}

static int safe_relative_path(const char *value) {
  if (value == NULL || value[0] == '\0' || value[0] == '/' || strchr(value, '\\') != NULL) {
    return 0;
  }
  const char *component = value;
  size_t component_length = 0;
  for (const char *cursor = value;; cursor += 1) {
    const unsigned char byte = (unsigned char)*cursor;
    if (byte == '/' || byte == '\0') {
      if (component_length == 0 || component_length > NAME_MAX ||
          (component_length == 1 && component[0] == '.') ||
          (component_length == 2 && component[0] == '.' && component[1] == '.')) {
        return 0;
      }
      if (byte == '\0') break;
      component = cursor + 1;
      component_length = 0;
      continue;
    }
    if (!((byte >= 'A' && byte <= 'Z') || (byte >= 'a' && byte <= 'z') ||
          (byte >= '0' && byte <= '9') || byte == '.' || byte == '_' || byte == '-')) {
      return 0;
    }
    component_length += 1;
  }
  return 1;
}

static int read_stdin_manifest(unsigned char **bytes, size_t *length) {
  size_t capacity = 64U * 1024U;
  unsigned char *buffer = malloc(capacity + 1U);
  if (buffer == NULL) return set_failure_without_errno("OUT_OF_MEMORY", "manifest-read");
  size_t used = 0;
  for (;;) {
    if (used == capacity) {
      if (capacity >= MAX_MANIFEST_BYTES) {
        free(buffer);
        return set_failure_without_errno("MANIFEST_TOO_LARGE", "manifest-read");
      }
      capacity *= 2U;
      unsigned char *grown = realloc(buffer, capacity + 1U);
      if (grown == NULL) {
        free(buffer);
        return set_failure_without_errno("OUT_OF_MEMORY", "manifest-read");
      }
      buffer = grown;
    }
    const ssize_t count = read(STDIN_FILENO, buffer + used, capacity - used);
    if (count < 0) {
      if (errno == EINTR) continue;
      free(buffer);
      return set_failure("MANIFEST_READ_FAILED", "manifest-read");
    }
    if (count == 0) break;
    used += (size_t)count;
  }
  if (used == 0 || used > MAX_MANIFEST_BYTES || buffer[used - 1] != '\n' ||
      memchr(buffer, '\0', used) != NULL) {
    free(buffer);
    return set_failure_without_errno("MANIFEST_NONCANONICAL", "manifest-read");
  }
  buffer[used] = '\0';
  *bytes = buffer;
  *length = used;
  return 0;
}

static char *next_line(char **cursor) {
  if (*cursor == NULL || **cursor == '\0') return NULL;
  char *line = *cursor;
  char *newline = strchr(line, '\n');
  if (newline == NULL) return NULL;
  *newline = '\0';
  *cursor = newline + 1;
  return line;
}

static int exact_header(char *line, const char *name, char **value) {
  const size_t length = strlen(name);
  if (strncmp(line, name, length) != 0 || line[length] != '\t' || line[length + 1] == '\0') {
    return 0;
  }
  *value = line + length + 1;
  return 1;
}

static size_t split_tabs(char *line, char **fields, size_t maximum) {
  size_t count = 0;
  char *cursor = line;
  while (count < maximum) {
    fields[count++] = cursor;
    char *tab = strchr(cursor, '\t');
    if (tab == NULL) break;
    *tab = '\0';
    cursor = tab + 1;
  }
  if (strchr(cursor, '\t') != NULL) return maximum + 1U;
  return count;
}

static int parse_entry(char *line, uint32_t expected_ordinal, manifest_entry *entry) {
  char *fields[17];
  if (split_tabs(line, fields, 17) != 17) {
    return set_failure_without_errno("MANIFEST_ENTRY_SHAPE", "manifest-entry");
  }
  char ordinal_text[7];
  (void)snprintf(ordinal_text, sizeof ordinal_text, "%06u", expected_ordinal);
  if (strcmp(fields[0], ordinal_text) != 0) {
    return set_failure_without_errno("MANIFEST_ORDINAL_INVALID", "manifest-entry");
  }
  entry->ordinal = expected_ordinal;
  if (strcmp(fields[1], "present") == 0) entry->prestate = PRESTATE_PRESENT;
  else if (strcmp(fields[1], "absent") == 0) entry->prestate = PRESTATE_ABSENT;
  else return set_failure_without_errno("MANIFEST_PRESTATE_INVALID", "manifest-entry");
  if (!canonical_octal_mode(fields[2], &entry->output_mode) ||
      !canonical_u64(fields[3], &entry->input_bytes) || !sha256_pattern(fields[4]) ||
      !canonical_u64(fields[5], &entry->output_bytes) || entry->output_bytes == 0 ||
      !sha256_pattern(fields[6]) || !canonical_u64(fields[7], &entry->bundle_offset) ||
      !canonical_u64(fields[8], &entry->dev) || !canonical_u64(fields[9], &entry->ino) ||
      !canonical_u64(fields[10], &entry->full_mode) ||
      !canonical_u64(fields[11], &entry->uid) || !canonical_u64(fields[12], &entry->gid) ||
      !canonical_u64(fields[13], &entry->nlink) ||
      !canonical_u64(fields[14], &entry->mtime_ns) ||
      !canonical_u64(fields[15], &entry->ctime_ns) || !safe_relative_path(fields[16])) {
    return set_failure_without_errno("MANIFEST_ENTRY_INVALID", "manifest-entry");
  }
  if ((entry->prestate == PRESTATE_PRESENT &&
       (entry->input_bytes == 0 || strcmp(fields[4], ZERO_SHA) == 0 ||
        entry->dev == 0 || entry->ino == 0 || entry->nlink != 1)) ||
      (entry->prestate == PRESTATE_ABSENT &&
       (entry->input_bytes != 0 || strcmp(fields[4], ZERO_SHA) != 0 ||
        entry->dev != 0 || entry->ino != 0 || entry->full_mode != 0 ||
        entry->uid != 0 || entry->gid != 0 || entry->nlink != 0 ||
        entry->mtime_ns != 0 || entry->ctime_ns != 0))) {
    return set_failure_without_errno("MANIFEST_PRESTATE_IDENTITY_INVALID", "manifest-entry");
  }
  (void)memcpy(entry->input_sha, fields[4], 65);
  (void)memcpy(entry->output_sha, fields[6], 65);
  entry->path = strdup(fields[16]);
  entry->parent_fd = -1;
  entry->leaf = NULL;
  if (entry->path == NULL) return set_failure_without_errno("OUT_OF_MEMORY", "manifest-entry");
  return 0;
}

static void free_manifest(manifest_document *document) {
  if (document == NULL) return;
  if (document->entries != NULL) {
    for (uint32_t index = 0; index < document->entry_count; index += 1) {
      if (document->entries[index].parent_fd >= 0) (void)close(document->entries[index].parent_fd);
      free(document->entries[index].leaf);
      free(document->entries[index].path);
    }
  }
  free(document->entries);
  free(document->raw);
  (void)memset(document, 0, sizeof *document);
}

static int parse_manifest(manifest_document *document) {
  if (read_stdin_manifest(&document->raw, &document->raw_length) != 0) return -1;
  sha256_bytes(document->raw, document->raw_length, document->manifest_sha);
  char *copy = malloc(document->raw_length + 1U);
  if (copy == NULL) return set_failure_without_errno("OUT_OF_MEMORY", "manifest-parse");
  (void)memcpy(copy, document->raw, document->raw_length + 1U);
  char *cursor = copy;
  char *line = next_line(&cursor);
  if (line == NULL || strcmp(line, MANIFEST_MAGIC) != 0) goto noncanonical;
  char *value = NULL;
#define PARSE_HEADER(name, destination) \
  do { \
    line = next_line(&cursor); \
    if (line == NULL || !exact_header(line, name, &value) || !sha256_pattern(value)) goto noncanonical; \
    (void)memcpy(destination, value, 65); \
  } while (0)
  PARSE_HEADER("transaction", document->transaction);
  PARSE_HEADER("static-contract-sha256", document->static_contract_sha);
  line = next_line(&cursor);
  if (line == NULL || !exact_header(line, "root-dev", &value) ||
      !canonical_u64(value, &document->root_dev)) goto noncanonical;
  line = next_line(&cursor);
  if (line == NULL || !exact_header(line, "root-ino", &value) ||
      !canonical_u64(value, &document->root_ino)) goto noncanonical;
  line = next_line(&cursor);
  if (line == NULL || !exact_header(line, "bundle-bytes", &value) ||
      !canonical_u64(value, &document->bundle_bytes)) goto noncanonical;
  PARSE_HEADER("bundle-sha256", document->bundle_sha);
  PARSE_HEADER("plan-receipt-sha256", document->plan_sha);
  PARSE_HEADER("provenance-receipt-sha256", document->provenance_sha);
  PARSE_HEADER("proof-receipt-sha256", document->proof_sha);
#undef PARSE_HEADER
  uint64_t entry_count = 0;
  line = next_line(&cursor);
  if (line == NULL || !exact_header(line, "entry-count", &value) ||
      !canonical_u64(value, &entry_count) || entry_count == 0 ||
      entry_count > MAX_ENTRY_COUNT ||
      entry_count != (uint64_t)ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT) goto noncanonical;
  document->entry_count = (uint32_t)entry_count;
  line = next_line(&cursor);
  if (line == NULL || strcmp(line, "--") != 0) goto noncanonical;
  document->entries = calloc(document->entry_count, sizeof *document->entries);
  if (document->entries == NULL) {
    free(copy);
    return set_failure_without_errno("OUT_OF_MEMORY", "manifest-parse");
  }
  uint64_t expected_offset = 0;
  for (uint32_t index = 0; index < document->entry_count; index += 1) {
    line = next_line(&cursor);
    if (line == NULL || parse_entry(line, index + 1U, &document->entries[index]) != 0) {
      free(copy);
      return -1;
    }
    if (document->entries[index].bundle_offset != expected_offset ||
        UINT64_MAX - expected_offset < document->entries[index].output_bytes) goto noncanonical;
    expected_offset += document->entries[index].output_bytes;
  }
  if (expected_offset != document->bundle_bytes || *cursor != '\0') goto noncanonical;
  free(copy);
  return 0;

noncanonical:
  free(copy);
  return set_failure_without_errno("MANIFEST_NONCANONICAL", "manifest-parse");
}

static int sha_update_text(CC_SHA256_CTX *context, const char *text) {
  const size_t length = strlen(text);
  if (length > UINT32_MAX) return -1;
  return CC_SHA256_Update(context, text, (CC_LONG)length) == 1 ? 0 : -1;
}

static int validate_static_contract(const manifest_document *document) {
  CC_SHA256_CTX context;
  if (CC_SHA256_Init(&context) != 1 || sha_update_text(&context, STATIC_SCHEMA "\n") != 0) {
    return set_failure_without_errno("SHA256_FAILED", "static-contract");
  }
  char line[PATH_MAX + 256];
  int length = snprintf(line, sizeof line, "entry-count\t%u\n", document->entry_count);
  if (length <= 0 || (size_t)length >= sizeof line || sha_update_text(&context, line) != 0) {
    return set_failure_without_errno("STATIC_CONTRACT_ENCODING_FAILED", "static-contract");
  }
  for (uint32_t index = 0; index < document->entry_count; index += 1) {
    const manifest_entry *entry = &document->entries[index];
    length = snprintf(
      line,
      sizeof line,
      "%06u\t%s\t%04o\t%" PRIu64 "\t%s\t%" PRIu64 "\t%s\t%s\n",
      entry->ordinal,
      entry->prestate == PRESTATE_PRESENT ? "present" : "absent",
      (unsigned int)entry->output_mode,
      entry->input_bytes,
      entry->input_sha,
      entry->output_bytes,
      entry->output_sha,
      entry->path
    );
    if (length <= 0 || (size_t)length >= sizeof line || sha_update_text(&context, line) != 0) {
      return set_failure_without_errno("STATIC_CONTRACT_ENCODING_FAILED", "static-contract");
    }
  }
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  if (CC_SHA256_Final(digest, &context) != 1) {
    return set_failure_without_errno("SHA256_FAILED", "static-contract");
  }
  char actual[65];
  hex_digest(digest, actual);
  if (!sha256_pattern(document->static_contract_sha) ||
      strcmp(actual, document->static_contract_sha) != 0 ||
      strcmp(actual, ADAPTIVE_ATOMIC_STATIC_CONTRACT_SHA256) != 0) {
    return set_failure_without_errno("STATIC_CONTRACT_MISMATCH", "static-contract");
  }
  return 0;
}

static int precondition_sha256(const manifest_document *document, char out[65]) {
  CC_SHA256_CTX context;
  if (CC_SHA256_Init(&context) != 1 ||
      sha_update_text(&context, PRECONDITION_SCHEMA "\n") != 0) {
    return set_failure_without_errno("SHA256_FAILED", "precondition-contract");
  }
  char line[PATH_MAX + 384];
  int length = snprintf(line, sizeof line, "entry-count\t%u\n", document->entry_count);
  if (length <= 0 || (size_t)length >= sizeof line ||
      sha_update_text(&context, line) != 0) {
    return set_failure_without_errno(
      "PRECONDITION_CONTRACT_ENCODING_FAILED",
      "precondition-contract"
    );
  }
  for (uint32_t index = 0; index < document->entry_count; index += 1) {
    const manifest_entry *entry = &document->entries[index];
    length = snprintf(
      line,
      sizeof line,
      "%06u\t%s\t%" PRIu64 "\t%" PRIu64 "\t%" PRIu64 "\t%" PRIu64
        "\t%" PRIu64 "\t%" PRIu64 "\t%" PRIu64 "\t%" PRIu64 "\t%s\n",
      entry->ordinal,
      entry->prestate == PRESTATE_PRESENT ? "present" : "absent",
      entry->dev,
      entry->ino,
      entry->full_mode,
      entry->uid,
      entry->gid,
      entry->nlink,
      entry->mtime_ns,
      entry->ctime_ns,
      entry->path
    );
    if (length <= 0 || (size_t)length >= sizeof line ||
        sha_update_text(&context, line) != 0) {
      return set_failure_without_errno(
        "PRECONDITION_CONTRACT_ENCODING_FAILED",
        "precondition-contract"
      );
    }
  }
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  if (CC_SHA256_Final(digest, &context) != 1) {
    return set_failure_without_errno("SHA256_FAILED", "precondition-contract");
  }
  hex_digest(digest, out);
  return 0;
}

static int validate_transaction_id(const manifest_document *document) {
  if (!sha256_pattern(document->transaction) || !sha256_pattern(document->bundle_sha) ||
      !sha256_pattern(document->plan_sha) || !sha256_pattern(document->provenance_sha) ||
      !sha256_pattern(document->proof_sha)) {
    return set_failure_without_errno("TRANSACTION_IDENTITY_INVALID", "transaction");
  }
  char precondition_sha[65];
  if (precondition_sha256(document, precondition_sha) != 0) return -1;
  char text[1024];
  const int length = snprintf(
    text,
    sizeof text,
    TRANSACTION_SCHEMA "\n%s\n%s\n%" PRIu64 "\n%" PRIu64 "\n%" PRIu64
      "\n%s\n%s\n%s\n%s\n",
    document->static_contract_sha,
    precondition_sha,
    document->root_dev,
    document->root_ino,
    document->bundle_bytes,
    document->bundle_sha,
    document->plan_sha,
    document->provenance_sha,
    document->proof_sha
  );
  if (length <= 0 || (size_t)length >= sizeof text) {
    return set_failure_without_errno("TRANSACTION_IDENTITY_INVALID", "transaction");
  }
  char actual[65];
  sha256_bytes(text, (size_t)length, actual);
  if (strcmp(actual, document->transaction) != 0) {
    return set_failure_without_errno("TRANSACTION_IDENTITY_MISMATCH", "transaction");
  }
  return 0;
}

static int full_sync(int descriptor, const char *step) {
  if (fsync(descriptor) != 0) return set_failure("FSYNC_FAILED", step);
  if (fcntl(descriptor, F_FULLFSYNC) != 0) return set_failure("FULLFSYNC_FAILED", step);
  return 0;
}

static int hash_fd_range(int descriptor, uint64_t offset, uint64_t length, char out[65]) {
  unsigned char *buffer = malloc(IO_CHUNK);
  if (buffer == NULL) return set_failure_without_errno("OUT_OF_MEMORY", "hash-file");
  CC_SHA256_CTX context;
  if (CC_SHA256_Init(&context) != 1) {
    free(buffer);
    return set_failure_without_errno("SHA256_FAILED", "hash-file");
  }
  uint64_t consumed = 0;
  while (consumed < length) {
    const size_t requested = (size_t)((length - consumed) > IO_CHUNK ? IO_CHUNK : (length - consumed));
    ssize_t count = pread(descriptor, buffer, requested, (off_t)(offset + consumed));
    if (count < 0) {
      if (errno == EINTR) continue;
      free(buffer);
      return set_failure("FILE_READ_FAILED", "hash-file");
    }
    if (count == 0) {
      free(buffer);
      return set_failure_without_errno("FILE_SHORT_READ", "hash-file");
    }
    if (CC_SHA256_Update(&context, buffer, (CC_LONG)count) != 1) {
      free(buffer);
      return set_failure_without_errno("SHA256_FAILED", "hash-file");
    }
    consumed += (uint64_t)count;
  }
  free(buffer);
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  if (CC_SHA256_Final(digest, &context) != 1) {
    return set_failure_without_errno("SHA256_FAILED", "hash-file");
  }
  hex_digest(digest, out);
  return 0;
}

static uint64_t timespec_ns(struct timespec value) {
  return ((uint64_t)value.tv_sec * UINT64_C(1000000000)) + (uint64_t)value.tv_nsec;
}

static int stable_snapshot_at(int parent_fd, const char *leaf, file_snapshot *snapshot) {
  (void)memset(snapshot, 0, sizeof *snapshot);
  const int descriptor = openat(
    parent_fd,
    leaf,
    O_RDONLY | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH
  );
  if (descriptor < 0) {
    if (errno == ENOENT) return 0;
    return set_failure(errno == ELOOP ? "SYMLINK_REJECTED" : "FILE_OPEN_FAILED", "snapshot");
  }
  struct stat before;
  struct stat after;
  if (fstat(descriptor, &before) != 0 || !S_ISREG(before.st_mode) || before.st_nlink != 1) {
    (void)close(descriptor);
    return set_failure_without_errno("UNSAFE_FILE_TYPE", "snapshot");
  }
  if (hash_fd_range(descriptor, 0, (uint64_t)before.st_size, snapshot->sha) != 0) {
    (void)close(descriptor);
    return -1;
  }
  if (fstat(descriptor, &after) != 0 || before.st_dev != after.st_dev ||
      before.st_ino != after.st_ino || before.st_size != after.st_size ||
      before.st_mode != after.st_mode || before.st_nlink != after.st_nlink ||
      before.st_mtimespec.tv_sec != after.st_mtimespec.tv_sec ||
      before.st_mtimespec.tv_nsec != after.st_mtimespec.tv_nsec ||
      before.st_ctimespec.tv_sec != after.st_ctimespec.tv_sec ||
      before.st_ctimespec.tv_nsec != after.st_ctimespec.tv_nsec) {
    (void)close(descriptor);
    return set_failure_without_errno("FILE_DRIFT_DURING_READ", "snapshot");
  }
  (void)close(descriptor);
  snapshot->exists = 1;
  snapshot->info = after;
  return 0;
}

static int snapshot_matches_output(const file_snapshot *snapshot, const manifest_entry *entry) {
  return snapshot->exists && (uint64_t)snapshot->info.st_size == entry->output_bytes &&
    (snapshot->info.st_mode & 0777) == entry->output_mode &&
    strcmp(snapshot->sha, entry->output_sha) == 0;
}

static int snapshot_matches_input(const file_snapshot *snapshot, const manifest_entry *entry) {
  return snapshot->exists && entry->prestate == PRESTATE_PRESENT &&
    (uint64_t)snapshot->info.st_dev == entry->dev &&
    (uint64_t)snapshot->info.st_ino == entry->ino &&
    (uint64_t)snapshot->info.st_size == entry->input_bytes &&
    (uint64_t)snapshot->info.st_mode == entry->full_mode &&
    (uint64_t)snapshot->info.st_uid == entry->uid &&
    (uint64_t)snapshot->info.st_gid == entry->gid &&
    (uint64_t)snapshot->info.st_nlink == entry->nlink &&
    timespec_ns(snapshot->info.st_mtimespec) == entry->mtime_ns &&
    strcmp(snapshot->sha, entry->input_sha) == 0;
}

static int stage_leaf(uint32_t ordinal, char out[32]) {
  return snprintf(out, 32, "%06u.bin", ordinal) > 0 ? 0 : -1;
}

static int inspect_entry_state(int stage_fd, const manifest_entry *entry, entry_state *state) {
  char stage_name[32];
  (void)stage_leaf(entry->ordinal, stage_name);
  file_snapshot target;
  file_snapshot stage;
  if (stable_snapshot_at(entry->parent_fd, entry->leaf, &target) != 0 ||
      stable_snapshot_at(stage_fd, stage_name, &stage) != 0) return -1;
  if (entry->prestate == PRESTATE_PRESENT) {
    if (snapshot_matches_input(&target, entry) && !stage.exists) {
      *state = ENTRY_NEEDS_STAGE;
      return 0;
    }
    if (snapshot_matches_input(&target, entry) && snapshot_matches_output(&stage, entry)) {
      *state = ENTRY_UNCOMMITTED;
      return 0;
    }
    if (snapshot_matches_output(&target, entry) && snapshot_matches_input(&stage, entry)) {
      *state = ENTRY_COMMITTED;
      return 0;
    }
  } else {
    if (!target.exists && !stage.exists) {
      *state = ENTRY_NEEDS_STAGE;
      return 0;
    }
    if (!target.exists && snapshot_matches_output(&stage, entry)) {
      *state = ENTRY_UNCOMMITTED;
      return 0;
    }
    if (snapshot_matches_output(&target, entry) && !stage.exists) {
      *state = ENTRY_COMMITTED;
      return 0;
    }
  }
  *state = ENTRY_FOREIGN;
  return 0;
}

static int ensure_directory_at(int parent_fd, const char *leaf, mode_t mode, int *created) {
  *created = 0;
  if (mkdirat(parent_fd, leaf, mode) == 0) *created = 1;
  else if (errno != EEXIST) return set_failure("MKDIRAT_FAILED", "transaction-directory");
  const int descriptor = openat(
    parent_fd,
    leaf,
    O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH
  );
  if (descriptor < 0) return set_failure("DIRECTORY_OPEN_FAILED", "transaction-directory");
  struct stat info;
  if (fstat(descriptor, &info) != 0 || !S_ISDIR(info.st_mode) ||
      info.st_uid != geteuid() || (info.st_mode & 0777) != mode) {
    (void)close(descriptor);
    return set_failure_without_errno("DIRECTORY_POLICY_MISMATCH", "transaction-directory");
  }
  if (*created) {
    if (fsync(descriptor) != 0 || fsync(parent_fd) != 0) {
      (void)close(descriptor);
      return set_failure("FSYNC_FAILED", "transaction-directory");
    }
  }
  return descriptor;
}

static int write_all(int descriptor, const unsigned char *bytes, size_t length) {
  size_t offset = 0;
  while (offset < length) {
    const ssize_t count = write(descriptor, bytes + offset, length - offset);
    if (count < 0) {
      if (errno == EINTR) continue;
      return set_failure("FILE_WRITE_FAILED", "write-all");
    }
    if (count == 0) return set_failure_without_errno("FILE_SHORT_WRITE", "write-all");
    offset += (size_t)count;
  }
  return 0;
}

static int publish_bytes_no_replace(
  int parent_fd,
  const char *leaf,
  const unsigned char *bytes,
  size_t length,
  mode_t mode
) {
  file_snapshot existing;
  if (stable_snapshot_at(parent_fd, leaf, &existing) != 0) return -1;
  char expected_sha[65];
  sha256_bytes(bytes, length, expected_sha);
  if (existing.exists) {
    if ((uint64_t)existing.info.st_size == (uint64_t)length &&
        (existing.info.st_mode & 0777) == mode && strcmp(existing.sha, expected_sha) == 0) return 0;
    return set_failure_without_errno("NO_REPLACE_CONFLICT", "publish-evidence");
  }
  char temporary[96];
  const int temporary_length = snprintf(
    temporary,
    sizeof temporary,
    ".%s-%ld.tmp",
    leaf,
    (long)getpid()
  );
  if (temporary_length <= 0 || (size_t)temporary_length >= sizeof temporary) {
    return set_failure_without_errno("TEMPORARY_NAME_FAILED", "publish-evidence");
  }
  int descriptor = openat(
    parent_fd,
    temporary,
    O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH,
    0600
  );
  if (descriptor < 0) return set_failure("TEMP_CREATE_FAILED", "publish-evidence");
  int result = 0;
  if (write_all(descriptor, bytes, length) != 0 || fchmod(descriptor, mode) != 0 ||
      full_sync(descriptor, "publish-evidence-file") != 0) result = -1;
  if (close(descriptor) != 0 && result == 0) result = set_failure("CLOSE_FAILED", "publish-evidence");
  if (result != 0) return -1;
  const unsigned int flags = RENAME_EXCL | RENAME_NOFOLLOW_ANY | RENAME_RESOLVE_BENEATH;
  if (renameatx_np(parent_fd, temporary, parent_fd, leaf, flags) != 0) {
    if (errno == EEXIST) {
      if (stable_snapshot_at(parent_fd, leaf, &existing) == 0 && existing.exists &&
          (uint64_t)existing.info.st_size == (uint64_t)length &&
          (existing.info.st_mode & 0777) == mode && strcmp(existing.sha, expected_sha) == 0) {
        return 0;
      }
    }
    return set_failure("RENAME_EXCL_FAILED", "publish-evidence");
  }
  if (fsync(parent_fd) != 0) return set_failure("FSYNC_FAILED", "publish-evidence-parent");
  return 0;
}

static void maybe_crash(const char *point, uint32_t ordinal);

static int copy_bundle_entry(int bundle_fd, int stage_fd, const manifest_entry *entry) {
  char leaf[32];
  (void)stage_leaf(entry->ordinal, leaf);
  char candidate[96];
  int descriptor = -1;
  for (uint32_t attempt = 0; attempt < 128U; attempt += 1U) {
    const int length = snprintf(
      candidate,
      sizeof candidate,
      ".%06u.candidate.%ld.%03u",
      entry->ordinal,
      (long)getpid(),
      attempt
    );
    if (length <= 0 || (size_t)length >= sizeof candidate) {
      return set_failure_without_errno("TEMPORARY_NAME_FAILED", "stage-output");
    }
    descriptor = openat(
      stage_fd,
      candidate,
      O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH,
      0600
    );
    if (descriptor >= 0) break;
    if (errno != EEXIST) return set_failure("STAGE_CREATE_FAILED", "stage-output");
  }
  if (descriptor < 0) return set_failure("STAGE_CREATE_FAILED", "stage-output");
  unsigned char *buffer = malloc(IO_CHUNK);
  if (buffer == NULL) {
    (void)close(descriptor);
    return set_failure_without_errno("OUT_OF_MEMORY", "stage-output");
  }
  CC_SHA256_CTX context;
  (void)CC_SHA256_Init(&context);
  uint64_t consumed = 0;
  int result = 0;
  while (consumed < entry->output_bytes) {
    const size_t requested = (size_t)((entry->output_bytes - consumed) > IO_CHUNK
      ? IO_CHUNK : (entry->output_bytes - consumed));
    ssize_t count = pread(bundle_fd, buffer, requested, (off_t)(entry->bundle_offset + consumed));
    if (count < 0) {
      if (errno == EINTR) continue;
      result = set_failure("BUNDLE_READ_FAILED", "stage-output");
      break;
    }
    if (count == 0) {
      result = set_failure_without_errno("BUNDLE_SHORT_READ", "stage-output");
      break;
    }
    if (write_all(descriptor, buffer, (size_t)count) != 0 ||
        CC_SHA256_Update(&context, buffer, (CC_LONG)count) != 1) {
      result = -1;
      break;
    }
    consumed += (uint64_t)count;
    maybe_crash("after-stage-chunk", entry->ordinal);
  }
  free(buffer);
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  char actual[65];
  if (result == 0) {
    if (CC_SHA256_Final(digest, &context) != 1) result = set_failure_without_errno("SHA256_FAILED", "stage-output");
    else {
      hex_digest(digest, actual);
      if (strcmp(actual, entry->output_sha) != 0) result = set_failure_without_errno("OUTPUT_HASH_MISMATCH", "stage-output");
    }
  }
  if (result == 0 && (fchmod(descriptor, entry->output_mode) != 0 ||
      full_sync(descriptor, "stage-output-file") != 0)) result = -1;
  if (close(descriptor) != 0 && result == 0) result = set_failure("CLOSE_FAILED", "stage-output");
  if (result != 0) return -1;
  const unsigned int flags = RENAME_EXCL | RENAME_NOFOLLOW_ANY | RENAME_RESOLVE_BENEATH;
  if (renameatx_np(stage_fd, candidate, stage_fd, leaf, flags) != 0) {
    return set_failure("STAGE_PUBLISH_FAILED", "stage-output");
  }
  if (fsync(stage_fd) != 0) return set_failure("FSYNC_FAILED", "stage-directory");
  return 0;
}

static int open_relative_parent(int root_fd, manifest_entry *entry) {
  char *copy = strdup(entry->path);
  if (copy == NULL) return set_failure_without_errno("OUT_OF_MEMORY", "target-parent");
  char *slash = strrchr(copy, '/');
  char *leaf = copy;
  int current = fcntl(root_fd, F_DUPFD_CLOEXEC, 0);
  if (current < 0) {
    free(copy);
    return set_failure("FD_DUPLICATION_FAILED", "target-parent");
  }
  if (slash != NULL) {
    *slash = '\0';
    leaf = slash + 1;
    char *save = NULL;
    for (char *component = strtok_r(copy, "/", &save); component != NULL;
         component = strtok_r(NULL, "/", &save)) {
      const int next = openat(
        current,
        component,
        O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH
      );
      if (next < 0) {
        (void)close(current);
        free(copy);
        return set_failure(errno == ELOOP ? "SYMLINK_REJECTED" : "ANCESTOR_OPEN_FAILED", "target-parent");
      }
      (void)close(current);
      current = next;
    }
  }
  entry->leaf = strdup(leaf);
  free(copy);
  if (entry->leaf == NULL) {
    (void)close(current);
    return set_failure_without_errno("OUT_OF_MEMORY", "target-parent");
  }
  entry->parent_fd = current;
  return 0;
}

static int verify_relative_parent_binding(int root_fd, const manifest_entry *entry) {
  char *copy = strdup(entry->path);
  if (copy == NULL) return set_failure_without_errno("OUT_OF_MEMORY", "parent-binding");
  char *slash = strrchr(copy, '/');
  int current = fcntl(root_fd, F_DUPFD_CLOEXEC, 0);
  if (current < 0) {
    free(copy);
    return set_failure("FD_DUPLICATION_FAILED", "parent-binding");
  }
  if (slash != NULL) {
    *slash = '\0';
    char *save = NULL;
    for (char *component = strtok_r(copy, "/", &save); component != NULL;
         component = strtok_r(NULL, "/", &save)) {
      const int next = openat(
        current,
        component,
        O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH
      );
      if (next < 0) {
        (void)close(current);
        free(copy);
        return set_failure(
          errno == ELOOP ? "SYMLINK_REJECTED" : "ANCESTOR_IDENTITY_MISMATCH",
          "parent-binding"
        );
      }
      (void)close(current);
      current = next;
    }
  }
  struct stat retained;
  struct stat current_path;
  const int mismatch = fstat(entry->parent_fd, &retained) != 0 ||
    fstat(current, &current_path) != 0 ||
    retained.st_dev != current_path.st_dev || retained.st_ino != current_path.st_ino;
  (void)close(current);
  free(copy);
  if (mismatch) {
    return set_failure_without_errno("ANCESTOR_IDENTITY_MISMATCH", "parent-binding");
  }
  return 0;
}

static int ensure_fd_capacity(uint32_t entries) {
  struct rlimit limit;
  if (getrlimit(RLIMIT_NOFILE, &limit) != 0) return set_failure("RLIMIT_FAILED", "fd-capacity");
  const rlim_t needed = (rlim_t)entries + 96U;
  if (limit.rlim_cur < needed) {
    if (limit.rlim_max < needed) return set_failure_without_errno("FD_LIMIT_TOO_LOW", "fd-capacity");
    limit.rlim_cur = needed;
    if (setrlimit(RLIMIT_NOFILE, &limit) != 0) return set_failure("RLIMIT_FAILED", "fd-capacity");
  }
  return 0;
}

static int append_journal(int tx_fd, const char *event, uint32_t ordinal, const manifest_document *document) {
  const int descriptor = openat(
    tx_fd,
    "journal.log",
    O_WRONLY | O_APPEND | O_CREAT | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH,
    0600
  );
  if (descriptor < 0) return set_failure("JOURNAL_OPEN_FAILED", "journal");
  char line[512];
  const int length = snprintf(
    line,
    sizeof line,
    "%s\t%06u\t%s\t%s\n",
    event,
    ordinal,
    document->transaction,
    document->manifest_sha
  );
  int result = 0;
  if (length <= 0 || (size_t)length >= sizeof line ||
      write_all(descriptor, (const unsigned char *)line, (size_t)length) != 0 ||
      full_sync(descriptor, "journal-file") != 0) result = -1;
  if (close(descriptor) != 0 && result == 0) result = set_failure("CLOSE_FAILED", "journal");
  if (result == 0 && fsync(tx_fd) != 0) result = set_failure("FSYNC_FAILED", "journal-parent");
  return result;
}

#if defined(ADAPTIVE_ATOMIC_TESTING) && ADAPTIVE_ATOMIC_TESTING == 1
static void maybe_crash(const char *point, uint32_t ordinal) {
  const char *configured = getenv("HELP_MATH_ADAPTIVE_ATOMIC_CRASH_POINT");
  if (configured == NULL) return;
  char expected[128];
  if (ordinal == 0) (void)snprintf(expected, sizeof expected, "%s", point);
  else (void)snprintf(expected, sizeof expected, "%s:%u", point, ordinal);
  if (strcmp(configured, expected) == 0) _exit(86);
}

static void maybe_pause(const char *point) {
  const char *configured = getenv("HELP_MATH_ADAPTIVE_ATOMIC_PAUSE_POINT");
  if (configured != NULL && strcmp(configured, point) == 0) (void)sleep(2U);
}
#else
static void maybe_crash(const char *point, uint32_t ordinal) {
  (void)point;
  (void)ordinal;
}

static void maybe_pause(const char *point) {
  (void)point;
}
#endif

static int validate_prefix_states(int stage_fd, manifest_document *document, uint32_t *committed) {
  int saw_uncommitted = 0;
  *committed = 0;
  for (uint32_t index = 0; index < document->entry_count; index += 1) {
    entry_state state;
    if (inspect_entry_state(stage_fd, &document->entries[index], &state) != 0) return -1;
    if (state == ENTRY_NEEDS_STAGE) {
      if (copy_bundle_entry(BUNDLE_FD, stage_fd, &document->entries[index]) != 0) return -1;
      if (inspect_entry_state(stage_fd, &document->entries[index], &state) != 0) return -1;
    }
    if (state == ENTRY_FOREIGN || (state == ENTRY_COMMITTED && saw_uncommitted)) {
      return set_failure_without_errno("TRANSACTION_STATE_FOREIGN", "transaction-state");
    }
    if (state == ENTRY_COMMITTED) *committed += 1U;
    else if (state == ENTRY_UNCOMMITTED) saw_uncommitted = 1;
    else return set_failure_without_errno("TRANSACTION_STATE_INVALID", "transaction-state");
  }
  return 0;
}

static int commit_entry(int stage_fd, manifest_entry *entry) {
  char stage_name[32];
  (void)stage_leaf(entry->ordinal, stage_name);
  const unsigned int flags = (entry->prestate == PRESTATE_PRESENT ? RENAME_SWAP : RENAME_EXCL) |
    RENAME_NOFOLLOW_ANY | RENAME_RESOLVE_BENEATH;
  if (renameatx_np(stage_fd, stage_name, entry->parent_fd, entry->leaf, flags) != 0) {
    return set_failure("ATOMIC_RENAME_FAILED", "commit-entry");
  }
  if (fsync(entry->parent_fd) != 0 || fsync(stage_fd) != 0) {
    return set_failure("FSYNC_FAILED", "commit-entry");
  }
  entry_state state;
  if (inspect_entry_state(stage_fd, entry, &state) != 0) return -1;
  if (state != ENTRY_COMMITTED) {
    return set_failure_without_errno("COMMIT_POSTCONDITION_UNCERTAIN", "commit-entry");
  }
  return 0;
}

static int rollback_entry(int stage_fd, manifest_entry *entry) {
  char stage_name[32];
  (void)stage_leaf(entry->ordinal, stage_name);
  const unsigned int flags = (entry->prestate == PRESTATE_PRESENT ? RENAME_SWAP : RENAME_EXCL) |
    RENAME_NOFOLLOW_ANY | RENAME_RESOLVE_BENEATH;
  int result;
  if (entry->prestate == PRESTATE_PRESENT) {
    result = renameatx_np(stage_fd, stage_name, entry->parent_fd, entry->leaf, flags);
  } else {
    result = renameatx_np(entry->parent_fd, entry->leaf, stage_fd, stage_name, flags);
  }
  if (result != 0) return set_failure("ATOMIC_RENAME_FAILED", "rollback-entry");
  if (fsync(entry->parent_fd) != 0 || fsync(stage_fd) != 0) {
    return set_failure("FSYNC_FAILED", "rollback-entry");
  }
  entry_state state;
  if (inspect_entry_state(stage_fd, entry, &state) != 0) return -1;
  if (state != ENTRY_UNCOMMITTED) {
    return set_failure_without_errno("ROLLBACK_POSTCONDITION_UNCERTAIN", "rollback-entry");
  }
  return 0;
}

static int verify_bundle(const manifest_document *document) {
  struct stat bundle;
  if (fstat(BUNDLE_FD, &bundle) != 0 || !S_ISREG(bundle.st_mode) ||
      (bundle.st_nlink != 0 && bundle.st_nlink != 1) ||
      (uint64_t)bundle.st_size != document->bundle_bytes) {
    return set_failure_without_errno("BUNDLE_IDENTITY_INVALID", "bundle");
  }
  char actual[65];
  if (hash_fd_range(BUNDLE_FD, 0, document->bundle_bytes, actual) != 0) return -1;
  if (strcmp(actual, document->bundle_sha) != 0) {
    return set_failure_without_errno("BUNDLE_HASH_MISMATCH", "bundle");
  }
  return 0;
}

static int open_project_root(const char *path, const manifest_document *document) {
  if (path == NULL || path[0] != '/' || strlen(path) >= PATH_MAX) {
    return set_failure_without_errno("PROJECT_ROOT_INVALID", "project-root");
  }
  const int descriptor = open(path, O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW_ANY);
  if (descriptor < 0) return set_failure("PROJECT_ROOT_OPEN_FAILED", "project-root");
  struct stat info;
  if (fstat(descriptor, &info) != 0 || !S_ISDIR(info.st_mode) ||
      (uint64_t)info.st_dev != document->root_dev ||
      (uint64_t)info.st_ino != document->root_ino) {
    (void)close(descriptor);
    return set_failure_without_errno("PROJECT_ROOT_IDENTITY_MISMATCH", "project-root");
  }
  return descriptor;
}

static int publish_terminal(int tx_fd, const char *state, const manifest_document *document) {
  char bytes[512];
  const int length = snprintf(
    bytes,
    sizeof bytes,
    "state=%s\ntransaction=%s\nmanifest-sha256=%s\nstatic-contract-sha256=%s\n",
    state,
    document->transaction,
    document->manifest_sha,
    document->static_contract_sha
  );
  if (length <= 0 || (size_t)length >= sizeof bytes) {
    return set_failure_without_errno("TERMINAL_ENCODING_FAILED", "terminal");
  }
  const char *leaf = strcmp(state, "committed") == 0 ? "terminal.committed" : "terminal.rolled-back";
  return publish_bytes_no_replace(
    tx_fd,
    leaf,
    (const unsigned char *)bytes,
    (size_t)length,
    0400
  );
}

static int execute_transaction(const char *action, const char *root_path, manifest_document *document) {
  if (validate_static_contract(document) != 0 || validate_transaction_id(document) != 0 ||
      verify_bundle(document) != 0 || ensure_fd_capacity(document->entry_count) != 0) return -1;
  const int root_fd = open_project_root(root_path, document);
  if (root_fd < 0) return -1;
  int result = -1;
  int work_fd = -1;
  int base_fd = -1;
  int tx_fd = -1;
  int stage_fd = -1;
  int lock_fd = -1;
  work_fd = openat(root_fd, "work", O_RDONLY | O_DIRECTORY | O_CLOEXEC |
    O_NOFOLLOW_ANY | O_RESOLVE_BENEATH);
  if (work_fd < 0) {
    (void)set_failure("WORK_DIRECTORY_OPEN_FAILED", "work-directory");
    goto cleanup;
  }
  struct stat work_info;
  if (fstat(work_fd, &work_info) != 0 || !S_ISDIR(work_info.st_mode) ||
      work_info.st_uid != geteuid() || (work_info.st_mode & 0022) != 0) {
    (void)set_failure_without_errno("WORK_DIRECTORY_POLICY_MISMATCH", "work-directory");
    goto cleanup;
  }
  int created = 0;
  base_fd = ensure_directory_at(work_fd, BASE_LEAF, 0700, &created);
  if (base_fd < 0) goto cleanup;
  char tx_leaf[80];
  (void)snprintf(tx_leaf, sizeof tx_leaf, "tx-%s", document->transaction);
  tx_fd = ensure_directory_at(base_fd, tx_leaf, 0700, &created);
  if (tx_fd < 0) goto cleanup;
  lock_fd = openat(
    tx_fd,
    "transaction.lock",
    O_RDWR | O_CREAT | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH,
    0600
  );
  if (lock_fd < 0) {
    (void)set_failure("LOCK_OPEN_FAILED", "transaction-lock");
    goto cleanup;
  }
  struct stat lock_info;
  if (fstat(lock_fd, &lock_info) != 0 || !S_ISREG(lock_info.st_mode) ||
      lock_info.st_uid != geteuid() || lock_info.st_nlink != 1 ||
      (lock_info.st_mode & 0777) != 0600) {
    (void)set_failure_without_errno("LOCK_POLICY_MISMATCH", "transaction-lock");
    goto cleanup;
  }
  if (flock(lock_fd, LOCK_EX | LOCK_NB) != 0) {
    (void)set_failure(errno == EWOULDBLOCK ? "TRANSACTION_BUSY" : "LOCK_FAILED", "transaction-lock");
    goto cleanup;
  }
  if (publish_bytes_no_replace(
        tx_fd,
        "manifest.bin",
        document->raw,
        document->raw_length,
        0400
      ) != 0) goto cleanup;
  stage_fd = ensure_directory_at(tx_fd, "stage", 0700, &created);
  if (stage_fd < 0) goto cleanup;
  for (uint32_t index = 0; index < document->entry_count; index += 1) {
    if (open_relative_parent(root_fd, &document->entries[index]) != 0) goto cleanup;
  }
  uint32_t committed = 0;
  if (validate_prefix_states(stage_fd, document, &committed) != 0) goto cleanup;
  if (append_journal(tx_fd, "prepared", committed, document) != 0) goto cleanup;
  maybe_crash("after-prepare", 0);
  maybe_pause("after-prepare");
  for (uint32_t index = 0; index < document->entry_count; index += 1) {
    if (verify_relative_parent_binding(root_fd, &document->entries[index]) != 0) {
      goto cleanup;
    }
  }

  if (strcmp(action, "inspect") == 0) {
    result = 0;
    goto cleanup;
  }
  if (strcmp(action, "apply") == 0 && committed != 0) {
    (void)set_failure_without_errno("RECOVERY_REQUIRED", "transaction-state");
    goto cleanup;
  }
  if (strcmp(action, "apply") == 0 || strcmp(action, "recover-forward") == 0) {
    for (uint32_t index = committed; index < document->entry_count; index += 1) {
      if (verify_relative_parent_binding(root_fd, &document->entries[index]) != 0) {
        goto cleanup;
      }
      if (commit_entry(stage_fd, &document->entries[index]) != 0) goto cleanup;
      if (verify_relative_parent_binding(root_fd, &document->entries[index]) != 0) {
        for (uint32_t rollback_index = index + 1U;
             rollback_index > 0; rollback_index -= 1U) {
          if (rollback_entry(stage_fd, &document->entries[rollback_index - 1U]) != 0) {
            goto cleanup;
          }
        }
        (void)set_failure_without_errno("ANCESTOR_IDENTITY_MISMATCH", "parent-binding");
        goto cleanup;
      }
      maybe_crash("after-rename", index + 1U);
      if (append_journal(tx_fd, "committed", index + 1U, document) != 0) goto cleanup;
      maybe_crash("after-journal", index + 1U);
    }
    for (uint32_t index = 0; index < document->entry_count; index += 1) {
      if (verify_relative_parent_binding(root_fd, &document->entries[index]) != 0) {
        for (uint32_t rollback_index = document->entry_count;
             rollback_index > 0; rollback_index -= 1U) {
          if (rollback_entry(stage_fd, &document->entries[rollback_index - 1U]) != 0) {
            goto cleanup;
          }
        }
        (void)set_failure_without_errno("ANCESTOR_IDENTITY_MISMATCH", "parent-binding");
        goto cleanup;
      }
    }
    if (publish_terminal(tx_fd, "committed", document) != 0) goto cleanup;
    maybe_crash("after-terminal", 0);
    result = 0;
    goto cleanup;
  }
  if (strcmp(action, "recover-rollback") == 0) {
    for (uint32_t index = committed; index > 0; index -= 1) {
      if (rollback_entry(stage_fd, &document->entries[index - 1U]) != 0) goto cleanup;
      if (append_journal(tx_fd, "rolled-back", index - 1U, document) != 0) goto cleanup;
    }
    if (publish_terminal(tx_fd, "rolled-back", document) != 0) goto cleanup;
    result = 0;
    goto cleanup;
  }
  (void)set_failure_without_errno("ACTION_INVALID", "action");

cleanup:
  if (stage_fd >= 0) (void)close(stage_fd);
  if (lock_fd >= 0) (void)close(lock_fd);
  if (tx_fd >= 0) (void)close(tx_fd);
  if (base_fd >= 0) (void)close(base_fd);
  if (work_fd >= 0) (void)close(work_fd);
  (void)close(root_fd);
  return result;
}

static void emit_error(void) {
  (void)printf(
    "{\"ok\":false,\"error\":{\"code\":\"%s\",\"step\":\"%s\",\"errno\":%d}}\n",
    failure_code,
    failure_step,
    failure_errno
  );
}

static void emit_success(const char *action, const manifest_document *document) {
  const char *status = strcmp(action, "recover-rollback") == 0
    ? "rolled-back-with-custody" :
    (strcmp(action, "inspect") == 0 ? "transaction-inspected" : "committed-with-preimage-custody");
  (void)printf(
    "{\"ok\":true,\"status\":\"%s\",\"protocol\":\"%s\","
    "\"transactionId\":\"%s\",\"manifestSha256\":\"%s\","
    "\"staticContractSha256\":\"%s\",\"entryCount\":%u,"
    "\"bindingCommittedLast\":true,\"preimageCustodyRetained\":true}\n",
    status,
    PROTOCOL,
    document->transaction,
    document->manifest_sha,
    document->static_contract_sha,
    document->entry_count
  );
}

static int capabilities(void) {
  (void)printf(
    "{\"ok\":true,\"status\":\"capability-ready\",\"protocol\":\"%s\","
    "\"production\":%s,\"expectedEntryCount\":%u,"
    "\"staticContractSha256\":\"%s\","
    "\"syscalls\":[\"openat\",\"fstatat\",\"renameatx_np\","
    "\"flock\",\"fsync\",\"F_FULLFSYNC\"],"
    "\"renameFlags\":[\"RENAME_SWAP\",\"RENAME_EXCL\","
    "\"RENAME_NOFOLLOW_ANY\",\"RENAME_RESOLVE_BENEATH\"],"
    "\"pathFlags\":[\"O_NOFOLLOW_ANY\",\"O_RESOLVE_BENEATH\","
    "\"AT_SYMLINK_NOFOLLOW_ANY\",\"AT_RESOLVE_BENEATH\"],"
    "\"recovery\":[\"recover-forward\",\"recover-rollback\"],"
    "\"stagingPolicy\":\"candidate-fullsync-hash-then-rename-excl\","
    "\"deletionPolicy\":\"retain-all-preimages-and-uncertain-inodes\"}\n",
    PROTOCOL,
    ADAPTIVE_ATOMIC_PRODUCTION ? "true" : "false",
    (unsigned int)ADAPTIVE_ATOMIC_EXPECTED_ENTRY_COUNT,
    ADAPTIVE_ATOMIC_STATIC_CONTRACT_SHA256
  );
  return 0;
}

int main(int argc, char **argv) {
  if (argc == 2 && strcmp(argv[1], "--capabilities") == 0) return capabilities();
  if (argc != 3 ||
      (strcmp(argv[1], "--apply") != 0 &&
       strcmp(argv[1], "--recover-forward") != 0 &&
       strcmp(argv[1], "--recover-rollback") != 0 &&
       strcmp(argv[1], "--inspect") != 0)) {
    failure_code = "USAGE_INVALID";
    failure_step = "argv";
    emit_error();
    return 64;
  }
  struct stat executable;
  if (fstat(3, &executable) != 0 || !S_ISREG(executable.st_mode) ||
      executable.st_nlink < 1 || (executable.st_mode & 0111) == 0) {
    failure_code = "EXECUTABLE_FD_INVALID";
    failure_step = "fd-3";
    failure_errno = errno;
    emit_error();
    return 65;
  }
  manifest_document document;
  (void)memset(&document, 0, sizeof document);
  if (parse_manifest(&document) != 0 || execute_transaction(argv[1] + 2, argv[2], &document) != 0) {
    emit_error();
    free_manifest(&document);
    return 1;
  }
  emit_success(argv[1] + 2, &document);
  free_manifest(&document);
  return 0;
}
