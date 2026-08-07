#include "contract_core.h"

#include <CommonCrypto/CommonDigest.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static unsigned assertions = 0;
#define CHECK(condition) do { assertions++; if (!(condition)) { \
  fprintf(stderr, "assertion failed at %s:%d: %s\n", __FILE__, __LINE__, #condition); \
  exit(1); } } while (0)

static void put_u32(uint8_t *bytes, uint32_t value) {
  bytes[0]=(uint8_t)(value>>24); bytes[1]=(uint8_t)(value>>16);
  bytes[2]=(uint8_t)(value>>8); bytes[3]=(uint8_t)value;
}

static void put_u64(uint8_t *bytes, uint64_t value) {
  put_u32(bytes, (uint32_t)(value>>32)); put_u32(bytes+4, (uint32_t)value);
}

static void build_header(uint8_t header[56], const char magic[6], uint32_t kind,
                         uint64_t payload_length, const uint8_t digest[32]) {
  memset(header, 0, 56); memcpy(header, magic, 6); put_u32(header+8, 2);
  put_u32(header+12, kind); put_u64(header+16, payload_length);
  memcpy(header+24, digest, 32);
}

static void test_identity_and_arithmetic(void) {
  size_t value = 0;
  uint8_t encoded[8] = {0};
  uint8_t digest[32] = {0};
  static const uint8_t empty_sha256[32] = {
      0xe3,0xb0,0xc4,0x42,0x98,0xfc,0x1c,0x14,
      0x9a,0xfb,0xf4,0xc8,0x99,0x6f,0xb9,0x24,
      0x27,0xae,0x41,0xe4,0x64,0x9b,0x93,0x4c,
      0xa4,0x95,0x99,0x1b,0x78,0x52,0xb8,0x55};
  CHECK(strlen(HMG4V23_SUCCESSOR_SHA256_HEX)==64);
  CHECK(strlen(HMG4V23_PREDECESSOR_SHA256_HEX)==64);
  CHECK(strlen(HMG4V23_GATE_A_SHA256_HEX)==64);
  CHECK(hmg4v23_successor_sha256[0]==0xbf && hmg4v23_successor_sha256[31]==0x20);
  CHECK(hmg4v23_predecessor_sha256[0]==0xd7 && hmg4v23_predecessor_sha256[31]==0x5c);
  CHECK(hmg4v23_gate_a_sha256[0]==0xee && hmg4v23_gate_a_sha256[31]==0xc8);
  CHECK(HMG4V23_INVALID_HEADER_TOKEN_SIZE==strlen(HMG4V23_INVALID_HEADER_TOKEN));
  CHECK(hmg4v23_checked_add_size(5,7,&value) && value==12);
  CHECK(!hmg4v23_checked_add_size(SIZE_MAX,1,&value));
  CHECK(!hmg4v23_checked_add_size(1,2,NULL));
  CHECK(hmg4v23_checked_mul_size(6,7,&value) && value==42);
  CHECK(!hmg4v23_checked_mul_size(SIZE_MAX,2,&value));
  CHECK(!hmg4v23_checked_mul_size(1,2,NULL));
  CHECK(hmg4v23_range_within(3,4,7));
  CHECK(!hmg4v23_range_within(4,4,7));
  CHECK(!hmg4v23_range_within(SIZE_MAX,1,8));
  hmg4v23_write_u16_be(encoded, UINT16_C(0x1234));
  CHECK(hmg4v23_read_u16_be(encoded)==UINT16_C(0x1234));
  hmg4v23_write_u32_be(encoded, UINT32_C(0x89abcdef));
  CHECK(hmg4v23_read_u32_be(encoded)==UINT32_C(0x89abcdef));
  hmg4v23_write_u64_be(encoded, UINT64_C(0x0123456789abcdef));
  CHECK(hmg4v23_read_u64_be(encoded)==UINT64_C(0x0123456789abcdef));
  CHECK(hmg4v23_sha256((hmg4v23_span){NULL,0},digest)==HMG4V23_OK &&
        memcmp(digest,empty_sha256,sizeof(digest))==0);
  CHECK(hmg4v23_sha256((hmg4v23_span){NULL,1},digest)==HMG4V23_NULL_ARGUMENT);
}

