"use strict";
// Ridgeline – 15-setlog.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- Setlog (strength, cardio and bodyweight logger, in ./setlog/) ---------- */
// Setlog by Jake (github.com/Jakefp/Workout), used with permission. It keeps its own IndexedDB
// database "setlog" on this same site; Ridgeline only reads it, apart from backup restore.
const SL_DB="setlog", SL_STORES=["exercises","routines","sessions","weights","meta"];
let slCache={ok:false,weights:[],sessions:[],ex:new Map(),last:0};
function slOpen(create){
  return new Promise((res,rej)=>{
    let req;
    try{req=create?indexedDB.open(SL_DB,1):indexedDB.open(SL_DB)}catch(e){return rej(e)}
    req.onupgradeneeded=()=>{
      if(!create){req.transaction.abort();return} // never create Setlog's database from here
      const db=req.result;
      for(const s of SL_STORES)if(!db.objectStoreNames.contains(s))db.createObjectStore(s,{keyPath:s==="weights"?"date":(s==="meta"?"key":"id")});
    };
    req.onsuccess=()=>res(req.result);
    req.onerror=()=>rej(req.error||new Error("no setlog"));
  });
}
async function slReadAll(){
  let db; try{db=await slOpen(false)}catch(e){return null}
  try{
    if(!SL_STORES.every(s=>db.objectStoreNames.contains(s)))return null;
    const t=db.transaction(SL_STORES,"readonly"), out={};
    await Promise.all(SL_STORES.map(s=>new Promise((res,rej)=>{const r=t.objectStore(s).getAll();r.onsuccess=()=>{out[s]=r.result;res()};r.onerror=()=>rej(r.error)})));
    return out;
  }finally{db.close()}
}
async function slReplaceAll(data){
  const db=await slOpen(true);
  try{await new Promise((res,rej)=>{const t=db.transaction(SL_STORES,"readwrite");
    for(const s of SL_STORES){const st=t.objectStore(s);st.clear();(data[s]||[]).forEach(r=>st.put(r))}
    t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})}
  finally{db.close()}
}
// Score a set the way Setlog's README defines "best" (weights kg×reps, holds time, bodyweight reps×(bw+kg), steady distance).
function slScore(ex,s,bw){
  const n=v=>v==null||v===""?0:+v, kg=n(s.kg), reps=n(s.reps), time=n(s.time);
  switch(ex&&ex.type){
    case "weight":return kg&&reps?kg*reps:0;
    case "bodyweight":return reps?reps*(bw+kg):0;
    case "hold":case "stretch":return time;
    case "interval":return n(s.watts)?n(s.watts)*time/60:time;
    case "steady":return n(s.dist)||time;
  }
  return 0;
}
const SL_EFFORT_RPE={1:3,2:5,3:6,4:8,5:9};
function slKind(sess,exMap){
  const ty=sess.items.map(it=>exMap.get(it.exId)).filter(Boolean);
  if(ty.some(e=>e.type==="weight"||e.type==="bodyweight"||e.type==="hold"))return "strength";
  const card=ty.filter(e=>e.type==="steady"||e.type==="interval");
  if(card.some(e=>e.modality==="bike"))return "bike";
  if(card.some(e=>e.modality==="run"||e.modality==="walk"))return "run";
  return ty.length?"other":null;
}
function slActivity(sess,data,exMap){
  const kind=slKind(sess,exMap); if(!kind||kind==="run")return null; // runs come from Garmin
  const start=new Date(sess.start), secs=Math.min(3*3600,Math.max(0,Math.round(((sess.end||sess.start)-sess.start)/1000)));
  const bwRow=data.weights.filter(w=>w.date<=iso(start)).sort((a,b)=>a.date<b.date?-1:1).pop(), bw=bwRow?bwRow.kg:75;
  let sets=0, volume=0, km=0; const prs=[];
  for(const it of sess.items){
    const ex=exMap.get(it.exId); sets+=it.sets.length;
    it.sets.forEach(s=>{if(ex&&ex.type==="weight"&&s.kg&&s.reps)volume+=s.kg*s.reps;if(s.dist)km+=+s.dist});
    const best=Math.max(0,...it.sets.map(s=>slScore(ex,s,bw)));
    const prev=data.sessions.filter(o=>o.id!==sess.id&&o.end&&o.start<sess.start&&o.items.some(x=>x.exId===it.exId));
    if(best&&prev.length){const pb=Math.max(0,...prev.flatMap(o=>o.items.filter(x=>x.exId===it.exId).flatMap(x=>x.sets.map(s=>slScore(ex,s,bw)))));if(best>pb&&ex)prs.push(ex.name)}
  }
  return {start,date:iso(start),key:"setlog:"+sess.id,km:Math.round(km*100)/100,secs,ascent:null,sport:kind==="bike"?"bike":"strength",
    rpe:sess.effort?SL_EFFORT_RPE[sess.effort]:null,src:"Setlog",
    sl:{id:sess.id,name:sess.name,sets,volume:Math.round(volume),prs:[...new Set(prs)],kind,routineId:sess.routineId||null}};
}
let slBusy=false;
async function slSync(){
  if(slBusy||!state.settings)return; slBusy=true;
  try{
    const data=await slReadAll(); if(!data){slCache.ok=false;return}
    const exMap=new Map(data.exercises.map(e=>[e.id,e]));
    slCache={ok:true,weights:data.weights.slice().sort((a,b)=>a.date<b.date?-1:1),sessions:data.sessions,ex:exMap,last:Date.now()};
    const rmap=(()=>{try{return JSON.parse(localStorage.getItem("ridgeline-routines"))||{}}catch(e){return {}}})();
    const keyOfRoutine=Object.fromEntries(Object.entries(rmap).map(([k,v])=>[v,k]));
    let linked=0, extra=0, review=0;
    state.pending=state.pending||[];
    data.sessions.filter(s=>s.end).sort((a,b)=>a.start-b.start).forEach(sess=>{
      const a=slActivity(sess,data,exMap); if(!a)return;
      if(a.date<plan[0].mon||alreadyImported(a)||state.pending.some(p=>p.key===a.key))return;
      const cand=candidates(a);
      // A session started from Ridgeline knows which planned session it was (Strength A/B or bike).
      const k=keyOfRoutine[sess.routineId];
      const planned=k?cand.find(s=>k.startsWith("custom-")?s.id===k.slice(7):k==="bike"?s.type==="bike":s.title==="Strength "+k.split("-")[1]):null; // works for strength- and strength2- keys
      const same=cand.filter(s=>s.date===a.date);
      const hit=planned||(same.length?same[0]:null);
      if(hit){linkActivity(a,hit.id);logEvent("setlog_link",{id:hit.id,setlog:sess.id,sets:a.sl.sets});linked++}
      else if(cand.length){state.pending.push(Object.assign({},a,{start:a.start.toISOString()}));review++}
      else{(state.extras=state.extras||[]).push({key:a.key,date:a.date,km:a.km,secs:a.secs,ascent:null,sport:a.sport,sl:a.sl});logEvent("setlog_extra",{date:a.date,setlog:sess.id});extra++}
    });
    if(linked||review||extra){save();const b=[];if(linked)b.push(linked+" ticked off");if(review)b.push(review+" to match");if(extra)b.push(extra+" extra");toast("Setlog: "+b.join(", "))}
  }catch(e){}
  finally{slBusy=false;render()}
}

