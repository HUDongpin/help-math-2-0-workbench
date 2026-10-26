import type {NmsL02AdmissionActivation} from './nms-l02-admission-activation';

/** Sealed local P053 candidate; registry and independent acceptance gates remain separate. */
export const NMS_L02_P053_ADMISSION:NmsL02AdmissionActivation|null={
  "schemaVersion": 1,
  "stage": "registered",
  "predecessor": {
    "path": "output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json",
    "bytes": 137815,
    "sha256": "01cb25723b10cc2ce5a0a39e699420a08c7815804b0fe21988c5b155323230b6"
  },
  "host": {
    "path": "catalog/nms-l02-admission-v1/host-v16.json",
    "bytes": 47999,
    "sha256": "1f0d2dbb09c4f641eb65267ae0d90f073477704bca94c75e6bacd67c01e73e7f"
  },
  "page": {
    "path": "work/g678-workflow/candidates/shared-nms002-l02-p053-v1.json",
    "bytes": 80051,
    "sha256": "604c34d8b52378019c949aefec1212e79c7e6300cab90ad0683f5fe3089645f0"
  }
};
