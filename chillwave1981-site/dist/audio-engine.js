// Portable Web Audio engine. No stream, remote service, or framework required.
export const stations = [
  { title: 'Night windows', description: 'Warm synths. Nowhere to be.', bpm: 72, frequency: '81.1', roots: [45, 41, 48, 43], chords: [[0,7,10,14],[0,7,11,14],[0,7,11,16],[0,7,10,14]], cutoff: 900 },
  { title: 'The last train', description: 'One more stop. One less thought.', bpm: 66, frequency: '87.6', roots: [38, 46, 41, 43], chords: [[0,7,10,14],[0,7,11,14],[0,7,10,14],[0,7,10,17]], cutoff: 680 },
  { title: 'Almost morning', description: 'A softer kind of tomorrow.', bpm: 60, frequency: '94.3', roots: [48, 45, 41, 43], chords: [[0,7,11,14],[0,7,10,14],[0,7,11,16],[0,7,10,14]], cutoff: 1200 }
];
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
export class ChillwaveAudio {
  constructor() { this.station = 0; this.levels = { music: .65, rain: .35, city: .15 }; this.playing = false; this.groups = new Set(); }
  async init() {
    if (this.ctx) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('This browser does not support Web Audio. Try a current version of Safari, Chrome, or Firefox.');
    const c = this.ctx = new Audio();
    const compressor = c.createDynamicsCompressor();
    compressor.threshold.value = -15; compressor.knee.value = 20; compressor.ratio.value = 3;
    this.master = c.createGain(); this.master.gain.value = .72;
    this.master.connect(compressor).connect(c.destination);
    this.music = c.createGain(); this.music.gain.value = this.levels.music;
    this.music.connect(this.master);
    // Shared room impulse gives dry synths space without a remote audio asset.
    this.reverb = c.createConvolver();
    const impulse = c.createBuffer(2, c.sampleRate * 3.6, c.sampleRate);
    for (let ch=0; ch<2; ch++) { const d=impulse.getChannelData(ch); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3.3)*.32; }
    this.reverb.buffer=impulse;
    const wet=c.createGain();wet.gain.value=.35;this.reverb.connect(wet).connect(this.music);
    this.noise = c.createBuffer(1,c.sampleRate*8,c.sampleRate);
    const data=this.noise.getChannelData(0);let last=0;
    for(let i=0;i<data.length;i++) {const white=Math.random()*2-1; last=(last+.025*white)/1.025;data[i]=last*5;}
    this.rain = this.createAmbience('rain'); this.city = this.createAmbience('city');
    this.newGroup();
    this.timer = setInterval(()=>{ if (this.playing && c.state === 'running') this.schedule(); },10000);
  }
  createAmbience(kind) {
    const c=this.ctx, src=c.createBufferSource();src.buffer=this.noise;src.loop=true;
    const filter=c.createBiquadFilter();filter.type=kind==='rain'?'highpass':'lowpass';filter.frequency.value=kind==='rain'?420:180;filter.Q.value=.5;
    const gain=c.createGain();gain.gain.value=this.levels[kind]*(kind==='rain'?.48:.65);
    src.connect(filter).connect(gain).connect(this.master);src.start();
    if(kind==='city') {const sway=c.createOscillator(),depth=c.createGain();sway.frequency.value=.037;depth.gain.value=55;sway.connect(depth).connect(filter.frequency);sway.start();}
    return gain;
  }
  newGroup() {
    const c=this.ctx;
    if(this.group) {
      const old=this.group;
      old.bus.gain.cancelScheduledValues(c.currentTime);old.bus.gain.setTargetAtTime(0,c.currentTime,.25);
      setTimeout(()=>{old.nodes.forEach(n=>{try{n.stop();}catch{}});old.bus.disconnect();this.groups.delete(old);},1800);
    }
    const bus=c.createGain();bus.gain.setValueAtTime(0,c.currentTime);bus.gain.linearRampToValueAtTime(1,c.currentTime+1.5);bus.connect(this.music);bus.connect(this.reverb);
    this.group={bus,nodes:new Set()};this.groups.add(this.group);this.bar=0;this.nextBar=c.currentTime+.08;
  }
  track(node,group=this.group) {group.nodes.add(node);node.onended=()=>{group.nodes.delete(node);node.disconnect();};return node;}
  voice(midi,time,length,{volume=.07,type='triangle',cutoff=900,pan=0,attack=.8,release=1.6,detune=0}={}) {
    const c=this.ctx,osc=this.track(c.createOscillator()),gain=c.createGain(),filter=c.createBiquadFilter(),panner=c.createStereoPanner();
    osc.type=type;osc.frequency.value=hz(midi);osc.detune.value=detune;
    filter.type='lowpass';filter.frequency.value=cutoff;filter.Q.value=.3;panner.pan.value=pan;
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+attack);
    gain.gain.setValueAtTime(volume*.8,time+Math.max(attack,length));gain.gain.exponentialRampToValueAtTime(.0001,time+length+release);
    osc.connect(filter).connect(gain).connect(panner).connect(this.group.bus);osc.start(time);osc.stop(time+length+release+.05);
  }
  kick(time,volume=.12) {
    const c=this.ctx,o=this.track(c.createOscillator()),g=c.createGain();o.frequency.setValueAtTime(95,time);o.frequency.exponentialRampToValueAtTime(39,time+.13);g.gain.setValueAtTime(volume,time);g.gain.exponentialRampToValueAtTime(.0001,time+.42);o.connect(g).connect(this.group.bus);o.start(time);o.stop(time+.45);
  }
  brush(time,volume=.06) {
    const c=this.ctx,s=this.track(c.createBufferSource()),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type='highpass';f.frequency.value=3300;g.gain.setValueAtTime(volume,time);g.gain.exponentialRampToValueAtTime(.0001,time+.18);s.connect(f).connect(g).connect(this.group.bus);s.start(time,(time*1.71)%6);s.stop(time+.2);
  }
  schedule() {
    const c=this.ctx,station=stations[this.station],beat=60/station.bpm,barLength=beat*4;
    // Schedule beyond background-tab timer throttling; Web Audio owns playback timing.
    if (this.nextBar<c.currentTime) this.nextBar=c.currentTime+.08;
    while(this.nextBar<c.currentTime+90) {
      const bar=this.bar,t=this.nextBar,idx=Math.floor(bar/2)%4,root=station.roots[idx],chord=station.chords[idx];
      if(bar%2===0) chord.forEach((note,i)=>{
        this.voice(root+12+note,t,barLength*2-.3,{volume:.043,type:'sawtooth',cutoff:station.cutoff,pan:(i-1.5)*.34,detune:-5,attack:1.2,release:2.7});
        this.voice(root+12+note,t+.012,barLength*2-.3,{volume:.03,type:'triangle',cutoff:station.cutoff,pan:(1.5-i)*.3,detune:6,attack:1.4,release:2.7});
      });
      for(let b=0;b<4;b++) {
        this.voice(root+(b===3?7:0),t+b*beat,beat*.65,{volume:.105,type:'sine',cutoff:270,attack:.03,release:.2});
        if(this.station!==2 || b%2===0) this.kick(t+b*beat,b%2===0?.1:.045);
        if(b%2===1)this.brush(t+b*beat,.16);
        this.brush(t+(b+.5)*beat,.045);
      }
      // Sparse, harmonically grounded melody with a slowly changing pattern.
      const note=chord[(bar*3+Math.floor(bar/8))%chord.length];
      this.voice(root+24+note,t+beat*1.5,beat*.6,{volume:.048,pan:Math.sin(bar)*.5,cutoff:1800,attack:.015,release:2.8});
      if(bar%3===2)this.voice(root+24+chord[(bar+1)%4],t+beat*3.5,beat*.5,{volume:.034,pan:-.35,cutoff:1700,attack:.025,release:3});
      this.bar++;this.nextBar+=barLength;
    }
  }
  async play() {await this.init();await this.ctx.resume();this.playing=true;this.schedule();}
  async pause() {if(!this.ctx)return;await this.ctx.suspend();this.playing=false;}
  select(index) {this.station=index;if(this.ctx){this.newGroup();if(this.playing)this.schedule();}}
  setLevel(kind,value) {this.levels[kind]=value;if(this.ctx){const scale=kind==='rain'?.48:kind==='city'?.65:1;this[kind].gain.setTargetAtTime(value*scale,this.ctx.currentTime,.08);}}
  get elapsed() {return this.ctx?Math.max(0,Math.floor(this.ctx.currentTime)):0;}
  async dispose() {clearInterval(this.timer);if(this.ctx)await this.ctx.close();}
}
