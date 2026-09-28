const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'design/world-map.html'),'utf8');
const regions=vm.runInNewContext('('+html.match(/const regions=(\[[\s\S]*?\]);\s*const links=/)[1]+')');
const links=vm.runInNewContext('('+html.match(/const links=(\[[\s\S]*?\]);\s*const byId=/)[1]+')');
const ids=new Set(regions.map(r=>r.id));assert.equal(ids.size,regions.length);
for(const [a,b,type] of links){assert(ids.has(a)&&ids.has(b),`broken link ${a}-${b}`);assert(['main','secondary','core'].includes(type))}
const connected=start=>{const seen=new Set([start]),queue=[start];for(const id of queue)for(const [a,b] of links){const next=a===id?b:b===id?a:null;if(next&&!seen.has(next)){seen.add(next);queue.push(next)}}return seen};
for(const start of ['A0','B0','C0'])assert(connected(start).has('H'),`${start} cannot reach the center`);
for(const id of ['A0','A1','A2','X','T'])assert.equal(regions.find(r=>r.id===id).status,'Игра');
for(const id of ['R','H'])assert.equal(regions.find(r=>r.id===id).status,'Проект');
const map=fs.readFileSync(path.join(root,'WORLD_MAP.md'),'utf8');const concept=fs.readFileSync(path.join(root,'GAME_CONCEPT.md'),'utf8');
for(const r of regions){assert(map.includes(r.name),`missing from map: ${r.name}`);assert(concept.includes(r.id),`missing from concept: ${r.id}`)}
const core=fs.readFileSync(path.join(root,'CORE_LORE.md'),'utf8');assert.match(core,/квантовый процессор/);assert.match(core,/единый мыслящий планетарный организм/);assert.match(regions.find(r=>r.id==='H').description,/квантовый процессор/);
console.log(`PASS: ${regions.length} regions, ${links.length} links; three outer routes connect to the heart`);
