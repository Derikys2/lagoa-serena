'use strict';
(function (root) {
  // Ordem estável: corresponde às espécies e aos pesos de world.js e ao save antigo.
  const species = [
    {id:'lambari',name:'Lambari-sol',rarity:'Comum',rank:1,value:18,xp:25,color:'#ead17c',pattern:'Passeio suave',movement:'cruise',speed:.64,maxSpeed:.20,difficulty:'Fácil',bar:.32,gain:.20,loss:.10,hint:'Sempre disponível; prefere dia com céu limpo.'},
    {id:'carpa',name:'Carpa-jade',rarity:'Comum',rank:1,value:30,xp:40,color:'#8ed8ac',pattern:'Toques curtos e frequentes',movement:'twitch',speed:1.1,maxSpeed:.25,difficulty:'Moderada',bar:.29,gain:.18,loss:.11,hint:'Sempre disponível; prefere nuvens ou chuva.'},
    {id:'lucio',name:'Lúcio-lunar',rarity:'Raro',rank:3,value:85,xp:95,color:'#bbb1ea',pattern:'Subidas rápidas e descanso',movement:'dart',speed:1.1,maxSpeed:.34,difficulty:'Difícil',bar:.25,gain:.15,loss:.14,hint:'Somente à noite, em qualquer clima.'},
    {id:'bagre',name:'Bagre-trovão',rarity:'Raro',rank:3,value:110,xp:120,color:'#8ebedc',pattern:'Mergulhos e inversões',movement:'dive',speed:1.15,maxSpeed:.35,difficulty:'Difícil',bar:.25,gain:.15,loss:.145,hint:'Somente à noite com chuva ou garoa.'},
    {id:'acara',name:'Acará-dourado',rarity:'Incomum',rank:2,value:50,xp:65,color:'#f1b578',pattern:'Arcos amplos e regulares',movement:'wave',speed:.9,maxSpeed:.27,difficulty:'Intermediária',bar:.28,gain:.17,loss:.12,hint:'Somente de dia com céu limpo.'}
  ];
  const equipment = {
    rod:{name:'Vara',prices:[80,220,480],description:'Reduz a inércia: a barra reage mais depressa ao segurar e soltar, sem aumentar a velocidade máxima.'},
    hook:{name:'Anzol',prices:[100,260,550],description:'Reduz a perda de progresso fora da barra em 12% por nível (até 36%).'},
    line:{name:'Linha',prices:[120,300,620],description:'Aumenta a barra em 1,5 ponto percentual da pista por nível (até +4,5 pontos).'}
  };
  // Tipos equipáveis são independentes dos níveis de melhoria de equipment.hook.
  const tackle = {
    steady:{name:'Anzol equilibrado',slot:'hook',level:2,price:140,permanent:true,effect:{damping:.4},description:'A barra responde mais rápido ao segurar e soltar, sem aumentar a velocidade máxima. Permanente.'},
    keeper:{name:'Anzol de retenção',slot:'hook',level:4,price:240,permanent:true,effect:{lossMultiplier:.92},description:'Reduz em mais 8% a perda restante de progresso. Permanente.'},
    wide:{name:'Anzol largo',slot:'hook',level:6,price:360,permanent:true,effect:{barBonus:.01},description:'Aumenta a barra em 1 ponto percentual da pista. Permanente.'},
    worms:{name:'Minhoca',slot:'bait',level:2,price:8,permanent:false,effect:{speciesBoost:{0:1.15,1:1.2}},description:'Peso do Lambari +15% e da Carpa +20%. Consome 1 por lançamento.'},
    glow:{name:'Isca luminosa',slot:'bait',level:3,price:12,permanent:false,effect:{speciesBoost:{2:1.25,3:1.25}},description:'Peso de Lúcio e Bagre +25%, somente quando disponíveis. Consome 1 por lançamento.'},
    select:{name:'Isca seleta',slot:'bait',level:5,price:18,permanent:false,effect:{qualityShift:3},description:'Transfere 3 pontos de chance de Comum para a maior qualidade elegível até Épico. Não aumenta Lendário. Consome 1 por lançamento.'},
    calm:{name:'Isca calmante',slot:'bait',level:7,price:14,permanent:false,effect:{fishSpeed:.93},description:'Reduz o ritmo e a velocidade do peixe em 7%. Consome 1 por lançamento.'}
  };
  function grantUnlocks(p){
    const granted=[];
    for(const [id,item] of Object.entries(tackle))if(p.level>=item.level&&!p.unlocks[id]){
      p.unlocks[id]=true;p.items[id]=item.permanent?1:p.items[id]+1;
      p.pendingUnlocks.push(id);granted.push(id);
    }
    return granted;
  }
  function buyItem(p,id){
    const item=Object.hasOwn(tackle,id)?tackle[id]:null;
    if(!item||p.level<item.level||!p.unlocks[id]||p.gold<item.price||item.permanent&&p.items[id]>0)return false;
    p.gold-=item.price;p.goldSpent+=item.price;p.items[id]++;return true;
  }
  function equipItem(p,slot,id){
    if(!['hook','bait'].includes(slot))return false;
    if(id===null){p.equipped[slot]=null;return true;}
    const item=Object.hasOwn(tackle,id)?tackle[id]:null;
    if(!item||item.slot!==slot||!p.unlocks[id]||p.level<item.level||p.items[id]<1)return false;
    p.equipped[slot]=id;return true;
  }
  function beginAttempt(p){
    const applied=effects(p),used={...p.equipped};
    const id=used.bait;
    if(id&&p.items[id]>0){p.items[id]--;if(p.items[id]===0)p.equipped.bait=null;}
    return {effects:applied,used};
  }
  function fishingWeights(base,effect){return base.map((weight,i)=>weight*(effect.speciesBoost?.[i]??1));}
  // Cada exemplar entra em um único grupo fixo (espécie × qualidade).
  // Quantidades agrupadas preservam a qualidade individual sem IDs desnecessários.
  const qualities=[
    {name:'Comum',color:'#b6bec6',bonus:0},
    {name:'Incomum',color:'#8bd69a',bonus:10},
    {name:'Raro',color:'#80baff',bonus:25},
    {name:'Épico',color:'#c39aff',bonus:45},
    {name:'Lendário',color:'#f1cf70',bonus:75}
  ];
  function qualityWeights(ratio){
    if(ratio>=1)return [10,35,35,18,2];
    if(ratio>=.95)return [20,45,28,7,0];
    if(ratio>=.8)return [40,40,18,2,0];
    if(ratio>=.6)return [65,30,5,0,0];
    return [90,10,0,0,0];
  }
  function rollQuality(ratio,random=Math.random,shift=0){
    let roll=Math.min(1-Number.EPSILON,Math.max(0,random()))*100;
    const weights=qualityWeights(ratio);
    if(shift>0){const target=[3,2,1].find(i=>weights[i]>0);if(target){const amount=Math.min(3,shift,weights[0]);weights[0]-=amount;weights[target]+=amount;}}
    for(let i=0;i<weights.length;i++){roll-=weights[i];if(roll<0)return i;}
    return 0;
  }
  function performance(inside,active){return active>0?Math.max(0,Math.min(1,inside/active)):0;}
  function performanceLabel(ratio){return ratio>=1?'100%':(Math.floor(Math.max(0,ratio)*1000)/10).toFixed(1).replace('.',',')+'%';}
  function salePrice(index,quality=0){return species[index]&&qualities[quality]?Math.round(species[index].value*(100+qualities[quality].bonus)/100):0;}
  function saleTotal(p,index){return p.qualityInventory[index]?.reduce((total,n,q)=>total+n*salePrice(index,q),0)||0;}
  const KEY='lagoa-serena-progress-v2', BACKUP=KEY+'-backup', LEGACY='lagoa-serena-v1', SANDBOX='lagoa-serena-sandbox-v2';
  const integer=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1e9):0;
  const array=value=>species.map((_,i)=>integer(value?.[i]));
  const sum=a=>a.reduce((x,y)=>x+y,0);
  function levelInfo(xp) {
    xp=integer(xp);
    const completed=Math.max(0,Math.floor((-75+Math.sqrt(5625+100*xp))/50));
    const floor=25*completed*completed+75*completed;
    return {level:completed+1,current:xp-floor,required:100+50*completed};
  }
  function normalize(raw={}) {
    if(!raw||typeof raw!=='object'||Array.isArray(raw))raw={};
    const inventory=array(raw.inventory);
    const qualityInventory=species.map((_,i)=>{
      const groups=qualities.map((_,q)=>integer(raw.qualityInventory?.[i]?.[q]));
      // Totais antigos ou campos incompletos viram exemplares comuns, sem apagar os demais.
      groups[0]+=Math.max(0,inventory[i]-sum(groups));inventory[i]=sum(groups);return groups;
    });
    const catches=array(raw.catches).map((n,i)=>Math.max(n,inventory[i]));
    const gold=integer(raw.gold),xp=raw.xp===undefined?sum(catches.map((n,i)=>n*species[i].xp)):integer(raw.xp);
    const gear=Object.fromEntries(Object.keys(equipment).map(k=>[k,Math.min(3,integer(raw.gear?.[k]))]));
    const qualityCatches=qualities.map((_,q)=>Math.max(integer(raw.qualityCatches?.[q]),sum(qualityInventory.map(groups=>groups[q]))));
    qualityCatches[0]+=Math.max(0,sum(catches)-sum(qualityCatches));
    const items=Object.fromEntries(Object.entries(tackle).map(([id,t])=>[id,t.permanent?Math.min(1,integer(raw.items?.[id])):integer(raw.items?.[id])]));
    const unlocks=Object.fromEntries(Object.keys(tackle).map(id=>[id,raw.unlocks?.[id]===true||items[id]>0]));
    const pendingUnlocks=Array.isArray(raw.pendingUnlocks)?[...new Set(raw.pendingUnlocks.filter(id=>Object.hasOwn(tackle,id)))]:[];
    const p={version:4,inventory,qualityInventory,qualityCatches,catches,gold,xp,level:levelInfo(xp).level,gear,goldEarned:Math.max(gold,integer(raw.goldEarned)),goldSpent:integer(raw.goldSpent),items,unlocks,pendingUnlocks,equipped:{hook:null,bait:null}};
    grantUnlocks(p);
    for(const slot of ['hook','bait'])if(raw.equipped?.[slot])equipItem(p,slot,raw.equipped[slot]);
    return p;
  }
  function load(storage) {
    let notice='';
    try {
      for(const key of [KEY,BACKUP]){
        const text=storage.getItem(key);if(text===null)continue;
        try {const raw=JSON.parse(text);if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error();return {profile:normalize(raw),notice:key===BACKUP?'Salvamento recuperado da cópia de segurança.':notice};}
        catch {notice='Dados inválidos foram recuperados quando possível.';}
      }
      const old=JSON.parse(storage.getItem(LEGACY)||'null');
      if(Array.isArray(old))return {profile:normalize({inventory:old,catches:old}),notice:'Coleção anterior importada: peixes preservados e XP retroativo concedido.'};
      return {profile:normalize(),notice};
    } catch {return {profile:normalize(),notice:'Não foi possível ler o salvamento. O progresso continua nesta sessão.'};}
  }
  function save(storage,profile) {
    const text=JSON.stringify(profile);
    try {storage.setItem(KEY,text);try{storage.setItem(BACKUP,text);}catch{}return true;}catch{return false;}
  }
  function capture(p,index,quality=0) {
    const s=species[index];if(!s||!Number.isInteger(quality)||!qualities[quality])return null;
    const previous=levelInfo(p.xp).level;p.inventory[index]++;p.catches[index]++;p.xp+=s.xp;p.level=levelInfo(p.xp).level;
    p.qualityInventory[index][quality]++;p.qualityCatches[quality]++;
    return {xp:s.xp,level:p.level,leveled:p.level>previous,quality,value:salePrice(index,quality),unlocked:grantUnlocks(p)};
  }
  function sell(p,index,quantity,quality=null) {
    if(!species[index]||!Number.isSafeInteger(quantity)||quantity<1||quantity>p.inventory[index])return 0;
    if(quality!==null&&(!Number.isInteger(quality)||!qualities[quality]||p.qualityInventory[index][quality]<quantity))return 0;
    let gold=0,left=quantity;
    for(let q=0;q<qualities.length;q++){
      if(quality!==null&&q!==quality)continue;
      const sold=Math.min(left,p.qualityInventory[index][q]);gold+=sold*salePrice(index,q);p.qualityInventory[index][q]-=sold;left-=sold;
    }
    p.inventory[index]-=quantity;p.gold+=gold;p.goldEarned+=gold;return gold;
  }
  function price(p,key) {const item=equipment[key];return item?item.prices[p.gear[key]]??null:null;}
  function buy(p,key) {
    const cost=price(p,key);if(cost===null||p.gold<cost)return false;
    p.gold-=cost;p.goldSpent+=cost;p.gear[key]++;return true;
  }
  function effects(p) {
    const result={damping:3.1+.5*p.gear.rod,lossMultiplier:1-.12*p.gear.hook,barBonus:.015*p.gear.line};
    for(const slot of ['hook','bait']){
      const id=p.equipped?.[slot],item=Object.hasOwn(tackle,id)?tackle[id]:null;
      if(!item||!p.unlocks[id]||p.items[id]<1||p.level<item.level)continue;
      const e=item.effect;result.damping+=e.damping||0;result.lossMultiplier*=e.lossMultiplier??1;result.barBonus+=e.barBonus||0;
      if(e.speciesBoost)result.speciesBoost={...e.speciesBoost};if(e.qualityShift)result.qualityShift=e.qualityShift;if(e.fishSpeed)result.fishSpeed=e.fishSpeed;
    }
    return result;
  }
  function stats(p) {
    const total=sum(p.catches),unique=p.catches.filter(n=>n>0).length,rank=Math.max(0,...species.map((s,i)=>p.catches[i]?s.rank:0));
    return {total,unique,rarest:species.filter((s,i)=>p.catches[i]&&s.rank===rank).map(s=>s.name).join(' / ')||'Ainda nenhum',score:10*total+75*unique+p.goldEarned+100*(p.level-1)};
  }
  function target(s,seconds) {
    const t=seconds*s.speed;
    switch(s.movement){
      case 'twitch':return .50+Math.sin(t*.7)*.12+Math.sin(t*3.8)*.09;
      case 'dart': {const phase=t%6;return phase<1.2?.22:phase<2.7?.22+Math.sin(t*2)*.02:phase<4.8?.76:.52;}
      case 'dive': {const phase=t%7;return phase<1.8?.78:phase<3.1?.40:phase<4.6?.67:phase<6?.24:.46;}
      case 'wave':return .5+Math.sin(t)*.27;
      default:return .48+Math.sin(t)*.16;
    }
  }
  function moveFish(s,position,seconds,dt) {
    const delta=target(s,seconds)-position;
    return position+Math.sign(delta)*Math.min(Math.abs(delta),s.maxSpeed*dt);
  }
  const api={tackle,grantUnlocks,buyItem,equipItem,beginAttempt,fishingWeights,species,qualities,qualityWeights,rollQuality,performance,performanceLabel,salePrice,saleTotal,equipment,KEY,BACKUP,LEGACY,SANDBOX,normalize,load,save,levelInfo,capture,sell,price,buy,effects,stats,target,moveFish};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LagoaProgress=api;
})(globalThis);
