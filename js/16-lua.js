"use strict";
// Ridgeline – 16-lua.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- Lua (period calendar, in ./lua/) ---------- */
// Lua by its contributors (github.com/createusernam/lua-period-tracker), MIT licence. It keeps periods in its own
// IndexedDB database; Ridgeline reads them (and only writes them back on backup restore).
const LUA_DB="lua-period-tracker";
let luaCache={ok:false,periods:[],last:0};
function luaOpen(){
  return new Promise((res,rej)=>{
    let req; try{req=indexedDB.open(LUA_DB)}catch(e){return rej(e)}
    req.onupgradeneeded=()=>{req.transaction.abort()}; // never create Lua's database from here
    req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error||new Error("no lua"));
  });
}
async function luaReadAll(){
  let db; try{db=await luaOpen()}catch(e){return null}
  try{
    if(!db.objectStoreNames.contains("periods"))return null;
    return await new Promise((res,rej)=>{const r=db.transaction("periods","readonly").objectStore("periods").getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
  }finally{db.close()}
}
async function luaReplaceAll(periods){
  let db; try{db=await luaOpen()}catch(e){return false}
  try{
    if(!db.objectStoreNames.contains("periods"))return false;
    await new Promise((res,rej)=>{const t=db.transaction("periods","readwrite"),s=t.objectStore("periods");s.clear();periods.forEach(p=>s.put(p));t.oncomplete=res;t.onerror=()=>rej(t.error)});
    return true;
  }finally{db.close()}
}
let luaBusy=false;
async function luaSync(){
  if(luaBusy||!state.settings)return; luaBusy=true;
  try{
    const ps=await luaReadAll(); if(!ps){luaCache.ok=false;return}
    const periods=ps.filter(p=>p&&/^\d{4}-\d{2}-\d{2}$/.test(p.startDate)).sort((a,b)=>a.startDate<b.startDate?-1:1);
    luaCache={ok:true,periods,last:Date.now()};
    if(!cycOn())return;
    const c=state.cycle, gap=(a,b)=>Math.abs((parse(a)-parse(b))/DAY);
    let added=0;
    periods.forEach(p=>{if(p.startDate<=todayIso()&&!c.starts.some(s=>gap(s,p.startDate)<=3)){c.starts.push(p.startDate);added++}});
    c.starts.sort();
    // Period length from Lua's finished periods, once there are a couple.
    const done=periods.filter(p=>p.endDate).map(p=>Math.round((parse(p.endDate)-parse(p.startDate))/DAY)+1).filter(n=>n>=2&&n<=10);
    if(done.length>=2){const pl=Math.round(done.slice(-6).reduce((a,b)=>a+b,0)/Math.min(6,done.length));if(pl!==c.plen){c.plen=pl;added=added||-1}}
    if(added){logEvent("lua_sync",{added:Math.max(0,added)});save();rebuild();if(added>0)toast("Lua: "+added+" period"+(added===1?"":"s")+" added")}
  }catch(e){}
  finally{luaBusy=false;render()}
}
function luaCard(){
  const n=luaCache.periods.length;
  return '<section class="block"><h2>Period calendar</h2><div class="card"><p style="margin-top:0"><b>Lua</b> is a private period calendar with predictions, history, cycle-length charts and a year view. Periods you log there show up here, and periods you log here show up there.</p>'+
    '<p class="note" style="margin-top:0">'+(luaCache.ok?n+" period"+(n===1?"":"s")+" in Lua · last read "+ago(luaCache.last)+".":"Nothing logged in Lua yet.")+'</p>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="lua/">Open period calendar</a>'+
    (!cycOn()&&n?'<button class="btn quiet" type="button" id="luaUse">Use Lua’s periods for cycle-aware training</button>':'')+'</div>'+
    '<p class="note" style="margin:14px 0 0">Lua by its contributors (<a href="https://github.com/createusernam/lua-period-tracker">github.com/createusernam/lua-period-tracker</a>), MIT licence.</p></div></section>';
}
document.addEventListener("click",e=>{
  if(!e.target.closest("#luaUse"))return;
  const ps=luaCache.periods.filter(p=>p.startDate<=todayIso());
  if(!ps.length)return;
  state.cycle=Object.assign({len:28,plen:5},state.cycle||{},{on:true,starts:[...new Set(ps.map(p=>p.startDate))].sort()});
  logEvent("lua_enable",{periods:ps.length}); save(); rebuild(); toast("Cycle-aware training on – "+ps.length+" periods from Lua"); location.hash="#today"; render();
});
addEventListener("pageshow",()=>luaSync());
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")luaSync()});
