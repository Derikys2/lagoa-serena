'use strict';
// Regras puras compartilhadas pelo navegador e pelos testes, sem dependências.
(function (root) {
  const ZONE = 'America/Sao_Paulo';
  const INTERVAL = 15 * 60 * 1000;
  const CACHE_KEY = 'lagoa-serena-weather-v1';
  const API = 'https://api.open-meteo.com/v1/forecast?latitude=-22.9068&longitude=-43.1729&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo&timeformat=unixtime&forecast_days=1';
  const periods = {day:'Dia', dusk:'Entardecer', night:'Noite'};
  const climates = {clear:'Céu limpo', cloudy:'Nublado', rain:'Chuva'};
  const timeFormat = new Intl.DateTimeFormat('pt-BR', {timeZone:ZONE, hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'});
  const dateFormat = new Intl.DateTimeFormat('pt-BR', {timeZone:ZONE, day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'});
  function periodAt(ms) {
    const hour = Number(timeFormat.formatToParts(new Date(ms)).find(p=>p.type==='hour').value);
    return hour >= 6 && hour < 17 ? 'day' : hour >= 17 && hour < 19 ? 'dusk' : 'night';
  }
  function weatherCode(code) {
    if ([0,1].includes(code)) return {weather:'clear',label:code===0?'Céu limpo':'Predominantemente limpo'};
    if ([2,3,45,48].includes(code)) return {weather:'cloudy',label:code>=45?'Neblina':code===2?'Parcialmente nublado':'Nublado'};
    if ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)) return {weather:'rain',label:code>=95?'Trovoadas':code<60?'Garoa':'Chuva'};
    // Neve é muito improvável no Rio, mas não é descrita como chuva.
    if ([71,73,75,77,85,86].includes(code)) return {weather:'cloudy',label:'Neve / precipitação gelada'};
    throw new Error('Código meteorológico desconhecido');
  }
  function parseWeather(data, fetchedAt) {
    const c=data?.current;
    if (!c || !Number.isFinite(c.temperature_2m) || c.temperature_2m < -60 || c.temperature_2m > 65 || !Number.isFinite(c.time) || c.time < 1577836800 || !Number.isInteger(c.weather_code)) throw new Error('Resposta meteorológica inválida');
    weatherCode(c.weather_code);
    return {code:c.weather_code, temperature:c.temperature_2m, observedAt:c.time*1000, fetchedAt};
  }
  function readCache(storage) {
    try {
      const c=JSON.parse(storage.getItem(CACHE_KEY));
      if(!c || !Number.isFinite(c.fetchedAt) || c.fetchedAt<=0 || !Number.isFinite(c.observedAt)) return null;
      return parseWeather({current:{weather_code:c.code,temperature_2m:c.temperature,time:c.observedAt/1000}},c.fetchedAt);
    } catch { return null; }
  }
  // Pesos relativos: zero significa que a espécie está indisponível.
  function weights(condition) {
    const {period:p,weather:w}=condition;
    return [p==='day'&&w==='clear'?65:40, w==='cloudy'||w==='rain'?45:25,
      p==='night'?35:0, p==='night'&&w==='rain'?28:0, p==='day'&&w==='clear'?22:0];
  }
  function pick(condition, random=Math.random, values=weights(condition)) {
    const sum=values.reduce((a,b)=>a+b,0);
    let value=Math.min(1-Number.EPSILON,Math.max(0,random()))*sum;
    for(let i=0;i<values.length;i++){value-=values[i];if(value<0)return i;}
    return 0;
  }
  function create({storage, fetcher, now=Date.now, onChange=()=>{}}) {
    let cache=readCache(storage), failed=false, busy=false, lastAttempt=-Infinity, debug=null;
    function snapshot() {
      const instant=now(), age=cache?instant-cache.fetchedAt:Infinity;
      const live=cache?weatherCode(cache.code):{weather:'clear',label:'Céu limpo'};
      return {...live, period:periodAt(instant), clock:timeFormat.format(new Date(instant)), temperature:cache?.temperature??null,
        fetchedAt:cache?.fetchedAt??null, observedAt:cache?.observedAt??null,
        source:!cache?'default':failed||age>=INTERVAL||age<0?'cache':'live', simulated:false,
        ...(debug?{...debug,label:climates[debug.weather],clock:{day:'12:00:00',dusk:'18:00:00',night:'22:00:00'}[debug.period],temperature:null,simulated:true}: {})};
    }
    async function refresh() {
      const instant=now();
      if(busy || instant-lastAttempt>=0 && instant-lastAttempt<INTERVAL) return;
      if(!failed&&cache&&instant-cache.fetchedAt>=0&&instant-cache.fetchedAt<INTERVAL) return;
      lastAttempt=instant;busy=true;
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),8000);
      try {
        const response=await fetcher(API,{signal:controller.signal,cache:'no-store'});
        if(!response.ok)throw new Error('HTTP '+response.status);
        const valid=parseWeather(await response.json(),now());
        cache=valid;failed=false;
        try{storage.setItem(CACHE_KEY,JSON.stringify(cache));}catch{/* Mantém também em memória. */}
      } catch {failed=true;} finally {clearTimeout(timer);busy=false;onChange(snapshot());}
    }
    function simulate(value) {
      debug=value&&periods[value.period]&&climates[value.weather]?{period:value.period,weather:value.weather}:null;
      onChange(snapshot());
    }
    return {snapshot,refresh,simulate};
  }
  const exported={ZONE,INTERVAL,CACHE_KEY,API,periods,climates,timeFormat,dateFormat,periodAt,weatherCode,parseWeather,readCache,weights,pick,create};
  if(typeof module!=='undefined'&&module.exports)module.exports=exported;else root.LagoaWorld=exported;
})(globalThis);
