"use strict";
// Ridgeline – 11a-health.js. Women's health features from the female-specific evidence review:
// bone-risk score, energy check, life stage (perimenopause/menopause), iron reminders, heat acclimation,
// the shin/bone-pain gate, and fuelling/hydration logging. Loaded after 11-replan.js; everything here is
// called at runtime, so earlier files can use it.
/* ---------- women's health ---------- */
const H=()=>{state.health=state.health||{};return state.health};
const healthStage=()=>H().stage||"cycling"; // cycling | hc | peri | post
const STAGES=[["cycling","Natural cycles"],["hc","Hormonal contraception"],["peri","Perimenopause"],["post","Post-menopause"]];

// ---- bone risk (factors from the Female Athlete Triad cumulative risk approach; our own wording and scoring) ----
const BONE_Q=[
  {k:"eat",q:"Have you ever restricted food to control weight or performance, or had an eating disorder?",o:[["0","No"],["1","In the past"],["2","Currently"]]},
  {k:"bmi",q:"Has a doctor told you your weight or BMI is low, or have you lost weight without meaning to?",o:[["0","No"],["1","Yes, a little"],["2","Yes, a lot"]]},
  {k:"men",q:"How old were you at your first period?",o:[["0","Under 15"],["1","15"],["2","16 or older"]]},
  {k:"cyc",q:"In the last year, how regular have your periods been? (Skip if on hormonal contraception or after menopause.)",o:[["0","Regular"],["1","Irregular or fewer than 9"],["2","Stopped for 3+ months"],["0","Not applicable"]]},
  {k:"bmd",q:"Have you had a bone density scan?",o:[["0","No, or it was normal"],["1","Yes – low (osteopenia)"],["2","Yes – osteoporosis"]]},
  {k:"bsi",q:"Have you had a stress fracture or bone stress reaction?",o:[["0","Never"],["1","Once"],["2","Twice or more"]]}
];
function boneLevel(){
  const b=H().bone; let score=b&&typeof b.score==="number"?b.score:0;
  let lvl=!b?"unknown":score>=6?"high":score>=2?"moderate":"low";
  // falling oestrogen raises bone risk by a level
  if((healthStage()==="peri"||healthStage()==="post")&&lvl!=="high")lvl=lvl==="moderate"?"high":"moderate";
  return lvl;
}
// Training rules the plan generator and re-planning use.
function healthRules(){
  const lvl=boneLevel(), careful=lvl==="moderate"||lvl==="high";
  return {growth:careful?1.05:1.08, spike:careful?1.05:1.1, cutEvery:careful?3:4, careful, level:lvl,
    extraRecoveryAfterCamp:healthStage()==="peri"||healthStage()==="post"};
}

// ---- energy check (our own questions, covering the areas the validated LEAF-Q covers; not the LEAF-Q itself) ----
const ENERGY_Q=[
  {k:"inj",q:"In the last year, how much training have you missed through injury?",o:[["0","None"],["1","Up to 3 weeks"],["2","More than 3 weeks"]]},
  {k:"gut",q:"Do you often get bloating, cramps, constipation or loose stools not linked to your period?",o:[["0","Rarely"],["1","Sometimes"],["2","Often"]]},
  {k:"per",q:"How have your periods been in the last 3 months? (Skip if on hormonal contraception or after menopause.)",o:[["0","Normal for me"],["1","Lighter, later or missed"],["2","Stopped"],["0","Not applicable"]]},
  {k:"chg",q:"Did your periods change when your training increased?",o:[["0","No / not applicable"],["1","Yes"]]},
  {k:"res",q:"Do you cut back food on rest days or after a big day to manage your weight?",o:[["0","No"],["1","Sometimes"],["2","Usually"]]},
  {k:"cold",q:"Do you often feel cold, flat or slow to recover, even after easy weeks?",o:[["0","No"],["1","Sometimes"],["2","Often"]]},
  {k:"wt",q:"Has your weight dropped without you meaning it to in the last 3 months?",o:[["0","No"],["1","Yes"]]}
];
function energyResult(e){
  if(!e)return null;
  const s=e.score, red=(e.answers.per==="2")||(e.answers.res==="2");
  return {score:s, flag:red||s>=5, watch:!red&&s>=3&&s<5};
}
const energyDue=()=>{const e=H().energy;return !e||Math.round((parse(todayIso())-parse(e.date))/DAY)>=56};

