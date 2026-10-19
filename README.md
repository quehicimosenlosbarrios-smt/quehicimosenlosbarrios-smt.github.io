# Intervenciones en los barrios

Mapa de las intervenciones municipales en San Miguel de Tucumán, con filtros por circuito electoral, barrio y tipo de intervención, y ficha técnica del circuito en PDF.

App publicada: https://quehicimosenlosbarrios-smt.github.io

## De dónde salen los datos

| Qué | Archivo | ¿Cambia? |
|---|---|---|
| Circuitos electorales | `data/circuitos.geojson` | No, es fijo |
| Límites de barrios | `data/barrios.geojson` | No, es fijo |
| Intervenciones | `data/intervenciones.csv`, descargado de GeoGestión | Sí, se actualiza todos los días |

Mientras `data/intervenciones.csv` no exista, la app muestra datos de ejemplo (`data/ejemplo-intervenciones-smt.csv`).

Los GeoJSON originales vienen en EPSG:5345 (POSGAR 2007 / Argentina 3) y se convirtieron a WGS84. Cada barrio guarda en `circuitos` la lista de circuitos con los que se superpone (más del 5 % de su superficie), porque hay barrios que cruzan el límite de un circuito.

## Cómo tiene que ser la planilla

Una fila por intervención, con estas columnas (los nombres pueden variar en mayúsculas o tildes):

| intervencion | direccion | barrio | latitud | longitud | id_cuadra |
|---|---|---|---|---|---|
| Luminarias | San Martín 1200 | Barrio Sur | -26.8301 | -65.2034 | |
| Pavimentación | Lavalle al 900 | Villa Luján | -26.8155 | -65.2290 | C-0012 |
| Pavimentación | Lavalle al 900 | Villa Luján | -26.8164 | -65.2291 | C-0012 |

- **intervencion** es el tipo (Pavimentación, Luminarias, Refugios…). Cada valor distinto aparece como un filtro.
- Las calles ocupan **dos filas con el mismo `id_cuadra`**: la primera con el punto de inicio y la segunda con el punto final. Las intervenciones puntuales dejan `id_cuadra` vacío.
- El **circuito** y el **barrio** se calculan con la ubicación del punto. El barrio escrito en la planilla solo se usa si el punto cae fuera de todos los barrios.

## Descarga automática desde GeoGestión

La Action **Actualizar datos desde GeoGestión** (`.github/workflows/actualizar-datos.yml`) corre todos los días a las 6:00 de Tucumán. Inicia sesión en [GeoGestión](https://smtendatos.gob.ar/apps/GeoGestion/), descarga todos los puntos y líneas, y guarda `data/intervenciones.csv` con `scripts/descargar_geogestion.py`. Si los datos no cambiaron no hace commit.

- **intervencion** es el programa de GeoGestión (Pavimentación, Alumbrado público…). El indicador, ámbito, estado y verificación quedan como columnas extra.
- Cada línea o polígono pasa a filas con el mismo `id_cuadra` (`L-` + id del punto), una por vértice.
- No se publican los registros con verificación **Rechazado**.
- Si la descarga falla o viene vacía, el archivo anterior no se toca.

### Cargar el usuario y la contraseña (una sola vez)

1. En GitHub, abrir el repositorio y entrar a **Settings > Secrets and variables > Actions**.
2. **New repository secret**: nombre `GEOGESTION_CUIL`, valor el CUIL con el que se entra a GeoGestión.
3. **New repository secret**: nombre `GEOGESTION_PASSWORD`, valor la contraseña.
4. Para probar sin esperar al día siguiente: **Actions > Actualizar datos desde GeoGestión > Run workflow**.

Los secretos no se ven en el código ni en los registros de la Action.

## Usar otra planilla

Si en algún momento se quiere leer otra fuente, `planillaCSV` en `config.js` acepta cualquier CSV publicado (por ejemplo una Google Sheet: **Archivo > Compartir > Publicar en la web**, formato .csv).
