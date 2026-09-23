#if defined(__APPLE__)
#define _DARWIN_C_SOURCE 1
#else
#define _GNU_SOURCE 1
#define _POSIX_C_SOURCE 200809L
#endif

#include <CommonCrypto/CommonDigest.h>
#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

#define MAX_RECEIPT_BYTES ((size_t)1048576)
#define MAX_HELPER_BYTES ((uint64_t)67108864)
#define INHERITED_HELPER_FD 3

/*
 * Stable process-exit protocol consumed by the JavaScript bridge. Stderr is
 * diagnostic only and must never be used to classify failures.
 */
enum helper_exit_code {
  HELPER_EXIT_OK = 0,
  HELPER_EXIT_USAGE = 64,
  HELPER_EXIT_RECEIPT = 65,
  HELPER_EXIT_REPLAY_EXISTS = 73,
  HELPER_EXIT_IO = 74,
  HELPER_EXIT_ROOT = 75,
  HELPER_EXIT_COMMIT = 76,
  HELPER_EXIT_BINDING = 77
};

static void fail_message(enum helper_exit_code code, const char *message) {
  fprintf(stderr, "%s\n", message);
  exit((int)code);
}

static void fail_errno(enum helper_exit_code code, const char *message) {
  const int saved_errno = errno;
  if (saved_errno != 0) fprintf(stderr, "%s: %s\n", message, strerror(saved_errno));
  else fprintf(stderr, "%s\n", message);
  exit((int)code);
}

static uint64_t parse_canonical_u64(const char *value, const char *label) {
  if (value == NULL || value[0] == '\0' ||
      (value[0] == '0' && value[1] != '\0')) {
    fprintf(stderr, "%s is not a canonical unsigned integer\n", label);
    exit(HELPER_EXIT_USAGE);
  }
  for (const unsigned char *cursor = (const unsigned char *)value;
       *cursor != '\0'; cursor += 1) {
    if (*cursor < (unsigned char)'0' || *cursor > (unsigned char)'9') {
      fprintf(stderr, "%s is not a canonical unsigned integer\n", label);
      exit(HELPER_EXIT_USAGE);
    }
  }

  char *end = NULL;
  errno = 0;
  const uintmax_t parsed = strtoumax(value, &end, 10);
  if (errno != 0 || end == value || *end != '\0' || parsed > UINT64_MAX) {
    errno = 0;
    fprintf(stderr, "%s is not a canonical unsigned integer\n", label);
    exit(HELPER_EXIT_USAGE);
  }
  return (uint64_t)parsed;
}

static int is_lower_hex(unsigned char value) {
  return (value >= (unsigned char)'0' && value <= (unsigned char)'9') ||
         (value >= (unsigned char)'a' && value <= (unsigned char)'f');
}

static void validate_sha256_hex(const char *value, const char *label) {
  if (value == NULL || strlen(value) != 64) {
    fprintf(stderr, "%s is not a lowercase SHA-256\n", label);
    exit(HELPER_EXIT_USAGE);
  }
  for (size_t index = 0; index < 64; index += 1) {
    if (!is_lower_hex((unsigned char)value[index])) {
      fprintf(stderr, "%s is not a lowercase SHA-256\n", label);
      exit(HELPER_EXIT_USAGE);
    }
  }
}

static void validate_lock_leaf_shape(const char *value) {
  static const char suffix[] = ".lock.json";
  const size_t suffix_length = sizeof(suffix) - 1;
  if (value == NULL || strlen(value) != 64 + suffix_length) {
    fail_message(HELPER_EXIT_USAGE, "replay-lock leaf is invalid");
  }
  for (size_t index = 0; index < 64; index += 1) {
    if (!is_lower_hex((unsigned char)value[index])) {
      fail_message(HELPER_EXIT_USAGE, "replay-lock leaf is invalid");
    }
  }
  if (memcmp(value + 64, suffix, suffix_length) != 0) {
    fail_message(HELPER_EXIT_USAGE, "replay-lock leaf is invalid");
  }
}

