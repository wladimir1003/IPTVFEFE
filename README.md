# Magma TV Player Latino Pro — multiplataforma

SPA HTML5/CSS/JavaScript modular con control remoto, PWA, listas M3U, Xtream Codes básico, favoritos, categorías y reproducción HTML5/HLS.

## Inicio rápido

1. Publica **todo el contenido de esta carpeta** en un repositorio GitHub público o privado.
2. Ve a **Settings → Pages → Deploy from a branch → main / (root)**.
3. Abre `https://TU-USUARIO.github.io/TU-REPOSITORIO/`.
4. En **Configuración**, prueba **Usar demostraciones libres**, importa un archivo M3U o configura un servidor propio/autorizado.

Para probar localmente: `python3 -m http.server 8080` y visita `http://localhost:8080` (no abrir directamente con `file://`). Pruebas de parser: `npm test` (Node.js 20+).

## Fuentes de prueba

- HLS de prueba de Mux: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
- Videos de prueba de Google: `https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`, `https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4`
- Listas de canales públicos: `https://iptv-org.github.io/iptv/index.m3u` (contenido, disponibilidad, derechos y CORS sujetos a cambios).

Los enlaces de prueba son externos y pueden dejar de funcionar. El funcionamiento en TV y el acceso a contenidos de terceros no están garantizados.

## Magma / PL Pro

En Configuración se ofrecen los dominios `tv.m3uts.xyz` y `plpro.org` como **presets editables**, aportados por el usuario y **no verificados**. Introduce tus credenciales en el dispositivo. No publiques contraseñas, URLs con tokens ni capturas con datos de acceso. No hay cuentas ni listas comerciales precargadas.

**Privacidad:** los datos de Xtream se almacenan en `localStorage` del navegador para comodidad, sin cifrado. En dispositivos compartidos, usa **Borrar credenciales**. Los datos se envían al servidor elegido; GitHub Pages no es un proxy. Si el servidor solo acepta HTTP, GitHub Pages (HTTPS) puede bloquearlo por contenido mixto; CORS también puede impedir solicitudes. No se incluyen bypass, proxies ni DRM.

## Empaquetado

- **webOS:** usar `platforms/webos/appinfo.json` como referencia y copiar `index.html`, `css`, `js`, `assets`, `manifest.webmanifest` a la raíz del paquete. Generar icon.png (80x80 o según SDK) antes de `ares-package`. Validar en LG real.
- **Tizen:** `platforms/tizen/config.xml` es una plantilla; ajustar ID, firma, recursos y permisos en Tizen Studio, copiar los archivos web y generar `.wgt`. Validar en Samsung real.
- **Android TV / Fire TV:** requiere un proyecto Android WebView o navegador compatible y ajustes de control remoto/red; **no se entrega APK**.
- **iOS/Android/PC:** abrir web/PWA en navegador compatible. Las PWA no se instalan igual en todas las TVs.

## Limitaciones conocidas

- No se han probado físicamente televisores LG, Samsung o Android TV.
- La carga de listas Xtream depende de API/CORS/HTTPS. Los VOD pueden requerir códecs específicos.
- No incluye DRM, EPG, timeshift, grabación, descarga de contenido, proxy ni bypass CORS.
- El catálogo de series requiere `get_series_info`; el resultado depende de la implementación Xtream del proveedor.
- CDN Hls.js necesita conexión a Internet; sin la librería se intenta reproducción nativa.
- GitHub Pages aloja el **frontend**, no ejecuta servidores IPTV ni convierte HTTP a HTTPS.

## Seguridad y licencias

Utiliza únicamente fuentes autorizadas. No se incorporan canales de pago, credenciales ni medios protegidos. Este proyecto no está afiliado a los operadores mencionados.
