// Shared settings for every page: stored in localStorage (same origin), applied on load.
(()=>{const K='projSettings',D={sound:true,bright:100,esc:true,bar:true,tips:true,accent:'#7ee0ff'};let s={...D};
try{s={...D,...JSON.parse(localStorage.getItem(K)||'{}')}}catch(e){}
const st=document.createElement('style'),save=()=>{try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}};
function apply(){document.documentElement.style.filter=s.bright==100?'':`brightness(${s.bright}%)`;
st.textContent=(s.bar?'':'#pbar{display:none!important}')+(s.tips?'':'.c::after{display:none!important}')+`.home h1{text-shadow:0 0 30px ${s.accent}!important}.home .c:hover{border-color:${s.accent}!important;box-shadow:0 8px 30px ${s.accent}33!important}`}
document.documentElement.append(st);apply();
// Stop the white flash when over-scrolling: no bounce, and the page behind the content matches each page's own background colour
const bg=document.createElement('style');bg.textContent='html,body{overscroll-behavior:none}';document.documentElement.append(bg);
addEventListener('DOMContentLoaded',()=>{const b=getComputedStyle(document.body).backgroundColor;document.documentElement.style.backgroundColor=b&&b!='rgba(0, 0, 0, 0)'?b:'#0a0d16'});
// Mute by making every oscillator / buffer source silent (start/stop become no-ops while sound is off)
const A=window.AudioScheduledSourceNode&&AudioScheduledSourceNode.prototype;
if(A){const o=A.start,p=A.stop;A.start=function(...a){if(s.sound)return o.apply(this,a)};A.stop=function(...a){try{return p.apply(this,a)}catch(e){}}}
addEventListener('keydown',e=>{if(e.key=='Escape'&&s.esc&&!document.documentElement.classList.contains('home'))location.href='../'});
window.PS={get:()=>s,set(k,v){s[k]=v;save();apply()},reset(){s={...D};save();apply()}};
})();
