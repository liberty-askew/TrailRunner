"use strict";
// Ridgeline – 07-export.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- data export ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
function zipStore(files){
  const enc=new TextEncoder(), parts=[], cds=[]; let off=0; const nw=new Date(), dd=((nw.getFullYear()-1980)<<9)|((nw.getMonth()+1)<<5)|nw.getDate(), dt=(nw.getHours()<<11)|(nw.getMinutes()<<5);
  for(const f of files){
    const name=enc.encode(f.name), data=enc.encode(f.text), crc=crc32(data);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(10,dt,true);lh.setUint16(12,dd,true);lh.setUint32(14,crc,true);lh.setUint32(18,data.length,true);lh.setUint32(22,data.length,true);lh.setUint16(26,name.length,true);
    const cd=new DataView(new ArrayBuffer(46));
    cd.setUint32(0,0x02014b50,true);cd.setUint16(4,20,true);cd.setUint16(6,20,true);cd.setUint16(8,0x0800,true);cd.setUint16(12,dt,true);cd.setUint16(14,dd,true);cd.setUint32(16,crc,true);cd.setUint32(20,data.length,true);cd.setUint32(24,data.length,true);cd.setUint16(28,name.length,true);cd.setUint32(42,off,true);
    parts.push(lh,name,data); cds.push(cd,name); off+=30+name.length+data.length;
  }
  const cdSize=cds.reduce((a,x)=>a+x.byteLength,0);
  const eo=new DataView(new ArrayBuffer(22));
  eo.setUint32(0,0x06054b50,true);eo.setUint16(8,files.length,true);eo.setUint16(10,files.length,true);eo.setUint32(12,cdSize,true);eo.setUint32(16,off,true);
  return new Blob([...parts,...cds,eo],{type:"application/zip"});
}
const csvCell=v=>{if(v==null)return "";const s=String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
const csv=rows=>rows.map(r=>r.map(csvCell).join(",")).join("\n")+"\n";
const paceOf=(secs,km)=>secs&&km>0.2?Math.round(secs/km):null;
function sessionRecords(){
  const t=todayIso();
  return allSessions().map(s=>{
    const L=state.log[s.id]||{}, ci=cycleInfo(s.date), ck=state.checkins[s.date]||{};
    const km=s.km!=null&&L.status==="done"?(L.km!=null?L.km:(+L.actual||s.km)):null;
    return {id:s.id,date:s.date,planned_date:s.id.slice(0,10),week:s.week,training_phase:(plan[s.week-1]||{}).phase,type:s.type,title:s.title,swapped:!!s.swapped,
      planned_km:s.km??"",planned_min:s.mins??"",status:L.status||(inPause(s.date)?"paused":s.date<t?"missed":"upcoming"),actual_km:km??"",actual_min:s.mins!=null&&L.status==="done"?(+L.actual||s.mins):"",
      moving_time_s:L.secs??"",pace_s_per_km:paceOf(L.secs,L.km)??"",ascent_m:L.ascent??"",rpe:L.rpe??"",note:L.note||"",source:L.src||(L.status?"manual":""),logged_at:L.at?new Date(L.at).toISOString():"",
      cycle_day:ci?ci.day:"",cycle_phase:ci?ci.phase:"",cycle_predicted:ci?ci.predicted:"",energy:ck.energy??"",symptoms:(ck.sym||[]).join(";"),
      setlog_sets:L.sl?L.sl.sets:"",setlog_volume_kg:L.sl?L.sl.volume:"",setlog_new_bests:L.sl?L.sl.prs.join("; "):""};
  });
}
function buildExport(){
  const sess=sessionRecords();
  const sCols=Object.keys(sess[0]||{id:1});
  const extras=(state.extras||[]).map(x=>{const ci=cycleInfo(x.date),ck=state.checkins[x.date]||{};const o={};sCols.forEach(c=>o[c]="");return Object.assign(o,{id:"extra-"+x.key,date:x.date,type:"extra_"+x.sport,title:"Extra "+(x.sport==="bike"?"ride":"run"),status:"done",actual_km:x.km,moving_time_s:x.secs,pace_s_per_km:paceOf(x.secs,x.km)??"",ascent_m:x.ascent??"",source:"Garmin",cycle_day:ci?ci.day:"",cycle_phase:ci?ci.phase:"",cycle_predicted:ci?ci.predicted:"",energy:ck.energy??"",symptoms:(ck.sym||[]).join(";")})});
  const allS=sess.concat(extras).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  const t=todayIso(), first=plan[0].mon, lastS=plan[plan.length-1].sessions.slice(-1)[0];
  const end=lastS&&lastS.date<t?lastS.date:t;
  const dCols=["date","week","training_phase","cycle_day","cycle_phase","cycle_predicted","period_start_logged","energy","symptoms","sessions_planned","planned_run_km","sessions_done","sessions_skipped","sessions_missed","actual_run_km","moving_time_s","ascent_m","avg_rpe","hard_session_rpe","swapped","notes","bodyweight_kg"];
  const daily=[dCols];
  for(let d=parse(first);iso(d)<=end;d=addDays(d,1)){
    const ds=iso(d), rows=allS.filter(r=>r.date===ds), planned=rows.filter(r=>r.planned_date!==""), ci=cycleInfo(ds), ck=state.checkins[ds]||{};
    const wk=plan.find(w=>w.mon<=ds&&iso(addDays(parse(w.mon),7))>ds);
    const rpes=rows.filter(r=>r.rpe!=="").map(r=>+r.rpe), hard=rows.filter(r=>HARD.has(r.type)&&r.rpe!=="").map(r=>+r.rpe);
    const runKm=rows.filter(r=>r.status==="done"&&r.actual_km!==""&&r.type!=="bike"&&r.type!=="extra_bike").reduce((a,r)=>a+ +r.actual_km,0);
    daily.push([ds,wk?wk.w:"",wk?wk.phase:"",ci?ci.day:"",ci?ci.phase:"",ci?ci.predicted:"",cycOn()&&state.cycle.starts.includes(ds),ck.energy??"",(ck.sym||[]).join(";"),
      planned.map(r=>r.title).join("; "),planned.reduce((a,r)=>a+(r.planned_km===""?0:+r.planned_km),0)||"",
      rows.filter(r=>r.status==="done").length,rows.filter(r=>r.status==="skipped").length,rows.filter(r=>r.status==="missed").length,
      runKm?runKm.toFixed(2):"",rows.reduce((a,r)=>a+(+r.moving_time_s||0),0)||"",rows.reduce((a,r)=>a+(+r.ascent_m||0),0)||"",
      rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1):"",hard.length?(hard.reduce((a,b)=>a+b,0)/hard.length).toFixed(1):"",rows.some(r=>r.swapped),rows.map(r=>r.note).filter(Boolean).join(" | "),(slCache.weights.find(w=>w.date===ds)||{}).kg??""]);
  }
  const events=[["timestamp","type","details"]].concat((state.events||[]).map(e=>{const {ts,type,...rest}=e;return [new Date(ts).toISOString(),type,JSON.stringify(rest)]}));
  const readme="Ridgeline data export - "+t+"\n\ndaily.csv     one row per day: cycle day/phase, check-in, planned vs done, km, effort\nsessions.csv  one row per planned session (plus extra runs): status, actuals, pace, RPE, cycle phase that day\nevents.csv    timestamped log of everything you did in the app (ticks, logs, swaps, moves, check-ins)\n\nCycle phases are worked out from the period starts you logged, using each cycle's real length once the next period is logged.\npace_s_per_km = moving time / distance from imported activities. energy = your 1-5 check-in.\n";
  return zipStore([{name:"daily.csv",text:csv(daily)},{name:"sessions.csv",text:csv([sCols].concat(allS.map(r=>sCols.map(c=>r[c]))))},{name:"events.csv",text:csv(events)},{name:"README.txt",text:readme}]);
}
async function deliver(blob,name){
  try{const file=new File([blob],name,{type:blob.type});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return}}
  catch(e){if(e&&e.name==="AbortError")return}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function exportData(){if(!plan.length){toast("Set up your plan first");return}logEvent("export",{});save();await deliver(buildExport(),"ridgeline-data-"+todayIso()+".zip")}
