"use strict";
// Ridgeline – 14-garmin.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- intervals.icu bridge (Garmin sync) ---------- */
const ICU_BASE="https://intervals.icu/api/v1/athlete/0", ICU_KEY="ridgeline-icu";
// Kept apart from the main state so the API key never lands in backups or exports.
function icuLoad(){try{return JSON.parse(localStorage.getItem(ICU_KEY))||null}catch(e){return null}}
function icuSave(o){try{o?localStorage.setItem(ICU_KEY,JSON.stringify(o)):localStorage.removeItem(ICU_KEY)}catch(e){}}
async function icuFetch(path,opts,key){
  opts=opts||{}; key=key||(icuLoad()||{}).key;
  let r;
  try{r=await fetch(ICU_BASE+path,{method:opts.method||"GET",body:opts.body?JSON.stringify(opts.body):undefined,
    headers:Object.assign({Authorization:"Basic "+btoa("API_KEY:"+key),Accept:"application/json"},opts.body?{"Content-Type":"application/json"}:{})})}
  catch(e){throw new Error("offline")}
  if(r.status===401||r.status===403)throw new Error("auth");
  if(r.status===429)throw new Error("busy");
  if(!r.ok)throw new Error("http "+r.status);
  const t=await r.text(); return t?JSON.parse(t):null;
}
const icuErr=e=>e.message==="auth"?"intervals.icu didn’t accept that API key – check it and try again":e.message==="offline"?"Couldn’t reach intervals.icu – check your connection":e.message==="busy"?"intervals.icu is busy – try again in a minute":"intervals.icu sync failed ("+e.message+")";
const ICU_RUN=new Set(["Run","TrailRun","VirtualRun","Hike"]), ICU_BIKE=new Set(["Ride","VirtualRide","GravelRide","MountainBikeRide","EBikeRide","EMountainBikeRide"]);
function icuMap(x){
  const sport=ICU_RUN.has(x.type)?"run":ICU_BIKE.has(x.type)?"bike":x.type==="WeightTraining"?"strength":null;
  if(!sport||!x.start_date_local)return null;
  if(x.distance==null&&x.moving_time==null)return null; // Strava-sourced stub
  const start=new Date(x.start_date_local);
  if(isNaN(start))return null;
  return {start,date:iso(start),key:String(start.getTime()),km:Math.round((x.distance||0)/10)/100,secs:Math.round(x.moving_time||0),
    ascent:x.total_elevation_gain!=null?Math.round(x.total_elevation_gain):null,sport,rpe:x.icu_rpe||null,icuId:x.id,src:"Garmin via intervals.icu"};
}
let icuBusy=false;
async function icuSync(force){
  const c=icuLoad(); if(!c||!state.settings||icuBusy)return;
  if(!force&&Date.now()-(c.lastPull||0)<10*60*1000)return;
  if(!navigator.onLine&&!force)return;
  icuBusy=true; if(force)toast("Syncing with intervals.icu…");
  try{
    const t=todayIso(), floor=iso(addDays(new Date(),-90));
    let oldest=c.lastPull?iso(addDays(new Date(c.lastPull),-3)):plan[0].mon;
    if(oldest<plan[0].mon)oldest=plan[0].mon; if(oldest<floor)oldest=floor;
    const acts=await icuFetch("/activities?oldest="+oldest+"&newest="+t+"&fields=id,start_date_local,type,distance,moving_time,total_elevation_gain,icu_rpe,source")||[];
    let linked=0, extra=0, review=0, stubs=0;
    state.pending=state.pending||[];
    acts.sort((a,b)=>(a.start_date_local||"")<(b.start_date_local||"")?-1:1).forEach(x=>{
      const a=icuMap(x);
      if(!a){if(x.source==="STRAVA"||(x.distance==null&&x.moving_time==null))stubs++;return}
      if(a.date<plan[0].mon||alreadyImported(a)||state.pending.some(p=>p.key===a.key))return;
      const cand=candidates(a), same=cand.filter(s=>s.date===a.date);
      if(same.length){linkActivity(a,same[0].id);logEvent("icu_link",{id:same[0].id,km:a.km,secs:a.secs,icu:a.icuId});linked++}
      else if(cand.length){state.pending.push(Object.assign({},a,{start:a.start.toISOString()}));review++}
      else{(state.extras=state.extras||[]).push({key:a.key,date:a.date,km:a.km,secs:a.secs,ascent:a.ascent,sport:a.sport});logEvent("icu_extra",{date:a.date,km:a.km,icu:a.icuId});extra++}
    });
    c.lastPull=Date.now(); c.stubs=stubs; c.error=null; icuSave(c); save();
    let pushed=null;
    if(c.push&&(force||Date.now()-(c.lastPush||0)>6*3600*1000))pushed=await icuPush();
    const bits=[]; if(linked)bits.push(linked+" ticked off"); if(review)bits.push(review+" to match"); if(extra)bits.push(extra+" extra"); if(pushed)bits.push(pushed+" sent to your watch");
    if(bits.length)toast("Garmin: "+bits.join(", ")); else if(force)toast("Up to date");
  }catch(e){const c2=icuLoad();if(c2){c2.error=icuErr(e);icuSave(c2)}if(force)toast(icuErr(e))}
  finally{icuBusy=false;render()}
}
// ---- planned sessions → intervals.icu calendar → Garmin Connect → watch ----
function icuSteps(s){
  const out=[];
  if(s.type==="bike")return ["- "+s.mins+"m Z2 HR"];
  if(s.type==="easy"||s.type==="long"||s.type==="b2b"){
    out.push("- "+s.km+"km Z2 HR");
    if(s.steps.some(([a])=>/strides/i.test(a)))out.push("","4x","- 20s Z5 HR","- 60s Z1 HR");
    return out;
  }
  for(const [a] of s.steps){
    let m;
    if((m=a.match(/^Warm up (\d+)/i)))out.push("- "+m[1]+"m Z2 HR");
    else if((m=a.match(/^Cool down (\d+)/i)))out.push("","- "+m[1]+"m Z1 HR");
    else if((m=a.match(/^(\d+) min tempo/i)))out.push("","- "+m[1]+"m Z3 HR");
    else if((m=a.match(/^(\d+) × (\d+)(s| min| km|m)\b(.*)$/))){
      const reps=m[1], n=+m[2], u=m[3], rest=m[4]||"";
      const dur=u==="s"?n+"s":u===" min"?n+"m":u===" km"?n+"km":n+"mtr";
      const off=rest.match(/(\d+) min off/);
      const rec=off?off[1]+"m":u==="s"&&n<=15?"90s":u===" min"&&n>=3?"3m":u==="s"?"2m":"90s";
      const zone=u==="s"&&n<=15?"Z5":"Z4";
      out.push("",reps+"x","- "+dur+" "+zone+" HR","- "+rec+" Z1 HR");
    }
  }
  return out.length?out:["- "+(s.km||5)+"km Z2 HR"];
}
function icuEvent(s){
  const run=TYPES[s.type].run, type=s.type==="strength"?"WeightTraining":s.type==="bike"?"Ride":"Run";
  let desc=s.summary+"\n"+s.effort+"\n\n";
  if(s.type==="strength")desc+=s.steps.map(([a,b])=>a+(b?": "+b:"")).join("\n");
  else if(s.type!=="race")desc+=icuSteps(s).join("\n");
  return {category:"WORKOUT",start_date_local:s.date+"T00:00:00",type,name:s.title,description:desc,external_id:"ridgeline-"+s.id,
    moving_time:Math.round(run?(s.km||5)*6.3*60:(s.mins||45)*60)};
}
async function icuPush(){
  const c=icuLoad(); if(!c)return 0;
  const t=todayIso(), until=iso(addDays(new Date(),14));
  const up=allSessions().filter(s=>s.date>=t&&s.date<=until&&!sessStatus(s));
  const evs=up.map(icuEvent);
  if(evs.length)await icuFetch("/events/bulk?upsert=true",{method:"POST",body:evs});
  const now=new Set(evs.map(e=>e.external_id));
  const stale=(c.pushed||[]).filter(x=>{if(now.has(x))return false;const s=findS(x.replace(/^ridgeline-/,""));if(!s)return true;if(sessStatus(s))return false;return s.date>until});
  if(stale.length)await icuFetch("/events/bulk-delete",{method:"PUT",body:stale.map(x=>({external_id:x}))});
  c.pushed=[...new Set((c.pushed||[]).filter(x=>!stale.includes(x)).concat([...now]))].slice(-400);
  c.lastPush=Date.now(); icuSave(c); logEvent("icu_push",{count:evs.length,removed:stale.length});
  return evs.length;
}
async function icuRemovePlanned(){
  const c=icuLoad(); if(!c||!(c.pushed||[]).length)return;
  const t=todayIso(), fut=c.pushed.filter(x=>{const s=findS(x.replace(/^ridgeline-/,""));return !s||(!sessStatus(s)&&s.date>=t)});
  if(fut.length)await icuFetch("/events/bulk-delete",{method:"PUT",body:fut.map(x=>({external_id:x}))});
  c.pushed=c.pushed.filter(x=>!fut.includes(x)); icuSave(c);
}
function ago(ms){if(!ms)return "never";const m=Math.round((Date.now()-ms)/60000);return m<1?"just now":m<60?m+" min ago":m<1440?Math.round(m/60)+" h ago":Math.round(m/1440)+" days ago"}
function icuCard(){
  const c=icuLoad();
  if(!c)return '<section class="block"><h2>Garmin sync</h2><div class="card"><p style="margin-top:0">Ridgeline can pull your Garmin runs automatically through <b>intervals.icu</b>, a free training site that already syncs with Garmin.</p>'+
    '<ol class="howto"><li>Create a free account at intervals.icu.</li><li>In intervals.icu <b>Settings → Connections</b>, connect <b>Garmin</b> directly (not via Strava – Strava data can’t be passed on). Tick <b>Upload planned workouts</b> if you want sessions on your watch.</li><li>In <b>Settings → Developer Settings</b>, generate an API key and paste it below.</li></ol>'+
    '<label class="f"><span>intervals.icu API key</span><input type="password" id="icuKey" autocomplete="off" spellcheck="false" placeholder="Paste your API key"><small>Stays on this phone only. It’s never included in backups or data exports.</small></label>'+
    '<button class="btn" type="button" id="icuConnect">Connect</button></div></section>';
  return '<section class="block"><h2>Garmin sync</h2><div class="card"><p style="margin-top:0"><b>Connected to intervals.icu.</b> Last synced '+ago(c.lastPull)+'.</p>'+
    (c.error?'<p class="tip" style="margin:0 0 12px">'+esc(c.error)+'</p>':'')+
    (c.stubs?'<p class="tip" style="margin:0 0 12px">'+c.stubs+' recent activities reached intervals.icu via Strava, so their details can’t be read. Connect Garmin directly in intervals.icu to fix this.</p>':'')+
    '<p class="note" style="margin-top:0">New activities sync when you open the app. Runs on the same day as a planned session are ticked off automatically; anything less clear-cut waits for you to match it.</p>'+
    '<div class="toggle"><span><b>Send planned sessions to my watch</b><br><span class="note">The next two weeks go to your intervals.icu calendar, which uploads them to Garmin Connect. Effort targets use your heart-rate zones in intervals.icu.'+(c.lastPush?' Last sent '+ago(c.lastPush)+'.':'')+'</span></span><input type="checkbox" id="icuPush" '+(c.push?"checked":"")+' aria-label="Send planned sessions to my watch"></div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn" type="button" id="icuSyncBtn">Sync now</button><button class="btn quiet" type="button" id="icuDisc">Disconnect</button></div></div></section>';
}
function wireIcu(){
  const k=$("#icuConnect");
  if(k)k.addEventListener("click",async()=>{
    const key=$("#icuKey").value.trim(); if(!key){toast("Paste your API key first");return}
    k.disabled=true;k.textContent="Checking…";
    try{await icuFetch("/activities?oldest="+iso(addDays(new Date(),-7))+"&newest="+todayIso()+"&fields=id",{},key);
      icuSave({key,push:false,pushed:[]});logEvent("icu_connected",{});save();toast("Connected");render();icuSync(true)}
    catch(e){toast(icuErr(e));k.disabled=false;k.textContent="Connect"}
  });
  const s=$("#icuSyncBtn"); if(s)s.addEventListener("click",()=>icuSync(true));
  const pu=$("#icuPush"); if(pu)pu.addEventListener("change",async e=>{
    const c=icuLoad(); c.push=e.target.checked; icuSave(c); logEvent("icu_push_setting",{on:c.push});
    try{if(c.push){const n=await icuPush();toast(n+" sessions sent to intervals.icu")}else{await icuRemovePlanned();toast("Upcoming sessions removed from intervals.icu")}}
    catch(err){toast(icuErr(err))}
    render();
  });
  const d=$("#icuDisc"); if(d)d.addEventListener("click",async()=>{
    if(!confirm("Disconnect intervals.icu? Your imported runs stay in Ridgeline."))return;
    const c=icuLoad();
    if(c&&c.push&&confirm("Also remove upcoming Ridgeline sessions from your intervals.icu calendar?")){try{await icuRemovePlanned()}catch(e){}}
    icuSave(null);logEvent("icu_disconnected",{});save();toast("Disconnected");render();
  });
}
function pendingBanner(){
  const n=(state.pending||[]).length; if(!n)return "";
  return '<button class="banner" data-review="1" style="background:var(--primary);color:var(--onprimary)"><b>'+n+' Garmin '+(n===1?"activity":"activities")+' to match</b><span>Pick which planned session '+(n===1?"it was":"each one was")+' →</span></button>';
}
document.addEventListener("click",e=>{
  if(!e.target.closest("[data-review]"))return;
  impQueue=(state.pending||[]).map(p=>Object.assign({},p,{start:new Date(p.start)}));
  nextImport();
});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")icuSync(false)});
addEventListener("online",()=>icuSync(false));
