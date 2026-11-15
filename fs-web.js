(()=>{if(window.ccsApp||!('showDirectoryPicker' in window))return;
const DB='inkfold-folders';
const hdb=()=>new Promise(r=>{try{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>q.result.createObjectStore('h');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
const TEST=!!window.__inkfoldTestPick,TM=new Map(),TK={exp:'exports',ws:'workspace'};
async function hget(k){if(TEST){if(TM.has(k))return TM.get(k);const f=JSON.parse(sessionStorage.getItem('ink-test-h')||'{}');if(!f[k])return null;let h=await window.__inkfoldTestPick(TK[k]);if(f[k]!=='.')h=await h.getDirectoryHandle(f[k]);TM.set(k,h);return h}const d=await hdb();if(!d)return null;return new Promise(r=>{const q=d.transaction('h').objectStore('h').get(k);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)})}
async function hset(k,v){if(TEST){const f=JSON.parse(sessionStorage.getItem('ink-test-h')||'{}');if(v==null){TM.delete(k);delete f[k]}else{TM.set(k,v);f[k]=v.name.endsWith('-dir')?'.':v.name}sessionStorage.setItem('ink-test-h',JSON.stringify(f));return true}const d=await hdb();if(!d)return false;return new Promise(r=>{const t=d.transaction('h','readwrite'),st=t.objectStore('h');v==null?st.delete(k):st.put(v,k);t.oncomplete=()=>r(true);t.onerror=()=>r(false)})}
const roots=new Map();let n=0;
function tok(h){for(const[k,v]of roots)if(v===h)return k;const k=h.name+'⁠'.repeat(++n);roots.set(k,h);return k}
async function perm(h,ask){if(!h.queryPermission)return true;const o={mode:'readwrite'};if(await h.queryPermission(o)==='granted')return true;if(!ask)return false;try{return(await h.requestPermission(o))==='granted'}catch(e){return false}}
const pick=id=>window.__inkfoldTestPick?window.__inkfoldTestPick(id):window.showDirectoryPicker({mode:'readwrite',id});
async function at(root,rel,create){const h=roots.get(root);if(!h)throw new Error('folder not allowed');const parts=String(rel||'').split('/').filter(Boolean);let d=h;for(const p of parts.slice(0,-1))d=await d.getDirectoryHandle(p,{create});return[d,parts[parts.length-1]]}
function download(name,buf){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buf]));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const note=m=>{try{toast(m,null,7000)}catch(e){}};
window.ccsApp={shell:'web',
 async saveFile(name,buf){const h=await hget('exp');if(h&&await perm(h,true)){try{let nm=name,i=1;const dot=name.lastIndexOf('.'),base=dot>0?name.slice(0,dot):name,ext=dot>0?name.slice(dot):'';
   while(true){try{await h.getFileHandle(nm);nm=`${base} (${i++})${ext}`}catch(e){break}}const f=await h.getFileHandle(nm,{create:true}),w=await f.createWritable();await w.write(buf);await w.close();return{ok:true,dirName:h.name,name:nm}}catch(e){return{ok:false,error:String(e&&e.message||e)}}}
  download(name,buf);await new Promise(r=>setTimeout(r,300));return{ok:true,browser:true}},
 async getFolder(){const h=await hget('exp');return h?h.name:'Downloads'},
 async chooseFolder(){try{const h=await pick('exports');await hset('exp',h);return h.name}catch(e){return null}},
 reveal(){note('Open that folder in Finder or File Explorer to see your files.')},
 ws:{async get(){const h=await hget('ws');if(!h)return null;if(await perm(h,false))return tok(h);window.__wsReconnect=async()=>{if(await perm(h,true))location.reload()};return null},
     async choose(){try{let h=await pick('workspace');let has=false;try{await h.getFileHandle('workspace.json');has=true}catch(e){}if(!has&&h.name!=='Inkfold Workspace')h=await h.getDirectoryHandle('Inkfold Workspace',{create:true});await hset('ws',h);return tok(h)}catch(e){return null}},
     async clear(){await hset('ws',null);return true}},
 async pickDir(){try{return tok(await pick('backups'))}catch(e){return null}},
 fs:{async read(r,p){try{const[d,n]=await at(r,p,false);const f=await(await d.getFileHandle(n)).getFile();return new Uint8Array(await f.arrayBuffer())}catch(e){return null}},
     async write(r,p,data){const[d,n]=await at(r,p,true);const w=await(await d.getFileHandle(n,{create:true})).createWritable();await w.write(typeof data==='string'?data:new Uint8Array(data));await w.close();return p},
     async stat(r,p){try{const[d,n]=await at(r,p,false);return(await(await d.getFileHandle(n)).getFile()).lastModified}catch(e){return null}},
     async list(r,p){try{const h=roots.get(r);let d=h;for(const x of String(p||'').split('/').filter(Boolean))d=await d.getDirectoryHandle(x);const o=[];for await(const k of d.keys())o.push(k);return o}catch(e){return[]}},
     async remove(r,p){try{const[d,n]=await at(r,p,false);await d.removeEntry(n);return true}catch(e){return false}},
     async mkdir(r,p){const h=roots.get(r);let d=h;for(const x of String(p||'').split('/').filter(Boolean))d=await d.getDirectoryHandle(x,{create:true});return r+'/'+p}}};
})();
