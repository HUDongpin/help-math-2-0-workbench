import type {NmsL02AdmissionActivation} from './nms-l02-admission-activation';

/** Source-bound local P064 candidate; registry and acceptance remain unchanged. */
export const NMS_L02_P064_ADMISSION:NmsL02AdmissionActivation|null={
  "schemaVersion": 1,
  "stage": "registered",
  "predecessor": {
    "path": "output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json",
    "bytes": 137815,
    "sha256": "01cb25723b10cc2ce5a0a39e699420a08c7815804b0fe21988c5b155323230b6"
  },
  "host": {
    "path": "catalog/nms-l02-admission-v1/host-v14.json",
    "bytes": 38775,
    "sha256": "34a4280e72e90d55db7cd8f12587c39095c73ca1fcb7b253d221be098e980d9c"
  },
  "page": {
    "path": "work/g678-workflow/candidates/shared-nms002-l02-p064-v1.json",
    "bytes": 44928,
    "sha256": "91ecc6b6b5dece0d0b3521c5d150b25be0a4bbf06b85b776fdb7f146d8af0ec7"
  }
};
