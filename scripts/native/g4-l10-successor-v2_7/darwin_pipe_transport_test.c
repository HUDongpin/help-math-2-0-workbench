#include "darwin_pipe_transport.h"
#include "darwin_pipe_transport_testing.h"

#include <errno.h>
#include <fcntl.h>
#include <limits.h>
#include <poll.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define MAX_PLAN ((size_t)32)
#define MAX_CAPTURE ((size_t)4096)

typedef struct {
  int64_t result;
  int error_value;
} io_event;

typedef struct {
  int poll_return;
  int poll_error;
  int16_t returned_events;
} poll_event;

typedef struct {
  uint8_t input[MAX_CAPTURE];
  size_t input_length;
  size_t input_offset;
  io_event reads[MAX_PLAN];
  size_t read_count;
  size_t read_index;
  io_event writes[MAX_PLAN];
  size_t write_count;
  size_t write_index;
  poll_event polls[MAX_PLAN];
  size_t poll_count;
  size_t poll_index;
  uint8_t fd1_capture[MAX_CAPTURE];
  size_t fd1_length;
  uint8_t fd2_capture[MAX_CAPTURE];
  size_t fd2_length;
  uint64_t next_time_ns;
  size_t clock_index;
  size_t special_clock_index;
  uint64_t special_clock_value;
  int install_ok;
  int verify_ok;
  int allocation_fails;
  int status_flags_fail;
  int status_flags_drift_fd;
  size_t allocations;
  size_t deallocations;
  size_t read_calls;
  size_t write_calls;
  size_t poll_calls;
} fake_context;

static size_t assertions = 0;

