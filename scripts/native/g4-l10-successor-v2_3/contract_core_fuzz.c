#include "contract_core.h"

#include <CommonCrypto/CommonDigest.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static uint64_t state = UINT64_C(0xbf0abed59f8db5be);
static uint32_t next_u32(void) {
  state ^= state << 13; state ^= state >> 7; state ^= state << 17;
  return (uint32_t)(state >> 16);
}

static void put_u32(uint8_t *p,uint32_t v){p[0]=(uint8_t)(v>>24);p[1]=(uint8_t)(v>>16);p[2]=(uint8_t)(v>>8);p[3]=(uint8_t)v;}
static void put_u64(uint8_t *p,uint64_t v){put_u32(p,(uint32_t)(v>>32));put_u32(p+4,(uint32_t)v);}

int main(void) {
  uint8_t bytes[320]; size_t iteration, i; hmg4v23_authority_envelope envelope;
  hmg4v23_poll_symbols symbols={1,4,8,16,32,4}; hmg4v23_poll_decision decision;
  for (iteration=0; iteration<300000; ++iteration) {
    size_t length=(size_t)(next_u32()%sizeof(bytes));
    for (i=0;i<length;i++) bytes[i]=(uint8_t)next_u32();
    if ((iteration%17)==0) {
      static const uint8_t magic[8]={'H','M','G','4','P','2',0,0};
      size_t payload=length>=56?length-56:0;
      if (length<56) length=56;
      memcpy(bytes,magic,8);put_u32(bytes+8,2);put_u32(bytes+12,1);put_u64(bytes+16,payload);
      CC_SHA256(bytes+56,(CC_LONG)payload,bytes+24);
    }
    (void)hmg4v23_validate_authority_envelope((hmg4v23_span){bytes,length},&envelope);
    (void)hmg4v23_tlv_type_site_is_legal((uint8_t)next_u32(),(uint16_t)next_u32());
    (void)hmg4v23_poll_decide(&symbols,(next_u32()&1)?HMG4V23_POLL_ENDPOINT_REQUEST:HMG4V23_POLL_ENDPOINT_RESPONSE,
      (int)(next_u32()&1),(int)(next_u32()%6)-2,(int)(next_u32()%8),(uint16_t)next_u32(),&decision);
  }
  puts("contract-core fuzz cases=300000");
  return 0;
}
