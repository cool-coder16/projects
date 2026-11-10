// Shared account + score sync. Loaded on every page. Firebase is only downloaded when someone is logged in
// (or on the account page), so anonymous play stays light.
(()=>{
// Firebase web config: these values are public identifiers, not secrets. Access is protected by Auth + Firestore security rules.
const CFG={apiKey:"AIzaSyBTrFYe2V_4sXwbEqsQmytEBHwwR8D--8k",authDomain:"mini-projects-hub-92435.firebaseapp.com",projectId:"mini-projects-hub-92435",storageBucket:"mini-projects-hub-92435.firebasestorage.app",messagingSenderId:"654422416543",appId:"1:654422416543:web:709ed0860c614d081296aa"};
const SK='hubScores',UK='hubUser',FK='hubFavs',FT='hubFavsAt',RK='hubRecent',PK='hubPlays',V='10.12.2';
const rd=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
// Catalog of every game that reports a score: [id, folder, name, unit, lowerIsBetter]
const GAMES={},LIST=[];[['ballrun','ballrun','Ball Run','m'],['snake','snake','Neon Snake','pts'],['typing','typing','Keyflow','WPM'],['cubedash','cubedash','Cube Dash','m'],['blockfall','blockfall','Blockfall','pts'],['breakout','breakout','Brick Breaker','pts'],['beattiles','beattiles','Beat Tiles','pts'],['blaster','blaster','Star Blaster','pts'],['stack','stack','Stack','blocks'],['2048','2048','2048','pts'],['neondrive','neondrive','Neon Drive','pts'],['geoquiz','geoquiz','Geo Quiz','/10'],['reflex','reflex','Reflex','ms',1],['echo','echo','Echo','level'],['pairs','pairs','Pairs','moves',1],['minefield','minefield','Minefield','sec',1],['maze','maze','Lantern Maze','level'],['slingshot','orbit','Slingshot','pts'],['laser','laser','Laser Lab','pts'],['wordfive','wordfive','Word Five','guesses',1],
['flappy','flappy','Flappy Rocket','pipes'],['skyhop','skyhop','Sky Hop','m'],['aim','aim','Aim Trainer','pts'],['mathsprint','mathsprint','Math Sprint','pts'],['nummem','nummem','Number Memory','level'],['fruit','fruit','Fruit Slice','pts'],['stroop','stroop','Stroop Rush','pts'],['wordrain','wordrain','Word Rain','pts'],['keepy','keepy','Keepy Up','kicks'],['darts','darts','Dart Spinner','darts'],['chicken','chickenfarm','Chicken Farm','pts'],['chickenjump','chickenjump','Chicken Jump','pts'],['tapspeed','tapspeed','Tap Speed','taps'],['higherlower','higherlower','Higher or Lower','streak'],['arrowrush','arrowrush','Arrow Rush','pts'],['bubblepop','bubblepop','Bubble Pop','pts'],['lanedodge','lanedodge','Lane Dodge','pts'],['wallbounce','wallbounce','Wall Bounce','bounces'],['stopzone','stopzone','Stop Zone','streak'],['litgrid','litgrid','Lit Grid','hits'],['balloon','balloon','Balloon Pump','pts'],['orbitdodge','orbitdodge','Orbit Dodge','pts'],['whackbot','whackbot','Whack-a-Bot','pts'],['quickcount','quickcount','Quick Count','correct'],['ropeskip','ropeskip','Rope Skip','skips'],['basketcatch','basketcatch','Basket Catch','pts'],['slide8','slide8','Slide 8','moves',1],['oddone','oddone','Odd One Out','pts'],['sortrush','sortrush','Sort Rush','pts'],['lander','lander','Moon Lander','landings']].forEach(([id,dir,name,unit,low])=>{GAMES[id]={id,dir,name,unit,low:!!low};LIST.push(GAMES[id])});
let fb;
// Load the Firebase SDK on demand (compat build, plain <script> tags — no bundler needed)
function load(){return fb||(fb=(async()=>{const ld=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.append(s)});
 for(const f of['app','auth','firestore'])await ld(`https://www.gstatic.com/firebasejs/${V}/firebase-${f}-compat.js`);
 firebase.initializeApp(CFG);return{auth:firebase.auth(),db:firebase.firestore()}})())}
const better=(a,b,low)=>b==null?a:a==null?b:(low?Math.min(a,b):Math.max(a,b));
// Merge local bests with the cloud copy (best of each game wins) and save both ways
async function sync(){const{auth,db}=await load();await new Promise(r=>{const u=auth.onAuthStateChanged(()=>{u();r()})});const u=auth.currentUser;if(!u)return null;
 const ref=db.collection('scores').doc(u.uid),snap=await ref.get(),cloud=snap.exists?(snap.data().games||{}):{},loc=rd(SK)||{},merged={};
 for(const g of new Set([...Object.keys(cloud),...Object.keys(loc)])){const c=cloud[g],l=loc[g],low=!!((c||l).low);merged[g]={v:better(c&&c.v,l&&l.v,low),low}}
 // Publish changed bests to the public leaderboard (one small doc per player per game)
 const first=!rd('hubLbSynced'),bt=db.batch();let n=0;for(const g in merged){if(first||!cloud[g]||cloud[g].v!==merged[g].v){bt.set(db.collection('leaderboard').doc(g).collection('entries').doc(u.uid),{username:u.displayName||'',score:merged[g].v,updated:Date.now()});n++}}if(n)await bt.commit();wr('hubLbSynced',1);
 // Favourites: whichever side changed most recently wins, so un-starring on one device sticks everywhere
 const dat=snap.exists?snap.data():{},cf=dat.favs||[],ct=dat.favsAt||0,lf=rd(FK)||[],lt=rd(FT)||0;let fav={};
 if(ct>lt){wr(FK,cf);wr(FT,ct)}else if(lt>ct)fav={favs:lf,favsAt:lt};
 wr(SK,merged);await ref.set({username:u.displayName||'',games:merged,updated:Date.now(),...fav},{merge:true});window.dispatchEvent(new Event('hubsync'));return merged}

