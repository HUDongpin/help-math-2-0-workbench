import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";

import {loadAnimationModule} from "../src/animation-registry";
import {getG5L4PageAudioCandidate} from "../src/g5-l4-audio.generated";
import in002, {
  COURSE_G05_L04_IN_002_MOVIE,
  COURSE_G05_L04_IN_002_RUNTIME,
  COURSE_G05_L04_IN_002_SOURCE,
  COURSE_G05_L04_IN_002_SOURCE_CONTRACT,
  buildCourseG05L04In002CaptureAttributes,
  getCourseG05L04In002FrameState,
  normalizeCourseG05L04In002Frame,
} from "../src/modules/course-g05-l04-in-002";
import in007, {
  COURSE_G05_L04_IN_007_MOVIE,
  COURSE_G05_L04_IN_007_RUNTIME,
  COURSE_G05_L04_IN_007_SOURCE,
  COURSE_G05_L04_IN_007_SOURCE_CONTRACT,
  buildCourseG05L04In007CaptureAttributes,
  getCourseG05L04In007FrameState,
  normalizeCourseG05L04In007Frame,
} from "../src/modules/course-g05-l04-in-007";
import in009, {
  COURSE_G05_L04_IN_009_MOVIE,
  COURSE_G05_L04_IN_009_RUNTIME,
  COURSE_G05_L04_IN_009_SOURCE,
  COURSE_G05_L04_IN_009_SOURCE_CONTRACT,
  buildCourseG05L04In009CaptureAttributes,
  getCourseG05L04In009FrameState,
  normalizeCourseG05L04In009Frame,
} from "../src/modules/course-g05-l04-in-009";
import in015, {
  COURSE_G05_L04_IN_015_MOVIE,
  COURSE_G05_L04_IN_015_RUNTIME,
  COURSE_G05_L04_IN_015_SOURCE,
  COURSE_G05_L04_IN_015_SOURCE_CONTRACT,
  buildCourseG05L04In015CaptureAttributes,
  getCourseG05L04In015FrameState,
  normalizeCourseG05L04In015Frame,
} from "../src/modules/course-g05-l04-in-015";
import rw003, {
  COURSE_G05_L04_RW_003_MOVIE,
  COURSE_G05_L04_RW_003_RUNTIME,
  COURSE_G05_L04_RW_003_SOURCE,
  COURSE_G05_L04_RW_003_SOURCE_CONTRACT,
  buildCourseG05L04Rw003CaptureAttributes,
  getCourseG05L04Rw003FrameState,
  normalizeCourseG05L04Rw003Frame,
} from "../src/modules/course-g05-l04-rw-003";
import rw004, {
  COURSE_G05_L04_RW_004_MOVIE,
  COURSE_G05_L04_RW_004_RUNTIME,
  COURSE_G05_L04_RW_004_SOURCE,
  COURSE_G05_L04_RW_004_SOURCE_CONTRACT,
  buildCourseG05L04Rw004CaptureAttributes,
  getCourseG05L04Rw004FrameState,
  normalizeCourseG05L04Rw004Frame,
} from "../src/modules/course-g05-l04-rw-004";
import ts002, {
  COURSE_G05_L04_TS_002_MOVIE,
  COURSE_G05_L04_TS_002_RUNTIME,
  COURSE_G05_L04_TS_002_SOURCE,
  COURSE_G05_L04_TS_002_SOURCE_CONTRACT,
  buildCourseG05L04Ts002CaptureAttributes,
  getCourseG05L04Ts002FrameState,
  normalizeCourseG05L04Ts002Frame,
} from "../src/modules/course-g05-l04-ts-002";
import ts005, {
  COURSE_G05_L04_TS_005_MOVIE,
  COURSE_G05_L04_TS_005_RUNTIME,
  COURSE_G05_L04_TS_005_SOURCE,
  COURSE_G05_L04_TS_005_SOURCE_CONTRACT,
  buildCourseG05L04Ts005CaptureAttributes,
  getCourseG05L04Ts005FrameState,
  normalizeCourseG05L04Ts005Frame,
} from "../src/modules/course-g05-l04-ts-005";
import ts006, {
  COURSE_G05_L04_TS_006_MOVIE,
  COURSE_G05_L04_TS_006_RUNTIME,
  COURSE_G05_L04_TS_006_SOURCE,
  COURSE_G05_L04_TS_006_SOURCE_CONTRACT,
  buildCourseG05L04Ts006CaptureAttributes,
  getCourseG05L04Ts006FrameState,
  normalizeCourseG05L04Ts006Frame,
} from "../src/modules/course-g05-l04-ts-006";
import vb002, {
  COURSE_G05_L04_VB_002_MOVIE,
  COURSE_G05_L04_VB_002_RUNTIME,
  COURSE_G05_L04_VB_002_SOURCE,
  COURSE_G05_L04_VB_002_SOURCE_CONTRACT,
  buildCourseG05L04Vb002CaptureAttributes,
  getCourseG05L04Vb002FrameState,
  normalizeCourseG05L04Vb002Frame,
} from "../src/modules/course-g05-l04-vb-002";
import vb005, {
  COURSE_G05_L04_VB_005_MOVIE,
  COURSE_G05_L04_VB_005_RUNTIME,
  COURSE_G05_L04_VB_005_SOURCE,
  COURSE_G05_L04_VB_005_SOURCE_CONTRACT,
  buildCourseG05L04Vb005CaptureAttributes,
  getCourseG05L04Vb005FrameState,
  normalizeCourseG05L04Vb005Frame,
} from "../src/modules/course-g05-l04-vb-005";
import vb006, {
  COURSE_G05_L04_VB_006_MOVIE,
  COURSE_G05_L04_VB_006_RUNTIME,
  COURSE_G05_L04_VB_006_SOURCE,
  COURSE_G05_L04_VB_006_SOURCE_CONTRACT,
  buildCourseG05L04Vb006CaptureAttributes,
  getCourseG05L04Vb006FrameState,
  normalizeCourseG05L04Vb006Frame,
} from "../src/modules/course-g05-l04-vb-006";
import vb008, {
  COURSE_G05_L04_VB_008_MOVIE,
  COURSE_G05_L04_VB_008_RUNTIME,
  COURSE_G05_L04_VB_008_SOURCE,
  COURSE_G05_L04_VB_008_SOURCE_CONTRACT,
  buildCourseG05L04Vb008CaptureAttributes,
  getCourseG05L04Vb008FrameState,
  normalizeCourseG05L04Vb008Frame,
} from "../src/modules/course-g05-l04-vb-008";
import vb009, {
  COURSE_G05_L04_VB_009_MOVIE,
  COURSE_G05_L04_VB_009_RUNTIME,
  COURSE_G05_L04_VB_009_SOURCE,
  COURSE_G05_L04_VB_009_SOURCE_CONTRACT,
  buildCourseG05L04Vb009CaptureAttributes,
  getCourseG05L04Vb009FrameState,
  normalizeCourseG05L04Vb009Frame,
} from "../src/modules/course-g05-l04-vb-009";
import in020, {
  COURSE_G05_L04_IN_020_MOVIE,
  COURSE_G05_L04_IN_020_RUNTIME,
  COURSE_G05_L04_IN_020_SOURCE,
  COURSE_G05_L04_IN_020_SOURCE_CONTRACT,
  buildCourseG05L04In020CaptureAttributes,
  getCourseG05L04In020FrameState,
  normalizeCourseG05L04In020Frame,
} from "../src/modules/course-g05-l04-in-020";
import in012, {
  COURSE_G05_L04_IN_012_MOVIE,
  COURSE_G05_L04_IN_012_RUNTIME,
  COURSE_G05_L04_IN_012_SOURCE,
  COURSE_G05_L04_IN_012_SOURCE_CONTRACT,
  buildCourseG05L04In012CaptureAttributes,
  getCourseG05L04In012FrameState,
  normalizeCourseG05L04In012Frame,
} from "../src/modules/course-g05-l04-in-012";
import ts003, {
  COURSE_G05_L04_TS_003_MOVIE,
  COURSE_G05_L04_TS_003_RUNTIME,
  COURSE_G05_L04_TS_003_SOURCE,
  COURSE_G05_L04_TS_003_SOURCE_CONTRACT,
  buildCourseG05L04Ts003CaptureAttributes,
  getCourseG05L04Ts003FrameState,
  normalizeCourseG05L04Ts003Frame,
} from "../src/modules/course-g05-l04-ts-003";
import ts004, {
  COURSE_G05_L04_TS_004_MOVIE,
  COURSE_G05_L04_TS_004_RUNTIME,
  COURSE_G05_L04_TS_004_SOURCE,
  COURSE_G05_L04_TS_004_SOURCE_CONTRACT,
  buildCourseG05L04Ts004CaptureAttributes,
  getCourseG05L04Ts004FrameState,
  normalizeCourseG05L04Ts004Frame,
} from "../src/modules/course-g05-l04-ts-004";
import {matchPrototype} from "../src/prototype-manifest";
import {
  COURSE_G05_L04_IN_002_AUTHORITY,
  COURSE_G05_L04_IN_002_CONFIG,
} from "../src/timelines/course-g05-l04-in-002";
import {
  COURSE_G05_L04_IN_007_AUTHORITY,
  COURSE_G05_L04_IN_007_CONFIG,
} from "../src/timelines/course-g05-l04-in-007";
import {
  COURSE_G05_L04_IN_009_AUTHORITY,
  COURSE_G05_L04_IN_009_CONFIG,
} from "../src/timelines/course-g05-l04-in-009";
import {
  COURSE_G05_L04_IN_015_AUTHORITY,
  COURSE_G05_L04_IN_015_CONFIG,
} from "../src/timelines/course-g05-l04-in-015";
import {
  COURSE_G05_L04_RW_003_AUTHORITY,
  COURSE_G05_L04_RW_003_CONFIG,
} from "../src/timelines/course-g05-l04-rw-003";
import {
  COURSE_G05_L04_RW_004_AUTHORITY,
  COURSE_G05_L04_RW_004_CONFIG,
} from "../src/timelines/course-g05-l04-rw-004";
import {
  COURSE_G05_L04_TS_002_AUTHORITY,
  COURSE_G05_L04_TS_002_CONFIG,
} from "../src/timelines/course-g05-l04-ts-002";
import {
  COURSE_G05_L04_TS_005_AUTHORITY,
  COURSE_G05_L04_TS_005_CONFIG,
} from "../src/timelines/course-g05-l04-ts-005";
import {
  COURSE_G05_L04_TS_006_AUTHORITY,
  COURSE_G05_L04_TS_006_CONFIG,
} from "../src/timelines/course-g05-l04-ts-006";
import {
  COURSE_G05_L04_VB_002_AUTHORITY,
  COURSE_G05_L04_VB_002_CONFIG,
} from "../src/timelines/course-g05-l04-vb-002";
import {
  COURSE_G05_L04_VB_005_AUTHORITY,
  COURSE_G05_L04_VB_005_CONFIG,
} from "../src/timelines/course-g05-l04-vb-005";
import {
  COURSE_G05_L04_VB_006_AUTHORITY,
  COURSE_G05_L04_VB_006_CONFIG,
} from "../src/timelines/course-g05-l04-vb-006";
import {
  COURSE_G05_L04_VB_008_AUTHORITY,
  COURSE_G05_L04_VB_008_CONFIG,
} from "../src/timelines/course-g05-l04-vb-008";
import {
  COURSE_G05_L04_VB_009_AUTHORITY,
  COURSE_G05_L04_VB_009_CONFIG,
} from "../src/timelines/course-g05-l04-vb-009";
import {
  COURSE_G05_L04_IN_020_AUTHORITY,
  COURSE_G05_L04_IN_020_CONFIG,
} from "../src/timelines/course-g05-l04-in-020";
import {
  COURSE_G05_L04_IN_012_AUTHORITY,
  COURSE_G05_L04_IN_012_CONFIG,
} from "../src/timelines/course-g05-l04-in-012";
import {
  COURSE_G05_L04_TS_003_AUTHORITY,
  COURSE_G05_L04_TS_003_CONFIG,
} from "../src/timelines/course-g05-l04-ts-003";
import {
  COURSE_G05_L04_TS_004_AUTHORITY,
  COURSE_G05_L04_TS_004_CONFIG,
} from "../src/timelines/course-g05-l04-ts-004";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const candidates = [
  {
    id: "course-g05-l04-vb-002",
    module: vb002,
    movie: COURSE_G05_L04_VB_002_MOVIE,
    runtime: COURSE_G05_L04_VB_002_RUNTIME,
    source: COURSE_G05_L04_VB_002_SOURCE,
    sourceContract: COURSE_G05_L04_VB_002_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_VB_002_AUTHORITY,
    config: COURSE_G05_L04_VB_002_CONFIG,
    frameDomain: "sprite-49",
    frameCount: 186,
    marker: "number-line-vocabulary-source-drawing",
    getState: getCourseG05L04Vb002FrameState,
    normalize: normalizeCourseG05L04Vb002Frame,
    attributes: buildCourseG05L04Vb002CaptureAttributes,
  },
  {
    id: "course-g05-l04-vb-005",
    module: vb005,
    movie: COURSE_G05_L04_VB_005_MOVIE,
    runtime: COURSE_G05_L04_VB_005_RUNTIME,
    source: COURSE_G05_L04_VB_005_SOURCE,
    sourceContract: COURSE_G05_L04_VB_005_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_VB_005_AUTHORITY,
    config: COURSE_G05_L04_VB_005_CONFIG,
    frameDomain: "sprite-46",
    frameCount: 264,
    marker: "zero-vocabulary-source-drawing",
    getState: getCourseG05L04Vb005FrameState,
    normalize: normalizeCourseG05L04Vb005Frame,
    attributes: buildCourseG05L04Vb005CaptureAttributes,
  },
  {
    id: "course-g05-l04-vb-006",
    module: vb006,
    movie: COURSE_G05_L04_VB_006_MOVIE,
    runtime: COURSE_G05_L04_VB_006_RUNTIME,
    source: COURSE_G05_L04_VB_006_SOURCE,
    sourceContract: COURSE_G05_L04_VB_006_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_VB_006_AUTHORITY,
    config: COURSE_G05_L04_VB_006_CONFIG,
    frameDomain: "sprite-42",
    frameCount: 166,
    marker: "opposites-vocabulary-source-drawing",
    getState: getCourseG05L04Vb006FrameState,
    normalize: normalizeCourseG05L04Vb006Frame,
    attributes: buildCourseG05L04Vb006CaptureAttributes,
  },
  {
    id: "course-g05-l04-in-009",
    module: in009,
    movie: COURSE_G05_L04_IN_009_MOVIE,
    runtime: COURSE_G05_L04_IN_009_RUNTIME,
    source: COURSE_G05_L04_IN_009_SOURCE,
    sourceContract: COURSE_G05_L04_IN_009_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_IN_009_AUTHORITY,
    config: COURSE_G05_L04_IN_009_CONFIG,
    frameDomain: "sprite-29",
    frameCount: 504,
    marker: "fractions-number-line-source-drawing",
    getState: getCourseG05L04In009FrameState,
    normalize: normalizeCourseG05L04In009Frame,
    attributes: buildCourseG05L04In009CaptureAttributes,
  },
  {
    id: "course-g05-l04-in-015",
    module: in015,
    movie: COURSE_G05_L04_IN_015_MOVIE,
    runtime: COURSE_G05_L04_IN_015_RUNTIME,
    source: COURSE_G05_L04_IN_015_SOURCE,
    sourceContract: COURSE_G05_L04_IN_015_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_IN_015_AUTHORITY,
    config: COURSE_G05_L04_IN_015_CONFIG,
    frameDomain: "sprite-101",
    frameCount: 601,
    marker: "signed-integers-number-line-source-drawing",
    getState: getCourseG05L04In015FrameState,
    normalize: normalizeCourseG05L04In015Frame,
    attributes: buildCourseG05L04In015CaptureAttributes,
  },
  {
    id: "course-g05-l04-ts-006",
    module: ts006,
    movie: COURSE_G05_L04_TS_006_MOVIE,
    runtime: COURSE_G05_L04_TS_006_RUNTIME,
    source: COURSE_G05_L04_TS_006_SOURCE,
    sourceContract: COURSE_G05_L04_TS_006_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_TS_006_AUTHORITY,
    config: COURSE_G05_L04_TS_006_CONFIG,
    frameDomain: "sprite-12",
    frameCount: 245,
    marker: "four-step-plan-page-6-source-drawing",
    getState: getCourseG05L04Ts006FrameState,
    normalize: normalizeCourseG05L04Ts006Frame,
    attributes: buildCourseG05L04Ts006CaptureAttributes,
  },
  {
    id: "course-g05-l04-ts-002",
    module: ts002,
    movie: COURSE_G05_L04_TS_002_MOVIE,
    runtime: COURSE_G05_L04_TS_002_RUNTIME,
    source: COURSE_G05_L04_TS_002_SOURCE,
    sourceContract: COURSE_G05_L04_TS_002_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_TS_002_AUTHORITY,
    config: COURSE_G05_L04_TS_002_CONFIG,
    frameDomain: "sprite-28",
    frameCount: 324,
    marker: "four-step-plan-page-2-source-drawing",
    getState: getCourseG05L04Ts002FrameState,
    normalize: normalizeCourseG05L04Ts002Frame,
    attributes: buildCourseG05L04Ts002CaptureAttributes,
  },
  {
    id: "course-g05-l04-ts-005",
    module: ts005,
    movie: COURSE_G05_L04_TS_005_MOVIE,
    runtime: COURSE_G05_L04_TS_005_RUNTIME,
    source: COURSE_G05_L04_TS_005_SOURCE,
    sourceContract: COURSE_G05_L04_TS_005_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_TS_005_AUTHORITY,
    config: COURSE_G05_L04_TS_005_CONFIG,
    frameDomain: "sprite-30",
    frameCount: 234,
    marker: "four-step-plan-page-5-source-drawing",
    getState: getCourseG05L04Ts005FrameState,
    normalize: normalizeCourseG05L04Ts005Frame,
    attributes: buildCourseG05L04Ts005CaptureAttributes,
  },
  {
    id: "course-g05-l04-vb-008",
    module: vb008,
    movie: COURSE_G05_L04_VB_008_MOVIE,
    runtime: COURSE_G05_L04_VB_008_RUNTIME,
    source: COURSE_G05_L04_VB_008_SOURCE,
    sourceContract: COURSE_G05_L04_VB_008_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_VB_008_AUTHORITY,
    config: COURSE_G05_L04_VB_008_CONFIG,
    frameDomain: "sprite-50",
    frameCount: 197,
    marker: "positive-integers-source-drawing",
    getState: getCourseG05L04Vb008FrameState,
    normalize: normalizeCourseG05L04Vb008Frame,
    attributes: buildCourseG05L04Vb008CaptureAttributes,
  },
  {
    id: "course-g05-l04-vb-009",
    module: vb009,
    movie: COURSE_G05_L04_VB_009_MOVIE,
    runtime: COURSE_G05_L04_VB_009_RUNTIME,
    source: COURSE_G05_L04_VB_009_SOURCE,
    sourceContract: COURSE_G05_L04_VB_009_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_VB_009_AUTHORITY,
    config: COURSE_G05_L04_VB_009_CONFIG,
    frameDomain: "sprite-51",
    frameCount: 189,
    marker: "negative-integers-source-drawing",
    getState: getCourseG05L04Vb009FrameState,
    normalize: normalizeCourseG05L04Vb009Frame,
    attributes: buildCourseG05L04Vb009CaptureAttributes,
  },
  {
    id: "course-g05-l04-in-020",
    module: in020,
    movie: COURSE_G05_L04_IN_020_MOVIE,
    runtime: COURSE_G05_L04_IN_020_RUNTIME,
    source: COURSE_G05_L04_IN_020_SOURCE,
    sourceContract: COURSE_G05_L04_IN_020_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_IN_020_AUTHORITY,
    config: COURSE_G05_L04_IN_020_CONFIG,
    frameDomain: "sprite-37",
    frameCount: 282,
    marker: "negative-integer-situations-source-drawing",
    getState: getCourseG05L04In020FrameState,
    normalize: normalizeCourseG05L04In020Frame,
    attributes: buildCourseG05L04In020CaptureAttributes,
  },
  {
    id: "course-g05-l04-in-012",
    module: in012,
    movie: COURSE_G05_L04_IN_012_MOVIE,
    runtime: COURSE_G05_L04_IN_012_RUNTIME,
    source: COURSE_G05_L04_IN_012_SOURCE,
    sourceContract: COURSE_G05_L04_IN_012_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_IN_012_AUTHORITY,
    config: COURSE_G05_L04_IN_012_CONFIG,
    frameDomain: "sprite-48",
    frameCount: 298,
    marker: "represent-integers-number-line-source-drawing",
    getState: getCourseG05L04In012FrameState,
    normalize: normalizeCourseG05L04In012Frame,
    attributes: buildCourseG05L04In012CaptureAttributes,
  },
  {
    id: "course-g05-l04-ts-003",
    module: ts003,
    movie: COURSE_G05_L04_TS_003_MOVIE,
    runtime: COURSE_G05_L04_TS_003_RUNTIME,
    source: COURSE_G05_L04_TS_003_SOURCE,
    sourceContract: COURSE_G05_L04_TS_003_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_TS_003_AUTHORITY,
    config: COURSE_G05_L04_TS_003_CONFIG,
    frameDomain: "sprite-25",
    frameCount: 227,
    marker: "four-step-plan-page-3-source-drawing",
    getState: getCourseG05L04Ts003FrameState,
    normalize: normalizeCourseG05L04Ts003Frame,
    attributes: buildCourseG05L04Ts003CaptureAttributes,
  },
  {
    id: "course-g05-l04-ts-004",
    module: ts004,
    movie: COURSE_G05_L04_TS_004_MOVIE,
    runtime: COURSE_G05_L04_TS_004_RUNTIME,
    source: COURSE_G05_L04_TS_004_SOURCE,
    sourceContract: COURSE_G05_L04_TS_004_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_TS_004_AUTHORITY,
    config: COURSE_G05_L04_TS_004_CONFIG,
    frameDomain: "sprite-36",
    frameCount: 290,
    marker: "four-step-plan-page-4-source-drawing",
    getState: getCourseG05L04Ts004FrameState,
    normalize: normalizeCourseG05L04Ts004Frame,
    attributes: buildCourseG05L04Ts004CaptureAttributes,
  },
  {
    id: "course-g05-l04-rw-003",
    module: rw003,
    movie: COURSE_G05_L04_RW_003_MOVIE,
    runtime: COURSE_G05_L04_RW_003_RUNTIME,
    source: COURSE_G05_L04_RW_003_SOURCE,
    sourceContract: COURSE_G05_L04_RW_003_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_RW_003_AUTHORITY,
    config: COURSE_G05_L04_RW_003_CONFIG,
    frameDomain: "sprite-535",
    frameCount: 1141,
    marker: "your-world-page-2-source-drawing",
    getState: getCourseG05L04Rw003FrameState,
    normalize: normalizeCourseG05L04Rw003Frame,
    attributes: buildCourseG05L04Rw003CaptureAttributes,
  },
  {
    id: "course-g05-l04-rw-004",
    module: rw004,
    movie: COURSE_G05_L04_RW_004_MOVIE,
    runtime: COURSE_G05_L04_RW_004_RUNTIME,
    source: COURSE_G05_L04_RW_004_SOURCE,
    sourceContract: COURSE_G05_L04_RW_004_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_RW_004_AUTHORITY,
    config: COURSE_G05_L04_RW_004_CONFIG,
    frameDomain: "sprite-227",
    frameCount: 506,
    marker: "your-world-page-3-source-drawing",
    getState: getCourseG05L04Rw004FrameState,
    normalize: normalizeCourseG05L04Rw004Frame,
    attributes: buildCourseG05L04Rw004CaptureAttributes,
  },
  {
    id: "course-g05-l04-in-002",
    module: in002,
    movie: COURSE_G05_L04_IN_002_MOVIE,
    runtime: COURSE_G05_L04_IN_002_RUNTIME,
    source: COURSE_G05_L04_IN_002_SOURCE,
    sourceContract: COURSE_G05_L04_IN_002_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_IN_002_AUTHORITY,
    config: COURSE_G05_L04_IN_002_CONFIG,
    frameDomain: "sprite-52",
    frameCount: 765,
    marker: "introduction-number-lines-source-drawing",
    getState: getCourseG05L04In002FrameState,
    normalize: normalizeCourseG05L04In002Frame,
    attributes: buildCourseG05L04In002CaptureAttributes,
  },
  {
    id: "course-g05-l04-in-007",
    module: in007,
    movie: COURSE_G05_L04_IN_007_MOVIE,
    runtime: COURSE_G05_L04_IN_007_RUNTIME,
    source: COURSE_G05_L04_IN_007_SOURCE,
    sourceContract: COURSE_G05_L04_IN_007_SOURCE_CONTRACT,
    authority: COURSE_G05_L04_IN_007_AUTHORITY,
    config: COURSE_G05_L04_IN_007_CONFIG,
    frameDomain: "sprite-76",
    frameCount: 654,
    marker: "fractions-mixed-number-line-page-7-source-drawing",
    getState: getCourseG05L04In007FrameState,
    normalize: normalizeCourseG05L04In007Frame,
    attributes: buildCourseG05L04In007CaptureAttributes,
  },
] as const;

