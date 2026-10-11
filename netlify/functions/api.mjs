import {catalogue,imagery,checkCamera,get,cached,coordinates} from '../../lib/data.mjs';
const json=(body,status=200,ttl=0)=>Response.json(body,{status,headers:{'Cache-Control':'public, max-age=0, must-revalidate','Netlify-CDN-Cache-Control':ttl?`public, s-maxage=${ttl}`:'no-store','X-Content-Type-Options':'nosniff'}});
export default async function handler(req) {
 if(req.method!=='GET') return json({error:'Metodo non consentito'},405);
 const u=new URL(req.url),action=u.pathname.split('/').pop(),p=u.searchParams;
 try {
  if(action==='cameras') return json(await catalogue(),200,300);
  if(action==='imagery') return json(await imagery(),200,3600);
  if(action==='check') return json(await checkCamera(p.get('id')),200,60);
  if(action==='weather') {
   let c;try{c=coordinates(p);}catch(e){return json({error:e.message},400);}
   const qs=new URLSearchParams({latitude:c.lat.toFixed(3),longitude:c.lon.toFixed(3),current:'temperature_2m,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m',timezone:'auto'});
   const data=await cached('weather:'+qs,300000,async()=>({...await get('https://api.open-meteo.com/v1/forecast?'+qs),fetchedAt:new Date().toISOString()}));
   return json({...data,source:'Open-Meteo',method:'Condizioni da modelli meteorologici, non misure dirette di una stazione',refreshSeconds:300},200,300);
  }
  if(action==='search') {
   const q=(p.get('q')||'').trim();if(q.length<2||q.length>100)return json({error:'Inserisci da 2 a 100 caratteri'},400);
   const query=new URLSearchParams({name:q,count:'8',language:'it',format:'json'});
   return json(await cached('search:'+q,86400000,()=>get('https://geocoding-api.open-meteo.com/v1/search?'+query)),200,86400);
  }
  return json({error:'Risorsa non trovata'},404);
 }catch(e){console.error('Provider error',action,e.message);return json({error:'La fonte esterna non risponde. Riprova tra poco.'},502);}
}
export const config={path:'/api/:action',method:['GET'],rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:90}};
