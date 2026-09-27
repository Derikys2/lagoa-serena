const assert=require('node:assert/strict'),P=require('./progression.js');
const {setup}=require('./test.cjs');
for(const ratio of [0,.599999,.6,.799999,.8,.949999,.95,.999999,1]){
  const hits=[0,0,0,0,0];
  for(let i=0;i<10000;i++)hits[P.rollQuality(ratio,()=>i/10000)]++;
  assert.deepEqual(hits,P.qualityWeights(ratio).map(n=>n*100));
  if(ratio<1)assert.equal(hits[4],0);
}
assert.equal(P.rollQuality(1,()=>0),0);assert.equal(P.rollQuality(1,()=>.99),4);
assert.equal(P.performanceLabel(.999999),'99,9%');assert.equal(P.performanceLabel(1),'100%');
const p=P.normalize({version:2,inventory:[3,2,1],catches:[5,2,2],gold:70,xp:300,gear:{rod:2},goldEarned:100});
assert.deepEqual(p.qualityInventory,[[3,0,0,0,0],[2,0,0,0,0],[1,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]);assert.equal(p.gold,70);assert.equal(p.xp,300);assert.equal(p.gear.rod,2);assert.deepEqual(p.qualityCatches,[9,0,0,0,0]);
assert.deepEqual(P.normalize(p),p);
const mixed=P.normalize();[0,1,2,3,4].forEach(q=>P.capture(mixed,0,q));assert.deepEqual(mixed.qualityInventory[0],[1,1,1,1,1]);
assert.equal(P.saleTotal(mixed,0),18+20+23+26+32);assert.equal(mixed.gold,0);assert.equal(mixed.xp,125);
assert.equal(P.sell(mixed,0,1,3),26);assert.equal(P.sell(mixed,0,1,3),0);assert.equal(P.sell(mixed,0,4),93);assert.equal(mixed.gold,119);assert.equal(mixed.goldEarned,119);assert.deepEqual(mixed.qualityCatches,[1,1,1,1,1]);
assert.equal(P.salePrice(3,4),193); // Arredondamento por exemplar, não pelo lote.
P.capture(mixed,3,4);P.capture(mixed,3,4);assert.equal(P.saleTotal(mixed,3),386);
const bytes=JSON.stringify(mixed);assert.deepEqual(P.normalize(JSON.parse(bytes)),mixed);
// O botão de depuração usa a mesma conclusão de captura, isolada no laboratório.
const run=setup(),main=run.saved();run.conditions({simulated:true,period:'day',weather:'clear'});run.elements['debug-fish'].value='0';run.elements['debug-roll'].value='0.99';
for(const [percent,quality] of [[50,1],[85,3],[100,4]]){
  run.elements['debug-performance'].value=String(percent);run.elements['debug-quality'].events.click();
  assert.equal(run.api.state.quality,quality);assert.equal(run.api.state.performance,percent/100);assert.ok(run.elements['quality-result'].textContent.includes(P.qualities[quality].name));
}
assert.equal(run.saved(),main);assert.deepEqual(run.api.economy.active().qualityInventory[0],[0,1,0,1,1]);
run.elements['fish-list'].children[0].children[2].children[1].events.click();assert.ok(run.elements['sale-summary'].textContent.includes('78 gold'));run.elements['sale-cancel'].events.click();assert.equal(run.api.economy.active().gold,0);
run.elements['fish-list'].children[0].children[2].children[1].events.click();run.elements['sale-confirm'].events.click();assert.equal(run.api.economy.active().gold,78);assert.equal(run.api.economy.active().inventory[0],0);
run.elements['debug-performance'].value='100';run.elements['debug-quality'].events.click();
const reload=setup(null,false,run.session);reload.conditions({simulated:true});assert.equal(reload.api.economy.active().gold,78);assert.deepEqual(reload.api.economy.active().qualityInventory[0],[0,0,0,0,1]);assert.equal(reload.api.economy.active().qualityCatches[4],2);
// A mesma entrada constante, com 10/30/60/144 FPS, percorre passos idênticos.
const measurements=[];
for(const fps of [10,30,60,144]){
  const r=setup();r.api.state.phase='ready';r.api.cast();r.api.bite();
  for(let i=0;i<9*fps;i++)r.api.advance(1/fps);
  measurements.push([r.api.state.activeTime,r.api.state.insideTime,r.api.state.outsideTime]);
}
measurements.forEach(v=>v.forEach((n,i)=>assert.ok(Math.abs(n-measurements[0][i])<1e-9)));
const paused=setup();paused.api.state.phase='ready';paused.api.cast();paused.api.bite();paused.api.advance(.1);const measured=paused.api.state.activeTime;paused.events.blur();paused.api.advance(20);assert.equal(paused.api.state.activeTime,measured);paused.events.focus();paused.api.advance(5);assert.equal(paused.api.state.activeTime,measured);paused.api.advance(.1);assert.ok(Math.abs(paused.api.state.activeTime-measured-.1)<1e-9);
console.log('OK: faixas/probabilidades, qualidade independente, migração, vendas mistas, arredondamento, debug, recarga, FPS e pausas.');
