'use client';
import {createHfrAnimationModule} from '../hfr/module';
import {P010_META} from '../hfr/nms-l11-p010-meta';
import page from '../hfr-pages/shared-nms002-l11-p010';
// Native practice surface is renderer-owned. Full source ink remains Canvas until separately qualified.
export default createHfrAnimationModule(P010_META,page);
