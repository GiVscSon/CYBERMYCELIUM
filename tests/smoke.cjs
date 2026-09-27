const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
for (const id of ['scene','loading','place','objective','prompt','modal','modal-tag','modal-title','modal-body','modal-choices','vision','journal','close']) assert.match(html, new RegExp(`id="${id}"`));
for (const file of ['atrium.webp','memory.webp']) {const data=fs.readFileSync(path.join(root,'assets',file));assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP')}
class Element {constructor(){this.textContent='';this.handlers={};this.children=[];this.style={};this.classList={set:new Set(),add(x){this.set.add(x)},remove(x){this.set.delete(x)},contains(x){return this.set.has(x)},toggle(x,v){if(v===undefined)v=!this.set.has(x);v?this.set.add(x):this.set.delete(x)}}}addEventListener(n,fn){this.handlers[n]=fn}click(){this.handlers.click?.({})}focus(){}replaceChildren(){this.children=[]}append(x){this.children.push(x)}getBoundingClientRect(){return {left:0,top:0,width:1600,height:900}}}
const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const noop=()=>{};const ctx=new Proxy({}, {get(target,key){if(key==='measureText')return s=>({width:s.length*10});return target[key]||noop},set(target,key,val){target[key]=val;return true}});
nodes.scene.getContext=()=>ctx;
let raf=null, clock=0;const store={};
const sandbox={document:{querySelector:s=>nodes[s.slice(1)],createElement:()=>new Element()},window:{addEventListener:noop},localStorage:{getItem:k=>store[k],setItem:(k,v)=>store[k]=v},Image:class{set src(v){this.complete=true;this.naturalWidth=1600;this.onload?.()}},requestAnimationFrame:f=>{raf=f},Math,Promise,console};
vm.runInNewContext(js,sandbox,{filename:'game.js'});
const tick=async(n=1)=>{await Promise.resolve();for(let i=0;i<n;i++){clock+=40;raf?.(clock)}};
const at=(x,y)=>nodes.scene.handlers.pointerdown({clientX:x,clientY:y});
const walk=async(x,y)=>{at(x,y);await tick(230)};
const close=()=>nodes.close.click();
(async()=>{
 await tick();assert.equal(nodes['modal-title'].textContent,'Нулевой узел');close();
 await walk(225,500);assert.equal(nodes['modal-title'].textContent,'Фрагмент 01');assert.equal(JSON.parse(store['cybermycelium-adventure-v1']).memory,true);close();
 await walk(1200,600);assert.equal(nodes['modal-title'].textContent,'Восстановление маршрута');
 for(const label of ['ТКАНЬ','МЕДЬ','ПАМЯТЬ']){const button=nodes['modal-choices'].children.find(x=>x.textContent===label);button.click()}
 assert.equal(JSON.parse(store['cybermycelium-adventure-v1']).relay,true);close();
 await walk(1500,500);assert.match(nodes.place.textContent,/КАМЕРА ПАМЯТИ/);
 await walk(250,400);assert.equal(JSON.parse(store['cybermycelium-adventure-v1']).specimen,true);close();
 await walk(1200,480);assert.equal(JSON.parse(store['cybermycelium-adventure-v1']).signal,true);close();
 await walk(800,400);assert.equal(nodes['modal-title'].textContent,'Внешний ответ');assert.equal(JSON.parse(store['cybermycelium-adventure-v1']).node,true);close();
 nodes.vision.click();assert(nodes.vision.classList.contains('active'));
 console.log('PASS: assets, DOM, movement, puzzle, both scenes, completion, save and network vision');
})().catch(e=>{console.error(e);process.exitCode=1});
