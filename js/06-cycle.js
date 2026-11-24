"use strict";
// Ridgeline – 06-cycle.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- cycle-aware training ---------- */
const HARD=new Set(["hills","intervals","tempo","long"]);
const SYMS=["Cramps","Fatigue","Heavy flow","Headache","Bloating","Poor sleep","Bone pain","Shin pain"];
const cycOn=()=>!!(state.cycle&&state.cycle.on&&state.cycle.starts&&state.cycle.starts.length);
function avgLen(){
  const c=state.cycle, s=c.starts.slice().sort(), iv=[];
  for(let i=1;i<s.length;i++){const d=Math.round((parse(s[i])-parse(s[i-1]))/DAY);if(d>=18&&d<=45)iv.push(d)}
  const last=iv.slice(-3);
  return last.length?Math.round(last.reduce((a,b)=>a+b,0)/last.length):(+c.len||28);
}
function cycleInfo(date){
  if(!cycOn())return null;
  const c=state.cycle, starts=c.starts.slice().sort(), plen=+c.plen||5;
  let len=avgLen();
  let st=null; for(const s of starts)if(s<=date)st=s;
  if(!st)return null;
  const nx=starts.find(s=>s>st); if(nx){const L=Math.round((parse(nx)-parse(st))/DAY);if(L>=18&&L<=45)len=L}
  let day=Math.round((parse(date)-parse(st))/DAY)+1, predicted=false;
  if(day>len){predicted=true;day=((day-1)%len)+1}
  // With hormonal contraception there are no natural phases, so none are labelled.
  const stg=typeof healthStage==="function"?healthStage():"cycling";
  const phase=day<=plen?"Period":stg==="peri"?"Perimenopause":c.hc?"Hormonal cycle":day<=len-16?"Follicular":day<=len-12?"Ovulation window":day<=len-6?"Luteal":"Late luteal";
  return {day,phase,predicted,len,last:starts[starts.length-1]};
}
const PHASE_NOTE={
  "Period":"Plenty of people train normally on their period; others feel flat or crampy for a day or two. Go by today’s check-in, not the calendar.",
  "Follicular":"Many people find hard sessions feel a little easier in this phase – a good time to hit your quality workouts.",
  "Ovulation window":"No changes needed for most people. Train as planned.",
  "Luteal":"Core temperature runs slightly higher in this phase, so drink well and pace hot long runs by effort or heart rate – worth remembering for summer mountain days.",
  "Perimenopause":"Cycles get less predictable in perimenopause, so Ridgeline doesn’t label phases. Keep checking in: your own pattern of energy, sleep and heat tolerance is what counts.",
  "Hormonal cycle":"With hormonal contraception, natural cycle phases don't apply, so Ridgeline doesn't label them. Keep checking in, and swap sessions on rough days.",
  "Late luteal":"Sleep, mood and energy can dip for some people before a period. If a hard session feels heavy, swap it."
};
const PHASE_COL={"Perimenopause":"var(--muted)","Hormonal cycle":"var(--muted)","Period":"var(--intervals)","Follicular":"var(--easy)","Ovulation window":"var(--hills)","Luteal":"var(--tempo)","Late luteal":"var(--tempo)"};
function ciBlock(date){
  const ci=state.checkins[date]||{};
  const chips=(arr,key,sel)=>arr.map((v,i)=>{const val=key==="energy"?i+1:v;return '<button type="button" data-ci="'+key+'|'+val+'|'+date+'" aria-pressed="'+sel(val)+'">'+v+'</button>'}).join("");
  return '<div class="f"><span style="display:block;font-weight:700;margin-bottom:6px">Energy <span class="note" style="font-weight:400">1 = drained, 5 = great</span></span><div class="seg">'+chips(["1","2","3","4","5"],"energy",v=>ci.energy===v)+'</div></div>'+
   '<div><span style="display:block;font-weight:700;margin-bottom:6px">Anything else?</span><div class="seg">'+chips(SYMS,"sym",v=>(ci.sym||[]).includes(v))+'</div></div>';
}
function daySheet(date,refresh){
  const info=cycleInfo(date), ss=allSessions().filter(s=>s.date===date), t=todayIso();
  const isStart=cycOn()&&state.cycle.starts.includes(date);
  const html='<div class="sh" style="background:var(--primary);position:relative"><button class="closex" data-close aria-label="Close">×</button><div>'+(info?'Cycle day '+info.day+' · '+info.phase+(info.predicted?' (predicted)':''):'Daily check-in')+'</div><h2 id="sheetTitle">'+esc(fmtDay(date))+'</h2></div><div class="sb">'+
   (date>t?'<p class="note" style="margin-top:0">You can check in once the day arrives.</p>':ciBlock(date)+
   (cycOn()?'<div class="toggle" style="margin-top:16px"><span><b>Period started this day</b></span><input type="checkbox" data-pstart="'+date+'" '+(isStart?"checked":"")+' aria-label="Period started this day"></div>':''))+
   (ss.length?'<h3 style="font-size:1.25rem;margin:18px 0 8px">Sessions</h3><div class="list" style="background:var(--surface2)">'+ss.map(s=>sessionRow(s,false)).join("")+'</div>':'')+'</div>';
  const sh=$("#sheet"); sh.dataset.day=date;
  if(refresh&&sh.classList.contains("show"))sh.innerHTML=html; else openSheet(html);
}
function needsEase(ci){return ci&&((ci.energy&&ci.energy<=2)||(ci.sym||[]).length>=2||(ci.sym||[]).some(x=>x==="Cramps"||x==="Heavy flow"))}
function cycleCard(){
  if(!cycOn())return "";
  const t=todayIso(), info=cycleInfo(t); if(!info)return "";
  const ci=state.checkins[t]||{}, started=state.cycle.starts.includes(t);
  const since=Math.round((parse(t)-parse(info.last))/DAY);
  const fuel=state.cycle.hc||(typeof healthStage==="function"&&healthStage()!=="cycling")?0:since>90?2:since>Math.max(35,avgLen()+5)?1:0;
  const bone=Object.entries(state.checkins).filter(([d,c])=>d>iso(addDays(new Date(),-14))&&(c.sym||[]).includes("Bone pain")).length;
  let sugg="";
  const hard=allSessions().find(s=>s.date===t&&HARD.has(s.type)&&!sessStatus(s));
  const tough=toughDay(t), pr=prof();
  const prot=!!tough&&!(pr&&pr.mode==="auto");
  if(hard&&(needsEase(ci)||prot)){
    const wk=plan.find(w=>w.w===hard.week);
    const tgt=wk.sessions.find(s=>s.date>t&&s.type==="easy"&&!sessStatus(s)&&!s.swapped);
    sugg='<div class="tip" style="margin:14px 0 0;border-left:4px solid var(--accent)">'+(needsEase(ci)?'<b>Not feeling it today?</b>':'<b>Today is likely to be '+esc(tough.why)+'</b>, which you said is tough.')+'<br>You could swap '+esc(hard.title.toLowerCase())+' for an easy '+r5(Math.max(4,(hard.km||8)*0.7))+' km'+(tgt?', or move it to '+DN[tgt.day]+' and run that day’s easy session today':'')+'.<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn small" data-swap="'+hard.id+'">Swap to easy</button>'+(tgt?'<button class="btn quiet small" data-mv="'+hard.id+'|'+tgt.id+'">Move to '+DN[tgt.day]+'</button>':'')+'</div></div>';
  }
  return '<section class="block"><div class="card cyc"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><h3 style="font-size:1.25rem"><span class="pdot" style="background:'+PHASE_COL[info.phase]+'"></span>Cycle day '+info.day+' · '+info.phase+(info.predicted?' (predicted)':'')+'</h3>'+(started?'<span class="note">Period logged today</span>':'<button class="btn quiet small" data-period="1">Period started today</button>')+'</div>'+
   '<p class="note" style="margin:8px 0 14px">'+PHASE_NOTE[info.phase]+' <a href="lua/">Open period calendar</a></p>'+
   (fuel===2?'<p class="tip" style="margin:0 0 14px;border-left:4px solid var(--intervals)"><b>It’s been '+since+' days since your last period.</b> Three months without one during heavy training is a recognised warning sign of low energy availability, which affects bone health and injury risk. Please see your GP or a sports medicine doctor, and make sure big training days are well fuelled.</p>':
    fuel===1?'<p class="tip" style="margin:0 0 14px">Your cycle is longer than usual ('+since+' days). Cycles vary for lots of reasons, but a late or missed period during heavy training can be a sign of under-fuelling. Check you’re eating enough around long runs and big weeks, and mention it to your GP if it happens again.</p>':'')+
   (bone>=2?'<p class="tip" style="margin:0 0 14px;border-left:4px solid var(--intervals)"><b>Bone pain on '+bone+' days in the last two weeks.</b> Pain in a bone (shin, foot, hip) that’s worse with running can be an early stress injury. Cut back the running and get it checked by a physio or doctor before it progresses.</p>':'')+
   ciBlock(t)+sugg+'</div></section>';
}
function cycleInsights(){
  if(!cycOn())return "";
  const by={};
  Object.entries(state.checkins).forEach(([d,ci])=>{const i=cycleInfo(d);if(!i||!ci.energy)return;(by[i.phase]=by[i.phase]||{e:[],r:[]}).e.push(ci.energy)});
  allSessions().forEach(s=>{const L=state.log[s.id];if(!L||!L.rpe||!HARD.has(s.type))return;const i=cycleInfo(s.date);if(i)(by[i.phase]=by[i.phase]||{e:[],r:[]}).r.push(+L.rpe)});
  const phases=["Period","Follicular","Ovulation window","Luteal","Late luteal"].filter(p=>by[p]&&by[p].e.length>=3);
  if(phases.length<2)return '<section class="block"><h2>Your cycle</h2><div class="card note">Check in on the Today screen for a few weeks and your own patterns will show up here – energy by phase, and how hard your key sessions felt.</div></section>';
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  return '<section class="block"><h2>Your cycle</h2><div class="card">'+phases.map(p=>{const e=avg(by[p].e),r=by[p].r.length>=2?avg(by[p].r):null;return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-weight:700"><span><span class="pdot" style="background:'+PHASE_COL[p]+'"></span>'+p+'</span><span>'+e.toFixed(1)+' / 5</span></div><div class="prog" style="width:100%;margin:4px 0 2px;height:8px"><i style="width:'+(e/5*100)+'%;background:'+PHASE_COL[p]+'"></i></div>'+(r?'<span class="note">Hard sessions felt RPE '+r.toFixed(1)+' on average</span>':'')+'</div>'}).join("")+'<p class="note" style="margin:4px 0 0">Based on '+Object.keys(state.checkins).length+' check-ins. Use this to spot your own pattern – for example, which days to protect from hard sessions.</p></div></section>';
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-ci],[data-period],[data-swap],[data-mv],[data-day],[data-protect],[data-report],[data-rm]"); if(!b)return;
  const t=todayIso(), d=b.dataset;
  if(d.ci){
    const [k,v,dt]=d.ci.split("|"); const day=dt||t; const ci=state.checkins[day]=state.checkins[day]||{};
    if(k==="energy")ci.energy=ci.energy===+v?undefined:+v;
    else{ci.sym=ci.sym||[];ci.sym=ci.sym.includes(v)?ci.sym.filter(x=>x!==v):ci.sym.concat(v)}
    ci.at=Date.now(); logEvent("checkin",{date:day,energy:ci.energy??null,sym:(ci.sym||[]).join(";")});
    save();render();if($("#sheet").classList.contains("show")&&$("#sheet").dataset.day===day)daySheet(day,true);return;
  }
  if(d.period){const s=state.cycle.starts;if(!s.includes(t))s.push(t);s.sort();logEvent("period_start",{date:t});save();toast("Logged – predictions updated");render();return}
  if(d.swap){state.swaps[d.swap]=true;logEvent("swap",{id:d.swap,phase:(cycleInfo(t)||{}).phase||""});save();rebuild();toast("Swapped to an easy run");render();return}
  if(d.mv){const [a,b2]=d.mv.split("|");const A=findS(a),B=findS(b2);const ad=A.date,bd=B.date;
    state.moves[a]=bd;state.moves[b2]=ad;logEvent("move",{id:a,from:ad,to:bd,reason:"cycle"});if(state.moves[a]===a.slice(0,10))delete state.moves[a];if(state.moves[b2]===b2.slice(0,10))delete state.moves[b2];
    save();rebuild();toast(A.title+" moved to "+DN[(parse(bd).getDay()+6)%7]);render();return}
  if(d.day){daySheet(d.day);return}
  if(d.protect){const [ph,on]=d.protect.split("|");const pr=state.cycle.protect=(state.cycle.protect||[]).filter(x=>x!==ph);if(on==="1")pr.push(ph);logEvent("protect",{phase:ph,on:on==="1"});save();toast(on==="1"?"You’ll get a prompt before hard sessions on "+ph.toLowerCase()+" days":"Prompt turned off");render();return}
  if(d.report){reportMonth=d.report;location.hash="#report";render();scrollTo(0,0);return}
  if(d.rm){reportMonth=d.rm;render();return}
});
document.addEventListener("change",e=>{
  const p=e.target.closest("[data-pstart]"); if(!p)return;
  const date=p.dataset.pstart, s=state.cycle.starts;
  if(p.checked){if(!s.includes(date))s.push(date);s.sort();logEvent("period_start",{date})}
  else if(s.length>1||!s.includes(date)){state.cycle.starts=s.filter(x=>x!==date);logEvent("period_start_removed",{date})}
  else{p.checked=true;toast("Keep at least one period start");return}
  save();render();daySheet(date,true);
});
