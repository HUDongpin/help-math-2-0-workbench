#include "darwin_pipe_transport.h"

#ifdef HMG4V23_TRANSPORT_TESTING
#include "darwin_pipe_transport_testing.h"
#endif

#include <errno.h>
#include <fcntl.h>
#include <limits.h>
#include <poll.h>
#include <signal.h>
#include <stdlib.h>
#include <string.h>
#include <sys/syslimits.h>
#include <time.h>
#include <unistd.h>

_Static_assert(HMG4V23_INVALID_HEADER_TOKEN_SIZE == 21,
               "invalid-header token size drift");
_Static_assert(HMG4V23_INVALID_HEADER_TOKEN_SIZE <= PIPE_BUF,
               "invalid-header token must be atomic");
_Static_assert(sizeof(short) == sizeof(int16_t),
               "Darwin poll revents must be 16-bit");
_Static_assert(sizeof(ssize_t) <= sizeof(int64_t),
               "ssize_t must fit in transport result");

static const hmg4v23_io_errno_symbols io_symbols = {
    EINTR, EAGAIN, EWOULDBLOCK};
static const hmg4v23_poll_symbols poll_symbols = {
    (uint16_t)POLLIN,
    (uint16_t)POLLOUT,
    (uint16_t)POLLERR,
    (uint16_t)POLLHUP,
    (uint16_t)POLLNVAL,
    EINTR};

#ifdef HMG4V23_TRANSPORT_TESTING
static hmg4v23_transport_test_backend test_backend;
static int test_backend_is_set = 0;

int hmg4v23_transport_test_set_backend(
    const hmg4v23_transport_test_backend *backend) {
  if (backend == NULL || backend->install_sigpipe_ignore == NULL ||
      backend->verify_sigpipe_ignore == NULL ||
      backend->monotonic_now_ns == NULL ||
      backend->get_status_flags == NULL || backend->read_bytes == NULL ||
      backend->write_bytes == NULL || backend->poll_one == NULL ||
      backend->allocate == NULL || backend->deallocate == NULL) {
    return 0;
  }
  test_backend = *backend;
  test_backend_is_set = 1;
  return 1;
}

void hmg4v23_transport_test_clear_backend(void) {
  memset(&test_backend, 0, sizeof(test_backend));
  test_backend_is_set = 0;
}
#endif

static int call_install_sigpipe_ignore(void) {
#ifdef HMG4V23_TRANSPORT_TESTING
  if (test_backend_is_set) {
    return test_backend.install_sigpipe_ignore(test_backend.context);
  }
#endif
  {
    struct sigaction action;
    memset(&action, 0, sizeof(action));
    action.sa_handler = SIG_IGN;
    if (sigemptyset(&action.sa_mask) != 0) return 0;
    action.sa_flags = 0;
    return sigaction(SIGPIPE, &action, NULL) == 0;
  }
}

static int call_verify_sigpipe_ignore(void) {
#ifdef HMG4V23_TRANSPORT_TESTING
  if (test_backend_is_set) {
    return test_backend.verify_sigpipe_ignore(test_backend.context);
  }
#endif
  {
    struct sigaction observed;
    memset(&observed, 0, sizeof(observed));
    return sigaction(SIGPIPE, NULL, &observed) == 0 &&
           observed.sa_handler == SIG_IGN;
  }
}

static int call_monotonic_now_ns(uint64_t *now_ns) {
#ifdef HMG4V23_TRANSPORT_TESTING
  if (test_backend_is_set) {
    return test_backend.monotonic_now_ns(test_backend.context, now_ns);
  }
#endif
  {
    struct timespec sample;
    uint64_t seconds = 0;
    memset(&sample, 0, sizeof(sample));
    if (clock_gettime(CLOCK_MONOTONIC, &sample) != 0 || sample.tv_sec < 0) {
      return 0;
    }
    seconds = (uint64_t)sample.tv_sec;
    return hmg4v23_timespec_parts_to_ns(
               seconds, (int64_t)sample.tv_nsec, now_ns) ==
           HMG4V23_TRANSPORT_OK;
  }
}

