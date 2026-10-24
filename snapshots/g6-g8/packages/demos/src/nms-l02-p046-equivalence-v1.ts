/** Maintained mathematical correction to source Button146's ratio comparison.
 * Full finite decimal inputs (including scientific notation) are exact rationals;
 * numeric prefixes, nonfinite values and zero denominators are not fractions.
 */
function decimal(value:string):readonly [bigint,bigint]|null{
  const text=value.trim();
  const match=/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(text);
  if(!match||!Number.isFinite(Number(text)))return null;
  const fraction=match[3]??match[4]??'',digits=(match[2]??'')+fraction;
  const significant=digits.replace(/^0+/,'');
  if(!significant)return [0n,1n];
  // Inputs below the host's finite numeric range are rejected, not rounded to0.
  if(Number(text)===0)return null;
  const exponent=Number(match[5]??0)-fraction.length;
  if(!Number.isSafeInteger(exponent))return null;
  const coefficient=BigInt(significant)*(match[1]==='-'?-1n:1n);
  return exponent>=0?[coefficient*10n**BigInt(exponent),1n]:[coefficient,10n**BigInt(-exponent)];
}
export function p046Equivalent(targetNumerator:number,targetDenominator:number,numerator:string,denominator:string):boolean{
  if(!Number.isSafeInteger(targetNumerator)||!Number.isSafeInteger(targetDenominator)||targetDenominator===0)throw Error('P046_TARGET');
  const n=decimal(numerator),d=decimal(denominator);
  if(!n||!d||d[0]===0n)return false;
  return n[0]*d[1]*BigInt(targetDenominator)===d[0]*n[1]*BigInt(targetNumerator);
}
