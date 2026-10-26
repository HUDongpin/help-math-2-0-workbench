import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {p056AssetManifest} from '@/lib/nms-l02-p056-assets.server';
import {nmsL02P055AdmissionDescriptor} from '@/lib/nms-l02-successor-admission.server';
import {nmsL02P056CandidateDescriptorV1} from '@/lib/nms-l02-p056-candidate-descriptor-v1';
import {NMS_L02_P056_ADMISSION} from '@/lib/nms-l02-p056-admission-activation';
import {nmsL02P056AdmissionDescriptor} from '@/lib/nms-l02-p056-admission.server';
import '@/components/nms-l02-p056-host-v1.css';
import {P056SemanticView} from '../../../../../../../packages/demos/src/nms-l02-p056-semantic-view-v1';
import '../../../../../../../packages/demos/src/nms-l02-p056-semantic-view-v1.css';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SHA256 = 'a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be';

function sourceMatches(): boolean {
  try {
    const root = lstatSync(SOURCE_ROOT);
    const swfPath = join(SOURCE_ROOT, 'G6-G8-shared/NMS002/L2/TS/L2TS03.swf');
    const swf = lstatSync(swfPath);
    return root.isDirectory() && !root.isSymbolicLink() &&
      swf.isFile() && !swf.isSymbolicLink() &&
      createHash('sha256').update(readFileSync(swfPath)).digest('hex') === SOURCE_SHA256;
  } catch {
    return false;
  }
}

const loadProductHost=()=>process.env.NODE_ENV==='production'?import('@/lib/nms-l02-p056-production-stub'):
  import('@/components/g678-nms-l02-p056-candidate-lesson-v1.generated');
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'P056 — local semantic candidate',
  robots: {index: false, follow: false, noarchive: true}};

export default async function Page({params, searchParams}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      !isG678LocalPreviewRequestHeaders(await headers()) || !sourceMatches()) notFound();
  const query = await searchParams;
  if (Object.keys(query).some(key => key !== 'frame')) notFound();
  if (query.frame === undefined) {
    try {
      p056AssetManifest();
      const admission=NMS_L02_P056_ADMISSION?nmsL02P056AdmissionDescriptor():null;
      const descriptor=admission?.descriptor??nmsL02P056CandidateDescriptorV1(nmsL02P055AdmissionDescriptor().descriptor);
      const registered=admission?.registered??false;
      const {G678NmsL02P056CandidateLessonV1}=await loadProductHost();
      return <main id="main-content" data-p056-current-js={registered?'registered':'unregistered-probe'}>
        <G678NmsL02P056CandidateLessonV1 descriptor={descriptor} initialPlacementId="shared-nms002-l02-p056"
          locale={locale} audioEnabled={false} candidateMode hostPresentation="modern-wide" reviewerMode
          releasePublished={false} strictCompleteMemberCount={0}
          unregisteredCandidateIds={registered?[]:['shared-nms002-l02-p056']}/>
        <p role="status">{registered?(locale==='es'?'Current-JS local registrado; aceptación y publicación pendientes.':
          'Local Current-JS registered; acceptance and publication remain pending.'):
          (locale==='es'?'Candidato local sin registrar; aceptación y publicación pendientes.':
          'Unregistered local candidate; acceptance and publication remain pending.')}</p>
        <p>{locale==='es'?'El glosario usa provisionalmente el banco L1 del host identificado; los bancos L2 y la consulta histórica no están verificados.':
          'The glossary provisionally uses the identified host’s L1 bank; L2 banks and historical lookup remain unverified.'}</p>
      </main>;
    } catch {notFound();}
  }
  const raw = query.frame;
  if (Array.isArray(raw) || !/^(?:[1-9]|[1-9]\d|1\d\d|2[0-2]\d|23[0-4])$/u.test(raw)) notFound();
  return <main id="main-content"><P056SemanticView teachingFrame={Number(raw)}
    uiLanguage={locale} /></main>;
}
