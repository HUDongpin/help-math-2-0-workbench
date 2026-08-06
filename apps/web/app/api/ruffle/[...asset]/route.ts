import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {notFound} from 'next/navigation';
import {getWorkspaceRoot} from '@/lib/catalog';
export const dynamic = 'force-dynamic';
const types: Record<string, string> = {'.js': 'text/javascript; charset=utf-8', '.map': 'application/json', '.wasm': 'application/wasm'};
export async function GET(_request: Request, {params}: {params: Promise<{asset: string[]}>}) {if (process.env.NODE_ENV === 'production') notFound(); const {asset} = await params; if (asset.length !== 1 || !/^[a-zA-Z0-9._-]+$/.test(asset[0]!)) notFound(); const root = path.join(getWorkspaceRoot(), 'node_modules/@ruffle-rs/ruffle'), target = path.join(root, asset[0]!); try {if (!(await stat(target)).isFile()) notFound(); return new Response(await readFile(target), {headers: {'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store'}});} catch {notFound();}}