static void sha256_hex(const unsigned char *bytes, size_t length, char output[65]) {
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  if (length > (size_t)UINT32_MAX) {
    fail_message(HELPER_EXIT_BINDING, "SHA-256 input exceeds CommonCrypto bound");
  }
  if (CC_SHA256(bytes, (CC_LONG)length, digest) == NULL) {
    fail_message(HELPER_EXIT_BINDING, "CommonCrypto SHA-256 failed");
  }
  static const char hexadecimal[] = "0123456789abcdef";
  for (size_t index = 0; index < CC_SHA256_DIGEST_LENGTH; index += 1) {
    output[index * 2] = hexadecimal[(digest[index] >> 4) & 0x0f];
    output[(index * 2) + 1] = hexadecimal[digest[index] & 0x0f];
  }
  output[64] = '\0';
}

static unsigned char *read_exact_helper_bytes(int descriptor, uint64_t expected_size) {
  if (expected_size == 0 || expected_size > MAX_HELPER_BYTES || expected_size > SIZE_MAX) {
    fail_message(HELPER_EXIT_BINDING, "inherited helper size is outside the fixed bound");
  }
  unsigned char *bytes = malloc((size_t)expected_size);
  if (bytes == NULL) {
    fail_errno(HELPER_EXIT_BINDING, "cannot allocate inherited helper buffer");
  }
  size_t offset = 0;
  while (offset < (size_t)expected_size) {
    const ssize_t count = pread(
      descriptor,
      bytes + offset,
      (size_t)expected_size - offset,
      (off_t)offset
    );
    if (count < 0) {
      if (errno == EINTR) continue;
      free(bytes);
      fail_errno(HELPER_EXIT_BINDING, "cannot read inherited helper descriptor");
    }
    if (count == 0) {
      free(bytes);
      fail_message(HELPER_EXIT_BINDING, "inherited helper ended before expected size");
    }
    offset += (size_t)count;
  }
  unsigned char excess = 0;
  ssize_t excess_count;
  do {
    excess_count = pread(descriptor, &excess, 1, (off_t)expected_size);
  } while (excess_count < 0 && errno == EINTR);
  if (excess_count < 0) {
    free(bytes);
    fail_errno(HELPER_EXIT_BINDING, "cannot probe inherited helper end");
  }
  if (excess_count != 0) {
    free(bytes);
    fail_message(HELPER_EXIT_BINDING, "inherited helper exceeds expected size");
  }
  return bytes;
}

static void assert_helper_binding(uint64_t expected_device,
                                  uint64_t expected_inode,
                                  uint64_t expected_size,
                                  const char *expected_sha256) {
  struct stat actual;
  if (fstat(INHERITED_HELPER_FD, &actual) != 0) {
    fail_errno(HELPER_EXIT_BINDING, "cannot stat inherited helper descriptor");
  }
  const int descriptor_flags = fcntl(INHERITED_HELPER_FD, F_GETFL);
  if (descriptor_flags < 0) {
    fail_errno(HELPER_EXIT_BINDING, "cannot inspect inherited helper descriptor flags");
  }
  if (!S_ISREG(actual.st_mode) || actual.st_nlink != 1 ||
      (actual.st_mode & 07777) != 0555 ||
      (descriptor_flags & O_ACCMODE) != O_RDONLY ||
      (uint64_t)actual.st_dev != expected_device ||
      (uint64_t)actual.st_ino != expected_inode ||
      (uint64_t)actual.st_size != expected_size) {
    fail_message(HELPER_EXIT_BINDING, "inherited helper identity or mode is invalid");
  }
  unsigned char *bytes = read_exact_helper_bytes(INHERITED_HELPER_FD, expected_size);
  char actual_sha256[65];
  sha256_hex(bytes, (size_t)expected_size, actual_sha256);
  free(bytes);
  if (memcmp(actual_sha256, expected_sha256, 65) != 0) {
    fail_message(HELPER_EXIT_BINDING, "inherited helper SHA-256 is invalid");
  }
}

static void assert_root_metadata(const struct stat *actual,
                                 uint64_t expected_device,
                                 uint64_t expected_inode,
                                 const char *message) {
  if (!S_ISDIR(actual->st_mode) ||
      (actual->st_mode & 07777) != 0700 ||
      actual->st_nlink < 1 ||
      (uint64_t)actual->st_dev != expected_device ||
      (uint64_t)actual->st_ino != expected_inode) {
    fail_message(HELPER_EXIT_ROOT, message);
  }
}

