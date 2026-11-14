const M = window.NN_DATA.muscles;
const CASES = window.NN_DATA.cases;
const ROOTS=["C3","C4","C5","C6","C7","C8","T1","L1","L2","L3","L4","L5","S1","S2","S3"];
const FAM=["anterior interosseous","posterior interosseous","musculocutaneous","axillary","suprascapular","long thoracic","dorsal scapular","thoracodorsal","subscapular","pectoral","spinal accessory","nerve to subclavius","radial","median","ulnar","superior gluteal","inferior gluteal","obturator internus","quadratus femoris","piriformis","femoral","obturator","tibial division","peroneal (fibular) division","deep peroneal","superficial peroneal","medial plantar","lateral plantar","tibial","lumbar plexus","dorsal"];
const fam=n=>{const s=n.toLowerCase().replace(/\bpin\b/g,"posterior interosseous").replace(/\bain\b/g,"anterior interosseous");return FAM.find(f=>s.includes(f))||s;};
const LINEAGE={"posterior interosseous":"radial","radial":"radial","anterior interosseous":"median","median":"median","ulnar":"ulnar",
 "deep peroneal":"peroneal","superficial peroneal":"peroneal","peroneal (fibular) division":"peroneal",
 "tibial":"tibial","tibial division":"tibial","medial plantar":"tibial","lateral plantar":"tibial",
 "obturator":"obturator","femoral":"femoral","lumbar plexus":"femoral","axillary":"axillary","musculocutaneous":"musculocutaneous"};
const lin=n=>{const f=fam(n);return LINEAGE[f]||f;};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
function expand(str){const out=new Set();(String(str).match(/[CTLS]\d(?:\s*[–-]\s*[CTLS]?\d)?/g)||[]).forEach(t=>{const m=t.match(/([CTLS])(\d)(?:\s*[–-]\s*([CTLS])?(\d))?/);const a=m[1]+m[2],b=m[4]?((m[3]||m[1])+m[4]):a;const i=ROOTS.indexOf(a),j=ROOTS.indexOf(b);if(i>-1&&j>=i)for(let k=i;k<=j;k++)out.add(ROOTS[k]);else if(i>-1)out.add(a);});return out;}
const main=s=>String(s).replace(/\(.*?\)/g,"").trim();
const setKey=s=>[...s].sort().join(",");
const limbs=M.filter(d=>d.group!=="Axial");

// ---------- storage ----------
const STORE="nnt-v1";
let S={boxes:{},stats:{}};
try{const raw=localStorage.getItem(STORE);if(raw)S=JSON.parse(raw);}catch(e){}
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(S));}catch(e){}};

// ---------- question generators ----------
function pick(pool,n,keyFn,exclude){const seen=new Set(exclude.map(keyFn));const out=[];for(const p of shuffle(pool)){const k=keyFn(p);if(seen.has(k))continue;seen.add(k);out.push(p);if(out.length===n)break;}return out;}
function near(pool,d){const g=pool.filter(o=>o.d?o.d.group===d.group:o.group===d.group);const rest=pool.filter(o=>!g.includes(o));return [...shuffle(g),...shuffle(rest)];}
function pickNear(pool,d,n,keyFn,exclude){const seen=new Set(exclude.map(keyFn));const out=[];for(const p of near(pool,d)){const k=keyFn(p);if(seen.has(k))continue;seen.add(k);out.push(p);if(out.length===n)break;}return out;}
function mc(correct,distractors){const opts=shuffle([correct,...distractors]);return {opts,answer:opts.indexOf(correct)};}
function infoDL(d){return `<dl><dt>Nerve</dt><dd>${esc(d.nerve)}</dd><dt>Plexus path</dt><dd>${esc(d.path)}</dd><dt>Roots</dt><dd class="mono">${esc(d.roots)}</dd>${d.recap?`<dt>PM&amp;R Recap</dt><dd class="mono">${esc(d.recap)}</dd>`:""}<dt>EMG key root</dt><dd class="mono">${esc(d.key)}</dd>${d.mrc&&d.mrc!=="—"?`<dt>MRC 1976</dt><dd class="mono">${esc(d.mrc)}</dd>`:""}</dl>${d.edx?`<p class="note">${esc(d.edx)}</p>`:""}${d.pearl?`<p class="note"><b>Pearl:</b> ${esc(d.pearl)}</p>`:""}${d.vnote?`<p class="note"><b>Sources differ:</b> ${esc(d.vnote)}</p>`:""}`;}
function needleDL(d){const n=d.needle;return `<dl><dt>Position</dt><dd>${esc(n.position)}</dd><dt>Insertion</dt><dd>${esc(n.site)}</dd><dt>Activate</dt><dd>${esc(n.activate)}</dd><dt>If off target</dt><dd>${esc(n.offtarget)}</dd></dl>${n.note?`<p class="note">${esc(n.note)}</p>`:""}<p class="note">Perotto, pp. ${esc(n.page)}</p>`;}
const inRegion=(d,r)=>!r||d.region===r;

