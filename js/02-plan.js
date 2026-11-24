"use strict";
// Ridgeline – 02-plan.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- types ---------- */
const TYPES={
  easy:{label:"Easy run",c:"--easy",run:true},
  long:{label:"Long run",c:"--long",run:true},
  b2b:{label:"Back-to-back",c:"--long",run:true},
  hills:{label:"Hills",c:"--hills",run:true},
  intervals:{label:"Intervals",c:"--intervals",run:true},
  tempo:{label:"Tempo",c:"--tempo",run:true},
  hike:{label:"Power hike",c:"--hills",run:true},
  bike:{label:"Bike",c:"--bike",run:false},
  strength:{label:"Strength",c:"--strength",run:false},
  race:{label:"Race day",c:"--race",run:true}
};
const col=t=>"var("+TYPES[t].c+")";

const GOALS={
  "5k":{label:"5k",peakLong:12,peakVol:45,taper:1,trail:false,race:5},
  "10k":{label:"10k",peakLong:16,peakVol:55,taper:1,trail:false,race:10},
  "half":{label:"Half marathon",peakLong:21,peakVol:60,taper:2,trail:false,race:21.1},
  "marathon":{label:"Marathon",peakLong:32,peakVol:75,taper:2,trail:false,race:42.2},
  "50k":{label:"50k trail",peakLong:36,peakVol:80,taper:2,trail:true,race:50,vert:2500},
  "multiday":{label:"Multi-day mountain",peakLong:40,peakVol:95,taper:3,trail:true,race:100,stages:3,vert:6000}
};
// Taper: volume falls ~40–60% over the last 2–3 weeks while intensity and frequency stay (Bosquet 2007).
const TAPER={1:[0.45],2:[0.7,0.45],3:[0.85,0.65,0.45]};
// Rough trail time: flat-ish trail speed plus ~600 m of climbing per hour.
const trailMins=(km,vert,trail)=>Math.round((km/(trail?7.5:10.5)*60+(vert||0)/600*60)/5)*5;
const fmtHM=m=>Math.floor(m/60)+" h"+(m%60?" "+pad(m%60):"");