const swfOnlyCandidates = [
  {
    id: "course-g05-l04-rw-003",
    source: COURSE_G05_L04_RW_003_SOURCE,
    config: COURSE_G05_L04_RW_003_CONFIG,
    placementName: "Animation",
    runtimeBytes: 19_559_380,
  },
  {
    id: "course-g05-l04-rw-004",
    source: COURSE_G05_L04_RW_004_SOURCE,
    config: COURSE_G05_L04_RW_004_CONFIG,
    placementName: "Animation",
    runtimeBytes: 8_569_074,
  },
  {
    id: "course-g05-l04-in-002",
    source: COURSE_G05_L04_IN_002_SOURCE,
    config: COURSE_G05_L04_IN_002_CONFIG,
    placementName: "animation",
    runtimeBytes: 3_358_832,
  },
  {
    id: "course-g05-l04-in-007",
    source: COURSE_G05_L04_IN_007_SOURCE,
    config: COURSE_G05_L04_IN_007_CONFIG,
    placementName: "animation",
    runtimeBytes: 2_495_420,
  },
] as const;

test("eighteen G5 L4 source-static candidates preserve root and nested domains", async () => {
  for (const candidate of candidates) {
    assert.deepEqual(candidate.movie.stage, {width: 800, height: 600});
    assert.equal(candidate.movie.fps, 12);
    assert.equal(candidate.movie.frameCount, candidate.frameCount);
    assert.equal(candidate.runtime.frameCount, 10);
    assert.equal(candidate.runtime.defaultFrameDomain, candidate.frameDomain);
    assert.deepEqual(candidate.runtime.frameDomains, [{
      id: candidate.frameDomain,
      frameCount: candidate.frameCount,
      fps: 12,
      rootFrame: 6,
    }]);
    assert.equal(candidate.module.runtime, candidate.runtime);
    assert.equal(candidate.module.maturity, "legacy-prototype");
    const audioCandidate = getG5L4PageAudioCandidate(candidate.id);
    assert.ok(audioCandidate, `${candidate.id}: generated audio candidate`);
    assert.equal(candidate.module.audioCues, audioCandidate.audioCues);
    assert.equal(candidate.module.audioTracks, audioCandidate.audioTracks);
    assert.ok(candidate.module.audioCues.length > 0, candidate.id);
    assert.ok(candidate.module.audioTracks?.length, candidate.id);
    assert.equal(
      sha256(await readFile(`${repositoryRoot}${candidate.source.swf}`)),
      candidate.source.swfSha256,
    );
  }
});