static int call_get_status_flags(int fd, int *status_flags) {
#ifdef HMG4V23_TRANSPORT_TESTING
  if (test_backend_is_set) {
    return test_backend.get_status_flags(
        test_backend.context, fd, status_flags);
  }
#endif
  *status_flags = fcntl(fd, F_GETFL);
  return *status_flags >= 0;
}

static int64_t call_read_bytes(
    int fd,
    uint8_t *bytes,
    size_t length,
    int *error_value) {
#ifdef HMG4V23_TRANSPORT_TESTING
  if (test_backend_is_set) {
    return test_backend.read_bytes(
        test_backend.context, fd, bytes, length, error_value);
  }
#endif
  {
    const ssize_t result = read(fd, bytes, length);
    *error_value = result < 0 ? errno : 0;
    return (int64_t)result;
  }
}

static int64_t call_write_bytes(
    int fd,
    const uint8_t *bytes,
    size_t length,
    int *error_value) {
#ifdef HMG4V23_TRANSPORT_TESTING
  if (test_backend_is_set) {
    return test_backend.write_bytes(
        test_backend.context, fd, bytes, length, error_value);
  }
#endif
  {
    const ssize_t result = write(fd, bytes, length);
    *error_value = result < 0 ? errno : 0;
    return (int64_t)result;
  }
}

static int call_poll_one(
    int fd,
    int16_t requested_events,
    int timeout_ms,
    int *poll_return,
    int *poll_error,
    int16_t *returned_events) {
#ifdef HMG4V23_TRANSPORT_TESTING
  if (test_backend_is_set) {
    return test_backend.poll_one(
        test_backend.context,
        fd,
        requested_events,
        timeout_ms,
        poll_return,
        poll_error,
        returned_events);
  }
#endif
  {
    struct pollfd descriptor;
    memset(&descriptor, 0, sizeof(descriptor));
    descriptor.fd = fd;
    descriptor.events = (short)requested_events;
    descriptor.revents = 0;
    *poll_return = poll(&descriptor, 1, timeout_ms);
    *poll_error = *poll_return < 0 ? errno : 0;
    *returned_events = (int16_t)descriptor.revents;
    return 1;
  }
}

static void *call_allocate(size_t length) {
#ifdef HMG4V23_TRANSPORT_TESTING
  if (test_backend_is_set) {
    return test_backend.allocate(test_backend.context, length);
  }
#endif
  return malloc(length);
}

static void call_deallocate(void *allocation) {
#ifdef HMG4V23_TRANSPORT_TESTING
  if (test_backend_is_set) {
    test_backend.deallocate(test_backend.context, allocation);
    return;
  }
#endif
  free(allocation);
}

static int status_flags_are_exact(int fd) {
  int observed = 0;
  const int expected =
      (fd == STDIN_FILENO ? O_RDONLY : O_WRONLY) | O_NONBLOCK;
  return call_get_status_flags(fd, &observed) && observed == expected;
}

static hmg4v23_pipe_result classify_request_transport_failure(
    int fixed_header_valid,
    hmg4v23_pipe_result post_header_result) {
  return fixed_header_valid ? post_header_result
                            : HMG4V23_PIPE_UNFRAMED_INVALID_HEADER;
}

static hmg4v23_pipe_result sample_before_call(
    int fd,
    uint64_t deadline_ns,
    int fixed_header_valid,
    uint64_t *pre_call_ns) {
  if (!status_flags_are_exact(fd) ||
      !call_monotonic_now_ns(pre_call_ns)) {
    return classify_request_transport_failure(
        fixed_header_valid, HMG4V23_PIPE_REQUEST_TRANSPORT_ERROR);
  }
  if (*pre_call_ns >= deadline_ns) {
    return classify_request_transport_failure(
        fixed_header_valid, HMG4V23_PIPE_REQUEST_DEADLINE_EXCEEDED);
  }
  return HMG4V23_PIPE_OK;
}

