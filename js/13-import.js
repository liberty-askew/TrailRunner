"use strict";
// Ridgeline – 13-import.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- activity import (Garmin FIT / GPX / TCX / zip) ---------- */
const FIT_EPOCH=631065600;
function parseFit(buf){
  const dv=new DataView(buf), u8=i=>dv.getUint8(i);
  const hs=u8(0), size=dv.getUint32(4,true);
  if(String.fromCharCode(u8(8),u8(9),u8(10),u8(11))!==".FIT")throw new Error("Not a FIT file");
  let pos=hs; const end=Math.min(buf.byteLength,hs+size), defs={}; let sess=null, firstRec=null, lastRec=null, recDist=0;
  const rd=(p,sz,le)=>sz===1?dv.getUint8(p):sz===2?dv.getUint16(p,le):sz===4?dv.getUint32(p,le):null;
  const bad=(v,sz)=>v===null||(sz===1&&v===0xFF)||(sz===2&&v===0xFFFF)||(sz===4&&v===0xFFFFFFFF);
  while(pos<end){
    const hdr=u8(pos++);
    let local, isDef=false;
    if(hdr&0x80)local=(hdr>>5)&3;
    else{local=hdr&0x0F;isDef=!!(hdr&0x40)}
    if(isDef){
      const dev=hdr&0x20; pos++;
      const le=u8(pos++)===0, g=dv.getUint16(pos,le); pos+=2;
      const n=u8(pos++), fields=[];
      for(let i=0;i<n;i++){fields.push([u8(pos),u8(pos+1)]);pos+=3}
      let devSize=0; if(dev){const nd=u8(pos++);for(let i=0;i<nd;i++){devSize+=u8(pos+1);pos+=3}}
      defs[local]={g,le,fields,devSize};
    } else {
      const d=defs[local]; if(!d)throw new Error("Corrupt FIT file");
      const rec={};
      for(const [num,sz] of d.fields){const v=rd(pos,sz,d.le);if(!bad(v,sz))rec[num]=v;pos+=sz}
      pos+=d.devSize;
      if(d.g===18&&!sess)sess=rec;
      if(d.g===20){if(rec[253]!=null){if(!firstRec)firstRec=rec;lastRec=rec}if(rec[5]!=null)recDist=rec[5]}
    }
  }
  if(sess){
    return {start:new Date(((sess[2]??sess[253])+FIT_EPOCH)*1000),km:(sess[9]||0)/100000,secs:(sess[8]??sess[7]??0)/1000,
      ascent:sess[22]??null,sport:sess[5]===2?"bike":(sess[5]===1||sess[5]===11||sess[5]===17)?"run":sess[5]===10?"strength":"run"};
  }
  if(firstRec)return {start:new Date((firstRec[253]+FIT_EPOCH)*1000),km:recDist/100000,secs:lastRec[253]-firstRec[253],ascent:null,sport:"run"};
  throw new Error("No activity found in FIT file");
}
function climb(eles){let up=0,ref=null;for(const e of eles){if(e==null||isNaN(e))continue;if(ref===null){ref=e;continue}if(e-ref>=3){up+=e-ref;ref=e}else if(ref-e>=3)ref=e}return Math.round(up)}
function hav(a,b){const R=6371,r=Math.PI/180,dLa=(b[0]-a[0])*r,dLo=(b[1]-a[1])*r;const x=Math.sin(dLa/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function sportFrom(s){s=(s||"").toLowerCase();return /bik|cycl|ride/.test(s)?"bike":"run"}
function parseGpx(text){
  const x=new DOMParser().parseFromString(text,"application/xml");
  const pts=[...x.getElementsByTagNameNS("*","trkpt")];
  if(!pts.length)throw new Error("No track points in GPX file");
  let km=0,prev=null; const eles=[];
  for(const p of pts){const c=[+p.getAttribute("lat"),+p.getAttribute("lon")];if(prev)km+=hav(prev,c);prev=c;const e=p.getElementsByTagNameNS("*","ele")[0];eles.push(e?+e.textContent:null)}
  const tOf=p=>{const t=p.getElementsByTagNameNS("*","time")[0];return t?new Date(t.textContent):null};
  const t0=tOf(pts[0]), t1=tOf(pts[pts.length-1]);
  const meta=x.getElementsByTagNameNS("*","time")[0];
  const type=x.getElementsByTagNameNS("*","type")[0];
  return {start:t0||(meta?new Date(meta.textContent):new Date()),km,secs:t0&&t1?(t1-t0)/1000:0,ascent:climb(eles),sport:sportFrom(type&&type.textContent)};
}
function parseTcx(text){
  const x=new DOMParser().parseFromString(text,"application/xml");
  const act=x.getElementsByTagNameNS("*","Activity")[0]; if(!act)throw new Error("No activity in TCX file");
  const laps=[...act.getElementsByTagNameNS("*","Lap")];
  const num=(el,tag)=>{const n=el.getElementsByTagNameNS("*",tag)[0];return n?+n.textContent:0};
  let m=0,s=0; laps.forEach(l=>{m+=num(l,"DistanceMeters");s+=num(l,"TotalTimeSeconds")});
  const eles=[...act.getElementsByTagNameNS("*","AltitudeMeters")].map(e=>+e.textContent);
  const id=act.getElementsByTagNameNS("*","Id")[0];
  return {start:new Date(laps[0]?laps[0].getAttribute("StartTime"):id.textContent),km:m/1000,secs:s,ascent:climb(eles),sport:sportFrom(act.getAttribute("Sport"))};
}
async function unzip(buf){
  const dv=new DataView(buf); let e=buf.byteLength-22;
  while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;
  if(e<0)throw new Error("Not a zip file");
  let p=dv.getUint32(e+16,true); const n=dv.getUint16(e+10,true), out=[];
  for(let i=0;i<n;i++){
    const method=dv.getUint16(p+10,true), csize=dv.getUint32(p+20,true), nl=dv.getUint16(p+28,true), xl=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true), lo=dv.getUint32(p+42,true);
    const name=new TextDecoder().decode(new Uint8Array(buf,p+46,nl));
    p+=46+nl+xl+cl;
    if(!/\.(fit|gpx|tcx)$/i.test(name))continue;
    const start=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true);
    const raw=buf.slice(start,start+csize);
    let data;
    if(method===0)data=raw;
    else if(method===8){
      if(typeof DecompressionStream==="undefined")throw new Error("Unzip the file first, then import the .fit inside");
      data=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
    } else continue;
    out.push({name,data});
  }
  if(!out.length)throw new Error("No .fit, .gpx or .tcx file inside the zip");
  return out;
}
async function readActivities(file){
  const buf=await file.arrayBuffer(), name=file.name.toLowerCase();
  const items=name.endsWith(".zip")?await unzip(buf):[{name,data:buf}];
  return items.map(({name,data})=>{
    const n=name.toLowerCase();
    let a;
    if(n.endsWith(".fit"))a=parseFit(data);
    else if(n.endsWith(".gpx"))a=parseGpx(new TextDecoder().decode(data));
    else if(n.endsWith(".tcx"))a=parseTcx(new TextDecoder().decode(data));
    else throw new Error("Use a .fit, .gpx, .tcx or .zip file");
    if(!a.start||isNaN(a.start))throw new Error("Couldn’t read the start time");
    a.km=Math.round(a.km*100)/100; a.secs=Math.round(a.secs); a.date=iso(a.start); a.key=String(a.start.getTime());
    return a;
  });
}
const fmtDur=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+":"+pad(m):m)+":"+pad(x)};
const fmtPace=(secs,km)=>km>0.05?(()=>{const p=secs/km;return Math.floor(p/60)+":"+pad(Math.round(p%60)%60)+"/km"})():"–";
function actSummary(a){
  const km=a.km!=null?a.km:+a.actual;
  return '<div class="actsum"><div><b>'+(km?km.toFixed(2):"–")+'</b><span>km</span></div><div><b>'+(a.secs?fmtDur(a.secs):"–")+'</b><span>time</span></div><div><b>'+(a.secs&&km?fmtPace(a.secs,km):"–")+'</b><span>pace</span></div><div><b>'+(a.ascent!=null?a.ascent+" m":"–")+'</b><span>climb</span></div></div>';
}
function alreadyImported(a){return Object.values(state.log).some(l=>l.key===a.key)||(state.extras||[]).some(x=>x.key===a.key)}
function candidates(a){
  const t=parse(a.date);
  return allSessions().filter(s=>{
    const diff=Math.abs((parse(s.date)-t)/DAY);
    const fits=a.sport==="bike"?s.type==="bike":a.sport==="strength"?s.type==="strength":TYPES[s.type].run;
    return diff<=3&&fits&&sessStatus(s)!=="done";
  }).sort((x,y)=>Math.abs(parse(x.date)-t)-Math.abs(parse(y.date)-t));
}
let impQueue=[];
function linkActivity(a,id){
  const s=findS(id);
  state.log[id]={status:"done",actual:s.km!=null?a.km.toFixed(1):String(Math.round(a.secs/60)),secs:a.secs,ascent:a.ascent,km:a.km,rpe:a.rpe||null,note:"",at:Date.now(),src:a.src||"Garmin",key:a.key};
  if(a.sl)state.log[id].sl=a.sl;
}
function nextImport(){
  const a=impQueue.shift(); if(!a){render();return}
  if(alreadyImported(a)){toast("Already imported: "+fmtShort(a.date));return nextImport()}
  const c=candidates(a);
  const opts=c.map(s=>'<option value="'+s.id+'">'+DN[s.day]+" "+fmtShort(s.date)+" · "+esc(s.title)+" ("+amount(s)+")</option>").join("")+'<option value="__extra">Not in my plan – log as an extra '+(a.sport==="bike"?"ride":"run")+'</option>';
  openSheet('<div class="sh" style="background:var(--primary);position:relative"><button class="closex" data-close aria-label="Close">×</button><div>'+esc(fmtDay(a.date))+(impQueue.length?" · "+impQueue.length+" more to go":"")+'</div><h2 id="sheetTitle">'+(a.sport==="bike"?"Ride":"Run")+' imported</h2></div><div class="sb">'+actSummary(a)+
    '<label class="f"><span>Which session was this?</span><select id="impSel">'+opts+'</select>'+(c.length?'':'<small>No unfinished sessions within three days of this activity.</small>')+'</label>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="impOk">Tick it off</button><button class="btn quiet" id="impSkip">Don’t import</button></div></div>');
  const sheetEl=$("#sheet");
  sheetEl._onClose=()=>{impQueue=[]};
  $("#impOk").onclick=()=>{
    const v=$("#impSel").value;
    if(v==="__extra"){state.extras=state.extras||[];state.extras.push({key:a.key,date:a.date,km:a.km,secs:a.secs,ascent:a.ascent,sport:a.sport});logEvent("import_extra",{date:a.date,km:a.km})}
    else{linkActivity(a,v);logEvent("import",{id:v,km:a.km,secs:a.secs})}
    state.pending=(state.pending||[]).filter(p=>p.key!==a.key);
    save();sheetEl._onClose=null;closeSheet();toast(v==="__extra"?"Logged as extra":"Ticked off");render();setTimeout(nextImport,250);
  };
  $("#impSkip").onclick=()=>{state.pending=(state.pending||[]).filter(p=>p.key!==a.key);save();sheetEl._onClose=null;closeSheet();render();setTimeout(nextImport,250)};
}
document.addEventListener("change",async e=>{
  if(e.target.id!=="actIn")return;
  const files=[...e.target.files]; e.target.value="";
  if(!state.settings){toast("Set up your plan first");return}
  for(const f of files){
    try{impQueue.push(...await readActivities(f))}
    catch(err){toast(f.name+": "+(err.message||"couldn’t read file"))}
  }
  impQueue.sort((x,y)=>x.start-y.start);
  nextImport();
});
