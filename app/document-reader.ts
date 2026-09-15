export async function readDocument(file:File,ocr:boolean,progress:(s:string)=>void){
 if(file.size>3*1024*1024)throw Error('Choose a file up to 3 MB.');
 const bytes=await file.arrayBuffer();const sourceHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
 let pages:{page:number,text:string}[]=[],method='Text file';
 if(file.type==='application/pdf'&&!ocr){progress('Extracting PDF text…');const form=new FormData();form.set('file',file);const res=await fetch('/api/compliance/parse',{method:'POST',body:form});const d=await res.json();if(!res.ok)throw Error(d.error);if(d.needsOcr)throw Error('This PDF needs OCR. Enable scanned document OCR and retry.');pages=d.pages;method='PDF text'}
 else if(file.type.startsWith('image/')||(file.type==='application/pdf'&&ocr)){
  if(!ocr)throw Error('Enable OCR to read an image.');progress('Loading English OCR engine…');
  const {createWorker}=await import('tesseract.js');const worker=await createWorker('eng',1,{logger:m=>progress(m.status+' '+Math.round((m.progress||0)*100)+'%')});
  try{if(file.type==='application/pdf'){
   const pdfjs=await import('pdfjs-dist');const workerUrl=(await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
   const pdf=await pdfjs.getDocument({data:new Uint8Array(bytes)}).promise;
   try{if(pdf.numPages>10)throw Error('OCR is limited to 10 pages per file. Split the document first.');for(let n=1;n<=pdf.numPages;n++){progress('OCR page '+n+' of '+pdf.numPages);const p=await pdf.getPage(n);const viewport=p.getViewport({scale:1.6});if(viewport.width*viewport.height>16000000)throw Error('Page image too large for OCR.');const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await p.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;const result=await worker.recognize(canvas);pages.push({page:n,text:result.data.text.slice(0,30000)});canvas.width=0;canvas.height=0}}
   finally{await pdf.destroy()}
  }else{const result=await worker.recognize(file);pages=[{page:1,text:result.data.text.slice(0,30000)}]}}
  finally{await worker.terminate()}method='Browser OCR';
 }else if(/\.(txt|csv)$/i.test(file.name)){pages=[{page:1,text:new TextDecoder().decode(bytes).slice(0,30000)}]}
 else throw Error('Extraction supports PDF, PNG, JPEG, TXT and CSV. Other originals can be uploaded through Tender Documents.');
 if(!pages.some(p=>p.text.trim()))throw Error('No text detected. Try a clearer scan or manual transcription.');
 return {name:file.name,sourceHash,pages,method};
}
