"use strict";
// Ridgeline – 08-reports.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- report summary (shown first, so the verdict isn’t buried) ---------- */
function reportSummary(A,label,partial){
  if(!A.due.length)return "";
  const pct=A.comp!=null?Math.round(A.comp*100):null;
  const verdict=pct==null?"":pct>=85?"Strong "+label:pct>=70?"Solid "+label:"A patchy "+label;
  const lc=s=>s.charAt(0).toLowerCase()+s.slice(1);
  const head=verdict+(partial?" so far":"")+": "+A.done.length+" of "+A.due.length+" sessions, "+Math.round(A.runKm)+" km run"+(A.runKmPlan?" of "+Math.round(A.runKmPlan)+" planned":"")+".";
  const watch=A.watch.length?"Watch: "+lc(A.watch[0]):(A.good.length?lc(A.good[0]).replace(/\.$/,"")+".":"");
  const cyc=(A.cf&&A.cf.length)?A.cf[0]:(A.cyc&&Array.isArray(A.cyc)&&A.cyc.length>2?A.cyc[2]:"");
  const next=A.sugg.length?A.sugg[0].t:"";
  return '<div class="card sumcard"><div class="sumhead">'+esc(head)+'</div>'+(watch?'<p>'+esc(watch)+'</p>':'')+(cyc?'<p>'+esc(cyc)+'</p>':'')+
    (next?'<p><b>Next:</b> '+esc(next)+' <a href="#suggs" class="jump">See suggestions ↓</a></p>':'')+'</div>';
}
/* ---------- monthly report ---------- */
let reportMonth=null;
const ymOf=s=>s.slice(0,7);
const monthName=ym=>new Date(+ym.slice(0,4),+ym.slice(5)-1,1).toLocaleDateString("en-GB",{month:"long",year:"numeric"});
function reportMonths(){
  if(!plan.length)return [];
  const lastS=plan[plan.length-1].sessions.slice(-1)[0], t=todayIso();
  const end=ymOf(lastS&&lastS.date<t?lastS.date:t), out=[];
  let d=new Date(+plan[0].mon.slice(0,4),+plan[0].mon.slice(5,7)-1,1);
  while(ymOf(iso(d))<=end){out.push(ymOf(iso(d)));d=new Date(d.getFullYear(),d.getMonth()+1,1)}
  return out;
}
const avg=a=>a&&a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const PHASES=["Period","Follicular","Ovulation window","Luteal","Late luteal","Hormonal cycle","Perimenopause"];
const fmtP=s=>s==null?"–":Math.floor(s/60)+":"+pad(Math.round(s%60)%60);
function analyse(ym){
  const t=todayIso(), all=sessionRecords(), recs=all.filter(r=>ymOf(r.date)===ym&&r.date<=t);
  const extras=(state.extras||[]).filter(x=>ymOf(x.date)===ym&&x.date<=t);
  const due=recs.filter(r=>r.status!=="paused"), done=recs.filter(r=>r.status==="done"), skipped=recs.filter(r=>r.status==="skipped"), missed=recs.filter(r=>r.status==="missed");
  const isRun=r=>TYPES[r.type]&&TYPES[r.type].run;
  const runKmPlan=due.filter(isRun).reduce((a,r)=>a+(+r.planned_km||0),0);
  const runKm=done.filter(isRun).reduce((a,r)=>a+(+r.actual_km||0),0)+extras.filter(x=>x.sport==="run").reduce((a,x)=>a+x.km,0);
  const climb=done.reduce((a,r)=>a+(+r.ascent_m||0),0)+extras.reduce((a,x)=>a+(x.ascent||0),0);
  const crossMin=done.filter(r=>r.type==="bike"||r.type==="strength").reduce((a,r)=>a+(+r.actual_min||0),0);
  const str=due.filter(r=>r.type==="strength"), strDone=str.filter(r=>r.status==="done").length;
  const longs=due.filter(r=>r.type==="long"), longMissed=longs.filter(r=>r.status!=="done").length;
  const longest=Math.max(0,...done.filter(isRun).map(r=>+r.actual_km||0),...extras.filter(x=>x.sport==="run").map(x=>x.km));
  const easyR=done.filter(r=>(r.type==="easy"||r.type==="b2b")&&r.rpe!=="").map(r=>+r.rpe);
  const hardR=done.filter(r=>HARD.has(r.type)&&r.rpe!=="").map(r=>+r.rpe);
  const wkKm=plan.map(w=>{const end=iso(addDays(parse(w.mon),7));return {w:w.w,mon:w.mon,km:all.filter(r=>r.date>=w.mon&&r.date<end&&r.status==="done"&&isRun(r)).reduce((a,r)=>a+(+r.actual_km||0),0)+(state.extras||[]).filter(x=>x.sport==="run"&&x.date>=w.mon&&x.date<end).reduce((a,x)=>a+x.km,0)}});
  let ramp=null;
  wkKm.filter(w=>(ymOf(w.mon)===ym||ymOf(iso(addDays(parse(w.mon),6)))===ym)&&w.mon<=t).forEach(w=>{const prev=wkKm[w.w-2];if(prev&&prev.km>=10&&w.km>prev.km*1.15){const r=w.km/prev.km-1;if(!ramp||r>ramp.r)ramp={r,w:w.w}}});
  let cyc=null;
  if(cycOn()){
    const days=[]; for(let d=new Date(+ym.slice(0,4),+ym.slice(5,7)-1,1);ymOf(iso(d))===ym&&iso(d)<=t;d=addDays(d,1))days.push(iso(d));
    const by={}; PHASES.forEach(p=>by[p]={days:0,energy:[],sym:{},due:0,done:0,hardR:[],easyPace:[],swaps:0});
    days.forEach(d=>{const i=cycleInfo(d);if(!i)return;const b=by[i.phase];b.days++;const ck=state.checkins[d];if(ck){if(ck.energy)b.energy.push(ck.energy);(ck.sym||[]).forEach(s=>b.sym[s]=(b.sym[s]||0)+1)}});
    recs.forEach(r=>{if(!r.cycle_phase)return;const b=by[r.cycle_phase];b.due++;if(r.status==="done")b.done++;if(HARD.has(r.type)&&r.rpe!=="")b.hardR.push(+r.rpe);if((r.type==="easy"||r.type==="b2b")&&r.pace_s_per_km!=="")b.easyPace.push(+r.pace_s_per_km);if(r.swapped)b.swaps++});
    const lastStart=state.cycle.starts.slice().sort().pop();
    cyc={by,allE:[].concat(...PHASES.map(p=>by[p].energy)),allH:[].concat(...PHASES.map(p=>by[p].hardR)),allP:[].concat(...PHASES.map(p=>by[p].easyPace)),
      checkins:days.filter(d=>state.checkins[d]&&state.checkins[d].energy).length,days:days.length,
      late:!state.cycle.hc&&ym===ymOf(t)?(Math.round((parse(t)-parse(lastStart))/DAY)>90?2:Math.round((parse(t)-parse(lastStart))/DAY)>Math.max(35,avgLen()+5)?1:0):0};
  }
  const good=[], watch=[], sugg=[], cf=[];
  const comp=due.length?done.length/due.length:null;
  if(comp!=null){
    if(comp>=0.85)good.push("You completed "+Math.round(comp*100)+"% of planned sessions – excellent consistency.");
    else if(comp>=0.7)good.push("You completed "+Math.round(comp*100)+"% of planned sessions – solid.");
    else{watch.push("Only "+Math.round(comp*100)+"% of planned sessions got done.");sugg.push({t:"Make the plan fit your life",b:"Missing this many sessions usually means the plan is asking for more than your weeks allow. Dropping one run a week, or lowering your current weekly km by about 10%, tends to work better than repeatedly missing sessions.",a:'<a class="btn quiet small" href="#setup">Adjust plan</a>'})}
  }
  if(easyR.length>=3&&avg(easyR)>5){watch.push("Easy runs averaged RPE "+avg(easyR).toFixed(1)+" – closer to steady than easy.");sugg.push({t:"Slow your easy runs down",b:"Easy days should feel like RPE 3–4: full sentences, relaxed breathing. Running them harder blunts your hard sessions and adds load without much extra fitness."})}
  else if(easyR.length>=3)good.push("Easy runs stayed genuinely easy (RPE "+avg(easyR).toFixed(1)+").");
  if(hardR.length>=3&&avg(hardR)>=8.5){watch.push("Hard sessions averaged RPE "+avg(hardR).toFixed(1)+".");sugg.push({t:"Hold, don’t add",b:"Your key sessions are already near your limit. Repeat this month’s reps rather than progressing, and finish each one feeling you had another rep in you."})}
  if(ramp){watch.push("Week "+ramp.w+" jumped "+Math.round(ramp.r*100)+"% in running km on the week before.");sugg.push({t:"Smooth out big jumps",b:"Sudden rises in weekly km are one of the clearest injury risks. If you catch up missed runs, spread them over two weeks rather than stacking them."})}
  if(str.length>=4){if(strDone/str.length<0.5){watch.push("Strength: "+strDone+" of "+str.length+" sessions done.");sugg.push({t:"Protect your strength work",b:"Strength is your injury insurance and was the most-skipped session. A 20-minute version (first three exercises) straight after an easy run still counts – consistency beats completeness."})}else good.push("Strength: "+strDone+" of "+str.length+" sessions done – great for injury resilience.")}
  if(longs.length>=2&&longMissed>=2){watch.push(longMissed+" long runs were missed or skipped.");sugg.push({t:"Prioritise the long run",b:"For an ultra, the long run and back-to-back are the sessions to protect. If a week gets squeezed, drop an easy run or the tempo first."})}
  if(cyc){
    const oE=avg(cyc.allE), oH=avg(cyc.allH);
    if(cyc.checkins<8)cf.push("Only "+cyc.checkins+" check-ins this month – not enough to spot a cycle pattern yet. Tap any day in the week strip to fill in missed days.");
    else{
      let found=false;
      PHASES.forEach(p=>{const b=cyc.by[p];
        if(b.energy.length>=3&&oE!=null&&avg(b.energy)<=oE-0.6){found=true;cf.push("Energy was lowest in your "+p.toLowerCase()+" days ("+avg(b.energy).toFixed(1)+" vs "+oE.toFixed(1)+" overall).");
          const on=(state.cycle.protect||[]).includes(p);
          sugg.push({t:"Plan around "+p.toLowerCase()+" days",b:"Get a prompt before any hard session that lands on a "+p.toLowerCase()+" day, with one-tap options to swap it for an easy run or move it later in the week. Keep checking in so the pattern can be confirmed over another cycle or two.",a:'<button class="btn small" data-protect="'+p+'|'+(on?0:1)+'">'+(on?"Turn off prompt":"Turn on prompt")+'</button>'})}
        if(b.hardR.length>=2&&oH!=null&&avg(b.hardR)>=oH+1){found=true;cf.push("Hard sessions felt harder in your "+p.toLowerCase()+" days (RPE "+avg(b.hardR).toFixed(1)+" vs "+oH.toFixed(1)+").")}
        if(b.due>=3&&comp!=null&&b.done/b.due<=comp-0.2){found=true;cf.push("You completed "+Math.round(b.done/b.due*100)+"% of sessions in your "+p.toLowerCase()+" days, against "+Math.round(comp*100)+"% overall.")}
        const others=[].concat(...PHASES.filter(q=>q!==p).map(q=>cyc.by[q].easyPace));
        if(b.easyPace.length>=2&&others.length>=2&&avg(b.easyPace)>=avg(others)+15){found=true;cf.push("Easy pace was about "+Math.round(avg(b.easyPace)-avg(others))+" s/km slower in your "+p.toLowerCase()+" days – normal for many people. Run by effort, not pace, then.")}
        const top=Object.entries(b.sym).sort((x,y)=>y[1]-x[1])[0]; if(top&&top[1]>=3){found=true;cf.push(top[0]+" came up "+top[1]+" times in your "+p.toLowerCase()+" days.")}
        if(b.swaps>=2){found=true;cf.push("You swapped "+b.swaps+" hard sessions for easy runs in your "+p.toLowerCase()+" days.")}
      });
      if(!found)cf.push("No clear cycle effect on your energy or training this month. That’s common – patterns (or their absence) get clearer after two or three cycles.");
    }
    const heavyDays=Object.entries(state.checkins).filter(([d,c])=>ymOf(d)===ym&&(c.sym||[]).includes("Heavy flow")).length, pp=prof();
    if(heavyDays>=3||(pp&&(pp.sym.includes("lightheaded")||pp.sym.includes("heavy"))))sugg.push({t:"Ask for an iron check",b:"Heavy periods"+(pp&&pp.sym.includes("lightheaded")?" and feeling light-headed with hard exercise":"")+" are linked to low iron, which is common in female endurance runners and causes fatigue. Ask your GP for a ferritin and haemoglobin blood test, and repeat it every few months during heavy training."});
    if(cyc.late===2)sugg.push({t:"See your GP about your cycle",b:"No period for over three months during heavy training is a recognised sign of low energy availability (REDs), which affects bone health and injury risk. Book a GP or sports medicine appointment, and fuel big training days well."});
    else if(cyc.late===1)sugg.push({t:"Keep an eye on your cycle",b:"Your cycle is running longer than 35 days. That can have many causes, but in heavy training it can signal under-fuelling. Eat enough around long runs and big weeks, and mention it to your GP if it happens again."});
  }
  if(!sugg.length&&due.length)sugg.push({t:"Stay the course",b:"Nothing here needs changing. Keep the easy days easy and the plan will keep building."});
  const weeks=plan.map(w=>{const end=iso(addDays(parse(w.mon),7));const ss=due.filter(r=>r.date>=w.mon&&r.date<end);return {w:w.w,mon:w.mon,cut:w.cut,phase:w.phase,due:ss.length,done:ss.filter(r=>r.status==="done").length}}).filter(w=>w.due);
  const ORDER=["long","b2b","hills","intervals","tempo","easy","bike","strength","race"];
  const byType=ORDER.map(ty=>{const ss=due.filter(r=>r.type===ty);if(!ss.length)return null;const dn=ss.filter(r=>r.status==="done");
    const pk=dn.reduce((a,r)=>a+(+r.planned_km||+r.planned_min||0),0), ak=dn.reduce((a,r)=>a+(r.planned_km!==""?(+r.actual_km||0):(+r.actual_min||0)),0);
    return {ty,due:ss.length,done:dn.length,att:pk?ak/pk:null,unit:ss[0].planned_km!==""?"distance":"time"}}).filter(Boolean);
  return {due,done,skipped,missed,comp,runKm,runKmPlan,climb,crossMin,longest,easyR,hardR,cyc,good,watch,sugg,cf,extras,weeks,byType};
}
function renderReport(){
  const months=reportMonths(); if(!months.length)return '<div class="empty">Set up a plan first.</div>';
  const cur=ymOf(todayIso());
  if(!reportMonth||!months.includes(reportMonth))reportMonth=months.filter(m=>m<cur).pop()||months[months.length-1];
  const A=analyse(reportMonth), i=months.indexOf(reportMonth), partial=reportMonth===cur;
  if(!partial&&!state.reports.seen.includes(reportMonth)){state.reports.seen.push(reportMonth);logEvent("report_viewed",{month:reportMonth});save()}
  const nav='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px"><button class="btn quiet small" '+(i>0?'data-rm="'+months[i-1]+'"':'disabled')+' aria-label="Previous month">‹</button><h1 style="font-size:1.9rem;text-align:center">'+monthName(reportMonth)+'</h1><button class="btn quiet small" '+(i<months.length-1?'data-rm="'+months[i+1]+'"':'disabled')+' aria-label="Next month">›</button></div>';
  if(!A.due.length&&!A.extras.length)return nav+'<div class="card empty">No sessions were due this month.</div>';
  const stat=(v,l)=>'<div class="stat"><div class="v">'+v+'</div><div class="l">'+l+'</div></div>';
  const list=(arr,c)=>arr.length?'<ul class="rlist" style="--c:'+c+'">'+arr.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':"";
  let cycTable="";
  if(A.cyc){
    const rows=PHASES.filter(p=>A.cyc.by[p].days).map(p=>{const b=A.cyc.by[p];return '<tr><th scope="row"><span class="pdot" style="background:'+PHASE_COL[p]+'"></span>'+p+'</th><td>'+b.days+'</td><td>'+(b.energy.length?avg(b.energy).toFixed(1):"–")+'</td><td>'+(b.due?Math.round(b.done/b.due*100)+"%":"–")+'</td><td>'+(b.hardR.length?avg(b.hardR).toFixed(1):"–")+'</td><td>'+fmtP(avg(b.easyPace))+'</td><td>'+(b.swaps||"–")+'</td></tr>'}).join("");
    cycTable='<section class="block"><h2>Your cycle and training</h2><div class="card"><div class="tscroll"><table class="rt"><thead><tr><th scope="col">Phase</th><th scope="col">Days</th><th scope="col">Energy</th><th scope="col">Done</th><th scope="col">Hard RPE</th><th scope="col">Easy pace</th><th scope="col">Swaps</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+list(A.cf,"var(--tempo)")+'<p class="note" style="margin:10px 0 0">'+A.cyc.checkins+' check-ins over '+A.cyc.days+' days. Energy is your 1–5 check-in; easy pace comes from imported runs.</p></div></section>';
  }
  return nav+(partial?'<p class="note" style="margin-top:-6px">Month in progress – the full report is ready on the 1st.</p>':'')+reportSummary(A,"month",partial)+
   '<div class="stats" style="margin-top:0">'+stat(A.comp!=null?Math.round(A.comp*100)+"%":"–","sessions done ("+A.done.length+"/"+A.due.length+")")+stat(Math.round(A.runKm),"km run of "+Math.round(A.runKmPlan)+" planned")+stat(Math.round(A.climb)+" m","climbed")+stat(A.longest?A.longest.toFixed(1):"–","longest run, km")+'</div>'+
   barsSection(A)+strengthBlock(reportMonth+"-01",reportMonth+"-31")+
   '<section class="block"><h2>How it went</h2><div class="card">'+(A.good.length?'<h3 class="rh">Going well</h3>'+list(A.good,"var(--easy)"):'')+(A.watch.length?'<h3 class="rh">Worth watching</h3>'+list(A.watch,"var(--hills)"):'')+
   '<p class="note" style="margin:6px 0 0">'+A.skipped.length+' skipped · '+A.missed.length+' not logged · '+(Math.round(A.crossMin/6)/10)+' h bike & strength'+(A.easyR.length?' · easy RPE '+avg(A.easyR).toFixed(1):'')+(A.hardR.length?' · hard RPE '+avg(A.hardR).toFixed(1):'')+'</p></div></section>'+
   cycTable+
   '<section class="block" id="suggs"><h2>Suggested adjustments</h2>'+A.sugg.map(s=>'<div class="card" style="margin-bottom:10px"><h3 style="font-size:1.2rem;margin-bottom:6px">'+esc(s.t)+'</h3><p style="margin:0">'+esc(s.b)+'</p>'+(s.a?'<div style="margin-top:12px">'+s.a+'</div>':'')+'</div>').join("")+'</section>'+
   '<section class="block"><div class="card"><h3 style="font-size:1.2rem;margin-bottom:6px">Want a deeper look?</h3><p class="note" style="margin:0 0 12px">Export your data as spreadsheets – daily, sessions and a full activity log. Open them in Sheets or Excel, or upload the zip to Claude for a detailed analysis.</p><button class="btn small" id="exportDataBtn">Export training data</button></div></section>';
}
const band=v=>v>=0.85?"var(--easy)":v>=0.7?"var(--hills)":"var(--intervals)";
function bar(label,frac,colour,value,sub,swatch){
  const w=Math.max(0,Math.min(1,frac||0))*100;
  return '<div class="brow"><div class="blab">'+(swatch?'<span class="pdot" style="background:'+swatch+'"></span>':'')+esc(label)+(sub?'<span>'+esc(sub)+'</span>':'')+'</div>'+
    '<div class="btrack" role="img" aria-label="'+esc(label+": "+value)+'"><i style="width:'+w.toFixed(1)+'%;background:'+colour+'"></i></div><div class="bval">'+esc(value)+'</div></div>';
}
function barsSection(A){
  if(!A.due.length)return "";
  const cons=A.weeks.map(w=>{const f=w.done/w.due;return bar("Week "+w.w,f,band(f),Math.round(f*100)+"%",fmtShort(w.mon)+(w.cut?" · recovery":"")+" · "+w.done+"/"+w.due)}).join("");
  const att=attBars(A.byType);
  return consSection(cons)+'<section class="block"><h2>Session attainment</h2><div class="card">'+att+
    '<p class="note" style="margin:8px 0 0">Thick bars: share of each session type you completed. Thin bars: for completed sessions, how much of the planned distance or time you did.</p></div></section>';
}
function consSection(cons){return '<section class="block"><h2>Consistency</h2><div class="card">'+cons+
    '<div class="bkey"><span style="--c:var(--easy)">85%+ on track</span><span style="--c:var(--hills)">70–84% okay</span><span style="--c:var(--intervals)">under 70% falling behind</span></div></div></section>'}
