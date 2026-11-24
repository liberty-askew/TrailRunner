"use strict";
// Ridgeline – 11-replan.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- re-planning after missed training ---------- */
// Replays the weeks in order: each completed week is judged against what was planned for it (after any
// earlier easing), so a reduced week you then completed counts as a good week. Missed weeks ease the
// following weeks and drop the quality sessions for the first week back; partial weeks hold volume.
function weekActualKm(wk){
  const end=iso(addDays(parse(wk.mon),7));
  let km=0;
  wk.sessions.forEach(s=>{const L=state.log[s.id];if(L&&L.status==="done"&&TYPES[s.type].run&&s.km!=null)km+=L.km!=null?L.km:(+L.actual||s.km)});
  (state.extras||[]).forEach(x=>{if(x.sport==="run"&&x.date>=wk.mon&&x.date<end)km+=x.km});
  return km;
}
function replan(){
  if(!plan.length)return;
  const t=todayIso(), G=GOALS[state.settings.goal];
  let f=1, gap=0, noQ=false;
  const lastRun=(()=>{let d=null;allSessions().forEach(s=>{const L=state.log[s.id];if(L&&L.status==="done"&&TYPES[s.type].run&&s.date<=t&&(!d||s.date>d))d=s.date});(state.extras||[]).forEach(x=>{if(x.sport==="run"&&x.date<=t&&(!d||x.date>d))d=x.date});return d})();
  const pauses=(state.pauses||[]).filter(p=>p.to);
  const pauseFactor=days=>days>=14?0.5:days>=7?0.65:days>=4?0.8:1;
  plan.forEach(wk=>{
    const end=iso(addDays(parse(wk.mon),7)), done=end<=t, current=wk.mon<=t&&!done;
    // A pause that ended this week: ease what follows, straight away.
    pauses.filter(p=>p.to>=wk.mon&&p.to<end).forEach(p=>{
      const days=Math.round((parse(p.to)-parse(p.from))/DAY)+1, pf=pauseFactor(days);
      if(pf<1){f=Math.min(f,pf);noQ=days>=4;gap=0;
        wk.replan={f,noQ,msg:"Back after "+days+" days "+(p.kind==="injury"?"injured":"ill")+" – eased to "+Math.round(f*100)+"%"+(noQ?", easy running only,":"")+" and building back over the next few weeks."}}
    });
    const planned=wk.sessions.filter(s=>TYPES[s.type].run&&s.type!=="race"&&!inPause(s.date)).reduce((a,s)=>a+(s.km||0),0);
    // apply the easing decided from earlier weeks to this week (only sessions still to come)
    if(f<1||noQ){
      wk.replan=wk.replan||{f,noQ,msg:noQ?"Eased to "+Math.round(f*100)+"% after missed training – easy running only this week, building back over the next 2–3 weeks.":"Eased to "+Math.round(f*100)+"% while you build back after missed training."};
      wk.sessions.forEach(s=>{
        if(!TYPES[s.type].run||s.type==="race"||s.date<t||sessStatus(s))return;
        if(noQ&&MOVABLE.has(s.type)){const km=r5(Math.max(4,(s.km||8)*f));const ttl=s.title;Object.assign(s,workout("easy",{km,strides:false,G}),{type:"easy",replanNote:"Swapped from "+ttl.toLowerCase()+": the first week back is easy running only."})}
        else if(s.km!=null){s.km=r5(Math.max(4,s.km*f));if(s.vert)s.vert=Math.round(s.vert*f/50)*50;if(s.durMin)s.durMin=trailMins(s.km,s.vert,true);s.replanNote="Shortened to "+s.km+" km ("+Math.round(f*100)+"%) while you build back after missed training."}
        if(s.type==="strength"&&f<0.8)s.replanNote="Keep it light this week: same exercises, fewer sets, no new personal bests.";
      });
    }
    if(done){
      const target=planned*f, actual=weekActualKm(wk);
      if(target<8){f=Math.min(1,f*1.15);noQ=false;return} // nothing much was planned (taper/race week)
      const ratio=actual/target;
      if(ratio<0.5){gap++;f=Math.max(0.5,0.65-0.1*(gap-1));noQ=true}
      else if(ratio<0.8){gap=0;f=Math.min(f,0.9);noQ=false}
      else{gap=0;f=Math.min(1,f*1.15);if(f>0.96)f=1;noQ=false}
    } else if(current){
      // Current week: if nothing has been run for 7+ days, ease the rest of this week now.
      // Days since the last logged run – or since the plan started, if nothing has been logged yet.
      const since=Math.round((parse(t)-parse(lastRun||plan[0].mon))/DAY);
      if(since>=7&&weekActualKm(wk)===0&&!wk.replan){f=Math.min(f,0.65);noQ=true;
        wk.replan={f,noQ,msg:"No runs logged for "+(lastRun?since+" days":"a while")+" – the rest of this week is eased to "+Math.round(f*100)+"%, easy running only."};
        wk.sessions.forEach(s=>{if(!TYPES[s.type].run||s.type==="race"||s.date<t||sessStatus(s))return;
          if(MOVABLE.has(s.type)){const km=r5(Math.max(4,(s.km||8)*f));const ttl=s.title;Object.assign(s,workout("easy",{km,strides:false,G}),{type:"easy",replanNote:"Swapped from "+ttl.toLowerCase()+": easy running only until you’re back in the groove."})}
          else if(s.km!=null){s.km=r5(Math.max(4,s.km*f));if(s.vert)s.vert=Math.round(s.vert*f/50)*50;if(s.durMin)s.durMin=trailMins(s.km,s.vert,true);s.replanNote="Shortened to "+s.km+" km while you ease back in."}});
        f=0.75;noQ=false; // next week ramps from here (quality returns)
      } else {f=Math.min(1,f*1.15);if(f>0.96)f=1;noQ=false}
    } else {
      // future week: ease applied above; the next week builds back by ~15%
      f=Math.min(1,f*1.15);if(f>0.96)f=1;noQ=false;
    }
  });
  guardFuture();
}
// After easing, make sure no upcoming run is more than 10% longer than anything run (or planned) in the 30 days before it.
function guardFuture(){
  const t=todayIso(), hist=[{date:iso(addDays(parse(plan[0].mon),-1)),km:Math.max(5,+state.settings.longest||+state.settings.baseKm*0.4||10)}];
  allSessions().forEach(s=>{const L=state.log[s.id];if(L&&L.status==="done"&&TYPES[s.type].run&&s.km!=null)hist.push({date:s.date,km:L.km!=null?L.km:(+L.actual||s.km)})});
  (state.extras||[]).forEach(x=>{if(x.sport==="run")hist.push({date:x.date,km:x.km})});
  const future=allSessions().filter(s=>TYPES[s.type].run&&s.type!=="race"&&s.km!=null&&s.date>=t&&!sessStatus(s)).sort((a,b)=>a.date<b.date?-1:1);
  future.forEach(s=>{
    const lo=iso(addDays(parse(s.date),-30));
    const mx=Math.max(0,...hist.filter(r=>r.date>=lo&&r.date<s.date).map(r=>r.km));
    const cap=Math.max(5,r5(mx*healthRules().spike));
    if(mx&&s.km>cap){s.km=cap;if(s.durMin)s.durMin=trailMins(s.km,s.vert,true);s.replanNote=(s.replanNote?s.replanNote+" ":"")+"Capped at "+cap+" km – no more than "+Math.round((healthRules().spike-1)*100)+"% over your longest run of the previous 30 days."}
    hist.push({date:s.date,km:s.km});
  });
}
