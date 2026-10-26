import type {NmsL02AdmissionActivation} from './nms-l02-admission-activation';
// Local candidate activation; registry and acceptance remain unchanged.
// Outside immutable proof closures to avoid a circular hash dependency.
export const NMS_L02_P057_ADMISSION:NmsL02AdmissionActivation|null={
  "schemaVersion": 1,
  "stage": "registered",
  "predecessor": {
    "path": "output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json",
    "bytes": 137815,
    "sha256": "01cb25723b10cc2ce5a0a39e699420a08c7815804b0fe21988c5b155323230b6"
  },
  "host": {
    "path": "catalog/nms-l02-admission-v1/host-v7.json",
    "bytes": 19519,
    "sha256": "9e905c5720097b52c3856cd2589a628a58edac1aad84234a0bdc088f15c01d45"
  },
  "page": {
    "path": "work/g678-workflow/candidates/shared-nms002-l02-p057-v1.json",
    "bytes": 66031,
    "sha256": "2b1b08015bdef6b7624e73f4d85509aba1821cdf7cb7e9bf646e1c4d2b9634e7"
  }
};
