// Backend de ejemplo: catálogo de contenido propio o con licencia.
// Instalar: npm install express cors ; iniciar: node server.js
// HTTPS debe configurarse en el alojamiento o proxy inverso.
// No descarga ni retransmite torrents; entrega solo metadatos autorizados.
const express=require('express');
const cors=require('cors');
const app=express();
const ORIGIN=process.env.ALLOWED_ORIGIN||'https://wladimir1003.github.io';
app.use(cors({origin:ORIGIN}));
const catalog=[]; // Añadir manualmente {title,language:'es-419',subtitles:'es',url:'magnet:?xt=urn:btih:...'} autorizados
app.get('/api/catalog',(req,res)=>{
 const q=String(req.query.q||'').toLowerCase().slice(0,120);
 res.json({items:catalog.filter(x=>x.title.toLowerCase().includes(q)).slice(0,100)});
});
app.listen(process.env.PORT||3000,()=>console.log('Catálogo autorizado listo'));