static hmg4v23_pipe_result sample_after_request_call(
    uint64_t deadline_ns,
    int fixed_header_valid,
    int *post_at_or_after_deadline) {
  uint64_t post_call_ns = 0;
  if (!call_monotonic_now_ns(&post_call_ns)) {
    return classify_request_transport_failure(
        fixed_header_valid, HMG4V23_PIPE_REQUEST_TRANSPORT_ERROR);
  }
  *post_at_or_after_deadline = post_call_ns >= deadline_ns;
  return HMG4V23_PIPE_OK;
}

typedef enum {
  HMG4V23_NEXT_READ_ORDINARY = 0,
  HMG4V23_NEXT_READ_HUP_ONLY = 1
} hmg4v23_next_read_mode;

static hmg4v23_pipe_result poll_request_until_read(
    uint64_t deadline_ns,
    int fixed_header_valid,
    hmg4v23_next_read_mode *next_mode) {
  for (;;) {
    uint64_t pre_call_ns = 0;
    int timeout_ms = 0;
    int poll_return = 0;
    int poll_error = 0;
    int16_t returned_events = 0;
    int post_at_or_after_deadline = 0;
    hmg4v23_poll_decision decision = HMG4V23_POLL_TRANSPORT_ERROR;
    hmg4v23_pipe_result sample_result = sample_before_call(
        STDIN_FILENO, deadline_ns, fixed_header_valid, &pre_call_ns);
    if (sample_result != HMG4V23_PIPE_OK) return sample_result;
    if (hmg4v23_poll_timeout_ms(pre_call_ns, deadline_ns, &timeout_ms) !=
        HMG4V23_TRANSPORT_OK) {
      return classify_request_transport_failure(
          fixed_header_valid, HMG4V23_PIPE_REPRESENTATION_FAILURE);
    }
    returned_events = 0;
    if (!call_poll_one(
            STDIN_FILENO,
            (int16_t)POLLIN,
            timeout_ms,
            &poll_return,
            &poll_error,
            &returned_events)) {
      return classify_request_transport_failure(
          fixed_header_valid, HMG4V23_PIPE_REQUEST_TRANSPORT_ERROR);
    }
    sample_result = sample_after_request_call(
        deadline_ns, fixed_header_valid, &post_at_or_after_deadline);
    if (sample_result != HMG4V23_PIPE_OK) return sample_result;
    if (hmg4v23_poll_decide(
            &poll_symbols,
            HMG4V23_POLL_ENDPOINT_REQUEST,
            post_at_or_after_deadline,
            poll_return,
            poll_error,
            (uint16_t)returned_events,
            &decision) != HMG4V23_OK) {
      return classify_request_transport_failure(
          fixed_header_valid, HMG4V23_PIPE_REPRESENTATION_FAILURE);
    }
    if (decision == HMG4V23_POLL_DEADLINE) {
      return classify_request_transport_failure(
          fixed_header_valid, HMG4V23_PIPE_REQUEST_DEADLINE_EXCEEDED);
    }
    if (decision == HMG4V23_POLL_AGAIN) continue;
    if (decision == HMG4V23_POLL_TRANSPORT_ERROR) {
      return classify_request_transport_failure(
          fixed_header_valid, HMG4V23_PIPE_REQUEST_TRANSPORT_ERROR);
    }
    *next_mode = decision == HMG4V23_POLL_REQUEST_EOF_READ
                     ? HMG4V23_NEXT_READ_HUP_ONLY
                     : HMG4V23_NEXT_READ_ORDINARY;
    return HMG4V23_PIPE_OK;
  }
}