const DRILLS={
 nerve:{mode:"inn",title:"Muscle → nerve",desc:"Name the peripheral nerve for each muscle.",
  pool:r=>limbs.filter(d=>inRegion(d,r)).map(d=>({key:"nerve:"+d.id,d})),
  make:({d})=>{const others=limbs.filter(o=>o.region===d.region&&lin(o.nerve)!==lin(d.nerve)&&!(lin(d.nerve)==="obturator"&&/obturator/i.test(o.nerve))&&!(/sciatic|tibial division/i.test(d.nerve)&&/tibial|peroneal|sciatic/i.test(o.nerve))&&!(/tibial|peroneal/i.test(d.nerve)&&/sciatic/i.test(o.nerve)));const ds=pickNear(others,d,3,o=>lin(o.nerve),[d]).map(o=>o.nerve);const {opts,answer}=mc(d.nerve,ds);
   return {q:`Which nerve supplies <b>${esc(d.muscle)}</b>?`,opts,answer,explain:infoDL(d),fam:fam(d.nerve)};}},
 roots:{mode:"inn",title:"Muscle → roots",desc:"Pick the root range (PM&R Recap convention). Values from other sources are never used as wrong answers.",
  pool:r=>limbs.filter(d=>inRegion(d,r)).map(d=>({key:"roots:"+d.id,d})),
  make:({d})=>{const alts=((d.roots.match(/\((.*?)\)/)||[])[1]||"").split(";").map(s=>s.trim()).filter(Boolean);
   const own=new Set([setKey(expand(main(d.roots))),setKey(expand(d.roots)),setKey(expand(d.mrc)),...alts.map(a=>setKey(expand(a))),setKey(expand(d.recap||""))]);
   const cands=limbs.filter(o=>o.region===d.region&&!own.has(setKey(expand(main(o.roots))))&&expand(main(o.roots)).size);
   const ds=pick(cands,3,o=>setKey(expand(main(o.roots))),[]).map(o=>main(o.roots));const correct=main(d.roots);const {opts,answer}=mc(correct,ds);
   return {q:`What are the root values for <b>${esc(d.muscle)}</b>?`,opts,answer,explain:infoDL(d),fam:fam(d.nerve),mono:true};}},
 key:{mode:"inn",title:"Key EMG root",desc:"Which root does this muscle stand for on an EMG screen?",
  pool:r=>limbs.filter(d=>inRegion(d,r)&&/^[CTLS]\d/.test(d.key)).map(d=>({key:"key:"+d.id,d})),
  make:({d})=>{const mine=setKey(expand(d.key));const cands=limbs.filter(o=>o.region===d.region&&/^[CTLS]\d/.test(o.key)&&setKey(expand(o.key))!==mine&&!([...expand(o.key)].every(x=>expand(d.roots).has(x))&&expand(o.key).size===expand(d.key).size&&false));
   const ds=pick(cands.filter(o=>![...expand(o.key)].some(x=>expand(d.key).has(x))),3,o=>setKey(expand(o.key)),[]).map(o=>o.key);const {opts,answer}=mc(d.key,ds);
   return {q:`On needle EMG, <b>${esc(d.muscle)}</b> is mainly used to sample which root?`,opts,answer,explain:infoDL(d),fam:fam(d.nerve),mono:true};}},
 lesion:{mode:"inn",title:"Localize the lesion",desc:"Read an EMG pattern and pick the lesion site: root, plexus or nerve.",
  pool:r=>CASES.filter(c=>inRegion(c,r)).map(c=>({key:"lesion:"+c.id,c})),
  make:({c})=>{const opts=shuffle(c.options);const by=n=>M.find(m=>m.muscle===n)||{};
   const li=a=>a.map(n=>`<li>${esc(n)} <span class="mono" style="color:var(--muted)">${esc((by(n).key||""))}</span></li>`).join("");
   return {q:"Where is the lesion?",pre:`<p class="sub">${esc(c.stem)}</p><div class="emg"><div class="ab"><h3>Abnormal</h3><ul>${li(c.ab)}</ul></div><div class="nl"><h3>Normal</h3><ul>${li(c.nl)}</ul></div></div>`,
    opts,answer:opts.indexOf(c.answer),explain:`<p style="margin:0">${esc(c.why)}</p><dl>${[...c.ab,...c.nl].map(n=>`<dt>${esc(n)}</dt><dd>${esc(by(n).nerve||"")} · <span class="mono">${esc(by(n).key||"")}</span></dd>`).join("")}</dl>`,fam:"cases"};}},
 site:{mode:"ndl",title:"Insertion site",desc:"Choose the correct needle insertion landmark for the muscle.",
  pool:r=>siteRows(r).map(d=>({key:"site:"+d.id,d})),
  make:({d})=>{const ds=pickNear(siteRows(d.region).filter(o=>o.id!==d.id),d,3,o=>cleanSite(o),[d]).map(cleanSite);const {opts,answer}=mc(cleanSite(d),ds);
   return {q:`Where do you insert the needle for <b>${esc(d.muscle)}</b>?`,opts,answer,explain:needleDL(d),fam:fam(d.nerve)};}},
 rsite:{mode:"ndl",title:"Landmark → muscle",desc:"Read a landmark and name the muscle you'd be sampling.",
  pool:r=>siteRows(r).map(d=>({key:"rsite:"+d.id,d})),
  make:({d})=>{const ds=pickNear(siteRows(d.region).filter(o=>o.id!==d.id),d,3,o=>o.muscle,[d]).map(o=>o.muscle);const {opts,answer}=mc(d.muscle,ds);
   return {q:"Which muscle are you sampling?",pre:`<p class="sub"><b>${esc(d.needle.position)}</b> ${esc(cleanSite(d))}</p>`,opts,answer,explain:needleDL(d),fam:fam(d.nerve)};}},
 off:{mode:"ndl",title:"Off target",desc:"You missed. Which muscle is the needle in now?",
  pool:r=>offItems(r),
  make:(it)=>{const others=offItems(it.d.region).filter(x=>x.ans!==it.ans&&!it.siblings.includes(x.ans)&&x.ans.toLowerCase()!==it.d.muscle.toLowerCase()&&!it.ans.toLowerCase().includes(x.ans.toLowerCase())&&!x.ans.toLowerCase().includes(it.ans.toLowerCase()));
   const ds=pickNear(others,it.d,3,o=>o.ans.toLowerCase(),[{ans:it.ans}]).map(o=>o.ans);const {opts,answer}=mc(it.ans,ds);
   return {q:`Needling <b>${esc(it.label)}</b>: if you go <b>${esc(it.dir)}</b>, where are you?`,opts,answer,explain:needleDL(it.d),fam:fam(it.d.nerve)};}},
 act:{mode:"ndl",title:"Activation",desc:"Match the muscle to the maneuver that recruits it.",
  pool:r=>actRows(r).map(d=>({key:"act:"+d.id,d})),
  make:({d})=>{const base=cleanAct(d).toLowerCase().replace(/\.$/,"");const ds=pickNear(actRows(d.region).filter(o=>{const x=cleanAct(o).toLowerCase().replace(/\.$/,"");return o.id!==d.id&&!x.includes(base)&&!base.includes(x);}),d,3,o=>cleanAct(o).toLowerCase(),[d]).map(cleanAct);const {opts,answer}=mc(cleanAct(d),ds);
   return {q:`How do you activate <b>${esc(d.muscle)}</b> once the needle is in?`,opts,answer,explain:needleDL(d),fam:fam(d.nerve)};}},
};
function cleanSite(d){return d.needle.site.replace(/^(Middle deltoid|Lateral head|Medial head|Transverse head|FDI|Major):\s*/,"").replace(/\s*\((iliopsoas site|Perotto gives one site[^)]*|lumbrical number[^)]*)\)/,"");}
function siteRows(r){return limbs.filter(d=>d.needle&&inRegion(d,r)&&!/same |shares|as above|Same point|^Iliopsoas site|Upper:|Minor:/i.test(d.needle.site)&&d.muscle!=="Psoas major");}
function cleanAct(d){return d.needle.activate.replace(/^FDI:\s*/,"");}
function actRows(r){return limbs.filter(d=>d.needle&&inRegion(d,r)&&!/Upper:|Middle:/.test(d.needle.activate));}
const ABBR={APB:"abductor pollicis brevis",APL:"abductor pollicis longus",ECRB:"extensor carpi radialis brevis",ECRL:"extensor carpi radialis longus",ECU:"extensor carpi ulnaris",EDL:"extensor digitorum longus",EHL:"extensor hallucis longus",EPB:"extensor pollicis brevis",EPL:"extensor pollicis longus",FCR:"flexor carpi radialis",FCU:"flexor carpi ulnaris",FDB:"flexor digitorum brevis",FDL:"flexor digitorum longus",FDP:"flexor digitorum profundus",FDS:"flexor digitorum superficialis",FHB:"flexor hallucis brevis",FPL:"flexor pollicis longus",TFL:"tensor fasciae latae",FDI:"first dorsal interosseous",EDB:"extensor digitorum brevis"};
const unabbr=s=>s.replace(/\b[A-Z]{3,4}\b/g,m=>ABBR[m]||m);
let OFF=null;
function offItems(r){
 if(!OFF){OFF=[];limbs.filter(d=>d.needle).forEach(d=>{const cl=d.needle.offtarget.split(/(?<=\.)\s+/);const rows=[];
  cl.forEach((c,i)=>{if(!c.includes("→"))return;const [l,rr]=c.split("→");const low=l.toLowerCase();const t=low.indexOf("too");if(t<0)return;
   const prefix=l.slice(0,t).trim();let ans=unabbr(rr.replace(/\.$/,"").trim());if(/watch|^the /i.test(ans)||ans.length>60)return;
   rows.push({key:`off:${d.id}:${i}`,d,dir:l.slice(t).trim().toLowerCase(),ans,label:prefix&&!/^\d/.test(prefix)?`${d.muscle} (${prefix.toLowerCase()})`:prefix?`${d.muscle} (${prefix})`:d.muscle});});
  rows.forEach(x=>x.siblings=rows.filter(y=>y!==x).map(y=>y.ans));OFF.push(...rows);});}
 return OFF.filter(x=>inRegion(x.d,r));}

