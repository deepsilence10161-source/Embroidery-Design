import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.env.WEB_ROOT||'dist/web'),port=Number(process.env.PORT||4173);
const mount=(process.env.MOUNT_PATH||'').replace(/\/$/,'');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,'http://preview').pathname);if(mount){if(pathname===mount){res.writeHead(302,{Location:mount+'/'});res.end();return}if(!pathname.startsWith(mount+'/'))throw Error('Not under mount');pathname=pathname.slice(mount.length)}let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep))throw Error('Invalid path');if((await stat(file)).isDirectory())file=path.join(file,'index.html');const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data)}catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found')}}).listen(port,'0.0.0.0',()=>console.log(`EmbroideryGuide website ready on 0.0.0.0:${port}`));
