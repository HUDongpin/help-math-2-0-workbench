import type {NmsL02AdmissionActivation} from './nms-l02-admission-activation';
// Exact local candidate. No registry mutation or acceptance effect.
// Outside the immutable proof closures to avoid a circular hash dependency.
export const NMS_L02_P056_ADMISSION:NmsL02AdmissionActivation|null={
  "schemaVersion": 1,
  "stage": "registered",
  "predecessor": {
    "path": "output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json",
    "bytes": 137815,
    "sha256": "01cb25723b10cc2ce5a0a39e699420a08c7815804b0fe21988c5b155323230b6"
  },
  "host": {
    "path": "catalog/nms-l02-admission-v1/host-v6.json",
    "bytes": 16731,
    "sha256": "d16a595ac797af45d6283ab77e563cdbe448010f6e180b4174e0ac5c6b412625"
  },
  "page": {
    "path": "work/g678-workflow/candidates/shared-nms002-l02-p056-v1.json",
    "bytes": 31795,
    "sha256": "29c0da9919a42535c5969e3cf48ca37305f6d100db531294156012aedae97486"
  }
};
