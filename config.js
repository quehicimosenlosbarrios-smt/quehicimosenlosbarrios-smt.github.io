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

  // Orden en que aparecen las intervenciones en el panel y en la ficha (prioridad).
  // Tiene que coincidir con "mostrar_como" de data/filtro-intervenciones.json.
  ordenIntervenciones: [
    "Pavimentación",
    "Repavimentación",
    "Semáforos",
    "Plan veredas sanas",
    "El gas llega a tu casa",
    "Refugios",
    "Plazas revalorizadas",
    "Alumbrado público",
    "Mapa verde",
    "EDUCÁ",
    "Pintemos la ciudad"
  ],

  // Color e ícono de cada intervención (y de sus subgrupos), según el documento de logos de la Subsecretaría.
  // "icono" es una imagen redonda en img/iconos; si falta, se usa el dibujo blanco sobre el color ("dibujo").
  estilos: {
    "Pavimentación":         { color: "#1b6e2e", icono: "img/iconos/pavimentacion.png" },
    "Repavimentación":       { color: "#7cb342", icono: "img/iconos/repavimentacion.png" },
    "Semáforos":             { color: "#d32f2f", icono: "img/iconos/semaforos.png" },
    "Alumbrado público":     { color: "#f2c500", icono: "img/iconos/alumbrado.png" },
    "Refugios":              { color: "#3aa9e6", dibujo: "refugio", subgrupos: {
      "Inteligentes":        { color: "#3aa9e6", icono: "img/iconos/refugios-inteligentes.png" },
      "Comunes":             { color: "#ffa600", icono: "img/iconos/refugios-comunes.png" } } },
    "Plan veredas sanas":    { color: "#737373", icono: "img/iconos/veredas.png" },
    "Plazas revalorizadas":  { color: "#1f5fbf", icono: "img/iconos/plazas.png" },
    "Mapa verde":            { color: "#7b3fa0", dibujo: "reciclar", subgrupos: {
      "Puntos verdes fijos": { color: "#5b2a86", icono: "img/iconos/puntos-verdes-fijos.png" },
      "Tulipanes":           { color: "#8e44ad", icono: "img/iconos/tulipanes.png" },
      "Botellones":          { color: "#b57edc", icono: "img/iconos/botellones.png" },
      "Bolsones":            { color: "#3d1a5b", dibujo: "bolsa" },
      "Totem solar":         { color: "#d9b3ec", dibujo: "sol" } } },
    // sin ícono en el documento: colores definidos para que no se repitan
    "El gas llega a tu casa": { color: "#8d5a2b", dibujo: "llama" },
    "EDUCÁ":                 { color: "#0f8b8d", dibujo: "libro" },
    "Pintemos la ciudad":    { color: "#e64980", dibujo: "pincel" }
  },

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
