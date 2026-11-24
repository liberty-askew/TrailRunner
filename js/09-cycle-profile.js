"use strict";
// Ridgeline – 09-cycle-profile.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- your cycle profile: which days are hard, and what Ridgeline should do ---------- */
const PWIN=[["p12","First 1–2 days of my period"],["p3","First 3 days of my period"],["pall","My whole period"],["pre","A few days before my period"],["ov","Around ovulation"]];
const PSYM=[["cramps","Bad cramps"],["fatigue","Fatigue"],["lightheaded","Light-headed with hard exercise"],["heavy","Heavy bleeding"],["headache","Headaches"],["gut","Gut problems"],["sleep","Poor sleep"],["mood","Low mood"]];
const PMODE=[["auto","Move hard sessions for me"],["ask","Ask me first"],["remind","Just remind me"]];
const MOVABLE=new Set(["hills","intervals","tempo","hike"]);
const prof=()=>state.cycle&&state.cycle.on&&state.cycle.profile&&(state.cycle.profile.windows||[]).length?state.cycle.profile:null;
function toughDay(date){
  const p=prof(), ci=cycleInfo(date); if(!ci)return null;
  const prot=(state.cycle.protect||[]).includes(ci.phase);
  if(!p)return prot?{ci,why:ci.phase.toLowerCase()+" days"}:null;
  const w=new Set(p.windows), per=ci.phase==="Period";
  const hit=(w.has("p12")&&per&&ci.day<=2)||(w.has("p3")&&per&&ci.day<=3)||(w.has("pall")&&per)||(w.has("pre")&&!state.cycle.hc&&ci.day>ci.len-3)||(w.has("ov")&&ci.phase==="Ovulation window");
  if(!hit&&!prot)return null;
  return {ci,why:per?"day "+ci.day+" of your period":ci.day>ci.len-3?"the days before your period":ci.phase==="Ovulation window"?"around ovulation":ci.phase.toLowerCase()+" days"};
}
const pLabel=(list,keys)=>list.filter(([k])=>keys.includes(k)).map(([,l])=>l.toLowerCase());
// Auto mode: swap a hard session on a tough day with an easy run later (or earlier) in the same week.
function cycleRearrange(){
  const p=prof(); if(!p)return;
  const t=todayIso();
  if(p.mode==="auto")plan.forEach(wk=>{
    const ss=wk.sessions;
    ss.filter(s=>MOVABLE.has(s.type)&&s.date>=t&&!sessStatus(s)&&!state.moves[s.id]&&!s.swapped).forEach(s=>{
      const td=toughDay(s.date); if(!td)return;
      const long=ss.find(x=>x.type==="long");
      const opts=ss.filter(e=>e.type==="easy"&&e.date>=t&&!sessStatus(e)&&!toughDay(e.date)&&!state.moves[e.id])
        .sort((a,b)=>{const pen=x=>(long&&iso(addDays(parse(long.date),-1))===x.date?5:0)+(x.date<s.date?2:0)+Math.abs(parse(x.date)-parse(s.date))/DAY/10;return pen(a)-pen(b)});
      const e=opts[0];
      // No easy run to swap with: try a free day that isn't tough, isn't next to another hard day and isn't the day before a long run.
      const used=new Set(ss.filter(x=>x!==s&&TYPES[x.type].run).map(x=>x.date));
      const hardDays=ss.filter(x=>x!==s&&(MOVABLE.has(x.type)||x.type==="long"||x.type==="b2b")).map(x=>x.date);
      const free=!e&&[0,1,2,3,4,5,6].map(d=>iso(addDays(parse(wk.mon),d))).filter(d=>d>s.date&&d>=t&&!used.has(d)&&!toughDay(d)&&!hardDays.some(x=>Math.abs(parse(x)-parse(d))<=DAY))[0];
      if(free){const a=s.date;s.date=free;s.day=(parse(free).getDay()+6)%7;s.cycleNote="Moved from "+DN[(parse(a).getDay()+6)%7]+" because "+fmtShort(a)+" is likely to be "+td.why+".";}
      else if(e){const a=s.date,b=e.date;s.date=b;s.day=(parse(b).getDay()+6)%7;e.date=a;e.day=(parse(a).getDay()+6)%7;
        s.cycleNote="Moved from "+DN[(parse(a).getDay()+6)%7]+" because "+fmtShort(a)+" is likely to be "+td.why+".";
        e.cycleNote="Swapped in for "+s.title.toLowerCase()+", which moved to "+DN[(parse(b).getDay()+6)%7]+" around your cycle.";}
      else if(!free&&p.impact!=="little"){const km=r5(Math.max(4,(s.km||8)*0.7));const ttl=s.title;Object.assign(s,workout("easy",{km,strides:false,G:GOALS[state.settings.goal]}),{type:"easy",swapped:true,title:"Easy run (cycle)",cycleNote:"Swapped from "+ttl.toLowerCase()+" to an easy run: "+fmtShort(s.date)+" is likely to be "+td.why+" and there’s no good day to move it to this week."})}
    });
    ss.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  });
  // notes on any tough day that keeps a session
  allSessions().forEach(s=>{if(!s.cycleNote&&s.date>=t&&TYPES[s.type]&&(TYPES[s.type].run||s.type==="strength")){const td=toughDay(s.date);if(td)s.cycleTough=td.why}});
}
function toughNotes(s){
  const p=prof(); const td=s.date?toughDay(s.date):null;
  let out="";
  if(s.replanNote)out+='<div class="tip" style="margin-bottom:12px;border-left:4px solid var(--hills)">'+esc(s.replanNote)+'</div>';
  if(s.cycleNote)out+='<div class="tip" style="margin-bottom:12px;border-left:4px solid var(--tempo)">'+esc(s.cycleNote)+'</div>';
  else if(td&&p&&p.mode!=="auto"&&MOVABLE.has(s.type)&&!sessStatus(s))out+='<div class="tip" style="margin-bottom:12px;border-left:4px solid var(--tempo)"><b>'+esc(fmtShort(s.date))+' is likely to be '+esc(td.why)+'</b>, which you said is tough. You can swap it for an easy run or move it later in the week below.</div>';
  if(td&&p&&p.sym.includes("lightheaded")&&(TYPES[s.type].run||s.type==="strength"))out+='<div class="tip" style="margin-bottom:12px"><b>If you feel light-headed:</b> stop, sit or lie down with your legs up, and sip a drink with some sugar and salt. Eat something 1–3 hours before training on these days. If it keeps happening, or you’re also breathless or unusually tired, ask your GP to check your iron (ferritin) and haemoglobin.</div>';
  return out;
}
// How many days a cycle a profile marks as tough; 7+ is "broad" and worth a warning.
function toughDaysPerCycle(windows){
  const plen=state.cycle&&+state.cycle.plen||5, w=new Set(windows||[]);
  let n=0; if(w.has("pall"))n+=plen;else if(w.has("p3"))n+=Math.min(3,plen);else if(w.has("p12"))n+=Math.min(2,plen);
  if(w.has("pre"))n+=3; if(w.has("ov"))n+=5; return n;
}
function broadWarning(windows,mode){
  const n=toughDaysPerCycle(windows); if(n<7)return "";
  return '<p class="tip" style="margin:8px 0 0;border-left:4px solid var(--hills)"><b>That’s about '+n+' tough days a cycle</b> – roughly a quarter of your training. '+(mode==="auto"?'With “move hard sessions for me”, many quality sessions would be moved or turned into easy runs. “Ask me first” keeps you in control – you can still swap on the day.':'Ridgeline will flag those days; consider keeping only the days that really affect you.')+'</p>';
}
function profileFields(pr,prefix){
  pr=pr||{windows:[],sym:[],impact:"some",mode:"ask"};
  const chips=(list,sel,key)=>'<div class="seg" data-multi="'+prefix+key+'">'+list.map(([k,l])=>'<button type="button" data-val="'+k+'" aria-pressed="'+sel.includes(k)+'">'+l+'</button>').join("")+'</div>';
  const one=(list,val,key)=>'<div class="seg" data-seg="'+prefix+key+'">'+list.map(([k,l])=>'<button type="button" data-val="'+k+'" aria-pressed="'+(val===k)+'">'+l+'</button>').join("")+'</div>';
  return '<div class="f"><span style="display:block;font-weight:700;margin-bottom:6px">Which days make training harder?</span>'+chips(PWIN,pr.windows,"win")+'<small class="note" style="display:block;margin-top:4px">Leave blank if your cycle doesn’t affect you.</small><div data-broad="'+prefix+'">'+broadWarning(pr.windows,pr.mode)+'</div></div>'+
    '<div class="f"><span style="display:block;font-weight:700;margin-bottom:6px">What do you usually notice?</span>'+chips(PSYM,pr.sym,"sym")+'</div>'+
    '<div class="f"><span style="display:block;font-weight:700;margin-bottom:6px">How much does it affect training?</span>'+one([["little","Not much"],["some","Somewhat"],["lot","A lot"]],pr.impact,"imp")+'</div>'+
    '<div class="f"><span style="display:block;font-weight:700;margin-bottom:6px">On those days, Ridgeline should…</span>'+one(PMODE,pr.mode,"mode")+'<small class="note" style="display:block;margin-top:4px">Hard sessions (hills, intervals, tempo, power hikes) move to an easier day that week. Long runs stay put, with a note.</small></div>';
}
function readProfile(root,prefix){
  const multi=k=>[...root.querySelectorAll('[data-multi="'+prefix+k+'"] [aria-pressed=true]')].map(b=>b.dataset.val);
  const one=k=>{const b=root.querySelector('[data-seg="'+prefix+k+'"] [aria-pressed=true]');return b?b.dataset.val:null};
  return {windows:multi("win"),sym:multi("sym"),impact:one("imp")||"some",mode:one("mode")||"ask"};
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-multi] button");if(b)b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")!=="true");
  // live warning as the profile changes
  const g=e.target.closest("[data-multi$=win],[data-seg$=mode]"); if(!g)return;
  const root=g.closest("form")||document; const prefix=(g.dataset.multi||g.dataset.seg).replace(/win$|mode$/,"");
  setTimeout(()=>{const p=readProfile(root,prefix);const box=root.querySelector('[data-broad="'+prefix+'"]');if(box)box.innerHTML=broadWarning(p.windows,p.mode)},0);
});
