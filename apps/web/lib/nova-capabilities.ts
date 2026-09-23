/**
 * The complete Nova capability surface that may cross the Server Component
 * boundary. Provider identity, rollout policy, configuration state, and
 * failure reasons are deliberately absent.
 */
export interface NovaClientCapabilities {
  readonly schemaVersion: 1;
  readonly text: boolean;
  readonly currentLessonFrame: boolean;
  readonly speechToDraft: boolean;
  /** Present only after the server verifies a signed-in class member. */
  readonly classId?: string;
}

export const EMPTY_NOVA_CLIENT_CAPABILITIES: NovaClientCapabilities =
  Object.freeze({
    schemaVersion: 1,
    text: false,
    currentLessonFrame: false,
    speechToDraft: false,
  });