// ---------- state & views ----------
let view="inn", region="", session=null;
const mainEl=document.getElementById("main");
document.querySelectorAll("nav button").forEach(b=>b.addEventListener("click",()=>{session=null;view=b.dataset.view;render();}));
function box(k){return S.boxes[k]||0;}
function stat(id){return S.stats[id]||(S.stats[id]={seen:0,right:0});}

function renderHome(mode){
 const isInn=mode==="inn";
 const ids=Object.keys(DRILLS).filter(k=>DRILLS[k].mode===mode);
 mainEl.className=isInn?"inn":"ndl";
 mainEl.innerHTML=`<span class="tag">${isInn?"Mode 1":"Mode 2"}</span><h1>${isInn?"Innervations":"Needle placement"}</h1>
 <p class="lede">${isInn?"Recall nerves and roots, then apply them: read EMG patterns and localize the lesion.":"Find the insertion landmark, know what you hit when you miss, and activate the right muscle. Based on Perotto's landmarks."}</p>
 <div class="chips" role="group" aria-label="Region">${[["","Both limbs"],["Upper","Upper limb"],["Lower","Lower limb"]].map(([v,l])=>`<button class="chip" data-r="${v}" aria-pressed="${region===v}">${l}</button>`).join("")}</div>
 <div class="grid">${ids.map(id=>{const D=DRILLS[id];const pool=D.pool(region);const mastered=pool.filter(p=>box(p.key)>=3).length;const st=stat(id);
   return `<button class="drill" data-d="${id}"><h2>${D.title}</h2><p>${D.desc}</p><div class="meta"><span>${pool.length} items · ${mastered} mastered${st.seen?` · ${Math.round(100*st.right/st.seen)}% correct`:""}</span><span class="go">Start →</span></div></button>`;}).join("")}</div>`;
 mainEl.querySelectorAll(".chip").forEach(c=>c.addEventListener("click",()=>{region=c.dataset.r;render();}));
 mainEl.querySelectorAll(".drill").forEach(c=>c.addEventListener("click",()=>start(c.dataset.d)));
}
function start(id){
 const D=DRILLS[id];let pool=D.pool(region);
 pool=shuffle(pool).sort((a,b)=>box(a.key)-box(b.key)).slice(0,10);
 session={id,items:shuffle(pool).map(p=>({p,qq:D.make(p)})),i:0,picked:null,log:[]};
 render();
}
function renderQuiz(){
 const D=DRILLS[session.id];mainEl.className=D.mode;
 const it=session.items[session.i];const qq=it.qq;const done=session.picked!==null;
 mainEl.innerHTML=`<div class="card"><div class="qtop"><span>${D.title}${region?` · ${region} limb`:""}</span><span class="num">${session.i+1} / ${session.items.length}</span></div>
 <div class="bar" aria-hidden="true"><i style="width:${100*(session.i+(done?1:0))/session.items.length}%"></i></div>
 <p class="q">${qq.q}</p>${qq.pre||""}
 <div class="opts" role="group" aria-label="Answers">${qq.opts.map((o,k)=>{let cls="";if(done){if(k===qq.answer)cls="right";else if(k===session.picked)cls="wrong";}
   return `<button class="opt ${cls}" data-k="${k}" ${done?"disabled":""}><kbd>${k+1}</kbd><span class="${qq.mono?"mono":""}">${esc(o)}</span></button>`;}).join("")}</div>
 ${done?`<div class="fb" role="status"><p class="verdict ${session.picked===qq.answer?"ok":"no"}">${session.picked===qq.answer?"Correct.":"Not quite. The answer is "+esc(qq.opts[qq.answer])+"."}</p>${qq.explain}</div>
 <div class="row"><button class="btn ghost" id="quit">End session</button><button class="btn" id="next">${session.i+1<session.items.length?"Next question":"See results"} <kbd style="font:500 11px var(--mono);opacity:.8">Enter</kbd></button></div>`
 :`<div class="row"><button class="btn ghost" id="quit">End session</button></div>`}</div>`;
 mainEl.querySelectorAll(".opt").forEach(b=>b.addEventListener("click",()=>answer(+b.dataset.k)));
 const n=document.getElementById("next");if(n){n.addEventListener("click",next);n.focus();}
 document.getElementById("quit").addEventListener("click",()=>{session.i=session.items.length;session.picked=null;render();});
}
function answer(k){if(session.picked!==null)return;const it=session.items[session.i];session.picked=k;const ok=k===it.qq.answer;
 S.boxes[it.p.key]=ok?Math.min(box(it.p.key)+1,5):0;const st=stat(session.id);st.seen++;if(ok)st.right++;
 const f=it.qq.fam;if(f){S.fam=S.fam||{};const x=S.fam[f]||(S.fam[f]={seen:0,right:0});x.seen++;if(ok)x.right++;}
 session.log.push({ok,q:it.qq.q.replace(/<[^>]+>/g,""),a:it.qq.opts[it.qq.answer]});save();render();}