static hmg4v23_pipe_result read_request_bytes(
    uint8_t *destination,
    size_t requested_bytes,
    hmg4v23_read_phase phase,
    uint64_t deadline_ns,
    int fixed_header_valid,
    size_t *bytes_read,
    int *eof_confirmed) {
  hmg4v23_next_read_mode next_mode = HMG4V23_NEXT_READ_ORDINARY;
  if (destination == NULL || bytes_read == NULL || eof_confirmed == NULL ||
      requested_bytes == 0) {
    return HMG4V23_PIPE_NULL_ARGUMENT;
  }
  *bytes_read = 0;
  *eof_confirmed = 0;
  for (;;) {
    uint64_t pre_call_ns = 0;
    int read_error = 0;
    int post_at_or_after_deadline = 0;
    int64_t read_result = 0;
    hmg4v23_io_decision decision = HMG4V23_IO_TRANSPORT_ERROR;
    hmg4v23_pipe_result sample_result = sample_before_call(
        STDIN_FILENO, deadline_ns, fixed_header_valid, &pre_call_ns);
    (void)pre_call_ns;
    if (sample_result != HMG4V23_PIPE_OK) return sample_result;
    read_result = call_read_bytes(
        STDIN_FILENO, destination, requested_bytes, &read_error);
    sample_result = sample_after_request_call(
        deadline_ns, fixed_header_valid, &post_at_or_after_deadline);
    if (sample_result != HMG4V23_PIPE_OK) return sample_result;
    if (hmg4v23_request_read_decide(
            &io_symbols,
            phase,
            post_at_or_after_deadline,
            read_result,
            read_error,
            requested_bytes,
            &decision) != HMG4V23_TRANSPORT_OK) {
      return classify_request_transport_failure(
          fixed_header_valid, HMG4V23_PIPE_REPRESENTATION_FAILURE);
    }
    if (decision == HMG4V23_IO_DEADLINE) {
      return classify_request_transport_failure(
          fixed_header_valid, HMG4V23_PIPE_REQUEST_DEADLINE_EXCEEDED);
    }
    if (decision == HMG4V23_IO_RETRY_DIRECT) continue;
    if (decision == HMG4V23_IO_POLL) {
      if (next_mode == HMG4V23_NEXT_READ_HUP_ONLY) {
        return classify_request_transport_failure(
            fixed_header_valid, HMG4V23_PIPE_REQUEST_TRANSPORT_ERROR);
      }
      sample_result = poll_request_until_read(
          deadline_ns, fixed_header_valid, &next_mode);
      if (sample_result != HMG4V23_PIPE_OK) return sample_result;
      continue;
    }
    next_mode = HMG4V23_NEXT_READ_ORDINARY;
    if (decision == HMG4V23_IO_ADVANCE) {
      *bytes_read = (size_t)read_result;
      return HMG4V23_PIPE_OK;
    }
    if (decision == HMG4V23_IO_EOF_CONFIRMED) {
      *eof_confirmed = 1;
      return HMG4V23_PIPE_OK;
    }
    if (decision == HMG4V23_IO_INVALID_INCOMPLETE_HEADER) {
      return HMG4V23_PIPE_UNFRAMED_INVALID_HEADER;
    }
    if (decision == HMG4V23_IO_PAYLOAD_TRUNCATED) {
      return HMG4V23_PIPE_REQUEST_PAYLOAD_TRUNCATED;
    }
    if (decision == HMG4V23_IO_TRAILING_OR_SECOND_FRAME) {
      return HMG4V23_PIPE_REQUEST_TRAILING_OR_SECOND_FRAME;
    }
    if (decision == HMG4V23_IO_REPRESENTATION_ERROR) {
      return classify_request_transport_failure(
          fixed_header_valid, HMG4V23_PIPE_REPRESENTATION_FAILURE);
    }
    return classify_request_transport_failure(
        fixed_header_valid, HMG4V23_PIPE_REQUEST_TRANSPORT_ERROR);
  }
}