// ---- iron ----
function ironNeedsFrequent(){
  const p=typeof prof==="function"&&state.cycle&&state.cycle.profile;
  const heavyLogs=Object.entries(state.checkins||{}).filter(([d,c])=>d>iso(addDays(new Date(),-90))&&(c.sym||[]).some(x=>x==="Heavy flow"||x==="Fatigue")).length;
  return !!(p&&(p.sym||[]).some(x=>x==="heavy"||x==="lightheaded"))||heavyLogs>=4;
}
function ironDue(){
  const i=H().iron, last=i&&i.date, t=todayIso();
  if(!last)return true;
  const days=Math.round((parse(t)-parse(last))/DAY);
  return days>=(ironNeedsFrequent()?91:168);
}

// ---- heat ----
function hotRace(){
  const s=state.settings||{}; if(typeof s.hotRace==="boolean")return s.hotRace;
  const m=+String(s.raceDate||"").slice(5,7); return m>=5&&m<=9;
}

// ---- shin / bone pain gate ----
function painGate(){
  if(state.pause)return null;
  const lo=iso(addDays(new Date(),-14)), g=H().gateUntil;
  if(g&&g>=todayIso())return null;
  const days=Object.entries(state.checkins||{}).filter(([d,c])=>d>lo&&(c.sym||[]).some(x=>x==="Shin pain"||x==="Bone pain")).map(([d])=>d);
  return days.length>=2?days.sort():null;
}

// ---- fuelling target for a session (g carbohydrate per hour) ----
function fuelTarget(phase,mins){
  if(!mins||mins<75)return null;
  return phase==="Base"?[30,45]:phase==="Build"?[45,60]:phase==="Peak"||phase==="Taper"?[60,90]:[30,60];
}

// ---- UI: Today banners ----
function healthBanners(){
  if(!state.settings)return "";
  let out="";
  const gate=painGate();
  if(gate)out+='<div class="hero" style="background:var(--intervals);margin-bottom:14px"><div class="w">Shin or bone pain on '+gate.length+' days in the last two weeks</div><h2 style="font-size:1.8rem">Pause running and get it checked</h2><p class="sum">Pain in a shin, foot or hip bone that keeps coming back can be an early bone stress injury, the most common serious injury in women distance runners. Caught early it heals in weeks; run through it and it can take months.</p><div class="actions"><button class="btn light" data-pausestart="injury">Pause running</button><button class="btn ghost" data-gateok="1">It’s muscular – a physio has checked it</button></div></div>';
  const lvl=boneLevel(), b=H().bone;
  if(!b)out+='<button class="banner" data-bonecheck="1" style="background:var(--surface2);color:var(--ink)"><b>Two-minute bone health check</b><span>Six questions that tune how fast your plan builds →</span></button>';
  if(energyDue())out+='<button class="banner" data-energycheck="1" style="background:var(--surface2);color:var(--ink)"><b>'+(H().energy?"Time for your energy check":"Take the energy check")+'</b><span>Seven questions on injury, gut, periods and eating – every 8 weeks →</span></button>';
  const er=energyResult(H().energy);
  if(er&&er.flag)out+='<div class="tip" style="margin-bottom:14px;border-left:4px solid var(--intervals)"><b>Your last energy check suggests you may not be eating enough for your training.</b> Low energy availability (REDs) is common in women ultrarunners and affects bone, hormones and recovery. Please see a sports dietitian or doctor; ask about a full LEAF-Q screen. <a href="#science">Why this matters</a></div>';
  if(ironDue())out+='<button class="banner" data-ironcheck="1" style="background:var(--surface2);color:var(--ink)"><b>Time for an iron check</b><span>'+(ironNeedsFrequent()?"With heavy periods or fatigue, a ferritin test every 3 months is worth it":"Ask your GP for ferritin and haemoglobin at the start of each block")+' →</span></button>';
  return out;
}

