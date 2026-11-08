// Shared account + score sync. Loaded on every page. Firebase is only downloaded when someone is logged in
// (or on the account page), so anonymous play stays light.
(()=>{
// Firebase web config: these values are public identifiers, not secrets. Access is protected by Auth + Firestore security rules.
const CFG={apiKey:"AIzaSyBTrFYe2V_4sXwbEqsQmytEBHwwR8D--8k",authDomain:"mini-projects-hub-92435.firebaseapp.com",projectId:"mini-projects-hub-92435",storageBucket:"mini-projects-hub-92435.firebasestorage.app",messagingSenderId:"654422416543",appId:"1:654422416543:web:709ed0860c614d081296aa"};
const SK='hubScores',UK='hubUser',V='10.12.2';
const rd=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
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
 wr(SK,merged);await ref.set({username:u.displayName||'',games:merged,updated:Date.now()},{merge:true});return merged}
window.Hub={load,sync,rd,wr,
 // Games call Hub.score('gameId', value, lowerIsBetter?) — saved locally always, and to the account when logged in
 score(game,v,low){if(typeof v!='number'||!isFinite(v))return;const s=rd(SK)||{},cur=s[game],nv=better(cur&&cur.v,v,low);
  if(!cur||nv!==cur.v){s[game]={v:nv,low:!!low};wr(SK,s);if(rd(UK))sync().catch(()=>{})}}};
// Top-bar / home-page account label ("Log in" or "👤 name"); the account page calls Hub.badge() after login/logout
function badge(){const u=rd(UK),label=u?'👤 '+u.username:'Log in';document.querySelectorAll('#acc,#hubacc').forEach(e=>e.textContent=label)}
window.Hub.badge=badge;
addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('pbar');if(b&&!document.getElementById('acc')){const a=document.createElement('a');a.id='hubacc';a.href='../account/';b.insertBefore(a,b.lastElementChild)}badge()});
})();
