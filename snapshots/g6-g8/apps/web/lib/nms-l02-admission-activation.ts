export interface NmsL02AdmissionPin {readonly path:string;readonly bytes:number;readonly sha256:string;}
export interface NmsL02AdmissionActivation {
 readonly schemaVersion:1;
 readonly stage:'candidate'|'registered';
 readonly predecessor:NmsL02AdmissionPin;
 readonly host:NmsL02AdmissionPin;
 readonly page:NmsL02AdmissionPin;
}
// Exact local transaction verified separately from all acceptance gates.
export const NMS_L02_ADMISSION:NmsL02AdmissionActivation|null={
 schemaVersion:1,stage:'registered',
 predecessor:{path:'output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json',
  bytes:137815,sha256:'01cb25723b10cc2ce5a0a39e699420a08c7815804b0fe21988c5b155323230b6'},
 host:{path:'catalog/nms-l02-admission-v1/host-v5.json',bytes:11001,
  sha256:'f81569d2c3e96577c0f9864ce0df8dbed18c85e77f641fbaac551595a3fbf8fd'},
 page:{path:'work/g678-workflow/candidates/shared-nms002-l02-p055-v1.json',bytes:41970,
  sha256:'6d7b37096d01b7f712ebde9c461652733177b64cd654ecb75a9f0d656291bae1'},
};