// ---- UI: sheets ----
function qSheet(title,lead,qs,key,answers){
  answers=answers||{};
  openSheet('<div class="sh" style="background:var(--primary);position:relative"><button class="closex" data-close aria-label="Close">×</button><div>'+esc(lead)+'</div><h2 id="sheetTitle">'+esc(title)+'</h2></div><div class="sb"><form id="hqForm" data-hkey="'+key+'">'+
    qs.map(q=>'<div class="f"><span style="display:block;font-weight:700;margin-bottom:6px">'+esc(q.q)+'</span><div class="seg" data-seg="hq_'+q.k+'">'+q.o.map(([v,l],i)=>'<button type="button" data-val="'+v+'" data-i="'+i+'" aria-pressed="'+(answers[q.k+"_i"]===i)+'">'+esc(l)+'</button>').join("")+'</div></div>').join("")+
    '<button class="btn" type="submit">Save</button><p class="note" style="margin:12px 0 0">'+(key==="energy"?"A quick screen in Ridgeline’s own words, covering the same areas as the validated LEAF-Q questionnaire. It isn’t a diagnosis; a sports dietitian or doctor can run the full LEAF-Q.":"Based on the risk factors used in sports medicine to judge bone stress injury risk in women. It isn’t a diagnosis.")+'</p></form></div>');
}
document.addEventListener("click",e=>{
  const b=e.target.closest("#hqForm [data-seg] button"); if(b){const g=b.parentElement;g.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));return}
  if(e.target.closest("[data-bonecheck]")){qSheet("Bone health","Six questions",BONE_Q,"bone",H().bone&&H().bone.answers);return}
  if(e.target.closest("[data-energycheck]")){qSheet("Energy check","Seven questions",ENERGY_Q,"energy",H().energy&&H().energy.answers);return}
  if(e.target.closest("[data-gateok]")){H().gateUntil=iso(addDays(new Date(),14));logEvent("pain_gate_dismissed",{});save();render();return}
  if(e.target.closest("[data-ironcheck]")){openSheet('<div class="sh" style="background:var(--primary);position:relative"><button class="closex" data-close aria-label="Close">×</button><div>Iron</div><h2 id="sheetTitle">Log an iron check</h2></div><div class="sb"><p style="margin-top:0">Ask your GP for <b>ferritin</b> (iron stores) and <b>haemoglobin</b>. Heavy periods are common in women runners and low iron causes fatigue and breathlessness before it shows up as anaemia.</p><label class="f"><span>Date of the test</span><input type="date" id="ironDate" value="'+todayIso()+'"></label><label class="f"><span>Ferritin result (µg/L, optional)</span><input type="number" id="ironFer" min="0" step="1"></label><button class="btn" data-ironsave="1">Save</button><button class="btn quiet" data-ironlater="1" style="margin-left:8px">Remind me in a month</button><p class="note" style="margin:12px 0 0">Ask your GP what your result means for you as an endurance runner; reference ranges are set for the general population.</p></div>');return}
  if(e.target.closest("[data-ironsave]")){const d=$("#ironDate").value||todayIso(), f=+$("#ironFer").value||null;H().iron={date:d,ferritin:f};(H().ironLog=H().ironLog||[]).push({date:d,ferritin:f});logEvent("iron_check",{ferritin:f});save();closeSheet();render();toast("Iron check logged");return}
  if(e.target.closest("[data-ironlater]")){H().iron=Object.assign({},H().iron||{},{date:iso(addDays(new Date(),-(ironNeedsFrequent()?61:138)))});save();closeSheet();render();return}
});
document.addEventListener("submit",e=>{
  const f=e.target.closest("#hqForm"); if(!f)return; e.preventDefault();
  const key=f.dataset.hkey, qs=key==="bone"?BONE_Q:ENERGY_Q, answers={}; let score=0, missing=0;
  qs.forEach(q=>{const b=f.querySelector('[data-seg="hq_'+q.k+'"] [aria-pressed=true]');if(!b){missing++;return}answers[q.k]=b.dataset.val;answers[q.k+"_i"]=+b.dataset.i;score+=+b.dataset.val});
  if(missing){toast("Answer every question (choose “Not applicable” where it fits)");return}
  H()[key]={date:todayIso(),answers,score};
  logEvent(key+"_check",{score}); save(); rebuild(); closeSheet(); render();
  if(key==="bone"){const l=boneLevel();toast(l==="low"?"Low bone risk – plan unchanged":"Bone risk "+l+": your plan now builds more gently")}
  else{const r=energyResult(H().energy);toast(r.flag?"Worth talking to a dietitian or doctor – see Today":r.watch?"Some signs to keep an eye on":"No warning signs")}
});

