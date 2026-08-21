import nextEnv from '@next/env';

import {inspectClerkLocalAuthPreflight} from '../lib/clerk-local-auth-preflight';

nextEnv.loadEnvConfig(process.cwd());

const result = inspectClerkLocalAuthPreflight({
  CLERK_LOCAL_AUTH_ENABLED: process.env.CLERK_LOCAL_AUTH_ENABLED,
  CLERK_LOCAL_AUTH_ORIGIN: process.env.CLERK_LOCAL_AUTH_ORIGIN,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  NEXT_PUBLIC_CLERK_KEYLESS_DISABLED:
    process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
});

process.stdout.write(`${JSON.stringify(result)}\n`);
if (!result.ready) process.exitCode = 1;
