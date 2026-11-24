"use strict";
// Ridgeline – 18-events-boot.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.

/* ---------- illness / injury pause ---------- */
function pauseSheet(){
  openSheet('<div class="sh" style="background:var(--strength);position:relative"><button class="closex" data-close aria-label="Close">×</button><div>Pause the plan</div><h2 id="sheetTitle">Ill or injured?</h2></div><div class="sb">'+
    '<p style="margin-top:0">Nothing counts as missed while you’re paused. When you tap “I’m back”, the plan eases you in: a few days off means a lighter rest of the week; a week or more means easy running first and a gradual build back.</p>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-pausestart="ill">I’m ill</button><button class="btn" data-pausestart="injury">I’m injured</button></div>'+
    '<p class="note" style="margin:14px 0 0">If it’s an injury, pain that changes how you walk, swelling, or pain in a bone (shin, foot, hip) means see a physio or doctor before running again.</p></div>');
}
document.addEventListener("click",e=>{
  const ask=e.target.closest("[data-pauseask]"); if(ask){e.preventDefault();closeSheet();setTimeout(pauseSheet,50);return}
  const st=e.target.closest("[data-pausestart]"); if(st){state.pause={from:todayIso(),kind:st.dataset.pausestart};logEvent("pause_start",{kind:state.pause.kind});save();rebuild();closeSheet();render();toast(state.pause.kind==="injury"?"Paused – look after it":"Paused – get well soon");return}
  const ch=e.target.closest("[data-pausekind]"); if(ch&&state.pause){state.pause.kind=ch.dataset.pausekind;save();render();return}
  const rs=e.target.closest("[data-resume]"); if(rs&&state.pause){const p=state.pause;p.to=todayIso();(state.pauses=state.pauses||[]).push(p);state.pause=null;
    const days=Math.round((parse(p.to)-parse(p.from))/DAY)+1;logEvent("pause_end",{kind:p.kind,days});save();rebuild();render();toast("Welcome back – "+(days>=4?"easing you in":"carry on as planned"))}
});

/* ---------- events ---------- */
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-open],[data-log],[data-tick],[data-wk],[data-close],[data-save],[data-skip],[data-undo],[data-rpe],[data-unswap]");
  if(!t)return;
  const d=t.dataset;
  if(d.rpe){t.parentElement.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b===t&&b.getAttribute("aria-pressed")!=="true"));return}
  if("close" in d){closeSheet();return}
  if(d.open){sheetFor(d.open,false);return}
  if(d.log){sheetFor(d.log,true);return}
  if(d.wk){const w=+d.wk;renderPlan.open[w]=!(t.getAttribute("aria-expanded")==="true");if(plan[w-1]===currentWeek()&&!renderPlan.open[w]){/* allow collapsing current */}render();return}
  if(d.tick){
    const s=findS(d.tick); const L=state.log[s.id];
    if(L&&L.status==="done"){delete state.log[s.id];logEvent("untick",{id:s.id});toast("Unticked")}
    else{state.log[s.id]=Object.assign({},L,{status:"done",at:Date.now()});logEvent("tick",{id:s.id});toast(s.title+" done")}
    save();render();return;
  }
  if(d.save){
    const s=findS(d.save), rp=$("#sheet .rpe [aria-pressed=true]");
    state.log[s.id]={status:"done",actual:$("#lgAct").value,rpe:rp?+rp.dataset.rpe:null,note:$("#lgNote").value.slice(0,500),at:Date.now()};
    {const L=state.log[s.id],num=sel=>{const el=$(sel);return el&&el.value!==""&&el.value!=null&&!isNaN(+el.value)?+el.value:null};
      const c=num("#lgCarb"),wb=num("#lgWb"),wa=num("#lgWa"),gi=$("#lgGi")&&$("#lgGi").value;
      if(c!=null)L.carbs=c;if(gi)L.gi=gi;if(wb!=null)L.wb=wb;if(wa!=null)L.wa=wa;}logEvent("log",{id:s.id,actual:state.log[s.id].actual,rpe:state.log[s.id].rpe});
    save();closeSheet();render();toast("Logged");return;
  }
  if(d.skip){state.log[d.skip]={status:"skipped",at:Date.now()};logEvent("skip",{id:d.skip});save();closeSheet();render();toast("Skipped – no stress");return}
  if(d.unswap){delete state.swaps[d.unswap];logEvent("unswap",{id:d.unswap});save();rebuild();closeSheet();render();toast("Original session restored");return}
  if(d.undo){delete state.log[d.undo];logEvent("undo",{id:d.undo});save();closeSheet();render();toast("Marked as not done");return}
});
document.addEventListener("change",e=>{
  const sel=e.target.closest("[data-move]"); if(!sel)return;
  const s=findS(sel.dataset.move); const orig=s.id.slice(0,10);
  logEvent("move",{id:s.id,from:s.date,to:sel.value,reason:"manual"});
  if(sel.value===orig)delete state.moves[s.id];else state.moves[s.id]=sel.value;
  save();rebuild();render();sheetFor(s.id,false);toast("Moved to "+DN[(parse(sel.value).getDay()+6)%7]);
});
$("#scrim").addEventListener("click",closeSheet);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#sheet").classList.contains("show"))closeSheet()});
addEventListener("hashchange",()=>{render._scrolled=false;render();scrollTo(0,0)});

/* ---------- boot ---------- */
loadLocal(); rebuild(); render(); setTimeout(()=>icuSync(false),400); setTimeout(slSync,200); setTimeout(luaSync,300);
if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
