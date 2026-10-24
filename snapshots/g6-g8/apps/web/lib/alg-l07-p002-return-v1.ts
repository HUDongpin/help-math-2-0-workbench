/** A departing SA context cannot resume an operation cancelled by a later user action. */
export class P002ReturnGuard {
 private generation=0;private returning=false;
 get pending(){return this.returning;}
 cancel(){this.generation++;this.returning=false;}
 async afterClose(close:()=>Promise<void>,current:()=>boolean,resume:()=>void){
  const ticket=++this.generation;this.returning=true;
  try{
   await close();if(ticket!==this.generation||!this.returning||!current())return false;
   this.returning=false;resume();return true;
  }finally{if(ticket===this.generation)this.returning=false;}
 }
}
