const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'design/world-map.html'),'utf8');
const rooms=vm.runInNewContext('('+code.match(/const hotspots=([\s\S]*?);\s*function save\(/)[1]+')');
const arrivals=vm.runInNewContext('('+code.match(/const arrivals=(\{[^\n]+\});\s*function nextScene/)[1]+')');
const regions=vm.runInNewContext('('+html.match(/const regions=(\[[\s\S]*?\]);\s*const links=/)[1]+')');
const links=vm.runInNewContext('('+html.match(/const links=(\[[\s\S]*?\]);\s*const byId=/)[1]+')');
const sceneNames=Object.keys(rooms),sceneSet=new Set(sceneNames);
assert.deepEqual(new Set(Object.keys(arrivals)),sceneSet,'the arrival graph covers every playable scene');
const pair=(a,b)=>[a,b].sort().join('::'),edges=new Set();
for(const [to,sources] of Object.entries(arrivals))for(const [from,point] of Object.entries(sources)){
  assert(sceneSet.has(from),`unknown arrival source ${from}`);
  assert(point[0]>=90&&point[0]<=1510&&point[1]>=625&&point[1]<=825,`${from} → ${to} arrives on the walkable floor`);
  assert(rooms[from].some(h=>h.kind==='exit')&&rooms[to].some(h=>h.kind==='exit'),`${from} ↔ ${to} has visible passage markers`);
  edges.add(pair(from,to));
}
const mapScene={A0:'ash',A1:'atrium',A2:'memory',X:'seam',T:'carrier',B0:'b0',B1:'b1',C0:'c0',C1:'c1',R:'r',H:'center'};
for(const [a,b] of links)assert(edges.has(pair(mapScene[a],mapScene[b])),`map link ${a}–${b} must exist in the playable arrival graph`);
const connected=start=>{const seen=new Set([start]),queue=[start];for(const id of queue)for(const edge of edges){const [a,b]=edge.split('::'),next=a===id?b:b===id?a:null;if(next&&!seen.has(next)){seen.add(next);queue.push(next)}}return seen};
for(const start of ['ash','b0','c0'])assert.equal(connected(start).size,sceneNames.length,`${start} reaches every playable scene`);
assert.equal(links.length,12,'the world map keeps all twelve major physical connections');
console.log(`PASS: ${sceneNames.length} playable scenes connected; all ${links.length} world-map links correspond to walkable, marked passages`);
