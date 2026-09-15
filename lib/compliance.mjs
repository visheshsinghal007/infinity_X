// Demonstration policy, not a statement of statutory applicability or legal weights.
export const CATEGORIES=[
 {id:'UDYAM',name:'Udyam / MSE registration',weight:10,severity:'Medium'},
 {id:'GST',name:'GST registration',weight:15,severity:'High'},
 {id:'PAN',name:'PAN identity',weight:15,severity:'High'},
 {id:'MCA',name:'MCA21 company status',weight:10,severity:'High'},
 {id:'EPFO',name:'EPFO compliance',weight:10,severity:'Medium'},
 {id:'ESIC',name:'ESIC compliance',weight:10,severity:'Medium'},
 {id:'STARTUP',name:'Startup recognition',weight:5,severity:'Low'},
 {id:'NSIC',name:'NSIC registration',weight:5,severity:'Low'},
 {id:'DEBARMENT',name:'Debarment / blacklist declaration',weight:20,severity:'Critical'}
];
export const normalize=v=>String(v??'').trim().replace(/\s+/g,' ').toUpperCase();
export function emptyChecks(){return CATEGORIES.map(c=>({category:c.id,claim:'',observed:'',entity:'',claimedEntity:'',status:'Unknown',validUntil:'',source:'',sourceType:'manual',page:1,excerpt:'',applicability:'Required',basis:'',review:null}))}
export function evaluateCheck(c,asOf=new Date().toISOString()){
 const base={category:c.category,weight:CATEGORIES.find(x=>x.id===c.category)?.weight??0};
 let result='Unclear',reason='Claim and independently obtained evidence are required.';
 if(c.applicability==='Not applicable'){
   result=c.review?.result==='Not applicable'&&c.basis?.trim()?'Not applicable':'Unclear';reason=result==='Not applicable'?'Officer accepted the documented applicability basis.':'An exemption requires an officer decision and tender-specific basis.';
 }else if(c.claim&&c.observed&&c.source&&c.excerpt){
   if(normalize(c.claim)!==normalize(c.observed)){result='Fail';reason='Claim differs from the reference record.'}
   else if(c.claimedEntity&&c.entity&&normalize(c.claimedEntity)!==normalize(c.entity)){result='Unclear';reason='Entity names differ. Review identity or legal-name evidence.'}
   else if(c.validUntil&&Date.parse(c.validUntil+'T23:59:59Z')<Date.parse(asOf)){result='Fail';reason='Evidence validity date has passed.'}
   else if(['Inactive','Expired','Cancelled','Debarred'].includes(c.status)){result='Fail';reason='Reference status is '+c.status.toLowerCase()+'.'}
   else if(['Active','Valid','Clear'].includes(c.status)){result='Pass';reason='Claim matches the supplied record and its stated status is acceptable under the demo rule.'}
   else reason='Reference record has no conclusive status.';
 }
 const computed=result;
 if(c.review&&c.applicability!=='Not applicable'){result=c.review.result;reason='Officer override: '+c.review.reason}
 return {...base,result,computed,reason,provenance:c.sourceType==='demo'?'Fictional reference record':c.sourceType==='imported'?'User-imported reference record':'Manually recorded evidence'};
}
export function summarize(checks,at){const results=checks.map(c=>evaluateCheck(c,at));const applicable=results.filter(r=>r.result!=='Not applicable');const total=applicable.reduce((s,r)=>s+r.weight,0);const passed=applicable.filter(r=>r.result==='Pass').reduce((s,r)=>s+r.weight,0);const failed=applicable.filter(r=>r.result==='Fail').reduce((s,r)=>s+r.weight,0);const unresolved=applicable.filter(r=>r.result==='Unclear').reduce((s,r)=>s+r.weight,0);return {results,score:total?Math.round(passed/total*100):null,risk:results.some(r=>r.result==='Fail'&&CATEGORIES.find(c=>c.id===r.category)?.severity==='Critical')?'High':failed>=20?'High':failed||unresolved?'Review required':'Low',unresolved:results.filter(r=>r.result==='Unclear').length,coverage:total?Math.round((total-unresolved)/total*100):100,failedWeight:failed,applicableWeight:total}}
export function demoChecks(bidder){return emptyChecks().map((c,i)=>({...c,claim:'DEMO-'+c.category+'-001',observed:'DEMO-'+c.category+'-001',claimedEntity:bidder,entity:bidder,status:i===4?'Expired':i===5?'Unknown':c.category==='DEBARMENT'?'Clear':'Active',validUntil:i===4?'2025-12-31':'2030-12-31',source:'Infinity-X fictional registry fixture · '+c.category,sourceType:'demo',page:i+1,excerpt:'Fictional '+c.category+' record for '+bidder+'. This is not government verification.'}))}
export function extractClaims(pages){const patterns=[['UDYAM',/UDYAM-[A-Z]{2}-\d{2}-\d{7}/gi],['GST',/\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/gi],['PAN',/\b[A-Z]{5}\d{4}[A-Z]\b/g],['MCA',/\b[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b/g],['STARTUP',/\bDIPP\d{4,10}\b/gi]];const claims=[];for(const p of pages){for(const [category,re] of patterns)for(const m of p.text.matchAll(re)){if(!claims.some(c=>c.category===category&&c.value===m[0]))claims.push({category,value:m[0],page:p.page,excerpt:p.text.slice(Math.max(0,m.index-70),m.index+m[0].length+90),method:'Pattern extraction; unverified'})}}return claims.slice(0,60)}
export function validateChecks(input){if(!Array.isArray(input)||input.length!==9)throw Error('Provide exactly nine category records.');const seen=new Set();return input.map(c=>{if(!CATEGORIES.some(x=>x.id===c.category)||seen.has(c.category))throw Error('Unknown or duplicate compliance category.');seen.add(c.category);const out={category:c.category};for(const k of ['claim','observed','entity','claimedEntity','source','excerpt','basis']){if(typeof c[k]!=='string'||c[k].length>(k==='excerpt'?4000:500))throw Error('Invalid '+k+' field.');out[k]=c[k].trim()}if(!['Active','Valid','Clear','Inactive','Expired','Cancelled','Debarred','Unknown'].includes(c.status))throw Error('Invalid reference status.');if(!['Required','Not applicable'].includes(c.applicability))throw Error('Invalid applicability.');if(!['manual','imported','demo'].includes(c.sourceType))throw Error('Invalid evidence provenance.');if(!Number.isInteger(c.page)||c.page<1||c.page>10000)throw Error('Source page must be a positive integer.');if(c.validUntil&&(!/^\d{4}-\d{2}-\d{2}$/.test(c.validUntil)||!Number.isFinite(Date.parse(c.validUntil))))throw Error('Invalid validity date.');return {...out,status:c.status,applicability:c.applicability,sourceType:c.sourceType,page:c.page,validUntil:c.validUntil||'',review:null}})}
