#!/usr/bin/env node

import http from 'node:http';

const host = '127.0.0.1';
const port = Number.parseInt(process.env.FAMILY_LOCAL_GATEWAY_PORT ?? '54321', 10);
const authOrigin = new URL(
  process.env.FAMILY_LOCAL_AUTH_ORIGIN ?? 'http://127.0.0.1:9999',
);
const restOrigin = new URL(
  process.env.FAMILY_LOCAL_REST_ORIGIN ?? 'http://127.0.0.1:3001',
);
const maximumBodyBytes = 1_048_576;

if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
  throw new Error('FAMILY_LOCAL_GATEWAY_PORT must be an unprivileged port.');
}
for (const origin of [authOrigin, restOrigin]) {
  if (
    origin.protocol !== 'http:'
    || origin.hostname !== host
    || origin.pathname !== '/'
    || origin.username
    || origin.password
  ) throw new Error('Local upstreams must be credential-free loopback origins.');
}

function route(url) {
  if (url.pathname === '/auth/v1' || url.pathname.startsWith('/auth/v1/')) {
    return {
      origin: authOrigin,
      pathname: url.pathname.slice('/auth/v1'.length) || '/',
    };
  }
  if (url.pathname === '/rest/v1' || url.pathname.startsWith('/rest/v1/')) {
    return {
      origin: restOrigin,
      pathname: url.pathname.slice('/rest/v1'.length) || '/',
    };
  }
  return null;
}

async function bodyFor(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > maximumBodyBytes) throw new RangeError('request too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const server = http.createServer(async (request, response) => {
  try {
    const incoming = new URL(request.url ?? '/', `http://${host}:${port}`);
    if (incoming.pathname === '/health') {
      response.writeHead(204, {'Cache-Control': 'no-store'}).end();
      return;
    }
    const target = route(incoming);
    if (!target) {
      response.writeHead(404, {'Cache-Control': 'no-store'}).end();
      return;
    }

    const upstream = new URL(target.pathname, target.origin);
    upstream.search = incoming.search;
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (
        value === undefined
        || ['connection', 'content-length', 'host'].includes(name.toLowerCase())
      ) continue;
      if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
      else headers.set(name, value);
    }
    headers.set('x-forwarded-host', `${host}:${port}`);
    headers.set('x-forwarded-proto', 'http');

    const upstreamResponse = await fetch(upstream, {
      body: await bodyFor(request),
      headers,
      method: request.method,
      redirect: 'manual',
    });
    const outgoingHeaders = {};
    upstreamResponse.headers.forEach((value, name) => {
      if (!['connection', 'content-encoding', 'transfer-encoding'].includes(name)) {
        outgoingHeaders[name] = value;
      }
    });
    outgoingHeaders['cache-control'] ??= 'private, no-store';
    response.writeHead(upstreamResponse.status, outgoingHeaders);
    if (request.method === 'HEAD' || !upstreamResponse.body) {
      response.end();
      return;
    }
    for await (const chunk of upstreamResponse.body) response.write(chunk);
    response.end();
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 502;
    response.writeHead(status, {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify({code: status === 413 ? 'TOO_LARGE' : 'UPSTREAM_UNAVAILABLE'}));
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Family local Supabase gateway listening on http://${host}:${port}\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
