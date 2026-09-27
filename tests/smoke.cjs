const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function audit(width,height,brokenStorage=false){
 const handlers={},buttons={},raf=[],stats={frames:0,images:0,finalLines:[],minX:Infinity,maxX:0},saved={};
 const canvas={width:0,height:0,getContext:()=>ctx};
 const ctx={fillStyle:'',strokeStyle:'',font:'',globalAlpha:1,beginPath(){},ellipse(){},fill(){},moveTo(){},lineTo(){},stroke(){},fillRect(){},strokeRect(){},setTransform(){},drawImage(im,sx,sy,sw,sh){if(!(sw>0&&sh>0&&sx>=0&&sx+sw<=im.width+1))throw Error('crop outside image');stats.images++},fillText(line,x,y){if(line.includes('УЗЕЛ')||line.includes('ОТВЕТ')){stats.finalLines.push(line);let n=parseInt(this.font);if(x<0||x+line.length*n*.6>width+2)throw Error('final text clipped')}},createLinearGradient(){return{addColorStop(){}}}};
 for(const key of ['left','right','jump','vision','interact'])buttons[key]={dataset:{key},setPointerCapture(){},addEventListener(name,fn){this[name]=fn}};
 const message={textContent:''};const document={querySelector:q=>q==='#game'?canvas:message,querySelectorAll:()=>Object.values(buttons)};
 const storage={getItem:k=>{if(brokenStorage)throw Error('storage denied');return saved[k]},setItem:(k,v)=>{if(brokenStorage)throw Error('storage denied');saved[k]=v}};
 const env={document,innerWidth:width,innerHeight:height,devicePixelRatio:2,Image:class{constructor(){this.complete=true;this.naturalWidth=1400;this.width=1400;this.height=514}},localStorage:storage,performance:{now:()=>0},addEventListener:(e,f)=>handlers[e]=f,requestAnimationFrame:f=>raf.push(f),Math,Number};vm.createContext(env);vm.runInContext(source,env);
 function value(s){return vm.runInContext(s,env)}
 function step(i){let f=raf.shift();if(!f)throw Error('loop ended');f(i*16);stats.frames++;let x=value('player.x');stats.minX=Math.min(stats.minX,x);stats.maxX=Math.max(stats.maxX,x)}
 function key(k,on){handlers[on?'keydown':'keyup']({key:k,preventDefault(){}})}
 for(let i=1;i<13;i++)step(i);
 if(stats.images!==12)throw Error('background not drawn every frame');
 key('e',true);step(13);key('e',false);if(value('active'))throw Error('remote terminal activation');
 key('ArrowRight',true);
 for(let i=14;i<430;i++){let x=value('player.x');key(' ',(x>635&&x<650)||(x>1080&&x<1095));step(i)}
 key('ArrowRight',false);key(' ',false);
 if(value('player.x')<1500)throw Error('path cannot be completed');
 key('v',true);step(430);key('v',false);if(value('vision')<=0)throw Error('network vision did not engage');
 // Resume at the terminal to isolate interaction from the timing of the traversal.
 vm.runInContext('player.x=terminal;player.y=H*.78',env);buttons.interact.pointerdown({preventDefault(){},pointerId:1});step(431);buttons.interact.pointerup();
 if(!value('active')||(!brokenStorage&&saved['cybermycelium-node0']!=='1'))throw Error('terminal/save failed');
 if(!stats.finalLines.length)throw Error('ending not drawn');
 if(raf.length!==1)throw Error('animation callback leak');
 key(' ',true);vm.runInContext('player.y=H*.78;player.ground=true;player.vy=0',env);step(432);
 if(value('player.vy')>=0)throw Error('jump did not start');
 vm.runInContext('player.y=H*.78;player.ground=true;player.vy=0',env);step(433);
 if(value('player.vy')<0)throw Error('held jump triggered again');key(' ',false);
 buttons.right.pointerdown({preventDefault(){},pointerId:2});let before=value('player.x');step(434);buttons.right.pointerup();if(value('player.x')<=before)throw Error('touch movement failed');
 vm.runInContext('player.y=H*.78;player.ground=true;player.vy=0',env);buttons.jump.pointerdown({preventDefault(){},pointerId:3});step(435);buttons.jump.pointerup();if(value('player.vy')>=0)throw Error('touch jump failed');
 vm.runInContext('player.x=700;player.y=H+125;player.vy=0',env);step(436);if(value('player.x')!==85)throw Error('fall recovery failed');
 return {viewport:`${width}x${height}`,frames:stats.frames,images:stats.images,x:Math.round(stats.maxX),vision:+value('vision').toFixed(2),endingLines:[...new Set(stats.finalLines)],storage:brokenStorage?'denied but playable':saved['cybermycelium-node0']};
}
for(const [w,h,b] of [[1280,720,false],[360,740,false],[320,568,false],[360,740,true]])console.log(JSON.stringify(audit(w,h,b)));
function checkRestore(){let queue=[];let ctx={setTransform(){}};let env={document:{querySelector:q=>q==='#game'?{getContext:()=>ctx}:{} ,querySelectorAll:()=>[]},innerWidth:360,innerHeight:740,devicePixelRatio:1,Image:class{},localStorage:{getItem:()=> '1'},performance:{now:()=>0},addEventListener(){},requestAnimationFrame:f=>queue.push(f)};vm.createContext(env);vm.runInContext(source,env);if(!vm.runInContext('active',env))throw Error('stored progress did not restore');console.log(JSON.stringify({restore:'passed',queuedFrames:queue.length}))}checkRestore();
