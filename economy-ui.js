'use strict';
// Interface da economia; regras e validações permanecem em progression.js.
function createEconomyUI({$,drawFish,isSimulated}) {
  const P=LagoaProgress;
  const storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)};
  const loaded=P.load(storage);
  let real=loaded.profile, sandbox;
  let saveOK=P.save(storage,real), notice=loaded.notice, pending=null;
  try {sandbox=P.normalize(JSON.parse(sessionStorage.getItem(P.SANDBOX)||'{}'));}catch{sandbox=P.normalize();}
  const active=()=>isSimulated()?sandbox:real;
  function persist(profile) {
    if(profile===real)saveOK=P.save(storage,real);
    else try{sessionStorage.setItem(P.SANDBOX,JSON.stringify(sandbox));}catch{notice='O laboratório continuará apenas até esta página ser fechada.';}
  }
  function message(text){$('economy-message').textContent=text;}
  function saleOpen(){if(typeof LagoaPanels!=='undefined')LagoaPanels.open('sale');else $('sale-dialog').showModal();}
  function saleClose(){if(typeof LagoaPanels!=='undefined')LagoaPanels.open('inventory');else $('sale-dialog').close();}
  function button(text,fn,disabled=false){const b=document.createElement('button');b.textContent=text;b.disabled=disabled;b.addEventListener('click',fn);return b;}
  function sell(profile,index,quantity,quality=null){const gold=P.sell(profile,index,quantity,quality);if(!gold)return;persist(profile);message('Venda concluída: +'+gold+' gold.');render();}
  function requestSale(index){
    const profile=active(),quantity=profile.inventory[index];if(!quantity)return;
    pending={profile,index,quantity,groups:JSON.stringify(profile.qualityInventory[index])};
    $('sale-summary').textContent='Vender '+quantity+' × '+P.species[index].name+' por '+P.saleTotal(profile,index)+' gold? '+profile.qualityInventory[index].map((n,q)=>n?n+' × qualidade '+P.qualities[q].name+' ('+n*P.salePrice(index,q)+' gold)':null).filter(Boolean).join(' · ')+(isSimulated()?' (Somente laboratório.)':'');
    saleOpen();$('sale-cancel').focus();
  }
  $('sale-cancel').addEventListener('click',()=>{saleClose();pending=null;});
  $('sale-dialog').addEventListener('cancel',()=>{pending=null;});
  $('sale-confirm').addEventListener('click',()=>{
    const sale=pending;pending=null;saleClose();
    if(sale&&sale.profile===active()&&sale.profile.inventory[sale.index]===sale.quantity&&JSON.stringify(sale.profile.qualityInventory[sale.index])===sale.groups)sell(sale.profile,sale.index,sale.quantity);
    else message('O inventário mudou. Confira a quantidade e tente novamente.');
  });
  $('unlock-dismiss').addEventListener('click',()=>{const p=active();p.pendingUnlocks=[];persist(p);render();});
  function renderItems(p){
    const names=p.pendingUnlocks.map(id=>P.tackle[id].name);
    $('unlock-notice').hidden=!names.length;$('unlock-text').textContent='Novo item grátis: '+names.join(', ')+'. Abra Equipamentos para usar.';
    $('tackle-shop').replaceChildren();
    for(const [id,item] of Object.entries(P.tackle)){
      const card=document.createElement('article');card.className='equipment-card';
      const title=document.createElement('h3');title.textContent=item.name;
      const description=document.createElement('p');description.textContent=item.description;
      const owned=document.createElement('p');owned.textContent='Nível '+item.level+' · '+item.price+' gold · Possui: '+p.items[id]+' · '+(item.permanent?'Permanente':'Consumível');
      const locked=p.level<item.level;
      card.append(title,description,owned,button(locked?'Bloqueado · nível '+item.level:item.permanent&&p.items[id]?'Já possui':'Comprar '+item.name+' · '+item.price+' gold',()=>{if(P.buyItem(active(),id)){persist(active());message(item.name+' comprado. Equipe em Equipamentos.');render();}},locked||p.gold<item.price||item.permanent&&p.items[id]>0));
      $('tackle-shop').append(card);
    }
    $('loadout-list').replaceChildren();
    for(const slot of ['hook','bait']){
      const label=document.createElement('label');label.textContent=slot==='hook'?'Tipo de anzol (permanente)':'Isca (1 por lançamento)';
      const select=document.createElement('select');select.id='equip-'+slot;
      const empty=document.createElement('option');empty.value='';empty.textContent=slot==='hook'?'Anzol simples — sem bônus extra':'Sem isca';select.append(empty);
      for(const [id,item] of Object.entries(P.tackle))if(item.slot===slot){const option=document.createElement('option');option.value=id;option.textContent=item.name+' · '+p.items[id]+' un. · nível '+item.level;option.disabled=p.level<item.level||p.items[id]<1;select.append(option);}
      select.value=p.equipped[slot]||'';select.addEventListener('change',()=>{if(P.equipItem(active(),slot,select.value||null)){persist(active());message('Equipamento definido para a próxima pescaria.');render();}});label.append(select);$('loadout-list').append(label);
    }
    const e=P.effects(p),hook=P.tackle[p.equipped.hook],bait=P.tackle[p.equipped.bait];
    $('loadout-summary').textContent=(hook?.name||'Anzol simples')+' · '+(bait?bait.name+' × '+p.items[p.equipped.bait]:'Sem isca');
    $('active-effects').textContent='Próximo lançamento: resposta '+Math.round((e.damping/3.1-1)*100)+'% maior; perda reduzida em '+Math.round((1-e.lossMultiplier)*100)+'%; barra +'+(e.barBonus*100).toFixed(1)+' pontos. '+(hook?hook.description:'')+' '+(bait?bait.description:'Sem bônus de isca.');
    $('catalog-list').replaceChildren();
    P.species.forEach((s,i)=>{const card=document.createElement('article');card.className='equipment-card';const title=document.createElement('h3');title.textContent=s.name;const info=document.createElement('p');info.textContent='Raridade: '+s.rarity+' · '+s.pattern+' · '+s.xp+' XP · Base '+s.value+' gold';const hint=document.createElement('p');hint.textContent=s.hint+' Histórico: '+p.catches[i]+'.';card.append(title,info,hint);$('catalog-list').append(card);});
  }
  function render(){
    const p=active(),sim=isSimulated(),level=P.levelInfo(p.xp),stats=P.stats(p);
    $('economy-mode').textContent=sim?'LABORATÓRIO · inventário, gold e XP de teste':'SEU PROGRESSO · salvo neste navegador';
    $('gold').textContent=p.gold+' gold';$('shop-gold').textContent=p.gold+' gold';$('player-level').textContent='Nível '+level.level;
    $('xp-label').textContent=level.current+' / '+level.required+' XP para o próximo nível';
    $('xp-bar').max=level.required;$('xp-bar').value=level.current;
    $('total').textContent=stats.total;$('discovered').textContent=stats.unique+' / '+P.species.length+' espécies descobertas';
    $('gear-summary').textContent='Vara '+p.gear.rod+' · Anzol '+p.gear.hook+' · Linha '+p.gear.line+' — melhorias aplicadas no próximo lançamento.';
    $('fish-list').replaceChildren();
    P.species.forEach((s,i)=>{
      const card=document.createElement('article');card.className='fish-card inventory-card';
      const icon=document.createElement('canvas');icon.width=80;icon.height=50;icon.setAttribute('aria-hidden','true');drawFish(icon.getContext('2d'),46,25,p.catches[i]?s.color:'#637e83',1.15);
      const body=document.createElement('div'),title=document.createElement('h3');title.textContent=s.name;
      const info=document.createElement('p');info.textContent='Raridade da espécie: '+s.rarity+' · Base: '+s.value+' gold · '+s.xp+' XP / captura';
      const detail=document.createElement('p');detail.textContent=s.pattern+' · '+s.difficulty;
      const hint=document.createElement('p');hint.className='species-hint';hint.textContent=s.hint;
      const count=document.createElement('p');count.className='inventory-count';count.textContent=p.inventory[i]+' no inventário · '+p.catches[i]+' capturados ao todo';
      const actions=document.createElement('div');actions.className='sale-actions';
      const lowest=Math.max(0,p.qualityInventory[i].findIndex(n=>n>0));
      actions.append(button('Vender 1 '+P.qualities[lowest].name+' · '+P.salePrice(i,lowest)+' gold',()=>sell(active(),i,1,lowest),!p.inventory[i]),button('Vender todos ('+p.inventory[i]+')',()=>requestSale(i),!p.inventory[i]));
      const groups=document.createElement('div');groups.className='quality-groups';
      P.qualities.forEach((quality,q)=>{
        const amount=p.qualityInventory[i][q];if(!amount)return;
        const row=document.createElement('div');row.className='quality-row';
        const badge=document.createElement('span');badge.className='quality-badge quality-'+q;badge.textContent='Qualidade '+quality.name+' × '+amount;
        const price=document.createElement('p');price.textContent='Base '+s.value+' + '+quality.bonus+'% = '+P.salePrice(i,q)+' gold / un.';
        row.append(badge,price,button('Vender 1 de qualidade '+quality.name,()=>sell(active(),i,1,q)));groups.append(row);
      });
      body.append(title,info,detail,hint,count);card.append(icon,body,actions,groups);$('fish-list').append(card);
    });
    $('equipment-list').replaceChildren();
    for(const [key,item] of Object.entries(P.equipment)){
      const card=document.createElement('article');card.className='equipment-card';
      const title=document.createElement('h3');title.textContent='Melhoria de '+item.name+' · nível '+p.gear[key]+' / 3';
      const detail=document.createElement('p');detail.textContent=item.description;
      const price=P.price(p,key),buy=button(price===null?'Nível máximo': 'Melhorar '+item.name+' · '+price+' gold',()=>{
        const profile=active();if(P.buy(profile,key)){persist(profile);message(item.name+' melhorada para o nível '+profile.gear[key]+'. Válida no próximo lançamento.');render();}
      },price===null||p.gold<price);
      const base=P.effects({...p,equipped:{hook:null,bait:null}});
      const effect=document.createElement('p');effect.className='species-hint';effect.textContent=key==='rod'?'Resposta: +'+Math.round((base.damping/3.1-1)*100)+'%':key==='hook'?'Perda reduzida em '+Math.round((1-base.lossMultiplier)*100)+'%':'Barra: +'+(base.barBonus*100).toFixed(1).replace('.',',')+' pontos percentuais';
      card.append(title,detail,effect,buy);$('equipment-list').append(card);
    }
    $('rank-score').textContent=stats.score+' pontos';
    $('rank-captures').textContent=stats.total;$('rank-species').textContent=stats.unique+' / '+P.species.length;
    $('rank-rarest').textContent=stats.rarest;$('rank-gold').textContent=p.goldEarned+' gold';$('rank-level').textContent=p.level;
    $('rank-quality').textContent=p.qualityCatches[4]+' capturas de qualidade Lendário (histórico)';
    $('rank-mode').textContent=sim?'Prévia do ranking de teste — não entra no progresso real.':'Ranking local · 1 perfil neste navegador · sem jogadores online';
    $('save-note').textContent=sim?'Laboratório separado, salvo nesta aba. Desativar a simulação restaura seu progresso real.':!saveOK?'O navegador não permitiu salvar. Progresso disponível apenas nesta sessão.':notice||'Inventário, gold, XP, equipamentos e estatísticas salvos automaticamente neste navegador.';
    $('debug-kit').disabled=!sim;renderItems(p);
  }
  function captured(profile,index,quality=0){
    const reward=P.capture(profile,index,quality);persist(profile);render();
    if(reward.leveled){$('level-reward').hidden=false;$('level-reward').textContent=(profile===sandbox?'LABORATÓRIO · ':'')+'✦ Novo nível: '+reward.level+'! Continue explorando a lagoa.';}
    return reward;
  }
  $('debug-kit').addEventListener('click',()=>{
    if(!isSimulated())return;
    for(let i=0;i<P.species.length;i++)for(let j=0;j<5;j++)P.capture(sandbox,i);
    persist(sandbox);message('Kit de teste: +5 peixes de cada espécie e o XP correspondente. Gold somente ao vender.');render();
  });
  function changeMode(){pending=null;if(typeof LagoaPanels==='undefined')$('sale-dialog').close();$('level-reward').hidden=true;message('');render();}
  function beginAttempt(){const p=active(),snapshot=P.beginAttempt(p);persist(p);render();return snapshot;}
  return {render,active,captured,changeMode,beginAttempt};
}
