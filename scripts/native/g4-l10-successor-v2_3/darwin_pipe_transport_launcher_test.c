#include "contract_core.h"
#include "request_transport_core.h"
#include "response_codec.h"

#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

#define CAPTURE_CAPACITY ((size_t)4096)

typedef enum {
  LAUNCH_VALID = 1,
  LAUNCH_INVALID_HEADER = 2
} launch_mode;

static volatile sig_atomic_t child_ready = 0;

static void record_child_ready(int signal_number) {
  if (signal_number == SIGUSR1) child_ready = 1;
}

static int set_nonblocking(int fd) {
  const int flags = fcntl(fd, F_GETFL);
  return flags >= 0 && fcntl(fd, F_SETFL, flags | O_NONBLOCK) == 0;
}

static int write_all(int fd, const uint8_t *bytes, size_t length) {
  size_t offset = 0;
  while (offset < length) {
    const ssize_t amount = write(fd, bytes + offset, length - offset);
    if (amount > 0) {
      offset += (size_t)amount;
    } else if (amount < 0 && errno == EINTR) {
      continue;
    } else {
      return 0;
    }
  }
  return 1;
}

static int read_all(
    int fd,
    uint8_t *bytes,
    size_t capacity,
    size_t *length) {
  *length = 0;
  while (*length < capacity) {
    const ssize_t amount = read(fd, bytes + *length, capacity - *length);
    if (amount > 0) {
      *length += (size_t)amount;
    } else if (amount == 0) {
      return 1;
    } else if (errno == EINTR) {
      continue;
    } else {
      return 0;
    }
  }
  return 0;
}

static void close_child_descriptors_above_stdio(void) {
  int fd = 3;
  const int limit = getdtablesize();
  for (; fd < limit; ++fd) {
    (void)close(fd);
  }
}

static size_t make_request(uint8_t frame[HMG4V23_REQUEST_HEADER_SIZE]) {
  uint8_t empty_digest[32];
  memset(frame, 0, HMG4V23_REQUEST_HEADER_SIZE);
  memcpy(frame, "HMG4V2\0\0", 8);
  hmg4v23_write_u32_be(frame + 8, 2);
  hmg4v23_write_u32_be(frame + 12, 1);
  hmg4v23_write_u64_be(frame + 16, 0);
  if (hmg4v23_sha256((hmg4v23_span){NULL, 0}, empty_digest) != HMG4V23_OK) {
    return 0;
  }
  memcpy(frame + 24, empty_digest, sizeof(empty_digest));
  return HMG4V23_REQUEST_HEADER_SIZE;
}

static launch_mode parse_mode(const char *text) {
  if (strcmp(text, "valid") == 0) return LAUNCH_VALID;
  if (strcmp(text, "invalid-header") == 0) return LAUNCH_INVALID_HEADER;
  return 0;
}

int main(int argc, char **argv) {
  int request_pipe[2];
  int response_pipe[2];
  int diagnostic_pipe[2];
  pid_t child = 0;
  int status = 0;
  uint8_t request[HMG4V23_REQUEST_HEADER_SIZE];
  uint8_t response[CAPTURE_CAPACITY];
  uint8_t diagnostic[CAPTURE_CAPACITY];
  size_t request_length = 0;
  size_t response_length = 0;
  size_t diagnostic_length = 0;
  launch_mode mode = 0;
  char *const child_argv[] = {argc > 1 ? argv[1] : NULL, NULL};
  char *const child_env[] = {
      "HMG4V23_IGNORED_ENVIRONMENT=adversarial", NULL};
  struct sigaction ready_action;

  if (argc != 3 || (mode = parse_mode(argv[2])) == 0) {
    fprintf(stderr, "usage: launcher child {valid|invalid-header}\n");
    return 2;
  }
  memset(&ready_action, 0, sizeof(ready_action));
  ready_action.sa_handler = record_child_ready;
  if (sigemptyset(&ready_action.sa_mask) != 0 ||
      sigaction(SIGUSR1, &ready_action, NULL) != 0) {
    perror("sigaction");
    return 2;
  }
  request_length = make_request(request);
  if (request_length == 0) return 2;
  if (mode == LAUNCH_INVALID_HEADER) request[0] = (uint8_t)'X';
  if (pipe(request_pipe) != 0 || pipe(response_pipe) != 0 ||
      pipe(diagnostic_pipe) != 0 ||
      !set_nonblocking(request_pipe[0]) ||
      !set_nonblocking(response_pipe[1]) ||
      !set_nonblocking(diagnostic_pipe[1])) {
    perror("pipe/fcntl");
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
        dup2(diagnostic_pipe[1], STDERR_FILENO) < 0) {
      _exit(126);
    }
    close_child_descriptors_above_stdio();
    execve(argv[1], child_argv, child_env);
    _exit(127);
  }

  (void)close(request_pipe[0]);
  (void)close(response_pipe[1]);
  (void)close(diagnostic_pipe[1]);
  {
    const struct timespec wait_step = {0, 1000000};
    size_t wait_count = 0;
    while (!child_ready && wait_count < 5000) {
      struct timespec remaining = wait_step;
      while (nanosleep(&remaining, &remaining) != 0 && errno == EINTR) {
      }
      ++wait_count;
    }
    if (!child_ready ||
        !write_all(request_pipe[1], request, request_length) ||
        close(request_pipe[1]) != 0) {
      perror("ready/write/close");
      return 2;
    }
  }
  if (waitpid(child, &status, 0) != child) {
    perror("waitpid");
    return 2;
  }
  memset(response, 0, sizeof(response));
  memset(diagnostic, 0, sizeof(diagnostic));
  if (!read_all(
          response_pipe[0], response, sizeof(response), &response_length) ||
      !read_all(diagnostic_pipe[0],
                diagnostic,
                sizeof(diagnostic),
                &diagnostic_length)) {
    perror("read");
    return 2;
  }
  (void)close(response_pipe[0]);
  (void)close(diagnostic_pipe[0]);
  if (!WIFEXITED(status) || WEXITSTATUS(status) != 64) {
    fprintf(stderr, "unexpected child status=%d\n", status);
    return 1;
  }
  if (mode == LAUNCH_VALID) {
    hmg4v23_response_frame_view view;
    memset(&view, 0, sizeof(view));
    if (diagnostic_length != 0 ||
        hmg4v23_validate_response_frame(
            1,
            (hmg4v23_span){response, response_length},
            NULL,
            &view) != HMG4V23_RESPONSE_OK ||
        view.fields.status != 5 ||
        view.fields.diagnostic_code != UINT32_C(0x00010001)) {
      fprintf(stderr,
              "valid transport mismatch response=%zu diagnostic=%zu\n",
              response_length,
              diagnostic_length);
      return 1;
    }
  } else if (response_length != 0 ||
             diagnostic_length != HMG4V23_INVALID_HEADER_TOKEN_SIZE ||
             memcmp(diagnostic,
                    HMG4V23_INVALID_HEADER_TOKEN,
                    HMG4V23_INVALID_HEADER_TOKEN_SIZE) != 0) {
    fprintf(stderr,
            "invalid-header mismatch response=%zu diagnostic=%zu\n",
            response_length,
            diagnostic_length);
    return 1;
  }
  printf("darwin_pipe_transport launcher mode %s: pass\n", argv[2]);
  return 0;
}
