#define _DARWIN_C_SOURCE 1

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
    fprintf(stderr, "%s must be one safe directory leaf\n", label);
    exit(2);
  }
}

int main(int argc, char **argv) {
  if (argc != 8) {
    fprintf(stderr,
            "usage: %s <parent> <temporary-leaf> <target-leaf> <expected-parent-dev> "
            "<expected-parent-ino> <expected-source-dev> <expected-source-ino>\n",
            argv[0]);
    return 2;
  }

  validate_leaf(argv[2], "temporary leaf");
  validate_leaf(argv[3], "target leaf");
  const uint64_t expected_parent_dev = parse_u64(argv[4], "expected parent device");
  const uint64_t expected_parent_ino = parse_u64(argv[5], "expected parent inode");
  const uint64_t expected_source_dev = parse_u64(argv[6], "expected source device");
  const uint64_t expected_source_ino = parse_u64(argv[7], "expected source inode");

  const int parent_fd = open(argv[1], O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
  if (parent_fd < 0) fail("cannot open the pinned publication parent");

  struct stat parent_stat;
  if (fstat(parent_fd, &parent_stat) != 0) fail("cannot stat the pinned publication parent");
  if (!S_ISDIR(parent_stat.st_mode) || (uint64_t)parent_stat.st_dev != expected_parent_dev ||
      (uint64_t)parent_stat.st_ino != expected_parent_ino || parent_stat.st_uid != geteuid() ||
      (parent_stat.st_mode & 0077) != 0) {
    errno = 0;
    fail("publication parent identity, owner, or private-mode contract changed before commit");
  }

  struct stat unexpected_target;
  if (fstatat(parent_fd, argv[3], &unexpected_target, AT_SYMLINK_NOFOLLOW) == 0) {
    errno = EEXIST;
    fail("publication target already exists");
  }
  if (errno != ENOENT) fail("cannot establish target absence relative to the pinned parent");

  /* This is deliberately the last pathname lookup before the atomic commit. */
  struct stat source_before;
  if (fstatat(parent_fd, argv[2], &source_before, AT_SYMLINK_NOFOLLOW) != 0) {
    fail("cannot stat the staged directory relative to the pinned parent immediately before commit");
  }
  if (!S_ISDIR(source_before.st_mode) ||
      (uint64_t)source_before.st_dev != expected_source_dev ||
      (uint64_t)source_before.st_ino != expected_source_ino ||
      source_before.st_uid != geteuid() || (source_before.st_mode & 0022) != 0) {
    errno = 0;
    fail("staged publication source identity, owner, or private-mode contract changed before commit");
  }

  if (renameatx_np(parent_fd, argv[2], parent_fd, argv[3],
                   RENAME_EXCL | RENAME_NOFOLLOW_ANY) != 0) {
    fail("atomic RENAME_EXCL publication failed");
  }

  struct stat target_after;
  if (fstatat(parent_fd, argv[3], &target_after, AT_SYMLINK_NOFOLLOW) != 0) {
    fail("cannot stat the committed directory relative to the pinned parent");
  }
  if (!S_ISDIR(target_after.st_mode) ||
      (uint64_t)target_after.st_dev != expected_source_dev ||
      (uint64_t)target_after.st_ino != expected_source_ino) {
    errno = 0;
    fail("committed directory identity differs from the staged directory");
  }

  if (fsync(parent_fd) != 0) fail("cannot fsync the publication parent");
  if (close(parent_fd) != 0) fail("cannot close the publication parent");

  printf("{\"device\":\"%" PRIu64 "\",\"inode\":\"%" PRIu64 "\"}\n",
         (uint64_t)target_after.st_dev, (uint64_t)target_after.st_ino);
  return 0;
}
