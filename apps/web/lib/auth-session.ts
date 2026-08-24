/**
 * Provider identity is authentication evidence only. Application roles,
 * tenant membership, and guardian relationships are resolved separately by
 * the server-side authorization data layer.
 */
export type ProviderSession = Readonly<{
  provider: 'clerk' | 'supabase';
  providerSubject: string;
  sessionId: string;
}>;

export type AuthSession = Readonly<
  | {status: 'disabled'}
  | {status: 'signed-out'}
  | (ProviderSession & {status: 'signed-in'})
>;

export type PublicAuthStatus = AuthSession['status'];