static void test_authority_envelope(void) {
  static const struct { const char magic[7]; uint32_t kind; uint64_t maximum; } cases[] = {
    {"HMG4P2",1,16777216},{"HMG4N2",1,16777216},{"HMG4K2",1,16777216},
    {"HMG4K2",2,16777216},{"HMG4F2",1,4194304},{"HMG4F2",2,4194304},
    {"HMG4L2",1,1048576},{"HMG4L2",2,16777216},{"HMG4C2",1,8388608},
    {"HMG4C2",3,8388608},{"HMG4S2",1,2097152},{"HMG4S2",3,2097152},
    {"HMG4Q2",1,1073741824},{"HMG4I2",1,67108864},{"HMG4U2",1,67108864},
    {"HMG4Y2",1,1048576},{"HMG4W2",1,1048576},{"HMG4Z2",1,1048576},
    {"HMG4E2",1,16777216},{"HMG4E2",6,16777216},{"HMG4L3",1,16777216},
    {"HMG4G2",1,134217728},{"HMG4H2",1,67108864},{"HMG4H2",2,67108864},
    {"HMG4M2",1,67108864},{"HMG4M2",2,67108864}};
  uint8_t empty_digest[32], header[56], frame[59];
  hmg4v23_authority_header parsed;
  hmg4v23_authority_envelope envelope;
  size_t ordinal;
  CC_SHA256(NULL, 0, empty_digest);
  for (ordinal=0; ordinal<sizeof(cases)/sizeof(cases[0]); ++ordinal) {
    build_header(header,cases[ordinal].magic,cases[ordinal].kind,0,empty_digest);
    CHECK(hmg4v23_parse_authority_header((hmg4v23_span){header,56},&parsed)==HMG4V23_OK);
    CHECK(parsed.kind==cases[ordinal].kind && parsed.payload_length==0);
    CHECK(hmg4v23_validate_authority_envelope((hmg4v23_span){header,56},&envelope)==HMG4V23_OK);
    build_header(header,cases[ordinal].magic,cases[ordinal].kind,cases[ordinal].maximum,empty_digest);
    CHECK(hmg4v23_parse_authority_header((hmg4v23_span){header,56},&parsed)==HMG4V23_OK);
    build_header(header,cases[ordinal].magic,cases[ordinal].kind,cases[ordinal].maximum+1,empty_digest);
    CHECK(hmg4v23_parse_authority_header((hmg4v23_span){header,56},&parsed)==HMG4V23_PAYLOAD_TOO_LARGE);
  }
  build_header(header,"HMG4P2",1,0,empty_digest);
  CHECK(hmg4v23_parse_authority_header((hmg4v23_span){header,55},&parsed)==HMG4V23_TRUNCATED_HEADER);
  header[0]='X'; CHECK(hmg4v23_parse_authority_header((hmg4v23_span){header,56},&parsed)==HMG4V23_BAD_MAGIC);
  build_header(header,"HMG4P2",2,0,empty_digest);
  CHECK(hmg4v23_parse_authority_header((hmg4v23_span){header,56},&parsed)==HMG4V23_BAD_KIND);
  build_header(header,"HMG4P2",1,0,empty_digest); put_u32(header+8,3);
  CHECK(hmg4v23_parse_authority_header((hmg4v23_span){header,56},&parsed)==HMG4V23_BAD_VERSION);
  memcpy(frame,header,56); put_u32(frame+8,2); frame[56]=1; frame[57]=2; frame[58]=3;
  CHECK(hmg4v23_validate_authority_envelope((hmg4v23_span){frame,59},&envelope)==HMG4V23_FRAME_LENGTH_MISMATCH);
  CC_SHA256(frame+56,3,frame+24); put_u64(frame+16,3);
  CHECK(hmg4v23_validate_authority_envelope((hmg4v23_span){frame,59},&envelope)==HMG4V23_OK);
  frame[58]^=1;
  CHECK(hmg4v23_validate_authority_envelope((hmg4v23_span){frame,59},&envelope)==HMG4V23_PAYLOAD_HASH_MISMATCH);
  CHECK(hmg4v23_validate_authority_envelope((hmg4v23_span){NULL,1},&envelope)==HMG4V23_NULL_ARGUMENT);
}

