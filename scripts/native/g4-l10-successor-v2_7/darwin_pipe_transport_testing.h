#ifndef HMG4V27_DARWIN_PIPE_TRANSPORT_TESTING_H
#define HMG4V27_DARWIN_PIPE_TRANSPORT_TESTING_H

#ifndef HMG4V27_TRANSPORT_TESTING
#error "darwin_pipe_transport_testing.h is test-only"
#endif

#include <stddef.h>
#include <stdint.h>

typedef struct {
  void *context;
  int (*install_sigpipe_ignore)(void *context);
  int (*verify_sigpipe_ignore)(void *context);
  int (*monotonic_now_ns)(void *context, uint64_t *now_ns);
  int (*get_status_flags)(void *context, int fd, int *status_flags);
  int64_t (*read_bytes)(
      void *context,
      int fd,
      uint8_t *bytes,
      size_t length,
      int *error_value);
  int64_t (*write_bytes)(
      void *context,
      int fd,
      const uint8_t *bytes,
      size_t length,
      int *error_value);
  int (*poll_one)(
      void *context,
      int fd,
      int16_t requested_events,
      int timeout_ms,
      int *poll_return,
      int *poll_error,
      int16_t *returned_events);
  void *(*allocate)(void *context, size_t length);
  void (*deallocate)(void *context, void *allocation);
} hmg4v27_transport_test_backend;

int hmg4v27_transport_test_set_backend(
    const hmg4v27_transport_test_backend *backend);
void hmg4v27_transport_test_clear_backend(void);

#endif