test("eighteen G5 L4 nested timelines expose every one-indexed English static frame", () => {
  for (const candidate of candidates) {
    assert.equal(candidate.normalize(Number.NaN), 1);
    assert.equal(candidate.normalize(candidate.frameCount + 1), candidate.frameCount);
    assert.equal(candidate.normalize(8, "root"), 8);
    for (const frame of [
      1,
      Math.ceil(candidate.frameCount / 2),
      candidate.frameCount,
    ]) {
      const state = candidate.getState(frame, {
        entryStateSha256: "a".repeat(64),
        frameDomain: candidate.frameDomain,
        requirementId: `engineering:${candidate.id}:${frame}`,
        scenario: "source-static-frame",
        lang: "en",
        seed: 0,
        traceId: `source-static:${candidate.frameDomain}`,
      });
      assert.equal(state.status, "ready", candidate.id);
      assert.equal(state.frame, frame, candidate.id);
      assert.equal(state.exportFrame, frame - 1, candidate.id);
      assert.equal(state.rootFrame, 6, candidate.id);
      assert.deepEqual(state.visibleSourceMarkers, [candidate.marker]);
      assert.equal(state.interactiveControlsEnabled, false);
      assert.equal(state.audioRendered, false);
      assert.equal(state.naturalRuntimeEstablished, false);
    }
  }
});