static void test_tlv_and_xattr_limits(void) {
  static const uint16_t type10[] = {0x6107,0x6143,0x6152,0x61a4,0x8b1a,0x9302,0x9422,0x95e9,0x9662};
  const hmg4v23_xattr_limits *limits = hmg4v23_xattr_policy_limits();
  size_t i;
  for (i=1;i<=0x0c;i++) CHECK(hmg4v23_tlv_type_site_is_legal((uint8_t)i,0xffff));
  CHECK(hmg4v23_tlv_type_site_is_legal(0x0d,0x790a)); CHECK(hmg4v23_tlv_type_site_is_legal(0x0d,0x300b));
  CHECK(!hmg4v23_tlv_type_site_is_legal(0x0d,0x790b));
  CHECK(hmg4v23_tlv_type_site_is_legal(0x0e,0x7a04)); CHECK(hmg4v23_tlv_type_site_is_legal(0x0e,0x7fd3));
  CHECK(hmg4v23_tlv_type_site_is_legal(0x0f,0x3030)); CHECK(hmg4v23_tlv_type_site_is_legal(0x0f,0x7f39)); CHECK(hmg4v23_tlv_type_site_is_legal(0x0f,0x80c4));
  for (i=0;i<sizeof(type10)/sizeof(type10[0]);i++) CHECK(hmg4v23_tlv_type_site_is_legal(0x10,type10[i]));
  CHECK(!hmg4v23_tlv_type_site_is_legal(0x10,0x9663)); CHECK(!hmg4v23_tlv_type_site_is_legal(0x11,0x6107)); CHECK(!hmg4v23_tlv_type_site_is_legal(0,0));
  CHECK(limits->maximum_attribute_count==64); CHECK(limits->maximum_name_bytes==127);
  CHECK(limits->maximum_value_bytes==4096); CHECK(limits->maximum_total_value_bytes==65536); CHECK(limits->maximum_stream_bytes==524288);
}

static void test_registries(void) {
  uint32_t counts[7]={0}; uint32_t prior=0; size_t i;
  const hmg4v23_diagnostic *d=NULL; const hmg4v23_rollback_reason *r=NULL; const hmg4v23_direction *x=NULL;
  for (i=0;i<HMG4V23_DIAGNOSTIC_COUNT;i++) {
    d=hmg4v23_diagnostic_at(i); CHECK(d!=NULL); CHECK(i==0 || d->code>prior); prior=d->code;
    CHECK(d->status<=6); counts[d->status]++; CHECK(d->name!=NULL && d->name[0]!='\0');
    CHECK(hmg4v23_lookup_diagnostic(d->code,&d)==HMG4V23_OK);
    CHECK(hmg4v23_validate_diagnostic_status(d->code,d->status)==HMG4V23_OK);
  }
  CHECK(hmg4v23_diagnostic_at(HMG4V23_DIAGNOSTIC_COUNT)==NULL);
  CHECK(counts[0]==1&&counts[1]==32&&counts[2]==2&&counts[3]==9&&counts[4]==19&&counts[5]==8&&counts[6]==11);
  CHECK(hmg4v23_lookup_diagnostic(0x00010007,&d)==HMG4V23_UNKNOWN_DIAGNOSTIC && d==NULL);
  CHECK(hmg4v23_lookup_diagnostic(0x00040007,&d)==HMG4V23_UNKNOWN_DIAGNOSTIC && d==NULL);
  CHECK(hmg4v23_validate_diagnostic_status(0,1)==HMG4V23_DIAGNOSTIC_STATUS_MISMATCH);
  CHECK(hmg4v23_lookup_diagnostic(0,NULL)==HMG4V23_NULL_ARGUMENT);
  for (i=0;i<3;i++) { CHECK(hmg4v23_rollback_reason_at(i)->reason==i+1); CHECK(hmg4v23_lookup_rollback_reason((uint32_t)i+1,&r)==HMG4V23_OK); }
  CHECK(hmg4v23_lookup_rollback_reason(0,&r)==HMG4V23_UNKNOWN_ROLLBACK_REASON && r==NULL);
  CHECK(strcmp(hmg4v23_rollback_reason_at(0)->name,"FORWARD_MOVE_RESOLVED_NO_EFFECT_AFTER_PRIOR_EFFECT")==0);
  for (i=0;i<4;i++) { CHECK(hmg4v23_direction_at(i)->direction==i+1); CHECK(hmg4v23_lookup_direction((uint32_t)i+1,&x)==HMG4V23_OK); }
  CHECK(hmg4v23_lookup_direction(5,&x)==HMG4V23_UNKNOWN_DIRECTION && x==NULL);
  x=hmg4v23_direction_at(0); CHECK(x->source_role==1&&x->destination_role==3&&strcmp(x->name,"LIVE_TO_PREIMAGE_CUSTODY")==0);
  x=hmg4v23_direction_at(2); CHECK(x->source_role==1&&x->destination_role==4&&x->requires_prior_direction==2);
}

