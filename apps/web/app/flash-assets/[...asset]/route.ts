import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {notFound} from 'next/navigation';
import {getWorkspaceRoot} from '@/lib/catalog';
const types: Record<string, string> = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.json': 'application/json'};
export async function GET(_request: Request, {params}: {params: Promise<{asset: string[]}>}) {const {asset} = await params, root = path.resolve(getWorkspaceRoot(), 'public/flash-assets'), target = path.resolve(root, ...asset); if (!target.startsWith(`${root}${path.sep}`)) notFound(); try {if (!(await stat(target)).isFile()) notFound(); return new Response(await readFile(target), {headers: {'Content-Type': types[path.extname(target).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable'}});} catch {notFound();}}
