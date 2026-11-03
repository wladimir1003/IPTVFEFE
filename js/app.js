import {parseM3U,safeHttpURL} from './m3u.js';
import {Navigation} from './navigation.js';
import {Player} from './player.js';
import {loadCinemaCatalog} from './cinema.js';
const $=id=>document.getElementById(id), el=(tag,cls='',text='')=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;return n};
const DEMOS=[{name:'HLS test stream (Mux)',group:'Pruebas libres',kind:'live',url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',logo:''},{name:'Big Buck Bunny (MP4 de prueba)',group:'Pruebas libres',kind:'movies',url:'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',logo:''},{name:'Elephants Dream (MP4 de prueba)',group:'Pruebas libres',kind:'movies',url:'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',logo:''}];
const FREE_LISTS=[['Chile M3U.CL','https://m3u.cl/lista/CL.m3u'],['Chile IPTV-org','https://iptv-org.github.io/iptv/countries/cl.m3u'],['Español IPTV-org','https://iptv-org.github.io/iptv/languages/spa.m3u']];
const AUTO_LISTS=[
 {name:'Chile M3U.CL',url:'https://m3u.cl/lista/CL.m3u',local:'./data/chile.m3u',mode:'live'},
 {name:'Chile IPTV-org',url:'https://iptv-org.github.io/iptv/countries/cl.m3u',mode:'live'},
 {name:'Español IPTV-org',url:'https://iptv-org.github.io/iptv/languages/spa.m3u',mode:'live'},
 {name:'Cine en vivo IPTV-org',url:'https://iptv-org.github.io/iptv/categories/movies.m3u',mode:'live'},
 {name:'Series en vivo IPTV-org',url:'https://iptv-org.github.io/iptv/categories/series.m3u',mode:'live'},
 {name:'Películas clásicas dominio público',url:'https://raw.githubusercontent.com/onlinem3u/publicdomainm3u/main/movies.m3u',mode:'movies'},
 {name:'Series clásicas dominio público',url:'https://raw.githubusercontent.com/onlinem3u/publicdomainm3u/main/series.m3u',mode:'series'},
 {name:'Archive Watch',url:'https://archivewatch.org/feeds/archivewatch.m3u',mode:'vod'}
];
// Las listas VOD no certifican doblaje latino ni subtítulos; se mantienen fuera del catálogo visible
// hasta que cada título disponga de metadatos de idioma comprobados.
const state={view:'live',items:[],cinema:[],favorites:[],source:'auto',config:{},lastFocus:null,hideTimer:null,keyboardTarget:null,keyboardValue:'',filter:'Todas'};
const storage={read(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}},write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{notify('Almacenamiento no disponible')}}};
state.favorites=storage.read('tvfefe-favorites-v3',[]);state.config=storage.read('tvfefe-config-v3',{});
const nav=new Navigation(()=> !$('keyboard').hidden?$('keyboard'):!$('player').hidden&&!$('tvChannels').hidden?$('tvChannels'):$('player').hidden?$('app'):$('player'));
const player=new Player($('video'),msg=>{$('videoError').textContent=msg;$('videoError').hidden=false;showControls()});
function notify(message){$('status').textContent=message;$('toast').textContent=message;$('toast').style.display='block';clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('toast').style.display='none',4500)}
function button(text,fn,cls='action'){const b=el('button',cls+' focusable',text);b.addEventListener('click',fn);return b}
function setItems(items,source){state.items=items;state.source=source;state.filter='Todas';notify(`${items.length} contenidos · ${source}`);render(state.view==='settings'?'live':state.view)}
function render(view){state.view=view;const titles={live:'TV en vivo',movies:'Películas',series:'Series',favorites:'Favoritos',settings:'Configuración',p2p:'Buscar P2P'};$('title').textContent=titles[view];document.querySelectorAll('.nav').forEach(n=>n.setAttribute('aria-current',n.dataset.view===view?'page':'false'));$('toolbar').replaceChildren();$('content').replaceChildren();if(view==='settings')renderSettings();else if(view==='p2p')renderP2P();else if(view==='movies'||view==='series')renderCinema();else renderCatalog();nav.focus(document.querySelector(`.nav[data-view="${view}"]`))}
function isFav(item){return state.favorites.includes(item.url||item.name)}
function toggleFav(item){const id=item.url||item.name;state.favorites=isFav(item)?state.favorites.filter(x=>x!==id):[...state.favorites,id];storage.write('tvfefe-favorites-v3',state.favorites);render(state.view)}
function renderCatalog(){const root=$('content');let items=state.view==='favorites'?[...state.items,...state.cinema].filter(isFav):state.items.filter(x=>x.kind===state.view);if(state.view==='movies'||state.view==='series'){const total=items.length;items=items.filter(x=>x.languageVerified===true&&(x.audioLanguage==='es-419'||(x.audioLanguage==='en'&&x.subtitleLanguage==='es')));const info=el('p','help',`Catálogo con idioma verificado: ${items.length} de ${total}. Preferencia: español latino; alternativa: inglés con subtítulos en español. Los elementos sin verificación no se muestran.`);root.append(info)}const search=el('input','search focusable');search.placeholder='Buscar contenido';search.setAttribute('aria-label','Buscar contenido');$('toolbar').append(search);const category=el('select','focusable');const cats=['Todas',...new Set(items.map(x=>x.group||'General'))];for(const c of cats){const option=el('option','',c);option.value=c;category.append(option)}category.value=cats.includes(state.filter)?state.filter:'Todas';$('toolbar').append(category);const list=el('div');root.append(list);const paint=()=>{list.replaceChildren();const query=search.value.toLocaleLowerCase();const selected=items.filter(x=>(category.value==='Todas'||x.group===category.value)&&x.name.toLocaleLowerCase().includes(query));if(!selected.length){list.append(el('p','empty','No hay contenidos para mostrar. Usa Configuración para cargar una lista o activar las demostraciones.'));return}const groups=[...new Set(selected.map(x=>x.group||'General'))];for(const group of groups){list.append(el('h2','section-heading',group));const grid=el('div','grid');for(const item of selected.filter(x=>(x.group||'General')===group)){const tile=button('',()=>openItem(item),'tile');tile.setAttribute('aria-label','Reproducir '+item.name);if(item.logo&&safeHttpURL(item.logo)){const img=el('img');img.src=item.logo;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=()=>img.replaceWith(el('div','placeholder','▶'));tile.append(img)}else tile.append(el('div','placeholder','▶'));tile.append(el('strong','',item.name));tile.append(el('small','',item.kind==='live'?'Canal':item.kind==='series'?'Serie':'Video'));const star=button(isFav(item)?'★ Favorito':'☆ Favorito',()=>toggleFav(item),'filter fav');grid.append(tile,star)}list.append(grid)}};category.addEventListener('change',()=>{state.filter=category.value;paint()});search.addEventListener('input',paint);paint()}

