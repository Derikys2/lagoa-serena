'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const P = LagoaProgress;
  const species = P.species;
  const state = {phase:'welcome', attempts:0, index:0, time:0, wait:0, fish:0.52, bar:0.58, velocity:0, height:0.29, progress:0.35, caught:false, paused:false};
  let pointer=false, keyboard=false, last=0, sceneryTime=0, timeBank=0;
  const ctx=$('game').getContext('2d'), lake=$('lake').getContext('2d');
  const W = LagoaWorld;
  // O wrapper permite continuar mesmo quando acessar localStorage lança erro.
  const world = W.create({storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},fetcher:(...args)=>fetch(...args),onChange:renderWorld});
  let conditions = world.snapshot();
  const debugOptions=[];
  const economy=createEconomyUI({$,drawFish:fish,isSimulated:()=>conditions.simulated});
  function renderWorld() {
    conditions=world.snapshot();
    const c=conditions, weights=P.fishingWeights(W.weights(c),P.effects(economy.active())),sum=weights.reduce((a,b)=>a+b,0);
    $('world-clock').textContent=c.clock;
    $('world-condition').textContent=(c.simulated?'SIMULAÇÃO · ':'')+W.periods[c.period]+' · '+c.label+(c.temperature===null?'':' · '+Math.round(c.temperature)+' °C');
    $('scene-weather').textContent=W.periods[c.period]+' · '+c.label;
    $('weather-status').textContent=c.simulated?'SIMULAÇÃO':c.source==='default'?'Clima padrão · sem dados':c.source==='cache'?'Cache · detalhes em Ajuda':'Clima atualizado · detalhes em Ajuda';
    $('world-source').textContent=c.simulated?'Laboratório: progresso de teste separado do perfil real.':c.source==='default'?'Clima padrão: céu limpo. Sem dados válidos da API; o jogo continua offline.':(c.source==='cache'?'Cache / dados antigos — consulta indisponível ou atualização pendente. ':'Open-Meteo · ')+ 'Última atualização: '+W.dateFormat.format(new Date(c.fetchedAt))+' · Dados de '+W.dateFormat.format(new Date(c.observedAt));
    $('world-effects').textContent='Influência agora: '+(c.period==='day'&&c.weather==='clear'?'Lambari favorecido; Acará-dourado disponível. ':c.weather!=='clear'?'Carpa-jade favorecida. ':'Peixes comuns disponíveis. ')+(c.period==='night'?'Lúcio-lunar disponível. ':'')+(c.period==='night'&&c.weather==='rain'?'Bagre-trovão disponível. ':'');
    $('world-odds').textContent='Próximo lançamento: '+species.map((s,i)=>weights[i]?s.name+' '+Math.round(weights[i]/sum*100)+'%':null).filter(Boolean).join(' · ');
    debugOptions.forEach((option,i)=>option.disabled=!c.simulated||!weights[i]);
    $('debug-fish').disabled=!c.simulated;
    $('debug-quality').disabled=!c.simulated||['waiting','fishing'].includes(state.phase);
    if($('debug-fish').value!==''&&!weights[Number($('debug-fish').value)])$('debug-fish').value='';
  }
  if(new URLSearchParams(location.search).get('debug')==='1'){
    species.forEach((s,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=s.name;debugOptions.push(option);$('debug-fish').append(option);});
    $('debug-open').hidden=false;
    $('debug-quality').addEventListener('click',()=>{
      if(!world.snapshot().simulated||['waiting','fishing'].includes(state.phase))return;
      if(state.phase==='welcome'){$('welcome').hidden=true;state.phase='ready';}
      cast();bite();
      const ratio=Number($('debug-performance').value)/100;
      state.activeTime=10;state.insideTime=10*ratio;state.outsideTime=10-state.insideTime;
      state.progress=1;$('percent').textContent='100%';
      const roll=$('debug-roll').value;
      finish(true,roll==='0'?()=>0:roll==='0.99'?()=>.99:Math.random);
    });
    const apply=()=>{const previous=conditions.simulated;world.simulate($('debug-enabled').checked?{period:$('debug-period').value,weather:$('debug-weather').value}:null);if(previous!==conditions.simulated)economy.changeMode();};
    ['debug-enabled','debug-period','debug-weather'].forEach(id=>$(id).addEventListener('change',apply));
  }
  renderWorld();
  setInterval(renderWorld,1000);
  setInterval(()=>world.refresh(),W.INTERVAL);
  world.refresh();
  function fish(c,x,y,color,scale=1,flip=false) { c.save();c.translate(x,y);c.scale(flip?-scale:scale,scale);c.fillStyle=color;c.fillRect(-16,-7,25,14);c.fillRect(-10,-11,13,22);c.fillRect(-24,-10,7,20);c.fillRect(-18,-5,5,10);c.fillStyle='#ffffff66';c.fillRect(-9,-7,12,3);c.fillStyle='#163742';c.fillRect(3,-4,4,4);c.fillStyle='#fff4db';c.fillRect(4,-4,2,2);c.restore(); }
  function collection(){economy.render();}
  function release(){pointer=false;keyboard=false;$('hold').classList.remove('active');}
  function cast(){
    if(!['ready','result'].includes(state.phase))return;
    release();$('quality-result').hidden=true;$('quality-result').className='quality-result';state.phase='waiting';state.wait=1.3+Math.random()*1.2;state.time=0;state.progress=.35;
    state.conditions=Object.freeze({...world.snapshot()});
    state.profile=economy.active();const tackle=economy.beginAttempt();state.effects=Object.freeze(tackle.effects);state.used=tackle.used;
    state.index=W.pick(state.conditions,Math.random,P.fishingWeights(W.weights(state.conditions),state.effects));
    const forced=$('debug-fish').value;
    if(state.conditions.simulated&&forced!==''&&W.weights(state.conditions)[Number(forced)]>0)state.index=Number(forced);

    state.tutorial=!state.conditions.simulated&&state.attempts===0;if(!state.conditions.simulated)state.attempts++;
    $('cast-conditions').textContent=(state.conditions.simulated?'SIMULAÇÃO · ':'Lançamento · ')+W.periods[state.conditions.period]+' · '+state.conditions.label+' · '+state.conditions.clock+' · '+(P.tackle[state.used.bait]?.name||'Sem isca')+' — equipamento fixo nesta tentativa.';
    $('panel-title').textContent='Linha na água…';$('status').textContent='A boia está quietinha. Espere a mordida.';
    $('cast').disabled=true;$('hold').disabled=true;$('cast').textContent='Esperando a mordida…';$('percent').textContent='—';
  }
  function bite(){
    state.phase='fishing';state.time=0;state.activeTime=0;state.insideTime=0;state.outsideTime=0;state.fish=.52;state.bar=.58;state.velocity=0;
    state.height=(state.tutorial?.36:species[state.index].bar)+state.effects.barBonus;
    state.progress=.35;$('panel-title').textContent='Fisgou!';$('status').textContent='Mantenha o peixe dentro da barra verde.';
    $('hold').disabled=false;$('cast').textContent='Peixe na linha!';
  }
  function finish(success,random=Math.random){
    state.phase='result';state.caught=success;release();$('hold').disabled=true;$('cast').disabled=false;$('cast').textContent='Pescar novamente ↗';
    const s=species[state.index];$('panel-title').textContent=success?'Boa pescaria!':'Ele escapou…';
    if(success){
      state.performance=state.outsideTime===0&&state.activeTime>0?1:Math.min(1-Number.EPSILON,P.performance(state.insideTime,state.activeTime));
      state.quality=P.rollQuality(state.performance,random,state.effects.qualityShift||0);
      const reward=economy.captured(state.profile,state.index,state.quality),quality=P.qualities[state.quality];
      $('quality-result').hidden=false;$('quality-result').className='quality-result quality-'+state.quality+(state.quality>=3?' quality-celebrate':'');
      $('quality-result').textContent='Qualidade do exemplar: '+quality.name+' · '+P.performanceLabel(state.performance)+' do tempo dentro da barra. Base '+s.value+' + '+quality.bonus+'% = '+reward.value+' gold.';
      $('status').textContent=(state.conditions.simulated?'LABORATÓRIO · ':'')+s.name+' · Raridade da espécie: '+s.rarity+'. +1 no inventário e +'+reward.xp+' XP. Venda por '+reward.value+' gold.';
    }else $('status').textContent='Tudo bem! Solte um pouco antes de alcançar o peixe. Nenhum item ou XP perdido.';
  }
  function update(dt){
    if(state.paused||state.uiPaused)return;
    if(state.phase==='waiting'){state.wait-=dt;if(state.wait<=0)bite();}
    else if(state.phase==='fishing'){
      state.time+=dt;const s=state.tutorial?species[0]:species[state.index];
      const speed=state.effects.fishSpeed??1;state.fish=P.moveFish(s,state.fish,state.time*speed,dt*speed);
      const damping=state.effects.damping;
      const decay=Math.exp(-damping*dt),terminal=((pointer||keyboard)?-1.75:1.35)/3.1;
      state.velocity=state.velocity*decay+terminal*(1-decay);state.bar+=state.velocity*dt;
      const half=state.height/2;
      if(state.bar<half){state.bar=half;state.velocity=0;}
      if(state.bar>1-half){state.bar=1-half;state.velocity=0;}
      const inside=Math.abs(state.fish-state.bar)<=half-.025;
      const rate=inside?s.gain:-s.loss*state.effects.lossMultiplier;
      const untilEnd=inside?(1-state.progress)/rate:state.progress/-rate;
      const measured=Math.min(dt,Math.max(0,untilEnd));
      state.activeTime+=measured;if(inside)state.insideTime+=measured;else state.outsideTime+=measured;
      state.progress=Math.max(0,Math.min(1,state.progress+rate*dt));
      $('percent').textContent=Math.round(state.progress*100)+'%';
      if(state.progress>=1)finish(true);else if(state.progress<=0)finish(false);
    }
  }
  function drawGame(){const c=ctx;c.clearRect(0,0,230,390);c.fillStyle='#102930';c.beginPath();c.roundRect(48,8,104,374,15);c.fill();c.fillStyle='#244951';c.fillRect(59,20,82,350);for(let y=30;y<370;y+=25){c.fillStyle='#6f9e9b24';c.fillRect(60,y,80,1);c.fillStyle='#9abbab60';c.fillRect(60,y,7,1);}const active=state.phase==='fishing'||state.phase==='result';if(active){const h=state.height*350,by=20+state.bar*350-h/2,inside=Math.abs(state.fish-state.bar)<=state.height/2-.025;c.fillStyle=inside?'#afd99899':'#92bd8466';c.fillRect(62,by,76,h);c.strokeStyle=inside?'#d2f6ad':'#90b380';c.lineWidth=2;c.strokeRect(62,by,76,h);c.fillStyle='#dbf3b0';c.fillRect(93,by+h/2-2,14,4);fish(c,105,20+state.fish*350,state.phase==='result'&&state.caught?species[state.index].color:'#dce6c8',.9);}else{fish(c,105,182,'#6f9294',.9);c.fillStyle='#9bb3b4';c.font='10px Segoe UI';c.textAlign='center';c.fillText(state.phase==='waiting'?'Aguarde…':'Seu peixe vem aí',100,222);}c.fillStyle='#102930';c.beginPath();c.roundRect(164,20,12,350,6);c.fill();if(active){c.fillStyle=state.phase==='result'&&!state.caught?'#e49c86':'#c9eaa0';c.fillRect(166,368-state.progress*346,8,state.progress*346);}if(state.paused||state.uiPaused){c.fillStyle='#102730dd';c.fillRect(40,140,145,100);c.fillStyle='#f0eddc';c.font='16px Segoe UI';c.textAlign='center';c.fillText('Pausado',111,180);}}
  function drawLake(t){const c=lake;const sky=c.createLinearGradient(0,0,0,580);sky.addColorStop(0,'#aecabe');sky.addColorStop(.43,'#d4d9b0');sky.addColorStop(.44,'#5a9990');sky.addColorStop(1,'#235b69');c.fillStyle=sky;c.fillRect(0,0,900,580);c.fillStyle='#efdfaa';c.fillRect(615,58,58,58);c.fillStyle='#8baea2';c.beginPath();c.moveTo(0,235);c.lineTo(160,90);c.lineTo(275,187);c.lineTo(424,95);c.lineTo(600,238);c.fill();c.fillStyle='#6b978d';c.beginPath();c.moveTo(370,243);c.lineTo(650,135);c.lineTo(900,218);c.lineTo(900,260);c.fill();
    function tree(x,y,s){c.fillStyle='#365f56';c.fillRect(x-3*s,y,6*s,60*s);for(let j=0;j<4;j++){c.fillStyle=j%2?'#3b7261':'#447e69';c.fillRect(x-(12+j*8)*s,y+j*14*s,(24+j*16)*s,18*s);}}
    for(let i=0;i<15;i++)tree(i*73,177+(i%3)*12,.7+(i%4)*.1);c.fillStyle='#436e5b';c.fillRect(0,243,900,15);
    for(let i=0;i<45;i++){let x=(i*137)%930-30+Math.sin(t*.5+i)*7,y=274+(i*37)%298;c.fillStyle=i%3?'#b8d3b026':'#d5deb44a';c.fillRect(x,y,18+(i%5)*13,3);}
    c.fillStyle='#244e47';c.fillRect(0,475,260,105);c.fillRect(0,450,124,35);tree(35,300,2.4);tree(870,340,2.3);c.fillStyle='#263e39';c.fillRect(80,511,18,65);c.fillRect(308,511,15,64);c.fillStyle='#a98259';c.fillRect(42,481,310,35);for(let x=47;x<350;x+=30){c.fillStyle='#cdab72';c.fillRect(x,481,25,7);c.fillStyle='#785e48';c.fillRect(x+26,488,3,25);}c.fillStyle='#233e43';c.fillRect(236,448,17,35);c.fillRect(268,448,15,35);c.fillStyle='#d59564';c.fillRect(234,412,46,38);c.fillStyle='#e5ba85';c.fillRect(242,385,29,29);c.fillStyle='#43514a';c.fillRect(239,383,32,13);c.fillStyle='#dfc98d';c.fillRect(228,382,55,8);c.fillRect(241,369,29,16);c.fillStyle='#e5ba85';c.fillRect(278,420,24,10);c.strokeStyle='#573f31';c.lineWidth=4;c.beginPath();c.moveTo(290,426);c.lineTo(343,339);c.stroke();c.strokeStyle='#dde0b6aa';c.lineWidth=1;c.beginPath();c.moveTo(343,340);c.quadraticCurveTo(405,335,448,401);c.stroke();let bob=state.phase==='waiting'?Math.sin(t*6)*3:Math.sin(t*2)*2;c.strokeStyle='#bad8bb77';c.beginPath();c.ellipse(448,409+bob,18+Math.sin(t)*3,5,0,0,Math.PI*2);c.stroke();c.fillStyle='#f2e8c5';c.fillRect(444,397+bob,8,10);c.fillStyle='#df8b6f';c.fillRect(444,397+bob,8,5);
  }
  // Efeitos restritos ao cenário: o Canvas de captura permanece sempre legível.
  function drawWeather(t) {
    const c=lake,{period,weather}=conditions;
    if(period==='dusk') {c.fillStyle='#bd604c55';c.fillRect(0,0,900,580);}
    if(period==='night') {
      c.fillStyle='#061529bb';c.fillRect(0,0,900,580);
      c.fillStyle='#dfebcf';c.fillRect(615,58,48,48);c.fillStyle='#283a47';c.fillRect(633,52,36,38);
      if(weather==='clear')for(let i=0;i<28;i++){c.fillStyle='#e5f0d8aa';c.fillRect((i*131+40)%890,25+(i*31)%130,2,2);}
      const glow=c.createRadialGradient(313,463,2,313,463,95);glow.addColorStop(0,'#ffe3a54d');glow.addColorStop(1,'#ffe3a500');c.fillStyle=glow;c.fillRect(215,365,196,195);
      c.fillStyle='#e6c783';c.fillRect(309,450,10,17);c.fillStyle='#faf2bb';c.fillRect(311,453,6,10);
    }
    if(weather!=='clear'){
      c.fillStyle=weather==='rain'?'#233c5559':'#465c6933';c.fillRect(0,0,900,580);
      c.fillStyle=period==='night'?'#354757':'#9cacae';
      for(let i=0;i<7;i++){const x=(i*159+t*3)%1050-130,y=55+(i%3)*38;c.fillRect(x,y,140,24);c.fillRect(x+22,y-15,80,20);}
    }
    if(weather==='rain'){
      c.strokeStyle='#d7e7ed99';c.lineWidth=2;c.beginPath();
      for(let i=0;i<95;i++){const x=(i*97+t*75)%960-30,y=(i*53+t*300)%620-20;c.moveTo(x,y);c.lineTo(x-5,y+13);}c.stroke();
      c.strokeStyle='#d3e6db66';for(let i=0;i<12;i++){c.beginPath();c.ellipse(80+i*69,295+(i*41)%230,4+(t*9+i)%8,2,0,0,Math.PI*2);c.stroke();}
    }
  }
  $('start').addEventListener('click',()=>{$('welcome').hidden=true;state.phase='ready';$('cast').disabled=false;$('status').textContent='Clique em Pescar para lançar sua linha.';$('cast').focus();});$('cast').addEventListener('click',cast);
  for(const el of [$('hold'),$('game')]){el.addEventListener('pointerdown',e=>{if(state.phase!=='fishing'||state.uiPaused||e.button!==0)return;e.preventDefault();pointer=true;el.setPointerCapture(e.pointerId);$('hold').classList.add('active');});el.addEventListener('pointerup',()=>{pointer=false;$('hold').classList.remove('active');});el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',()=>{pointer=false;$('hold').classList.remove('active');});el.addEventListener('contextmenu',e=>e.preventDefault());}
  window.addEventListener('keydown',e=>{if(e.code!=='Space'||state.phase!=='fishing'||state.uiPaused)return;e.preventDefault();keyboard=true;$('hold').classList.add('active');});window.addEventListener('keyup',e=>{if(e.code==='Space'){keyboard=false;$('hold').classList.remove('active');}});window.addEventListener('blur',()=>{release();state.paused=true;timeBank=0;last=0;});window.addEventListener('focus',()=>{state.paused=false;last=0;});document.addEventListener('visibilitychange',()=>{release();state.paused=document.hidden;last=0;timeBank=0;});
  document.addEventListener('lagoa-panel',event=>{state.uiPaused=event.detail.open;release();timeBank=0;last=0;});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Relógio monotônico do requestAnimationFrame; física a 120 Hz, independente do FPS.
  // Um intervalo >250 ms é suspensão técnica: não inventamos entradas nesse período.
  function advance(elapsed){
    if(state.paused||state.uiPaused||elapsed>.25||elapsed<0){timeBank=0;return;}
    timeBank+=elapsed;
    const step=1/120;
    while(timeBank+1e-12>=step){update(step);timeBank-=step;}
    if(timeBank<0)timeBank=0;
  }
  function frame(now){const dt=last?(now-last)/1000:0;last=now;advance(dt);if(!state.paused)sceneryTime+=Math.min(dt,.25);drawGame();drawLake(reduced?0:sceneryTime);drawWeather(reduced?0:sceneryTime);requestAnimationFrame(frame);}collection();requestAnimationFrame(frame);
})();
