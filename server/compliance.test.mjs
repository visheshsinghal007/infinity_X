import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,transition,ranking} from '../lib/model.ts';
import {emptyChecks,demoChecks,summarize,evaluateCheck,extractClaims,validateChecks} from '../lib/compliance.mjs';
import {complianceAction,complianceReport} from './compliance-api.mjs';
import {suggestClaims} from './integrations.mjs';
test('nine categories distinguish expiry, mismatch, uncertainty, exemptions and weighted scores',()=>{
 const c=demoChecks('Example');assert.equal(c.length,9);assert.equal(c.reduce((n,x)=>n+evaluateCheck(x).weight,0),100);
 assert.equal(evaluateCheck(c[4]).result,'Fail');assert.equal(evaluateCheck(c[5]).result,'Unclear');assert.equal(summarize(c).score,80);
 c[0].observed='DIFFERENT';assert.equal(evaluateCheck(c[0]).result,'Fail');c[0].observed=c[0].claim;c[0].entity='Other';assert.equal(evaluateCheck(c[0]).result,'Unclear');
 c[6].applicability='Not applicable';assert.equal(evaluateCheck(c[6]).result,'Unclear');c[6].basis='Tender clause 12 with recognition evidence';c[6].review={result:'Not applicable'};assert.equal(evaluateCheck(c[6]).result,'Not applicable');
 assert.equal(summarize(emptyChecks()).score,0);assert.throws(()=>validateChecks([...c.slice(0,8),c[0]]),/duplicate/);
});
test('compliance lifecycle persists evidence, rejects unauthorized actions, requires human review, and exports safely',async()=>{
 const s=seed(),t=s.tenders[0],bid=t.bids[0];const p={id:t.id,bidId:bid.id};
 await assert.rejects(complianceAction(s,'AUDITOR',{...p,operation:'demo'}),/role required/);
 await complianceAction(s,'PROCUREMENT_OFFICER',{...p,operation:'demo'});
 await complianceAction(s,'TECHNICAL_EVALUATOR',{...p,operation:'run'});
 await assert.rejects(complianceAction(s,'PROCUREMENT_OFFICER',{...p,operation:'decision',decision:'Accept compliance',confirmed:true,reason:'Reviewed all sources carefully'}),/Resolve failed/);
 await complianceAction(s,'PROCUREMENT_OFFICER',{...p,operation:'decision',decision:'Request clarification',confirmed:true,reason:'Request updated EPFO evidence'});
 assert.equal(t.compliance[bid.id].decision.type,'Request clarification');
 const rows=demoChecks(bid.name).map(c=>({...c,status:'Active',validUntil:'2030-12-31',source:'<script>bad</script>'}));
 await complianceAction(s,'PROCUREMENT_OFFICER',{...p,operation:'save',checks:rows});assert.equal(t.compliance[bid.id].decision,null);
 await assert.rejects(complianceAction(s,'PROCUREMENT_OFFICER',{...p,operation:'decision',decision:'Accept compliance',confirmed:true,reason:'All records were reviewed'}),/Run verification/);
 await complianceAction(s,'PROCUREMENT_OFFICER',{...p,operation:'run'});await complianceAction(s,'PROCUREMENT_OFFICER',{...p,operation:'decision',decision:'Accept compliance',confirmed:true,reason:'All records were reviewed'});
 const report=complianceReport(t,bid);assert.ok(report.includes('&lt;script&gt;'));assert.ok(!report.includes('<script>bad'));
 assert.ok(s.audit.some(a=>a.action==='Compliance decision'));
 await assert.rejects(complianceAction(s,'PROCUREMENT_OFFICER',{id:s.tenders[4].id,bidId:s.tenders[4].bids[0].id,operation:'demo'}),/locked/);
});
test('extraction links claims to source pages and drops hallucinated LLM evidence',async()=>{
 const pages=[{page:2,text:'Illustrative specimen. UDYAM-AA-01-1234567 registered entity.'}];const claims=extractClaims(pages);assert.equal(claims[0].page,2);assert.equal(claims[0].category,'UDYAM');
 const result=await suggestClaims(pages,{url:'https://example.invalid/adapter',token:'test-only',model:'fixture',fetcher:async()=>Response.json({choices:[{message:{content:JSON.stringify({claims:[{category:'UDYAM',value:'UDYAM-AA-01-1234567',page:2,excerpt:pages[0].text},{category:'PAN',value:'INVENTED',page:2,excerpt:'This is invented'}]})}}]})});assert.equal(result.length,1);
 await assert.rejects(suggestClaims(pages,{url:'http://example.invalid',token:'fixture',model:'fixture'}),/HTTPS/);
});
test('statutory review gates rankings and invalidates an earlier report',async()=>{
 const s=seed(),t=s.tenders[2];assert.ok(t.reportAt);const p={id:t.id,bidId:t.bids[0].id};
 await complianceAction(s,'PROCUREMENT_OFFICER',{...p,operation:'demo'});
 assert.equal(t.reportAt,undefined);assert.equal(t.committee,false);assert.equal(ranking(t).length,0);
 assert.throws(()=>transition(s,'FINANCIAL_EVALUATOR','report',{id:t.id}),/Finalize compliance/);
 for(const [i,bid] of t.bids.entries()){
  const pp={id:t.id,bidId:bid.id};
  await complianceAction(s,'PROCUREMENT_OFFICER',{...pp,operation:'save',checks:demoChecks(bid.name).map(c=>({...c,status:'Active',validUntil:'2030-12-31'}))});
  await complianceAction(s,'PROCUREMENT_OFFICER',{...pp,operation:'run'});
  await complianceAction(s,'PROCUREMENT_OFFICER',{...pp,operation:'decision',decision:i===1?'Reject compliance':'Accept compliance',reason:'Documented independent review finding.',confirmed:true});
 }
 assert.deepEqual(ranking(t).map(b=>b.id),[t.bids[0].id]);
 transition(s,'FINANCIAL_EVALUATOR','report',{id:t.id});assert.ok(t.reportAt);
});