test("eighteen G5 L4 candidates fail closed for root, Spanish, and mismatches", () => {
  for (const candidate of candidates) {
    const spanish = candidate.getState(1, {
      frameDomain: candidate.frameDomain,
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    });
    assert.equal(
      spanish.blocker,
      "spanish-visual-and-audio-unvalidated",
      candidate.id,
    );
    const root = candidate.getState(1, {
      frameDomain: "root",
      scenario: "root-unavailable",
      lang: "en",
      seed: 0,
    });
    assert.equal(root.blocker, "root-baseline-unavailable", candidate.id);
    const mismatch = candidate.getState(1, {
      frameDomain: "root",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    });
    assert.equal(
      mismatch.blocker,
      "frame-domain-scenario-mismatch",
      candidate.id,
    );
  }
});

test("eighteen G5 L4 candidates require complete deterministic capture identity", () => {
  for (const candidate of candidates) {
    const identity = {
      entryStateSha256: "b".repeat(64),
      requirementId: `engineering:${candidate.id}:terminal`,
      traceId: `source-static:${candidate.frameDomain}`,
    };
    const state = candidate.getState(candidate.frameCount, {
      ...identity,
      frameDomain: candidate.frameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 7,
    });
    const attributes = candidate.attributes({
      ...identity,
      canvasStatus: "ready",
      frame: candidate.frameCount,
      frameDomain: candidate.frameDomain,
      lang: "en",
      scenario: "source-static-frame",
      seed: 7,
      state,
    });
    assert.equal(attributes["data-capture-stage"], "true", candidate.id);
    assert.equal(attributes["data-capture-identity-status"], "verified");
    assert.equal(attributes["data-flash-frame-domain"], candidate.frameDomain);
    assert.equal(attributes["data-source-controls-enabled"], "false");
    assert.equal(attributes["data-source-marker-visuals"], candidate.marker);
  }
});

