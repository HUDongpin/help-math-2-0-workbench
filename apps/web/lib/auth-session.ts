export type AuthSession = Readonly<
  | {status: 'disabled'}
  | {status: 'signed-out'}
  | {
      provider: 'clerk';
      providerSubject: string;
      enterpriseIdentity?: Readonly<{
        connectionId: string;
        subject: string;
      }>;
      sessionId: string;
      status: 'signed-in';
    }
>;

export type PublicAuthStatus = AuthSession['status'];