function renderCinema(){
 const root=$('content'),bar=$('toolbar');
 const heading=el('p','help','Catálogo audiovisual: solamente obras con derechos e idioma comprobados. P2P se administra por separado.');root.append(heading);
 const search=el('input','search focusable');search.placeholder='Buscar título, año o género';search.setAttribute('aria-label','Buscar títulos');bar.append(search);
 const genre=el('select','focusable');genre.setAttribute('aria-label','Filtrar género');bar.append(genre);
 const results=el('div','cinema-grid');root.append(results);
 const items=state.cinema.filter(x=>x.kind===state.view);
 for(const name of ['Todos los géneros',...new Set(items.map(x=>x.group||'Cine'))]){const option=el('option','',name);option.value=name;genre.append(option)}
 const paint=()=>{
  const term=search.value.trim().toLocaleLowerCase();
  const matched=items.filter(x=>(genre.value==='Todos los géneros'||x.group===genre.value)&&[x.name,x.group,String(x.year)].some(v=>String(v||'').toLocaleLowerCase().includes(term)));
  results.replaceChildren();
  if(!matched.length){
   const empty=el('div','cinema-empty');
   empty.append(el('h2','','Catálogo en preparación'));
   empty.append(el('p','help','Todavía no hay títulos con reproducción, derechos e idioma verificados. No se añadirán automáticamente películas sin comprobar.'));
   empty.append(button('Abrir buscador P2P autorizado',()=>render('p2p'),'primary'));
   results.append(empty);return;
  }
  for(const item of matched){
   const card=el('article','cinema-card');
   const cover=el('div','cinema-cover');
   if(item.logo&&safeHttpURL(item.logo)){
    const img=el('img');img.src=item.logo;img.alt='Carátula de '+item.name;img.loading='lazy';img.onerror=()=>img.replaceWith(el('div','cinema-placeholder','▶'));cover.append(img);
   }else cover.append(el('div','cinema-placeholder','▶'));
   card.append(cover);
   const info=el('div','cinema-info');
   info.append(el('strong','',item.name));
   info.append(el('p','cinema-meta',[item.year,item.group,item.audioLanguage==='es-419'?'Español latino':'Inglés · subtítulos ES'].filter(Boolean).join(' · ')));
   if(item.synopsis)info.append(el('p','cinema-synopsis',item.synopsis));
   const actions=el('div','cinema-actions');actions.append(button('▶ Reproducir',()=>openItem(item),'primary'));
   actions.append(button(isFav(item)?'★ Favorito':'☆ Favorito',()=>toggleFav(item),'action'));
   info.append(actions);card.append(info);results.append(card);
  }
 };
 genre.addEventListener('change',paint);
 search.addEventListener('input',paint);
 paint();
}
async function refreshCinema(){
 try{state.cinema=await loadCinemaCatalog();if(state.view==='movies'||state.view==='series')render(state.view)}
 catch(e){notify('Catálogo audiovisual: '+e.message)}
}
async function openItem(item){if(item.seriesId&&!item.url){try{notify('Cargando episodios…');const episodes=await loadEpisodes(state.config,item.seriesId);if(!episodes.length)throw Error('No hay episodios disponibles');state.items=[...state.items.filter(x=>x.group!=='Episodios seleccionados'),...episodes.map(x=>({...x,group:'Episodios seleccionados'}))];state.filter='Episodios seleccionados';render('series')}catch(e){notify('Error de serie: '+e.message)}return}if(!item.url)return notify('Este contenido no tiene enlace de reproducción');
 $('video').querySelectorAll('track').forEach(x=>x.remove());
 if(item.subtitleUrl&&safeHttpURL(item.subtitleUrl)){
  const sub=el('track');sub.kind='subtitles';sub.label='Español';sub.srclang='es';sub.src=item.subtitleUrl;sub.default=true;$('video').append(sub);
 }
 activeTvItem=item;state.lastFocus=nav.current;$('player').hidden=false;$('playingTitle').textContent=item.name;$('videoError').hidden=true;nav.focus($('playPause'));showControls();await player.play(item.url);updatePlayState()}
