// Hand the actual save from the prologue to chapter II; no fabricated milestones.
const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'cybermycelium-'));
const cases=[
  ['', 'listen','salt','bounded'],
  ['strength','seal','spores','open'],
  ['intellect','listen','salt','seal'],
  ['endurance','seal','spores','bounded'],
  ['agility','listen','salt','open'],
  ['sensitivity','seal','spores','seal'],
];
try{
  for(const [stat,ending,order,heart] of cases){
    const first=path.join(dir,'carrier.json'),last=path.join(dir,'complete.json');
    const env={...process.env,TEST_STAT:stat,TEST_ENDING:ending,TEST_BRANCH_ORDER:order,TEST_HEART:heart,TEST_LEGACY:''};
    for(const [file,extra] of [['smoke.cjs',{TEST_EXPORT:first,TEST_IMPORT:''}],['branches.cjs',{TEST_IMPORT:first,TEST_EXPORT:last}]]){
      const result=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:root,env:{...env,...extra},encoding:'utf8'});
      assert.equal(result.status,0,`${stat||'base'} / ${file}\n${result.stdout}\n${result.stderr}`);
    }
    const save=JSON.parse(fs.readFileSync(last,'utf8'));
    assert.equal(save.ending,ending);assert.equal(save.heartChoice,heart);
    assert.equal(save.fieldReport,true);assert.equal(save.scene,'ash');assert.equal(save.visited.length,12);
    if(stat)assert.equal(save.character.stats[stat],3);
    if(stat==='sensitivity')assert.equal(save.sampleMethod,'чтение без отбора');
    console.log(`PASS: new game → report, ${stat||'base'}, A2 ${ending}, ${order} first, H ${heart}, 12 visited scenes`);
  }
}finally{fs.rmSync(dir,{recursive:true,force:true})}