#define EXPECT_TRUE(condition)                                                \
  do {                                                                        \
    ++assertions;                                                             \
    if (!(condition)) {                                                       \
      fprintf(stderr, "FAIL line %d: %s\n", __LINE__, #condition);           \
      exit(1);                                                                \
    }                                                                         \
  } while (0)

#define EXPECT_PIPE(actual, expected)                                         \
  do {                                                                        \
    const hmg4v27_pipe_result actual_result = (actual);                       \
    ++assertions;                                                             \
    if (actual_result != (expected)) {                                        \
      fprintf(stderr,                                                         \
              "FAIL line %d: got %s expected %s\n",                          \
              __LINE__,                                                       \
              hmg4v27_pipe_result_name(actual_result),                        \
              hmg4v27_pipe_result_name((expected)));                          \
      exit(1);                                                                \
    }                                                                         \
  } while (0)

static void reset_context(fake_context *context) {
  memset(context, 0, sizeof(*context));
  context->next_time_ns = UINT64_C(1000);
  context->special_clock_index = SIZE_MAX;
  context->install_ok = 1;
  context->verify_ok = 1;
  context->status_flags_drift_fd = -1;
}

static int fake_install(void *opaque) {
  fake_context *context = (fake_context *)opaque;
  return context->install_ok;
}

static int fake_verify(void *opaque) {
  fake_context *context = (fake_context *)opaque;
  return context->verify_ok;
}

static int fake_now(void *opaque, uint64_t *now_ns) {
  fake_context *context = (fake_context *)opaque;
  if (now_ns == NULL) return 0;
  if (context->clock_index == context->special_clock_index) {
    *now_ns = context->special_clock_value;
  } else {
    *now_ns = context->next_time_ns;
    ++context->next_time_ns;
  }
  ++context->clock_index;
  return 1;
}

static int fake_flags(void *opaque, int fd, int *status_flags) {
  fake_context *context = (fake_context *)opaque;
  if (status_flags == NULL || context->status_flags_fail) return 0;
  *status_flags =
      (fd == STDIN_FILENO ? O_RDONLY : O_WRONLY) | O_NONBLOCK;
  if (fd == context->status_flags_drift_fd) *status_flags ^= O_NONBLOCK;
  return 1;
}

static int64_t fake_read(
    void *opaque,
    int fd,
    uint8_t *bytes,
    size_t length,
    int *error_value) {
  fake_context *context = (fake_context *)opaque;
  int64_t result = 0;
  size_t available = context->input_length - context->input_offset;
  (void)fd;
  ++context->read_calls;
  if (context->read_index < context->read_count) {
    const io_event event = context->reads[context->read_index++];
    result = event.result;
    *error_value = event.error_value;
  } else {
    const size_t copied = available < length ? available : length;
    result = (int64_t)copied;
    *error_value = 0;
  }
  if (result > 0 && (uint64_t)result <= (uint64_t)length) {
    const size_t copied = (size_t)result;
    if (copied > available) {
      fprintf(stderr, "fake read plan exceeds available input\n");
      exit(1);
    }
    memcpy(bytes, context->input + context->input_offset, copied);
    context->input_offset += copied;
  }
  return result;
}

static int64_t fake_write(
    void *opaque,
    int fd,
    const uint8_t *bytes,
    size_t length,
    int *error_value) {
  fake_context *context = (fake_context *)opaque;
  int64_t result = (int64_t)length;
  uint8_t *capture = fd == STDOUT_FILENO ? context->fd1_capture
                                         : context->fd2_capture;
  size_t *capture_length = fd == STDOUT_FILENO ? &context->fd1_length
                                               : &context->fd2_length;
  ++context->write_calls;
  if (context->write_index < context->write_count) {
    const io_event event = context->writes[context->write_index++];
    result = event.result;
    *error_value = event.error_value;
  } else {
    *error_value = 0;
  }
  if (result > 0 && (uint64_t)result <= (uint64_t)length) {
    const size_t copied = (size_t)result;
    if (*capture_length > MAX_CAPTURE - copied) {
      fprintf(stderr, "fake capture overflow\n");
      exit(1);
    }
    memcpy(capture + *capture_length, bytes, copied);
    *capture_length += copied;
  }
  return result;
}

static int fake_poll(
    void *opaque,
    int fd,
    int16_t requested_events,
    int timeout_ms,
    int *poll_return,
    int *poll_error,
    int16_t *returned_events) {
  fake_context *context = (fake_context *)opaque;
  poll_event event = {1, 0, requested_events};
  (void)fd;
  if (timeout_ms <= 0 || poll_return == NULL || poll_error == NULL ||
      returned_events == NULL) {
    return 0;
  }
  ++context->poll_calls;
  if (context->poll_index < context->poll_count) {
    event = context->polls[context->poll_index++];
  }
  *poll_return = event.poll_return;
  *poll_error = event.poll_error;
  *returned_events = event.returned_events;
  return 1;
}

static void *fake_allocate(void *opaque, size_t length) {
  fake_context *context = (fake_context *)opaque;
  ++context->allocations;
  return context->allocation_fails ? NULL : malloc(length);
}

static void fake_deallocate(void *opaque, void *allocation) {
  fake_context *context = (fake_context *)opaque;
  ++context->deallocations;
  free(allocation);
}

static void install_backend(fake_context *context) {
  const hmg4v27_transport_test_backend backend = {
      context,
      fake_install,
      fake_verify,
      fake_now,
      fake_flags,
      fake_read,
      fake_write,
      fake_poll,
      fake_allocate,
      fake_deallocate};
  EXPECT_TRUE(hmg4v27_transport_test_set_backend(&backend));
}

static size_t make_request(
    uint32_t operation,
    const uint8_t *payload,
    size_t payload_length,
    uint8_t output[MAX_CAPTURE]) {
  uint8_t digest[32];
  EXPECT_TRUE(payload != NULL || payload_length == 0);
  EXPECT_TRUE(payload_length <= HMG4V27_REQUEST_MAX_PAYLOAD);
  memset(output, 0, HMG4V27_REQUEST_HEADER_SIZE + payload_length);
  memcpy(output, "HMG4V2\0\0", 8);
  hmg4v27_write_u32_be(output + 8, 2);
  hmg4v27_write_u32_be(output + 12, operation);
  hmg4v27_write_u64_be(output + 16, (uint64_t)payload_length);
  EXPECT_TRUE(hmg4v27_sha256(
                  (hmg4v27_span){payload, payload_length}, digest) ==
              HMG4V27_OK);
  memcpy(output + 24, digest, sizeof(digest));
  if (payload_length != 0) {
    memcpy(output + HMG4V27_REQUEST_HEADER_SIZE, payload, payload_length);
  }
  return HMG4V27_REQUEST_HEADER_SIZE + payload_length;
}

static size_t make_status_five_response(uint8_t output[MAX_CAPTURE]) {
  hmg4v27_response_fields fields;
  size_t output_length = 0;
  size_t index = 0;
  memset(&fields, 0, sizeof(fields));
  fields.operation = 1;
  fields.status = 5;
  fields.diagnostic_code = UINT32_C(0x00010001);
  for (index = 0; index < 32; ++index) {
    fields.request_payload_sha256[index] = (uint8_t)(index + 1u);
  }
  EXPECT_TRUE(hmg4v27_encode_response_frame(
                  &fields, output, MAX_CAPTURE, &output_length) ==
              HMG4V27_RESPONSE_OK);
  return output_length;
}

static void test_bootstrap(void) {
  fake_context context;
  reset_context(&context);
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_install_and_verify_sigpipe_ignore(), HMG4V27_PIPE_OK);
  context.install_ok = 0;
  EXPECT_PIPE(hmg4v27_install_and_verify_sigpipe_ignore(),
              HMG4V27_PIPE_SIGPIPE_BOOTSTRAP_FAILED);
  context.install_ok = 1;
  context.verify_ok = 0;
  EXPECT_PIPE(hmg4v27_install_and_verify_sigpipe_ignore(),
              HMG4V27_PIPE_SIGPIPE_BOOTSTRAP_FAILED);
}

