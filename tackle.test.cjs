const assert=require('node:assert/strict'),P=require('./progression.js'),W=require('./world.js');
const {setup}=require('./test.cjs');
const old={version:3,inventory:[1,2,3],xp:1350,gold:1000,gear:{rod:2,hook:3,line:1},catches:[4,5,6]};
const p=P.normalize(old);assert.equal(p.level,7);
for(const id of Object.keys(P.tackle)){assert.equal(p.items[id],1);assert.equal(p.unlocks[id],true);}
assert.equal(p.pendingUnlocks.length,7);assert.deepEqual(P.normalize(p),p);assert.equal(p.gold,1000);assert.deepEqual(p.inventory,[1,2,3,0,0]);
assert.equal(P.equipItem(p,'hook','keeper'),true);assert.equal(P.equipItem(p,'bait','glow'),true);
const e=P.effects(p);assert.ok(Math.abs(e.lossMultiplier-.64*.92)<1e-12);assert.equal(e.damping,4.1);assert.equal(e.barBonus,.015);
const first=P.beginAttempt(p);assert.equal(p.items.glow,0);assert.equal(p.items.keeper,1);assert.equal(p.equipped.bait,null);assert.deepEqual(first.effects.speciesBoost,{2:1.25,3:1.25});assert.equal(P.equipItem(p,'bait','glow'),false);
assert.equal(P.normalize(p).items.glow,0);assert.equal(P.buyItem(p,'glow'),true);assert.equal(p.gold,988);assert.equal(P.buyItem(p,'keeper'),false);
const locked=P.normalize();assert.equal(P.buyItem(locked,'glow'),false);assert.equal(P.equipItem(locked,'bait','glow'),false);
for(let n=0;n<4;n++)P.capture(locked,0);assert.equal(locked.level,2);assert.equal(locked.items.worms,1);assert.equal(locked.items.steady,1);assert.equal(P.grantUnlocks(locked).length,0);
// Subida atravessando mais de um nível: toda recompensa elegível é entregue uma vez.
const jump=P.normalize({xp:99});P.capture(jump,3);P.capture(jump,3);assert.equal(jump.level,3);assert.equal(jump.items.glow,1);assert.equal(jump.items.worms,1);
for(const period of ['day','dusk','night'])for(const weather of ['clear','cloudy','rain']){
  const c={period,weather},base=W.weights(c),boost=P.fishingWeights(base,first.effects);base.forEach((n,i)=>{if(n===0)assert.equal(boost[i],0);});
  for(let k=0;k<1000;k++)assert.ok(base[W.pick(c,()=>k/1000,boost)]>0);
}
assert.equal(P.rollQuality(.5,()=>.89,3),1);assert.equal(P.rollQuality(.999,()=>.999,3),3);assert.equal(P.rollQuality(1,()=>.999,3),4);assert.equal(P.rollQuality(1,()=>0,3),0);
const run=setup(JSON.stringify(p));const profile=run.api.economy.active();P.equipItem(profile,'bait','glow');const before=profile.items.glow;run.api.cast();assert.equal(profile.items.glow,before); // Tela inicial: nenhuma tentativa.
run.api.state.phase='ready';run.api.cast();assert.equal(profile.items.glow,before-1);run.api.cast();assert.equal(profile.items.glow,before-1); // Clique duplicado.
assert.deepEqual(run.api.state.effects.speciesBoost,{2:1.25,3:1.25});assert.equal(JSON.parse(run.saved()).items.glow,0);
const reload=setup(run.saved());assert.equal(reload.api.economy.active().items.glow,0);assert.equal(reload.api.economy.active().equipped.bait,null);assert.equal(reload.api.economy.active().gear.hook,3);
P.equipItem(profile,'hook','wide');assert.ok(Math.abs(run.api.state.effects.lossMultiplier-.5888)<1e-12); // Efeito da tentativa não muda.
run.api.bite();run.api.update(.1);const elapsed=run.api.state.activeTime;run.events['document:lagoa-panel']({detail:{open:true}});run.api.advance(.2);assert.equal(run.api.state.activeTime,elapsed);run.events.keydown({code:'Space',preventDefault(){throw Error('Espaço não deve controlar pescaria atrás da janela');}});run.events['document:lagoa-panel']({detail:{open:false}});run.api.advance(.1);assert.ok(run.api.state.activeTime>elapsed);
const multi=P.normalize();multi.xp=1340;P.capture(multi,3);assert.equal(multi.level,7);assert.equal(multi.pendingUnlocks.length,7);assert.equal(P.grantUnlocks(multi).length,0);
console.log('OK: migração, todos os desbloqueios, recompensa única, compra, equipamento, consumo no lançamento, snapshots, probabilidades e recarga.');
