'use strict';
// Uma única janela nativa, com foco contido e rolagem interna.
const LagoaPanels=(()=>{
  const dialog=document.getElementById('panel-dialog'),title=document.getElementById('window-title');
  const labels={catalog:'Peixes da lagoa',inventory:'Inventário',shop:'Loja',loadout:'Equipamentos',ranking:'Ranking local',help:'Ajuda',debug:'Laboratório',sale:'Confirmar venda'};
  let current=null,opener=null;
  function signal(open){document.dispatchEvent(new CustomEvent('lagoa-panel',{detail:{open}}));}
  function open(id){
    if(!labels[id])return;
    if(!dialog.open)opener=document.activeElement;
    current=id;title.textContent=labels[id];
    document.querySelectorAll('[data-view]').forEach(view=>view.hidden=view.dataset.view!==id);
    document.getElementById('panel-scroll').scrollTop=0;
    if(!dialog.open)dialog.showModal();
    signal(true);document.getElementById(id==='sale'?'sale-cancel':'panel-close').focus();
  }
  function close(){dialog.close();}
  document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>open(button.dataset.open)));
  document.getElementById('panel-close').addEventListener('click',close);
  dialog.addEventListener('close',()=>{current=null;signal(false);opener?.focus();});
  dialog.addEventListener('cancel',e=>{if(current==='sale'){e.preventDefault();open('inventory');}});
  return {open,close};
})();