static void test_valid_empty_request(void) {
  fake_context context;
  hmg4v27_received_request request;
  uint8_t expected_frame_hash[32];
  reset_context(&context);
  context.input_length = make_request(1, NULL, 0, context.input);
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request), HMG4V27_PIPE_OK);
  EXPECT_TRUE(request.fixed_header_valid == 1);
  EXPECT_TRUE(request.owned_frame_length == HMG4V27_REQUEST_HEADER_SIZE);
  EXPECT_TRUE(request.frame.header.operation == 1);
  EXPECT_TRUE(request.frame.payload.length == 0);
  EXPECT_TRUE(hmg4v27_sha256(
                  (hmg4v27_span){context.input, context.input_length},
                  expected_frame_hash) == HMG4V27_OK);
  EXPECT_TRUE(memcmp(request.frame.request_frame_sha256,
                     expected_frame_hash,
                     sizeof(expected_frame_hash)) == 0);
  EXPECT_TRUE(context.read_calls == 2);
  hmg4v27_release_received_request(&request);
  EXPECT_TRUE(context.allocations == 1);
  EXPECT_TRUE(context.deallocations == 1);
  EXPECT_TRUE(request.owned_frame_bytes == NULL);
}

static void test_short_retry_poll_and_hup(void) {
  fake_context context;
  hmg4v27_received_request request;
  reset_context(&context);
  context.input_length = make_request(2, NULL, 0, context.input);
  context.reads[0] = (io_event){7, 0};
  context.reads[1] = (io_event){-1, EINTR};
  context.reads[2] = (io_event){-1, EAGAIN};
  context.reads[3] = (io_event){49, 0};
  context.reads[4] = (io_event){-1, EAGAIN};
  context.reads[5] = (io_event){0, 0};
  context.read_count = 6;
  context.polls[0] = (poll_event){1, 0, (int16_t)POLLIN};
  context.polls[1] = (poll_event){1, 0, (int16_t)POLLHUP};
  context.poll_count = 2;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request), HMG4V27_PIPE_OK);
  EXPECT_TRUE(context.read_calls == 6);
  EXPECT_TRUE(context.poll_calls == 2);
  EXPECT_TRUE(request.frame.header.operation == 2);
  hmg4v27_release_received_request(&request);
}

static void test_unframed_and_token_profiles(void) {
  fake_context context;
  hmg4v27_received_request request;
  reset_context(&context);
  context.input_length = make_request(1, NULL, 0, context.input);
  context.input[0] = (uint8_t)'X';
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_UNFRAMED_INVALID_HEADER);
  EXPECT_TRUE(request.invalid_header_token_completed == 1);
  EXPECT_TRUE(context.fd2_length == HMG4V27_INVALID_HEADER_TOKEN_SIZE);
  EXPECT_TRUE(memcmp(context.fd2_capture,
                     HMG4V27_INVALID_HEADER_TOKEN,
                     HMG4V27_INVALID_HEADER_TOKEN_SIZE) == 0);
  EXPECT_TRUE(context.fd1_length == 0);

  reset_context(&context);
  context.input_length = make_request(1, NULL, 0, context.input);
  context.input[0] = (uint8_t)'X';
  context.writes[0] = (io_event){-1, EINTR};
  context.writes[1] =
      (io_event){(int64_t)HMG4V27_INVALID_HEADER_TOKEN_SIZE, 0};
  context.write_count = 2;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_UNFRAMED_INVALID_HEADER);
  EXPECT_TRUE(request.invalid_header_token_completed == 1);
  EXPECT_TRUE(context.write_calls == 2);

  reset_context(&context);
  context.input_length = make_request(1, NULL, 0, context.input);
  context.input[0] = (uint8_t)'X';
  context.writes[0] = (io_event){-1, EAGAIN};
  context.write_count = 1;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_UNFRAMED_INVALID_HEADER);
  EXPECT_TRUE(request.invalid_header_token_completed == 0);
  EXPECT_TRUE(context.write_calls == 1);
  EXPECT_TRUE(context.poll_calls == 0);

  reset_context(&context);
  context.input_length = make_request(1, NULL, 0, context.input);
  context.input[0] = (uint8_t)'X';
  context.writes[0] = (io_event){5, 0};
  context.write_count = 1;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_UNFRAMED_INVALID_HEADER);
  EXPECT_TRUE(request.invalid_header_token_completed == 0);
  EXPECT_TRUE(context.fd2_length == 5);
  EXPECT_TRUE(context.write_calls == 1);
}