static int attempt_invalid_header_token(void) {
  const uint8_t *token =
      (const uint8_t *)HMG4V23_INVALID_HEADER_TOKEN;
  uint64_t start_ns = 0;
  uint64_t deadline_ns = 0;
  if (!call_verify_sigpipe_ignore() ||
      !call_monotonic_now_ns(&start_ns) ||
      hmg4v23_deadline_from_start(
          start_ns, HMG4V23_DIAGNOSTIC_DEADLINE_NS, &deadline_ns) !=
          HMG4V23_TRANSPORT_OK) {
    return 0;
  }
  for (;;) {
    uint64_t pre_call_ns = 0;
    uint64_t post_call_ns = 0;
    int write_error = 0;
    int64_t write_result = 0;
    hmg4v23_io_decision decision = HMG4V23_IO_DIAGNOSTIC_ABANDONED;
    if (!status_flags_are_exact(STDERR_FILENO) ||
        !call_monotonic_now_ns(&pre_call_ns) ||
        pre_call_ns >= deadline_ns) {
      return 0;
    }
    write_result = call_write_bytes(
        STDERR_FILENO, token, HMG4V23_INVALID_HEADER_TOKEN_SIZE, &write_error);
    if (!call_monotonic_now_ns(&post_call_ns)) return 0;
    if (hmg4v23_diagnostic_write_decide(
            &io_symbols,
            post_call_ns >= deadline_ns,
            write_result,
            write_error,
            &decision) != HMG4V23_TRANSPORT_OK) {
      return 0;
    }
    if (decision == HMG4V23_IO_RETRY_DIRECT) continue;
    return decision == HMG4V23_IO_WRITE_COMPLETE;
  }
}

static hmg4v23_pipe_result finish_unframed_result(
    hmg4v23_received_request *request,
    hmg4v23_pipe_result result) {
  if (result == HMG4V23_PIPE_UNFRAMED_INVALID_HEADER) {
    request->invalid_header_token_completed = attempt_invalid_header_token();
  }
  return result;
}

hmg4v23_pipe_result hmg4v23_install_and_verify_sigpipe_ignore(void) {
  return call_install_sigpipe_ignore() && call_verify_sigpipe_ignore()
             ? HMG4V23_PIPE_OK
             : HMG4V23_PIPE_SIGPIPE_BOOTSTRAP_FAILED;
}

void hmg4v23_release_received_request(
    hmg4v23_received_request *request) {
  if (request == NULL) return;
  if (request->owned_frame_bytes != NULL) {
    call_deallocate(request->owned_frame_bytes);
  }
  memset(request, 0, sizeof(*request));
}