function attBars(byType){
  return byType.map(t=>{const f=t.done/t.due;
    return bar(TYPES[t.ty].label,f,col(t.ty),Math.round(f*100)+"%",t.done+"/"+t.due+" done",col(t.ty))+
      (t.att!=null?'<div class="brow sub"><div class="blab"><span>'+(t.unit==="distance"?"Distance":"Time")+' vs plan</span></div><div class="btrack thin"><i style="width:'+Math.min(100,t.att*100).toFixed(1)+'%;background:'+col(t.ty)+';opacity:.55"></i>'+(t.att>1?'<b class="over" style="background:'+col(t.ty)+'"></b>':'')+'</div><div class="bval">'+Math.round(t.att*100)+'%</div></div>':'');
  }).join("");
}

/* ---------- weekly report ---------- */
let weekSel=null;
function weekIdxOf(date){let k=-1;plan.forEach((w,i)=>{if(w.mon<=date)k=i});return k}
function lastFullWeek(){const t=todayIso();let k=-1;plan.forEach((w,i)=>{if(iso(addDays(parse(w.mon),6))<t)k=i});return k}
function analyseWeek(i){
  const wk=plan[i], from=wk.mon, to=iso(addDays(parse(from),6)), t=todayIso(), all=sessionRecords();
  const recs=all.filter(r=>r.date>=from&&r.date<=to), due=recs.filter(r=>r.date<=t&&r.status!=="paused"), upcoming=recs.filter(r=>r.date>t);
  const pausedDays=(()=>{let n=0;for(let d=parse(from);iso(d)<=to&&iso(d)<=t;d=addDays(d,1))if(inPause(iso(d)))n++;return n})();
  const extras=(state.extras||[]).filter(x=>x.date>=from&&x.date<=to);
  const done=due.filter(r=>r.status==="done"), skipped=due.filter(r=>r.status==="skipped"), missed=due.filter(r=>r.status==="missed");
  const isRun=r=>TYPES[r.type]&&TYPES[r.type].run;
  const kmOf=rs=>rs.filter(isRun).reduce((a,r)=>a+(+r.actual_km||0),0);
  const runKm=kmOf(done)+extras.filter(x=>x.sport==="run").reduce((a,x)=>a+x.km,0);
  const runKmPlan=due.filter(isRun).reduce((a,r)=>a+(+r.planned_km||0),0), weekKmPlan=recs.filter(isRun).reduce((a,r)=>a+(+r.planned_km||0),0);
  const climb=done.reduce((a,r)=>a+(+r.ascent_m||0),0)+extras.reduce((a,x)=>a+(x.ascent||0),0);
  const longest=Math.max(0,...done.filter(isRun).map(r=>+r.actual_km||0),...extras.filter(x=>x.sport==="run").map(x=>x.km));
  const easyR=done.filter(r=>(r.type==="easy"||r.type==="b2b")&&r.rpe!=="").map(r=>+r.rpe), hardR=done.filter(r=>HARD.has(r.type)&&r.rpe!=="").map(r=>+r.rpe);
  let prevKm=null;
  if(i>0){const pf=plan[i-1].mon;prevKm=kmOf(all.filter(r=>r.date>=pf&&r.date<from&&r.status==="done"))+(state.extras||[]).filter(x=>x.sport==="run"&&x.date>=pf&&x.date<from).reduce((a,x)=>a+x.km,0)}
  const ORDER=["long","b2b","hills","intervals","tempo","easy","bike","strength","race"];
  const byType=ORDER.map(ty=>{const ss=due.filter(r=>r.type===ty);if(!ss.length)return null;const dn=ss.filter(r=>r.status==="done");
    const pk=dn.reduce((a,r)=>a+(+r.planned_km||+r.planned_min||0),0), ak=dn.reduce((a,r)=>a+(r.planned_km!==""?(+r.actual_km||0):(+r.actual_min||0)),0);
    return {ty,due:ss.length,done:dn.length,att:pk?ak/pk:null,unit:ss[0].planned_km!==""?"distance":"time"}}).filter(Boolean);
  const days=[]; for(let d=parse(from);iso(d)<=to;d=addDays(d,1)){const ds=iso(d);days.push({date:ds,ci:cycleInfo(ds),ck:state.checkins[ds]||null,future:ds>t})}
  const good=[], watch=[], sugg=[], cyc=[];
  const comp=due.length?done.length/due.length:null;
  if(comp!=null){
    if(comp===1&&due.length>=3)good.push("Every session done – "+done.length+" out of "+due.length+".");
    else if(comp>=0.85)good.push(done.length+" of "+due.length+" sessions done – on track.");
    else if(comp>=0.7)good.push(done.length+" of "+due.length+" sessions done.");
    else{watch.push("Only "+done.length+" of "+due.length+" sessions got done.");sugg.push({t:"Don’t stack missed sessions",b:"Pick up next week’s plan as written rather than squeezing in what you missed – catch-up weeks are where niggles start."})}
  }
  if(easyR.length>=2&&avg(easyR)>5){watch.push("Easy runs averaged RPE "+avg(easyR).toFixed(1)+" – a bit too hard.");sugg.push({t:"Keep easy days easy",b:"Aim for RPE 3–4 next week: full sentences, walk the steep bits. It’s what lets the hard days count."})}
  else if(easyR.length>=2)good.push("Easy runs stayed easy (RPE "+avg(easyR).toFixed(1)+").");
  if(hardR.length>=2&&avg(hardR)>=8.5)watch.push("Hard sessions averaged RPE "+avg(hardR).toFixed(1)+" – right at your limit.");
  if(prevKm!=null&&prevKm>=10&&runKm>prevKm*1.15&&!wk.cut){watch.push("Running km up "+Math.round((runKm/prevKm-1)*100)+"% on last week ("+Math.round(prevKm)+" → "+Math.round(runKm)+" km).");sugg.push({t:"Hold the volume",b:"That’s a bigger jump than the plan builds in. Stick to the planned km next week rather than adding more."})}
  // Single-run spike on what was actually run (Frandsen 2025): >10% over the longest run of the previous 30 days.
  const runsDone=all.filter(r=>r.status==="done"&&isRun(r)&&+r.actual_km>0).map(r=>({date:r.date,km:+r.actual_km})).concat((state.extras||[]).filter(x=>x.sport==="run").map(x=>({date:x.date,km:x.km})));
  runsDone.filter(r=>r.date>=from&&r.date<=to).forEach(r=>{
    const lo=iso(addDays(parse(r.date),-30)), prior=runsDone.filter(o=>o.date>=lo&&o.date<r.date);
    if(prior.length>=3){const mx=Math.max(...prior.map(o=>o.km));if(r.km>mx*1.1){watch.push(DN[(parse(r.date).getDay()+6)%7]+"’s "+r.km.toFixed(1)+" km run was "+Math.round((r.km/mx-1)*100)+"% longer than your longest in the previous 30 days ("+mx.toFixed(1)+" km).");sugg.push({t:"Hold the long run for now",b:"Single runs much longer than anything recent are linked to more overuse injuries. Keep your next long run at or below "+r.km.toFixed(0)+" km before building again."})}}
  });
  // Soft load check: this week's running against the 4-week average before it.
  if(i>=4&&!wk.cut){const prev=[1,2,3,4].map(k=>{const pf=plan[i-k].mon,pt=iso(addDays(parse(pf),7));return runsDone.filter(r=>r.date>=pf&&r.date<pt).reduce((a,r)=>a+r.km,0)});
    const chronic=avg(prev);if(chronic>=10&&runKm>chronic*1.5)watch.push("This week’s running was "+(runKm/chronic).toFixed(1)+"× your 4-week average – a big step up. Take it as a nudge to keep next week steady.")}
  const climbTarget=wk.vert||0;
  if(climbTarget&&to<todayIso()){if(climb>=climbTarget*0.85)good.push("Climbing: "+Math.round(climb)+" m of your "+climbTarget+" m target.");else if(climb>0)watch.push("Climbing: "+Math.round(climb)+" m of your "+climbTarget+" m target – mountain legs come from regular vertical.")}
  if(pausedDays)good.push("Paused for "+pausedDays+" day"+(pausedDays===1?"":"s")+" ("+(inPause(to)||inPause(from)||{}).kind+") – those sessions don’t count against you.");
  if(cycOn()){const bp=days.filter(d=>d.ck&&(d.ck.sym||[]).includes("Bone pain")).length;if(bp>=2){watch.push("Bone pain logged on "+bp+" days.");sugg.push({t:"Get the bone pain checked",b:"Pain in a bone that’s worse with running can be an early stress injury. Cut back the running and see a physio or doctor before building again."})}}
  // Fuelling and drinking on long runs this week (women-specific review).
  {const longs=recs.filter(r=>r.status==="done"&&(r.type==="long"||r.type==="b2b"));
    const Ls=longs.map(r=>state.log[r.id]).filter(Boolean), fed=Ls.filter(L=>L.carbs!=null);
    if(longs.length){if(fed.length){const avgC=Math.round(fed.reduce((a,L)=>a+L.carbs,0)/fed.length);good.push("Fuelling practised on "+fed.length+" of "+longs.length+" long runs (average "+avgC+" g an hour).")}
      else watch.push("No fuelling logged on your long runs – log grams per hour so you know what your gut can handle on race day.")}
    const bad=Ls.filter(L=>L.gi==="Bad").length; if(bad)watch.push("Gut problems on "+bad+" long run"+(bad>1?"s":"")+". Try smaller, more frequent amounts and the same foods each time.");
    const heavy=Ls.filter(L=>L.wb&&L.wa&&L.wa>L.wb); if(heavy.length){watch.push("You finished "+heavy.length+" long run"+(heavy.length>1?"s":"")+" heavier than you started.");sugg.push({t:"Drink to thirst",b:"Gaining weight on a long run means you drank more than you lost, the main cause of low blood sodium in long events. Drink when thirsty rather than on a schedule."})}}
  const lm=due.filter(r=>r.type==="long"&&r.status!=="done");
  if(lm.length){watch.push("The long run didn’t happen.");sugg.push({t:"Let it go",b:"Don’t make next week’s long run longer to compensate – just run it as planned."})}
  const st=due.filter(r=>r.type==="strength");
  if(st.length>=2&&!st.some(r=>r.status==="done")){watch.push("No strength sessions this week.");sugg.push({t:"Squeeze in a short strength session",b:"Even 15–20 minutes of single-leg work and calf raises after an easy run keeps the injury-prevention benefit ticking over."})}
  else if(st.length&&st.every(r=>r.status==="done"))good.push("All strength sessions done.");
  if(cycOn()){
    const lowDays=days.filter(d=>d.ck&&d.ck.energy&&d.ck.energy<=2);
    const syms={}; days.forEach(d=>d.ck&&(d.ck.sym||[]).forEach(s=>syms[s]=(syms[s]||0)+1));
    const phases=[...new Set(days.filter(d=>d.ci&&!d.future).map(d=>d.ci.phase))];
    if(phases.length)cyc.push("This week covered "+phases.map(p=>p.toLowerCase()).join(" → ")+" days.");
    const e=days.filter(d=>d.ck&&d.ck.energy).map(d=>d.ck.energy);
    if(e.length)cyc.push("Average energy "+avg(e).toFixed(1)+"/5 across "+e.length+" check-in"+(e.length===1?"":"s")+".");
    if(lowDays.length>=2)cyc.push(lowDays.length+" low-energy days ("+lowDays.map(d=>DN[(parse(d.date).getDay()+6)%7]).join(", ")+")"+(lowDays[0].ci?", mostly in your "+lowDays[0].ci.phase.toLowerCase()+" phase":"")+".");
    const top=Object.entries(syms).sort((a,b)=>b[1]-a[1]).slice(0,2).filter(x=>x[1]>=2);
    if(top.length)cyc.push(top.map(([s,n])=>s+" on "+n+" days").join(", ")+".");
    const sw=recs.filter(r=>r.swapped).length; if(sw)cyc.push(sw+" hard session"+(sw>1?"s":"")+" swapped for easy runs.");
    const hr=due.filter(r=>HARD.has(r.type)&&r.rpe!==""&&r.cycle_phase);
    if(hr.length)cyc.push("Hard sessions: "+hr.map(r=>DN[(parse(r.date).getDay()+6)%7]+" RPE "+r.rpe+" ("+r.cycle_phase.toLowerCase()+")").join(", ")+".");
    if(!e.length)cyc.push("No check-ins this week – tap a day in the week strip to add them.");
  }
  // next week preview
  let next=null;
  if(plan[i+1]){
    const nw=plan[i+1], nf=nw.mon, nt=iso(addDays(parse(nf),6)), ns=all.filter(r=>r.date>=nf&&r.date<=nt);
    const km=ns.filter(isRun).reduce((a,r)=>a+(+r.planned_km||0),0);
    const key=ns.filter(r=>HARD.has(r.type)||r.type==="b2b"||r.type==="race");
    const flags=cycOn()?key.filter(r=>HARD.has(r.type)||r.type==="hike").map(r=>({r,ci:cycleInfo(r.date),td:toughDay(r.date)})).filter(x=>x.ci&&(x.td||(!prof()&&x.ci.phase==="Period"))):[];
    next={w:nw.w,phase:nw.phase,cut:nw.cut,km,change:weekKmPlan?km/weekKmPlan-1:null,key,flags,replan:nw.replan};
  }
  return {wk,from,to,due,done,skipped,missed,upcoming,extras,comp,runKm,runKmPlan,weekKmPlan,climb,longest,easyR,hardR,prevKm,byType,days,good,watch,sugg,cyc,next,recs};
}
function renderWeekly(){
  if(!plan.length)return '<div class="empty">Set up a plan first.</div>';
  const cur=weekIdxOf(todayIso()), maxI=Math.max(0,Math.min(plan.length-1,cur));
  if(weekSel==null||weekSel>maxI)weekSel=lastFullWeek()>=0?lastFullWeek():maxI;
  const i=weekSel, A=analyseWeek(i), partial=A.to>=todayIso();
  if(!partial&&!(state.reports.weeks||[]).includes(A.wk.w)){(state.reports.weeks=state.reports.weeks||[]).push(A.wk.w);logEvent("weekly_report_viewed",{week:A.wk.w});save()}
  const nav='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px"><button class="btn quiet small" '+(i>0?'data-rw="'+(i-1)+'"':'disabled')+' aria-label="Previous week">‹</button><div style="text-align:center"><h1 style="font-size:1.9rem">Week '+A.wk.w+'</h1><div class="note">'+fmtShort(A.from)+' – '+fmtShort(A.to)+' · '+A.wk.phase+(A.wk.cut?' · recovery week':'')+'</div></div><button class="btn quiet small" '+(i<maxI?'data-rw="'+(i+1)+'"':'disabled')+' aria-label="Next week">›</button></div>';
  const stat=(v,l)=>'<div class="stat"><div class="v">'+v+'</div><div class="l">'+l+'</div></div>';
  const list=(arr,c)=>arr.length?'<ul class="rlist" style="--c:'+c+'">'+arr.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':"";
  // day by day
  const dayRows=A.days.map(d=>{
    const rs=A.recs.filter(r=>r.date===d.date), dn=DN[(parse(d.date).getDay()+6)%7];
    const en=d.ck&&d.ck.energy?" · energy "+d.ck.energy+"/5":"";
    if(!rs.length)return '<div class="brow"><div class="blab">'+dn+'<span>Rest'+en+'</span></div><div class="btrack" style="background:transparent;border:1.5px dashed var(--line)"></div><div class="bval" style="color:var(--muted)">–</div></div>';
    return rs.map(r=>{
      const planned=r.planned_km!==""?+r.planned_km:+r.planned_min, actual=r.planned_km!==""?+r.actual_km:+r.actual_min, u=r.planned_km!==""?" km":" min";
      const f=r.status==="done"?(planned?Math.min(1,(actual||planned)/planned):1):0;
      const val=r.status==="done"?"✓":r.status==="skipped"?"Skip":r.status==="missed"?"Miss":"Next";
      const sub=(r.status==="done"&&actual?actual+" of "+planned+u:planned+u+" planned")+(r.swapped?" · swapped":"")+en;
      return bar(dn+" · "+r.title,f,r.status==="done"?col(r.type):"transparent",val,sub,col(r.type));
    }).join("");
  }).join("");
  const energy=A.days.some(d=>d.ck&&d.ck.energy)||cycOn()?'<div class="estrip" role="img" aria-label="Energy by day">'+A.days.map(d=>{const e=d.ck&&d.ck.energy;return '<div class="ecol"><div class="ebar"><i style="height:'+(e?e*20:0)+'%;background:'+(d.ci?PHASE_COL[d.ci.phase]:"var(--primary)")+'"></i></div><span>'+DN[(parse(d.date).getDay()+6)%7].slice(0,1)+'</span>'+(d.ci&&d.ci.phase==="Period"?'<b class="pmark'+(d.ci.predicted?" pred":"")+'"></b>':'')+'</div>'}).join("")+'</div>':'';
  const N=A.next;
  const nextCard=N?'<section class="block"><h2>Next week</h2><div class="card"><p style="margin-top:0"><b>Week '+N.w+' · '+N.phase+(N.cut?' · recovery week':'')+(N.replan?' · eased':'')+'</b><br>'+(N.replan?esc(N.replan.msg)+'<br>':'')+Math.round(N.km)+' km planned'+(N.change!=null&&Math.abs(N.change)>=0.03?' ('+(N.change>0?'+':'')+Math.round(N.change*100)+'% on this week)':'')+'</p>'+
    (N.key.length?'<div class="list" style="background:var(--surface2)">'+N.key.map(r=>{const s=findS(r.id);return s?sessionRow(s,true):""}).join("")+'</div>':'')+
    (N.flags.length?'<div class="tip" style="margin:12px 0 0;border-left:4px solid var(--accent)">'+N.flags.map(x=>'<b>'+esc(x.r.title)+'</b> on '+DN[(parse(x.r.date).getDay()+6)%7]+' falls on '+(x.td?esc(x.td.why):'a '+(x.ci.predicted?'predicted ':'')+x.ci.phase.toLowerCase()+' day')+'.').join("<br>")+' Keep it if you feel good on the day, or tap it to move it now.</div>':'')+
    '</div></section>':'';
  return '<div class="rtabs"><a href="#weekly" aria-current="page">Weekly</a><a href="#report">Monthly</a></div>'+nav+
    (partial?'<p class="note" style="text-align:center;margin:0 0 10px">Week in progress – the full report is ready on Monday.</p>':'<div style="height:10px"></div>')+reportSummary(A,"week",partial)+
    '<div class="stats" style="margin-top:0">'+stat(A.comp!=null?Math.round(A.comp*100)+"%":"–","sessions done ("+A.done.length+"/"+A.due.length+")")+stat(Math.round(A.runKm),"km run of "+Math.round(partial?A.runKmPlan:A.weekKmPlan)+" planned")+stat(Math.round(A.climb)+" m",A.wk.vert?"climbed of "+A.wk.vert+" m target":"climbed")+stat(A.longest?A.longest.toFixed(1):"–","longest run, km")+'</div>'+
    strengthBlock(A.from,A.to)+'<section class="block"><h2>Day by day</h2><div class="card">'+dayRows+'<p class="note" style="margin:8px 0 0">Coloured bars show how much of each planned session you did. Empty bars were skipped, missed or are still to come.</p></div></section>'+
    (A.byType.length?'<section class="block"><h2>Session attainment</h2><div class="card">'+attBars(A.byType)+'</div></section>':'')+
    (A.good.length||A.watch.length?'<section class="block"><h2>How it went</h2><div class="card">'+(A.good.length?'<h3 class="rh">Going well</h3>'+list(A.good,"var(--easy)"):'')+(A.watch.length?'<h3 class="rh">Worth watching</h3>'+list(A.watch,"var(--hills)"):'')+
      (A.prevKm!=null?'<p class="note" style="margin:6px 0 0">Last week: '+Math.round(A.prevKm)+' km'+(A.easyR.length?' · easy RPE '+avg(A.easyR).toFixed(1):'')+(A.hardR.length?' · hard RPE '+avg(A.hardR).toFixed(1):'')+'</p>':'')+'</div></section>':'')+
    (cycOn()?'<section class="block"><h2>Your cycle this week</h2><div class="card">'+energy+list(A.cyc,"var(--tempo)")+'</div></section>':(energy?'<section class="block"><h2>Energy</h2><div class="card">'+energy+'</div></section>':''))+
    (A.sugg.length?'<section class="block" id="suggs"><h2>For next week</h2>'+A.sugg.map(s=>'<div class="card" style="margin-bottom:10px"><h3 style="font-size:1.2rem;margin-bottom:6px">'+esc(s.t)+'</h3><p style="margin:0">'+esc(s.b)+'</p></div>').join("")+'</section>':'')+
    nextCard;
}
function weeklyBanner(){
  const k=lastFullWeek(); if(k<0)return "";
  const w=plan[k]; if((state.reports.weeks||[]).includes(w.w))return "";
  const from=w.mon, to=iso(addDays(parse(from),6));
  if(!allSessions().some(s=>s.date>=from&&s.date<=to))return "";
  return '<button class="banner" data-wreport="'+k+'"><b>Your week '+w.w+' report is ready</b><span>Sessions, attainment'+(cycOn()?', cycle':'')+' and a look at next week →</span></button>';
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-rw],[data-wreport]"); if(!b)return;
  if(b.dataset.rw!=null){weekSel=+b.dataset.rw;render();return}
  weekSel=+b.dataset.wreport;location.hash="#weekly";render();scrollTo(0,0);
});

function reportBanner(){
  const months=reportMonths(), cur=ymOf(todayIso());
  const m=months.filter(x=>x<cur&&!state.reports.seen.includes(x)).pop();
  if(!m||!analyse(m).due.length)return "";
  return '<button class="banner" data-report="'+m+'"><b>Your '+monthName(m).split(" ")[0]+' report is ready</b><span>See how training went'+(cycOn()?' and how your cycle played into it':'')+' →</span></button>';
}
