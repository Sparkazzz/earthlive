import handler from '../netlify/functions/api.mjs';
import assert from 'node:assert/strict';
const request=async(path)=>{const r=await handler(new Request('https://earthlive.test/api/'+path));assert.equal(r.status,200,path);return r.json();};
const results=await Promise.allSettled([
(async()=>{const d=await request('cameras');assert.ok(d.cameras.length>10);assert.ok(d.sources.every(s=>s.ok));const counts=d.sources;const c=d.cameras.find(c=>c.provider==='GeoNet');const h=await request('check?id='+encodeURIComponent(c.id));assert.equal(h.status,'reachable');return {test:'Official camera catalogues and image HEAD',counts,checked:h};})(),
(async()=>{const d=await request('weather?lat=51.5074&lon=-0.1278');assert.equal(typeof d.current.temperature_2m,'number');return {test:'Real weather API',time:d.current.time,timezone:d.timezone,temperature:d.current.temperature_2m};})(),
(async()=>{const d=await request('search?q=Tokyo');assert.ok(d.results.some(r=>r.country_code==='JP'));return {test:'Global geocoding',results:d.results.length};})(),
(async()=>{const d=await request('imagery');assert.match(d.date,/^\d{4}-\d{2}-\d{2}$/);const u=`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${d.id}/default/${d.date}/${d.matrix}/0/0/0.jpeg`;const r=await fetch(u,{signal:AbortSignal.timeout(18000)});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image/);return {test:'NASA metadata and actual satellite tile',date:d.date,bytes:(await r.arrayBuffer()).byteLength};})()
]);
for(const r of results)console.log(r.status==='fulfilled'?JSON.stringify(r.value):'FAIL '+r.reason.stack);if(results.some(r=>r.status==='rejected'))process.exitCode=1;
