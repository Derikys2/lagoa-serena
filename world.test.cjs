const assert=require('node:assert/strict');
const W=require('./world.js');
const stamp=Date.parse('2026-09-27T15:00:00Z');
const payload=(code=0)=>({current:{weather_code:code,temperature_2m:24,time:stamp/1000}});
const store=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
(async()=>{
  // Limites expressos em UTC: o teste independe do fuso do processo/computador.
  for(const [time,period] of [['08:59:59','night'],['09:00:00','day'],['19:59:59','day'],['20:00:00','dusk'],['21:59:59','dusk'],['22:00:00','night'],['02:00:00','night']])assert.equal(W.periodAt(Date.parse('2026-09-27T'+time+'Z')),period);
  assert.equal(W.timeFormat.format(new Date(stamp)),'12:00:00');
  for(const period of ['day','dusk','night'])for(const weather of ['clear','cloudy','rain']){
    const c={period,weather},weights=W.weights(c),hits=[0,0,0,0,0];
    for(let i=0;i<10000;i++)hits[W.pick(c,()=>i/10000)]++;
    weights.forEach((weight,i)=>assert.equal(hits[i]>0,weight>0));
    assert.equal(weights[2]>0,period==='night');assert.equal(weights[3]>0,period==='night'&&weather==='rain');assert.equal(weights[4]>0,period==='day'&&weather==='clear');assert.ok(weights[0]>0&&weights[1]>0);
    const sum=weights.reduce((a,b)=>a+b);weights.forEach((v,i)=>assert.ok(Math.abs(hits[i]/10000-v/sum)<.001));
  }
  [51,61,80,95].forEach(code=>assert.equal(W.weatherCode(code).weather,'rain'));
  assert.throws(()=>W.parseWeather(payload(999),stamp));assert.throws(()=>W.parseWeather({current:{}},stamp));
  let now=stamp,calls=0,fail=false,invalid=false;const storage=store();
  const world=W.create({storage,now:()=>now,fetcher:async()=>{calls++;if(fail)throw Error('offline');return {ok:true,json:async()=>invalid?{current:{}}:payload(61)};}});
  assert.equal(world.snapshot().source,'default');await world.refresh();assert.equal(calls,1);assert.equal(world.snapshot().weather,'rain');await world.refresh();assert.equal(calls,1);
  world.simulate({period:'night',weather:'clear'});assert.equal(world.snapshot().simulated,true);assert.equal(JSON.parse(storage.getItem(W.CACHE_KEY)).code,61);world.simulate(null);assert.equal(world.snapshot().weather,'rain');assert.equal(world.snapshot().simulated,false);
  now+=W.INTERVAL;fail=true;await world.refresh();assert.equal(world.snapshot().source,'cache');assert.equal(world.snapshot().weather,'rain');assert.equal(world.snapshot().fetchedAt,stamp);
  now+=W.INTERVAL;fail=false;invalid=true;await world.refresh();assert.equal(world.snapshot().weather,'rain');assert.equal(world.snapshot().source,'cache');
  now+=W.INTERVAL;invalid=false;await world.refresh();assert.equal(world.snapshot().source,'live');
  const restored=W.create({storage,now:()=>now,fetcher:async()=>{throw Error();}});assert.equal(restored.snapshot().weather,'rain');
  const blocked=W.create({storage:{getItem(){throw Error();},setItem(){throw Error();}},now:()=>now,fetcher:async()=>({ok:true,json:async()=>payload(3)})});await blocked.refresh();assert.equal(blocked.snapshot().weather,'cloudy');
  const offline=W.create({storage:store(),now:()=>now,fetcher:async()=>{throw Error();}});await offline.refresh();assert.equal(offline.snapshot().source,'default');assert.equal(offline.snapshot().weather,'clear');
  console.log('OK: fuso, limites de períodos, 9 combinações, pesos/sorteios, WMO, cache, falhas, recuperação e isolamento da simulação.');
})().catch(e=>{console.error(e);process.exitCode=1;});
