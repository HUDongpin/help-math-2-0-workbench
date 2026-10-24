/** The P025 ownership protocol is already exercised with adversarial pending
 * starts, late SA retirement, Replay, and explicit Return. P026's page clock
 * supplies two independent main ranges behind the same main-audio interface. */
export {P025AudioOwnerV1 as P026AudioOwnerV1} from './alg-l06-p025-audio-owner-v1';
export type {P025MainAudio as P026MainAudio,
  P025SeparateSpanishAudio as P026SeparateSpanishAudio}
  from './alg-l06-p025-audio-owner-v1';
