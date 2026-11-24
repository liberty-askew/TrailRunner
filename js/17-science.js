"use strict";
// Ridgeline – 17-science.js. Classic scripts loaded in order (see index.html); top-level declarations are shared across files.
/* ---------- report: how the science differs for women ---------- */
// One row per topic: what the mostly-male (or mixed) research says, what the female data show, what Ridgeline does.
const SEX_DIFF=[
 {t:"How fast to build",men:"The key study linking single long-run jumps to overuse injury followed 5,205 runners, 78% of them men.",women:"Not analysed by sex. Women’s most serious injury, bone stress, is driven more by under-fuelling and menstrual changes than by training jumps.",app:"Keeps the 10% long-run cap for everyone; tightens it to 5% (and the weekly build to 5%) for women at moderate or high bone risk.",refs:[["Frandsen 2025","https://www.fitasaphysio.com/uploads/4/3/3/4/43345381/1203.full.pdf"],["Two Oceans study","https://lida.sport-iat.de/dlv/Record/4013423?lng=en"]]},
 {t:"Which injuries matter",men:"Injury-prevention exercises like Nordic curls and Copenhagen planks were proven mainly in male footballers and team sports, against hamstring and groin injuries.",women:"In women distance runners the injury that matters is bone stress: about one in five women ultra entrants had had one, and irregular periods roughly doubled the risk.",app:"Bone health check, shin/bone-pain pause, energy check. Nordics and Copenhagen planks are optional extras.",refs:[["Hutson 2021","https://lida.sport-iat.de/ta/Record/4074012?lng=en"],["Stress fracture risk factors","https://pmc.ncbi.nlm.nih.gov/articles/PMC7872445"]]},
 {t:"What strength training does",men:"In mixed and mostly male studies, heavy lifting and jumps make running more economical.",women:"In the one trial in well-trained women, heavy lifting made them 40% stronger but didn’t change running economy; they did run better after a long effort. The two running trials that cut injuries were mostly women.",app:"Strength is for staying injury-free and strong late in a long race, not for a faster easy pace.",refs:[["Vikmoen 2016","https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4783109/"],["Vikmoen 2017","https://pmc.ncbi.nlm.nih.gov/articles/PMC5350167"]]},
 {t:"Physiology over long distances",men:"Men have higher maximum oxygen uptake and haemoglobin; the gap is about 10% in the marathon.",women:"Women have more fatigue-resistant muscle fibres and burn more fat, and the gap has been reported as low as about 4% in ultras. Against that: more gut problems and lower oxygen-carrying capacity.",app:"Long runs and back-to-backs unchanged; fuelling targets and gut training on every long run; iron checks.",refs:[["Tiller 2021","https://escholarship.org/content/qt5gt348gb/qt5gt348gb.pdf"]]},
 {t:"Not eating enough",men:"Under-fuelling in men lowers testosterone and bone density but has no obvious early warning sign.",women:"Periods give an early signal. 31–44% of women trail and ultra runners in recent surveys screened at risk, and few knew the condition existed.",app:"Energy check every 8 weeks; late or missed periods prompt a fuelling check or GP visit.",refs:[["Folscher 2015","https://pubmed.ncbi.nlm.nih.gov/26380807/"],["Henninger","https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10824294/"]]},
 {t:"Drinking",men:"Older advice focused on avoiding dehydration.",women:"In the Boston Marathon study 22% of women and 8% of men finished with low blood sodium, but body size, race time and over-drinking explained it rather than sex itself.",app:"Drink to thirst; weigh before and after long runs; finishing heavier is flagged.",refs:[["Almond 2005","https://searchworks.jioinstitute.edu.in/articles/asx__106505505"]]},
 {t:"Iron",men:"Iron deficiency is less common in men.",women:"A third of marathon runners in one survey reported heavy periods and a third a history of anaemia; few had seen a doctor.",app:"Ferritin and haemoglobin check every 6 months, or 3 with heavy periods or fatigue.",refs:[["Bruinvels 2016","https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4763330/"]]},
 {t:"Hormones",men:"Hormones are fairly stable, so most training research ignores them.",women:"Cycle phase has at most a trivial effect on performance, and so does the pill; menopause speeds up bone loss.",app:"Symptom-led adjustments rather than phase rules; life-stage modes for contraception, perimenopause and post-menopause.",refs:[["McNulty 2020","https://doi.org/10.1007/s40279-020-01319-3"],["Elliott-Sale 2020","https://pmc.ncbi.nlm.nih.gov/articles/PMC7497464"]]},
 {t:"Recovery",men:"Most muscle-damage research is in men.",women:"Animal studies suggest oestrogen protects muscle, but human studies don’t show women recover faster; their soreness can outlast blood markers of damage.",app:"Same recovery spacing for everyone; an extra easy day after camp weekends from perimenopause.",refs:[["Downhill running by sex","https://pmc.ncbi.nlm.nih.gov/articles/PMC5384179"]]},
 {t:"Heat",men:"Heat acclimation is well studied, mostly in men.",women:"Core temperature is slightly higher after ovulation, but in trained women humidity mattered more than cycle phase.",app:"10–14 days of heat acclimation before a summer race, for everyone.",refs:[["Lei 2017","https://pmc.ncbi.nlm.nih.gov/articles/PMC5407968"]]},
 {t:"Pacing",men:"Men slowed more in the second half of the marathon (15.6% vs 11.7%).",women:"A 2025 reanalysis found the gap mostly among slower and younger runners, suggesting it’s about decisions, not biology.",app:"The same even-pacing advice for everyone; fuelling, drinking and feet come first on race day.",refs:[["Deaner 2015","https://pmc.ncbi.nlm.nih.gov/articles/PMC4289124"]]}
];
function sexDiffReport(){
  return '<section class="block" id="sexdiff"><h2>How the science differs for women</h2>'+
    '<div class="card sumcard"><div class="sumhead">Most training research has been done on men; for women training long, the training itself barely changes, but the risks around it do.</div>'+
    '<p>The core plan – how fast to build, easy running with two hard days, long runs and back-to-backs, a taper – holds up for women. What differs is which injuries matter (bone stress rather than hamstrings), how common under-fuelling is, the role of iron and hormones, and what strength training is for.</p></div>'+
    '<div class="tscroll"><table class="rt sxt"><thead><tr><th scope="col">Topic</th><th scope="col">Mostly men</th><th scope="col">What we know in women</th><th scope="col">What Ridgeline does</th></tr></thead><tbody>'+
    SEX_DIFF.map(r=>'<tr><th scope="row">'+esc(r.t)+'</th><td>'+esc(r.men)+'</td><td>'+esc(r.women)+(r.refs.length?'<div class="sxref">'+r.refs.map(([l,u])=>'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(l)+'</a>').join(" · ")+'</div>':'')+'</td><td>'+esc(r.app)+'</td></tr>').join("")+
    '</tbody></table></div>'+
    '<p class="note" style="margin-top:10px">Where female data are still missing: how fast to build and how to taper (no study analysed women separately), back-to-backs and camps (no trials in anyone), strength training in female ultrarunners, and training through perimenopause and menopause. Those parts of the plan rest on mixed-sex research and coaching practice.</p></section>';
}

/* ---------- the science behind the plan ---------- */
// Plain-language summaries in our own words, with links to the research. Evidence levels are judgements:
// "strong" = consistent findings from reviews/trials; "moderate" = some trials or large cohorts; "limited" = mostly expert practice.
const SCIENCE=[
 {h:"How fast the plan builds",items:[
  {t:"About 8% more running each week, with a recovery week every fourth week",
   why:"The popular “10% rule” has surprisingly little direct support: a trial in new runners found a gentler 10% build didn’t lower injury risk compared with a standard programme. Large jumps do seem to matter, though – novice runners who increased by more than 30% over two weeks had more overuse injuries like runner’s knee and shin pain. Ridgeline’s steady build sits comfortably below that, and the recovery weeks are standard coaching practice rather than something tested in trials.",
   level:"Moderate for avoiding big jumps; limited for the exact numbers",
   refs:[["Nielsen et al. 2014 – weekly distance progression and injury (JOSPT)","https://www.jospt.org/doi/10.2519/jospt.2014.5164"],["Systematic review: training-load changes and running injuries","https://pmc.ncbi.nlm.nih.gov/articles/PMC6253751/"]]},
  {t:"No run more than 10% longer than your longest in the last 30 days",
   why:"The biggest study of this so far followed over 5,000 runners and more than half a million sessions. Injury risk rose when a single run was more than 10% longer than the longest of the previous month, while week-to-week mileage changes weren’t linked to injury. That’s why Ridgeline caps each run, especially the long run, rather than only the weekly total – and flags it in your weekly report if a real run breaks the rule.",
   level:"Moderate (one large observational study, mostly men)",
   refs:[["Frandsen et al. 2025 – single-session spikes and injury in 5,205 runners (BJSM)","https://www.fitasaphysio.com/uploads/4/3/3/4/43345381/1203.full.pdf"]]},
  {t:"Load ratios are a gentle warning, not a rule",
   why:"The “acute:chronic workload ratio” (this week vs your recent average) became popular in team sports, and one study of New York marathoners linked high ratios with more injuries. But it has serious statistical problems, so Ridgeline only uses it as a soft nudge when a week is well over 1.5× your 4-week average.",
   level:"Limited",
   refs:[["Impellizzeri et al. 2020 – problems with the acute:chronic ratio (IJSPP)","https://journals.humankinetics.com/view/journals/ijspp/15/6/article-p907.xml"],["Toresdahl et al. – training patterns and injury in NYC Marathon runners","https://pubmed.ncbi.nlm.nih.gov/36113976/"]]},
  {t:"Tapering: less volume, same intensity, over 2–3 weeks",
   why:"A meta-analysis of tapering found the best results from about two weeks of reduced training, with volume cut by roughly 40–60% while keeping the intensity and how often you train. Ridgeline’s taper follows that (2 weeks for a 50k, 3 for the multi-day goal). The studies were in swimmers, cyclists and runners, not ultrarunners.",
   level:"Strong for the general principle",
   refs:[["Bosquet et al. 2007 – effects of tapering on performance (meta-analysis)","https://www.ovid.com/jnls/acsm-msse/abstract/10.1249/mss.0b013e31806010e0~effects-of-tapering-on-performance-a-meta-analysis?redirectionsource=fulltextview"]]}]},
 {h:"How hard the sessions are",items:[
  {t:"Mostly easy running, two harder sessions a week",
   why:"Well-trained distance runners spend most of their time at easy effort with a smaller amount of harder work, and comparisons of “polarised” and “pyramidal” patterns show both work. Mountain ultras themselves are run mostly at low intensity, so plenty of easy volume is race-specific.",
   level:"Strong",
   refs:[["Casado et al. 2022 – how elite distance runners train (systematic review)","https://www.researchgate.net/publication/359923898_Training_Periodization_Methods_Intensity_Distribution_and_Volume_in_Highly_Trained_and_Elite_Distance_Runners_A_Systematic_Review"],["What limits ultramarathon performance? (systematic review)","https://pmc.ncbi.nlm.nih.gov/articles/PMC7126261/"]]},
  {t:"Effort (RPE) rather than pace",
   why:"On steep or technical trails pace stops meaning much, while perceived effort stays useful and is a widely used, validated way of tracking training load. Heart rate is a helpful check on easy days, particularly in heat or at altitude.",
   level:"Strong for RPE as a load measure",
   refs:[["Casado et al. 2022 (as above)","https://www.researchgate.net/publication/359923898_Training_Periodization_Methods_Intensity_Distribution_and_Volume_in_Highly_Trained_and_Elite_Distance_Runners_A_Systematic_Review"]]}]},
 {h:"Training for the mountains",items:[
  {t:"Long runs by time on feet, with a climbing target",
   why:"On mountain terrain the same distance can take very different amounts of time and effort, so time and climbing describe the training better than kilometres. Lower yearly climbing and lower weekly volume were linked to more injuries in a study of trail runners. The exact targets are Ridgeline’s design choices, built up gradually like your mileage.",
   level:"Limited to moderate",
   refs:[["Factors linked to injury and performance in trail running (Injury, 2025)","https://www.sciencedirect.com/science/article/pii/S0020138325006564"]]},
  {t:"Practising downhills, gradually",
   why:"Long descents cause a lot of muscle damage, a major limiter in mountain races. Doing some downhill running beforehand protects the muscles next time (the “repeated-bout effect”), and trail runners who regularly do downhill intervals lost less strength after a hard descent. Ridgeline adds a little controlled descending each phase and none that’s new in the taper.",
   level:"Moderate",
   refs:[["Downhill running muscle damage in trail runners (2026)","https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12846201/"]]},
  {t:"Power-hiking with poles",
   why:"On steep slopes, walking fast uses less energy than running, and poles make the effort feel easier. That’s why trail plans include power-hike intervals and a long uphill hike in Peak.",
   level:"Moderate (lab studies)",
   refs:[["Giovanelli et al. 2016 – walking vs running uphill (J Appl Physiol)","https://journals.physiology.org/doi/full/10.1152/japplphysiol.00546.2015"],["Giovanelli et al. 2019 – do poles save energy uphill?","https://nicolagiovanelli.com/wp-content/uploads/2022/01/52f25-giovanelli-et-al-ejap-2019.pdf"]]},
  {t:"Back-to-back runs and training camps for multi-day events",
   why:"Running long on tired legs is the core of multi-day preparation, but there are no trials comparing ways to do it – this part of the plan follows coaching practice. Day two grows from 60% to 75% of the long run, and three camp weekends of three long days come 10, 7 and 4 weeks before the race. Injuries in stage races cluster in the lower leg (shin pain is the most common), and most medical visits are for blisters and skin problems, so kit and foot care matter too.",
   level:"Limited (expert practice)",
   refs:[["Scheer & Krabak 2021 – injuries in multi-stage ultramarathons","https://doi.org/10.3389/fphys.2021.664071"],["Krabak et al. 2011 – injury and illness in multi-day ultras","https://pubmed.ncbi.nlm.nih.gov/21552155/"]]}]},
 {h:"Strength training",items:[
  {t:"Strength twice a week",
   why:"The two running trials that cut injuries were largely in women (203 of 433, and 245 of 325 runners). Across many trials in other sports, strength training cut sports injuries to about a third, and stretching did almost nothing. In runners specifically, a hip and core programme reduced overuse injuries by around 39%, and in another trial runners who actually did their twice-weekly strength sessions were far less likely to get injured. A short, unsupervised programme didn’t help – doing enough, consistently, is what counts.",
   level:"Strong overall; moderate in runners",
   refs:[["Lauersen et al. 2014 – exercise to prevent sports injuries (meta-analysis)","https://nih.brage.unit.no/nih-xmlui/bitstream/handle/11250/279729/AndersenBJSM2014.pdf?sequence=1"],["Desai et al. 2023 – strength training and injuries in recreational runners","https://onlinelibrary.wiley.com/doi/10.1111/sms.14313"],["Leppänen et al. 2024 – hip and core programme for new runners (Run RCT)","https://jyx.jyu.fi/jyx/Record/jyx_123456789_95333"]]},
  {t:"Heavier as the plan goes on, plus jumping drills",
   why:"In mixed and mostly male studies, heavy loads (around 80% of your max or more) and plyometrics improve running economy. In the one trial in well-trained women, 11 weeks of heavy lifting made them 40% stronger but didn’t change running economy – though in a follow-up the same women ran better after a long effort. So for women the case is durability late in a long race and staying injury-free, not a faster easy pace. So weights move from 3 × 10 in Base to heavy 3 × 6 in Peak, and each session starts with jumps that progress from pogo hops to bounding and depth jumps. Impact and heavy loading are also good for bone.",
   level:"Strong for running economy",
   refs:[["Llanos-Lagos et al. 2024 – which strength methods improve running economy","https://www.fisiologiadelejercicio.com/wp-content/uploads/2024/01/Cristian-Llanos%E2%80%91Lagos-2024.pdf"]]},
  {t:"Strength on hard days, never just before the long run",
   why:"Keeping hard days hard and easy days easy is standard practice, and combining strength with endurance training doesn’t blunt strength gains, though doing both in the same session can blunt power. Ridgeline puts strength on your quality-run days and keeps it out of the 48 hours before the long run and the day after it.",
   level:"Moderate",
   refs:[]},
  {t:"Why these exercises",
   why:"Heavy calf work (including bent-knee raises for the soleus) builds the tendons that take the most load when running and climbing – heavy slow calf training is as effective as the classic eccentric protocol for Achilles problems and easier to stick with. The Copenhagen plank cut groin problems substantially in footballers, but groin injuries aren’t common in runners, so it’s a short extra. Nordic curls are mainly evidence from sprint sports and cause a lot of soreness, so they’re optional and low-dose. Single-leg, hip and core work matches the programmes that reduced injuries in runners.",
   level:"Moderate; individual exercises are rarely tested on their own",
   refs:[["Beyer et al. 2015 – heavy slow resistance vs eccentric training for the Achilles","https://www.semanticscholar.org/paper/Heavy-Slow-Resistance-Versus-Eccentric-Training-as-Beyer-Beyer/c6449600cd38d708a9affd5ae69be4846072f060"],["Harøy et al. 2019 – the Copenhagen adduction programme","https://research.regionh.dk/en/publications/the-adductor-strengthening-programme-prevents-groin-problems-amon/"]]}]},
 {h:"Your menstrual cycle",items:[
  {t:"Plans follow your symptoms, not textbook phases",
   why:"The idea of doing hard training only in certain phases is popular, but the evidence doesn’t support it: the best reviews find little or no difference in performance or strength gains between phases, and point out that many studies didn’t properly confirm which phase people were in. They recommend a personal approach instead – which is why Ridgeline uses your own pattern and check-ins to move sessions.",
   level:"Strong that phase-based plans aren’t justified",
   refs:[["McNulty et al. 2020 – exercise performance across the cycle (meta-analysis)","https://doi.org/10.1007/s40279-020-01319-3"],["Colenso-Semple et al. 2023 – cycle phase and strength training (umbrella review)","https://pmc.ncbi.nlm.nih.gov/articles/PMC10076834"],["Kissow et al. 2022 – the case for follicular-phase training","https://doi.org/10.1007/s40279-022-01679-y"]]},
  {t:"Heat in the second half of the cycle",
   why:"Core temperature is slightly higher after ovulation. One small study found women tired sooner in hot, humid conditions in that phase, while a study of well-trained women found no phase effect but a clear effect of humidity. So Ridgeline adds a hydration and pacing note rather than changing your plan.",
   level:"Limited and mixed",
   refs:[["Janse de Jonge et al. 2012 – exercise in temperate and hot, humid conditions","https://pubmed.ncbi.nlm.nih.gov/22776870/"],["Lei et al. 2017 – menstrual phase and exercise in dry vs humid heat","https://pmc.ncbi.nlm.nih.gov/articles/PMC5407968"]]},
  {t:"Iron checks",
   why:"Heavy periods are common in runners – over a third of London Marathon runners surveyed reported them – and are linked to low iron, which causes fatigue. Few had asked a doctor about it. That’s why Ridgeline suggests a ferritin blood test if you report heavy bleeding or feeling light-headed with hard exercise.",
   level:"Moderate",
   refs:[["Bruinvels et al. 2016 – heavy menstrual bleeding in athletes (PLOS ONE)","https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0149881"]]},
  {t:"Late or missed periods",
   why:"Missed periods during heavy training are a key warning sign of low energy availability (REDs), which affects bone health and injury risk. Ridgeline prompts a fuelling check when a cycle runs past 35 days and a GP visit after 90 days without a period. These prompts are switched off for hormonal contraception.",
   level:"Strong (international consensus)",
   refs:[["Mountjoy et al. 2023 – IOC consensus on REDs (BJSM)","https://doi.org/10.1136/bjsports-2023-106994"]]}]}
 ,{h:"Women training long",items:[
  {t:"Bone health checks and a gentler build for some women",
   why:"Bone stress injury is the injury that matters most for women distance runners. In 613 women at the Two Oceans events, 21% of ultra entrants had had one. Irregular or absent periods, past or present restricted eating, a late first period, low bone density and a previous stress fracture all raise the risk, and women with several of these factors were around 4–6 times more likely to get one. If your answers put you at moderate or high risk, the plan builds 5% a week instead of 8%, caps each run at 5% over your recent longest, and adds a recovery week every third week.",
   level:"Moderate (prospective and large cross-sectional studies in women)",
   refs:[["Two Oceans study – menstrual dysfunction and bone stress injury in 613 women runners","https://lida.sport-iat.de/dlv/Record/4013423?lng=en"],["Hutson et al. 2021 – menstrual disturbance and bone stress injury in 183 female runners","https://lida.sport-iat.de/ta/Record/4074012?lng=en"],["Risk factors for stress fractures in female runners","https://pmc.ncbi.nlm.nih.gov/articles/PMC7872445"]]},
  {t:"The energy check",
   why:"Not eating enough for your training (low energy availability, or REDs) is common: 44% of women at the Comrades ultra and 31–43% of women trail runners in recent surveys screened at risk, and very few knew what it was. It shows up as injuries, gut problems and changes to periods. Ridgeline’s energy check asks about those areas every 8 weeks. It’s a prompt, not the validated LEAF-Q questionnaire, which a dietitian or doctor can run.",
   level:"Strong that it matters; the app’s check is a simple screen",
   refs:[["Folscher et al. 2015 – ultramarathon runners at risk of the female athlete triad","https://pubmed.ncbi.nlm.nih.gov/26380807/"],["Henninger et al. – low energy availability in 1,899 trail runners","https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10824294/"],["Mountjoy et al. 2023 – IOC consensus on REDs","https://doi.org/10.1136/bjsports-2023-106994"]]},
  {t:"Fuelling every long run by number",
   why:"Women’s physiology suits very long efforts – more fatigue-resistant muscle fibres and more fat burning – but gut problems and low iron count against them. Practising race-rate carbohydrate on every long run trains the gut. Targets build from 30–45 g an hour in Base to 60–90 g in Peak.",
   level:"Moderate",
   refs:[["Tiller et al. 2021 – do sex differences confer a female advantage in ultra-endurance?","https://escholarship.org/content/qt5gt348gb/qt5gt348gb.pdf"],["Wohlgemuth et al. 2021 – female-specific nutrition strategies","https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8015182/"]]},
  {t:"Drink to thirst",
   why:"In the Boston Marathon study 22% of women finished with low blood sodium compared with 8% of men. Once weight gain, finishing time and body size were taken into account, sex itself wasn’t the cause: smaller runners who are out longer and drink on a schedule are. Finishing a long run heavier than you started is the warning sign.",
   level:"Strong for over-drinking as the cause",
   refs:[["Almond et al. 2005 – hyponatraemia among Boston Marathon runners (NEJM)","https://searchworks.jioinstitute.edu.in/articles/asx__106505505"]]},
  {t:"Iron checks",
   why:"A third of marathon runners in one survey reported heavy periods and a third a history of anaemia, yet only one in five had seen a doctor about it. Lower oxygen-carrying capacity is one of women’s physiological disadvantages in ultras, and it’s the one you can act on. Ridgeline reminds you to check ferritin and haemoglobin every 6 months, or every 3 with heavy periods or fatigue.",
   level:"Moderate",
   refs:[["Bruinvels et al. 2016 – heavy menstrual bleeding in athletes","https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4763330/"]]},
  {t:"Shin or bone pain pauses running",
   why:"Shin pain was linked to three times the odds of a stress fracture in a survey of women runners, and bone injuries caught early heal far faster. Two days of shin or bone pain in a fortnight pauses running until it’s checked.",
   level:"Moderate",
   refs:[["Risk factors for stress fractures in female runners","https://pmc.ncbi.nlm.nih.gov/articles/PMC7872445"]]},
  {t:"Perimenopause and menopause",
   why:"Falling oestrogen speeds up bone loss, and recovery from muscle damage may be slower without it. Heavy strength training and impact are the training tools with most support for bone in this stage, and hormone therapy is a medical decision that can help bone density in suitable women. In these modes Ridgeline raises bone risk a level, keeps heavy strength and jumps as a priority, adds an easy day after camp weekends, and turns off period-based prompts.",
   level:"Limited for training studies; strong for bone physiology",
   refs:[["Running Physio – menopause transition in runners (summarising Rothschild & Collingwood 2023)","https://www.running-physio.com/menopause-transition/"],["Enns & Tiidus 2010 – oestrogen and skeletal muscle","https://link.springer.com/article/10.2165/11319760-000000000-00000"]]},
  {t:"Heat acclimation",
   why:"Core temperature runs slightly higher after ovulation, but in trained women humidity mattered more than cycle phase. For a summer race, 10–14 days of easy running in heat before the taper is the reliable way to prepare.",
   level:"Limited for the cycle; strong for acclimation in general",
   refs:[["Lei et al. 2017 – cycle phase and exercise in dry vs humid heat","https://pmc.ncbi.nlm.nih.gov/articles/PMC5407968"]]},
  {t:"Pacing",
   why:"Across 91,929 marathon finishers women slowed less in the second half (11.7% vs 15.6%), but a 2025 reanalysis found the gap mostly among slower and younger runners. Ridgeline’s even-pacing advice is the same for everyone; on race day fuelling, drinking and feet come first.",
   level:"Strong for the pattern; its cause is debated",
   refs:[["Deaner et al. 2015 – men are more likely than women to slow in the marathon","https://pmc.ncbi.nlm.nih.gov/articles/PMC4289124"]]}]}
];
function renderScience(){
  return '<section><h1 style="font-size:2.2rem;margin-bottom:8px">The science behind your plan</h1>'+
    '<p style="margin:0 0 6px">Ridgeline is built for women training long. Here’s why it plans your training the way it does, what the research says, and how sure we can be. Summaries are in our own words – follow the links for the studies themselves.</p>'+
    '<p class="note" style="margin:0 0 8px">Most sports science has been done on men. Where female data exist, Ridgeline uses them; where they don’t, each topic says so. <a href="#science" data-sci="5">Start with “Women training long”</a>.</p>'+
    '<p class="note" style="margin:0 0 16px">Much sports research is in men, team sports or newer runners rather than female ultrarunners, so treat these as well-reasoned defaults, not guarantees. If you’re unsure about anything – especially pain, injury or your cycle – check with a sports physio or doctor.</p>'+
    '<nav class="scitoc" aria-label="Sections"><a href="#science" data-sx="1">How the science differs for women</a>'+SCIENCE.map((s,i)=>'<a href="#science" data-sci="'+i+'">'+esc(s.h)+'</a>').join("")+'</nav>'+
    sexDiffReport()+SCIENCE.map((s,i)=>'<section class="block" id="sci'+i+'"><h2>'+esc(s.h)+'</h2>'+s.items.map(it=>
      '<details class="card sci"><summary><b>'+esc(it.t)+'</b><span class="lvl">Evidence: '+esc(it.level)+'</span></summary><p>'+esc(it.why)+'</p>'+
      (it.refs.length?'<ul class="refs">'+it.refs.map(([l,u])=>'<li><a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(l)+'</a></li>').join("")+'</ul>':'<p class="note" style="margin:0">Based on standard coaching practice.</p>')+'</details>').join("")+'</section>').join("")+
    '<p class="note" style="margin-top:20px">Last reviewed November 2026.</p></section>';
}
function openMenu(){
  const it=(href,label,sub)=>'<a class="mitem" href="'+href+'"><b>'+label+'</b>'+(sub?'<span>'+sub+'</span>':'')+'</a>';
  openSheet('<div class="sh" style="background:var(--primary);position:relative"><button class="closex" data-close aria-label="Close">×</button><h2 id="sheetTitle">Ridgeline</h2></div><div class="sb mlist">'+
    it("#today","Today")+it("#plan","Plan")+it("#progress","Progress")+it("#weekly","Weekly report")+it("#report","Monthly report")+
    it("setlog/#/train","Strength log (Setlog)","Sets, weights and personal bests")+it("lua/","Period calendar (Lua)","Calendar, predictions and history")+
    it("#science","The science behind your plan","Why the plan works the way it does, with links to the research")+
    it("#setup","Setup","Goal, equipment, cycle, Garmin and backup")+
    (state.settings&&!state.pause?'<a class="mitem" href="#today" data-pauseask="1"><b>I’m ill or injured</b><span>Pause the plan; it eases you back in when you return</span></a>':'')+'</div>');
}
document.addEventListener("click",e=>{
  if(e.target.closest("#menuBtn")){openMenu();return}
  const m=e.target.closest(".mitem"); if(m){closeSheet();return}
  const sx=e.target.closest("[data-sx]"); if(sx){e.preventDefault();const t=document.getElementById("sexdiff");if(t)t.scrollIntoView({block:"start",behavior:"smooth"});return}
  const s=e.target.closest("[data-sci]"); if(s){e.preventDefault();const t=document.getElementById("sci"+s.dataset.sci);if(t)t.scrollIntoView({block:"start",behavior:"smooth"})}
});