hmg4v23_pipe_result hmg4v23_receive_request_fd0(
    hmg4v23_received_request *request) {
  uint8_t header_bytes[HMG4V23_REQUEST_HEADER_SIZE];
  uint8_t eof_probe = 0;
  uint8_t payload_digest[32];
  uint64_t start_ns = 0;
  uint64_t deadline_ns = 0;
  size_t header_offset = 0;
  size_t payload_offset = 0;
  size_t total_length = 0;
  hmg4v23_transport_result transport_result = HMG4V23_TRANSPORT_OK;

  if (request == NULL) return HMG4V23_PIPE_NULL_ARGUMENT;
  memset(request, 0, sizeof(*request));
  memset(header_bytes, 0, sizeof(header_bytes));
  memset(payload_digest, 0, sizeof(payload_digest));
  if (!call_verify_sigpipe_ignore()) {
    return HMG4V23_PIPE_SIGPIPE_BOOTSTRAP_FAILED;
  }
  if (!call_monotonic_now_ns(&start_ns) ||
      hmg4v23_deadline_from_start(
          start_ns, HMG4V23_REQUEST_DEADLINE_NS, &deadline_ns) !=
          HMG4V23_TRANSPORT_OK) {
    return finish_unframed_result(
        request, HMG4V23_PIPE_UNFRAMED_INVALID_HEADER);
  }
  while (header_offset < sizeof(header_bytes)) {
    size_t read_count = 0;
    int eof_confirmed = 0;
    hmg4v23_pipe_result read_result = read_request_bytes(
        header_bytes + header_offset,
        sizeof(header_bytes) - header_offset,
        HMG4V23_READ_PHASE_HEADER,
        deadline_ns,
        0,
        &read_count,
        &eof_confirmed);
    (void)eof_confirmed;
    if (read_result != HMG4V23_PIPE_OK) {
      return finish_unframed_result(request, read_result);
    }
    header_offset += read_count;
  }
  transport_result = hmg4v23_parse_request_header(
      (hmg4v23_span){header_bytes, sizeof(header_bytes)}, &request->header);
  if (transport_result != HMG4V23_TRANSPORT_OK) {
    return finish_unframed_result(
        request, HMG4V23_PIPE_UNFRAMED_INVALID_HEADER);
  }
  request->fixed_header_valid = 1;
  if (request->header.payload_length > (uint64_t)SIZE_MAX ||
      !hmg4v23_checked_add_size(
          HMG4V23_REQUEST_HEADER_SIZE,
          (size_t)request->header.payload_length,
          &total_length)) {
    return HMG4V23_PIPE_REPRESENTATION_FAILURE;
  }
  request->owned_frame_bytes = (uint8_t *)call_allocate(total_length);
  if (request->owned_frame_bytes == NULL) {
    return HMG4V23_PIPE_ALLOCATION_FAILURE;
  }
  request->owned_frame_length = total_length;
  memcpy(request->owned_frame_bytes, header_bytes, sizeof(header_bytes));
  while (payload_offset < (size_t)request->header.payload_length) {
    size_t read_count = 0;
    int eof_confirmed = 0;
    hmg4v23_pipe_result read_result = read_request_bytes(
        request->owned_frame_bytes + HMG4V23_REQUEST_HEADER_SIZE +
            payload_offset,
        (size_t)request->header.payload_length - payload_offset,
        HMG4V23_READ_PHASE_PAYLOAD,
        deadline_ns,
        1,
        &read_count,
        &eof_confirmed);
    (void)eof_confirmed;
    if (read_result != HMG4V23_PIPE_OK) {
      call_deallocate(request->owned_frame_bytes);
      request->owned_frame_bytes = NULL;
      request->owned_frame_length = 0;
      return read_result;
    }
    payload_offset += read_count;
  }
  {
    size_t read_count = 0;
    int eof_confirmed = 0;
    hmg4v23_pipe_result read_result = read_request_bytes(
        &eof_probe,
        1,
        HMG4V23_READ_PHASE_EOF_PROBE,
        deadline_ns,
        1,
        &read_count,
        &eof_confirmed);
    (void)read_count;
    if (read_result != HMG4V23_PIPE_OK || !eof_confirmed) {
      call_deallocate(request->owned_frame_bytes);
      request->owned_frame_bytes = NULL;
      request->owned_frame_length = 0;
      return read_result == HMG4V23_PIPE_OK
                 ? HMG4V23_PIPE_REPRESENTATION_FAILURE
                 : read_result;
    }
  }
  if (hmg4v23_sha256(
          (hmg4v23_span){
              request->owned_frame_bytes + HMG4V23_REQUEST_HEADER_SIZE,
              (size_t)request->header.payload_length},
          payload_digest) != HMG4V23_OK) {
    const hmg4v23_request_header retained_header = request->header;
    hmg4v23_release_received_request(request);
    request->header = retained_header;
    request->fixed_header_valid = 1;
    return HMG4V23_PIPE_SHA256_ENGINE_FAILURE;
  }
  if (memcmp(payload_digest, request->header.payload_sha256, 32) != 0) {
    const hmg4v23_request_header retained_header = request->header;
    hmg4v23_release_received_request(request);
    request->header = retained_header;
    request->fixed_header_valid = 1;
    return HMG4V23_PIPE_REQUEST_PAYLOAD_HASH_MISMATCH;
  }
  transport_result = hmg4v23_validate_buffered_request_frame(
      (hmg4v23_span){
          request->owned_frame_bytes, request->owned_frame_length},
      &request->frame);
  if (transport_result != HMG4V23_TRANSPORT_OK) {
    const hmg4v23_request_header retained_header = request->header;
    hmg4v23_release_received_request(request);
    request->header = retained_header;
    request->fixed_header_valid = 1;
    if (transport_result == HMG4V23_TRANSPORT_PAYLOAD_HASH_INVALID) {
      return HMG4V23_PIPE_REQUEST_PAYLOAD_HASH_MISMATCH;
    }
    return transport_result == HMG4V23_TRANSPORT_REPRESENTATION_INVALID
               ? HMG4V23_PIPE_SHA256_ENGINE_FAILURE
               : HMG4V23_PIPE_REPRESENTATION_FAILURE;
  }
  return HMG4V23_PIPE_OK;
}

