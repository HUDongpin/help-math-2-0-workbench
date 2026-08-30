import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {notFound} from 'next/navigation';
import {getWorkspaceRoot} from '@/lib/catalog';
import {isLocalReferenceDiagnosticRequestAllowed} from '@/lib/local-reference-diagnostic-access';
export const dynamic = 'force-dynamic';
const types: Record<string, string> = {'.js': 'text/javascript; charset=utf-8', '.map': 'application/json', '.wasm': 'application/wasm'};
export async function GET(request: Request, {params}: {params: Promise<{asset: string[]}>}) {if (!isLocalReferenceDiagnosticRequestAllowed({headers: request.headers, url: request.url})) notFound(); const {asset} = await params; if (asset.length !== 1 || !/^[a-zA-Z0-9._-]+$/.test(asset[0]!)) notFound(); const root = path.join(getWorkspaceRoot(), 'node_modules/@ruffle-rs/ruffle'), target = path.join(root, asset[0]!); try {if (!(await stat(target)).isFile()) notFound(); return new Response(await readFile(target), {headers: {'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex', 'X-Helpmath-Local-Reference-Diagnostic': 'forensic-only'}});} catch {notFound();}}