static unsigned char *read_bounded_receipt(size_t *length_out) {
  unsigned char *bytes = malloc(MAX_RECEIPT_BYTES + 1);
  if (bytes == NULL) {
    fail_errno(HELPER_EXIT_RECEIPT, "cannot allocate replay-lock receipt buffer");
  }

  size_t total = 0;
  while (1) {
    const size_t remaining = (MAX_RECEIPT_BYTES + 1) - total;
    const ssize_t count = read(STDIN_FILENO, bytes + total, remaining);
    if (count < 0) {
      if (errno == EINTR) continue;
      free(bytes);
      fail_errno(HELPER_EXIT_RECEIPT, "cannot read replay-lock receipt from stdin");
    }
    if (count == 0) break;
    total += (size_t)count;
    if (total > MAX_RECEIPT_BYTES) {
      free(bytes);
      fail_message(HELPER_EXIT_RECEIPT,
        "replay-lock receipt exceeds 1048576 bytes");
    }
  }
  if (total == 0) {
    free(bytes);
    fail_message(HELPER_EXIT_RECEIPT, "replay-lock receipt may not be empty");
  }
  *length_out = total;
  return bytes;
}

static void assert_leaf_matches_receipt(const char *leaf,
                                        const unsigned char *receipt,
                                        size_t receipt_length) {
  char digest[65];
  sha256_hex(receipt, receipt_length, digest);
  if (memcmp(leaf, digest, 64) != 0 || strcmp(leaf + 64, ".lock.json") != 0) {
    fail_message(HELPER_EXIT_RECEIPT,
      "replay-lock leaf SHA-256 does not match receipt bytes");
  }
}

static void write_all(int descriptor, const unsigned char *bytes, size_t length) {
  size_t offset = 0;
  while (offset < length) {
    const ssize_t written = write(descriptor, bytes + offset, length - offset);
    if (written < 0) {
      if (errno == EINTR) continue;
      fail_errno(HELPER_EXIT_COMMIT, "cannot write replay-lock receipt");
    }
    if (written == 0) {
      fail_message(HELPER_EXIT_COMMIT, "zero-length replay-lock write");
    }
    offset += (size_t)written;
  }
}

