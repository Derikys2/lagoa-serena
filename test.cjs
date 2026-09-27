// Integração da lógica real de jogo e UI, com DOM/Canvas simulados.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const W=require('./world.js'),P=require('./progression.js');
const source=fs.readFileSync(__dirname+'/game.js','utf8').replace('collection();requestAnimationFrame(frame);','collection();globalThis.test={state,cast,bite,update,advance,release,collection,economy,setInput:v=>keyboard=v};');
function setup(saved=null,blocked=false,session=new Map()){
  const events={},elements={},store=new Map();if(saved)store.set(Array.isArray(JSON.parse(saved))?P.LEGACY:P.KEY,saved);
  let condition={period:'day',weather:'clear',clock:'12:00:00',label:'Céu limpo',temperature:null,source:'default',simulated:false},pick=0;
  const context=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
  const element=()=>({textContent:'',value:'',hidden:false,children:[],events:{},classList:{add(){},remove(){}},getContext:()=>context,setAttribute(){},append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},focus(){},setPointerCapture(){},showModal(){this.open=true;},close(){this.open=false;},addEventListener(k,v){this.events[k]=v;}});
  for(const id of ['debug-roll','debug-performance'])elements[id]=element();
  const storage={getItem(k){if(blocked)throw Error();return store.get(k)??null;},setItem(k,v){if(blocked)throw Error();store.set(k,v);}};
  const testMath=Object.create(Math);testMath.random=()=>0;
  const env={console,Math:testMath,JSON,Number,Date,Object,URLSearchParams,location:{search:'?debug=1'},setInterval(){},LagoaProgress:P,LagoaWorld:{...W,pick:()=>pick,create:({onChange})=>({snapshot:()=>({...condition}),refresh(){},simulate(v){condition={...condition,...v,simulated:!!v};onChange();}})},localStorage:storage,sessionStorage:{getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v)},document:{getElementById:id=>elements[id]??=element(),createElement:element,addEventListener:(k,v)=>events['document:'+k]=v},window:{addEventListener:(k,v)=>events[k]=v},matchMedia:()=>({matches:false}),requestAnimationFrame(){}};
  vm.createContext(env);vm.runInContext(fs.readFileSync(__dirname+'/economy-ui.js','utf8'),env);vm.runInContext(source,env);
  return {api:env.test,elements,events,session,saved:()=>store.get(P.KEY),select:i=>pick=i,conditions(v){condition={...condition,...v};elements['debug-enabled'].checked=condition.simulated;elements['debug-period'].value=condition.period;elements['debug-weather'].value=condition.weather;elements['debug-enabled'].events.change();}};
}
function catchFish(run,index){
  const a=run.api;run.select(index);if(a.state.phase==='welcome')a.state.phase='ready';a.cast();a.update(3);assert.equal(a.state.phase,'fishing');
  for(let i=0;i<3600&&a.state.phase==='fishing';i++){a.setInput(a.state.bar+a.state.velocity*.19>a.state.fish);a.update(1/60);assert.ok(a.state.bar>=a.state.height/2&&a.state.bar<=1-a.state.height/2);}
  assert.equal(a.state.phase,'result');assert.equal(a.state.caught,true,'Captura possível: '+P.species[index].name);
}
const run=setup();for(let i=0;i<5;i++)catchFish(run,i);
assert.deepEqual(JSON.parse(run.saved()).inventory,[1,1,1,1,1]);assert.equal(JSON.parse(run.saved()).xp,345);assert.equal(JSON.parse(run.saved()).gold,0);
assert.equal(run.elements['level-reward'].hidden,false);
// Vender uma unidade pela UI.
run.elements['fish-list'].children[0].children[2].children[0].events.click();assert.equal(JSON.parse(run.saved()).gold,18);
// Vender todas: abrir, cancelar, reabrir e confirmar.
let all=run.elements['fish-list'].children[3].children[2].children[1];all.events.click();assert.equal(run.elements['sale-dialog'].open,true);run.elements['sale-cancel'].events.click();assert.equal(JSON.parse(run.saved()).inventory[3],1);
all.events.click();run.elements['sale-confirm'].events.click();assert.equal(JSON.parse(run.saved()).gold,128);
// Vender as outras espécies para financiar as três melhorias.
for(const i of [1,2,4])run.elements['fish-list'].children[i].children[2].children[0].events.click();assert.equal(JSON.parse(run.saved()).gold,293);
catchFish(run,0);run.elements['fish-list'].children[0].children[2].children[0].events.click();
for(let i=0;i<3;i++)run.elements['equipment-list'].children[i].children[3].events.click();
const saved=JSON.parse(run.saved());assert.deepEqual(saved.gear,{rod:1,hook:1,line:1});assert.equal(saved.gold,11);assert.equal(saved.goldEarned,311);assert.equal(saved.level,3);
const restored=setup(run.saved());assert.equal(JSON.parse(restored.saved()).xp,370);assert.deepEqual(JSON.parse(restored.saved()).gear,saved.gear);assert.equal(restored.elements.total.textContent,6);
run.api.cast();run.api.bite();run.api.release();for(let n=0;n<3600&&run.api.state.phase==='fishing';n++)run.api.update(1/60);assert.equal(run.api.state.caught,false);
run.api.cast();run.api.bite();const locked=run.api.state.effects;for(let i=0;i<3;i++)P.capture(run.api.economy.active(),3);P.sell(run.api.economy.active(),3,3);assert.equal(P.buy(run.api.economy.active(),'hook'),true);assert.equal(run.api.state.effects,locked);assert.notEqual(P.effects(run.api.economy.active()).lossMultiplier,locked.lossMultiplier);
run.events.blur();const before=run.api.state.progress;run.api.update(5);assert.equal(run.api.state.progress,before);run.events.focus();assert.equal(run.api.state.paused,false);
const frozen=run.api.state.index,castWeather=run.api.state.conditions.weather;run.conditions({period:'night',weather:'rain',simulated:true});run.api.update(1/60);assert.equal(run.api.state.index,frozen);assert.equal(run.api.state.conditions.weather,castWeather);
assert.equal(setup('{"inventory":[2,null,4]}').elements.total.textContent,6);assert.equal(setup('[2,3,4]').elements.total.textContent,9);assert.match(setup(null,true).elements['save-note'].textContent,/não permitiu/);
const sim=setup();const mainSave=sim.saved();sim.conditions({simulated:true,period:'night',weather:'rain'});sim.elements['debug-fish'].value='3';catchFish(sim,3);assert.equal(sim.saved(),mainSave);assert.equal(sim.api.economy.active().inventory[3],1);
sim.elements['debug-kit'].events.click();assert.equal(sim.api.economy.active().inventory[3],6);const sandboxXP=sim.api.economy.active().xp;
sim.api.cast();sim.api.bite();const simProfile=sim.api.state.profile;sim.conditions({simulated:false});assert.equal(sim.api.economy.active().xp,0);for(let n=0;n<3600&&sim.api.state.phase==='fishing';n++){const a=sim.api;a.setInput(a.state.bar+a.state.velocity*.19>a.state.fish);a.update(1/60);}assert.equal(sim.api.state.caught,true);assert.equal(sim.api.economy.active().xp,0);assert.equal(simProfile.xp,sandboxXP+120);const simReload=setup(null,false,sim.session);simReload.conditions({simulated:true});assert.equal(simReload.api.economy.active().xp,sandboxXP+120);
// As melhorias mudam a física usada pelo jogo, sem dispensar controle.
function prepared(gear){const r=setup(JSON.stringify(P.normalize({gear})));r.api.state.phase='ready';r.api.state.attempts=1;r.api.cast();r.api.bite();return r;}
const base=prepared({}),upgraded=prepared({rod:3,hook:3,line:3});base.api.setInput(true);upgraded.api.setInput(true);base.api.update(1/60);upgraded.api.update(1/60);assert.ok(Math.abs(upgraded.api.state.velocity)>Math.abs(base.api.state.velocity));assert.ok(upgraded.api.state.height>base.api.state.height);
base.api.state.bar=.9;upgraded.api.state.bar=.9;base.api.state.progress=.5;upgraded.api.state.progress=.5;base.api.update(1/60);upgraded.api.update(1/60);assert.ok(upgraded.api.state.progress>base.api.state.progress);
for(let index=0;index<5;index++){const idle=setup(JSON.stringify(P.normalize({gear:{rod:3,hook:3,line:3}})));idle.select(index);idle.api.state.phase='ready';idle.api.state.attempts=1;idle.api.cast();idle.api.bite();for(let f=0;f<7200&&idle.api.state.phase==='fishing';f++)idle.api.update(1/60);assert.equal(idle.api.state.caught,false,'Sem captura automática, espécie '+index);}
const input=prepared({});const preventDefault=()=>{};input.events.keydown({code:'Space',preventDefault});input.api.update(.1);assert.ok(input.api.state.velocity<0);input.events.keyup({code:'Space'});for(let n=0;n<20;n++)input.api.update(.02);assert.ok(input.api.state.velocity>0);input.elements.hold.events.pointerdown({button:0,pointerId:1,pointerType:'touch',preventDefault});for(let n=0;n<20;n++)input.api.update(.02);assert.ok(input.api.state.velocity<0);input.elements.hold.events.pointercancel();for(let n=0;n<20;n++)input.api.update(.02);assert.ok(input.api.state.velocity>0);
console.log('OK: 5 movimentos/capturas, XP/nível, venda unitária, confirmação/cancelamento, 3 compras, reload, fuga, pausa, migração e laboratório isolado.');
module.exports={setup};
