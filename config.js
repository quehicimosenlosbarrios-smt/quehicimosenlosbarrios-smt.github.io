/*
  Configuración de la app. Es el único archivo que hace falta tocar para cambiar
  de dónde se leen los datos.
*/
window.APP_CONFIG = {
  titulo: "Intervenciones en los barrios",
  organismo: "Municipalidad de San Miguel de Tucumán",

  // Link de la Google Sheet publicada como CSV
  // (Archivo > Compartir > Publicar en la web > hoja de intervenciones > Valores separados por comas).
  // Mientras esté vacío, la app usa la planilla de ejemplo.
  planillaCSV: "",
  planillaEjemplo: "data/intervenciones-ejemplo.csv",

  // Límites fijos
  distritos: "data/distritos.geojson",
  barrios: "data/barrios.geojson",

  // Propiedad del GeoJSON que tiene el nombre. Si queda vacío se detecta sola
  // (busca "nombre", "name", "distrito" o "barrio").
  campoNombreDistrito: "",
  campoNombreBarrio: "",

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
