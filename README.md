# IPTVFEFE v2 — corrección de importación

Publicación: subir **el contenido** de esta carpeta a la raíz del repositorio GitHub y activar Settings > Pages > main / (root).

## Prueba rápida
1. Configuración > Chile M3U.CL > Cargar M3U.
2. Si aparece `Failed to fetch`, abre la URL en otra pestaña y guarda el archivo `.m3u`, luego usa **Importar archivo M3U local**. Alternativamente pega el texto completo `#EXTM3U` en el área de texto y pulsa **Procesar texto M3U pegado**.
3. Prueba también Chile IPTV-org y Español IPTV-org.
4. El navegador puede cargar el catálogo pero no reproducir determinados canales por CORS, HTTP, geobloqueo, códecs o enlaces caducados.

## Importante
GitHub Pages no puede eliminar CORS ni convertir streams HTTP a HTTPS. Para listas remotas que no habilitan CORS, se requiere un backend/proxy propio autorizado, o importación local. **No publiques credenciales**. Magma y PL Pro son presets de dirección, no cuentas validadas.

## Verificación
`node --test tests/*.test.js` (requiere Node.js reciente). Las pruebas del parser son locales y no comprueban disponibilidad de canales.
