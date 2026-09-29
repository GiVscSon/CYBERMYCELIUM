// Failure injection at browser boundaries: storage and image loading.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),code=fs.readFileSync(path.join(root,'game.js'),'utf8');
const SAVE='cybermycelium-adventure-v1',SETTINGS='cybermycelium-settings-v1';
async function boot(options={}){
  class Element{
    constructor(){this.textContent='';this.handlers={};this.children=[];this.style={};this.classList={set:new Set(),add(x){this.set.add(x)},remove(x){this.set.delete(x)},contains(x){return this.set.has(x)},toggle(x,v){if(v===undefined)v=!this.set.has(x);v?this.set.add(x):this.set.delete(x)}}}
    addEventListener(n,fn){this.handlers[n]=fn}click(){if(!this.disabled)this.handlers.click?.({})}focus(){}setAttribute(){}replaceChildren(){this.children=[]}append(...items){this.children.push(...items)}
    querySelector(s){return s==='.map-status'?this.children.find(x=>x.className==='map-status'):null}
    getBoundingClientRect(){return {left:0,top:0,width:1600,height:900}}
  }
  const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
  const ctx=new Proxy({}, {get:(o,k)=>o[k]||(k==='measureText'?(s=>({width:s.length*10})):(()=>{})),set(o,k,v){o[k]=v;return true}});
  nodes.scene.getContext=nodes.detail.getContext=()=>ctx;
  const tabs=['contour','protocols','echo'].map(pulseTab=>Object.assign(new Element(),{dataset:{pulseTab}}));
  const maps=['ash','atrium','interface','memory','seam','carrier','b0','b1','c0','c1','r','center'].map(scene=>Object.assign(new Element(),{dataset:{scene}}));
  const store={...options.store},state={writeFails:false,readFails:false,missing:false,stall:false,...options},timers=new Map();
  let raf,time=0,timerId=0;const attempts=[];
  const sandbox={document:{body:new Element(),querySelector:s=>s.startsWith('[data-pulse-tab')?tabs[0]:nodes[s.slice(1)],querySelectorAll:s=>s==='.map-node'?maps:s==='[data-pulse-tab]'?tabs:[],createElement:()=>new Element()},window:{addEventListener(){},matchMedia:()=>({matches:!!options.reduced})},localStorage:{getItem:k=>{if(state.readFails){const e=new Error('blocked');e.name='SecurityError';throw e}return store[k]},setItem:(k,v)=>{if(state.writeFails)throw new Error('quota');store[k]=v}},Image:class{set src(v){attempts.push(v);if(state.stall&&v.includes('ash-terraces'))return;this.complete=true;this.naturalWidth=state.missing&&v.includes('ash-terraces')?0:1600;if(this.naturalWidth)this.onload?.();else this.onerror?.()}},requestAnimationFrame:f=>raf=f,setTimeout:f=>{timers.set(++timerId,f);return timerId},clearTimeout:id=>timers.delete(id),Math,Promise,console};
  vm.runInNewContext(code,sandbox,{filename:'game.js'});
  const tick=async(n=1)=>{await Promise.resolve();for(let i=0;i<n;i++){time+=40;raf?.(time)}};
  const walk=async(x,y)=>{nodes.scene.handlers.pointerdown({clientX:x,clientY:y});await tick(230)};
  await tick();return {nodes,state,store,timers,attempts,tick,walk,tabs,save:()=>JSON.parse(store[SAVE])};
}
(async()=>{
  for(const raw of ['null','[]','"text"','false','0','{broken']){
    const g=await boot({store:{[SAVE]:raw}});
    assert(g.nodes.menu.classList.contains('show'),`recover from ${raw}`);
    assert.match(g.nodes['menu-save-status'].textContent,/повреждено/);
    assert.match(g.nodes.place.textContent,/ПЕПЕЛЬНЫЕ ТЕРРАСЫ/);
    assert.equal(g.store[SAVE],raw,'no overwrite merely from loading');
    g.nodes['retry-save'].click();assert.equal(g.save().scene,'ash');assert(g.nodes['save-warning'].hidden);
  }
  const invalid=await boot({store:{[SAVE]:JSON.stringify({scene:42,ashSignal:'false',character:{stats:{strength:99}}}),[SETTINGS]:JSON.stringify({speed:'warp',text:'huge',hotspots:'false',reduced:'yes'})}});
  invalid.nodes['retry-save'].click();assert.equal(invalid.save().ashSignal,false);assert.equal(invalid.save().scene,'ash');assert.equal(invalid.save().character.stats.strength,1);
  assert.deepEqual(JSON.parse(invalid.store[SETTINGS]),{speed:'normal',text:'normal',hotspots:false,reduced:false});
  const blocked=await boot({readFails:true,writeFails:true});assert(blocked.nodes.menu.classList.contains('show'));
  blocked.nodes['retry-save'].click();assert.match(blocked.nodes['menu-save-status'].textContent,/Прогресс не сохранён/);assert.equal(blocked.nodes['save-warning'].hidden,false);
  blocked.state.writeFails=false;blocked.nodes['retry-save'].click();assert.equal(blocked.save().scene,'ash');assert(blocked.nodes['save-warning'].hidden);
  const methods={adapterMethod:'расчёт фаз',sampleMethod:'чтение без отбора',sporeMethod:'долгий контакт',relayMethod:'точная настройка',lastPulse:'A2 · Склеп памяти — сигнал'};
  const loaded=await boot({store:{[SAVE]:JSON.stringify({scene:'memory',ashSignal:true,specimen:true,...methods})}});
  loaded.nodes.continue.click();await loaded.walk(245,375);assert.match(loaded.nodes['modal-body'].textContent,/чтение без отбора/);loaded.nodes.close.click();
  await loaded.walk(1270,480);assert.equal(loaded.nodes['pulse-last'].textContent,'Последнее изменение: '+methods.lastPulse);loaded.nodes['pulse-close'].click();
  loaded.nodes['retry-save'].click();for(const [key,value] of Object.entries(methods))assert.equal(loaded.save()[key],value);
  loaded.nodes['menu-button'].click();loaded.nodes['new-game'].click();loaded.nodes['modal-choices'].children.find(el=>el.textContent==='СБРОСИТЬ ПРОХОЖДЕНИЕ').click();
  for(const key of Object.keys(methods))assert.equal(loaded.save()[key],null,`reset ${key}`);
  for(const failure of ['missing','stall']){
    const g=await boot({[failure]:true});
    if(failure==='stall'){assert.equal(g.timers.size,1);for(const fn of [...g.timers.values()])fn();await g.tick()}
    assert(!g.nodes.menu.classList.contains('show'),'unloaded world cannot be played');
    assert.equal(g.nodes['load-retry'].hidden,false);assert.equal(g.store[SAVE],undefined);
    g.state[failure]=false;g.nodes['load-retry'].click();await g.tick();
    assert(g.nodes.menu.classList.contains('show'));assert(g.nodes.loading.classList.contains('hidden'));
    assert.equal(g.attempts.length,14,'retry only the failed image');assert.equal(g.timers.size,0);
  }
  const reduced=await boot({reduced:true});assert.equal(reduced.nodes['reduced-motion'].checked,true);
  console.log('PASS: malformed saves, strict fields, blocked storage and retry, method persistence/reset, missing and stalled images/retry, system reduced motion');
})().catch(error=>{console.error(error);process.exitCode=1});