function next(){session.i++;session.picked=null;render();}
function renderResults(){
 const D=DRILLS[session.id];mainEl.className=D.mode;const right=session.log.filter(l=>l.ok).length;
 const missed=session.log.filter(l=>!l.ok);
 mainEl.innerHTML=`<div class="card"><span class="tag">${D.title}</span><div class="score">${right} / ${session.log.length}</div>
 <p class="sub">${session.log.length?"Missed items come back sooner next session.":"No questions answered."}</p>
 ${missed.length?`<h2 style="margin:12px 0 8px">Review</h2><ul class="review">${missed.map(m=>`<li>${esc(m.q)} <b>${esc(m.a)}</b></li>`).join("")}</ul>`:""}
 <div class="row"><button class="btn ghost" id="home">Back to ${D.mode==="inn"?"Innervations":"Needle placement"}</button><button class="btn" id="again">Another 10</button></div></div>`;
 document.getElementById("home").addEventListener("click",()=>{session=null;view=D.mode;render();});
 document.getElementById("again").addEventListener("click",()=>start(session.id));
}
const FAMLABEL={"dorsal":"Dorsal rami (paraspinals)","peroneal (fibular) division":"Sciatic – peroneal division","tibial division":"Sciatic – tibial division","cases":"Localization cases"};
function renderProgress(){
 mainEl.className="inn";
 const rows=Object.keys(DRILLS).map(id=>{const D=DRILLS[id];const pool=D.pool("");const m=pool.filter(p=>box(p.key)>=3).length;const st=stat(id);
  return `<tr><td>${D.mode==="inn"?"Innervations":"Needle"}</td><td>${D.title}</td><td class="num">${st.seen?Math.round(100*st.right/st.seen)+"%":"—"}</td><td><div class="meter" title="${m} of ${pool.length} mastered"><i style="width:${100*m/pool.length}%"></i></div></td><td class="num">${m}/${pool.length}</td></tr>`;}).join("");
 const fams=Object.entries(S.fam||{}).filter(([k,v])=>v.seen>=2).map(([k,v])=>({k,acc:v.right/v.seen,seen:v.seen})).sort((a,b)=>a.acc-b.acc);
 mainEl.innerHTML=`<span class="tag">Progress</span><h1>Where you stand</h1><p class="lede">An item counts as mastered after three correct answers in a row. Weakest areas are listed first.</p>
 <div class="card" style="overflow-x:auto"><table class="stats"><thead><tr><th>Mode</th><th>Drill</th><th>Accuracy</th><th>Mastery</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
 <h2 style="margin:20px 0 10px">By nerve</h2>
 <div class="card">${fams.length?`<table class="stats"><thead><tr><th>Nerve</th><th>Accuracy</th><th>Answered</th></tr></thead><tbody>${fams.map(f=>`<tr><td style="text-transform:capitalize">${esc(FAMLABEL[f.k]||f.k)}</td><td><div class="meter"><i style="width:${100*f.acc}%"></i></div> <span class="num">${Math.round(100*f.acc)}%</span></td><td class="num">${f.seen}</td></tr>`).join("")}</tbody></table>`:`<p class="sub" style="margin:0">Answer a few questions in any drill and your weakest nerves will show up here.</p>`}</div>
 <div class="row"><button class="btn ghost" id="reset">Reset progress</button></div>`;
 document.getElementById("reset").addEventListener("click",e=>{if(e.target.dataset.confirm){S={boxes:{},stats:{}};save();render();}else{e.target.dataset.confirm="1";e.target.textContent="Click again to erase all progress";}});
}
function render(){
 document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.view===view?"page":"false"));
 if(session&&session.i<session.items.length)renderQuiz();else if(session)renderResults();else if(view==="prog")renderProgress();else renderHome(view);
 window.scrollTo&&window.scrollTo(0,0);
}
document.addEventListener("keydown",e=>{if(!session||session.i>=session.items.length)return;if(session.picked===null&&/^[1-4]$/.test(e.key))answer(+e.key-1);else if(session.picked!==null&&e.key==="Enter"){e.preventDefault();next();}});
render();

