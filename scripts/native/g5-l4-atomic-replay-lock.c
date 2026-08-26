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
  if (saved_errno != 0) fprintf(stderr, "%s: %s\n", message, strerror(saved_errno));
  else fprintf(stderr, "%s\n", message);
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

static void validate_leaf(const char *value) {
  if (value[0] == '\0' || strcmp(value, ".") == 0 || strcmp(value, "..") == 0 ||
      strchr(value, '/') != NULL) {
    errno = 0;
    fail("replay-lock leaf is invalid");
  }
}

static void write_all(int fd, const unsigned char *bytes, size_t length) {
  size_t offset = 0;
  while (offset < length) {
    const ssize_t written = write(fd, bytes + offset, length - offset);
    if (written < 0) fail("cannot write replay-lock receipt");
    if (written == 0) {
      errno = EIO;
      fail("zero-length replay-lock write");
    }
    offset += (size_t)written;
  }
}

int main(int argc, char **argv) {
  if (argc != 5) {
    fprintf(stderr, "usage: %s <replay-root> <lock-leaf> <expected-dev> <expected-ino>\n", argv[0]);
    return 2;
  }
  validate_leaf(argv[2]);
  const uint64_t expected_dev = parse_u64(argv[3], "expected device");
  const uint64_t expected_ino = parse_u64(argv[4], "expected inode");

  const int root_fd = open(argv[1], O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
  if (root_fd < 0) fail("cannot open pinned replay-lock root");
  struct stat root_stat;
  if (fstat(root_fd, &root_stat) != 0) fail("cannot stat pinned replay-lock root");
  if (!S_ISDIR(root_stat.st_mode) || (uint64_t)root_stat.st_dev != expected_dev ||
      (uint64_t)root_stat.st_ino != expected_ino) {
    errno = 0;
    fail("replay-lock root device/inode changed before CAS");
  }

  const int lock_fd = openat(
    root_fd,
    argv[2],
    O_CREAT | O_EXCL | O_WRONLY | O_NOFOLLOW | O_CLOEXEC,
    S_IRUSR
  );
  if (lock_fd < 0) fail("atomic replay-lock openat(O_EXCL) failed");

  unsigned char buffer[4096];
  uint64_t total = 0;
  while (1) {
    const ssize_t count = read(STDIN_FILENO, buffer, sizeof(buffer));
    if (count < 0) fail("cannot read replay-lock receipt from stdin");
    if (count == 0) break;
    write_all(lock_fd, buffer, (size_t)count);
    total += (uint64_t)count;
  }
  if (total == 0) {
    errno = 0;
    fail("replay-lock receipt may not be empty");
  }
  if (fchmod(lock_fd, S_IRUSR) != 0) fail("cannot enforce replay-lock mode 0400");
  if (fsync(lock_fd) != 0) fail("cannot fsync replay-lock receipt");
  struct stat lock_stat;
  if (fstat(lock_fd, &lock_stat) != 0) fail("cannot stat replay-lock receipt");
  if (!S_ISREG(lock_stat.st_mode) || lock_stat.st_nlink != 1 ||
      (lock_stat.st_mode & 0777) != S_IRUSR || (uint64_t)lock_stat.st_size != total) {
    errno = 0;
    fail("replay-lock receipt metadata drifted");
  }
  if (close(lock_fd) != 0) fail("cannot close replay-lock receipt");
  if (fsync(root_fd) != 0) fail("cannot fsync replay-lock root");
  if (close(root_fd) != 0) fail("cannot close replay-lock root");

  printf("{\"bytes\":%" PRIu64 ",\"device\":\"%" PRIu64
         "\",\"inode\":\"%" PRIu64 "\"}\n",
         total, (uint64_t)lock_stat.st_dev, (uint64_t)lock_stat.st_ino);
  return 0;
}
