"use strict";
// Ridgeline – 03-strength.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- strength library: exercises by slot, with equipment alternatives ---------- */
// equip: list of alternatives; each is the kit needed (all of it). [] = nothing needed.
// prog: "load" (same reps, add weight), "reps" (add reps), "hold" (add seconds).
const EQUIP={dumbbells:"Dumbbells",kettlebell:"Kettlebell",barbell:"Barbell",box:"Bench, box or step",bands:"Resistance bands",nordic:"Nordic anchor (partner, strap or bench)",gym:"Full gym (machines)"};
const DEFAULT_EQUIP=["dumbbells","box"];
const DEFAULT_KITS={home:["dumbbells","bands"],gym:["gym"]}, DEFAULT_STRLOC={A:"gym",B:"home"}, LOC_NAME={home:"Home",gym:"Gym"};
const kitsOf=st=>Object.assign({},DEFAULT_KITS,st&&st.kits||{});
function locFor(id,v,st){return ((typeof state!=="undefined"&&state.loc)||{})[id]||Object.assign({},DEFAULT_STRLOC,st&&st.strLoc||{})[v]}
function kitFor(s){return new Set(kitsOf(state.settings)[s.loc||"home"]||[])}
const XL={
  slrdl:{name:"Single-Leg Romanian Deadlift",type:"weight",cat:"Strength",mus:["Hamstrings","Glutes"],side:1,equip:[["dumbbells"],["kettlebell"]],prog:"load",reps:8,tip:"Hips back, soft knee, slow on the way down."},
  bbrdl:{name:"Romanian Deadlift",type:"weight",cat:"Strength",mus:["Hamstrings","Glutes"],side:0,equip:[["barbell"]],prog:"load",reps:8,tip:"Bar close to the legs; stop when the hamstrings are long."},
  slrdlbw:{name:"Single-Leg RDL (Bodyweight)",type:"bodyweight",cat:"Calisthenics",mus:["Hamstrings","Glutes"],side:1,equip:[[]],prog:"reps",reps:10,tip:"Reach long through the back leg; touch a wall for balance if needed."},
  bss:{name:"Bulgarian Split Squat",type:"weight",cat:"Strength",mus:["Quads","Glutes"],side:1,equip:[["box","dumbbells"],["box","kettlebell"]],prog:"load",reps:8,tip:"Front knee tracks over the toes; three seconds down."},
  bssbw:{name:"Bodyweight Bulgarian Split Squats (Glute Focused)",type:"bodyweight",cat:"Calisthenics",mus:["Glutes","Quads"],side:1,equip:[["box"]],prog:"reps",reps:10,tip:"Lean slightly forward to load the glute."},
  dbsplit:{name:"Dumbbell Split Squat",type:"weight",cat:"Strength",mus:["Quads","Glutes"],side:1,equip:[["dumbbells"]],prog:"load",reps:8,tip:"Back knee drops straight down; three seconds on the way down."},
  lunge:{name:"Reverse Lunge",type:"bodyweight",cat:"Calisthenics",mus:["Quads","Glutes"],side:1,equip:[[]],prog:"reps",reps:10,tip:"Step back softly; front heel stays down."},
  calfw:{name:"Single Leg Weighted Calf Raise",type:"weight",cat:"Strength",mus:["Calves"],side:1,equip:[["dumbbells"],["kettlebell"]],prog:"load",reps:12,tip:"Off a step: up on two, three seconds down on one."},
  calfm:{name:"Standing Calf Raise (Machine)",type:"weight",cat:"Strength",mus:["Calves"],side:0,equip:[["gym"]],prog:"load",reps:12,tip:"Full stretch at the bottom, slow lowering."},
  calf:{name:"Eccentric Calf Raise",type:"bodyweight",cat:"Rehab",mus:["Calves"],side:1,equip:[[]],prog:"reps",reps:12,tip:"On a stair: up on two feet, three seconds down on one. Half straight-knee, half bent-knee."},
  stepdown:{name:"Step-Downs",type:"bodyweight",cat:"Rehab",mus:["Quads"],side:1,equip:[[]],prog:"reps",reps:10,tip:"Off a stair or box; tap the heel down slowly, knee in line with the toes."},
  wallsit:{name:"Wall Sit",type:"hold",cat:"Rehab",mus:["Quads"],side:0,equip:[[]],prog:"hold",time:30,tip:"Thighs parallel; push the back flat into the wall."},
  cope:{name:"Copenhagen Plank",type:"hold",cat:"Rehab",mus:["Hips","Core"],side:1,equip:[["box"]],prog:"hold",time:20,tip:"Top leg on the bench; start with the knee on it if the full version is too much."},
  bandadd:{name:"Banded Hip Adduction",type:"bodyweight",cat:"Rehab",mus:["Hips"],side:1,equip:[["bands"]],prog:"reps",reps:12,tip:"Band anchored low to the side; pull the leg across slowly and control the return."},
  addr:{name:"Side-Lying Adductor Raise",type:"bodyweight",cat:"Rehab",mus:["Hips"],side:1,equip:[[]],prog:"reps",reps:12,tip:"Bottom leg lifts; pause at the top."},
  stepup:{name:"Weighted Step Ups (*knee friendly)",type:"weight",cat:"Strength",mus:["Quads","Glutes"],side:1,equip:[["box","dumbbells"],["box","kettlebell"]],prog:"load",reps:10,tip:"Drive through the top heel; don’t push off the bottom foot."},
  stepupbw:{name:"Bodyweight Step-Ups",type:"bodyweight",cat:"Calisthenics",mus:["Quads","Glutes"],side:1,equip:[["box"]],prog:"reps",reps:12,tip:"Slow on the way down."},
  gobsq:{name:"Goblet Squat",type:"weight",cat:"Strength",mus:["Quads","Glutes"],side:0,equip:[["dumbbells"],["kettlebell"]],prog:"load",reps:10,tip:"Chest up, sit between the heels."},
  squat:{name:"Bodyweight Squat",type:"bodyweight",cat:"Calisthenics",mus:["Quads","Glutes"],side:0,equip:[[]],prog:"reps",reps:15,tip:"Three seconds down, quick up."},
  hipthr:{name:"Dumbbell Hip Thrust",type:"weight",cat:"Strength",mus:["Glutes"],side:0,equip:[["box","dumbbells"],["box","barbell"]],prog:"load",reps:10,tip:"Shoulders on the bench, ribs down, squeeze at the top."},
  dbbridge:{name:"Dumbbell Glute Bridge",type:"weight",cat:"Strength",mus:["Glutes"],side:0,equip:[["dumbbells"]],prog:"load",reps:12,tip:"Dumbbell on the hips, feet close, pause and squeeze at the top."},
  slbridge:{name:"Single-Leg Glute Bridge",type:"bodyweight",cat:"Calisthenics",mus:["Glutes"],side:1,equip:[[]],prog:"reps",reps:12,tip:"Push through the heel; keep hips level."},
  nordic:{name:"Nordic Curl",type:"bodyweight",cat:"Calisthenics",mus:["Hamstrings"],side:0,equip:[["nordic"]],prog:"reps",reps:4,tip:"Lower as slowly as you can; catch yourself with your hands."},
  legcurl:{name:"Lying Leg Curl (Machine)",type:"weight",cat:"Strength",mus:["Hamstrings"],side:0,equip:[["gym"]],prog:"load",reps:10,tip:"Three seconds on the way down."},
  bandcurl:{name:"Banded Hamstring Curl",type:"bodyweight",cat:"Calisthenics",mus:["Hamstrings"],side:0,equip:[["bands"]],prog:"reps",reps:12,tip:"Band anchored low; slow return."},
  slider:{name:"Slider Hamstring Curl",type:"bodyweight",cat:"Calisthenics",mus:["Hamstrings"],side:0,equip:[[]],prog:"reps",reps:8,tip:"Heels on a towel on a smooth floor, hips up throughout."},
  pogo:{name:"Pogo Hops",type:"bodyweight",cat:"Calisthenics",mus:["Calves"],side:0,equip:[[]],prog:"reps",reps:15,tip:"Quick, stiff ankles, minimal knee bend – like a skipping rope without the rope."},
  skips:{name:"Power Skips",type:"bodyweight",cat:"Calisthenics",mus:["Calves","Glutes"],side:0,equip:[[]],prog:"reps",reps:20,tip:"Drive the knee up, push off hard, land softly. Count each foot contact."},
  slhop:{name:"Single-Leg Hops",type:"bodyweight",cat:"Calisthenics",mus:["Calves","Quads"],side:1,equip:[[]],prog:"reps",reps:6,tip:"Small, quick hops in place; stick the last landing for two seconds."},
  bound:{name:"Bounding",type:"bodyweight",cat:"Calisthenics",mus:["Glutes","Quads","Calves"],side:1,equip:[[]],prog:"reps",reps:8,tip:"Long, springy strides from one foot to the other; stay tall and land under your hips."},
  depth:{name:"Depth Jumps",type:"bodyweight",cat:"Calisthenics",mus:["Quads","Calves"],side:0,equip:[["box"]],prog:"reps",reps:5,tip:"Step off a low box (30–40 cm), land and jump straight up as fast as you can. Full rest between reps."},
  bkcalf:{name:"Bent-Knee Calf Raise",type:"weight",cat:"Strength",mus:["Calves"],side:1,equip:[["dumbbells"],["kettlebell"]],prog:"load",reps:10,tip:"Knee bent ~30°, slow on the way down – this works the soleus, which takes the biggest load when you run and climb."},
  seatcalf:{name:"Seated Weighted Calf Raises",type:"weight",cat:"Strength",mus:["Calves"],side:0,equip:[["gym"]],prog:"load",reps:10,tip:"Heavy and slow. Over time aim for a heavy single-leg calf raise; your physio can help set a target."},
  bkcalfbw:{name:"Bent-Knee Calf Raise (Bodyweight)",type:"bodyweight",cat:"Rehab",mus:["Calves"],side:1,equip:[[]],prog:"reps",reps:15,tip:"Off a stair, knee bent, three seconds down."},
  tib:{name:"Tibialis Raise",type:"bodyweight",cat:"Rehab",mus:["Calves"],side:0,equip:[[]],prog:"reps",reps:15,tip:"Back against a wall, heels forward, lift the toes."},
  sideplank:{name:"Side Plank",type:"hold",cat:"Calisthenics",mus:["Core"],side:1,equip:[[]],prog:"hold",time:30,tip:"Add small hip dips once 30 seconds is easy."},
  airplane:{name:"Hip Airplanes",type:"bodyweight",cat:"Rehab",mus:["Hips","Glutes"],side:1,equip:[[]],prog:"reps",reps:6,tip:"Hold something for balance; rotate the hips slowly open and closed."},
  latwalk:{name:"Banded Lateral Walk",type:"bodyweight",cat:"Rehab",mus:["Hips","Glutes"],side:1,equip:[["bands"]],prog:"reps",reps:12,tip:"Band above the knees, stay low, toes forward."}
};
// Each slot lists options in order of preference; the first one your kit allows is used.
const SLOTS={
  A:[["slrdl","bbrdl","slrdlbw"],["bss","dbsplit","bssbw","lunge"],["calfm","calfw","calf"],["stepdown","wallsit"],["cope","bandadd","addr"]],
  B:[["stepup","gobsq","stepupbw","squat"],["hipthr","dbbridge","slbridge"],["legcurl","slider","bandcurl","nordic"],["tib"],["sideplank"],["airplane","latwalk"],["seatcalf","bkcalf","bkcalfbw"]]
};
const SLOT_NAMES={A:["Single-leg hinge","Split squat","Calves","Knee control","Adductors"],B:["Step-up / squat","Glutes","Hamstrings","Shins","Lateral core","Hips","Soleus (bent-knee calf)"]};
const hasKit=(x,eq)=>x.equip.some(alt=>alt.every(k=>eq.has(k)||(eq.has("gym")&&k!=="nordic")));
function slotOptions(v,i,eq){return SLOTS[v][i].filter(id=>hasKit(XL[id],eq))}
const ACCESSORY=new Set(["Copenhagen Plank","Side-Lying Adductor Raise","Banded Hip Adduction","Tibialis Raise","Hip Airplanes","Banded Lateral Walk"]);
function prescribe(x,phase,cut){
  const P=phase==="Taper"||phase==="Race week"?"taper":cut?"cut":phase==="Peak"?"peak":phase==="Build"?"build":"base";
  // Nordics are optional for distance runners: low dose (2 × 3–5), never chased.
  if(x.name==="Nordic Curl"){const r={base:3,build:4,peak:5,cut:3,taper:3}[P];return {sets:2,reps:r,label:"2 × "+r+" – slow lowering; skip within 3 days of a long run"}}
  const sets=P==="taper"||P==="cut"||ACCESSORY.has(x.name)?2:3;
  if(x.prog==="hold"){const t=Math.round(x.time*({base:1,build:1.25,peak:1.5,cut:1,taper:1}[P])/5)*5;return {sets,time:t,label:sets+" × "+t+"s"+(x.side?" each side":"")}}
  if(x.prog==="reps"){const r=Math.round(x.reps*({base:1,build:1.2,peak:1.35,cut:1,taper:0.8}[P]));return {sets,reps:r,label:sets+" × "+r+(x.side?" each side":"")}}
  const r={base:x.reps+2,build:x.reps,peak:Math.max(5,x.reps-2),cut:x.reps,taper:Math.max(5,x.reps-2)}[P];
  const cue={base:"moderate weight, 3 reps in reserve",build:"heavier (~75–80% of max), 2 reps in reserve",peak:"heavy (~80–85% of max), 1–2 reps in reserve",cut:"same weight as last week, easier effort",taper:"keep the weight, fewer sets"}[P];
  return {sets,reps:r,label:sets+" × "+r+(x.side?" each side":"")+" – "+cue};
}
// Plyometrics before the lifts (~40–80 contacts): improves running economy and loads bone and tendon.
function plyoFor(v,phase,cut,eq){
  const P=phase==="Taper"||phase==="Race week"||cut?"light":phase;
  let id, sets, reps;
  if(P==="light"){id="pogo";sets=2;reps=10}
  else if(P==="Base"){id=v==="A"?"pogo":"skips";sets=3;reps=v==="A"?15:20}
  else if(P==="Build"){id=v==="A"?"slhop":"bound";sets=3;reps=v==="A"?6:8}
  else {if(v==="A"&&hasKit(XL.depth,eq)){id="depth";sets=3;reps=5}else{id=v==="A"?"slhop":"bound";sets=3;reps=v==="A"?8:10}}
  const x=XL[id];
  return {id,slot:-1,name:x.name,type:x.type,cat:x.cat,mus:x.mus,side:!!x.side,tip:x.tip,sets,reps,label:sets+" × "+reps+(x.side?" each side":"")+" – before the lifts, full recovery between sets"};
}
function strengthExercises(v,phase,cut,equip,over){
  const eq=new Set(equip&&equip.length?equip:[]);
  return [plyoFor(v,phase,cut,eq)].concat(SLOTS[v].map((ids,i)=>{
    const opts=slotOptions(v,i,eq);
    const id=over&&over[i]&&XL[over[i]]?over[i]:(opts[0]||ids[ids.length-1]);
    const x=XL[id], rx=prescribe(x,phase,cut);
    return Object.assign({id,slot:i,name:x.name,type:x.type,cat:x.cat,mus:x.mus,side:!!x.side,tip:x.tip},rx);
  }));
}