static void poll_case(const hmg4v23_poll_symbols *s,hmg4v23_poll_endpoint e,int deadline,int ret,int err,uint16_t events,hmg4v23_poll_decision expected) {
  hmg4v23_poll_decision actual=0; CHECK(hmg4v23_poll_decide(s,e,deadline,ret,err,events,&actual)==HMG4V23_OK); CHECK(actual==expected);
}

static void test_poll_matrix(void) {
  hmg4v23_poll_symbols s={1,4,8,16,32,4}; hmg4v23_poll_decision d;
  poll_case(&s,1,1,1,0,UINT16_MAX,HMG4V23_POLL_DEADLINE);
  poll_case(&s,1,0,-1,4,0,HMG4V23_POLL_AGAIN); poll_case(&s,1,0,0,0,0,HMG4V23_POLL_AGAIN);
  poll_case(&s,1,0,-1,5,0,HMG4V23_POLL_TRANSPORT_ERROR); poll_case(&s,1,0,2,0,1,HMG4V23_POLL_TRANSPORT_ERROR);
  poll_case(&s,1,0,1,0,32,HMG4V23_POLL_TRANSPORT_ERROR); poll_case(&s,1,0,1,0,8,HMG4V23_POLL_TRANSPORT_ERROR);
  poll_case(&s,1,0,1,0,1,HMG4V23_POLL_REQUEST_RETRY_READ); poll_case(&s,1,0,1,0,16,HMG4V23_POLL_REQUEST_EOF_READ);
  poll_case(&s,1,0,1,0,17,HMG4V23_POLL_REQUEST_DRAIN_READ); poll_case(&s,1,0,1,0,0,HMG4V23_POLL_TRANSPORT_ERROR);
  poll_case(&s,2,1,0,0,0,HMG4V23_POLL_DEADLINE); poll_case(&s,2,0,-1,4,0,HMG4V23_POLL_AGAIN);
  poll_case(&s,2,0,0,0,0,HMG4V23_POLL_AGAIN); poll_case(&s,2,0,-1,5,0,HMG4V23_POLL_TRANSPORT_ERROR);
  poll_case(&s,2,0,3,0,4,HMG4V23_POLL_TRANSPORT_ERROR); poll_case(&s,2,0,1,0,32,HMG4V23_POLL_TRANSPORT_ERROR);
  poll_case(&s,2,0,1,0,8,HMG4V23_POLL_TRANSPORT_ERROR); poll_case(&s,2,0,1,0,20,HMG4V23_POLL_TRANSPORT_ERROR);
  poll_case(&s,2,0,1,0,4,HMG4V23_POLL_RESPONSE_RETRY_WRITE); poll_case(&s,2,0,1,0,0,HMG4V23_POLL_TRANSPORT_ERROR);
  poll_case(&s,1,0,0,0,1,HMG4V23_POLL_TRANSPORT_ERROR); poll_case(&s,1,0,1,0,2,HMG4V23_POLL_TRANSPORT_ERROR);
  poll_case(&s,1,0,1,0,4,HMG4V23_POLL_TRANSPORT_ERROR); poll_case(&s,2,0,1,0,1,HMG4V23_POLL_TRANSPORT_ERROR);
  s.pollout=1; CHECK(hmg4v23_poll_decide(&s,1,0,0,0,0,&d)==HMG4V23_BAD_POLL_SYMBOLS);
  CHECK(hmg4v23_poll_decide(NULL,1,0,0,0,0,&d)==HMG4V23_NULL_ARGUMENT);
  s.pollout=4; CHECK(hmg4v23_poll_decide(&s,(hmg4v23_poll_endpoint)3,0,0,0,0,&d)==HMG4V23_BAD_POLL_ENDPOINT);
}

int main(void) {
  test_identity_and_arithmetic(); test_authority_envelope(); test_tlv_and_xattr_limits();
  test_registries(); test_poll_matrix();
  printf("contract-core assertions=%u\n",assertions);
  return 0;
}
