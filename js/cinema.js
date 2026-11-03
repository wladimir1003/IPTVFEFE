// Catálogo visual de películas y series con licencia o dominio público.
// Cada entrada debe ser revisada antes de marcar idiomaVerificado=true.
export const CATALOG_URL='./data/cinema.json';
const allowedKinds=new Set(['movies','series']);
export async function loadCinemaCatalog(){
 const r=await fetch(CATALOG_URL,{cache:'no-store'});if(!r.ok)throw Error('Catálogo HTTP '+r.status);
 const data=await r.json();if(!Array.isArray(data))throw Error('Catálogo inválido');
 return data.filter(x=>x&&typeof x.title==='string'&&allowedKinds.has(x.kind)&&x.languageVerified===true
  &&(x.audioLanguage==='es-419'||(x.audioLanguage==='en'&&x.subtitleLanguage==='es'))
  &&typeof x.url==='string'&&/^https:\/\//i.test(x.url)
  &&x.rightsVerified===true).map(x=>({
   name:x.title,kind:x.kind,group:x.genre||'Cine',logo:x.poster||'',year:x.year||'',
   synopsis:x.synopsis||'',audioLanguage:x.audioLanguage,subtitleLanguage:x.subtitleLanguage||'',
   languageVerified:true,rightsVerified:true,sourceName:x.source||'Catálogo legal',url:x.url,
   season:x.season||'',episode:x.episode||'',subtitleUrl:x.subtitleUrl||''
  }));
}
