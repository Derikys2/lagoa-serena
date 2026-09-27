// Servidor local opcional, sem dependências. Execute: node server.cjs
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req,res)=>{
  const name = (req.url || '/').split('?')[0];
  const allowed = {'/':'index.html','/index.html':'index.html','/style.css':'style.css','/game.js':'game.js','/world.js':'world.js','/panels.js':'panels.js','/progression.js':'progression.js','/economy-ui.js':'economy-ui.js'};
  if(!allowed[name]){res.writeHead(404);res.end('Não encontrado');return;}
  fs.readFile(path.join(__dirname,allowed[name]),(err,data)=>{if(err){res.writeHead(500);res.end('Erro ao ler arquivo');return;}res.writeHead(200,{'Content-Type':types[path.extname(allowed[name])]});res.end(data);});
}).listen(8080,'127.0.0.1',()=>console.log('Lagoa Serena: http://127.0.0.1:8080'));
