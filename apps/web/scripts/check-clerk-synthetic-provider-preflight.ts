import {createClerkClient} from '@clerk/backend';
import nextEnv from '@next/env';
import {fileURLToPath} from 'node:url';

import {runClerkSyntheticProviderPreflight} from '../lib/clerk-synthetic-provider-preflight';

const CLERK_BACKEND_API_ORIGIN = 'https://api.clerk.com';
const providerTimeoutMilliseconds = 15_000;
const webRoot = fileURLToPath(new URL('..', import.meta.url));

async function listDomainsWithoutDiagnostics(environment: NodeJS.ProcessEnv) {
  const original = {
    debug: console.debug,
    error: console.error,
    info: console.info,
    log: console.log,
    warn: console.warn,
  };
  let diagnosticObserved = false;
  const redact = () => {
    diagnosticObserved = true;
  };
  console.debug = redact;
  console.error = redact;
  console.info = redact;
  console.log = redact;
  console.warn = redact;
  try {
    const client = createClerkClient({
      apiUrl: CLERK_BACKEND_API_ORIGIN,
      secretKey: environment.CLERK_SECRET_KEY,
      telemetry: {disabled: true},
    });
    let timeout: NodeJS.Timeout | undefined;
    const result = await Promise.race([
      client.domains.list(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error('Provider timeout redacted.')),
          providerTimeoutMilliseconds,
        );
      }),
    ]).finally(() => {
      if (timeout !== undefined) clearTimeout(timeout);
    });
    if (diagnosticObserved) throw new Error('Provider diagnostic redacted.');
    return result;
  } finally {
    console.debug = original.debug;
    console.error = original.error;
    console.info = original.info;
    console.log = original.log;
    console.warn = original.warn;
  }
}

async function main() {
  nextEnv.loadEnvConfig(
    webRoot,
    true,
    {error: () => {}, info: () => {}},
    true,
  );
  const environment = {...process.env};
  return runClerkSyntheticProviderPreflight({
    environment,
    listDomains: () => listDomainsWithoutDiagnostics(environment),
  });
}

void main()
  .catch(() => 'PROVIDER_UNAVAILABLE' as const)
  .then((status) => {
    process.stdout.write(
      `CLERK_SYNTHETIC_PROVIDER_PREFLIGHT=${status}\n`,
      () => process.exit(status === 'READY' ? 0 : 1),
    );
  });
