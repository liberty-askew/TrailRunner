"use strict";
// Ridgeline – 05-state.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- state & storage ---------- */
const KEY="ridgeline-state-v1";
let state={settings:null,log:{},moves:{},extras:[],swaps:{},cycle:null,checkins:{},events:[],reports:{seen:[],weeks:[]},pending:[],pause:null,pauses:[]}, plan=[];
function loadLocal(){try{const r=localStorage.getItem(KEY);if(r){const s=JSON.parse(r);if(s&&typeof s==="object")state=Object.assign({settings:null,log:{},moves:{},extras:[],swaps:{},cycle:null,checkins:{},events:[],reports:{seen:[],weeks:[]},pending:[],pause:null,pauses:[]},s)}}catch(e){}}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function save(){saveLocal()}
function logEvent(type,data){const ev=state.events=state.events||[];ev.push(Object.assign({ts:Date.now(),type},data||{}));if(ev.length>5000)ev.splice(0,ev.length-5000)}
function rebuild(){
  plan=state.settings?buildPlan(state.settings):[];
  // apply moves
  const G=state.settings?GOALS[state.settings.goal]:null;
  plan.forEach(wk=>{wk.sessions.forEach(s=>{const m=state.moves[s.id];if(m){s.date=m;s.day=(parse(m).getDay()+6)%7}
    if(state.swaps&&state.swaps[s.id]&&TYPES[s.type].run&&s.type!=="race"){const km=r5(Math.max(4,(s.km||8)*0.7));Object.assign(s,workout("easy",{km,strides:false,G}),{type:"easy",swapped:true,title:"Easy run (swapped)",summary:"Swapped in for "+s.title.toLowerCase()+" – relaxed miles today."})}});wk.sessions.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0)});
  try{replan()}catch(e){}
  try{cycleRearrange()}catch(e){}
}
const _rebuild=rebuild; rebuild=function(){_rebuild();try{slPlanSync()}catch(e){}};
const allSessions=()=>plan.flatMap(w=>w.sessions.map(s=>Object.assign(s,{week:w.w})));
const findS=id=>allSessions().find(s=>s.id===id);
const inPause=date=>{const ps=(state.pauses||[]).concat(state.pause?[state.pause]:[]);return ps.find(p=>date>=p.from&&(!p.to||date<=p.to))||null};
const sessStatus=s=>(state.log[s.id]&&state.log[s.id].status)||(inPause(s.date)?"paused":undefined);
const currentWeek=()=>{const t=todayIso();let cw=plan[0];for(const w of plan){if(w.mon<=t)cw=w}return cw};