test("eighteen G5 L4 routes remain prototype-only and acceptance-neutral", async () => {
  for (const candidate of candidates) {
    const prototype = matchPrototype({animationId: candidate.id});
    assert.equal(prototype?.runtime.frameCount, 10, candidate.id);
    assert.equal(prototype?.movie.frameCount, candidate.frameCount, candidate.id);
    assert.deepEqual(prototype?.sourceBasenames, [], candidate.id);
    const registered = await loadAnimationModule(candidate.id);
    assert.equal(registered?.maturity, "legacy-prototype", candidate.id);
    assert.equal(candidate.sourceContract.ownerAccepted, false);
    assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
    for (const [name, value] of Object.entries(candidate.authority)) {
      if (name === "registryIsPrototypeOnly" ||
        name === "strictAcceptanceEffect") continue;
      assert.equal(value, false, `${candidate.id}:${name}`);
    }
    assert.equal(candidate.authority.registryIsPrototypeOnly, true);
    assert.equal(candidate.authority.strictAcceptanceEffect, "none");
  }
  for (const basename of [
    "L4VB02.swf",
    "L4VB05.swf",
    "L4VB06.swf",
    "L4VB08.swf",
    "L4VB09.swf",
    "L4IN09.swf",
    "L4IN12.swf",
    "L4IN15.swf",
    "L4IN20.swf",
    "L4TS02.swf",
    "L4TS03.swf",
    "L4TS04.swf",
    "L4TS05.swf",
    "L4TS06.swf",
    "L4RW03.swf",
    "L4RW04.swf",
    "L4IN02.swf",
    "L4IN07.swf",
  ]) {
    assert.equal(matchPrototype({sourcePath: `/ambiguous/${basename}`}), undefined);
  }
});

