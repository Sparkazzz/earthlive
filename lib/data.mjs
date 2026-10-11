import { XMLParser } from 'fast-xml-parser';
export const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/';
const cache = new Map();
export async function cached(key, ttl, loader) {
  const old = cache.get(key); if (old && old.expires > Date.now()) return old.value;
  const value = await loader(); cache.set(key, {value, expires:Date.now()+ttl});
  if(cache.size>200) cache.delete(cache.keys().next().value); return value;
}
export async function get(url, json=true) {
  const r = await fetch(url, {signal:AbortSignal.timeout(18000)});
  if(!r.ok) throw new Error(`Fonte non disponibile (${r.status})`);
  return json ? r.json() : r.text();
}
export function coordinates(params) {
  if (!params.has('lat') || !params.has('lon') || !params.get('lat').trim() || !params.get('lon').trim()) throw new Error('Coordinate mancanti');
  const lat=Number(params.get('lat')), lon=Number(params.get('lon'));
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) throw new Error('Coordinate non valide');
  return {lat,lon};
}
export function distance(a,b) {
  const r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLon=(b.lon-a.lon)*r;
  return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2)));
}
export function normalizeGeoNet(data) {
  const unique=new Map();
  for(const group of data) for(const f of group.features||[]) {
    const p=f.properties;
    // GeoNet's published feed uses latitude, longitude, despite its GeoJSON label.
    const [lat,lon]=f.geometry.coordinates;
    const image=new URL(p['latest-image-medium'],'https://images.geonet.org.nz/volcano/cameras/').href;
    if(new URL(image).hostname!=='images.geonet.org.nz') continue;
    unique.set(f.id,{id:`geonet:${f.id}`,name:p.title,lat,lon,type:'volcano',provider:'GeoNet',official:true,image,source:image,available:null,capturedLabel:p['latest-timestamp']?.trim(),cadence:'Immagine ogni 10 minuti',kind:'snapshot'});
  } return [...unique.values()];
}
export function normalizeTfl(data) {
  return data.map(f=>{
    const p=Object.fromEntries(f.additionalProperties.map(a=>[a.key,a.value]));
    return {id:`tfl:${f.id}`,name:f.commonName,lat:f.lat,lon:f.lon,type:'traffic',provider:'Transport for London',official:true,image:p.imageUrl,video:p.videoUrl,source:p.imageUrl,available:p.available==='true',capturedLabel:null,cadence:'Immagini e brevi clip aggiornate da TfL; non streaming continuo',kind:'snapshot'};
  }).filter(f=> f.image?.startsWith('https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/'));
}
export async function catalogue() {
  return cached('catalogue',300000,async()=>{
    const providers=[{name:'GeoNet',url:'https://images.geonet.org.nz/volcano/cameras/all.json',normalize:normalizeGeoNet},{name:'TfL',url:'https://api.tfl.gov.uk/Place/Type/JamCam',normalize:normalizeTfl}];
    const result=await Promise.allSettled(providers.map(async p=>p.normalize(await get(p.url))));
    return {cameras:result.flatMap(r=>r.status==='fulfilled'?r.value:[]),sources:result.map((r,i)=>({name:providers[i].name,ok:r.status==='fulfilled',count:r.status==='fulfilled'?r.value.length:0})),fetchedAt:new Date().toISOString(),coverage:'Londra (TfL) e Nuova Zelanda (GeoNet). Copertura mondiale non ancora disponibile.'};
  });
}
export async function imagery() {
 return cached('imagery',3600000,async()=>{
   const doc=new XMLParser({removeNSPrefix:true,ignoreAttributes:false}).parse(await get(GIBS+'1.0.0/WMTSCapabilities.xml',false));
   const layer=doc.Capabilities.Contents.Layer.find(l=>l.Identifier==='VIIRS_SNPP_CorrectedReflectance_TrueColor');
   const dim=Array.isArray(layer.Dimension)?layer.Dimension[0]:layer.Dimension;
   return {id:layer.Identifier,date:dim.Default,intervals:[dim.Value].flat(),matrix:layer.TileMatrixSetLink.TileMatrixSet,fetchedAt:new Date().toISOString()};
 });
}
export async function checkCamera(id) {
 const {cameras}=await catalogue(); const cam=cameras.find(c=>c.id===id);
 if(!cam) return {status:'unknown',message:'Webcam non presente nel catalogo'};
 return cached('check:'+id,60000,async()=>{
  try {
   const r=await fetch(cam.image,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(8000)});
   let imageOk=r.ok&&r.headers.get('content-type')?.startsWith('image/');
   if(r.ok&&!imageOk){const sample=await fetch(cam.image,{headers:{Range:'bytes=0-15'},redirect:'manual',signal:AbortSignal.timeout(8000)});const reader=sample.body?.getReader();const chunk=await reader?.read();await reader?.cancel();const b=chunk?.value;imageOk=sample.ok&&b?.[0]===255&&b?.[1]===216&&b?.[2]===255;}
   return {status:imageOk?'reachable':r.status===404||r.status===410?'unavailable':'unverified',httpStatus:r.status,checkedAt:new Date().toISOString(),fileModified:r.headers.get('last-modified'),note:'Raggiungibilità del file; non verifica di una diretta video o dell’orario di ripresa.'};
  }catch{return {status:'unverified',checkedAt:new Date().toISOString()};}
 });
}
