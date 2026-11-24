"use strict";
// Ridgeline – 01-dates.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- dates ---------- */
const DAY=864e5;
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const mondayOf=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());return addDays(x,-((x.getDay()+6)%7))};
const todayIso=()=>iso(new Date());
const DN=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const fmtDay=s=>parse(s).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
const fmtShort=s=>parse(s).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const r5=x=>Math.max(0,Math.round(x*2)/2);
