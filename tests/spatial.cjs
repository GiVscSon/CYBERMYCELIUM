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
  }
  for(let i=0;i<hotspots.length;i++)for(let j=i+1;j<hotspots.length;j++){
    const a=hotspots[i],b=hotspots[j];
    const overlap=Math.max(0,Math.min(a.box[2],b.box[2])-Math.max(a.box[0],b.box[0]))*Math.max(0,Math.min(a.box[3],b.box[3])-Math.max(a.box[1],b.box[1]));
    assert.equal(overlap,0,`${scene}: ${a.id} steals clicks from ${b.id}`);
  }
  assert(hotspots.some(h=>h.kind==='exit'),`${scene} has no visible exit`);
}
console.log(`PASS: ${count} object and exit areas in ${Object.keys(rooms).length} scenes; no overlap, all focuses and approaches valid`);
