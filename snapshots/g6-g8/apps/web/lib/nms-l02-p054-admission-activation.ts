import type {NmsL02AdmissionActivation} from './nms-l02-admission-activation';

/** Source-bound P054 local candidate. Registry and independent gates remain separate. */
export const NMS_L02_P054_ADMISSION:NmsL02AdmissionActivation|null={
  "schemaVersion": 1,
  "stage": "registered",
  "predecessor": {
    "path": "output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json",
    "bytes": 137815,
    "sha256": "01cb25723b10cc2ce5a0a39e699420a08c7815804b0fe21988c5b155323230b6"
  },
  "host": {
    "path": "catalog/nms-l02-admission-v1/host-v15.json",
    "bytes": 42983,
    "sha256": "7150c0e90578f5c2763eb3bb90e93a3605dde61613d2597907c318dffec7eb68"
  },
  "page": {
    "path": "work/g678-workflow/candidates/shared-nms002-l02-p054-v1.json",
    "bytes": 54313,
    "sha256": "5e8fc913e9e0bc41dbf1336b4d042983e5fd5b74b60fc63beeec7c3015adf666"
  }
};
