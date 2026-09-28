const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'game.js'),'utf8');
class Element {
  constructor(){this.textContent='';this.handlers={};this.children=[];this.style={};this.classList={set:new Set(),add(x){this.set.add(x)},remove(x){this.set.delete(x)},contains(x){return this.set.has(x)},toggle(x,v){if(v===undefined)v=!this.set.has(x);v?this.set.add(x):this.set.delete(x)}}}
  addEventListener(n,fn){this.handlers[n]=fn}
  click(){this.handlers.click?.({})}
  focus(){}
  setAttribute(){}
  replaceChildren(){this.children=[]}
  append(...x){this.children.push(...x)}
  getBoundingClientRect(){return {left:0,top:0,width:1600,height:900}}
}
const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const ctx=new Proxy({}, {get(o,k){if(k==='measureText')return s=>({width:s.length*10});return o[k]||(()=>{})},set(o,k,v){o[k]=v;return true}});
nodes.scene.getContext=nodes.detail.getContext=()=>ctx;
const tabs=['contour','protocols','echo'].map(pulseTab=>Object.assign(new Element(),{dataset:{pulseTab}}));
const mapNodes=['ash','atrium','interface','memory','seam','carrier','b0','b1','c0','c1','r','center'].map(scene=>Object.assign(new Element(),{dataset:{scene}}));
let raf,clock=0;
const store={'cybermycelium-adventure-v1':JSON.stringify({scene:'carrier',ashSignal:true,ashSpores:true,sporeVoice:true,ashCompared:true,adapter:true,relay:true,routePowered:true,ending:'seal',node:true,signal:true,seamCalibrated:true,archSeen:true,carrierSeal:true,carrierRhythm:true,carrierRead:true})};
const sandbox={document:{body:new Element(),querySelector:s=>s.startsWith('[data-pulse-tab')?tabs[0]:nodes[s.slice(1)],querySelectorAll:s=>s==='.map-node'?mapNodes:s==='[data-pulse-tab]'?tabs:[],createElement:()=>new Element()},window:{addEventListener(){}},localStorage:{getItem:k=>store[k],setItem:(k,v)=>store[k]=v},Image:class{set src(v){this.complete=true;this.naturalWidth=1600;this.onload?.()}},requestAnimationFrame:f=>raf=f,Math,Promise,console};
vm.runInNewContext(js,sandbox,{filename:'game.js'});
const progress=()=>JSON.parse(store['cybermycelium-adventure-v1']);
const tick=async(n=1)=>{await Promise.resolve();for(let i=0;i<n;i++){clock+=40;raf?.(clock)}};
const walk=async(x,y)=>{nodes.scene.handlers.pointerdown({clientX:x,clientY:y});await tick(230)};
const close=()=>nodes.close.click();
const choose=label=>{const button=nodes['modal-choices'].children.find(x=>x.textContent===label);assert(button,`missing action: ${label}; found ${nodes['modal-choices'].children.map(x=>x.textContent)}`);button.click()};
const protocol=()=>{assert(nodes.pulse.classList.contains('show'));tabs[1].click();const action=nodes['pulse-content'].children[0].children.find(x=>x.textContent==='ПРИМЕНИТЬ');assert(action&&!action.disabled,`protocol blocked: ${nodes['pulse-blocker'].textContent}`);action.click();nodes['pulse-close'].click()};