static void test_post_header_failure_mappings(void) {
  const uint8_t payload[3] = {1, 2, 3};
  fake_context context;
  hmg4v27_received_request request;

  reset_context(&context);
  context.input_length = make_request(1, payload, sizeof(payload), context.input);
  context.input_length -= 1;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_REQUEST_PAYLOAD_TRUNCATED);
  EXPECT_TRUE(request.fixed_header_valid == 1);
  EXPECT_TRUE(context.fd2_length == 0);
  EXPECT_TRUE(hmg4v27_pipe_result_diagnostic_code(
                  HMG4V27_PIPE_REQUEST_PAYLOAD_TRUNCATED) ==
              UINT32_C(0x00010001));

  reset_context(&context);
  context.input_length = make_request(1, payload, sizeof(payload), context.input);
  context.input[24] ^= UINT8_C(1);
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_REQUEST_PAYLOAD_HASH_MISMATCH);
  EXPECT_TRUE(context.deallocations == 1);

  reset_context(&context);
  context.input_length = make_request(1, payload, sizeof(payload), context.input);
  context.input[context.input_length++] = UINT8_C(0xaa);
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_REQUEST_TRAILING_OR_SECOND_FRAME);
  EXPECT_TRUE(hmg4v27_pipe_result_diagnostic_code(
                  HMG4V27_PIPE_REQUEST_TRAILING_OR_SECOND_FRAME) ==
              UINT32_C(0x00010008));

  reset_context(&context);
  context.input_length = make_request(1, payload, sizeof(payload), context.input);
  context.reads[0] = (io_event){56, 0};
  context.reads[1] = (io_event){-1, EIO};
  context.read_count = 2;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_REQUEST_TRANSPORT_ERROR);
  EXPECT_TRUE(hmg4v27_pipe_result_diagnostic_code(
                  HMG4V27_PIPE_REQUEST_TRANSPORT_ERROR) ==
              UINT32_C(0x00010006));

  reset_context(&context);
  context.input_length = make_request(1, payload, sizeof(payload), context.input);
  context.reads[0] = (io_event){56, 0};
  context.reads[1] = (io_event){3, 0};
  context.read_count = 2;
  context.special_clock_index = 4;
  context.special_clock_value =
      UINT64_C(1000) + HMG4V27_REQUEST_DEADLINE_NS;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_REQUEST_DEADLINE_EXCEEDED);
  EXPECT_TRUE(hmg4v27_pipe_result_diagnostic_code(
                  HMG4V27_PIPE_REQUEST_DEADLINE_EXCEEDED) ==
              UINT32_C(0x00010009));

  reset_context(&context);
  context.input_length = make_request(1, payload, sizeof(payload), context.input);
  context.allocation_fails = 1;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_ALLOCATION_FAILURE);
  EXPECT_TRUE(request.fixed_header_valid == 1);
  EXPECT_TRUE(hmg4v27_pipe_result_diagnostic_code(
                  HMG4V27_PIPE_ALLOCATION_FAILURE) ==
              UINT32_C(0x00020016));
}

static void test_hup_only_eagain_fails(void) {
  fake_context context;
  hmg4v27_received_request request;
  reset_context(&context);
  context.input_length = make_request(1, NULL, 0, context.input);
  context.reads[0] = (io_event){56, 0};
  context.reads[1] = (io_event){-1, EAGAIN};
  context.reads[2] = (io_event){-1, EAGAIN};
  context.read_count = 3;
  context.polls[0] = (poll_event){1, 0, (int16_t)POLLHUP};
  context.poll_count = 1;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_receive_request_fd0(&request),
              HMG4V27_PIPE_REQUEST_TRANSPORT_ERROR);
  EXPECT_TRUE(context.poll_calls == 1);
  EXPECT_TRUE(context.read_calls == 3);
}

