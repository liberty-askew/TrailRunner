"use strict";
// Ridgeline – 12-ui.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- UI helpers ---------- */
const $=s=>document.querySelector(s);
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),1800)}
const check='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
const peaksSvg='<svg class="peaks" aria-hidden="true"><use href="#topo"/></svg>';
const amount=s=>s.km!=null?(s.durMin?fmtHM(s.durMin)+" · ":"")+s.km+" km"+(s.vert?" · +"+s.vert+" m":""):s.mins+" min";

function view(){const h=location.hash.replace("#","");return ["today","plan","progress","setup","report","weekly","science"].includes(h)?h:"today"}
function render(){
  const v=state.settings?view():"setup";
  document.querySelectorAll("nav.tabs a").forEach(a=>a.setAttribute("aria-current",(a.dataset.v===v||((v==="report"||v==="weekly")&&a.dataset.v==="progress"))?"page":"false"));
  const cw=state.settings?currentWeek():null;
  $("#weekmeta").innerHTML=cw?"<b>Week "+cw.w+"</b> of "+plan.length+"<br>"+esc(cw.phase)+(cw.cut?" · recovery":""):"";
  const el=$("#view");
  if(v==="today")el.innerHTML=renderToday();
  else if(v==="plan")el.innerHTML=renderPlan();
  else if(v==="progress")el.innerHTML=renderProgress();
  else if(v==="report")el.innerHTML='<div class="rtabs"><a href="#weekly">Weekly</a><a href="#report" aria-current="page">Monthly</a></div>'+renderReport();
  else if(v==="weekly")el.innerHTML=renderWeekly();
  else if(v==="science")el.innerHTML=renderScience();
  else el.innerHTML=state.settings?renderSetup():renderOnboard();
  if(v==="report"){const b=$("#exportDataBtn");if(b)b.onclick=exportData}
  if(v==="setup"){if(state.settings)wireSetup();else wireOnboard()}
  if(v==="plan"){const c=document.querySelector(".wkhead.current");if(c&&!render._scrolled){render._scrolled=true;c.scrollIntoView({block:"start"})}}
}

function sessionRow(s,showDate){
  const st=sessStatus(s);
  const ci=showDate?cycleInfo(s.date):null;
  const sub=(showDate?DN[s.day]+" "+fmtShort(s.date)+" · ":"")+(s.loc?LOC_NAME[s.loc]+" · ":"")+amount(s)+" · "+s.effort+(sessStatus(s)==="paused"?" · paused":s.replanNote?" · eased":s.cycleNote?" · moved for your cycle":s.cycleTough?" · "+s.cycleTough:ci&&ci.phase==="Period"?" · period"+(ci.predicted?" (predicted)":""):"");
  return '<div class="rowwrap"><button class="row '+(st==="done"?"isdone":st==="skipped"?"skipped":"")+'" data-open="'+s.id+'"><span class="bar" style="background:'+col(s.type)+'"></span><span class="main"><span class="t">'+esc(s.title)+(st==="skipped"?" · skipped":"")+'</span><br><span class="s">'+esc(sub)+'</span></span></button>'+
    '<button class="tick '+(st==="done"?"on":st==="skipped"?"skip":"")+'" data-tick="'+s.id+'" aria-label="'+(st==="done"?"Mark as not done":"Mark as done")+': '+esc(s.title)+'">'+(st==="done"?check:"")+'</button></div>';
}