const phaseOf=s=>{const w=plan.find(w=>w.w===s.week);return w?(w.cut&&w.phase!=="Taper"?"Recovery":w.phase):""};
function slHandoff(s){
  if(s.type==="bike")return {key:"bike",routineName:"Ridgeline · Zone 2 ride",items:[{name:"Zone 2 Bike",type:"steady",category:"Cardio",muscles:["Cardio"],modality:"bike",sets:1,time:(s.mins||60)*60,rest:0}]};
  const v=(s.title.match(/Strength ([AB])/)||[])[1]||"A", ph=phaseOf(s);
  const items=(s.exercises||[]).map(e=>Object.assign({name:e.name,type:e.type,category:e.cat,muscles:e.mus,perSide:e.side,sets:e.sets,rest:e.type==="hold"?45:75},e.time!=null?{time:e.time}:{reps:e.reps}));
  const custom=state.exOver&&state.exOver[s.id];
  const loc=s.loc||"home", eq=[...kitFor(s)].sort().join("+")||"none";
  return custom?{key:"custom-"+s.id,routineName:"Ridgeline · Strength "+v+" · "+LOC_NAME[loc]+" · "+fmtShort(s.date),items}
    :{key:"strength2-"+v+"-"+ph.toLowerCase()+"-"+loc+"-"+eq,routineName:"Ridgeline · Strength "+v+(ph?" · "+ph:"")+" · "+LOC_NAME[loc],items};
}
// Keep Setlog's week plan filled with the next four weeks of Ridgeline strength and bike sessions.
function slPlanSync(){
  if(!state.settings||!plan.length)return;
  const t=todayIso(), until=iso(addDays(new Date(),28));
  const entries=allSessions().filter(s=>(s.type==="strength"||s.type==="bike")&&s.date>=t&&s.date<=until&&!sessStatus(s))
    .map(s=>Object.assign(slHandoff(s),{date:s.date}));
  try{localStorage.setItem("ridgeline-plan",JSON.stringify({at:Date.now(),today:t,entries}))}catch(e){}
}
function openInSetlog(id){
  const s=findS(id); if(!s)return;
  const h=Object.assign(slHandoff(s),{at:Date.now(),date:s.date,start:s.date===todayIso()});
  try{localStorage.setItem("ridgeline-handoff",JSON.stringify(h))}catch(e){toast("Couldn’t hand the session over");return}
  logEvent("setlog_open",{id});save();
  location.href="setlog/#/train";
}
const slButton=s=>(s.type==="strength"||s.type==="bike")&&!sessStatus(s)?'<button class="btn" data-setlog="'+s.id+'">Log it in Setlog</button>':'';
function slDetail(L){
  if(!L||!L.sl)return "";
  const x=L.sl;
  return '<div class="tip" style="margin-bottom:16px"><b>Logged in Setlog</b><br>'+x.sets+' sets'+(x.volume?' · '+x.volume.toLocaleString("en-GB")+' kg lifted':'')+(L.secs?' · '+Math.round(L.secs/60)+' min':'')+(x.prs.length?'<br>New best: '+esc(x.prs.join(", ")):'')+'</div>';
}
function strengthBlock(from,to){
  const rows=[];
  allSessions().forEach(s=>{const L=state.log[s.id];if(L&&L.sl&&s.date>=from&&s.date<=to)rows.push({date:s.date,sl:L.sl,secs:L.secs})});
  (state.extras||[]).forEach(x=>{if(x.sl&&x.date>=from&&x.date<=to)rows.push({date:x.date,sl:x.sl,secs:x.secs})});
  const w=slCache.weights.filter(x=>x.date>=from&&x.date<=to);
  if(!rows.length&&!w.length)return "";
  const sets=rows.reduce((a,r)=>a+r.sl.sets,0), vol=rows.reduce((a,r)=>a+(r.sl.volume||0),0), mins=Math.round(rows.reduce((a,r)=>a+(r.secs||0),0)/60);
  const prs=[...new Set(rows.flatMap(r=>r.sl.prs))];
  const stat=(v,l)=>'<div class="stat"><div class="v">'+v+'</div><div class="l">'+l+'</div></div>';
  let bw="";
  if(w.length){const a=w[0].kg,b=w[w.length-1].kg,d=b-a;bw='<p class="note" style="margin:10px 0 0">Bodyweight: '+b.toFixed(1)+' kg'+(w.length>1?' ('+(d>0?'+':'')+d.toFixed(1)+' kg over '+w.length+' weigh-ins)':'')+'.</p>'}
  return '<section class="block"><h2>Strength and cross-training</h2>'+(rows.length?'<div class="stats" style="margin-top:0">'+stat(rows.length,"Setlog sessions")+stat(sets,"sets")+stat(vol?vol.toLocaleString("en-GB"):"–","kg lifted")+stat(mins,"minutes")+'</div>':'')+
    '<div class="card" style="margin-top:10px">'+(prs.length?'<p style="margin:0"><b>New bests:</b> '+esc(prs.join(", "))+'</p>':rows.length?'<p class="note" style="margin:0">No new personal bests this time – consistency is what counts for injury prevention.</p>':'')+bw+'</div></section>';
}
function setlogCard(){
  return '<section class="block"><h2>Strength logging</h2><div class="card"><p style="margin-top:0">Strength and bike sessions open in <b>Setlog</b>, a full set-by-set logger with personal bests, history and bodyweight tracking. Finished sessions tick off here automatically, with sets, kg lifted, time and effort.</p>'+
    '<p class="note" style="margin-top:0">'+(slCache.ok?'Last read '+ago(slCache.last)+' · '+slCache.sessions.filter(s=>s.end).length+' sessions in Setlog.':'Nothing logged in Setlog yet.')+'</p>'+
    '<a class="btn" href="setlog/#/train">Open Setlog</a>'+
    '<p class="note" style="margin:14px 0 0">Setlog is by Jake (<a href="https://github.com/Jakefp/Workout">github.com/Jakefp/Workout</a>), included with his permission.</p></div></section>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-setlog]");if(b){e.preventDefault();openInSetlog(b.dataset.setlog)}});
addEventListener("pageshow",()=>slSync());
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")slSync()});

document.addEventListener("change",e=>{
  const sel=e.target.closest("[data-exswap]"); if(!sel)return;
  const [sid,slot]=sel.dataset.exswap.split("|"); state.exOver=state.exOver||{};
  const o=state.exOver[sid]=state.exOver[sid]||{}; o[slot]=sel.value;
  logEvent("exercise_swap",{id:sid,slot:+slot,to:sel.value}); save(); rebuild(); render(); sheetFor(sid,false); toast("Swapped to "+XL[sel.value].name);
});
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-exreset]"); if(!b)return;
  delete state.exOver[b.dataset.exreset]; logEvent("exercise_reset",{id:b.dataset.exreset}); save(); rebuild(); render(); sheetFor(b.dataset.exreset,false); toast("Back to the planned exercises");
});

function locSwitch(s){
  if(s.type!=="strength"||sessStatus(s))return "";
  return '<div class="locsw" role="group" aria-label="Where are you training?">'+["home","gym"].map(l=>'<button type="button" data-loc="'+s.id+'|'+l+'" aria-pressed="'+(s.loc===l)+'">'+(l==="home"?"At home":"At the gym")+'</button>').join("")+'</div>';
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-loc]"); if(!b)return;
  const [sid,l]=b.dataset.loc.split("|"); const s=findS(sid); if(!s||s.loc===l)return;
  state.loc=state.loc||{}; state.loc[sid]=l;
  if(state.exOver)delete state.exOver[sid]; // swaps were for the other kit
  logEvent("strength_location",{id:sid,loc:l}); save(); rebuild(); render();
  if($("#sheet").classList.contains("show"))sheetFor(sid,false);
  toast(l==="home"?"Home workout: dumbbells and bands":"Gym workout");
});