// ---- UI: Setup card ----
function healthCard(){
  const st=healthStage(), lvl=boneLevel(), er=energyResult(H().energy), i=H().iron, s=state.settings||{};
  const R=healthRules();
  return '<section class="block"><h2>Health checks</h2><div class="card">'+
    '<div class="f"><span style="display:block;font-weight:700;margin-bottom:6px">Life stage</span><div class="seg" data-stage="1">'+STAGES.map(([k,l])=>'<button type="button" data-val="'+k+'" aria-pressed="'+(st===k)+'">'+l+'</button>').join("")+'</div><small class="note" style="display:block;margin-top:4px">'+(st==="peri"||st==="post"?"Bone risk is raised a level, heavy strength and jumps are a priority, and there’s an extra recovery day after camp weekends. Period-based prompts are off.":"Perimenopause and post-menopause change bone, recovery and heat tolerance; Ridgeline adjusts the plan for them.")+'</small></div>'+
    '<div class="toggle"><span><b>Bone health</b><br><span class="note">'+(lvl==="unknown"?"Not checked yet.":"Risk: "+lvl+(R.careful?" – the plan builds 5% a week, caps runs at 5% over your recent longest, and has a recovery week every third week. Ask a sports doctor about a bone density (DEXA) scan.":" – standard progression."))+'</span></span><button class="btn quiet small" type="button" data-bonecheck="1">'+(H().bone?"Review":"Check")+'</button></div>'+
    '<div class="toggle"><span><b>Energy check</b><br><span class="note">'+(!er?"Not taken yet.":"Last taken "+fmtShort(H().energy.date)+(er.flag?" – worth seeing a dietitian or doctor.":er.watch?" – a few signs to keep an eye on.":" – no warning signs."))+'</span></span><button class="btn quiet small" type="button" data-energycheck="1">'+(H().energy?"Retake":"Take")+'</button></div>'+
    '<div class="toggle"><span><b>Iron</b><br><span class="note">'+(i&&i.ferritin?"Last check "+fmtShort(i.date)+": ferritin "+i.ferritin+" µg/L.":i?"Last check "+fmtShort(i.date)+".":"No check logged.")+' Next due every '+(ironNeedsFrequent()?"3":"6")+' months.</span></span><button class="btn quiet small" type="button" data-ironcheck="1">Log</button></div>'+
    '<div class="toggle"><span><b>Race likely to be hot</b><br><span class="note">Adds 10–14 days of heat acclimation before the taper.</span></span><input type="checkbox" id="hotRace" '+(hotRace()?"checked":"")+' aria-label="Race likely to be hot"></div>'+
    '</div></section>';
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-stage] button"); if(!b)return;
  H().stage=b.dataset.val;
  if(state.cycle)state.cycle.hc=b.dataset.val==="hc";
  logEvent("life_stage",{stage:b.dataset.val}); save(); rebuild(); render(); toast("Life stage updated");
});
document.addEventListener("change",e=>{
  if(e.target.id!=="hotRace")return; state.settings.hotRace=e.target.checked; save(); rebuild(); render();
});
