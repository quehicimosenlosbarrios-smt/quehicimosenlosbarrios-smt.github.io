# Intervenciones en los barrios

Mapa de las intervenciones municipales en San Miguel de Tucumán, con filtros por distrito, barrio y tipo de intervención, y ficha técnica del distrito en PDF.

App publicada: https://quehicimosenlosbarrios-smt.github.io

## De dónde salen los datos

| Qué | Archivo | ¿Cambia? |
|---|---|---|
| Límites de distritos | `data/distritos.geojson` | No, es fijo |
| Límites de barrios | `data/barrios.geojson` | No, es fijo |
| Intervenciones | Google Sheet publicada como CSV (link en `config.js`) | Sí, se agregan filas |

Mientras `planillaCSV` en `config.js` esté vacío, la app muestra datos de ejemplo (`data/intervenciones-ejemplo.csv`).

## Cómo tiene que ser la planilla

Una fila por intervención, con estas columnas (los nombres pueden variar en mayúsculas o tildes):

| intervencion | direccion | barrio | latitud | longitud | id_cuadra |
|---|---|---|---|---|---|
| Luminarias | San Martín 1200 | Barrio Sur | -26.8301 | -65.2034 | |
| Pavimentación | Lavalle al 900 | Villa Luján | -26.8155 | -65.2290 | C-0012 |
| Pavimentación | Lavalle al 900 | Villa Luján | -26.8164 | -65.2291 | C-0012 |

- **intervencion** es el tipo (Pavimentación, Luminarias, Refugios…). Cada valor distinto aparece como un filtro.
- Las calles ocupan **dos filas con el mismo `id_cuadra`**: la primera con el punto de inicio y la segunda con el punto final. Las intervenciones puntuales dejan `id_cuadra` vacío.
- El **distrito** no hace falta cargarlo: la app lo calcula con la ubicación.
- Si el barrio escrito coincide con un nombre del GeoJSON se usa ese; si no, se calcula por ubicación.

## Conectar la planilla

1. En Google Sheets: **Archivo > Compartir > Publicar en la web**.
2. Elegir la hoja de intervenciones y el formato **Valores separados por comas (.csv)**. Publicar y copiar el link.
3. Pegar el link en `config.js`, en `planillaCSV: "..."`.

Desde ese momento, cada vez que alguien abre la app se leen los datos actualizados de la planilla.
