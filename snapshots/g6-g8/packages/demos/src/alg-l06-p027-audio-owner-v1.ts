/** The P025 owner already has independent main/SA reservations, pending-start
 * cancellation, explicit Return, and awaited SA retirement. P027 supplies its
 * own one-run source clock and separate source-bound SA behind that protocol. */
export {P025AudioOwnerV1 as P027AudioOwnerV1} from './alg-l06-p025-audio-owner-v1';
export type {P025MainAudio as P027MainAudio,
 P025SeparateSpanishAudio as P027SeparateSpanishAudio}
 from './alg-l06-p025-audio-owner-v1';
