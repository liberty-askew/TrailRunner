"use strict";
// Ridgeline – 10-onboarding.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- onboarding: a few short questions, then the plan ---------- */
let ob={step:0,d:null};
function obDefaults(){const m=mondayOf(new Date());return {goal:"50k",startDate:iso(m),raceDate:iso(addDays(m,16*7-1)),runDays:4,longDay:6,baseKm:30,longest:12,raceVert:2500,weekVert:400,gym:true,bike:true,kits:{home:["dumbbells","bands"],gym:["gym"]},strLoc:{A:"gym",B:"home"},
  cyc:{on:true,start:"",len:28,plen:5,hc:false,profile:{windows:[],sym:[],impact:"some",mode:"ask"}}}}
const OB_STEPS=["Your goal","Your running now","Your body","Bone health","Strength","Your plan"];
function renderOnboard(){
  const d=ob.d=ob.d||obDefaults(), st=ob.step, G=GOALS[d.goal];
  const seg=(name,opts,val)=>'<div class="seg" data-seg="'+name+'">'+opts.map(([v,l])=>'<button type="button" data-val="'+v+'" aria-pressed="'+(String(v)===String(val))+'">'+l+'</button>').join("")+'</div>';
  const field=(label,inner,small)=>'<label class="f"><span>'+label+'</span>'+inner+(small?'<small>'+small+'</small>':'')+'</label>';
  let body="";
  if(st===0)body='<h2 class="obq">What are you training for?</h2>'+field("Goal",seg("goal",Object.entries(GOALS).map(([k,g])=>[k,g.label]),d.goal))+
    field("Race or goal date",'<input type="date" name="raceDate" value="'+d.raceDate+'">')+
    field("Start training",'<input type="date" name="startDate" value="'+d.startDate+'">',"The plan starts on the Monday of this week.")+
    (G.trail?field("Race climbing (metres of ascent)",'<input type="number" name="raceVert" min="0" step="100" value="'+d.raceVert+'">'):"");
  else if(st===1)body='<h2 class="obq">Where’s your running now?</h2>'+field("Weekly running (km)",'<input type="number" name="baseKm" min="10" max="150" value="'+d.baseKm+'">',"Roughly what you’ve averaged over the last month.")+
    field("Longest run in the last month (km)",'<input type="number" name="longest" min="3" max="100" value="'+d.longest+'">',"No planned run will be more than 10% longer than your longest recent run.")+
    field("Runs per week",seg("runDays",[[3,"3"],[4,"4"],[5,"5"],[6,"6"]],d.runDays))+field("Long run day",seg("longDay",DN.map((x,i)=>[i,x]),d.longDay))+
    (G.trail?field("Climbing in a typical week now (m)",'<input type="number" name="weekVert" min="0" step="50" value="'+d.weekVert+'">'):"");
  else if(st===4)body='<h2 class="obq">Strength and cross-training</h2>'+
    '<div class="toggle"><span><b>Strength sessions</b><br><span class="note">Two a week on your hard-run days, logged in Setlog.</span></span><input type="checkbox" name="gym" '+(d.gym?"checked":"")+' aria-label="Strength sessions"></div>'+
    '<div class="f"><span style="display:block;font-weight:700;margin:10px 0 6px">Equipment at home</span><div class="seg" data-multi="kh">'+Object.entries(EQUIP).filter(([k])=>k!=="gym").map(([k,l])=>'<button type="button" data-val="'+k+'" aria-pressed="'+d.kits.home.includes(k)+'">'+l+'</button>').join("")+'</div></div>'+
    '<div class="f"><span style="display:block;font-weight:700;margin:4px 0 6px">Equipment at the gym</span><div class="seg" data-multi="kg">'+Object.entries(EQUIP).map(([k,l])=>'<button type="button" data-val="'+k+'" aria-pressed="'+d.kits.gym.includes(k)+'">'+l+'</button>').join("")+'</div></div>'+
    '<div class="toggle"><span><b>Bike cross-training</b><br><span class="note">One easy ride a week.</span></span><input type="checkbox" name="bike" '+(d.bike?"checked":"")+' aria-label="Bike cross-training"></div>';
  else if(st===2){const c=d.cyc;d.stage=d.stage||"cycling";body='<h2 class="obq">Your body and your training</h2><p class="note" style="margin-top:-4px">Ridgeline is built for women. Your cycle, life stage and symptoms shape your plan – tell it as much or as little as you like. Everything stays on your phone.</p>'+
    '<div class="f"><span style="display:block;font-weight:700;margin-bottom:6px">Life stage</span><div class="seg" data-seg="stage">'+STAGES.map(([k,l])=>'<button type="button" data-val="'+k+'" aria-pressed="'+(d.stage===k)+'">'+l+'</button>').join("")+'</div></div>'+
    '<div class="toggle" id="obCycToggle" '+(d.stage==="post"?"hidden":"")+'><span><b>Plan around my cycle</b><br><span class="note">Recommended. Switch off if you’d rather not track it.</span></span><input type="checkbox" name="cycOn" '+(c.on?"checked":"")+' aria-label="Plan around my cycle"></div>'+
    '<div id="obCyc" '+(c.on&&d.stage!=="post"?"":"hidden")+'>'+field("First day of your last period",'<input type="date" name="cycStart" value="'+c.start+'">')+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+field("Cycle length (days)",'<input type="number" name="cycLen" min="18" max="45" value="'+c.len+'">')+field("Period length (days)",'<input type="number" name="cycPlen" min="2" max="10" value="'+c.plen+'">')+'</div>'+
profileFields(c.profile,"ob")+'</div>';}
  else if(st===3){d.stage=d.stage||(d.cyc.hc?"hc":"cycling");d.bone=d.bone||{};
    body='<h2 class="obq">Bone health</h2><p class="note" style="margin-top:-4px">Bone stress injuries are the most common serious injury in women distance runners. Six quick questions tune how fast your plan builds. All optional.</p>'+
    BONE_Q.map(q=>'<div class="f"><span style="display:block;font-weight:700;margin-bottom:6px">'+esc(q.q)+'</span><div class="seg" data-seg="bq_'+q.k+'">'+q.o.map(([v,l],i)=>'<button type="button" data-val="'+v+'" data-i="'+i+'" aria-pressed="'+(d.bone[q.k+"_i"]===i)+'">'+esc(l)+'</button>').join("")+'</div></div>').join("");}
  else {const c=d.cyc, p=c.profile, items=[];
    items.push("A "+(G.label)+" plan from "+fmtShort(d.startDate)+" to "+fmtShort(d.raceDate)+", starting at about "+d.baseKm+" km a week.");
    if(d.gym)items.push("Two strength sessions a week on your hard-run days, at home or the gym.");
    if(d.boneN===BONE_Q.length){let lvl=d.boneScore>=6?"high":d.boneScore>=2?"moderate":"low";if((d.stage==="peri"||d.stage==="post")&&lvl!=="high")lvl=lvl==="moderate"?"high":"moderate";
      items.push(lvl==="low"?"Bone risk looks low, so the plan builds at the standard rate.":"Your answers put your bone risk at "+lvl+", so the plan builds more gently (5% a week, a recovery week every third week) and caps each run at 5% over your recent longest. It’s worth asking a sports doctor about a bone density scan.")}
    if(d.stage==="peri"||d.stage==="post")items.push("For "+(d.stage==="peri"?"perimenopause":"post-menopause")+": heavy strength and jumps are a priority for bone, and you get an extra easy day after each camp weekend.");
    items.push("Every long run over 75 minutes has a carbohydrate target and a drink-to-thirst reminder. Take the energy check on the Today screen when you can.");
    if(c.on&&p.windows.length){
      items.push(p.mode==="auto"?"Hard sessions that land on "+pLabel(PWIN,p.windows).join(" or ")+" will move to an easier day that week automatically. You’ll see a note when that happens.":p.mode==="ask"?"When a hard session lands on "+pLabel(PWIN,p.windows).join(" or ")+", Ridgeline will offer to swap or move it.":"Hard sessions on "+pLabel(PWIN,p.windows).join(" or ")+" will carry a reminder.");
      if(toughDaysPerCycle(p.windows)>=7)items.push("You’ve marked about "+toughDaysPerCycle(p.windows)+" tough days a cycle. That’s a lot of sessions to flag – you can narrow it in Setup once you see how it feels.");
      if(p.sym.includes("lightheaded"))items.push("Feeling light-headed with hard exercise around your period is worth mentioning to your GP: it can be linked to low iron, which is common in runners with heavy periods. A simple blood test (ferritin and haemoglobin) can check.");
      else if(p.sym.includes("heavy"))items.push("Heavy periods raise the risk of low iron in runners. A ferritin blood test from your GP is worth asking for.");
      if(p.sym.includes("cramps"))items.push("Cramps: gentle easy running often helps more than rest. Warmth and the pain relief that usually works for you are fine before training.");
    } else if(c.on)items.push("Daily check-ins will help Ridgeline learn your pattern over a couple of cycles.");
    body='<h2 class="obq">Here’s your plan</h2><ul class="rlist" style="--c:var(--primary)">'+items.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><p class="note">You can change any of this later in Setup.</p>';}
  return '<div class="hero" style="background:var(--primary);margin-bottom:16px">'+peaksSvg+'<div class="w">Step '+(st+1)+' of '+OB_STEPS.length+' · '+OB_STEPS[st]+'</div><h1 style="font-size:2.2rem">Welcome to Ridgeline</h1>'+(st===0?'<p class="sum">Long-distance training built for women: your cycle, your bones, your fuelling, your mountains.</p>':'')+'<div class="obbar"><i style="width:'+((st+1)/OB_STEPS.length*100)+'%"></i></div></div>'+
    '<form class="card" id="obForm">'+body+'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">'+(st?'<button type="button" class="btn quiet" id="obBack">Back</button>':'')+'<button type="submit" class="btn">'+(st===OB_STEPS.length-1?"Create my plan":st===2&&!d.cyc.on?"Skip":"Next")+'</button></div></form>';
}
function obRead(){
  const f=$("#obForm"), d=ob.d, st=ob.step;
  const segv=n=>{const b=f.querySelector('[data-seg="'+n+'"] [aria-pressed=true]');return b?b.dataset.val:null};
  const num=(n,def)=>f[n]?(+f[n].value||def):def;
  if(st===0){d.goal=segv("goal")||d.goal;d.raceDate=f.raceDate.value;d.startDate=f.startDate.value;if(f.raceVert)d.raceVert=num("raceVert",d.raceVert)}
  if(st===1){d.baseKm=Math.max(10,Math.min(150,num("baseKm",30)));d.longest=Math.max(3,num("longest",10));d.runDays=+segv("runDays");d.longDay=+segv("longDay");if(f.weekVert)d.weekVert=num("weekVert",400)}
  if(st===4){d.gym=f.gym.checked;d.bike=f.bike.checked;d.kits={home:[...f.querySelectorAll('[data-multi="kh"] [aria-pressed=true]')].map(b=>b.dataset.val),gym:[...f.querySelectorAll('[data-multi="kg"] [aria-pressed=true]')].map(b=>b.dataset.val)}}
  if(st===3){d.bone={};let n=0,score=0;
    BONE_Q.forEach(q=>{const b=f.querySelector('[data-seg="bq_'+q.k+'"] [aria-pressed=true]');if(b){d.bone[q.k]=b.dataset.val;d.bone[q.k+"_i"]=+b.dataset.i;score+=+b.dataset.val;n++}});d.boneN=n;d.boneScore=score}
  if(st===2){const c=d.cyc;const sb=f.querySelector('[data-seg="stage"] [aria-pressed=true]');if(sb)d.stage=sb.dataset.val;c.hc=d.stage==="hc";if(d.stage==="post")f.cycOn.checked=false;c.on=f.cycOn.checked;if(c.on){c.start=f.cycStart.value;c.len=Math.min(45,Math.max(18,num("cycLen",28)));c.plen=Math.min(10,Math.max(2,num("cycPlen",5)));c.profile=readProfile(f,"ob")}}
}
function obValid(){
  const d=ob.d;
  if(ob.step===0&&(!d.raceDate||!d.startDate||d.raceDate<=d.startDate)){toast("Race date needs to be after the start date");return false}
  if(ob.step===2&&d.cyc.on&&!d.cyc.start){toast("Add the first day of your last period");return false}
  return true;
}
function wireOnboard(){
  const f=$("#obForm"); if(!f)return;
  f.querySelectorAll("[data-seg]").forEach(g=>g.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;g.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));
    if(g.dataset.seg==="goal"){obRead();ob.d.raceVert=GOALS[ob.d.goal].vert||ob.d.raceVert;render()}}));
  const stg=f.querySelector('[data-seg="stage"]');
  if(stg)stg.addEventListener("click",()=>{setTimeout(()=>{const v=(stg.querySelector("[aria-pressed=true]")||{}).dataset||{};const post=v.val==="post";
    const t=$("#obCycToggle");if(t)t.hidden=post;if(f.cycOn){if(post)f.cycOn.checked=false;$("#obCyc").hidden=!f.cycOn.checked||post}},0)});
  if(f.cycOn)f.cycOn.addEventListener("change",()=>{$("#obCyc").hidden=!f.cycOn.checked;f.querySelector('button[type=submit]').textContent=f.cycOn.checked?"Next":"Skip"});
  const back=$("#obBack"); if(back)back.onclick=()=>{obRead();ob.step--;render();scrollTo(0,0)};
  f.addEventListener("submit",e=>{
    e.preventDefault(); obRead(); if(!obValid())return;
    if(ob.step<OB_STEPS.length-1){ob.step++;render();scrollTo(0,0);return}
    const d=ob.d;
    state.settings={goal:d.goal,startDate:d.startDate,raceDate:d.raceDate,runDays:d.runDays,longDay:d.longDay,baseKm:d.baseKm,longest:d.longest,raceVert:d.raceVert,weekVert:d.weekVert,bike:d.bike,gym:d.gym,kits:d.kits,strLoc:d.strLoc};
    state.health={stage:d.stage||(d.cyc.hc?"hc":"cycling")};
    if(d.boneN===BONE_Q.length)state.health.bone={date:todayIso(),answers:d.bone,score:d.boneScore};
    if(d.cyc.on)state.cycle={on:true,starts:[d.cyc.start],len:d.cyc.len,plen:d.cyc.plen,hc:d.cyc.hc,profile:d.cyc.profile};
    logEvent("onboarded",{goal:d.goal,cycle:d.cyc.on,mode:d.cyc.on?d.cyc.profile.mode:null}); save(); rebuild();
    ob={step:0,d:null}; toast("Plan created"); location.hash="#today"; render();
  });
}
