'use strict';
(() => {
  const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d');
  const loading=document.querySelector('#loading'),place=document.querySelector('#place'),objective=document.querySelector('#objective'),prompt=document.querySelector('#prompt');
  const modal=document.querySelector('#modal'),tag=document.querySelector('#modal-tag'),title=document.querySelector('#modal-title'),body=document.querySelector('#modal-body'),choices=document.querySelector('#modal-choices');
  const visionButton=document.querySelector('#vision');
  const W=1600,H=900,assets={};
  const saved=(() => {try{return JSON.parse(localStorage.getItem('cybermycelium-adventure-v1')||'{}')}catch{return {}}})();
  const progress={memory:!!saved.memory,relay:!!saved.relay,specimen:!!saved.specimen,signal:!!saved.signal,node:!!saved.node};
  let scene=saved.scene==='memory'?'memory':'atrium',vision=false,hover=null,pending=null,last=0,elapsed=0,noticeUntil=0;
  const hero={x:scene==='memory'?1440:730,y:scene==='memory'?720:770,to:null,facing:1,walking:false};
  const hotspots={
    atrium:[
      {id:'archive',name:'Архив эха',box:[90,370,430,640],go:[360,685]},
      {id:'terminal',name:'Сигнальный терминал',box:[1080,510,1370,690],go:[1135,695]},
      {id:'gate',name:'Проход к камере памяти',box:[1430,310,1595,685],go:[1460,700]}
    ],
    memory:[
      {id:'specimen',name:'Споровый архив',box:[65,205,450,590],go:[390,675]},
      {id:'core',name:'Сердце памяти',box:[635,160,1080,575],go:[850,665]},
      {id:'console',name:'Пульт маршрута',box:[1140,390,1435,640],go:[1190,680]},
      {id:'back',name:'Вернуться в атриум',box:[1440,270,1590,615],go:[1465,690]}
    ]
  };
  function save(){try{localStorage.setItem('cybermycelium-adventure-v1',JSON.stringify({...progress,scene}))}catch{}}
  function message(t,seconds=4){prompt.textContent=t;noticeUntil=elapsed+seconds}
  function goal(){place.textContent=scene==='atrium'?'НУЛЕВОЙ УЗЕЛ / АТРИУМ':'НУЛЕВОЙ УЗЕЛ / КАМЕРА ПАМЯТИ';objective.textContent=progress.node?'Узел отвечает. Сигнал пришёл извне.':!progress.memory?'Найдите обрывок памяти в архиве.':!progress.relay?'Восстановите маршрут в терминале.':scene==='atrium'?'Пройдите в камеру памяти.':!progress.specimen?'Изучите споровый архив.':!progress.signal?'Настройте пульт маршрута.':'Пробудите сердце памяти.'}
  function dialog(kind,heading,text,buttons=[]){pending=null;tag.textContent=kind;title.textContent=heading;body.textContent=text;choices.replaceChildren();for(const b of buttons){let el=document.createElement('button');el.type='button';el.textContent=b.label;el.addEventListener('click',b.action);choices.append(el)}modal.classList.add('show');document.querySelector('#close').focus()}
  function close(){modal.classList.remove('show');goal()}
  document.querySelector('#close').addEventListener('click',close);
  document.querySelector('#journal').addEventListener('click',()=>dialog('ПОЛЕВОЙ ЖУРНАЛ','Нулевой узел',`Память: ${progress.memory?'найдена':'не найдена'}. Маршрут: ${progress.relay?'восстановлен':'нарушен'}. Споровый образец: ${progress.specimen?'считан':'не считан'}. Пульт: ${progress.signal?'настроен':'молчит'}. Узел: ${progress.node?'пробуждён':'спит'}.`));
  visionButton.addEventListener('click',()=>{vision=!vision;visionButton.classList.toggle('active',vision);message(vision?'Связи проявились. Осмотрите отмеченные участки.':'Зрение сети отключено.',3)});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('show'))close();if(e.key.toLowerCase()==='v'&&!e.repeat&&!modal.classList.contains('show'))visionButton.click()});
  function nextScene(name){scene=name;hero.x=name==='memory'?1430:1460;hero.y=720;hero.to=null;hover=null;save();goal();message(name==='memory'?'Сеть хранит больше, чем показывает.':'Вы вернулись в атриум.',4)}
  const relayOrder=['ТКАНЬ','МЕДЬ','ПАМЯТЬ'];let relayStep=0;
  function puzzle(){relayStep=0;function show(){dialog('СИГНАЛЬНЫЙ ТЕРМИНАЛ','Восстановление маршрута',`Выберите порядок импульсов. Подсказка архива: «Сначала живая ткань, затем проводник, затем память». Подключено: ${relayStep} из 3.`,relayOrder.map((label,index)=>({label,action:()=>{if(index===relayStep){relayStep++;if(relayStep===3){progress.relay=true;save();dialog('МАРШРУТ ВОССТАНОВЛЕН','Связь открыта','Мицелий принял последовательность. Дверь к камере памяти отвечает на сигнал.');goal()}else show()}else{relayStep=0;show();message('Последовательность сброшена.',3)}}})))}show()}
  function interact(id){
    if(id==='archive'){progress.memory=true;save();dialog('ЭХО ПАМЯТИ','Фрагмент 01','Три импульса пережили разрыв: сначала живая ткань, затем медь, затем память. Порядок записан в ваш журнал.');message('Фрагмент памяти получен. Подойдите к терминалу.',5)}
    if(id==='terminal'){progress.memory?puzzle():dialog('СИГНАЛЬНЫЙ ТЕРМИНАЛ','Маршрут закрыт','Терминал ждёт утраченный порядок импульсов. След остался в архивном зале слева.')}
    if(id==='gate'){progress.relay?nextScene('memory'):dialog('СИГНАЛЬНЫЙ ШЛЮЗ','Нет маршрута','Дверь не узнаёт ваш сигнал. Восстановите маршрут в терминале.')}
    if(id==='specimen'){progress.specimen=true;save();dialog('СПОРОВЫЙ АРХИВ','Живой образец','Споры удерживают отпечаток сигнала. Теперь пульт может сопоставить его с разорванной ветвью.');message('Образец считан. Осмотрите пульт справа.',5)}
    if(id==='console'){if(!progress.specimen){dialog('ПУЛЬТ МАРШРУТА','Нужен образец','В архиве слева хранится споровый отпечаток этого узла.');return}progress.signal=true;save();dialog('ПУЛЬТ МАРШРУТА','Канал открыт','Проводящие волокна нашли ответ. Подключитесь к сердцу памяти.');message('Канал открыт. Подойдите к центральному стволу.',5)}
    if(id==='core'){if(!progress.signal){dialog('СЕРДЦЕ ПАМЯТИ','Узел спит','Сначала считайте споровый образец и направьте его через пульт.');return}progress.node=true;save();dialog('УЗЕЛ 01 ВОССТАНОВЛЕН','Внешний ответ','Весь зал оживает. В ответ приходит сигнал из области, которую сеть не помнит. Кто-то или что-то наблюдало за восстановлением.');message('УЗЕЛ 01 ВОССТАНОВЛЕН // ОБНАРУЖЕН ВНЕШНИЙ ОТВЕТ',8)}
    if(id==='back')nextScene('atrium');goal()
  }
  function point(e){let r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
  function hit(p){return hotspots[scene].find(h=>p.x>=h.box[0]&&p.x<=h.box[2]&&p.y>=h.box[1]&&p.y<=h.box[3])}
  function walk(x,y,h=null){hero.to={x:Math.max(90,Math.min(1510,x)),y:Math.max(625,Math.min(825,y))};pending=h}
  canvas.addEventListener('pointermove',e=>{hover=hit(point(e));canvas.style.cursor=hover?'pointer':'crosshair'});
  canvas.addEventListener('pointerleave',()=>{hover=null});
  canvas.addEventListener('pointerdown',e=>{if(modal.classList.contains('show'))return;let p=point(e),h=hit(p);if(h){walk(h.go[0],h.go[1],h);message(h.name,2)}else if(p.y>560){walk(p.x,p.y);message('Проводник идёт...',1.5)}else message('Здесь нет прохода. Выберите участок пола.',2)});
  function drawHero(){let scale=.68+(hero.y-625)/650,bob=hero.walking?Math.sin(elapsed*12)*2:0,x=hero.x,y=hero.y+bob;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#050c0c99';ctx.beginPath();ctx.ellipse(0,3,25,7,0,0,Math.PI*2);ctx.fill();ctx.lineCap='round';ctx.strokeStyle='#0a1112';ctx.lineWidth=8;let stride=hero.walking?Math.sin(elapsed*12)*8:0;ctx.beginPath();ctx.moveTo(-7,-14);ctx.lineTo(-9+stride,0);ctx.moveTo(7,-14);ctx.lineTo(9-stride,0);ctx.stroke();ctx.fillStyle='#0b1618';ctx.beginPath();ctx.moveTo(-16,-64);ctx.lineTo(14,-63);ctx.lineTo(19,-14);ctx.lineTo(-17,-15);ctx.closePath();ctx.fill();ctx.fillStyle='#34423d';ctx.fillRect(-14,-62,5,41);ctx.fillStyle='#111f23';ctx.beginPath();ctx.ellipse(0,-71,12,15,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6bbbc2';ctx.fillRect(hero.facing>0?2:-10,-75,8,3);ctx.fillStyle='#c99959';ctx.fillRect(-20,-48,4,11);ctx.restore()}
  function drawHotspots(){for(const h of hotspots[scene]){if(!vision&&hover!==h)continue;let x=(h.box[0]+h.box[2])/2,y=h.box[3]-32,pulse=3+Math.sin(elapsed*3)*2;ctx.save();ctx.strokeStyle=vision?'#91d2d1':'#ebc58b';ctx.fillStyle=vision?'#b4eceb':'#f8dfaa';ctx.lineWidth=2;ctx.globalAlpha=hover===h?1:.72;ctx.beginPath();ctx.arc(x,y,13+pulse,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();if(hover===h){ctx.font='18px monospace';let measure=ctx.measureText(h.name).width;ctx.fillStyle='#0b181add';ctx.fillRect(x-measure/2-10,y-51,measure+20,30);ctx.fillStyle='#f4e6c8';ctx.fillText(h.name,x-measure/2,y-30)}ctx.restore()}}
  function render(){ctx.fillStyle='#101819';ctx.fillRect(0,0,W,H);let img=assets[scene];if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,0,0,W,H);if(progress.node&&scene==='memory'){ctx.fillStyle='rgba(224,158,75,.08)';ctx.fillRect(0,0,W,H)}drawHotspots();drawHero();for(let i=0;i<35;i++){let x=(i*317+elapsed*(i%3+1)*8)%W,y=(i*197+Math.sin(elapsed+i)*25)%H;ctx.fillStyle='#dfcc9c60';ctx.fillRect(x,y,2,2)}}
  function update(t){let dt=Math.min(.04,(t-last)/1000||0);last=t;elapsed+=dt;if(hero.to){let dx=hero.to.x-hero.x,dy=hero.to.y-hero.y,d=Math.hypot(dx,dy),step=285*dt;if(d<=step+3){hero.x=hero.to.x;hero.y=hero.to.y;hero.to=null;hero.walking=false;if(pending){let h=pending;pending=null;interact(h.id)}}else{hero.x+=dx/d*step;hero.y+=dy/d*step;hero.facing=dx>=0?1:-1;hero.walking=true}}else hero.walking=false;if(noticeUntil&&elapsed>noticeUntil){noticeUntil=0;prompt.textContent=vision?'Связи проявились. Выберите отмеченный объект.':'Нажмите на пол, чтобы идти. Осмотрите предметы.'}render();requestAnimationFrame(update)}
  function load(name,src){return new Promise(resolve=>{let img=new Image();assets[name]=img;img.onload=resolve;img.onerror=()=>{message('Фон не загрузился. Проверьте соединение.',8);resolve()};img.src=src})}
  goal();Promise.all([load('atrium','./assets/atrium.webp'),load('memory','./assets/memory.webp')]).then(()=>{loading.classList.add('hidden');dialog('ПРОБУЖДЕНИЕ','Нулевой узел','Память фрагментирована. Маршрут нарушен. Вы — Проводник, оказавшийся в атриуме живой вычислительной сети. Осмотрите окружение и восстановите ветвь.');requestAnimationFrame(update)});
})();