// ---------- PWA: service worker, updates, install ----------
(function(){
  const upd=document.getElementById("updBanner"), inst=document.getElementById("installBanner"), ios=document.getElementById("iosBanner");
  const standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
  let dismissed={};try{dismissed=JSON.parse(localStorage.getItem("nnt-dismiss")||"{}");}catch(e){}
  const dismiss=k=>{dismissed[k]=1;try{localStorage.setItem("nnt-dismiss",JSON.stringify(dismissed));}catch(e){}};
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").then(reg=>{
      const showUpdate=w=>{upd.classList.add("on");document.getElementById("updNow").onclick=()=>w.postMessage("skipWaiting");};
      if(reg.waiting&&navigator.serviceWorker.controller)showUpdate(reg.waiting);
      reg.addEventListener("updatefound",()=>{const w=reg.installing;w&&w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller)showUpdate(w);});});
      setInterval(()=>reg.update().catch(()=>{}),60*60*1000);
    }).catch(()=>{});
    const hadController=!!navigator.serviceWorker.controller;let reloaded=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(reloaded||!hadController)return;reloaded=true;location.reload();});
  }
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
  let deferred=null;
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;if(!standalone&&!dismissed.install)inst.classList.add("on");});
  document.getElementById("installNow").onclick=async()=>{if(!deferred)return;deferred.prompt();try{await deferred.userChoice;}catch(e){}deferred=null;inst.classList.remove("on");};
  document.getElementById("installLater").onclick=()=>{inst.classList.remove("on");dismiss("install");};
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  if(isIOS&&!standalone&&!dismissed.ios)ios.classList.add("on");
  document.getElementById("iosLater").onclick=()=>{ios.classList.remove("on");dismiss("ios");};
  window.addEventListener("appinstalled",()=>inst.classList.remove("on"));
})();