function renderToday(){
  const t=todayIso(), cw=currentWeek(), all=allSessions();
  const first=plan[0].mon, last=plan[plan.length-1].sessions.slice(-1)[0];
  let hero="";
  const todays=all.filter(s=>s.date===t);
  if(state.pause){
    const p=state.pause, days=Math.round((parse(t)-parse(p.from))/DAY)+1;
    hero=heroCard("var(--strength)","Paused · "+(p.kind==="injury"?"injured":"ill")+" since "+fmtShort(p.from)+" ("+days+" day"+(days===1?"":"s")+")",p.kind==="injury"?"Let it heal":"Get well first",
      p.kind==="injury"?"Nothing in the plan counts against you while you’re paused. Come back once you can walk briskly and go up and down stairs without pain – ideally with a physio’s OK. The plan will ease you back in.":"Rest until you’ve been symptom-free for a day, longer if it was below the neck (chest, fever). The plan will ease you back in when you return.",null)
      +'<div class="actions" style="margin:12px 0 4px"><button class="btn" data-resume="1">I’m back – resume the plan</button><button class="btn quiet" data-pausekind="'+(p.kind==="injury"?"ill":"injury")+'">Change to '+(p.kind==="injury"?"ill":"injured")+'</button></div>';
  } else if(t<first){
    hero=heroCard("var(--primary)","Plan starts "+fmtDay(first),"Get ready","Your first week begins on Monday. Have a look at the plan, and adjust the setup if anything looks off.",null);
  } else if(last&&t>last.date){
    hero=heroCard("var(--race)","Plan complete","Well run","That's the whole block. Head to Progress for the full picture, or set up your next goal.",null);
  } else if(!todays.length){
    const next=all.find(s=>s.date>t);
    hero=heroCard("var(--rest)",fmtDay(t),"Rest day","Recovery is where the adaptation happens. Sleep, eat well, maybe an easy walk or some mobility."+(next?" Next up: "+next.title+" on "+DN[next.day]+".":""),null);
  } else {
    const s=todays.find(x=>!sessStatus(x))||todays[0];
    hero=heroCard(col(s.type),fmtDay(t),s.title,s.summary,s,amount(s)+" · "+s.effort);
  }
  const others=todays.length>1?'<section class="block"><h2>Also today</h2><div class="list">'+todays.map(s=>sessionRow(s,false)).join("")+'</div></section>':"";
  // week strip
  const strip='<div class="strip" aria-label="This week – tap a day to check in">'+[0,1,2,3,4,5,6].map(d=>{
    const date=iso(addDays(parse(cw.mon),d)), ss=cw.sessions.filter(s=>s.date===date);
    const dots=ss.map(s=>{const st=sessStatus(s);return '<span class="dot '+(st?"":"hollow")+'" style="background:'+col(s.type)+';border-color:'+col(s.type)+';color:#fff" title="'+esc(s.title)+'">'+(st==="done"?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="5"><path d="M4 12l6 6 10-11"/></svg>':"")+'</span>'}).join("");
    return '<button type="button" class="day'+(date===t?" today":"")+'" data-day="'+date+'" aria-label="'+esc(fmtDay(date))+(state.checkins[date]?", checked in":"")+'"><div class="dn">'+DN[d]+'</div><div class="dd">'+parse(date).getDate()+(()=>{const i=cycleInfo(date);return i&&i.phase==="Period"?'<span class="pmark'+(i.predicted?" pred":"")+'" title="Period'+(i.predicted?" (predicted)":"")+'"></span>':""})()+'</div><div class="dots">'+dots+'</div>'+(state.checkins[date]&&state.checkins[date].energy?'<div class="cimk" aria-hidden="true">'+state.checkins[date].energy+'/5</div>':'')+'</button>'}).join("")+'</div>';
  const easeNote=cw.replan?'<div class="tip" style="margin:0 0 14px;border-left:4px solid var(--hills)"><b>Building back.</b> '+esc(cw.replan.msg)+' Missed training is normal – what matters is not stacking it all into one week.</div>':'';
  const wkList=easeNote+'<section class="block"><h2>This week'+(cw.cut?'<span class="phase-tag">Recovery week</span>':'')+'</h2><div class="list">'+(cw.sessions.length?cw.sessions.map(s=>sessionRow(s,true)).join(""):'<div class="empty">Nothing scheduled</div>')+'</div></section>';
  const pauseBtn=state.pause||t<first?'':'<p style="text-align:center;margin:18px 0 0"><button class="btn quiet small" data-pauseask="1">I’m ill or injured</button></p>';
  return healthBanners()+pendingBanner()+weeklyBanner()+reportBanner()+hero+cycleCard()+strip+others+wkList+pauseBtn;
}
function heroCard(bg,when,title,sum,s,big){
  const st=s&&sessStatus(s);
  const actions=(s?locSwitch(s):"")+(s?'<div class="actions">'+(st==="done"?'<span class="done-badge">'+check+' Done</span><button class="btn ghost small" data-open="'+s.id+'">View log</button>':'<button class="btn light" '+((s.type==="strength"||s.type==="bike")?'data-setlog':'data-log')+'="'+s.id+'">'+((s.type==="strength"||s.type==="bike")?'Log it in Setlog':'Mark as done')+'</button><button class="btn ghost" data-open="'+s.id+'">See workout</button>')+'</div>':"");
  return '<div class="hero" style="background:'+bg+'">'+peaksSvg+'<div class="when">'+esc(when)+'</div><h1>'+esc(title)+'</h1>'+(big?'<div class="big">'+esc(big)+'</div>':"")+'<p class="sum">'+esc(sum)+'</p>'+actions+'</div>';
}

function renderPlan(){
  const cw=currentWeek();
  return plan.map(w=>{
    const runs=w.sessions;
    const done=runs.filter(s=>sessStatus(s)==="done").length;
    const km=runs.reduce((a,s)=>a+(s.km||0),0);
    const open=w===cw||renderPlan.open[w.w];
    return '<div class="wk'+(open?" open":"")+'"><button class="wkhead'+(w===cw?" current":"")+'" data-wk="'+w.w+'" aria-expanded="'+!!open+'"><span><h3>Week '+w.w+'<span class="phase-tag">'+esc(w.phase)+(w.cut?" · recovery":"")+(w.camp?" · camp":"")+(w.replan?" · eased":"")+'</span></h3><span class="meta">'+fmtShort(w.mon)+' · '+Math.round(km)+' km running · '+runs.length+' sessions</span></span><span><span class="meta">'+done+'/'+runs.length+'</span><span class="prog"><i style="width:'+(runs.length?done/runs.length*100:0)+'%"></i></span></span></button>'+
      (open?'<div class="list">'+runs.map(s=>sessionRow(s,true)).join("")+'</div>':"")+'</div>';
  }).join("");
}
renderPlan.open={};

function renderProgress(){
  const all=allSessions(), t=todayIso();
  const past=all.filter(s=>s.date<=t);
  const done=all.filter(s=>sessStatus(s)==="done");
  const extraKm=(state.extras||[]).filter(x=>x.sport==="run").reduce((a,x)=>a+x.km,0);
  const kmDone=done.reduce((a,s)=>a+(s.km!=null?(+(state.log[s.id].actual)||s.km):0),0)+extraKm;
  const minsX=done.filter(s=>s.mins).reduce((a,s)=>a+(+(state.log[s.id].actual)||s.mins),0);
  const due=past.length, comp=due?Math.round(past.filter(s=>sessStatus(s)==="done").length/due*100):0;
  // streak: consecutive completed among due sessions, newest first (today's unfinished doesn't break it)
  let streak=0;for(const s of past.slice().reverse()){const st=sessStatus(s);if(st==="done")streak++;else if(s.date===t&&!st)continue;else break}
  const rpes=done.map(s=>+state.log[s.id].rpe).filter(Boolean);
  // ridgeline
  const W=640,H=180,pl=8,pr=8,pt=24,pb=26;
  const vols=plan.map(w=>w.sessions.reduce((a,s)=>a+(s.km||0),0));
  const dvols=plan.map(w=>{const end=iso(addDays(parse(w.mon),7));return w.sessions.filter(s=>sessStatus(s)==="done").reduce((a,s)=>a+(s.km!=null?(+(state.log[s.id].actual)||s.km):0),0)+(state.extras||[]).filter(x=>x.sport==="run"&&x.date>=w.mon&&x.date<end).reduce((a,x)=>a+x.km,0)});
  const max=Math.max(...vols,...dvols,1)*1.1;
  const x=i=>pl+(plan.length===1?0:i*(W-pl-pr)/(plan.length-1));
  const y=v=>H-pb-(v/max)*(H-pt-pb);
  const pts=a=>a.map((v,i)=>x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ");
  const cwI=plan.indexOf(currentWeek());
  const area=(a,n)=>"M"+x(0)+","+(H-pb)+" L"+a.slice(0,n).map((v,i)=>x(i).toFixed(1)+","+y(v).toFixed(1)).join(" L")+" L"+x(n-1)+","+(H-pb)+" Z";
  const n=Math.max(1,cwI+1);
  // Journey map: the plan drawn as a trail over contour lines. Height = planned km that week; the walked part
  // (completed km) fills in yellow up to this week; waypoints mark weeks, camps and recovery weeks; a flag marks race day.
  const route=vols.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1)).join(" ");
  const walked=dvols.slice(0,n).map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1)).join(" ");
  const svg='<svg class="journey" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Your journey to race day: planned and completed km by week"><use href="#topo" x="0" y="0" width="'+W+'" height="'+H+'" opacity=".22" color="var(--primary)"/>'+
    '<path d="'+area(vols,vols.length)+'" fill="var(--ridge)" opacity=".55"/><path d="'+area(dvols,n)+'" fill="var(--ridgeDone)" opacity=".25"/>'+
    '<path d="'+route+'" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linejoin="round" stroke-dasharray="2 7" stroke-linecap="round"/>'+
    (n>1?'<path d="'+walked+'" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>':'')+
    plan.map((w,i)=>{const cls=i<cwI?"done":i===cwI?"now":"";const r=i===cwI?6:w.camp?4.5:3;return '<circle class="stop '+cls+(w.camp?" camp":"")+'" cx="'+x(i)+'" cy="'+y(i<=cwI?dvols[i]:vols[i])+'" r="'+r+'"><title>Week '+w.w+(w.camp?" · camp":w.cut?" · recovery":"")+': '+Math.round(vols[i])+' km planned'+(i<=cwI?', '+Math.round(dvols[i])+' run':'')+'</title></circle>'}).join("")+
    (cwI>=0?'<text x="'+x(cwI)+'" y="'+(y(dvols[cwI])-14)+'" text-anchor="'+(cwI>plan.length*0.8?"end":cwI<plan.length*0.2?"start":"middle")+'" class="lbl">You are here</text>':"")+
    '<g transform="translate('+(x(plan.length-1)-2)+','+(y(vols[vols.length-1])-24)+')"><line x1="0" y1="0" x2="0" y2="22" stroke="var(--intervals)" stroke-width="2"/><path d="M0 0 L14 5 L0 10Z" fill="var(--intervals)"/></g>'+
    '<text x="'+x(plan.length-1)+'" y="'+(y(vols[vols.length-1])-28)+'" text-anchor="end" class="lbl">Race day</text>'+
    plan.map((w,i)=>(i%Math.ceil(plan.length/8)===0||i===plan.length-1)?'<text x="'+x(i)+'" y="'+(H-8)+'" text-anchor="'+(i===0?"start":i===plan.length-1?"end":"middle")+'" font-size="11" fill="var(--muted)" font-family="Archivo, sans-serif">W'+w.w+'</text>':"").join("")+'</svg>';
  const recent=done.filter(s=>state.log[s.id].at).sort((a,b)=>state.log[b.id].at-state.log[a.id].at).slice(0,6);
  return '<div class="rbtns"><a class="banner" href="#weekly"><b>Weekly report</b><span>This week, day by day →</span></a><a class="banner" href="#report"><b>Monthly report</b><span>Trends'+(cycOn()?', cycle':'')+' and adjustments →</span></a></div>'+'<div class="ridgecard">'+svg+'<div class="legend"><span style="--c:var(--ridge)">Planned km</span><span style="--c:var(--accent)">Your trail so far</span><span style="--c:var(--intervals)">Camp weekend</span></div></div>'+
   '<div class="stats"><div class="stat"><div class="v">'+comp+'%</div><div class="l">of sessions due so far</div></div><div class="stat"><div class="v">'+Math.round(kmDone)+'</div><div class="l">km run</div></div><div class="stat"><div class="v">'+streak+'</div><div class="l">session streak</div></div><div class="stat"><div class="v">'+(Math.round(minsX/6)/10)+'h</div><div class="l">bike & strength</div></div></div>'+
   cycleInsights()+'<section class="block"><h2>Recently logged</h2><div class="list">'+(recent.length?recent.map(s=>{const L=state.log[s.id];return '<button class="row" data-open="'+s.id+'"><span class="bar" style="background:'+col(s.type)+'"></span><span class="main"><span class="t">'+esc(s.title)+'</span><br><span class="s">'+esc(fmtShort(s.date)+" · "+(L.actual||(s.km!=null?s.km:s.mins))+(s.km!=null?" km":" min")+(L.rpe?" · RPE "+L.rpe:"")+(L.note?" · "+L.note:""))+'</span></span></button>'}).join(""):'<div class="empty">Tick off your first session and it’ll show up here.</div>')+'</div></section>'+
   (rpes.length?'<p class="note" style="margin-top:12px">Average effort across logged sessions: RPE '+(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1)+'. If easy days are creeping above 5, slow them down.</p>':"");
}

