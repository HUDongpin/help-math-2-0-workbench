#define _DARWIN_C_SOURCE 1

#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#ifndef __APPLE__
#error "darwin-atomic-directory-swap-native.c is Darwin-only"
#endif

#ifndef RENAME_SWAP
#error "RENAME_SWAP is unavailable"
#endif

#ifndef RENAME_NOFOLLOW_ANY
#error "RENAME_NOFOLLOW_ANY is unavailable"
#endif

#ifndef RENAME_RESOLVE_BENEATH
#error "RENAME_RESOLVE_BENEATH is unavailable"
#endif

static int fail_message(const char *message) {
  (void)dprintf(STDERR_FILENO, "darwin atomic directory swap: %s\n", message);
  return 64;
}

static int fail_errno(const char *operation) {
  const int saved_errno = errno;
  (void)dprintf(
    STDERR_FILENO,
    "darwin atomic directory swap: %s: %s (errno=%d)\n",
    operation,
    strerror(saved_errno),
    saved_errno
  );
  return 74;
}

static int safe_entry_name(const char *name) {
  return name != NULL && name[0] != '\0' && strcmp(name, ".") != 0 &&
    strcmp(name, "..") != 0 && strchr(name, '/') == NULL;
}

static int parse_identity(const char *value, uintmax_t *result) {
  char *end = NULL;
  errno = 0;
  const uintmax_t parsed = strtoumax(value, &end, 10);
  if (errno != 0 || end == value || *end != '\0') return 0;
  *result = parsed;
  return 1;
}

static int same_node(const struct stat *left, const struct stat *right) {
  return left->st_dev == right->st_dev && left->st_ino == right->st_ino;
}

static int matches_expected(
  const struct stat *observed,
  const uintmax_t expected_device,
  const uintmax_t expected_inode
) {
  return (uintmax_t)observed->st_dev == expected_device &&
    (uintmax_t)observed->st_ino == expected_inode;
}

static int open_bound_directory(
  const int parent_fd,
  const char *name,
  struct stat *bound,
  int *directory_fd
) {
  struct stat at_path;
  const int opened = openat(
    parent_fd,
    name,
    O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC
  );
  if (opened < 0) return -1;
  if (fstat(opened, bound) != 0) {
    const int saved_errno = errno;
    (void)close(opened);
    errno = saved_errno;
    return -1;
  }
  if (!S_ISDIR(bound->st_mode)) {
    (void)close(opened);
    errno = ENOTDIR;
    return -1;
  }
  if (fstatat(parent_fd, name, &at_path, AT_SYMLINK_NOFOLLOW) != 0) {
    const int saved_errno = errno;
    (void)close(opened);
    errno = saved_errno;
    return -1;
  }
  if (!S_ISDIR(at_path.st_mode) || !same_node(bound, &at_path)) {
    (void)close(opened);
    errno = ESTALE;
    return -1;
  }
  *directory_fd = opened;
  return 0;
}

int main(int argc, char **argv) {
  if (argc != 10) {
    return fail_message(
      "expected parent, two child names, and the three expected dev/inode pairs"
    );
  }

  const char *parent = argv[1];
  const char *first_name = argv[2];
  const char *second_name = argv[3];
  if (parent[0] != '/' || !safe_entry_name(first_name) ||
      !safe_entry_name(second_name) || strcmp(first_name, second_name) == 0) {
    return fail_message("paths are not two distinct direct children of an absolute parent");
  }

  uintmax_t expected_parent_device;
  uintmax_t expected_parent_inode;
  uintmax_t expected_first_device;
  uintmax_t expected_first_inode;
  uintmax_t expected_second_device;
  uintmax_t expected_second_inode;
  if (!parse_identity(argv[4], &expected_parent_device) ||
      !parse_identity(argv[5], &expected_parent_inode) ||
      !parse_identity(argv[6], &expected_first_device) ||
      !parse_identity(argv[7], &expected_first_inode) ||
      !parse_identity(argv[8], &expected_second_device) ||
      !parse_identity(argv[9], &expected_second_inode)) {
    return fail_message("an expected filesystem identity is invalid");
  }

  const int parent_fd = open(
    parent,
    O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC
  );
  if (parent_fd < 0) return fail_errno("open allowed parent");

  int first_fd = -1;
  int second_fd = -1;
  int result = 0;
  struct stat parent_stat;
  struct stat first_stat;
  struct stat second_stat;
  struct stat first_at_path;
  struct stat second_at_path;

  if (fstat(parent_fd, &parent_stat) != 0) {
    result = fail_errno("stat allowed parent");
    goto cleanup;
  }
  if (!S_ISDIR(parent_stat.st_mode) ||
      !matches_expected(
        &parent_stat,
        expected_parent_device,
        expected_parent_inode
      )) {
    result = fail_message("allowed parent identity changed before swap");
    goto cleanup;
  }
  if (open_bound_directory(parent_fd, first_name, &first_stat, &first_fd) != 0) {
    result = fail_errno("open first directory without following links");
    goto cleanup;
  }
  if (open_bound_directory(parent_fd, second_name, &second_stat, &second_fd) != 0) {
    result = fail_errno("open second directory without following links");
    goto cleanup;
  }
  if (!matches_expected(&first_stat, expected_first_device, expected_first_inode) ||
      !matches_expected(&second_stat, expected_second_device, expected_second_inode)) {
    result = fail_message("a child directory identity changed before swap");
    goto cleanup;
  }
  if (parent_stat.st_dev != first_stat.st_dev ||
      parent_stat.st_dev != second_stat.st_dev) {
    result = fail_message("allowed parent and child directories are not on one device");
    goto cleanup;
  }
  if (same_node(&first_stat, &second_stat)) {
    result = fail_message("the child names resolve to the same directory inode");
    goto cleanup;
  }

  const unsigned int flags =
    RENAME_SWAP | RENAME_NOFOLLOW_ANY | RENAME_RESOLVE_BENEATH;
  if (renameatx_np(
        parent_fd,
        first_name,
        parent_fd,
        second_name,
        flags
      ) != 0) {
    result = fail_errno("renameatx_np(RENAME_SWAP)");
    goto cleanup;
  }

  if (fstatat(parent_fd, first_name, &first_at_path, AT_SYMLINK_NOFOLLOW) != 0 ||
      fstatat(parent_fd, second_name, &second_at_path, AT_SYMLINK_NOFOLLOW) != 0) {
    result = fail_errno("verify swapped directory names");
    goto cleanup;
  }
  if (!S_ISDIR(first_at_path.st_mode) || !S_ISDIR(second_at_path.st_mode) ||
      !same_node(&first_at_path, &second_stat) ||
      !same_node(&second_at_path, &first_stat)) {
    result = fail_message("renameatx_np returned without the required exchanged identities");
    goto cleanup;
  }
  if (fsync(parent_fd) != 0) {
    result = fail_errno("fsync allowed parent after swap");
    goto cleanup;
  }

  (void)printf("{\"status\":\"swapped\",\"parentFsynced\":true}\n");
  if (fflush(stdout) != 0) result = fail_errno("flush success receipt");

cleanup:
  if (second_fd >= 0) (void)close(second_fd);
  if (first_fd >= 0) (void)close(first_fd);
  (void)close(parent_fd);
  return result;
}
