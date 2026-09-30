import { ChillwaveAudio, stations } from './audio-engine.js';
const $=id=>document.getElementById(id);
const audio=new ChillwaveAudio();
let playing=false,busy=false;
const playIcon='<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>';
const pauseIcon='<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM14 5h4v14h-4z"/></svg>';
async function togglePlayback(){
 if(busy)return;busy=true;$('play').disabled=true;$('error').hidden=true;
 try {
   if(playing)await audio.pause();else await audio.play();
   playing=audio.playing;renderPlayback();
 }catch(error){$('error').textContent=error.message||'Audio could not start. Please try pressing play again.';$('error').hidden=false;}
 finally{busy=false;$('play').disabled=false;}
}
function renderPlayback(){
 $('play').innerHTML=playing?pauseIcon:playIcon;$('play').setAttribute('aria-label',playing?'Pause music':'Play music');
 $('play-status').textContent=playing?'Playing':audio.ctx?'Paused':'Ready when you are';
 if('mediaSession' in navigator)navigator.mediaSession.playbackState=playing?'playing':'paused';
}
$('play').addEventListener('click',togglePlayback);
document.querySelectorAll('[data-station]').forEach(button=>button.addEventListener('click',()=>{
 const index=Number(button.dataset.station);if(audio.station!==index)audio.select(index);const station=stations[index];
 $('track-title').textContent=station.title;
 document.querySelectorAll('[data-station]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.querySelector('.station-mark').textContent=selected?'●':'○';});
 updateMetadata();$('station-picker').open=false;$('station-picker').querySelector('summary').focus();
}));
// Keep the room unobstructed when a control panel is no longer needed.
const panels=[$('station-picker'),$('mixer')];
panels.forEach(panel=>panel.addEventListener('toggle',()=>{if(panel.open)panels.forEach(other=>{if(other!==panel)other.open=false;});}));
document.addEventListener('click',event=>panels.forEach(panel=>{if(!panel.contains(event.target))panel.open=false;}));
document.addEventListener('keydown',event=>{if(event.key==='Escape')panels.forEach(panel=>{if(panel.open){panel.open=false;panel.querySelector('summary').focus();}});});
for(const kind of ['music','rain','city']){
 const input=$(kind);const update=()=>{audio.setLevel(kind,Number(input.value)/100);$(kind+'-value').textContent=input.value+'%';input.style.setProperty('--value',input.value+'%');};input.addEventListener('input',update);update();
}
function updateMetadata(){if('mediaSession' in navigator && 'MediaMetadata' in window)navigator.mediaSession.metadata=new MediaMetadata({title:stations[audio.station].title,artist:'Chillwave',album:'Back to 1981 — generative radio'});}
updateMetadata();
if('mediaSession' in navigator){navigator.mediaSession.setActionHandler('play',()=>{if(!playing)togglePlayback();});navigator.mediaSession.setActionHandler('pause',()=>{if(playing)togglePlayback();});}
function updateClock(){const now=new Date();$('clock').textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});$('clock').dateTime=now.toISOString();}
updateClock();setInterval(updateClock,1000);
document.addEventListener('keydown',event=>{if(event.code==='Space'&&!['INPUT','BUTTON','A','TEXTAREA','SELECT','SUMMARY'].includes(document.activeElement.tagName)){event.preventDefault();togglePlayback();}});
// A deliberate 640 × 360 canvas, scaled with nearest-neighbor pixels.
const canvas=$('scene'),ctx=canvas.getContext('2d',{alpha:false}),art=new Image();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let motion=!reduced.matches,loaded=false,lastFrame=0;
const drops=Array.from({length:65},()=>({x:135+Math.random()*500,y:Math.random()*285,speed:8+Math.random()*14,length:1+Math.random()*3}));
function renderScene(time){
 if(!loaded)return;
 ctx.imageSmoothingEnabled=false;ctx.drawImage(art,0,0,640,360);
 if(motion){
   const intensity=Number($('rain').value)/100;
   ctx.fillStyle=`rgba(172,190,178,${.10+intensity*.14})`;
   drops.slice(0,Math.round(drops.length*intensity)).forEach(d=>{const y=(d.y+time*.001*d.speed)%282;const x=Math.floor(d.x-y*.08);if(x>137&&!(x>163&&x<187)&&!(x>449&&x<460))ctx.fillRect(x,Math.floor(y),1,Math.ceil(d.length));});
   // A restrained pair of headlights along the distant elevated road.
   const x=210+(time*.008)%325;ctx.fillStyle='rgba(224,202,154,.65)';ctx.fillRect(Math.floor(x),218,2,1);ctx.fillRect(Math.floor(x)+4,218,2,1);
   if(playing){ctx.fillStyle=`rgba(232,162,63,${.45+Math.sin(time*.002)*.2})`;ctx.fillRect(128,255,2,1);}
 }
}
function frame(time){if(time-lastFrame>80){renderScene(time);lastFrame=time;}if(motion&&!document.hidden)requestAnimationFrame(frame);}
function updateMotion(){const b=$('motion');b.setAttribute('aria-pressed',String(motion));b.setAttribute('aria-label',motion?'Pause scene animation':'Play scene animation');b.title=motion?'Pause scene animation':'Play scene animation';b.innerHTML=motion?'<svg viewBox="0 0 20 20"><path d="M6 5v10M13 5v10"/></svg>':'<svg viewBox="0 0 20 20"><path d="m6 4 9 6-9 6z"/></svg>';if(motion)requestAnimationFrame(frame);else renderScene(0);}
$('motion').addEventListener('click',()=>{motion=!motion;updateMotion();});
reduced.addEventListener('change',event=>{motion=!event.matches;updateMotion();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&motion)requestAnimationFrame(frame);});
art.onload=()=>{loaded=true;renderScene(0);updateMotion();};
art.onerror=()=>{$('error').textContent='The room artwork could not load. Music and atmosphere are still available.';$('error').hidden=false;};
art.src='assets/apartment.png';
