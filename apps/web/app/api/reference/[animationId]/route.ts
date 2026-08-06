import {readFile} from 'node:fs/promises';
import {notFound} from 'next/navigation';
import {findAnimation, resolveCatalogSource} from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, {params}: {params: Promise<{animationId: string}>}) {if (process.env.NODE_ENV === 'production') notFound(); const {animationId} = await params, animation = findAnimation(animationId), source = animation && resolveCatalogSource(animation); if (!animation || !source) notFound(); return new Response(await readFile(source), {headers: {'Content-Type': 'application/x-shockwave-flash', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; sandbox"}});}
