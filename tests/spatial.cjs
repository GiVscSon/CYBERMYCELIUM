const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
const source=code.match(/const hotspots=([\s\S]*?);\s*function save\(/);
assert(source,'hotspot manifest missing');
const rooms=vm.runInNewContext('('+source[1]+')');
const ids=new Set();let count=0;
for(const [scene,hotspots] of Object.entries(rooms)){
  for(const h of hotspots){
    count++;
    assert(!ids.has(h.id),`duplicate interaction ${h.id}`);ids.add(h.id);
    const [left,top,right,bottom]=h.box,[x,y]=h.focus,[walkX,walkY]=h.go;
    assert(left>=0&&top>=0&&right<=1600&&bottom<=900&&left<right&&top<bottom,`${scene}/${h.id} has invalid hit area`);
    assert(x>=left&&x<=right&&y>=top&&y<=bottom,`${scene}/${h.id} visual focus misses hit area`);
    assert(walkX>=90&&walkX<=1510&&walkY>=625&&walkY<=825,`${scene}/${h.id} approach point is outside walkable plane`);
    if(h.kind==='exit')assert(h.sign,`${scene}/${h.id} exit has no persistent sign`);
  }
  for(let i=0;i<hotspots.length;i++)for(let j=i+1;j<hotspots.length;j++){
    const a=hotspots[i],b=hotspots[j];
    const overlap=Math.max(0,Math.min(a.box[2],b.box[2])-Math.max(a.box[0],b.box[0]))*Math.max(0,Math.min(a.box[3],b.box[3])-Math.max(a.box[1],b.box[1]));
    assert.equal(overlap,0,`${scene}: ${a.id} steals clicks from ${b.id}`);
  }
  assert(hotspots.some(h=>h.kind==='exit'),`${scene} has no visible exit`);
}
const seamReturn=rooms.seam.find(h=>h.id==='returnMemory');
assert(seamReturn, 'seam return passage missing');
assert(seamReturn.box[0]>=180 && seamReturn.box[1]>=520 && seamReturn.box[2]<=670 && seamReturn.box[3]<=690,
  'seam return passage must hit the visible stairs below the clock');
assert(seamReturn.focus[0]<=seamReturn.box[2] && seamReturn.focus[1]>=seamReturn.box[1],
  'seam return marker must sit on the stair hit area');
const seamHit=(x,y)=>rooms.seam.find(h=>x>=h.box[0]&&x<=h.box[2]&&y>=h.box[1]&&y<=h.box[3]);
assert.equal(seamHit(380,600)?.id,'returnMemory','visible stair point should activate return passage');
assert.notEqual(seamHit(90,630)?.id,'returnMemory','foreground at the left edge must not activate return passage');
console.log(`PASS: ${count} object and exit areas in ${Object.keys(rooms).length} scenes; no overlap, all focuses and approaches valid`);
