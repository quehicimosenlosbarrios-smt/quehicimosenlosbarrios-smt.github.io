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
    "Alumbrado público":     { color: "#f5a300", icono: "img/iconos/alumbrado-naranja.png" },
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
    // "unidad": cómo se cuenta esa intervención en la ficha (si falta, "intervenciones")
    // "tinta": color del dibujo sobre el círculo (blanco si falta); en amarillo se lee mejor oscuro
    "El gas llega a tu casa": { color: "#ffd60a", tinta: "#5c4300", dibujo: "llama", unidad: "domicilios" },
    "EDUCÁ":                 { color: "#0f8b8d", dibujo: "libro", unidad: "instituciones visitadas" },
    "Pintemos la ciudad":    { color: "#e64980", dibujo: "pincel" }
  },

  // Presupuesto Participativo: proyecto ganador de cada distrito (lo descarga
  // scripts/descargar_presupuesto_participativo.py desde presupuestoparticipativo.smt.gob.ar).
  // Cada circuito muestra el ganador del distrito con el que comparte más superficie (circuito-distrito.json).
  presupuestoParticipativo: {
    edicion: 2025,
    ganadores: "data/presupuesto-participativo-2025.json",
    distritos: "data/distritos.geojson",
    cruce: "data/circuito-distrito.json"
  },

  // Red vial por material (Power BI de la Subsecretaría). La regenera scripts/red_vial.py.
  redVial: {
    lineas: "data/red-vial.geojson",
    zonas: "data/red-vial-zonas.json",
    materiales: {
      // mismos colores que la hoja "Red vial de la ciudad" del Power BI
      P: { nombre: "Pavimento", color: "#068c30" },
      C: { nombre: "Cordón cuneta", color: "#f2c200" },
      R: { nombre: "Ripio", color: "#ff2b0f" }
    }
  },

  // En la ficha, Mapa verde y EDUCÁ van juntos en una hoja, en tonos de verde
  fichaJuntas: {
    nombre: "Mapa verde y EDUCÁ",
    tipos: ["Mapa verde", "EDUCÁ"],
    verdes: ["#1b5e20", "#4caf50", "#9ccc65", "#00897b", "#827717", "#80cbc4", "#33691e"]
  },

  // Motivo puntual de una ficha: se muestra en la hoja de contextualización y destaca el barrio en el plano.
  // Se borra cuando ya no hace falta.
  fichaMotivos: {
    "Circuito 18F": {
      titulo: "¿Por qué se elabora esta ficha del circuito?",
      parrafos: [
        "Esta ficha se elabora con motivo de la inauguración de la pavimentación de 19 cuadras en el barrio Elena White, el martes 3 de noviembre a las 17 h, en López Pandal y Coronel Olleros.",
        "Reúne lo que el municipio realizó en el circuito 18F para poner esa obra en contexto: qué otras intervenciones llegaron a sus barrios, cómo está hoy la red vial y qué proyecto eligieron los vecinos en Presupuesto Participativo."
      ],
      imagen: "img/motivos/inauguracion-elena-white.jpg",
      barrio: "ELENA WHITE"
    }
  },

  // Títulos de la hoja de cada intervención en la ficha ({zona} = circuito o distrito)
  fichaTitulos: {
    "Pavimentación": "Pavimentación realizada en el {zona}",
    "Refugios": "Refugios nuevos"
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
    cuadra: ["id cuadra", "id_cuadra", "idcuadra", "cuadra", "id de cuadra"],
    foto: ["foto", "imagen", "img"]
  }
};