/* ---------- setup ---------- */
function defaults(){const m=mondayOf(new Date());return {goal:"50k",startDate:iso(m),raceDate:iso(addDays(m,16*7-1)),runDays:4,longDay:6,baseKm:30,bike:true,gym:true}}
function renderSetup(){
  const s=Object.assign(defaults(),state.settings||{});
  const seg=(name,opts,val)=>'<div class="seg" data-seg="'+name+'">'+opts.map(([v,l])=>'<button type="button" data-val="'+v+'" aria-pressed="'+(String(v)===String(val))+'">'+l+'</button>').join("")+'</div>';
  return (state.settings?'':'<div class="hero" style="background:var(--primary);margin-bottom:16px">'+peaksSvg+'<h1>Build your plan</h1><p class="sum">Tell me the goal and where you are now. You’ll get a week-by-week plan you can tick off as you go.</p></div>')+
  '<form class="card" id="setupForm">'+
  '<label class="f"><span>Goal</span>'+seg("goal",Object.entries(GOALS).map(([k,g])=>[k,g.label]),s.goal)+'</label>'+
  '<label class="f"><span>Start date</span><input type="date" name="startDate" value="'+s.startDate+'" required><small>The plan starts on the Monday of this week.</small></label>'+
  '<label class="f"><span>Race or goal date</span><input type="date" name="raceDate" value="'+s.raceDate+'" required><small>Plans run from 4 to 30 weeks.</small></label>'+
  '<label class="f"><span>Current weekly running</span><input type="number" name="baseKm" min="10" max="150" step="1" value="'+s.baseKm+'"><small>Roughly what you’ve averaged over the last month, in km. The plan builds about 8% a week with a recovery week every fourth.</small></label>'+
  '<label class="f"><span>Longest run in the last month (km)</span><input type="number" name="longest" min="3" max="100" step="1" value="'+(s.longest||Math.round((s.baseKm||30)*0.4))+'"><small>No planned run will be more than 10% longer than your longest in the previous 30 days – single big jumps are linked to overuse injuries.</small></label>'+
  '<div id="vertBox" '+(GOALS[s.goal]&&GOALS[s.goal].trail?'':'hidden')+'><label class="f"><span>Race climbing (metres of ascent)</span><input type="number" name="raceVert" min="0" max="20000" step="100" value="'+(s.raceVert||(GOALS[s.goal]&&GOALS[s.goal].vert)||2500)+'"><small>Sets your weekly climbing target.</small></label>'+
  '<label class="f"><span>Climbing in a typical week now (m)</span><input type="number" name="weekVert" min="0" max="10000" step="50" value="'+(s.weekVert||400)+'"></label></div>'+
  '<label class="f"><span>Runs per week</span>'+seg("runDays",[[3,"3"],[4,"4"],[5,"5"],[6,"6"]],s.runDays)+'</label>'+
  '<label class="f"><span>Long run day</span>'+seg("longDay",DN.map((d,i)=>[i,d]),s.longDay)+'</label>'+
  '<div class="toggle"><span><b>Strength sessions</b><br><span class="note">Two a week, focused on single-leg strength, calves and hips.</span></span><input type="checkbox" name="gym" '+(s.gym?"checked":"")+' aria-label="Include strength sessions"></div>'+
  (()=>{const K=kitsOf(s), L=Object.assign({},DEFAULT_STRLOC,s.strLoc||{});
    const kit=(k,label)=>'<span style="display:block;font-weight:700;margin:10px 0 6px">'+label+'</span><div class="seg" data-kit="'+k+'">'+Object.entries(EQUIP).filter(([e])=>k==="gym"||e!=="gym").map(([e,l])=>'<button type="button" data-eq="'+e+'" aria-pressed="'+K[k].includes(e)+'">'+l+'</button>').join("")+'</div>';
    const where=v=>'<span style="display:block;font-weight:700;margin:12px 0 6px">Strength '+v+' usually</span><div class="seg" data-seg="loc'+v+'">'+["home","gym"].map(l=>'<button type="button" data-val="'+l+'" aria-pressed="'+(L[v]===l)+'">'+(l==="home"?"At home":"At the gym")+'</button>').join("")+'</div>';
    return '<div class="equip" id="equipBox" '+(s.gym?'':'hidden')+'>'+kit("home","Equipment at home")+kit("gym","Equipment at the gym")+where("A")+where("B")+
      '<small class="note" style="display:block;margin-top:8px">Each strength session has a home and a gym version, and you can switch any day with one tap. Workouts use the best exercise each kit allows.</small></div>'})()+
  '<div class="toggle"><span><b>Bike cross-training</b><br><span class="note">One easy ride a week for low-impact aerobic volume.</span></span><input type="checkbox" name="bike" '+(s.bike?"checked":"")+' aria-label="Include bike sessions"></div>'+
  (()=>{const c=state.cycle||{};const last=c.starts&&c.starts.length?c.starts[c.starts.length-1]:"";return '<div class="toggle"><span><b>Cycle-aware training</b><br><span class="note">Daily check-in and suggestions to swap or move hard sessions on rough days. Stays on this phone.</span></span><input type="checkbox" name="cycOn" id="cycOn" '+(c.on?"checked":"")+' aria-label="Cycle-aware training"></div>'+
   '<div id="cycFields" '+(c.on?"":"hidden")+' style="padding-top:8px"><label class="f"><span>First day of your last period</span><input type="date" name="cycStart" value="'+last+'"></label>'+
   '<label class="f"><span>Typical cycle length (days)</span><input type="number" name="cycLen" min="18" max="45" value="'+(c.len||28)+'"><small>Updates itself once you’ve logged a couple of periods.</small></label>'+
   '<label class="f"><span>Typical period length (days)</span><input type="number" name="cycPlen" min="2" max="10" value="'+(c.plen||5)+'"></label>'+
   '<div style="margin:14px 0 6px;font-weight:800">Your cycle and training</div>'+profileFields(c.profile,"st")+
   '<div class="toggle"><span><b>I use hormonal contraception</b><br><span class="note">Hides cycle-phase labels and the late-period prompts, which don’t apply. Check-ins and swaps still work.</span></span><input type="checkbox" name="cycHc" '+(c.hc?"checked":"")+' aria-label="I use hormonal contraception"></div></div>'})()+
  '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn" type="submit">'+(state.settings?"Update plan":"Create plan")+'</button>'+(state.settings?'<button class="btn quiet" type="button" id="resetBtn">Clear all progress</button>':'')+'</div>'+
  (state.settings?'<p class="note" style="margin-top:12px">Updating keeps ticks for any session that stays on the same day.</p>':'')+
  '</form>'+
  (state.settings?healthCard()+icuCard()+setlogCard()+luaCard():'')+'<section class="block"><h2>Backup</h2><div class="card"><p class="note" style="margin-top:0">Your plan and logs are saved on this phone. Export a backup now and then, or to move to a new device.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn quiet" type="button" id="exportBtn">Export backup</button><button class="btn quiet" type="button" id="exportCsvBtn">Export data (CSV)</button><label class="btn quiet" style="display:inline-block">Import backup<input type="file" id="importIn" accept="application/json,.json" hidden></label></div></div></section>';
}
function wireSetup(){
  const f=$("#setupForm"); if(!f)return;
  f.querySelector('[data-seg="goal"]').addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;$("#vertBox").hidden=!GOALS[b.dataset.val].trail;
    const rv=f.raceVert;if(rv&&GOALS[b.dataset.val].vert)rv.value=GOALS[b.dataset.val].vert});
  f.querySelectorAll("[data-eq]").forEach(b=>b.addEventListener("click",()=>b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")!=="true")));
  f.gym.addEventListener("change",()=>{$("#equipBox").hidden=!f.gym.checked});
  f.querySelectorAll("[data-seg]").forEach(g=>g.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;g.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b))}));
  f.addEventListener("submit",e=>{
    e.preventDefault();
    const segv=n=>f.querySelector('[data-seg="'+n+'"] [aria-pressed="true"]').dataset.val;
    const s={goal:segv("goal"),runDays:+segv("runDays"),longDay:+segv("longDay"),startDate:f.startDate.value,raceDate:f.raceDate.value,baseKm:Math.max(10,Math.min(150,+f.baseKm.value||25)),bike:f.bike.checked,gym:f.gym.checked,longest:Math.max(3,+f.longest.value||10),raceVert:Math.max(0,+((f.raceVert||{}).value)||0),weekVert:Math.max(0,+((f.weekVert||{}).value)||0),kits:{home:[...f.querySelectorAll('[data-kit="home"] [data-eq][aria-pressed=true]')].map(b=>b.dataset.eq),gym:[...f.querySelectorAll('[data-kit="gym"] [data-eq][aria-pressed=true]')].map(b=>b.dataset.eq)},strLoc:{A:segv("locA"),B:segv("locB")}};
    if(!s.startDate||!s.raceDate||s.raceDate<=s.startDate){toast("Race date needs to be after the start date");return}
    const first=!state.settings;
    if(f.cycOn.checked){
      const c=state.cycle=Object.assign({starts:[]},state.cycle||{},{on:true,hc:f.cycHc.checked,len:Math.min(45,Math.max(18,+f.cycLen.value||28)),plen:Math.min(10,Math.max(2,+f.cycPlen.value||5))});
      if(!f.cycStart.value){toast("Add the first day of your last period");return}
      if(!c.starts.includes(f.cycStart.value)){c.starts.push(f.cycStart.value);c.starts.sort()}
      c.profile=readProfile(f,"st");
    } else if(state.cycle)state.cycle.on=false;
    state.settings=s; state.moves={}; logEvent(first?"plan_created":"plan_updated",{goal:s.goal,runDays:s.runDays,baseKm:s.baseKm}); save(); rebuild();
    toast(first?"Plan created":"Plan updated");
    location.hash=first?"#plan":"#today"; render();
  });
  $("#exportCsvBtn").addEventListener("click",exportData);
  wireIcu();
  $("#exportBtn").addEventListener("click",async()=>{
    const sl=await slReadAll(), lp=await luaReadAll();
    const blob=new Blob([JSON.stringify(Object.assign({},state,sl?{setlog:sl}:{},lp?{lua:{periods:lp}}:{}),null,2)],{type:"application/json"});
    const name="ridgeline-backup-"+todayIso()+".json";
    try{
      const file=new File([blob],name,{type:"application/json"});
      if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Ridgeline backup"});return}
    }catch(e){if(e&&e.name==="AbortError")return}
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });
  $("#importIn").addEventListener("change",async e=>{
    const f=e.target.files[0];if(!f)return;
    try{const d=JSON.parse(await f.text());if(!d||typeof d!=="object"||!("log" in d))throw 0;
      if(!confirm("Replace everything on this device with the backup?"))return;
      if(d.setlog&&typeof d.setlog==="object"){try{await slReplaceAll(d.setlog)}catch(err){toast("Ridgeline restored, but Setlog data couldn’t be")}}
      delete d.setlog;
      if(d.lua&&Array.isArray(d.lua.periods)){try{if(!await luaReplaceAll(d.lua.periods))toast("Open the period calendar once, then restore again to bring back Lua’s periods")}catch(err){}}
      delete d.lua;
      state=Object.assign({settings:null,log:{},moves:{},extras:[],swaps:{},cycle:null,checkins:{},events:[],reports:{seen:[],weeks:[]},pending:[],pause:null,pauses:[]},d);save();rebuild();toast("Backup restored");render();
    }catch(err){toast("That file isn’t a Ridgeline backup")}
  });
  $("#cycOn").addEventListener("change",e=>{$("#cycFields").hidden=!e.target.checked});
  const rb=$("#resetBtn");
  if(rb)rb.addEventListener("click",()=>{if(confirm("Clear every tick, log and note? Your plan settings stay.")){state.log={};state.moves={};save();rebuild();toast("Progress cleared");render()}});
}

