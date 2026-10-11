export function distance(a,b){const r=Math.PI/180;return 12742*Math.asin(Math.min(1,Math.sqrt(Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2)));}
