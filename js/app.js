import {parseM3U,safeHttpURL} from './m3u.js';
import {Navigation} from './navigation.js';
import {Player} from './player.js';
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
const state={view:'live',items:[],favorites:[],source:'auto',config:{},lastFocus:null,hideTimer:null,keyboardTarget:null,keyboardValue:'',filter:'Todas'};
const storage={read(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}},write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{notify('Almacenamiento no disponible')}}};
state.favorites=storage.read('tvfefe-favorites-v3',[]);state.config=storage.read('tvfefe-config-v3',{});
const nav=new Navigation(()=> !$('keyboard').hidden?$('keyboard'):!$('player').hidden&&!$('tvChannels').hidden?$('tvChannels'):$('player').hidden?$('app'):$('player'));
const player=new Player($('video'),msg=>{$('videoError').textContent=msg;$('videoError').hidden=false;showControls()});
function notify(message){$('status').textContent=message;$('toast').textContent=message;$('toast').style.display='block';clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('toast').style.display='none',4500)}
function button(text,fn,cls='action'){const b=el('button',cls+' focusable',text);b.addEventListener('click',fn);return b}
function setItems(items,source){state.items=items;state.source=source;state.filter='Todas';notify(`${items.length} contenidos · ${source}`);render(state.view==='settings'?'live':state.view)}
function render(view){state.view=view;const titles={live:'TV en vivo',movies:'Películas',series:'Series',favorites:'Favoritos',settings:'Configuración'};$('title').textContent=titles[view];document.querySelectorAll('.nav').forEach(n=>n.setAttribute('aria-current',n.dataset.view===view?'page':'false'));$('toolbar').replaceChildren();$('content').replaceChildren();if(view==='settings')renderSettings();else renderCatalog();nav.focus(document.querySelector(`.nav[data-view="${view}"]`))}
function isFav(item){return state.favorites.includes(item.url||item.name)}
function toggleFav(item){const id=item.url||item.name;state.favorites=isFav(item)?state.favorites.filter(x=>x!==id):[...state.favorites,id];storage.write('tvfefe-favorites-v3',state.favorites);render(state.view)}
function renderCatalog(){const root=$('content');let items=state.view==='favorites'?state.items.filter(isFav):state.items.filter(x=>x.kind===state.view);if(state.view==='movies'||state.view==='series'){const total=items.length;items=items.filter(x=>x.languageVerified===true&&(x.audioLanguage==='es-419'||(x.audioLanguage==='en'&&x.subtitleLanguage==='es')));const info=el('p','help',`Catálogo con idioma verificado: ${items.length} de ${total}. Preferencia: español latino; alternativa: inglés con subtítulos en español. Los elementos sin verificación no se muestran.`);root.append(info)}const search=el('input','search focusable');search.placeholder='Buscar contenido';search.setAttribute('aria-label','Buscar contenido');$('toolbar').append(search);const category=el('select','focusable');const cats=['Todas',...new Set(items.map(x=>x.group||'General'))];for(const c of cats){const option=el('option','',c);option.value=c;category.append(option)}category.value=cats.includes(state.filter)?state.filter:'Todas';$('toolbar').append(category);const list=el('div');root.append(list);const paint=()=>{list.replaceChildren();const query=search.value.toLocaleLowerCase();const selected=items.filter(x=>(category.value==='Todas'||x.group===category.value)&&x.name.toLocaleLowerCase().includes(query));if(!selected.length){list.append(el('p','empty','No hay contenidos para mostrar. Usa Configuración para cargar una lista o activar las demostraciones.'));return}const groups=[...new Set(selected.map(x=>x.group||'General'))];for(const group of groups){list.append(el('h2','section-heading',group));const grid=el('div','grid');for(const item of selected.filter(x=>(x.group||'General')===group)){const tile=button('',()=>openItem(item),'tile');tile.setAttribute('aria-label','Reproducir '+item.name);if(item.logo&&safeHttpURL(item.logo)){const img=el('img');img.src=item.logo;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=()=>img.replaceWith(el('div','placeholder','▶'));tile.append(img)}else tile.append(el('div','placeholder','▶'));tile.append(el('strong','',item.name));tile.append(el('small','',item.kind==='live'?'Canal':item.kind==='series'?'Serie':'Video'));const star=button(isFav(item)?'★ Favorito':'☆ Favorito',()=>toggleFav(item),'filter fav');grid.append(tile,star)}list.append(grid)}};category.addEventListener('change',()=>{state.filter=category.value;paint()});search.addEventListener('input',paint);paint()}
async function openItem(item){if(item.seriesId&&!item.url){try{notify('Cargando episodios…');const episodes=await loadEpisodes(state.config,item.seriesId);if(!episodes.length)throw Error('No hay episodios disponibles');state.items=[...state.items.filter(x=>x.group!=='Episodios seleccionados'),...episodes.map(x=>({...x,group:'Episodios seleccionados'}))];state.filter='Episodios seleccionados';render('series')}catch(e){notify('Error de serie: '+e.message)}return}if(!item.url)return notify('Este contenido no tiene enlace de reproducción');activeTvItem=item;state.lastFocus=nav.current;$('player').hidden=false;$('playingTitle').textContent=item.name;$('videoError').hidden=true;nav.focus($('playPause'));showControls();await player.play(item.url);updatePlayState()}
function updatePlayState(){$('playPause').textContent=$('video').paused?'▶ Reproducir':'❚❚ Pausar';$('playState').textContent=$('video').paused?'Pausado':'Reproduciendo'}
function showControls(){$('controls').classList.remove('hidden');clearTimeout(state.hideTimer);state.hideTimer=setTimeout(()=>{if($('tvChannels').hidden)$('controls').classList.add('hidden')},5500)}
function stop(){$('tvChannels').hidden=true;clearTimeout(state.hideTimer);player.stop();$('player').hidden=true;$('controls').classList.remove('hidden');$('videoError').hidden=true;nav.focus(state.lastFocus?.isConnected?state.lastFocus:document.querySelector('.nav[aria-current="page"]'))}
function field(parent,label,value='',type='text'){const wrap=el('div','field'),l=el('label','',label),input=el('input','focusable');input.type=type;input.value=value;input.placeholder=label;input.autocomplete='off';l.append(input);wrap.append(l);parent.append(wrap);return input}
function renderSettings(){
 const root=$('content'),box=el('div','settings');
 box.append(el('p','', 'Las listas públicas se cargan automáticamente al abrir TV FEFE. Los títulos de películas y series solo aparecen si su idioma está verificado. Algunos enlaces pueden fallar por CORS, HTTPS o restricciones del proveedor.'));
 const fields=el('div','form-grid');
 const m3u=field(fields,'URL M3U / M3U8 (opcional)',state.config.m3u||'');
 m3u.setAttribute('inputmode','url');m3u.parentElement.classList.add('full');box.append(fields);
 const free=el('div','preset');free.append(el('h2','','Fuentes automáticas'));
 for(const src of AUTO_LISTS)free.append(el('p','help',src.name+' · '+src.url));
 box.append(free);
 const pasted=el('textarea','paste-area focusable');pasted.placeholder='Pegar contenido #EXTM3U';pasted.rows=4;box.append(pasted);
 const actions=el('div','settings-actions');
 actions.append(button('Actualizar fuentes automáticas',loadAutoLists,'primary'));
 actions.append(button('Procesar texto M3U pegado',()=>{try{const items=parseM3U(pasted.value);if(!items.length)throw Error('No se encontraron enlaces válidos');setItems(items,'texto pegado')}catch(e){notify('Error de M3U: '+e.message)}},'primary'));
 actions.append(button('Cargar URL M3U',async()=>{state.config={m3u:m3u.value.trim()};storage.write('tvfefe-config-v3',state.config);await importM3U(state.config.m3u)}));
 actions.append(button('Importar archivo M3U local',()=>fileInput.click()));
 const fileInput=el('input');fileInput.type='file';fileInput.accept='.m3u,.m3u8,text/plain';fileInput.hidden=true;
 fileInput.addEventListener('change',async()=>{const file=fileInput.files?.[0];if(!file)return;try{const items=parseM3U(await file.text());if(!items.length)throw Error('Lista vacía');setItems(items,'archivo local')}catch(e){notify(e.message)}});
 actions.append(fileInput);box.append(actions);root.append(box);
 m3u.addEventListener('keydown',e=>e.stopPropagation());m3u.addEventListener('contextmenu',e=>e.stopPropagation());
 m3u.parentElement.append(button('⌨ Teclado virtual: URL M3U',()=>openKeyboard(m3u),'action'));
}
async function fetchPlaylist(url){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(url,{signal:controller.signal,cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const raw=await r.text();if(!raw.trimStart().startsWith('#EXTM3U'))throw Error('Formato M3U inválido');return parseM3U(raw)}
 finally{clearTimeout(timer)}
}
async function importM3U(value){
 const url=safeHttpURL(value);if(!url)return notify('Introduce una URL HTTP(S) válida');
 if(location.protocol==='https:'&&url.protocol==='http:'&&url.hostname!=='m3u.cl')return notify('La lista usa HTTP y GitHub Pages exige HTTPS.');
 try{const chile=url.hostname==='m3u.cl'&&url.pathname.toLowerCase()==='/lista/cl.m3u';const items=await fetchPlaylist(chile?'./data/chile.m3u':url.href);if(!items.length)throw Error('Lista vacía');setItems(items,'M3U')}catch(e){notify('Error al importar: '+e.message+' (CORS/HTTPS o enlace no disponible)')}
}
let autoLoading=false;
async function loadAutoLists(){
 if(autoLoading)return;autoLoading=true;notify('Actualizando listas públicas…');
 const results=await Promise.allSettled(AUTO_LISTS.map(async src=>{
  const parsed=await fetchPlaylist(src.local||src.url);
  return parsed.map(item=>({...item,kind:src.mode==='vod'?item.kind:src.mode,group:src.name+' · '+(item.group||'General'),sourceName:src.name,languageVerified:false}));
 }));
 const merged=[],seen=new Set();let ok=0;
 for(const result of results){if(result.status!=='fulfilled')continue;ok++;for(const item of result.value){const key=item.kind+'|'+item.url;if(!seen.has(key)){seen.add(key);merged.push(item)}}}
 autoLoading=false;
 if(!ok){notify('No se pudieron cargar las fuentes (red, CORS o HTTPS). Puedes importar una lista local.');return}
 state.items=merged;state.source='Fuentes públicas';state.filter='Todas';render(state.view==='settings'?'live':state.view);
 notify(merged.length+' enlaces cargados de '+ok+'/'+AUTO_LISTS.length+' fuentes. VOD sin idioma verificado permanece oculto.');
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

render('live');loadAutoLists();
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});

window.__tvFefeReady=true;
