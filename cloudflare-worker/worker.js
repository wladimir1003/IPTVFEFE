// TV FEFE: proxy limitado a listas M3U públicas. NO sirve streams ni credenciales.
// Cambia ALLOWED_ORIGIN por la URL exacta de tu GitHub Pages.
const ALLOWED_ORIGIN = 'https://TU-USUARIO.github.io';
const SOURCES = new Set(['https://m3u.cl/lista/CL.m3u','https://iptv-org.github.io/iptv/countries/cl.m3u','https://iptv-org.github.io/iptv/languages/spa.m3u']);
const cors = {'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Vary':'Origin','Access-Control-Allow-Methods':'GET, OPTIONS','Content-Type':'text/plain; charset=utf-8'};
export default {async fetch(request){
 const origin=request.headers.get('Origin');
 if(origin!==ALLOWED_ORIGIN)return new Response('Origen no autorizado',{status:403});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(request.method!=='GET')return new Response('Método no permitido',{status:405,headers:cors});
 const u=new URL(request.url);const target=u.searchParams.get('url');
 if(u.pathname!=='/playlist'||!SOURCES.has(target))return new Response('Lista no permitida',{status:400,headers:cors});
 try{const upstream=await fetch(target,{redirect:'follow',signal:AbortSignal.timeout(15000)});
 if(!upstream.ok)return new Response('Origen HTTP '+upstream.status,{status:502,headers:cors});
 const body=await upstream.text();if(body.length>8000000||!body.trimStart().startsWith('#EXTM3U'))return new Response('M3U inválida o demasiado grande',{status:502,headers:cors});
 return new Response(body,{headers:{...cors,'Cache-Control':'public, max-age=180'}});
 }catch{return new Response('No se pudo recuperar la lista',{status:502,headers:cors});}
}};