static hmg4v23_pipe_result sample_before_response_call(
    uint64_t deadline_ns,
    uint64_t *pre_call_ns) {
  if (!call_verify_sigpipe_ignore() ||
      !status_flags_are_exact(STDOUT_FILENO) ||
      !call_monotonic_now_ns(pre_call_ns)) {
    return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
  }
  return *pre_call_ns < deadline_ns
             ? HMG4V23_PIPE_OK
             : HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
}

static hmg4v23_pipe_result poll_response_until_write(
    uint64_t deadline_ns) {
  for (;;) {
    uint64_t pre_call_ns = 0;
    uint64_t post_call_ns = 0;
    int timeout_ms = 0;
    int poll_return = 0;
    int poll_error = 0;
    int16_t returned_events = 0;
    hmg4v23_poll_decision decision = HMG4V23_POLL_TRANSPORT_ERROR;
    if (sample_before_response_call(deadline_ns, &pre_call_ns) !=
            HMG4V23_PIPE_OK ||
        hmg4v23_poll_timeout_ms(pre_call_ns, deadline_ns, &timeout_ms) !=
            HMG4V23_TRANSPORT_OK) {
      return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
    }
    returned_events = 0;
    if (!call_poll_one(
            STDOUT_FILENO,
            (int16_t)POLLOUT,
            timeout_ms,
            &poll_return,
            &poll_error,
            &returned_events) ||
        !call_monotonic_now_ns(&post_call_ns)) {
      return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
    }
    if (hmg4v23_poll_decide(
            &poll_symbols,
            HMG4V23_POLL_ENDPOINT_RESPONSE,
            post_call_ns >= deadline_ns,
            poll_return,
            poll_error,
            (uint16_t)returned_events,
            &decision) != HMG4V23_OK) {
      return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
    }
    if (decision == HMG4V23_POLL_AGAIN) continue;
    return decision == HMG4V23_POLL_RESPONSE_RETRY_WRITE
               ? HMG4V23_PIPE_OK
               : HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
  }
}

hmg4v23_pipe_result hmg4v23_emit_response_fd1(
    uint32_t expected_operation,
    hmg4v23_span response_frame,
    const uint8_t expected_sequence_zero_record_sha256[32]) {
  hmg4v23_response_frame_view view;
  uint64_t start_ns = 0;
  uint64_t deadline_ns = 0;
  size_t offset = 0;
  memset(&view, 0, sizeof(view));
  if ((response_frame.length != 0 && response_frame.bytes == NULL) ||
      hmg4v23_validate_response_frame(
          expected_operation,
          response_frame,
          expected_sequence_zero_record_sha256,
          &view) != HMG4V23_RESPONSE_OK) {
    return HMG4V23_PIPE_RESPONSE_FRAME_INVALID;
  }
  if (!call_verify_sigpipe_ignore() ||
      !call_monotonic_now_ns(&start_ns) ||
      hmg4v23_deadline_from_start(
          start_ns, HMG4V23_REQUEST_DEADLINE_NS, &deadline_ns) !=
          HMG4V23_TRANSPORT_OK) {
    return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
  }
  while (offset < response_frame.length) {
    uint64_t pre_call_ns = 0;
    uint64_t post_call_ns = 0;
    int write_error = 0;
    int64_t write_result = 0;
    hmg4v23_io_decision decision = HMG4V23_IO_TRANSPORT_ERROR;
    if (sample_before_response_call(deadline_ns, &pre_call_ns) !=
        HMG4V23_PIPE_OK) {
      return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
    }
    (void)pre_call_ns;
    write_result = call_write_bytes(
        STDOUT_FILENO,
        response_frame.bytes + offset,
        response_frame.length - offset,
        &write_error);
    if (!call_monotonic_now_ns(&post_call_ns) ||
        hmg4v23_response_write_decide(
            &io_symbols,
            post_call_ns >= deadline_ns,
            write_result,
            write_error,
            response_frame.length - offset,
            &decision) != HMG4V23_TRANSPORT_OK) {
      return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
    }
    if (decision == HMG4V23_IO_RETRY_DIRECT) continue;
    if (decision == HMG4V23_IO_POLL) {
      if (poll_response_until_write(deadline_ns) != HMG4V23_PIPE_OK) {
        return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
      }
      continue;
    }
    if (decision == HMG4V23_IO_ADVANCE) {
      offset += (size_t)write_result;
      continue;
    }
    if (decision == HMG4V23_IO_WRITE_COMPLETE) {
      return HMG4V23_PIPE_OK;
    }
    return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
  }
  return HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED;
}

