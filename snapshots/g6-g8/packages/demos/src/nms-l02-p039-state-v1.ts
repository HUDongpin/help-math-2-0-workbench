import {p039SourceXAtPercent} from './nms-l02-p039-slider-v1';
export const P039_ID='shared-nms002-l02-p039';
export interface P039State {
 readonly seed:number;readonly replay:number;readonly mainFrame:number;readonly mainPlaying:boolean;
 readonly percent:number;readonly tries:number;readonly enabled:boolean;
 readonly popupFrame:number|null;readonly popupPlaying:boolean;readonly popupVisible:boolean;
 readonly correctFrame:number|null;readonly correctPlaying:boolean;
 readonly revealFrame:number|null;readonly revealPlaying:boolean;
 readonly coachBranch:0|1|2|3|null;readonly coachFrame:number|null;readonly coachPlaying:boolean;readonly coachSerial:number;
 readonly correctedReveal:boolean;
}
const seal=(s:P039State):P039State=>Object.freeze(s);
const entries=[3,18,31,40]as const,stops=[16,27,36,54]as const;
export function p039Initial(seed=0,replay=0):P039State{
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P039_IDENTITY');
 return seal({seed,replay,mainFrame:1,mainPlaying:true,percent:0,tries:0,enabled:false,popupFrame:null,popupPlaying:false,popupVisible:false,correctFrame:null,correctPlaying:false,revealFrame:null,revealPlaying:false,coachBranch:null,coachFrame:null,coachPlaying:false,coachSerial:0,correctedReveal:false});
}
export function p039SetPercent(s:P039State,percent:number):P039State{
 p039SourceXAtPercent(percent);
 return s.enabled&&s.mainFrame===546&&s.percent!==percent?seal({...s,percent}):s;
}
export function p039Reset(s:P039State):P039State{
 // Source Reset preserves tryCount. Native correction aligns the handle with0.
 return s.enabled&&s.mainFrame===546&&s.percent!==0?seal({...s,percent:0}):s;
}
export function p039Submit(s:P039State):P039State{
 if(!s.enabled||s.mainFrame!==546)return s;
 if(s.percent===25)return seal({...s,enabled:false,correctFrame:2,correctPlaying:true});
 // Deterministic native branch selection, not a claim of Flash RNG parity.
 const branch=((s.seed+s.coachSerial)%4)as 0|1|2|3;
 return seal({...s,enabled:false,tries:s.tries+1,popupVisible:true,popupFrame:2,popupPlaying:true,
   coachBranch:branch,coachFrame:entries[branch],coachPlaying:true,coachSerial:s.coachSerial+1});
}
export function p039CloseWrong(s:P039State):P039State{
 if(!s.popupVisible)return s;
 if(s.tries>=2)return seal({...s,popupVisible:false,popupFrame:1,popupPlaying:false,percent:25,
   correctedReveal:true,revealFrame:2,revealPlaying:true,enabled:false});
 return seal({...s,popupVisible:false,popupFrame:1,popupPlaying:false,enabled:true});
}
export function p039Tick(s:P039State):P039State{
 if(!s.mainPlaying&&!s.popupPlaying&&!s.correctPlaying&&!s.revealPlaying&&!s.coachPlaying)return s;
 let n={...s};
 if(s.mainPlaying){n.mainFrame++;
  if(n.mainFrame===546){n.mainPlaying=false;n.enabled=true;n.popupFrame=1;n.correctFrame=1;n.revealFrame=1;n.coachFrame=1;}
  if(n.mainFrame===547){n.enabled=false;n.popupFrame=null;n.popupPlaying=false;n.popupVisible=false;n.correctFrame=null;n.correctPlaying=false;n.revealFrame=null;n.revealPlaying=false;n.coachFrame=null;n.coachPlaying=false;n.coachBranch=null;}
  if(n.mainFrame===579)n.mainPlaying=false;
 }
 if(s.popupPlaying&&n.popupFrame!==null){n.popupFrame=s.popupFrame!+1;if(n.popupFrame===15)n.popupPlaying=false;}
 if(s.coachPlaying&&n.coachFrame!==null&&s.coachBranch!==null){n.coachFrame=s.coachFrame!+1;if(n.coachFrame===stops[s.coachBranch]){n.coachFrame=1;n.coachPlaying=false;}}
 if(s.correctPlaying&&n.correctFrame!==null){n.correctFrame=s.correctFrame!+1;if(n.correctFrame===13){n.correctPlaying=false;n.mainPlaying=true;}}
 if(s.revealPlaying&&n.revealFrame!==null){n.revealFrame=s.revealFrame!+1;if(n.revealFrame===35){n.revealFrame=1;n.revealPlaying=false;n.mainPlaying=true;}}
 return seal(n);
}
export function p039Advance(s:P039State,frames:number):P039State{
 if(!Number.isSafeInteger(frames)||frames<0||frames>10000)throw Error('P039_ADVANCE');
 for(let i=0;i<frames;i++){const next=p039Tick(s);if(next===s)break;s=next;}return s;
}
export function p039Replay(s:P039State){return p039Initial(s.seed,s.replay+1);}
export function p039Phase(s:P039State){return s.mainFrame===579&&!s.mainPlaying?'completed':s.mainFrame<546?'intro':s.mainFrame>546||s.mainPlaying?'outro':s.popupVisible?'wrong':s.correctPlaying?'correct':s.revealPlaying?'reveal':'exercise';}
