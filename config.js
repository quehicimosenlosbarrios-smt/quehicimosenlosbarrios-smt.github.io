/*
  Configuración de la app. Es el único archivo que hace falta tocar para cambiar
  de dónde se leen los datos.
*/
window.APP_CONFIG = {
  titulo: "Intervenciones en los barrios",
  organismo: "Municipalidad de San Miguel de Tucumán",

  // Archivo con las intervenciones. Lo actualiza todos los días la Action
  // "Actualizar datos desde GeoGestión". Si todavía no existe se usa la planilla de ejemplo.
  planillaCSV: "data/intervenciones.csv",
  planillaEjemplo: "data/ejemplo-intervenciones-smt.csv",

  // Límites fijos (WGS84). Origen: CIRCUITOS_ELECTORALES y BARRIOS, EPSG:5345.
  circuitos: "data/circuitos.geojson",
  barrios: "data/barrios.geojson",

  // Propiedad del GeoJSON que tiene el nombre. Vacío = se detecta sola.
  campoNombreCircuito: "nombre",
  campoNombreBarrio: "nombre",

  // Nombres posibles de cada columna de la planilla (no importan mayúsculas, tildes ni espacios)
  columnas: {
    intervencion: ["intervencion", "nombre de intervencion", "nombre intervencion", "tipo", "tipo de intervencion"],
    direccion: ["direccion", "domicilio", "ubicacion"],
    barrio: ["barrio"],
    latitud: ["latitud", "lat", "y"],
    longitud: ["longitud", "long", "lng", "lon", "x"],
    cuadra: ["id cuadra", "id_cuadra", "idcuadra", "cuadra", "id de cuadra"]
  }
};