int main(int argc, char **argv) {
  if (argc != 9) {
    fprintf(stderr,
      "usage: %s <replay-root> <lock-leaf> <root-dev> <root-ino> "
      "<helper-dev> <helper-ino> <helper-size> <helper-sha256>\n",
      argv[0]);
    return HELPER_EXIT_USAGE;
  }
  if (argv[1][0] != '/') {
    fail_message(HELPER_EXIT_USAGE, "replay-lock root must be absolute");
  }
  validate_lock_leaf_shape(argv[2]);
  const uint64_t expected_root_device = parse_canonical_u64(argv[3], "expected root device");
  const uint64_t expected_root_inode = parse_canonical_u64(argv[4], "expected root inode");
  const uint64_t expected_helper_device = parse_canonical_u64(argv[5], "expected helper device");
  const uint64_t expected_helper_inode = parse_canonical_u64(argv[6], "expected helper inode");
  const uint64_t expected_helper_size = parse_canonical_u64(argv[7], "expected helper size");
  validate_sha256_hex(argv[8], "expected helper SHA-256");

  assert_helper_binding(
    expected_helper_device,
    expected_helper_inode,
    expected_helper_size,
    argv[8]
  );

  const int root_descriptor = open(
    argv[1], O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC
  );
  if (root_descriptor < 0) {
    fail_errno(HELPER_EXIT_ROOT, "cannot open pinned replay-lock root");
  }

  struct stat root_before;
  if (fstat(root_descriptor, &root_before) != 0) {
    fail_errno(HELPER_EXIT_ROOT, "cannot stat pinned replay-lock root");
  }
  assert_root_metadata(
    &root_before,
    expected_root_device,
    expected_root_inode,
    "replay-lock root device/inode/mode changed before receipt read"
  );

  size_t receipt_length = 0;
  unsigned char *receipt = read_bounded_receipt(&receipt_length);
  assert_leaf_matches_receipt(argv[2], receipt, receipt_length);

  struct stat root_before_create;
  if (fstat(root_descriptor, &root_before_create) != 0) {
    free(receipt);
    fail_errno(HELPER_EXIT_ROOT, "cannot restat pinned replay-lock root");
  }
  assert_root_metadata(
    &root_before_create,
    expected_root_device,
    expected_root_inode,
    "replay-lock root device/inode/mode changed before CAS"
  );
  if (root_before_create.st_uid != root_before.st_uid ||
      root_before_create.st_gid != root_before.st_gid) {
    free(receipt);
    fail_message(HELPER_EXIT_ROOT,
      "replay-lock root ownership metadata changed before CAS");
  }
  assert_helper_binding(
    expected_helper_device,
    expected_helper_inode,
    expected_helper_size,
    argv[8]
  );

  const int lock_descriptor = openat(
    root_descriptor,
    argv[2],
    O_CREAT | O_EXCL | O_WRONLY | O_NOFOLLOW | O_CLOEXEC,
    S_IRUSR
  );
  if (lock_descriptor < 0) {
    free(receipt);
    if (errno == EEXIST) {
      fail_errno(HELPER_EXIT_REPLAY_EXISTS,
        "atomic replay-lock openat(O_EXCL) found an existing leaf");
    }
    fail_errno(HELPER_EXIT_IO, "atomic replay-lock openat(O_EXCL) failed");
  }

  /*
   * From this point forward, every error deliberately leaves the exclusive
   * path in place. A failed commit is sealed evidence and must not be deleted
   * or overwritten by an automatic retry.
   */
  if (fchmod(lock_descriptor, S_IRUSR) != 0) {
    free(receipt);
    fail_errno(HELPER_EXIT_COMMIT,
      "cannot enforce replay-lock mode 0400 before write");
  }

  struct stat lock_before;
  if (fstat(lock_descriptor, &lock_before) != 0) {
    free(receipt);
    fail_errno(HELPER_EXIT_COMMIT, "cannot stat new replay-lock receipt");
  }
  if (!S_ISREG(lock_before.st_mode) || lock_before.st_nlink != 1 ||
      (lock_before.st_mode & 07777) != S_IRUSR || lock_before.st_size != 0) {
    free(receipt);
    fail_message(HELPER_EXIT_COMMIT,
      "new replay-lock receipt metadata is invalid");
  }

  write_all(lock_descriptor, receipt, receipt_length);
  free(receipt);
  receipt = NULL;

  if (fsync(lock_descriptor) != 0) {
    fail_errno(HELPER_EXIT_COMMIT, "cannot fsync replay-lock receipt");
  }

  struct stat lock_after;
  if (fstat(lock_descriptor, &lock_after) != 0) {
    fail_errno(HELPER_EXIT_COMMIT, "cannot stat committed replay-lock receipt");
  }
  if (!S_ISREG(lock_after.st_mode) || lock_after.st_nlink != 1 ||
      (lock_after.st_mode & 07777) != S_IRUSR ||
      (uint64_t)lock_after.st_size != (uint64_t)receipt_length ||
      lock_after.st_dev != root_before.st_dev) {
    fail_message(HELPER_EXIT_COMMIT,
      "committed replay-lock receipt metadata drifted");
  }

  if (close(lock_descriptor) != 0) {
    fail_errno(HELPER_EXIT_COMMIT, "cannot close replay-lock receipt");
  }
  if (fsync(root_descriptor) != 0) {
    fail_errno(HELPER_EXIT_COMMIT, "cannot fsync replay-lock root");
  }

  struct stat root_after;
  if (fstat(root_descriptor, &root_after) != 0) {
    fail_errno(HELPER_EXIT_COMMIT,
      "cannot stat replay-lock root after commit");
  }
  assert_root_metadata(
    &root_after,
    expected_root_device,
    expected_root_inode,
    "replay-lock root device/inode/mode changed during CAS"
  );
  if (root_after.st_uid != root_before.st_uid ||
      root_after.st_gid != root_before.st_gid) {
    fail_message(HELPER_EXIT_ROOT,
      "replay-lock root ownership metadata changed during CAS");
  }
  assert_helper_binding(
    expected_helper_device,
    expected_helper_inode,
    expected_helper_size,
    argv[8]
  );
  if (close(root_descriptor) != 0) {
    fail_errno(HELPER_EXIT_COMMIT, "cannot close replay-lock root");
  }

  if (printf("{\"bytes\":%" PRIu64 ",\"device\":\"%" PRIu64
             "\",\"inode\":\"%" PRIu64 "\"}\n",
             (uint64_t)receipt_length,
             (uint64_t)lock_after.st_dev,
             (uint64_t)lock_after.st_ino) < 0) {
    fail_errno(HELPER_EXIT_COMMIT,
      "cannot write replay-lock result JSON");
  }
  if (fflush(stdout) != 0) {
    fail_errno(HELPER_EXIT_COMMIT,
      "cannot flush replay-lock result JSON");
  }
  return HELPER_EXIT_OK;
}
