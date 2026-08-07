#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

typedef enum {
  MODE_VALID = 1,
  MODE_EXTRA_FD,
  MODE_BLOCKING,
  MODE_ALIAS
} launch_mode;

static int set_nonblocking(int fd) {
  int flags = fcntl(fd, F_GETFL);
  if (flags < 0 || fcntl(fd, F_SETFL, flags | O_NONBLOCK) != 0) {
    return -1;
  }
  return 0;
}

static int read_all(int fd, char *buffer, size_t capacity, size_t *used) {
  ssize_t amount = 0;
  *used = 0;
  while (*used < capacity) {
    amount = read(fd, buffer + *used, capacity - *used);
    if (amount > 0) {
      *used += (size_t)amount;
      continue;
    }
    if (amount == 0) {
      return 0;
    }
    if (errno == EINTR) {
      continue;
    }
    return -1;
  }
  return 0;
}

static void close_child_descriptors_above_stdio(int retained_fd) {
  int fd = 3;
  int limit = getdtablesize();
  for (; fd < limit; ++fd) {
    if (fd != retained_fd) {
      (void)close(fd);
    }
  }
}

static launch_mode parse_mode(const char *text) {
  if (strcmp(text, "valid") == 0) {
    return MODE_VALID;
  }
  if (strcmp(text, "extra") == 0) {
    return MODE_EXTRA_FD;
  }
  if (strcmp(text, "blocking") == 0) {
    return MODE_BLOCKING;
  }
  if (strcmp(text, "alias") == 0) {
    return MODE_ALIAS;
  }
  return 0;
}

int main(int argc, char **argv) {
  int request_pipe[2];
  int response_pipe[2];
  int diagnostic_pipe[2];
  pid_t child = 0;
  int status = 0;
  char response[128];
  char diagnostic[128];
  size_t response_size = 0;
  size_t diagnostic_size = 0;
  launch_mode mode = 0;
  char *const child_argv[] = {argc > 1 ? argv[1] : NULL, NULL};
  char *const child_env[] = {"HMG4V23_IGNORED_ENVIRONMENT=adversarial", NULL};

  if (argc != 3 || (mode = parse_mode(argv[2])) == 0) {
    fprintf(stderr, "usage: launcher child {valid|extra|blocking|alias}\n");
    return 2;
  }
  if (pipe(request_pipe) != 0 || pipe(response_pipe) != 0 ||
      pipe(diagnostic_pipe) != 0) {
    perror("pipe");
    return 2;
  }
  if (mode != MODE_BLOCKING &&
      (set_nonblocking(request_pipe[0]) != 0 ||
       set_nonblocking(response_pipe[1]) != 0 ||
       set_nonblocking(diagnostic_pipe[1]) != 0)) {
    perror("fcntl");
    return 2;
  }
  child = fork();
  if (child < 0) {
    perror("fork");
    return 2;
  }
  if (child == 0) {
    if (dup2(request_pipe[0], STDIN_FILENO) < 0 ||
        dup2(response_pipe[1], STDOUT_FILENO) < 0 ||
        dup2(mode == MODE_ALIAS ? response_pipe[1] : diagnostic_pipe[1],
             STDERR_FILENO) < 0) {
      _exit(126);
    }
    if (mode == MODE_EXTRA_FD) {
      if (dup2(request_pipe[1], 3) < 0) {
        _exit(126);
      }
      close_child_descriptors_above_stdio(3);
    } else {
      close_child_descriptors_above_stdio(-1);
    }
    execve(argv[1], child_argv, child_env);
    _exit(127);
  }

  close(request_pipe[0]);
  close(response_pipe[1]);
  close(diagnostic_pipe[1]);
  if (waitpid(child, &status, 0) != child) {
    perror("waitpid");
    return 2;
  }
  close(request_pipe[1]);
  memset(response, 0, sizeof(response));
  memset(diagnostic, 0, sizeof(diagnostic));
  if (read_all(response_pipe[0], response, sizeof(response), &response_size) !=
          0 ||
      read_all(diagnostic_pipe[0], diagnostic, sizeof(diagnostic),
               &diagnostic_size) != 0) {
    perror("read");
    return 2;
  }
  close(response_pipe[0]);
  close(diagnostic_pipe[0]);

  if (!WIFEXITED(status)) {
    fprintf(stderr, "child did not exit normally\n");
    return 1;
  }
  if (mode == MODE_VALID) {
    static const char expected[] = "FD_ATTEST_OK\n";
    if (WEXITSTATUS(status) != 0 ||
        response_size != sizeof(expected) - 1 ||
        memcmp(response, expected, sizeof(expected) - 1) != 0 ||
        diagnostic_size != 0) {
      fprintf(stderr,
              "valid mismatch: status=%d response=%zu diagnostic=%zu\n",
              WEXITSTATUS(status), response_size, diagnostic_size);
      if (response_size != 0) {
        (void)fwrite(response, 1, response_size, stderr);
      }
      return 1;
    }
  } else if (WEXITSTATUS(status) != 64 || response_size != 0 ||
             diagnostic_size != 0) {
    fprintf(stderr,
            "negative mismatch: status=%d response=%zu diagnostic=%zu\n",
            WEXITSTATUS(status), response_size, diagnostic_size);
    return 1;
  }
  printf("darwin_startup_fd launcher mode %s: pass\n", argv[2]);
  return 0;
}
