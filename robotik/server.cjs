'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT 1–65535 arasında tam ədəd olmalıdır.');
  process.exit(1);
}
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.mp4':'video/mp4'};
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache');
  const reply = (status, text) => {
    res.writeHead(status, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end(req.method === 'HEAD' ? undefined : text);
  };
  if (!['GET', 'HEAD'].includes(req.method)) {res.setHeader('Allow','GET, HEAD');return reply(405,'Method not allowed');}
  let pathname, url;
  try {url = new URL(req.url,'http://127.0.0.1');pathname = decodeURIComponent(url.pathname);} catch {return reply(400,'Invalid URL');}
  if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(p=>p.startsWith('.'))) return reply(403,'Forbidden');
  let file = path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+path.sep) && file!==root) return reply(403,'Forbidden');
  try {
    let stat=await fs.promises.stat(file);
    if(stat.isDirectory()) {
      if(!url.pathname.endsWith('/')) {res.writeHead(301,{Location:url.pathname+'/'+url.search});return res.end();}
      file=path.join(file,'index.html');stat=await fs.promises.stat(file);
    }
    const real=await fs.promises.realpath(file);
    if(!real.startsWith(root+path.sep)||!stat.isFile()) return reply(403,'Forbidden');
    res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':stat.size});
    if(req.method==='HEAD')return res.end();
    const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
  } catch(error) {reply(error.code==='ENOENT'||error.code==='ENOTDIR'?404:500,'Səhifə tapılmadı.');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`${port} portu istifadədədir. Başqa PORT seçin və ya əvvəlki serveri bağlayın.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`\nEGE saytı: http://127.0.0.1:${port}/\n3D açılış: http://127.0.0.1:${port}/?intro=1\n\nDayandırmaq üçün Ctrl+C.\n`));