function updatePlayState(){$('playPause').textContent=$('video').paused?'▶ Reproducir':'❚❚ Pausar';$('playState').textContent=$('video').paused?'Pausado':'Reproduciendo'}
function showControls(){$('controls').classList.remove('hidden');clearTimeout(state.hideTimer);state.hideTimer=setTimeout(()=>{if($('tvChannels').hidden)$('controls').classList.add('hidden')},5500)}
function stop(){$('tvChannels').hidden=true;clearTimeout(state.hideTimer);player.stop();$('player').hidden=true;$('controls').classList.remove('hidden');$('videoError').hidden=true;nav.focus(state.lastFocus?.isConnected?state.lastFocus:document.querySelector('.nav[aria-current="page"]'))}
function field(parent,label,value='',type='text'){const wrap=el('div','field'),l=el('label','',label),input=el('input','focusable');input.type=type;input.value=value;input.placeholder=label;input.autocomplete='off';l.append(input);wrap.append(l);parent.append(wrap);return input}
const CUSTOM_KEY='tvfefe-custom-sources-v1';
let customSources=storage.read(CUSTOM_KEY,[]).filter(x=>x&&x.name&&safeHttpURL(x.url));
let sourceStatus={};
function allSources(){return [...AUTO_LISTS,...customSources]}
function makeSourceSelect(){
 const select=el('select','focusable');select.setAttribute('aria-label','Seleccionar listado IPTV');
 for(const src of allSources()){const option=el('option','',src.name+(sourceStatus[src.url]==='ok'?' · cargó':sourceStatus[src.url]==='fail'?' · error':' · sin comprobar'));option.value=src.url;select.append(option)}
 return select
}
async function loadSource(src){
 if(!src)return;
 notify('Comprobando lista: '+src.name);
 try{
  const parsed=await fetchPlaylist(src.local||src.url);
  if(!parsed.length)throw Error('No hay entradas válidas');
  sourceStatus[src.url]='ok';
  const items=parsed.map(item=>({...item,kind:src.mode==='vod'?item.kind:src.mode==='custom'?item.kind:src.mode,group:item.group||src.name,sourceName:src.name,languageVerified:false}));
  state.config.selectedSource=src.url;storage.write('tvfefe-config-v3',state.config);
  setItems(items,src.name);notify(src.name+': '+items.length+' enlaces cargados (reproducción individual no comprobada)');
 }catch(e){sourceStatus[src.url]='fail';notify('No se pudo cargar '+src.name+': '+e.message+' (red/CORS/HTTPS)');if(state.view==='settings')render('settings')}
}
function renderSettings(){
 const root=$('content'),box=el('div','settings');
 box.append(el('p','', 'Elige una lista y pulsa Cargar listado. La marca “cargó” confirma la descarga de su índice M3U, no que todos los videos funcionen. Las películas y series sin idioma verificado permanecen ocultas.'));
 const free=el('div','preset');free.append(el('h2','','Listados disponibles'));
 const select=makeSourceSelect();select.value=state.config.selectedSource||AUTO_LISTS[0].url;free.append(select);
 const status=el('p','help','Selecciona una fuente. Los enlaces con error no se cargan automáticamente.');free.append(status);
 const actions=el('div','settings-actions');
 actions.append(button('Cargar listado seleccionado',()=>loadSource(allSources().find(x=>x.url===select.value)),'primary'));
 actions.append(button('Comprobar todos los listados',async()=>{
  status.textContent='Comprobando índices…';
  const results=await Promise.allSettled(allSources().map(async src=>{const items=await fetchPlaylist(src.local||src.url);if(!items.length)throw Error('Vacía');return items.length}));
  const sources=allSources();let ok=0;results.forEach((r,i)=>{sourceStatus[sources[i].url]=r.status==='fulfilled'?'ok':'fail';if(r.status==='fulfilled')ok++});
  status.textContent=ok+' de '+sources.length+' listados descargaron su índice. Esto no verifica la reproducción de cada canal.';
  for(const option of select.options){const src=allSources().find(x=>x.url===option.value);if(src)option.textContent=src.name+(sourceStatus[src.url]==='ok'?' · cargó':' · error')}
 }));
 free.append(actions);box.append(free);
 const fields=el('div','form-grid');
 const name=field(fields,'Nombre del nuevo listado','');
 const m3u=field(fields,'URL HTTPS del nuevo listado M3U',state.config.m3u||'');
 m3u.setAttribute('inputmode','url');m3u.parentElement.classList.add('full');box.append(fields);
 const customActions=el('div','settings-actions');
 customActions.append(button('Agregar nuevo listado',()=>{
  const url=safeHttpURL(m3u.value),title=name.value.trim();
  if(!title||!url||url.protocol!=='https:')return notify('Escribe un nombre y una URL HTTPS válida');
  if(allSources().some(x=>x.url===url.href))return notify('Esta URL ya está agregada');
  customSources.push({name:title,url:url.href,mode:'custom'});storage.write(CUSTOM_KEY,customSources);
  state.config.m3u=url.href;state.config.selectedSource=url.href;storage.write('tvfefe-config-v3',state.config);
  render('settings');notify('Listado agregado: selecciónalo para comprobarlo');
 },'primary'));
 customActions.append(button('Eliminar listado personalizado seleccionado',()=>{
  const url=select.value;if(!customSources.some(x=>x.url===url))return notify('Los listados públicos predeterminados no se eliminan aquí');
  customSources=customSources.filter(x=>x.url!==url);storage.write(CUSTOM_KEY,customSources);
  state.config.selectedSource=AUTO_LISTS[0].url;storage.write('tvfefe-config-v3',state.config);render('settings');
 }));
 const pasted=el('textarea','paste-area focusable');pasted.placeholder='O pega contenido #EXTM3U';pasted.rows=4;box.append(pasted);
 customActions.append(button('Cargar texto M3U pegado',()=>{const items=parseM3U(pasted.value);if(items.length)setItems(items,'texto pegado');else notify('No hay enlaces válidos')}));
 customActions.append(button('Importar archivo M3U local',()=>fileInput.click()));
 const fileInput=el('input');fileInput.type='file';fileInput.accept='.m3u,.m3u8,text/plain';fileInput.hidden=true;
 fileInput.addEventListener('change',async()=>{const file=fileInput.files?.[0];if(!file)return;try{const items=parseM3U(await file.text());if(!items.length)throw Error('Lista vacía');setItems(items,'archivo local')}catch(e){notify(e.message)}});
 customActions.append(fileInput);box.append(customActions);root.append(box);
 for(const input of [name,m3u]){input.addEventListener('keydown',e=>e.stopPropagation());input.parentElement.append(button('⌨ Teclado virtual: '+input.placeholder,()=>openKeyboard(input),'action'))}
}
async function fetchPlaylist(url){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(url,{signal:controller.signal,cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const raw=await r.text();if(!raw.trimStart().startsWith('#EXTM3U'))throw Error('Formato M3U inválido');return parseM3U(raw)}
 finally{clearTimeout(timer)}
}

// P2P: no indexa redes públicas ni distribuye material protegido.
// WebTorrent en navegador requiere pares WebRTC. Backend opcional solo consulta catálogo autorizado.
let torrentClient=null,torrentSession=null;
function renderP2P(){
 const root=$('content'),panel=el('div','settings');
 panel.append(el('h2','','Películas P2P · WebTorrent'));
 panel.append(el('p','help','Utiliza enlaces magnet de contenido propio, dominio público o con permiso de distribución. En el navegador solo funcionan pares WebTorrent/WebRTC. Los pares pueden ver tu IP.'));
 const magnet=field(panel,'Enlace magnet autorizado','');
 const status=el('p','help','Sin transferencia activa');panel.append(status);
 const actions=el('div','settings-actions');
 actions.append(button('Abrir magnet con WebTorrent',async()=>{
  const value=magnet.value.trim();if(!/^magnet:\?xt=urn:btih:[a-zA-Z0-9]{32,40}(?:&|$)/.test(value))return notify('Introduce un enlace magnet BitTorrent válido');
  if(!window.WebTorrent)return notify('No se cargó WebTorrent. Revisa la conexión y el bloqueador de scripts.');
  try{
   if(!torrentClient)torrentClient=new window.WebTorrent();
   if(torrentSession){torrentClient.remove(torrentSession.infoHash);torrentSession=null}
   status.textContent='Buscando pares WebRTC…';
   torrentClient.add(value,torrent=>{
    torrentSession=torrent;
    const videos=torrent.files.filter(f=>/\.(mp4|webm|m4v)$/i.test(f.name));
    if(!videos.length){status.textContent='No hay video MP4/WebM compatible en este torrent';return}
    const file=videos.sort((a,b)=>b.length-a.length)[0];
    const video=$('video');stop();$('player').hidden=false;$('playingTitle').textContent=file.name;$('videoError').hidden=true;
    file.renderTo(video,{autoplay:true},err=>{if(err)notify('Error WebTorrent: '+err.message)});
    status.textContent='Conectado: '+torrent.name+' · '+torrent.numPeers+' pares';
   });
  }catch(e){notify('P2P: '+e.message)}
 },'primary'));
 actions.append(button('Detener transferencia P2P',()=>{if(torrentSession&&torrentClient){torrentClient.remove(torrentSession.infoHash);torrentSession=null}stop();status.textContent='Transferencia detenida'}));
 panel.append(actions);
 panel.append(el('h2','','Servidor auxiliar · catálogo autorizado'));
 panel.append(el('p','help','Configura un backend HTTPS propio con endpoint GET /api/catalog?q=... . El backend debe devolver JSON con items [{title,language,subtitles,url}]. No se incluye un servidor desplegado.'));
 const endpoint=field(panel,'URL HTTPS del servidor auxiliar',storage.read('tvfefe-p2p-backend',''));
 const query=field(panel,'Buscar título','');
 const results=el('div');panel.append(results);
 const backendActions=el('div','settings-actions');
 backendActions.append(button('Buscar en mi catálogo',async()=>{
  const u=safeHttpURL(endpoint.value);if(!u||u.protocol!=='https:')return notify('Indica una URL HTTPS válida');
  storage.write('tvfefe-p2p-backend',u.href);results.replaceChildren();
  try{
   const api=new URL('api/catalog',u.href.endsWith('/')?u.href:u.href+'/');api.searchParams.set('q',query.value.trim());
   const response=await fetch(api.href,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();const items=Array.isArray(data.items)?data.items:[];
   if(!items.length){results.append(el('p','help','No hay títulos en el catálogo autorizado'));return}
   for(const item of items.slice(0,100)){
    if(!item||typeof item.title!=='string')continue;
    if(item.language!=='es-419'&&!(item.language==='en'&&item.subtitles==='es'))continue;
    const entry=el('div','preset');entry.append(el('strong','',item.title));entry.append(el('p','help',item.language==='es-419'?'Español latino':'Inglés con subtítulos ES'));
    if(typeof item.url==='string'&&/^magnet:\?xt=urn:btih:/i.test(item.url))entry.append(button('Usar magnet',()=>{magnet.value=item.url;notify('Magnet copiado al campo P2P')}));
    results.append(entry);
   }
   if(!results.children.length)results.append(el('p','help','No hay resultados con idioma confirmado'));
  }catch(e){notify('Servidor auxiliar no disponible: '+e.message)}
 },'primary'));panel.append(backendActions);root.append(panel);
 for(const input of [magnet,endpoint,query])input.addEventListener('keydown',e=>e.stopPropagation());
}
function openKeyboard(input){state.keyboardTarget=input;state.keyboardValue=input.value;$('keyboard').hidden=false;const keys=$('keys');keys.replaceChildren();const chars='1234567890QWERTYUIOPASDFGHJKLZXCVBNMabcdefghijklmnopqrstuvwxyz';for(const c of chars)keys.append(button(c,()=>{state.keyboardValue+=c;updateTyped()},'key'));for(const [label,value] of [['.', '.'],['/','/'],[':',':'],['-','-'],['_','_'],['@','@'],['?','?'],['=','='],['&','&'],['%','%']])keys.append(button(label,()=>{state.keyboardValue+=value;updateTyped()},'key'));keys.append(button('Espacio',()=>{state.keyboardValue+=' ';updateTyped()},'key wide'));keys.append(button('Borrar',()=>{state.keyboardValue=state.keyboardValue.slice(0,-1);updateTyped()},'key wide'));keys.append(button('Aceptar',()=>{input.value=state.keyboardValue;closeKeyboard()},'key wide'));updateTyped();nav.focus(keys.querySelector('button'))}
function updateTyped(){$('typed').textContent=state.keyboardTarget?.type==='password'?'•'.repeat(state.keyboardValue.length):state.keyboardValue||' '}
function closeKeyboard(){$('keyboard').hidden=true;nav.focus(state.keyboardTarget)}
function back(){if(!$('tvChannels').hidden)return tvCloseChannels();if(!$('keyboard').hidden)return closeKeyboard();if(!$('player').hidden)return stop();if(state.view!=='live')return render('live');$('sidebar').classList.toggle('collapsed');nav.focus(document.querySelector('.nav[data-view="live"]'))}
document.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',()=>render(n.dataset.view)));$('menuToggle').addEventListener('click',()=>$('sidebar').classList.toggle('collapsed'));$('playerBack').addEventListener('click',stop);$('playPause').addEventListener('click',async()=>{try{await player.toggle()}catch{notify('No se pudo reanudar')}updatePlayState();showControls()});$('video').addEventListener('play',updatePlayState);$('video').addEventListener('pause',updatePlayState);
document.addEventListener('keydown',e=>{if(nav.handle(e,back)){if(!$('player').hidden)showControls();return}if(!$('player').hidden&&[32,415,19,179].includes(e.keyCode)){e.preventDefault();$('playPause').click()}});
document.addEventListener('focusin',e=>{if(e.target.matches('.focusable'))nav.focus(e.target)});
$('player').addEventListener('pointermove',showControls);

/* Panel de canales: no destruye el reproductor al abrir/cerrar la lista */
let activeTvItem=null;
function tvClockTick(){const n=new Date();$('tvClock').textContent=new Intl.DateTimeFormat('es-CL',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(n)}
tvClockTick();setInterval(tvClockTick,15000);
async function tvWeatherTick(){try{const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=-33.45&longitude=-70.67&current=temperature_2m,weather_code&timezone=America%2FSantiago',{cache:'no-store'});if(!r.ok)throw Error('Clima no disponible');const d=await r.json();const c=d.current;$('tvWeather').textContent='Santiago · '+Math.round(c.temperature_2m)+'°C'}catch{$('tvWeather').textContent='Santiago · clima no disponible'}}
tvWeatherTick();setInterval(tvWeatherTick,30*60*1000);
function tvPaintChannels(){const list=$('tvChannelList');list.replaceChildren();const channels=state.items.filter(x=>x.kind==='live'&&x.url);if(!channels.length){list.append(el('p','empty','No hay canales cargados'));return}for(const item of channels){const b=button('',()=>{tvCloseChannels();openItem(item)},'tv-channel');if(activeTvItem?.url===item.url)b.classList.add('active');if(item.logo&&safeHttpURL(item.logo)){const img=el('img');img.src=item.logo;img.alt='';img.onerror=()=>img.remove();b.append(img)}b.append(el('span','',item.name));list.append(b)}}
function tvOpenChannels(){try{tvPaintChannels();$('tvChannels').hidden=false;$('tvChannelToggle').setAttribute('aria-expanded','true');showControls();nav.focus($('tvChannelList').querySelector('button')||$('tvClose'))}catch(e){notify('No se pudo abrir el listado: '+e.message)}}
function tvCloseChannels(){$('tvChannels').hidden=true;$('tvChannelToggle').setAttribute('aria-expanded','false');nav.focus($('tvChannelToggle'));showControls()}
$('tvChannelToggle').setAttribute('aria-controls','tvChannels');$('tvChannelToggle').setAttribute('aria-expanded','false');$('tvChannelToggle').addEventListener('click',e=>{e.stopPropagation();if($('tvChannels').hidden)tvOpenChannels();else tvCloseChannels()});
$('tvClose').addEventListener('click',tvCloseChannels);
$('tvChannelTop')?.addEventListener('click',()=>{if($('tvChannels').hidden)tvOpenChannels();else tvCloseChannels()});

render('live');loadSource(AUTO_LISTS[0]);
refreshCinema();
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});

window.__tvFefeReady=true;