/* ---------- plan generator ---------- */
function layout(runDays,longDay){
  // base templates assume long run on Sunday (index 6)
  const T={
    3:{1:"Q1",3:"E",6:"L"},
    4:{1:"Q1",3:"Q2",5:"E",6:"L"},
    5:{1:"Q1",2:"E",3:"Q2",5:"E",6:"L"},
    6:{0:"E",1:"Q1",2:"E",3:"Q2",5:"E",6:"L"}
  }[runDays];
  const shift=longDay-6, out={};
  for(const k in T){out[((+k+shift)%7+7)%7]=T[k]}
  return out;
}
function buildPlan(s){
  const G=GOALS[s.goal]||GOALS["50k"];
  const start=mondayOf(parse(s.startDate)), race=parse(s.raceDate), raceMon=mondayOf(race);
  let weeks=Math.round((raceMon-start)/(7*DAY))+1;
  weeks=Math.max(4,Math.min(30,weeks));
  const base=Math.max(10,+s.baseKm||25);
  const peakVol=Math.max(base*1.15,Math.min(G.peakVol,Math.max(base*1.8,G.peakVol*0.75)));
  const taperF=TAPER[G.taper], taperStart=weeks-taperF.length;
  // Climbing: weekly target grows like volume towards a race-based peak.
  const raceVert=G.trail?(+s.raceVert||G.vert||2000):0;
  const vert0=G.trail?Math.max(100,+s.weekVert||400):0;
  const peakVert=G.trail?Math.max(vert0*1.2,Math.min(raceVert,Math.max(1500,raceVert*0.65))):0;
  // Two multi-day training camps, 8 and 4 weeks before race week, each followed by a recovery week.
  const raceW=weeks-1, camps=new Set(G.stages?[raceW-8,raceW-4].filter(x=>x>=4&&x<taperStart):[]);
  // Spike guard: no run more than 10% longer than the longest of the previous 30 days (Frandsen 2025).
  const runHist=[{date:iso(addDays(start,-1)),km:Math.max(5,+s.longest||base*0.4)}];
  const max30=date=>{const lo=iso(addDays(parse(date),-30));return Math.max(...runHist.filter(r=>r.date>=lo&&r.date<date).map(r=>r.km),0)};
  const HR=typeof healthRules==="function"&&typeof state!=="undefined"?healthRules():{growth:1.08,spike:1.1,cutEvery:4,extraRecoveryAfterCamp:false};
  const guard=(date,km)=>Math.min(km,Math.max(5,max30(date)*HR.spike));
  const plan=[]; let step=0, topVert=vert0;
  const lay=layout(+s.runDays,+s.longDay);
  for(let w=0;w<weeks;w++){
    const mon=addDays(start,w*7);
    let phase, vol, cut=false, vf;
    if(w>=taperStart){const ti=w-taperStart;phase=w===weeks-1?"Race week":"Taper";vf=taperF[ti];vol=peakVol*vf}
    else{
      const f=w/Math.max(1,taperStart);
      phase=f<0.35?"Base":f<0.75?"Build":"Peak";
      cut=camps.has(w-1)||((w+1)%HR.cutEvery===0&&!camps.has(w));
      vol=Math.min(peakVol,base*Math.pow(HR.growth,step));
      if(cut)vol*=0.75;else step++;
    }
    const camp=camps.has(w);
    const buildVert=Math.min(peakVert,vert0*Math.pow(1.1,Math.max(0,step-1)));
    if(!cut&&w<taperStart)topVert=Math.max(topVert,buildVert);
    const weekVert=!G.trail||w===weeks-1?0:Math.round((w>=taperStart?topVert*vf:buildVert*(cut?0.75:1))/50)*50;
    const prog=w/Math.max(1,taperStart-1);
    const sessions=[];
    const add=(dayIdx,type,o)=>{const date=iso(addDays(mon,dayIdx));sessions.push(Object.assign({id:date+"-"+type,date,type,day:dayIdx},o))};
    const dateOf=d=>iso(addDays(mon,d));
    const raceWeek=w===weeks-1;
    const longShare=G.trail?0.4:0.36;
    const longStart=Math.max(6,base*longShare);
    let longKm=longStart+(G.peakLong*0.85-longStart)*Math.min(1,Math.max(0,prog));
    longKm=Math.max(6,Math.min(G.peakLong,longKm,vol*0.5));
    if(cut)longKm*=0.75;
    if(phase==="Taper")longKm=Math.min(longKm,G.peakLong*(vf>=0.8?0.7:0.55));
    const qKm=Math.max(7,vol*0.16);
    const nEasy=Object.values(lay).filter(v=>v==="E").length;
    const b2bOn=G.trail&&+s.runDays>=4&&(phase==="Build"||phase==="Peak")&&!cut&&!camp;
    // Day two of a back-to-back: ~50% for a 50k; 60% → 75% for multi-day.
    const b2bRatio=G.stages?(phase==="Peak"?0.75:0.6):0.5;
    const longIdx=+s.longDay, b2bIdx=(longIdx+6)%7;
    const longDate=dateOf(longIdx);
    longKm=guard(longDate,longKm);
    const b2bKm=b2bOn?r5(Math.min(longKm*b2bRatio,guard(dateOf(b2bIdx),longKm*b2bRatio))):0;
    const easyKm=Math.max(4,(vol-longKm-qKm*2-b2bKm)/Math.max(1,nEasy-(b2bOn?1:0)));
    const V=x=>Math.round(weekVert*x/50)*50;
    if(raceWeek){
      const rIdx=(race.getDay()+6)%7, n=G.stages||1, first=rIdx-(n-1);
      [first-5,first-3,first-1].filter(d=>d>=0).forEach((d,i)=>{
        if(i===1)add(d,"tempo",workout("tempo",{km:6,reps:2,G,phase,easy:true}));
        else add(d,"easy",workout("easy",{km:i===2?3:5,strides:i===2,G,shake:i===2}));
      });
      for(let k=0;k<n;k++){const d=first+k;if(d<0)continue;
        const r=workout("race",{km:Math.round(G.race/n*10)/10,G,stage:n>1?k+1:0,stages:n});
        add(d,"race",r);}
    } else if(camp){
      // Camp weekend: three long days in a row (about 100% / 80% / 60%), easier midweek, one light strength session.
      const cd=[longIdx-2,longIdx-1,longIdx].map(d=>(d+7)%7);
      const q1=+Object.keys(lay).find(k=>lay[k]==="Q1");
      if(!cd.includes(q1))add(q1,"hills",workout("hills",{km:r5(qKm*0.8),G,phase,prog,cut:true}));
      const e=[0,1,2,3,4,5,6].find(d=>!cd.includes(d)&&d!==q1&&Math.abs(d-q1)>1&&d in lay);
      if(e!==undefined)add(e,"easy",workout("easy",{km:r5(Math.min(8,easyKm)),strides:false,G}));
      [1,0.8,0.6].forEach((x,i)=>{const d=cd[i], km=r5(guard(dateOf(d),longKm*x));
        add(d,"long",Object.assign(workout("long",{km,G,phase,prog,vert:V([0.4,0.33,0.27][i]),camp:i+1}),{}));});
    } else {
      for(const k in lay){
        const d=+k, v=lay[k];
        if(v==="L")add(d,"long",workout("long",{km:r5(longKm),G,phase,prog,vert:V(b2bOn?0.4:0.5)}));
        else if(v==="Q1"){
          const t=G.trail?"hills":"intervals";
          add(d,t,workout(t,{km:r5(qKm),G,phase,prog,cut,vert:V(0.2)}));
        } else if(v==="Q2"){
          // Trail goals: power-hike intervals in alternate Build weeks; a long uphill hike in Peak.
          if(G.trail&&!cut&&(phase==="Peak"||(phase==="Build"&&w%2===1)))add(d,"hike",workout("hike",{km:r5(qKm),G,phase,prog,vert:V(0.2)}));
          else add(d,"tempo",workout("tempo",{km:r5(qKm),G,phase,prog,cut}));
        } else if(v==="E"){
          if(b2bOn&&d===b2bIdx)add(d,"b2b",workout("b2b",{km:b2bKm,G,vert:V(0.2),multi:!!G.stages}));
          else add(d,"easy",workout("easy",{km:r5(easyKm),strides:phase!=="Base"||w%2===1,G}));
        }
      }
    }
    if(!raceWeek){
      const used=new Set(sessions.map(x=>x.day));
      if(s.gym){
        const gymDays=pickGym(lay,longIdx,used,camp);
        const n=phase==="Taper"||camp?1:2;
        gymDays.slice(0,n).forEach((d,i)=>{const date=iso(addDays(mon,d)), v=i%2?"B":"A", id=date+"-strength", loc=locFor(id,v,s);
          add(d,"strength",workout("strength",{v,phase,cut:cut||camp,loc,equip:kitsOf(s)[loc],over:((typeof state!=="undefined"&&state.exOver)||{})[id]}))});
      }
      if(s.bike&&!camp&&phase!=="Taper"){
        const busy=new Set(sessions.map(x=>x.day));
        const bd=[0,1,2,3,4,5,6].filter(d=>!busy.has(d)&&d!==((longIdx+1)%7));
        const day=bd.length?bd[Math.floor(bd.length/2)]:null;
        if(day!==null)add(day,"bike",workout("bike",{phase,prog,cut}));
      }
    }
    // Perimenopause / post-menopause: the first hard session after a camp weekend becomes easy (extra recovery).
    if(HR.extraRecoveryAfterCamp&&camps.has(w-1)){const q=sessions.filter(x=>x.type==="hills"||x.type==="tempo"||x.type==="hike"||x.type==="intervals").sort((a,b)=>a.date<b.date?-1:1)[0];
      if(q){const ttl=q.title;Object.assign(q,workout("easy",{km:r5(Math.max(4,(q.km||8)*0.7)),strides:false,G}),{type:"easy",title:"Easy run (recovery)",summary:"An extra easy day after the camp weekend – recovery from long descents takes longer after menopause. Swapped from "+ttl.toLowerCase()+"."})}}
    // Heat acclimation: the two weeks before the taper, for a hot race.
    if(typeof hotRace==="function"&&typeof state!=="undefined"&&state.settings&&hotRace()&&w>=taperStart-2&&w<taperStart)
      sessions.filter(x=>x.type==="easy"||x.type==="b2b").forEach(x=>{x.steps=x.steps.concat([["Heat acclimation","Run this in the warmest part of the day or wear an extra layer: 40–60 min easy, pace by effort or heart rate. Drink to thirst and stop if you feel dizzy or nauseous."]]);x.summary+=" Part of your 10–14 days of heat acclimation."});
    sessions.forEach(x=>{if(TYPES[x.type].run&&x.km)runHist.push({date:x.date,km:x.km})});
    sessions.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.type==="strength")-(b.type==="strength"));
    plan.push({w:w+1,mon:iso(mon),phase,cut,camp,vert:weekVert,sessions});
  }
  return plan;
}
// Strength goes on the quality-run days (hard days hard, easy days easy), never in the 48 h before
// the long run or on the day after it. Fallback: any other free day that keeps those rules.
function pickGym(lay,L,used,camp){
  const bad=new Set([(L+6)%7,(L+5)%7,L,(L+1)%7]);
  const q=["Q1","Q2"].map(t=>Object.keys(lay).find(k=>lay[k]===t)).filter(x=>x!==undefined).map(Number);
  const out=q.filter(d=>!bad.has(d));
  [0,1,2,3,4,5,6].forEach(d=>{if(!out.includes(d)&&!bad.has(d)&&d in lay)out.push(d)});
  [0,1,2,3,4,5,6].forEach(d=>{if(!out.includes(d)&&!bad.has(d))out.push(d)});
  // spread two sessions at least a day apart where possible
  if(out.length>2&&Math.abs(out[0]-out[1])<2){const alt=out.slice(2).find(d=>Math.abs(d-out[0])>=2);if(alt!==undefined){out.splice(out.indexOf(alt),1);out.splice(1,0,alt)}}
  return out.length?out:[(L+3)%7,(L+4)%7];
}
