import {readFile} from 'node:fs/promises';
import {notFound} from 'next/navigation';
import {findAnimation, resolveCatalogSource} from '@/lib/catalog';
import {isLocalReferenceDiagnosticRequestAllowed} from '@/lib/local-reference-diagnostic-access';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, {params}: {params: Promise<{animationId: string}>}) {if (!isLocalReferenceDiagnosticRequestAllowed({headers: request.headers, url: request.url})) notFound(); const {animationId} = await params, animation = findAnimation(animationId), source = animation && resolveCatalogSource(animation); if (!animation || !source) notFound(); return new Response(await readFile(source), {headers: {'Content-Type': 'application/x-shockwave-flash', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; sandbox", 'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex', 'X-Helpmath-Local-Reference-Diagnostic': 'forensic-only'}});}
