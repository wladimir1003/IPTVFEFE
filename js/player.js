export class Player {
 constructor(video,onError){this.video=video;this.onError=onError;this.hls=null;this.ts=null;this.dash=null;this.generation=0;video.addEventListener('error',()=>{if(video.error)this.onError('Error de video '+video.error.code+': enlace, codec o formato no compatible')})}
 stop(){this.generation++;if(this.hls){this.hls.destroy();this.hls=null}if(this.ts){this.ts.destroy();this.ts=null}if(this.dash){this.dash.reset();this.dash=null}this.video.pause();this.video.removeAttribute('src');this.video.load()}
 async play(url){this.stop();const generation=this.generation;const video=this.video;const clean=String(url).split('?')[0].toLowerCase();const hls=/\.m3u8$/.test(clean)||/[?&](?:output|type|format)=m3u8(?:&|$)/i.test(url);const dash=/\.mpd$/.test(clean);const ts=/\.ts$/.test(clean)||/[?&](?:output|type|format)=ts(?:&|$)/i.test(url);
 const attempt=async()=>{try{await video.play()}catch(e){if(generation!==this.generation||e.name==='AbortError')return;if(e.name==='NotAllowedError')this.onError('Pulsa Reproducir para iniciar el video.');else this.onError('No se pudo iniciar: '+e.name+'. Comprueba enlace, HTTPS, CORS y codec.')}};
 if(hls&&video.canPlayType('application/vnd.apple.mpegurl')){video.src=url;await attempt();return}
 if(hls&&window.Hls?.isSupported()){const h=this.hls=new window.Hls({enableWorker:false});let retries=0;h.on(window.Hls.Events.MANIFEST_PARSED,()=>{if(generation===this.generation)attempt()});h.on(window.Hls.Events.ERROR,(_,d)=>{if(generation!==this.generation||!d.fatal)return;if(retries++<2&&d.type===window.Hls.ErrorTypes.NETWORK_ERROR)h.startLoad();else if(retries<=2&&d.type===window.Hls.ErrorTypes.MEDIA_ERROR)h.recoverMediaError();else this.onError('Error HLS: '+d.details+' (comprueba CORS y acceso al stream)')});h.attachMedia(video);h.loadSource(url);return}
 if(ts&&window.mpegts?.isSupported()){try{this.ts=window.mpegts.createPlayer({type:'mpegts',url,isLive:true});this.ts.attachMediaElement(video);this.ts.load();await attempt()}catch(e){this.onError('MPEG-TS: '+e.message)}return}
 if(dash&&window.dashjs){try{this.dash=window.dashjs.MediaPlayer().create();this.dash.initialize(video,url,false);this.dash.on(window.dashjs.MediaPlayer.events.STREAM_INITIALIZED,()=>{if(generation===this.generation)attempt()})}catch(e){this.onError('DASH: '+e.message)}return}
 video.src=url;await attempt();
 }
 toggle(){if(this.video.paused)return this.video.play();this.video.pause();return Promise.resolve()}
}
