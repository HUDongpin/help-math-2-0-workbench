import type {NmsL02AdmissionActivation} from './nms-l02-admission-activation';

/** Local candidate only; no registry or acceptance effect. */
export const NMS_L02_P060_ADMISSION:NmsL02AdmissionActivation|null={
  "schemaVersion": 1,
  "stage": "registered",
  "host": {
    "path": "catalog/nms-l02-admission-v1/host-v10.json",
    "bytes": 26722,
    "sha256": "2a54a89fbd1793ad0f596a51183aa42e120f80581f22a0ec66a125810263ac54"
  },
  "page": {
    "path": "work/g678-workflow/candidates/shared-nms002-l02-p060-v1.json",
    "bytes": 121846,
    "sha256": "7e408e17b13e5d96bef72919f9f132a4718ed9be9578663709f108496e823acd"
  },
  "predecessor": {
    "path": "output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json",
    "bytes": 137815,
    "sha256": "01cb25723b10cc2ce5a0a39e699420a08c7815804b0fe21988c5b155323230b6"
  }
};