// ---- favourites, recently played, play counts (all local; favourites also sync to the account)
const SPECIAL=['account','leaderboard','settings','changelog','projects',''];
const favs=()=>rd(FK)||[];
function toggleFav(d){let f=favs();f=f.includes(d)?f.filter(x=>x!=d):[d,...f];wr(FK,f);wr(FT,Date.now());window.dispatchEvent(new Event('hubfavs'));if(rd(UK))sync().catch(()=>{});return f.includes(d)}
(function track(){const seg=location.pathname.split('/').filter(Boolean).filter(p=>!/\.html?$/.test(p)),d=seg[seg.length-1]||'';if(SPECIAL.includes(d))return;
 const r=(rd(RK)||[]).filter(x=>x!=d);r.unshift(d);wr(RK,r.slice(0,12));const p=rd(PK)||{};p[d]=(p[d]||0)+1;wr(PK,p)})();
// ---- celebration toast + confetti when a personal best is saved
const css=document.createElement('style');css.textContent='#hubT{position:fixed;left:50%;bottom:22px;transform:translate(-50%,30px);opacity:0;z-index:100000;background:#0b1220ee;color:#fff;border:1px solid #7ee0ff77;border-radius:16px;padding:12px 18px;font:600 15px system-ui;text-align:center;box-shadow:0 10px 40px #000a;backdrop-filter:blur(8px);transition:.35s;max-width:90vw}#hubT.on{opacity:1;transform:translate(-50%,0)}#hubT small{display:block;font-weight:400;opacity:.75;margin-top:3px;font-size:13px}#hubT a{color:#7ee0ff}';document.head.append(css);
function toast(t,sub){let e=document.getElementById('hubT');if(!e){e=document.createElement('div');e.id='hubT';document.body.append(e)}e.innerHTML=t+(sub?'<small>'+sub+'</small>':'');e.className='on';clearTimeout(toast.t);toast.t=setTimeout(()=>e.className='',5200)}
function confetti(){const c=document.createElement('canvas');c.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;aspect-ratio:auto!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:none!important;margin:0!important;pointer-events:none!important;z-index:99999!important';c.width=innerWidth;c.height=innerHeight;document.body.append(c);const x=c.getContext('2d'),P=Array.from({length:90},()=>({x:innerWidth/2,y:innerHeight*.7,vx:(Math.random()-.5)*14,vy:-Math.random()*16-4,h:Math.random()*360,r:Math.random()*6+3,l:1}));
 (function f(){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.45;p.l-=.012;x.fillStyle=`hsla(${p.h},90%,60%,${Math.max(0,p.l)})`;x.fillRect(p.x,p.y,p.r,p.r*.6)});if(P[0].l>0)requestAnimationFrame(f);else c.remove()})()}
let nt;function notify(game,nv,had){clearTimeout(nt);nt=setTimeout(()=>{const g=GAMES[game];if(!g)return;const on=!(window.PS&&PS.get().celebrate===false),u=rd(UK);
 if(!on)return;toast(had?'🏆 New personal best!':'🎉 First score saved!',`${g.name}: ${nv} ${g.unit} · `+(u?'saved to your account':'<a href="../account/">log in</a> to post it to the leaderboard'));if(had)confetti()},1300)}
window.Hub={load,sync,rd,wr,GAMES,LIST,favs,toggleFav,toast,recent:()=>rd(RK)||[],plays:()=>rd(PK)||{},
 // Games call Hub.score('gameId', value, lowerIsBetter?) — saved locally always, and to the account when logged in
 score(game,v,low){if(typeof v!='number'||!isFinite(v))return;const s=rd(SK)||{},cur=s[game],nv=better(cur&&cur.v,v,low);
  if(!cur||nv!==cur.v){s[game]={v:nv,low:!!low};wr(SK,s);notify(game,nv,!!cur);if(rd(UK))sync().catch(()=>{})}}};
// Top-bar / home-page account label ("Log in" or "👤 name"); the account page calls Hub.badge() after login/logout
function badge(){const u=rd(UK),label=u?'👤 '+u.username:'Log in';document.querySelectorAll('#acc,#hubacc').forEach(e=>e.textContent=label)}
window.Hub.badge=badge;
addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('pbar');if(b&&!document.getElementById('acc')){const a=document.createElement('a');a.id='hubacc';a.href='../account/';b.insertBefore(a,b.lastElementChild)}badge()});
})();