static void test_response_profiles(void) {
  fake_context context;
  uint8_t response[MAX_CAPTURE];
  const size_t response_length = make_status_five_response(response);

  reset_context(&context);
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_emit_response_fd1(
                  1,
                  (hmg4v27_span){response, response_length},
                  NULL),
              HMG4V27_PIPE_OK);
  EXPECT_TRUE(context.fd1_length == response_length);
  EXPECT_TRUE(memcmp(context.fd1_capture, response, response_length) == 0);
  EXPECT_TRUE(context.write_calls == 1);

  reset_context(&context);
  context.writes[0] = (io_event){5, 0};
  context.write_count = 1;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_emit_response_fd1(
                  1,
                  (hmg4v27_span){response, response_length},
                  NULL),
              HMG4V27_PIPE_OK);
  EXPECT_TRUE(context.write_calls == 2);
  EXPECT_TRUE(context.fd1_length == response_length);

  reset_context(&context);
  context.writes[0] = (io_event){-1, EAGAIN};
  context.write_count = 1;
  context.polls[0] = (poll_event){1, 0, (int16_t)POLLOUT};
  context.poll_count = 1;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_emit_response_fd1(
                  1,
                  (hmg4v27_span){response, response_length},
                  NULL),
              HMG4V27_PIPE_OK);
  EXPECT_TRUE(context.poll_calls == 1);
  EXPECT_TRUE(context.write_calls == 2);

  reset_context(&context);
  context.writes[0] = (io_event){-1, EAGAIN};
  context.write_count = 1;
  context.polls[0] =
      (poll_event){1, 0, (int16_t)(POLLOUT | POLLHUP)};
  context.poll_count = 1;
  install_backend(&context);
  EXPECT_PIPE(hmg4v27_emit_response_fd1(
                  1,
                  (hmg4v27_span){response, response_length},
                  NULL),
              HMG4V27_PIPE_RESPONSE_TRANSPORT_FAILED);
  EXPECT_TRUE(context.write_calls == 1);
  EXPECT_TRUE(context.poll_calls == 1);

  reset_context(&context);
  install_backend(&context);
  response[0] ^= UINT8_C(1);
  EXPECT_PIPE(hmg4v27_emit_response_fd1(
                  1,
                  (hmg4v27_span){response, response_length},
                  NULL),
              HMG4V27_PIPE_RESPONSE_FRAME_INVALID);
  EXPECT_TRUE(context.write_calls == 0);
}

static void test_public_mappings(void) {
  EXPECT_TRUE(hmg4v27_pipe_result_diagnostic_code(HMG4V27_PIPE_OK) == 0);
  EXPECT_TRUE(hmg4v27_pipe_result_diagnostic_code(
                  HMG4V27_PIPE_REPRESENTATION_FAILURE) ==
              UINT32_C(0x00020015));
  EXPECT_TRUE(hmg4v27_pipe_result_diagnostic_code(
                  HMG4V27_PIPE_SHA256_ENGINE_FAILURE) ==
              UINT32_C(0x00020017));
  EXPECT_TRUE(hmg4v27_pipe_result_exit_code(
                  HMG4V27_PIPE_UNFRAMED_INVALID_HEADER, 5) == 64);
  EXPECT_TRUE(hmg4v27_pipe_result_exit_code(
                  HMG4V27_PIPE_RESPONSE_TRANSPORT_FAILED, 5) == 74);
  EXPECT_TRUE(hmg4v27_pipe_result_exit_code(HMG4V27_PIPE_OK, 5) == 5);
  EXPECT_TRUE(strcmp(hmg4v27_pipe_result_name((hmg4v27_pipe_result)99),
                     "UNKNOWN_PIPE_RESULT") == 0);
}

int main(void) {
  test_bootstrap();
  test_valid_empty_request();
  test_short_retry_poll_and_hup();
  test_unframed_and_token_profiles();
  test_post_header_failure_mappings();
  test_hup_only_eagain_fails();
  test_response_profiles();
  test_public_mappings();
  hmg4v27_transport_test_clear_backend();
  printf("darwin_pipe_transport_test: all checks passed (assertions=%zu)\n",
         assertions);
  return 0;
}
