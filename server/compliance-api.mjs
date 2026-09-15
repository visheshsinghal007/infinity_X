import {suggestClaims,registryAdapters} from './integrations.mjs';
import {CATEGORIES,emptyChecks,demoChecks,summarize,validateChecks,extractClaims,evaluateCheck} from '../lib/compliance.mjs';
import {addAudit,stamp} from '../lib/model.ts';
import {createHash} from 'node:crypto';
const check=(v,m)=>{if(!v)throw Error(m)};
const reviewRoles=['PROCUREMENT_OFFICER','TECHNICAL_EVALUATOR','SUPER_ADMIN'];
export async function complianceAction(state,role,p){
 check(reviewRoles.includes(role),'Officer or technical evaluator role required.');
 const t=state.tenders.find(t=>t.id===p.id);check(t,'Tender not found.');check(!['Approved','Rejected'].includes(t.status),'Final tenders are locked.');
 const bid=t.bids.find(b=>b.id===p.bidId);check(bid,'Select an existing bidder.');
 t.compliance??={};let c=t.compliance[bid.id]??{checks:emptyChecks(),documents:[],runs:[],decision:null};
 if(p.operation==='demo'){check(!t.compliance[bid.id],'A case already exists. Use a different bidder to load the fictional example.');c.checks=await registryAdapters.demo.verify(demoChecks(bid.name))}
 else if(p.operation==='save'){c.checks=validateChecks(p.checks);c.decision=null;c.lastRun=null}
 else if(p.operation==='extract'){
  check(Array.isArray(p.pages)&&p.pages.length>0&&p.pages.length<=20,'Provide 1–20 extracted pages.');
  const pages=p.pages.map(x=>{check(Number.isInteger(x.page)&&x.page>0&&typeof x.text==='string'&&x.text.length<=30000,'Invalid page text.');return {page:x.page,text:x.text}});
  check(p.name&&p.name.length<=180,'Document name required.');check(c.documents.length<20,'Maximum 20 extracted documents per bidder.');
  check(['PDF text','Browser OCR','Text file','Manual transcription'].includes(p.method),'Invalid extraction method.');
  const doc={id:crypto.randomUUID(),name:p.name,method:p.method,sourceHash:p.sourceHash||'',textHash:createHash('sha256').update(JSON.stringify(pages)).digest('hex'),at:stamp(),pages,claims:extractClaims(pages)};
  c.documents.push(doc);c.decision=null;c.lastRun=null;
  }else if(p.operation==='semantic'){
  check(p.consent===true,'Confirm sending extracted text to the configured AI provider.');const doc=c.documents.find(d=>d.id===p.document);check(doc,'Document not found.');const suggestions=await suggestClaims(doc.pages);doc.claims.push(...suggestions.filter(cl=>!doc.claims.some(old=>old.category===cl.category&&old.value===cl.value)));doc.semanticAt=stamp();c.decision=null;c.lastRun=null;
 }else if(p.operation==='useClaim'){
  const doc=c.documents.find(d=>d.id===p.document);const claim=doc?.claims[p.index];check(claim,'Claim not found.');const row=c.checks.find(x=>x.category===claim.category);row.claim=claim.value;row.page=claim.page;row.excerpt=claim.excerpt;row.claimedEntity=bid.name;row.review=null;c.decision=null;c.lastRun=null;
 }else if(p.operation==='review'){
  const row=c.checks.find(x=>x.category===p.category);check(row,'Category not found.');check(['Pass','Fail','Unclear','Not applicable'].includes(p.result),'Invalid review result.');check(typeof p.reason==='string'&&p.reason.trim().length>=10&&p.reason.length<=2000,'A review reason of 10–2000 characters is required.');
  check(p.result!=='Not applicable'||row.basis?.trim(),'Record the tender clause and evidence for the exemption first.');
  check(p.result!=='Pass'||(row.source&&row.excerpt&&row.claim&&row.observed),'Pass requires a claim, reference record, source and evidence.');
  if(p.result==='Not applicable')row.applicability='Not applicable';else row.applicability='Required';
  row.review={result:p.result,reason:p.reason.trim(),actor:role,at:stamp(),previous:evaluateCheck(row).result};c.decision=null;c.lastRun=null;
 }else if(p.operation==='run'){
  const at=stamp();c.lastRun={at,...summarize(c.checks,at)};c.runs.unshift(c.lastRun);c.runs=c.runs.slice(0,20);c.decision=null;
 }else if(p.operation==='decision'){
  check(role==='PROCUREMENT_OFFICER','Only the Procurement Officer can finalize compliance review.');check(c.lastRun,'Run verification after the latest changes.');check(['Accept compliance','Request clarification','Reject compliance'].includes(p.decision),'Invalid compliance decision.');check(p.confirmed===true,'Confirm this human compliance decision.');check(p.reason?.trim().length>=10&&p.reason.length<=2000,'Provide a reason of 10–2000 characters.');const current=summarize(c.checks);if(p.decision==='Accept compliance')check(!current.unresolved&&!current.results.some(r=>r.result==='Fail'),'Resolve failed and unclear checks before accepting compliance.');c.decision={type:p.decision,reason:p.reason,actor:role,at:stamp()};
 }else throw Error('Unknown compliance operation.');
 t.compliance[bid.id]=c;if(t.reportAt){t.reportAt=undefined;t.committee=false;t.status='Financial evaluation'}addAudit(state,role,'Compliance '+p.operation,t.id,JSON.stringify({bidder:bid.name,category:p.category,reason:p.reason,result:p.result,decision:p.decision,sourceModes:[...new Set(c.checks.map(x=>x.sourceType))]}));return c;
}
export async function parsePdf(data){const {default:pdf}=await import('pdf-parse/lib/pdf-parse.js');const pages=[];await pdf(data,{max:20,pagerender:async page=>{const content=await page.getTextContent();let lastY,text='';for(const i of content.items){const y=i.transform[5];text+=(lastY===y?' ':'\n')+i.str;lastY=y}pages.push({page:page.pageNumber,text:text.slice(0,30000)});return text}});check(pages.length,'No pages could be read.');return {pages,claims:extractClaims(pages),method:'PDF text',needsOcr:pages.every(p=>p.text.trim().length<30)}}
export function complianceReport(t,bid){const c=t.compliance?.[bid.id];check(c?.lastRun,'Run compliance verification first.');const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));const s=c.lastRun;return `<!doctype html><html><head><meta charset="utf-8"><title>Epsilon X Compliance Report</title><style>body{font:14px/1.5 system-ui;max-width:1100px;margin:32px auto;padding:20px;color:#18304c}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:9px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eef4fa}small{color:#596579}@media print{button{display:none}tr{break-inside:avoid}}</style></head><body><button onclick="print()">Print / Save PDF</button><h1>Epsilon X · Bid compliance report</h1><p>Infinity-X · ${esc(t.id)} · ${esc(bid.name)}</p><p>Generated from verification at ${esc(s.at)}. Score ${s.score??'N/A'}% · Risk ${esc(s.risk)} · Evidence coverage ${s.coverage}%.</p><p>Decision support only. Weights and applicability are demonstration policy. Imported records are user supplied; no live government API was contacted.</p><table><tr><th>Category / weight</th><th>Claim / reference</th><th>Result and explanation</th><th>Evidence / provenance</th></tr>${c.checks.map(x=>{const r=s.results.find(r=>r.category===x.category);return `<tr><td>${esc(CATEGORIES.find(k=>k.id===x.category)?.name)} (${r.weight})</td><td>${esc(x.claim)}<br>${esc(x.observed)}</td><td>${esc(r.result)}<br>${esc(r.reason)}<br>${esc(x.review?.reason)}</td><td>${esc(x.source)} · p.${x.page}<br>${esc(x.excerpt)}<br>${esc(r.provenance)}<br>Applicability basis: ${esc(x.basis)}</td></tr>`}).join('')}</table><h2>Human review</h2><p>${esc(c.decision?.type??'Pending')} · ${esc(c.decision?.actor??'')} · ${esc(c.decision?.reason??'')}</p><h2>Extraction evidence</h2>${c.documents.map(d=>`<p>${esc(d.name)} · ${esc(d.method)} · ${esc(d.at)}<br><small>Original SHA-256: ${esc(d.sourceHash)}<br>Text SHA-256: ${esc(d.textHash)}</small></p>`).join('')}<p>This compliance review is separate from the final procurement award.</p></body></html>`}
