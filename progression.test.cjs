const assert=require('node:assert/strict'),P=require('./progression.js');
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
for(const [xp,level,current,required] of [[0,1,0,100],[99,1,99,100],[100,2,0,150],[249,2,149,150],[250,3,0,200],[450,4,0,250]])assert.deepEqual(P.levelInfo(xp),{level,current,required});
const p=P.normalize();assert.equal(P.buy(p,'rod'),false);assert.equal(P.sell(p,0,1),0);
for(let i=0;i<5;i++)P.capture(p,i);assert.equal(p.xp,345);assert.equal(p.level,3);assert.equal(p.gold,0);
assert.equal(P.sell(p,0,2),0);assert.equal(P.sell(p,0,-1),0);assert.equal(P.sell(p,9,1),0);
const before=P.stats(p);P.sell(p,3,1);assert.equal(P.stats(p).unique,before.unique);assert.equal(P.stats(p).total,before.total);assert.equal(p.gold,110);assert.equal(P.buy(p,'hook'),true);assert.equal(p.gold,10);assert.equal(p.goldEarned,110);
assert.equal(P.stats(p).score,10*5+75*5+110+100*2);assert.ok(P.stats(p).rarest.includes('Bagre-trovão'));
// Obtenha saldo por capturas/vendas, e compre todos os níveis reais.
for(let i=0;i<50;i++){P.capture(p,3);P.sell(p,3,1);}
for(const key of Object.keys(P.equipment)){
  while(P.price(p,key)!==null){const cost=P.price(p,key),gold=p.gold;assert.equal(P.buy(p,key),true);assert.equal(p.gold,gold-cost);}
  const gold=p.gold;assert.equal(P.buy(p,key),false);assert.equal(p.gold,gold);assert.equal(p.gear[key],3);
}
assert.deepEqual(P.effects(p),{damping:4.6,lossMultiplier:.64,barBonus:.045});
assert.equal(P.buy(p,'unknown'),false);
const store=memory();store.setItem(P.LEGACY,'[2,3,4]');let migrated=P.load(store).profile;assert.deepEqual(migrated.inventory,[2,3,4,0,0]);assert.equal(migrated.xp,550);assert.equal(migrated.gold,0);
P.save(store,migrated);store.setItem(P.KEY,'broken');assert.deepEqual(P.load(store).profile,migrated);
const repaired=P.normalize({inventory:[2,-1,'9',null,4],gear:{rod:99,hook:-1},gold:-4,xp:null,level:999});assert.deepEqual(repaired.inventory,[2,0,0,0,4]);assert.equal(repaired.gear.rod,3);assert.equal(repaired.level,1);
const paths=P.species.map(s=>{let pos=.52;const values=[];for(let n=0;n<1200;n++){const next=P.moveFish(s,pos,n/60,1/60);assert.ok(Math.abs(next-pos)<=s.maxSpeed/60+1e-10);assert.ok(next>.1&&next<.9);pos=next;if(n%60===0)values.push(pos.toFixed(3));}return values.join(',');});assert.equal(new Set(paths).size,5);
console.log('OK: preços, níveis máximos, saldo, efeitos, XP, estatísticas históricas, migração, backup e cinco trajetórias limitadas/distintas.');