test("four SWF-only candidates preserve explicit null FLA and placement case", async () => {
  for (const candidate of swfOnlyCandidates) {
    assert.equal(candidate.source.pairedFlaStatus, "missing", candidate.id);
    assert.equal(candidate.source.fla, null, candidate.id);
    assert.equal(candidate.source.flaSha256, null, candidate.id);
    assert.equal(
      candidate.source.rootPlacementName,
      candidate.placementName,
      candidate.id,
    );
    const spec = JSON.parse(await readFile(
      `${repositoryRoot}migrations/${candidate.id}/audit/source-static-current-js-candidate-spec.json`,
      "utf8",
    ));
    assert.deepEqual({
      pairedFlaStatus: spec.source.pairedFlaStatus,
      fla: spec.source.fla,
      flaBytes: spec.source.flaBytes,
      flaSha256: spec.source.flaSha256,
    }, {
      pairedFlaStatus: "missing",
      fla: null,
      flaBytes: null,
      flaSha256: null,
    }, candidate.id);
    assert.equal(
      spec.timeline.root.placementName,
      candidate.placementName,
      candidate.id,
    );
  }
});

test("four SWF-only runtimes are hash-bound, syntax-valid, safe, and lazy", async () => {
  const registrySource = await readFile(
    `${repositoryRoot}packages/demos/src/registry.generated.ts`,
    "utf8",
  );
  const disallowedRuntimePatterns = [
    /\beval\s*\(/,
    /\bFunction\s*\(/,
    /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/,
    /\b(?:Worker|SharedWorker)\s*\(/,
    /\b(?:localStorage|sessionStorage|indexedDB)\b/,
    /\bimport\s*\(/,
    /\b(?:addEventListener|removeEventListener)\s*\(/,
  ];
  for (const candidate of swfOnlyCandidates) {
    const runtimePath =
      `${repositoryRoot}public${candidate.config.assetSource}`;
    const runtimeBytes = await readFile(runtimePath);
    const runtimeSource = runtimeBytes.toString("utf8");
    assert.equal(runtimeBytes.byteLength, candidate.runtimeBytes, candidate.id);
    assert.equal(sha256(runtimeBytes), candidate.config.assetSha256, candidate.id);
    assert.doesNotThrow(
      () => new Script(runtimeSource, {filename: runtimePath}),
      candidate.id,
    );
    for (const pattern of disallowedRuntimePatterns) {
      assert.doesNotMatch(runtimeSource, pattern, `${candidate.id}:${pattern}`);
    }
    assert.match(
      registrySource,
      new RegExp(
        `'${candidate.id}': \\(\\) => import\\('\\./modules/${candidate.id}'\\)`,
      ),
      candidate.id,
    );
    assert.equal(
      registrySource.includes(
        `import ${candidate.id} from './modules/${candidate.id}'`,
      ),
      false,
      candidate.id,
    );
  }
});

test("eighteen generated G5 L4 renderer reports prove only current-JS static QA", async () => {
  for (const candidate of candidates) {
    const report = JSON.parse(await readFile(
      `${repositoryRoot}migrations/${candidate.id}/evidence/source-static-current-js-candidate.json`,
      "utf8",
    ));
    const manifest = JSON.parse(await readFile(
      `${repositoryRoot}public/flash-assets/courses/${candidate.id}/manifest.json`,
      "utf8",
    ));
    assert.equal(report.animationId, candidate.id);
    assert.equal(report.status, "current-javascript-engineering-candidate-only");
    assert.equal(report.renderer.frameDomain, candidate.frameDomain);
    assert.equal(report.browserQa.renderedFrameCount, candidate.frameCount);
    assert.equal(report.evidenceBoundary.originalRuntimeBaselineUsed, false);
    assert.equal(report.evidenceBoundary.normalizedRmseComputed, false);
    assert.ok(Object.values(report.acceptanceEffects).every(
      (value) => value === false,
    ));
    assert.equal(manifest.animationId, candidate.id);
    assert.equal(manifest.safety.noLegacyActionScriptExecuted, true);
    assert.equal(manifest.safety.noNetworkPrimitives, true);
    assert.equal(manifest.safety.noTimersOrAutoplay, true);
    assert.equal(manifest.safety.pointerEventsEnabled, false);
    assert.equal(manifest.safety.audioRendered, false);
    if ("pairedFlaStatus" in candidate.source) {
      assert.deepEqual(manifest.inputs.sourceFla, {
        pairedFlaStatus: "missing",
        path: null,
        bytes: null,
        sha256: null,
        authoringAuditEstablished: false,
      }, candidate.id);
      assert.deepEqual(report.source.fla, manifest.inputs.sourceFla, candidate.id);
    }
    const runtimeBytes = await readFile(
      `${repositoryRoot}public/flash-assets/courses/${candidate.id}/canvas-renderer.js`,
    );
    assert.equal(
      candidate.config.assetSha256,
      sha256(runtimeBytes),
      candidate.id,
    );
    assert.equal(
      candidate.config.assetSha256,
      manifest.output.sha256,
      candidate.id,
    );
    assert.ok(Object.values(manifest.acceptanceEffects).every(
      (value) => value === false,
    ));
    assert.equal(manifest.strictAcceptanceEffect, "none");
  }
});
