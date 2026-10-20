import {clerkMiddleware} from '@clerk/nextjs/server';
import type {NextFetchEvent, NextRequest} from 'next/server';

export function createClerkAwareProxy(
  handler: (request: NextRequest) => Promise<Response>,
) {
  const middleware = clerkMiddleware((_auth, request) => handler(request));
  return async (request: NextRequest, event: NextFetchEvent) => middleware(request, event);
}