async function salt(){
  await walk(90,590);assert.match(nodes.place.textContent,/СОЛЯНАЯ ВЕТВЬ \/ АРХИВ/);
  await walk(790,330);assert.match(nodes['modal-body'].textContent,/задержка/);close();
  await walk(1190,315);assert.match(nodes.place.textContent,/ПРОВАЛЫ/);
  await walk(235,320);choose('СНЯТЬ КРАЙНИЙ ОТПЕЧАТОК');assert(progress().saltSlice);close();
  await walk(810,480);choose('ОТКРЫТЬ ПОЛНОСТЬ');assert.equal(progress().saltFlow,'flooded');close();
  await walk(235,320);assert.match(nodes['modal-body'].textContent,/скрывает слои/);close();
  await walk(810,480);choose('ЗАКРЫТЬ ВОДУ');close();
  await walk(1440,285);choose('ОТМЕТИТЬ ОТЗВУК');assert(progress().saltDead);close();
  await walk(1440,285);assert.match(nodes['modal-body'].textContent,/умеренный поток/);close();
  await walk(810,480);choose('УМЕРЕННЫЙ ПОТОК');close();
  await walk(1440,285);choose('ИЗМЕРИТЬ ЗАДЕРЖКУ');assert(progress().saltDelay);close();
  await walk(1460,620);assert.match(nodes.place.textContent,/АРХИВ/);
  await walk(200,260);choose('РАЗДЕЛИТЬ ПО ФАЗЕ');assert(progress().saltFiltered);close();
  await walk(1490,290);choose('СЧИТАТЬ ШТАМП');assert(progress().saltStamp);close();
  await walk(960,590);protocol();assert(progress().saltReady);
  await walk(790,330);choose('ПЕЧАТЬ → ОТСЕЧЕНИЕ');assert(!progress().saltTime);close();
  await walk(790,330);choose('ОТСЕЧЕНИЕ → ПОЗДНЯЯ ПЕЧАТЬ');assert(progress().saltTime);close();
  await walk(120,630);assert.match(nodes.place.textContent,/ШОВ РАЗРЫВА/);
}
async function spores(){
  await walk(90,270);assert.match(nodes.place.textContent,/ХОР СПОР/);
  await walk(130,510);assert.match(nodes.place.textContent,/БАГРОВЫЙ ЛЕС/);
  await walk(680,450);assert.match(nodes['modal-body'].textContent,/ламеллам/);close();
  await walk(270,290);choose('ОТМЕТИТЬ НАПРАВЛЕНИЕ');assert(progress().forestWind);close();
  await walk(270,290);choose('ТЕПЛО → ШАГ');assert(progress().forestPhase);close();
  await walk(680,450);choose('СНЯТЬ ТОНКИЙ ОТПЕЧАТОК');assert(progress().forestOld);close();
  await walk(1280,305);choose('ВЗЯТЬ МНОГО СПОР');assert(progress().forestLate&&progress().forestStress);close();
  await walk(990,365);choose('ДАТЬ ТКАНИ ВОССТАНОВИТЬСЯ');assert(!progress().forestStress);close();
  await walk(1510,620);assert.match(nodes.place.textContent,/ХОР СПОР/);
  await walk(230,220);choose('СЧИТАТЬ ОТДЕЛЬНО');assert(progress().sporeOldRead);close();
  await walk(820,210);assert.match(nodes['modal-body'].textContent,/клапан/);close();
  await walk(1370,195);choose('К ПОЗДНЕМУ ГНЕЗДУ');assert.equal(progress().sporeValve,'late');close();
  await walk(820,210);choose('СЧИТАТЬ ОТДЕЛЬНО');assert(progress().sporeLateRead);close();
  await walk(890,520);protocol();assert(progress().sporeReady);
  await walk(1150,465);choose('ЭТО ТОЧНО ОДИН И ТОТ ЖЕ ГОЛОС');assert(!progress().sporeOrigin);close();
  await walk(1150,465);choose('РАННИЙ ГОЛОС — ЖИВАЯ НИТЬ');assert(progress().sporeOrigin);close();
  await walk(1490,510);assert.match(nodes.place.textContent,/ШОВ РАЗРЫВА/);
}
async function ringAndHeart(){
  await walk(1495,435);assert.match(nodes.place.textContent,/ТРЕТИЙ НОСИТЕЛЬ/);
  await walk(1460,455);assert.match(nodes.place.textContent,/СРАСТАНИЕ/);
  await walk(1470,535);assert.match(nodes['modal-body'].textContent,/три происхождения/);close();
  for(const [x,y] of [[240,275],[755,245],[1415,245]]){await walk(x,y);choose('ОТМЕТИТЬ ИСТОЧНИК');close()}
  assert(progress().ringA&&progress().ringB&&progress().ringC);
  await walk(1150,450);choose('ПРОБНЫЙ ИМПУЛЬС');assert(progress().ringTrial);close();
  await walk(765,485);choose('ПОЛНОЕ УСРЕДНЕНИЕ');assert(!progress().ringBoundary);close();
  await walk(765,485);choose('ПРОВЕРЯЕМЫЕ ГРАНИЦЫ');assert.equal(progress().ringBoundary,'guarded');close();
  await walk(955,565);protocol();assert(progress().ringReady);
  await walk(540,540);choose('СМЕШАТЬ В ОДИН ГОЛОС');assert(!progress().ringAligned);close();
  await walk(540,540);choose('СОХРАНИТЬ ТРИ ИСТОЧНИКА');assert(progress().ringAligned);close();
  await walk(1470,535);assert.match(nodes.place.textContent,/СЕРДЦЕВИНА/);
  await walk(840,325);choose('СЛУШАТЬ ЖИВУЮ ЛИНИЮ');assert(progress().heartBiology);assert.match(nodes['modal-body'].textContent,/ждала/);close();
  await walk(315,555);choose('СЧИТАТЬ ПОСЛЕДНИЙ ЖУРНАЛ');assert(progress().hostsGone);assert.match(nodes['modal-body'].textContent,/автоматические/);close();
  for(const [x,y] of [[550,565],[850,570],[1100,560]]){await walk(x,y);choose('ПРОВЕРИТЬ ТРИ РЕЖИМА');close()}
  assert(progress().valveSalt&&progress().valveSpore&&progress().valveMemory);
  await walk(1470,460);protocol();assert(progress().heartCompared);
  await walk(840,325);assert.match(nodes['modal-body'].textContent,/использовала/);
  const mode=process.env.TEST_HEART||'bounded',label={bounded:'УСТАНОВИТЬ ГРАНИЦЫ',open:'ОТКРЫТЬ ВСЕ ВЕТВИ',seal:'СОХРАНИТЬ ПЕЧАТЬ'}[mode];assert(label);
  choose(label);assert.equal(progress().heartChoice,mode);assert.match(nodes['modal-body'].textContent,/прежних хозяев|грибница|Грибница/);close();
  nodes.journal.click();assert.match(nodes['modal-body'].textContent,/Найдено \d+ из \d+/);const intent=nodes['modal-choices'].children.find(x=>x.textContent==='Ожидание и инструмент');assert(intent);intent.click();assert.match(nodes['modal-body'].textContent,/намеренно направила/);close();
  await walk(840,325);assert.match(nodes['modal-body'].textContent,/После решения:/);close();
  await walk(85,520);assert.match(nodes.place.textContent,/СРАСТАНИЕ/);
  await walk(540,540);assert.match(nodes['modal-body'].textContent,/После решения:/);close();
  await walk(230,495);assert.match(nodes.place.textContent,/ТРЕТИЙ НОСИТЕЛЬ/);
  await walk(840,340);assert.match(nodes['modal-body'].textContent,/После решения:/);close();
  await walk(175,385);assert.match(nodes.place.textContent,/ШОВ РАЗРЫВА/);
}
async function returnThroughWorld(){
  const inspect=async(x,y)=>{assert.match(nodes.objective.textContent,/Проверьте|Осмотрите|Послушайте|Сравните|Сверьте/);await walk(x,y);const text=nodes['modal-body'].textContent;assert.match(text,/После решения:/);close();return text};
  await inspect(850,420);
  await walk(90,590);assert.match(nodes.place.textContent,/СОЛЯНАЯ ВЕТВЬ \/ АРХИВ/);
  const mode=process.env.TEST_HEART||'bounded',saltWords={open:/наслаивается/,seal:/без новых дальних записей/,bounded:/временной меткой/};
  assert.match(await inspect(790,330),saltWords[mode]);
  assert(progress().saltAfterSeen&&!progress().sporeAfterSeen&&!progress().fieldReport);
  nodes.journal.click();choose('Соль после решения');assert.match(nodes['modal-body'].textContent,saltWords[mode]);close();
  await walk(1190,315);assert.match(nodes.place.textContent,/ПРОВАЛЫ/);
  await inspect(810,480);
  await walk(1460,620);await walk(1470,640);assert.match(nodes.place.textContent,/ХОР СПОР/);
  const choirWords={open:/общий голос/,seal:/порознь/,bounded:/Оба возраста звучат отдельно/};
  assert.match(await inspect(1150,465),choirWords[mode]);
  assert(progress().sporeAfterSeen&&!progress().fieldReport);
  assert.match(nodes.objective.textContent,/Оба последствия записаны/);
  nodes.journal.click();choose('Споры после решения');assert.match(nodes['modal-body'].textContent,choirWords[mode]);close();
  await walk(135,510);assert.match(nodes.place.textContent,/БАГРОВЫЙ ЛЕС/);
  await inspect(990,365);
  await walk(1510,620);await walk(1490,510);assert.match(nodes.place.textContent,/ШОВ РАЗРЫВА/);
  await walk(380,600);assert.match(nodes.place.textContent,/СКЛЕП ПАМЯТИ/);
  await inspect(865,385);
  await walk(1510,420);assert.match(nodes.place.textContent,/НУЛЕВОЙ УЗЕЛ/);
  await inspect(850,485);
  await walk(225,430);assert.match(nodes.place.textContent,/КАМЕРА СОПРЯЖЕНИЯ/);
  await inspect(555,320);
  await walk(155,325);await walk(90,670);assert.match(nodes.place.textContent,/ПЕПЕЛЬНЫЕ ТЕРРАСЫ/);
  await inspect(855,380);
  await walk(150,280);choose('ЗАВЕРШИТЬ ПОЛЕВОЙ ОТЧЁТ');
  assert(progress().fieldReport);assert.match(nodes['modal-body'].textContent,({open:/голоса смешиваются/,seal:/Дальняя связь слаба/,bounded:/временной меткой/})[mode]);close();
  assert.match(nodes.objective.textContent,/Полевой отчёт сохранён/);
  nodes.journal.click();assert.match(nodes['modal-body'].textContent,/Полевой отчёт завершён/);
  choose('Полевой отчёт первого цикла');assert.match(nodes['modal-body'].textContent,/не объясняет, куда ушли хозяева/);close();
  await walk(150,280);assert.match(nodes['modal-body'].textContent,/Запись сохранена в приборе/);close();
  assert.equal(progress().heartChoice,mode);
}
(async()=>{
  await tick();nodes.continue.click();assert(!nodes.modal.classList.contains('show'));
  await walk(1460,455);assert.match(nodes['modal-body'].textContent,/соляная/);close();
  await walk(175,385);assert.match(nodes.place.textContent,/ШОВ РАЗРЫВА/);
  if(process.env.TEST_BRANCH_ORDER==='spores'){await spores();await salt()}else{await salt();await spores()}
  await ringAndHeart();
  await returnThroughWorld();
  nodes['map-button'].click();assert(!mapNodes.find(x=>x.dataset.scene==='center').classList.contains('locked'));nodes['map-close'].click();
  console.log(`PASS: ${process.env.TEST_BRANCH_ORDER||'salt'} first, both branches, ${process.env.TEST_HEART||'bounded'} ending, return and field report`);
})().catch(e=>{console.error(e);process.exitCode=1});
