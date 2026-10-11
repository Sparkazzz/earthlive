import {defineConfig} from 'vite';
import handler from './netlify/functions/api.mjs';
export default defineConfig({plugins:[{name:'local-api',configureServer(server){server.middlewares.use('/api',async(req,res)=>{const result=await handler(new Request('http://localhost/api'+req.url));res.statusCode=result.status;result.headers.forEach((v,k)=>res.setHeader(k,v));res.end(await result.text());});}}],build:{target:'es2022'}});
