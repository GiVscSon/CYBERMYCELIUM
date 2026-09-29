// Real Chromium. Install playwright, or set PLAYWRIGHT_MODULE to its module path.
// Optional: BROWSER_EXECUTABLE and BROWSER_ARTIFACTS_DIR. No save seeding during the full route.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'..'),SAVE='cybermycelium-adventure-v1',SETTINGS='cybermycelium-settings-v1';
const artifacts=process.env.BROWSER_ARTIFACTS_DIR;
if(artifacts)fs.mkdirSync(artifacts,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{res.statusCode=err?404:200;res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(err?'missing':data)});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||undefined,headless:true,args:process.env.BROWSER_EXECUTABLE?['--no-sandbox','--single-process','--no-zygote','--disable-dev-shm-usage']:[]});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],unexpectedRequests=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('requestfailed',request=>unexpectedRequests.push(request.url()));
    page.setDefaultTimeout(12000);
    const save=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}'),SAVE);
    const choose=label=>page.locator('#modal-choices').getByRole('button',{name:label,exact:true}).click();
    const close=()=>page.locator('#close').click();
    const walk=async(x,y)=>{
      const before=(await save()).scene||'ash',box=await page.locator('#scene').boundingBox();
      await page.locator('#scene').click({position:{x:x/1600*box.width,y:y/900*box.height}});
      await page.waitForFunction(({before,SAVE})=>document.querySelector('#modal.show,#pulse.show')||JSON.parse(localStorage.getItem(SAVE)||'{}').scene!==before&&JSON.parse(localStorage.getItem(SAVE)||'{}').scene,{before,SAVE});
    };
    const act=async(x,y,label)=>{await walk(x,y);if(label)await choose(label);await close()};
    const protocol=async(x,y)=>{await walk(x,y);await page.getByRole('tab',{name:'ПРОТОКОЛЫ',exact:true}).click();await page.locator('#pulse-content').getByRole('button',{name:'ПРИМЕНИТЬ',exact:true}).click();await page.locator('#pulse-close').click()};
    const reload=async()=>{const before=await save();await page.reload();await page.locator('#menu.show').waitFor();await page.locator('#continue').click();assert.deepEqual(await save(),before)};
    const snap=async name=>{if(artifacts)await page.screenshot({path:path.join(artifacts,name+'.png')})};
    await page.goto(url);await page.locator('#menu.show').waitFor();
    await page.locator('#settings-button').click();await page.locator('#move-speed').selectOption('fast');await page.locator('#always-hotspots').check();await page.locator('#settings-back').click();
    await page.locator('#continue').click();await close();
    await page.locator('#hero-button').click();for(let i=0;i<2;i++)await page.locator('.hero-stat').nth(4).getByRole('button',{name:'+',exact:true}).click();await page.locator('#hero-close').click();
    await act(120,300,'СЧИТАТЬ ЖУРНАЛ');await act(820,380,'СЧИТАТЬ СПОРЫ');await act(820,380,'ПРИСЛУШАТЬСЯ');await act(120,300,'СОПОСТАВИТЬ РИТМЫ');
    await page.locator('#vision').focus();await page.keyboard.press('Enter');await page.waitForTimeout(300);assert.equal(await page.locator('#modal.show').count(),0,'HUD Enter must not inspect nearby world object');
    await page.locator('#scene').focus();await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'ь',code:'KeyM',bubbles:true})));await page.locator('#world-map.show').waitFor();
    await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>document.querySelector('#world-map').contains(document.activeElement)));await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'scene');
    await walk(1350,350);await walk(220,350);await act(550,250,'СЧИТАТЬ ФАЗЫ');await act(1350,240,'ОСМОТРЕТЬ ОЖОГ');await walk(1000,430);
    for(const label of ['ИЗОЛИРОВАТЬ','ВЫРОВНЯТЬ РИТМ','ЗАМКНУТЬ КОНТАКТ'])await choose(label);await close();
    await walk(120,300);await act(350,450,'СНЯТЬ ЗАПИСЬ');await act(850,480,'СЧИТАТЬ РЕЕСТР');await protocol(1200,600);
    await walk(1500,500);await choose('НАСТРОИТЬ РЕЦЕПТОРЫ');for(const label of ['ТКАНЬ','МЕДЬ','ПАМЯТЬ'])await choose(label);await close();await walk(1500,500);
    await act(550,450,'ЗАПОМНИТЬ ГОЛОС');await act(250,400,'РАЗЛИЧИТЬ РИТМ · ЧУТКОСТЬ 3');await reload();
    await walk(250,400);assert.match(await page.locator('#modal-body').textContent(),/чтение без отбора/);await close();await protocol(1200,480);
    const lastPulse=(await save()).lastPulse;await reload();await walk(1200,480);assert.match(await page.locator('#pulse-last').textContent(),new RegExp(lastPulse));await page.locator('#pulse-close').click();
    await walk(800,400);await choose('ПОДКЛЮЧИТЬ ПЕРЕХОДНИК');await choose('СЛУШАТЬ ОТВЕТ');await choose('ИДТИ К ШВУ РАЗРЫВА');
    await act(300,300,'СНЯТЬ ОТТИСК');await act(750,350,'ПРОСЛУШАТЬ СЛЕД');await protocol(1200,500);await act(750,350,'ПОРЯДОК СОБЫТИЙ');
    await walk(1500,400);await choose('ВОЙТИ К НОСИТЕЛЮ');await act(550,525,'СЧИТАТЬ ПЕЧАТЬ');await act(1160,490,'СВЕРИТЬ С ПРИБОРОМ');await act(840,340,'СИГНАЛ СВЯЗАН С МОИМ');
    assert.equal((await save()).carrierRead,true);console.log('BROWSER: A0 → T completed from empty storage, two reloads passed');
    await walk(175,385);await walk(90,590);await walk(1190,315);await act(235,320,'СНЯТЬ КРАЙНИЙ ОТПЕЧАТОК');await act(1440,285,'ОТМЕТИТЬ ОТЗВУК');await act(810,480,'УМЕРЕННЫЙ ПОТОК');await act(1440,285,'ИЗМЕРИТЬ ЗАДЕРЖКУ');
    await walk(1460,620);await act(200,260,'РАЗДЕЛИТЬ ПО ФАЗЕ');await act(1490,290,'СЧИТАТЬ ШТАМП');await protocol(960,590);await act(790,330,'ОТСЕЧЕНИЕ → ПОЗДНЯЯ ПЕЧАТЬ');await reload();
    await walk(120,630);await walk(90,270);await walk(130,510);await act(270,290,'ОТМЕТИТЬ НАПРАВЛЕНИЕ');await act(270,290,'ТЕПЛО → ШАГ');await act(680,450,'СНЯТЬ ТОНКИЙ ОТПЕЧАТОК');await act(1280,305,'ВЗЯТЬ МНОГО СПОР');
    await act(990,365,'ДАТЬ ТКАНИ ВОССТАНОВИТЬСЯ');await walk(1510,620);await act(230,220,'СЧИТАТЬ ОТДЕЛЬНО');await act(1370,195,'К ПОЗДНЕМУ ГНЕЗДУ');await act(820,210,'СЧИТАТЬ ОТДЕЛЬНО');await protocol(890,520);await act(1150,465,'РАННИЙ ГОЛОС — ЖИВАЯ НИТЬ');await reload();
    console.log('BROWSER: both branches completed, bridge restored, two more reloads passed');
    await walk(1490,510);await walk(1495,435);await walk(1460,455);
    for(const [x,y] of [[240,275],[755,245],[1415,245]])await act(x,y,'ОТМЕТИТЬ ИСТОЧНИК');
    await act(1150,450,'ПРОБНЫЙ ИМПУЛЬС');await act(765,485,'ПРОВЕРЯЕМЫЕ ГРАНИЦЫ');await protocol(955,565);await act(540,540,'СОХРАНИТЬ ТРИ ИСТОЧНИКА');await walk(1470,535);
    await act(840,325,'СЛУШАТЬ ЖИВУЮ ЛИНИЮ');await act(315,555,'СЧИТАТЬ ПОСЛЕДНИЙ ЖУРНАЛ');for(const [x,y] of [[550,565],[850,570],[1100,560]])await act(x,y,'ПРОВЕРИТЬ ТРИ РЕЖИМА');await protocol(1470,460);
    await walk(840,325);await snap('heart-choice');await choose('УСТАНОВИТЬ ГРАНИЦЫ');await close();await reload();assert.equal((await save()).heartChoice,'bounded');
    await walk(85,520);await walk(230,495);await walk(175,385);await walk(90,590);await act(790,330);await walk(1470,640);await act(1150,465);await walk(1490,510);await walk(380,600);await walk(1510,420);await walk(90,670);
    await act(150,280,'ЗАВЕРШИТЬ ПОЛЕВОЙ ОТЧЁТ');await reload();const finalSave=await save();assert.equal(finalSave.fieldReport,true);assert.equal(finalSave.visited.length,12);
    await page.locator('#journal').click();await choose('Полевой отчёт первого цикла');await snap('field-report');await close();
    assert.deepEqual(errors,[]);assert.deepEqual(unexpectedRequests,[]);console.log('BROWSER: finale, return, field report and sixth reload passed; no page errors or failed requests');
    // Real focus containment in each independent window, including the settings subpanel.
    for(const [open,panel,closeId] of [['map-button','world-map','map-close'],['hero-button','hero-panel-overlay','hero-close'],['atlas-button','atlas','atlas-close'],['menu-button','menu','continue'],['journal','modal','close']]){
      await page.locator('#'+open).click();const controls=page.locator(`#${panel} button:visible:not(:disabled),#${panel} select:visible,#${panel} input:visible`);
      await controls.first().focus();await page.keyboard.press('Shift+Tab');assert(await page.evaluate(id=>document.getElementById(id).contains(document.activeElement),panel));
      await controls.last().focus();await page.keyboard.press('Tab');assert(await page.evaluate(id=>document.getElementById(id).contains(document.activeElement),panel));await page.locator('#'+closeId).click();
    }
    await page.locator('#menu-button').click();await page.locator('#settings-button').click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-button');await page.locator('#continue').click();
    // Inject storage failure only after the genuine run; the previous save must survive.
    await page.evaluate(()=>{window.originalWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError')}});
    await page.locator('#hero-button').click();await page.locator('#hero-cloak').selectOption('moss');await page.locator('#hero-close').click();await page.locator('#menu-button').click();
    assert.match(await page.locator('#menu-save-status').textContent(),/Прогресс не сохранён/);assert.equal((await save()).character.cloak,finalSave.character.cloak);
    await page.evaluate(()=>{Storage.prototype.setItem=window.originalWrite});await page.locator('#retry-save').click();assert.equal((await save()).character.cloak,'moss');assert.equal(await page.locator('#save-warning').isVisible(),false);
    // Abort a required background; retry must recover without changing the saved run.
    const savedBeforeFailure=await save();const failure=route=>route.abort();await page.route('**/assets/ash-terraces-cyber.webp',failure);unexpectedRequests.length=0;
    await page.reload();await page.locator('#load-retry').waitFor({state:'visible'});assert.equal(await page.locator('#menu').isVisible(),false);assert.deepEqual(await save(),savedBeforeFailure);
    await page.unroute('**/assets/ash-terraces-cyber.webp',failure);await page.locator('#load-retry').click();await page.locator('#menu.show').waitFor();assert.deepEqual(await save(),savedBeforeFailure);
    const mobile=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));
    await mobile.goto(url);await mobile.evaluate(({SAVE,SETTINGS,finalSave})=>{localStorage.setItem(SAVE,JSON.stringify(finalSave));localStorage.setItem(SETTINGS,JSON.stringify({text:'large',reduced:true,speed:'fast'}))},{SAVE,SETTINGS,finalSave});
    await mobile.reload();await mobile.locator('#continue').tap();await mobile.locator('#journal').tap();await mobile.getByRole('button',{name:'Полевой отчёт первого цикла',exact:true}).tap();await mobile.locator('#close').tap();
    await mobile.setViewportSize({width:390,height:844});await mobile.locator('#map-button').tap();await mobile.locator('#map-close').tap();
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mobile.close();assert.deepEqual(errors,[]);
    const result={browser:browser.version(),fullRoute:'A0 → T → B0/B1 → C0/C1 → R → H → A0',saveSeeded:false,sceneCount:finalSave.visited.length,ending:finalSave.heartChoice,fieldReport:finalSave.fieldReport,reloads:6,focusContainment:true,russianShortcut:true,hudEnter:true,quotaRecovery:true,imageRetry:true,mobileEmulation:['844×390 touch, large text','390×844 map'],pageErrors:errors};
    if(artifacts)fs.writeFileSync(path.join(artifacts,'browser-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
