"use strict";
// Ridgeline – 04-workouts.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- workouts ---------- */
// Fuelling and drinking steps for runs over 75 minutes (women-specific review: fuel by number, drink to thirst).
function fuelSteps(phase,mins){
  const f=typeof fuelTarget==="function"?fuelTarget(phase,mins):null; if(!f)return [];
  return [["Fuel: "+f[0]+"–"+f[1]+" g carbohydrate an hour","From the first 20–30 minutes, about "+Math.round(f[0]*mins/60)+"–"+Math.round(f[1]*mins/60)+" g in total. Training your gut now is what lets you eat on race day; log how it sat."],
    ["Drink to thirst","Not on a schedule. Weigh yourself before and after your first few long runs: you should finish the same or a little lighter, never heavier."]];
}
function workout(type,o){
  const km=o.km;
  const mins=k=>Math.round(k*6.3/5)*5;
  switch(type){
  case "easy": return {
    title:o.shake?"Shake-out":"Easy run", km,
    effort:"RPE 3–4 · conversational",
    summary:o.shake?"Short and loose to keep legs awake before the race.":(o.strides?"Relaxed aerobic miles with strides to finish.":"Relaxed aerobic miles. Keep it genuinely easy."),
    steps:[["Run "+km+" km easy","You should be able to talk in full sentences. Walk the steep bits if you're on trail."]].concat(o.strides?[["4–6 × 20s strides","Quick, tall, relaxed – not sprints. Walk back to recover."]]:[]),
    tip:"Easy days protect the hard days. If you feel flat, cut it short rather than push."};
  case "long": {
    const trail=o.G.trail, vert=o.vert||0, dur=trailMins(km,vert,trail);
    const desc=!trail?0:o.phase==="Build"?20:o.phase==="Peak"?35:o.phase==="Base"?10:0;
    return {title:(o.camp?"Camp day "+o.camp+" · ":"")+(trail?"Long trail run":"Long run"),km,vert,durMin:trail?dur:null,
    effort:"RPE 4–5 · steady",
    summary:trail?"About "+fmtHM(dur)+" on your feet"+(vert?" with ~"+vert+" m of climbing":"")+(o.camp?" – "+["the big day of the camp weekend.","day two on tired legs – the core of multi-day training.","short final day: easy effort, practise recovering between days."][o.camp-1]:". Go by time, not distance: power-hike the climbs, practise descending."):"The key endurance session of the week.",
    steps:[[trail?"Time on feet: about "+fmtHM(dur):"First 2–3 km very easy",trail?"Roughly "+km+" km"+(vert?" and +"+vert+" m":"")+", but stop at the time if the terrain is slower.":"Let the body warm up before settling in."],
      ["Settle at steady effort",trail?"Hike anything steeper than you can run comfortably, using poles if you'll race with them – that's race practice.":"Even effort throughout; finish feeling you could do more."],
      ...(desc?[["Descending: ~"+desc+" min in total","Controlled, quick feet, at steady effort. Building downhill gradually is what protects your quads on race day."]]:[]),
      ...(o.phase==="Taper"&&trail?[["No big new descents","Stick to terrain you know well in the last weeks."]]:[]),
      ...fuelSteps(o.phase,trail?dur:Math.round(km*6.3)),
      ...(o.phase==="Peak"&&!trail?[["Last 3 km at goal pace","Only if you feel good."]]:[])],
    tip:trail?"Use poles if you'll race with them. Keep descents controlled – downhill load is where most niggles start.":"Write down what you ate and how it sat – it's your race-day rehearsal."};}
  case "b2b": return {title:"Back-to-back run",km,vert:o.vert||0,durMin:trailMins(km,o.vert,true),effort:"RPE 3–4 · easy",
    summary:o.multi?"First of two long days in a row – tomorrow's long run starts on tired legs, just like stage two of your race.":"Easy run the day before your long run, so you start it on slightly tired legs – like day two of a multi-day effort.",
    steps:[["About "+fmtHM(trailMins(km,o.vert,true))+" easy on trail","Roughly "+km+" km"+(o.vert?" and +"+o.vert+" m":"")+". Hike the climbs, run the flats and gentle downs."]].concat(fuelSteps(o.phase||"Build",trailMins(km,o.vert,true))),
    tip:"Keep this one deliberately easy. The training effect comes from the pairing, not the pace."};
  case "hills": {
    let reps,dur,title;
    const taper=o.phase==="Taper";
    if(o.phase==="Base"){reps=6+Math.round(o.prog*6);dur="10s";title="Hill sprints"}
    else if(o.phase==="Peak"){reps=3+Math.round(o.prog*2);dur=(6+Math.round(o.prog*4))+" min";title="Long climbs"}
    else {reps=taper?5:6+Math.round(o.prog*4);dur="90s";title="Hill repeats"}
    if(o.cut)reps=Math.max(3,reps-2);
    // Downhill exposure builds gradually (repeated-bout effect); nothing new in the taper.
    const down=taper||o.cut?0:o.phase==="Base"?10+Math.round(o.prog*15):o.phase==="Build"?20+Math.round(o.prog*10):30+Math.round(o.prog*15);
    return {title,km,vert:o.vert||0,effort:o.phase==="Base"?"RPE 9 · short & sharp":o.phase==="Peak"?"RPE 6–7 · sustained":"RPE 7–8 · hard",
    summary:reps+" × "+dur+" uphill"+(o.phase==="Base"?" – builds power and tendon stiffness with very little fatigue.":o.phase==="Peak"?" at sustained climbing effort – hike the steep bits, just like race day.":" with easy jog-down recovery.")+(down?" Plus controlled descending to toughen up your quads.":""),
    steps:[["Warm up 15 min easy","Include a few drills or strides."],
      [reps+" × "+dur+" uphill",o.phase==="Base"?"Steep hill, full recovery (walk down + 1 min).":o.phase==="Peak"?"Steady and strong. Power-hike anything too steep to run economically; use poles if you'll race with them.":"Strong, controlled effort. Jog or walk back down."],
      ...(down?[["Controlled descents: ~"+down+" min in total","Jog the downhills at easy–moderate effort rather than walking them. Quick, light steps; stop if your knees complain."]]:[]),
      ["Cool down 10 min easy",""]],
    tip:"Drive with the arms, short quick steps. Walk down if your quads or knees are complaining."};}
  case "hike": {
    const long=o.phase==="Peak";
    const reps=6+Math.round((o.prog||0)*4), d=3+Math.round((o.prog||0)*2), m=60+Math.round((o.prog||0)*30/15)*15;
    return {title:long?"Long uphill hike":"Power-hike intervals",km,vert:o.vert||0,effort:long?"RPE 5–6 · steady climbing":"RPE 6–7 · strong",
    summary:long?m+" min of continuous climbing with poles – the effort you'll spend most of race day at.":reps+" × "+d+" min of steep power-hiking with poles. On steep grades, fast walking costs less energy than running.",
    steps:[["Warm up 10–15 min easy",""],
      long?[m+" min continuous climbing","Steady effort, poles, hands-on-knees technique on the steepest bits. Treadmill at 15–25% incline works if you have no hills."]:[reps+" × "+d+" min steep power-hike","Steepest hill you have (or treadmill 15–25%). Walk or jog down to recover."],
      ["Cool down 10 min easy",""]],
    tip:"Short, quick steps, upright from the ankles, poles planted beside your feet. Practise in the pack you'll race with."};}
  case "intervals": {
    let reps=o.phase==="Base"?6:o.phase==="Peak"?6:5+Math.round(o.prog*3), dist=o.phase==="Base"?"400m":o.phase==="Peak"?"1 km":"800m";
    if(o.cut)reps=Math.max(4,reps-2);
    return {title:o.phase==="Base"?"Fartlek":"Intervals",km,effort:"RPE 8 · hard",
    summary:o.phase==="Base"?"Playful pace changes to wake up your speed.":reps+" × "+dist+" at roughly 5k–10k effort.",
    steps:[["Warm up 15 min easy","Plus 4 strides."],
      o.phase==="Base"?["8 × 1 min on / 1 min off","On: comfortably fast. Off: easy jog."]:[reps+" × "+dist,"90s jog recovery between reps."],
      ["Cool down 10 min easy",""]],
    tip:"Aim for even reps – the last should be as fast as the first."};}
  case "tempo": {
    let m=o.easy?10:o.phase==="Base"?15:Math.round((15+o.prog*20)/5)*5;
    if(o.cut)m=Math.max(10,m-10);
    const trail=o.G.trail;
    return {title:o.easy?"Short tempo":trail?"Steady rolling tempo":"Tempo run",km,effort:"RPE 6–7 · comfortably hard",
    summary:m+" min at a pace you could hold for about an hour"+(trail?", on rolling terrain if you can.":"."),
    steps:[["Warm up 10–15 min easy",""],[m+" min tempo",o.phase==="Peak"&&m>=25?"Split into 2 blocks with 2 min easy jog if needed.":"Short phrases only – not full sentences."],["Cool down 10 min easy",""]],
    tip:"Tempo should feel controlled. If breathing gets ragged, ease off – that's threshold creep."};}
  case "bike": {
    const m=o.phase==="Base"?60:o.cut?45:Math.round((60+o.prog*30)/15)*15;
    return {title:"Zone 2 ride",mins:m,effort:"RPE 3 · easy",
    summary:m+" min easy spin – aerobic volume without the impact.",
    steps:[["Spin "+m+" min easy","Cadence around 85–95. Indoor or outdoor."],["Optional: 3 × 5 min seated climbing","Low cadence (60–70), moderate effort – good for climbing legs."]],
    tip:"This is meant to add fitness without adding fatigue. If legs are heavy, keep it all easy."};}
  case "strength": {
    const ex=strengthExercises(o.v,o.phase,o.cut,o.equip,o.over);
    const light=o.phase==="Taper"||o.cut;
    return {title:"Strength "+o.v,loc:o.loc,mins:light?30:45,effort:light?"Lighter week · stay crisp":({Base:"Controlled · 3 reps in reserve",Build:"Heavier · 2 reps in reserve",Peak:"Heavy · 1–2 reps in reserve"}[o.phase]||"Controlled · 2 reps in reserve"),
    summary:(o.loc==="gym"?"At the gym. ":o.loc==="home"?"At home. ":"")+"Single-leg strength, tendons and hips – the stuff that keeps you running.",
    exercises:ex,
    steps:[["Warm-up 5–8 min","Leg swings, glute activation, a few bodyweight squats."]].concat(ex.map(e=>[e.name,e.label])),
    tip:"Do this on the same day as your hard run, ideally 3+ hours apart (run first, unless strength is today's priority). Slow, controlled lowering on every rep."};}
  case "race": return {title:o.stage?"Stage "+o.stage+" of "+o.stages:o.G.label+" – race day",km,effort:"Go get it",
    summary:"Everything's done. Fuel early, drink to thirst, look after your feet, and start conservatively.",
    steps:[["Fuel from the first 20–30 minutes","Your practised race rate (60–90 g carbohydrate an hour), the foods you trained with. Nothing new on race day."],
      ["Drink to thirst","Don’t drink on a schedule or force fluid. Salty food and electrolytes in the heat. Gaining weight during a race means you’re over-drinking."],
      ["Feet and skin","Tape hot spots before they blister, change socks if they’re wet, anti-chafe on bra line, pack straps and thighs. Pack period products even if you’re not due – long races can bring it on."],
      ["Start controlled","First 10–15% easier than feels right; in heat, pace by effort or heart rate, not splits."]].concat(o.stage&&o.stage<o.stages?[["Between stages","Eat within an hour of finishing, protein at every meal (around 1.6–2.0 g/kg a day), dry and check your feet, protect your sleep."]]:[]),
    tip:"Check kit and logistics the night before: fuel for every hour, spare socks, tape, anti-chafe, period products, warm layer."};
  }
}