uint32_t hmg4v23_pipe_result_diagnostic_code(
    hmg4v23_pipe_result result) {
  switch (result) {
    case HMG4V23_PIPE_REQUEST_PAYLOAD_TRUNCATED:
      return UINT32_C(0x00010001);
    case HMG4V23_PIPE_REQUEST_PAYLOAD_HASH_MISMATCH:
      return UINT32_C(0x00010002);
    case HMG4V23_PIPE_REQUEST_TRANSPORT_ERROR:
      return UINT32_C(0x00010006);
    case HMG4V23_PIPE_REQUEST_TRAILING_OR_SECOND_FRAME:
      return UINT32_C(0x00010008);
    case HMG4V23_PIPE_REQUEST_DEADLINE_EXCEEDED:
      return UINT32_C(0x00010009);
    case HMG4V23_PIPE_REPRESENTATION_FAILURE:
      return UINT32_C(0x00020015);
    case HMG4V23_PIPE_ALLOCATION_FAILURE:
      return UINT32_C(0x00020016);
    case HMG4V23_PIPE_SHA256_ENGINE_FAILURE:
      return UINT32_C(0x00020017);
    default:
      return 0;
  }
}

int hmg4v23_pipe_result_exit_code(
    hmg4v23_pipe_result result,
    int success_response_exit_code) {
  if (result == HMG4V23_PIPE_OK) return success_response_exit_code;
  if (result == HMG4V23_PIPE_SIGPIPE_BOOTSTRAP_FAILED ||
      result == HMG4V23_PIPE_UNFRAMED_INVALID_HEADER) {
    return HMG4V23_STARTUP_EXIT;
  }
  return result == HMG4V23_PIPE_RESPONSE_FRAME_INVALID ||
                 result == HMG4V23_PIPE_RESPONSE_TRANSPORT_FAILED
             ? HMG4V23_RESPONSE_FAILURE_EXIT
             : success_response_exit_code;
}

const char *hmg4v23_pipe_result_name(hmg4v23_pipe_result result) {
  static const char *const names[] = {
      "OK",
      "NULL_ARGUMENT",
      "SIGPIPE_BOOTSTRAP_FAILED",
      "UNFRAMED_INVALID_HEADER",
      "REQUEST_PAYLOAD_TRUNCATED",
      "REQUEST_PAYLOAD_HASH_MISMATCH",
      "REQUEST_TRANSPORT_ERROR",
      "REQUEST_TRAILING_OR_SECOND_FRAME",
      "REQUEST_DEADLINE_EXCEEDED",
      "REPRESENTATION_FAILURE",
      "ALLOCATION_FAILURE",
      "SHA256_ENGINE_FAILURE",
      "RESPONSE_FRAME_INVALID",
      "RESPONSE_TRANSPORT_FAILED"};
  const size_t ordinal = (size_t)result;
  return ordinal < sizeof(names) / sizeof(names[0]) ? names[ordinal]
                                                    : "UNKNOWN_PIPE_RESULT";
}
