const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
const rooms=vm.runInNewContext('('+code.match(/const hotspots=([\s\S]*?);\s*function save\(/)[1]+')');
const ranks=vm.runInNewContext('('+code.match(/const mysteryRanks=Object\.freeze\((\{[^\n]+\})\)/)[1]+')');
const anchors=vm.runInNewContext('('+code.match(/const sceneMagic=(\{[\s\S]*?\n  \};)/)[1].replace(/;$/,'')+')');
const aftermath=vm.runInNewContext('('+code.match(/const aftermath=(\{[\s\S]*?\n  \};)/)[1].replace(/;$/,'')+')');
const aftermathGoals=vm.runInNewContext('('+code.match(/const aftermathGoals=(\{[^\n]+\});/)[1]+')');
const motionBody=code.match(/function inspectionMotion\(id\)\{([\s\S]*?)\n  \}/)[1];
const motion=vm.runInNewContext(`(function(id){${motionBody}\n})`);
const sceneOrder=['ash','atrium','interface','memory','seam','carrier','b0','b1','c0','c1','r','center'];
assert.deepEqual(Object.keys(ranks),sceneOrder,'every playable scene has an ordered mystery depth');
assert.deepEqual(Object.keys(anchors),sceneOrder,'every playable scene has a local magic anchor');
assert.deepEqual(Object.keys(aftermath),sceneOrder,'every playable scene has a post-decision response');
for(const scene of sceneOrder){
  const level=ranks[scene];assert(Number.isInteger(level)&&level>=0&&level<=7,`${scene} has a valid depth`);
  assert(anchors[scene].length,`${scene} has at least one ambient signal`);
  for(const [x,y,color] of anchors[scene]){
    assert(x>=0&&x<=1600&&y>=0&&y<=900,`${scene} ambient anchor is inside the scene`);
    assert.match(color,/^#[0-9a-f]{6}$/i,`${scene} ambient color is explicit`);
    assert(rooms[scene].some(h=>Math.hypot(h.focus[0]-x,h.focus[1]-y)<280),`${scene} ambient hint belongs to a visible object`);
  }
  const response=aftermath[scene],object=rooms[scene].find(h=>h.id===response.id);
  assert(object&&object.kind!=='exit',`${scene} responds at an inspectable, visible object`);
  assert(Math.hypot(object.focus[0]-anchors[scene][0][0],object.focus[1]-anchors[scene][0][1])<280,`${scene} response belongs to its local magic anchor`);
  for(const mode of ['open','seal','bounded'])assert(response[mode]?.length>40,`${scene} reacts to ${mode}`);
  if(scene!=='center')assert(aftermathGoals[scene]?.length>20,`${scene} has a return-visit objective`);
}
assert(ranks.ash<ranks.atrium&&ranks.atrium<ranks.memory&&ranks.memory<ranks.seam&&ranks.seam<ranks.carrier&&ranks.carrier<ranks.b0&&ranks.b0<ranks.r&&ranks.r<ranks.center,'mystery deepens along the main route');
const kinds=new Set();let count=0;
for(const [scene,hotspots] of Object.entries(rooms))for(const h of hotspots){
  const kind=motion(h.id);assert(['spores','water','scan','growth','weave','resonance'].includes(kind),`${scene}/${h.id} has a motion response`);kinds.add(kind);count++;
}
assert(kinds.size>=5,'interactions use distinct material responses');
for(const [id,expected] of Object.entries({saltFilter:'scan',saltClock:'scan',heartReturn:'growth',saltToHollows:'growth',choirConsole:'weave',forestBridge:'growth',carrierResonator:'resonance',ashRoots:'spores',waterBasin:'water'}))assert.equal(motion(id),expected,`${id} uses its material response`);
assert.match(code,/function drawInspectionFrame\(\)/,'inspection effects render in the object close-up');
assert.match(code,/settings\.reduced\s*\?\s*\.58/,'reduced-motion keeps a still visual response');
console.log(`PASS: ${sceneOrder.length} local aftermaths, rising seven-step mystery, ${count} hotspot responses across ${kinds.size} motion types`);