/* ---------- sheet ---------- */
let lastFocus=null;
function openSheet(html){lastFocus=document.activeElement;const sh=$("#sheet");sh.innerHTML=html;$("#scrim").classList.add("show");sh.classList.add("show");const f=sh.querySelector("button,input,textarea");if(f)f.focus()}
function closeSheet(){const sh=$("#sheet");if(sh._onClose){const f=sh._onClose;sh._onClose=null;f()}sh.classList.remove("show");$("#scrim").classList.remove("show");if(lastFocus&&document.contains(lastFocus))lastFocus.focus()}
function sheetFor(id,logMode){
  const s=findS(id); if(!s)return;
  const L=state.log[id]||{}; const st=L.status;
  const isKm=s.km!=null;
  const wk=plan.find(w=>w.w===s.week);
  const moveOpts=[0,1,2,3,4,5,6].map(d=>{const date=iso(addDays(parse(wk.mon),d));return '<option value="'+date+'"'+(date===s.date?" selected":"")+'>'+DN[d]+" "+fmtShort(date)+'</option>'}).join("");
  const head='<div class="sh" style="background:'+col(s.type)+';position:relative"><button class="closex" data-close aria-label="Close">×</button><div>'+esc(fmtDay(s.date))+'</div><h2 id="sheetTitle">'+esc(s.title)+'</h2><div class="display" style="font-size:1.3rem;font-weight:600;opacity:.95">'+esc(amount(s)+" · "+s.effort)+'</div></div>';
  const swaps=locSwitch(s)+(s.exercises&&!st?'<div class="card" style="background:var(--surface2);margin-bottom:16px;padding:14px"><b>Change exercises</b><span class="note" style="display:block;margin:2px 0 10px">Only shows options your kit allows (Setup → Equipment). Changes apply to this session only.</span>'+
    s.exercises.filter(e=>e.slot>=0).map(e=>{const v=(s.title.match(/Strength ([AB])/)||[])[1]||"A";const eq=kitFor(s);const opts=slotOptions(v,e.slot,eq);if(!opts.includes(e.id))opts.unshift(e.id);
      return '<label class="f" style="margin-bottom:10px"><span style="font-weight:600;font-size:.9rem">'+esc(SLOT_NAMES[v][e.slot])+'</span><select data-exswap="'+id+'|'+e.slot+'"'+(opts.length<2?' disabled':'')+'>'+opts.map(o=>'<option value="'+o+'"'+(o===e.id?' selected':'')+'>'+esc(XL[o].name)+'</option>').join("")+'</select></label>'}).join("")+
    (state.exOver&&state.exOver[id]?'<button class="btn quiet small" data-exreset="'+id+'">Back to the planned exercises</button>':'')+'</div>':'');
  const steps=swaps+'<ol class="steps" style="--c:'+col(s.type)+'">'+s.steps.map(([a,b])=>'<li><b>'+esc(a)+'</b>'+(b?'<span class="note">'+esc(b)+'</span>':"")+'</li>').join("")+'</ol><div class="tip">'+esc(s.tip)+'</div>';
  const logForm='<h3 style="font-size:1.4rem;margin:4px 0 12px">'+(st==="done"?"Your log":"Log it")+'</h3>'+(L.src?actSummary(L)+'<p class="note" style="margin-top:-6px">Imported from '+esc(L.src)+'</p>':'')+
    '<label class="f"><span>'+(isKm?"Distance (km)":"Duration (min)")+'</span><input type="number" id="lgAct" step="'+(isKm?"0.1":"5")+'" min="0" value="'+esc(L.actual||(isKm?s.km:s.mins))+'"></label>'+
    '<div class="f"><span style="display:block;font-weight:600;margin-bottom:6px" id="rpeL">How hard did it feel? (RPE 1–10)</span><div class="rpe" role="group" aria-labelledby="rpeL">'+[1,2,3,4,5,6,7,8,9,10].map(n=>'<button type="button" data-rpe="'+n+'" aria-pressed="'+(+L.rpe===n)+'">'+n+'</button>').join("")+'</div></div>'+
    (TYPES[s.type].run&&((s.durMin||Math.round((s.km||0)*6.3))>=75)?'<div class="fuelbox"><b>Fuelling and drinking</b>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px"><label class="f"><span>Carbohydrate (g per hour)</span><input type="number" id="lgCarb" min="0" max="150" step="5" value="'+esc(L.carbs??"")+'"></label>'+
      '<label class="f"><span>Gut</span><select id="lgGi"><option value="">–</option>'+["Fine","Mild issues","Bad"].map(o=>'<option'+(L.gi===o?' selected':'')+'>'+o+'</option>').join("")+'</select></label>'+
      '<label class="f"><span>Weight before (kg)</span><input type="number" id="lgWb" min="20" max="200" step="0.1" value="'+esc(L.wb??"")+'"></label>'+
      '<label class="f"><span>Weight after (kg)</span><input type="number" id="lgWa" min="20" max="200" step="0.1" value="'+esc(L.wa??"")+'"></label></div>'+
      (L.wb&&L.wa?(L.wa>L.wb?'<p class="tip" style="margin:0;border-left:4px solid var(--intervals)"><b>You finished '+(L.wa-L.wb).toFixed(1)+' kg heavier.</b> That means you drank more than you lost – the main cause of low blood sodium (hyponatraemia) in long events. Drink to thirst next time.</p>':'<p class="note" style="margin:0">Change: '+(L.wa-L.wb).toFixed(1)+' kg ('+((L.wa-L.wb)/L.wb*100).toFixed(1)+'%). Finishing the same or a little lighter is what you want.</p>'):'<p class="note" style="margin:0">Weigh yourself before and after your first few long runs to learn how much you sweat.</p>')+'</div>':'')+
    '<label class="f"><span>Notes</span><textarea id="lgNote" placeholder="Terrain, how the legs felt, fuelling…">'+esc(L.note||"")+'</textarea></label>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-save="'+id+'">'+(st==="done"?"Update log":"Mark as done")+'</button>'+(st?'<button class="btn quiet" data-undo="'+id+'">Mark as not done</button>':'<button class="btn quiet" data-skip="'+id+'">Skip this one</button>')+'</div>';
  const unswap=s.swapped?'<button class="btn quiet small" style="margin-top:16px" data-unswap="'+id+'">Restore the original session</button>':'';
  const move=unswap+'<label class="f" style="margin-top:20px"><span>Move to another day</span><select id="lgMove" data-move="'+id+'">'+moveOpts+'</select></label>';
  openSheet(head+'<div class="sb">'+toughNotes(s)+slDetail(L)+(slButton(s)?'<div style="margin-bottom:16px">'+slButton(s)+'<span class="note" style="display:block;margin-top:6px">Opens with this session’s exercises ready to log. It ticks off here when you finish.</span></div>':'')+(logMode?logForm+'<details style="margin-top:20px"><summary style="font-weight:600;cursor:pointer">Workout details</summary><div style="margin-top:12px">'+steps+'</div></details>':steps+logForm)+move+'</div>');
}
