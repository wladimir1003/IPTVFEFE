# TV FEFE v3 — GitHub Pages

Aplicación IPTV HTML5 multiplataforma, con controles para TV, PC y móviles. **No contiene canales privados ni contraseñas.**

## Publicar
1. Descomprime el ZIP. Sube **el contenido** a la raíz de tu repositorio `IPTVFEFE` (index.html debe quedar en raíz).
2. GitHub → Settings → Pages → Deploy from branch → `main` / `(root)`.
3. Abre `https://TU-USUARIO.github.io/IPTVFEFE/` y actualiza con Ctrl+F5.
4. Si sigue apareciendo una versión antigua, elimina los datos del sitio y el service worker desde el navegador.

## Listas y CORS
- En Configuración, puedes pegar una URL M3U en el input y pulsar Cargar M3U.
- Si el servidor no permite CORS, descarga la lista y usa **Importar archivo M3U** o pega el texto M3U.
- Alternativa para **listas públicas permitidas**: crea un Cloudflare Worker con `cloudflare-worker/worker.js`, cambia `ALLOWED_ORIGIN` por `https://TU-USUARIO.github.io`, publica el Worker y pega su URL HTTPS base en el campo **URL de tu Cloudflare Worker**.
- El Worker solo permite 3 listas públicas; no es un proxy universal ni transporta credenciales Xtream. La reproducción de cada canal puede fallar por CORS, DRM, códec o HTTPS.
- Magma y PL Pro son perfiles de servidor editables; usa únicamente cuentas autorizadas. GitHub Pages no puede acceder a servidores HTTP ni resolver sus restricciones CORS.

## Verificaciones
`node --test tests/*.test.js` (requiere Node.js). También puedes ejecutar `node --check js/app.js` etc. El funcionamiento real debe probarse en el dispositivo.

## Privacidad
No subas claves ni credenciales a GitHub. Los datos ingresados se almacenan en localStorage del dispositivo; no los introduzcas en dispositivos compartidos.
