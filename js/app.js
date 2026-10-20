(function () {
"use strict";

var CFG = window.APP_CONFIG;
var BASE = window.APP_BASE || "";
function rel(u) { return /^https?:/.test(u) ? u : BASE + u; }
var fmt = new Intl.NumberFormat("es-AR");
function $(id) { return document.getElementById(id); }
function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }
function norm(s) { return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[_\s]+/g, " ").trim(); }

/* ---------- Íconos y colores por tipo ----------
   Se asignan por palabra clave del nombre de la intervención. Cada ícono es un
   path en una grilla de 24×24 que se usa igual en el mapa (SVG) y en la ficha (canvas). */
var ICONS = {
  pav:     "M4 21L8.5 3h2.2L8 21zM20 21L15.5 3h-2.2L16 21zM11 4h2v3.5h-2zM11 10h2v3.5h-2zM11 16h2v4h-2z",
  luz:     "M12 2.5a6 6 0 0 0-3.6 10.8V15.5h7.2v-2.2A6 6 0 0 0 12 2.5zM9 17h6v1.8H9zM10 19.8h4v1.8h-4z",
  refugio: "M3 4.5h18v3H3zM5 7.5h2V21H5zM17 7.5h2V21h-2zM8 13h8v2.5H8z",
  bacheo:  "M10.4 3h3.2l1 4h-5.2zM9.1 8.6h5.8l1 4H8.1zM7.7 14.2h8.6l1.1 4.3H6.6zM4.5 19.5h15v2h-15z",
  arbol:   "M12 2l6.2 8.5H15l4.5 6.5h-15L9 10.5H5.8zM10.8 17h2.4v5h-2.4z",
  canal:   "M12 2.5C9 7.5 6 10.6 6 14.5a6 6 0 0 0 12 0c0-3.9-3-7-6-12z",
  plaza:   "M4 8.5h16v3H4zM4 12.5h16v2H4zM5 14.5h2V20H5zM17 14.5h2V20h-2z",
  cloaca:  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 2.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6zM8 9.5h8v1.6H8zM8 12.9h8v1.6H8z",
  senal:   "M12 2l9 9-9 9-9-9zM11 7h2v6h-2zM11 14.5h2v2h-2z",
  limpieza:"M14.5 2l2 1-4.2 8.2 2.7 1.4-1 2L11.6 16 9 21H4.5l3.8-7.1-2.1-1.1 1-2 4.4 2.3z",
  pin:     "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 4.3a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4z"
};
var RULES = [
  { re: /repavim/, icon: "pav", color: "#6fbf5f" },
  { re: /paviment|asfalt|calzada/, icon: "pav", color: "#1e7a34" },
  { re: /lumin|alumbr|led|luz/, icon: "luz", color: "#c29b00" },
  { re: /refugio|parada/, icon: "refugio", color: "#c2453d" },
  { re: /bache/, icon: "bacheo", color: "#d9822b" },
  { re: /arbol|forest|poda/, icon: "arbol", color: "#3a8a4e" },
  { re: /canal|desag|zanja/, icon: "canal", color: "#2c7bbf" },
  { re: /plaza|espacio|verde|parque/, icon: "plaza", color: "#5c9e2e" },
  { re: /cloaca|agua|red/, icon: "cloaca", color: "#1f8f99" },
  { re: /senal|semaforo|transito/, icon: "senal", color: "#8a6d3b" },
  { re: /limpie|residuo|basural|barrido/, icon: "limpieza", color: "#7a7f86" }
];
var SPARE = ["#3b6ea8", "#a8573b", "#4f7f5f", "#8f4f8f", "#a17d1a", "#3f8a8a", "#9b4250"];

/* ---------- Geometría ---------- */
function polysOf(geom) {
  if (!geom) return [];
  if (geom.type === "Polygon") return [geom.coordinates];
  if (geom.type === "MultiPolygon") return geom.coordinates;
  return [];
}
function inRing(pt, ring) {
  var x = pt[0], y = pt[1], inside = false;
  for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function inFeature(pt, f) {
  if (pt[0] < f.bbox[0] || pt[0] > f.bbox[2] || pt[1] < f.bbox[1] || pt[1] > f.bbox[3]) return false;
  return f.polys.some(function (poly) {
    if (!inRing(pt, poly[0])) return false;
    for (var h = 1; h < poly.length; h++) if (inRing(pt, poly[h])) return false;
    return true;
  });
}
function bboxOf(polys) {
  var b = [Infinity, Infinity, -Infinity, -Infinity];
  polys.forEach(function (poly) { poly[0].forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); }); });
  return b;
}
function ringArea(r) { var a = 0; for (var i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); }
function segDist2(p, a, b) {
  var x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y;
  if (dx || dy) { var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy); if (t > 1) { x = b[0]; y = b[1]; } else if (t > 0) { x += dx * t; y += dy * t; } }
  dx = p[0] - x; dy = p[1] - y; return dx * dx + dy * dy;
}
function labelPoint(polys) {
  // centro visual del anillo más grande: el punto interior más alejado del borde (búsqueda en grilla con dos refinamientos)
  var best = polys.slice().sort(function (a, b) { return ringArea(b[0]) - ringArea(a[0]); })[0];
  var ring = best[0], b = bboxOf([best]), w = b[2] - b[0], h = b[3] - b[1];
  function score(p) {
    if (!inRing(p, ring)) return -1;
    for (var k = 1; k < best.length; k++) if (inRing(p, best[k])) return -1;
    var m = Infinity;
    best.forEach(function (r) { for (var i = 0, j = r.length - 1; i < r.length; j = i++) m = Math.min(m, segDist2(p, r[j], r[i])); });
    return m;
  }
  var c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], cs = score(c), n = 24;
  for (var pass = 0; pass < 3; pass++) {
    var x0 = c[0] - w / 2, y0 = c[1] - h / 2;
    for (var i = 0; i <= n; i++) for (var j = 0; j <= n; j++) {
      var p = [x0 + w * i / n, y0 + h * j / n], sc = score(p);
      if (sc > cs) { cs = sc; c = p; }
    }
    w = w * 3 / n; h = h * 3 / n;
  }
  return c;
}
function meters(a, b) {
  var rad = Math.PI / 180, dLat = (b[1] - a[1]) * rad, dLng = (b[0] - a[0]) * rad;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function toLL(ring) { return ring.map(function (p) { return [p[1], p[0]]; }); }

/* ---------- Carga de datos ---------- */
function pickNameField(features, preferred, hints) {
  if (preferred) return preferred;
  var keys = Object.keys((features[0] && features[0].properties) || {});
  for (var h = 0; h < hints.length; h++) for (var k = 0; k < keys.length; k++) if (norm(keys[k]).indexOf(hints[h]) >= 0) return keys[k];
  return keys[0];
}
function prepFeatures(fc, field, hints, prefix) {
  var feats = (fc.features || []).filter(function (f) { return polysOf(f.geometry).length; });
  var nf = pickNameField(feats, field, hints);
  return feats.map(function (f, i) {
    var polys = polysOf(f.geometry);
    var name = String((f.properties || {})[nf] == null ? prefix + " " + (i + 1) : f.properties[nf]).trim();
    return { id: prefix + i, name: name, key: norm(name), polys: polys, bbox: bboxOf(polys), label: labelPoint(polys), barrios: [], props: f.properties || {} };
  });
}
function num(v) {
  if (typeof v === "number") return v;
  var s = String(v == null ? "" : v).trim();
  if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
  return parseFloat(s);
}
function findCol(headers, names) {
  var nh = headers.map(norm);
  for (var i = 0; i < names.length; i++) { var k = nh.indexOf(norm(names[i])); if (k >= 0) return headers[k]; }
  return null;
}
function loadCSV(url) {
  return new Promise(function (resolve, reject) {
    Papa.parse(url, { download: true, header: true, skipEmptyLines: true, complete: function (r) { resolve(r); }, error: reject });
  });
}

var DISTRICTS = [], BARRIOS = [], ITEMS = [], TYPES = [], TYPE_BY = {}, DIST_BY = {}, BARRIO_BY = {};
var SOURCE = { sample: true, when: null, updated: null, skipped: 0, unlocated: 0 };
// intervención (norm) -> columna de la planilla que la divide en subgrupos (p. ej. Mapa verde por indicador)
var SPLIT = {};
// circuito (norm) -> { electores, escuelas } del padrón (data/electores.json)
var ELECTORES = {};
// circuito (norm) -> { total, listas: [3 más votadas] } de concejales 2023 (data/concejales2023.json)
var CONCEJALES = {};
var SUBPAL = ["#1f78b4", "#e6550d", "#33a02c", "#e31a1c", "#b8860b", "#17becf", "#6a3d9a", "#555555"];
function colorDist(a, b) { var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return Math.abs((x >> 16) - (y >> 16)) + Math.abs((x >> 8 & 255) - (y >> 8 & 255)) + Math.abs((x & 255) - (y & 255)); }

function buildTypes(names) {
  var used = 0;
  TYPES = names.map(function (n) {
    var k = norm(n), rule = RULES.filter(function (r) { return r.re.test(k); })[0];
    return { id: "t" + k.replace(/[^a-z0-9]+/g, "-"), name: n, icon: rule ? rule.icon : "pin", color: rule ? rule.color : SPARE[used++ % SPARE.length] };
  });
  // orden fijo por prioridad (config.js); lo que no está en la lista va al final, por nombre
  var order = (CFG.ordenIntervenciones || []).map(norm);
  var rank = function (t) { var i = order.indexOf(norm(t.name)); return i < 0 ? order.length : i; };
  TYPES.sort(function (a, b) { return rank(a) - rank(b) || a.name.localeCompare(b.name, "es"); });
  // dos tipos con la misma regla (raro) reciben colores distintos
  var seen = {};
  TYPES.forEach(function (t) { if (seen[t.color]) t.color = SPARE[used++ % SPARE.length]; seen[t.color] = 1; });
  TYPE_BY = {}; TYPES.forEach(function (t) { TYPE_BY[t.id] = t; });
}

function locate(pt, barrioText) {
  // la ubicación manda; el nombre escrito en la planilla se usa solo si el punto cae fuera de todo barrio
  var key = norm(barrioText), d = DISTRICTS.filter(function (x) { return inFeature(pt, x); })[0] || null;
  var b = BARRIOS.filter(function (x) { return inFeature(pt, x); })[0] || null;
  if (!b && key) b = BARRIOS.filter(function (x) { return x.key === key && (!d || x.circuits.indexOf(d.id) >= 0); })[0] || null;
  return { barrio: b, district: d };
}

function buildItems(rows, headers) {
  var C = {};
  Object.keys(CFG.columnas).forEach(function (k) { C[k] = findCol(headers, CFG.columnas[k]); });
  if (!C.intervencion || !C.latitud || !C.longitud) throw new Error("La planilla necesita columnas de intervención, latitud y longitud. Columnas encontradas: " + headers.join(", "));
  var typeNames = [], typeSeen = {};
  var lines = {}, items = [], skipped = 0;
  rows.forEach(function (r) {
    var tname = String(r[C.intervencion] || "").trim(), lat = num(r[C.latitud]), lng = num(r[C.longitud]);
    if (!tname || !isFinite(lat) || !isFinite(lng)) { skipped++; return; }
    var tk = norm(tname);
    if (!typeSeen[tk]) { typeSeen[tk] = tname; typeNames.push(tname); }
    var sc = SPLIT[tk] ? findCol(headers, [SPLIT[tk]]) : null;
    var row = { tname: typeSeen[tk], sub: sc ? String(r[sc] || "").trim() || "Sin especificar" : "", dir: C.direccion ? String(r[C.direccion] || "").trim() : "", barrioText: C.barrio ? r[C.barrio] : "", pt: [lng, lat] };
    var cid = C.cuadra ? String(r[C.cuadra] || "").trim() : "";
    if (cid) { (lines[cid] = lines[cid] || []).push(row); } else items.push(row);
  });
  Object.keys(lines).forEach(function (cid) {
    var rs = lines[cid];
    if (rs.length < 2) { skipped += rs.length; return; }
    var a = rs[0].pt, e = rs[rs.length - 1].pt;
    var mid = [(a[0] + e[0]) / 2, (a[1] + e[1]) / 2];
    items.push({ tname: rs[0].tname, sub: rs[0].sub, dir: rs[0].dir, barrioText: rs[0].barrioText, pt: mid, coords: rs.map(function (x) { return x.pt; }), cuadra: cid, m: rs.slice(1).reduce(function (acc, x, i) { return acc + meters(rs[i].pt, x.pt); }, 0) });
  });
  buildTypes(typeNames);
  var nameToType = {}; TYPES.forEach(function (t) { nameToType[t.name] = t.id; });
  var unlocated = 0, id = 1;
  ITEMS = [];
  items.forEach(function (it) {
    var loc = locate(it.pt, it.barrioText);
    if (!loc.district) { unlocated++; return; }
    ITEMS.push({ id: id++, type: nameToType[it.tname], sub: it.sub, dir: it.dir, barrio: loc.barrio ? loc.barrio.id : null, district: loc.district.id, lng: it.pt[0], lat: it.pt[1], coords: it.coords, cuadra: it.cuadra, m: it.m });
  });
  SOURCE.skipped = skipped; SOURCE.unlocated = unlocated;
  // subgrupos de cada tipo, de mayor a menor; el primero conserva el color del tipo
  TYPES.forEach(function (t) {
    var n = {};
    ITEMS.forEach(function (p) { if (p.type === t.id && p.sub) n[p.sub] = (n[p.sub] || 0) + 1; });
    var names = Object.keys(n).sort(function (a, b) { return n[b] - n[a] || a.localeCompare(b, "es"); });
    // la paleta saltea los colores parecidos al del tipo, que queda para el primer subgrupo
    var pal = SUBPAL.filter(function (c) { return colorDist(c, t.color) > 120; });
    t.subs = names.length > 1 ? names.map(function (x, i) { return { name: x, color: i ? pal[(i - 1) % pal.length] : t.color }; }) : null;
    t.splitBy = SPLIT[norm(t.name)] || "";
  });
}
function subColor(p) { var t = TYPE_BY[p.type], s = t.subs && t.subs.filter(function (x) { return x.name === p.sub; })[0]; return s ? s.color : t.color; }

async function loadAll() {
  var res = await Promise.all([fetch(rel(CFG.circuitos)).then(function (r) { return r.json(); }), fetch(rel(CFG.barrios)).then(function (r) { return r.json(); })]);
  DISTRICTS = prepFeatures(res[0], CFG.campoNombreCircuito, ["nombre", "name", "circuito"], "D");
  BARRIOS = prepFeatures(res[1], CFG.campoNombreBarrio, ["nombre", "name", "barrio"], "B");
  DISTRICTS.forEach(function (d) { DIST_BY[d.id] = d; });
  BARRIOS.forEach(function (b) {
    BARRIO_BY[b.id] = b;
    // un barrio puede caer en más de un circuito: la lista viene calculada en el GeoJSON
    var names = Array.isArray(b.props.circuitos) ? b.props.circuitos.map(norm) : null;
    var ds = DISTRICTS.filter(function (x) { return names ? names.indexOf(x.key) >= 0 : inFeature(b.label, x); });
    b.circuits = ds.map(function (x) { return x.id; });
    b.labels = {};
    ds.forEach(function (x) { var e = b.props.etiquetas && b.props.etiquetas[x.name]; b.labels[x.id] = e || b.label; x.barrios.push(b); });
  });
  DISTRICTS.forEach(function (d) { d.barrios.sort(function (a, b) { return a.name.localeCompare(b.name, "es", { numeric: true }); }); });
  var extra = await Promise.all([
    fetch(rel("data/filtro-intervenciones.json")).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch(rel("data/actualizacion.json") + "?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch(rel("data/electores.json")).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch(rel("data/concejales2023.json")).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ]);
  CONCEJALES = {};
  Object.keys((extra[3] && extra[3].circuitos) || {}).forEach(function (k) { CONCEJALES[norm(k)] = extra[3].circuitos[k]; });
  ELECTORES = {};
  Object.keys((extra[2] && extra[2].circuitos) || {}).forEach(function (k) { ELECTORES[norm(k)] = extra[2].circuitos[k]; });
  SPLIT = {};
  ((extra[0] && extra[0].reglas) || []).forEach(function (r) { if (r.diferenciar_por) SPLIT[norm(r.mostrar_como)] = r.diferenciar_por; });
  var f = extra[1] && String(extra[1].fecha || "").match(/^(\d{4})-(\d\d)-(\d\d)(?:[ T](\d\d):(\d\d))?/);
  SOURCE.updated = f ? new Date(+f[1], f[2] - 1, +f[3], +(f[4] || 0), +(f[5] || 0)) : null;
  var csv = null;
  SOURCE.sample = !CFG.planillaCSV;
  if (CFG.planillaCSV) {
    var url = rel(CFG.planillaCSV);
    // si la descarga automática todavía no generó el archivo, se cae a la planilla de ejemplo
    try { csv = await loadCSV(url + (url.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now()); } catch (e) { csv = null; }
    if (!csv || !csv.data.length) { csv = null; SOURCE.sample = true; }
  }
  if (!csv) csv = await loadCSV(rel(CFG.planillaEjemplo));
  buildItems(csv.data, csv.meta.fields || []);
  // planilla real sin ninguna fila utilizable: mejor el ejemplo que un mapa vacío
  if (!SOURCE.sample && !ITEMS.length) {
    SOURCE.sample = true;
    csv = await loadCSV(rel(CFG.planillaEjemplo));
    buildItems(csv.data, csv.meta.fields || []);
  }
  SOURCE.when = SOURCE.updated || new Date();
}

/* ---------- App ---------- */
var state = { district: "", barrio: "", types: new Set() };
var DETAIL_ZOOM = 17, dotRenderer = null, focusId = null;
var map, distLayer, barrLayer, barrLabels, ptLayer, distPolys = {}, barrPolys = {}, cityBounds, bases = {}, markers = {};

function iconSvg(t, size) { return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path fill="#fff" fill-rule="evenodd" d="' + ICONS[t.icon] + '"/></svg>'; }
function badge(t, size) { return '<span class="badge" style="background:' + t.color + ';width:' + size + 'px;height:' + size + 'px">' + iconSvg(t, Math.round(size * 0.66)) + '</span>'; }
function km(m) { return fmt.format(Math.round(m / 100) / 10); }
function byName(a, b) { return a.name.localeCompare(b.name, "es", { numeric: true }); }

function initMap() {
  map = L.map("map", { zoomSnap: 0.25, zoomControl: false });
  L.control.zoom({ position: "topleft" }).addTo(map);
  bases = {
    // Esri, igual que el satélite: no pide clave (CARTO empezó a mostrar "API key required")
    // gris claro y suave (por defecto): las intervenciones resaltan sobre el fondo
    claro: L.layerGroup([
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 16, attribution: "Mapa &copy; Esri, HERE, Garmin, &copy; OpenStreetMap" }),
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 16 })
    ]),
    calles: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Mapa &copy; Esri, HERE, Garmin, &copy; OpenStreetMap" }),
    sat: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Imágenes &copy; Esri" })
  };
  bases.claro.addTo(map);
  document.querySelectorAll(".seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".seg button").forEach(function (x) { x.classList.toggle("on", x === b); });
      Object.keys(bases).forEach(function (k) { bases[k].remove(); });
      if (bases[b.dataset.base]) bases[b.dataset.base].addTo(map);
    });
  });

  distLayer = L.layerGroup(); barrLayer = L.layerGroup(); barrLabels = L.layerGroup(); ptLayer = L.layerGroup();
  DISTRICTS.forEach(function (d) {
    var poly = L.polygon(d.polys.map(function (p) { return p.map(toLL); }), styleDistrict(d.id));
    L.tooltip({ permanent: true, direction: "center", className: "dlabel", interactive: false }).setLatLng([d.label[1], d.label[0]]).setContent(esc(d.name.replace(/^circuito\s*/i, ""))).addTo(distLayer);
    poly.on("click", function () { setDistrict(state.district === d.id ? "" : d.id); });
    poly.on("mouseover", function () { if (state.district !== d.id) poly.setStyle({ fillOpacity: 0.09, weight: 3 }); });
    poly.on("mouseout", function () { poly.setStyle(styleDistrict(d.id)); });
    distPolys[d.id] = poly; poly.addTo(distLayer);
  });
  BARRIOS.forEach(function (b) {
    var poly = L.polygon(b.polys.map(function (p) { return p.map(toLL); }), { color: css("--barrio"), weight: 1, dashArray: "4 4", fill: false, interactive: false });
    barrPolys[b.id] = poly; poly.addTo(barrLayer);
    L.tooltip({ permanent: true, direction: "center", className: "blabel" }).setLatLng([b.label[1], b.label[0]]).setContent(esc(b.name)).addTo(barrLabels);
  });
  barrLayer.addTo(map); distLayer.addTo(map); ptLayer.addTo(map);
  cityBounds = L.latLngBounds([]);
  DISTRICTS.forEach(function (d) { cityBounds.extend(distPolys[d.id].getBounds()); });
  map.fitBounds(cityBounds, { padding: [20, 20] });
  dotRenderer = L.canvas({ padding: 0.3 });
  map.on("zoomend", function () { updateBarrLabels(); render(); });
  // de cerca los íconos se dibujan solo en pantalla: al moverse hay que redibujar
  // (no mientras hay un popup abierto: el autopan lo cerraría al redibujar)
  var popupOpen = false;
  map.on("popupopen", function () { popupOpen = true; });
  map.on("popupclose", function () { popupOpen = false; });
  map.on("moveend", function () { if (map.getZoom() >= DETAIL_ZOOM && !popupOpen) render(); });
}
function styleDistrict(id) {
  var sel = state.district === id, dim = state.district && !sel;
  // el circuito elegido se rellena en celeste claro para que se distinga
  return { color: css("--district"), weight: sel ? 3.5 : 2, opacity: dim ? 0.5 : 1, fillColor: sel ? css("--selected") : css("--district"), fillOpacity: sel ? 0.28 : dim ? 0.12 : 0.02 };
}
function updateBarrLabels() { if ($("lyr-barr").checked && map.getZoom() >= 14.5) barrLabels.addTo(map); else barrLabels.remove(); }

function initPanel() {
  $("org").textContent = CFG.organismo; $("app-title").textContent = CFG.titulo; document.title = CFG.titulo;
  $("f-dist").innerHTML = '<option value="">Todos los circuitos</option>' + DISTRICTS.slice().sort(byName).map(function (d) { return '<option value="' + d.id + '">' + esc(d.name) + '</option>'; }).join("");
  fillBarrios();
  // arranca sin intervenciones en el mapa: con todas prendidas la carga es muy pesada
  state.types = new Set();
  $("types").innerHTML = TYPES.map(function (t) {
    return '<label class="type-row"><input type="checkbox" role="switch" data-type="' + t.id + '">' + badge(t, 26) + '<span class="nm">' + esc(t.name) + '</span><span class="n" id="n-' + t.id + '">0</span><span class="sw" aria-hidden="true"></span><span class="bar"><i id="b-' + t.id + '" style="background:' + t.color + '"></i></span></label>';
  }).join("");
  $("legend").innerHTML = TYPES.map(function (t) { return '<div>' + badge(t, 18) + esc(t.name) + '</div>'; }).join("");

  $("f-dist").addEventListener("change", function () { setDistrict($("f-dist").value); });
  $("f-barr").addEventListener("change", function () {
    state.barrio = $("f-barr").value;
    if (state.barrio) {
      var b = BARRIO_BY[state.barrio];
      if (b.circuits.indexOf(state.district) < 0) { state.district = b.circuits.length === 1 ? b.circuits[0] : ""; $("f-dist").value = state.district; fillBarrios(); }
      map.fitBounds(barrPolys[b.id].getBounds(), { padding: [40, 40] });
    } else if (state.district) map.fitBounds(distPolys[state.district].getBounds(), { padding: [30, 30] });
    render();
  });
  $("clear").addEventListener("click", function () { setDistrict(""); });
  $("types").addEventListener("change", function (e) {
    var id = e.target.getAttribute("data-type"); if (!id) return;
    if (e.target.checked) state.types.add(id); else state.types.delete(id);
    render();
  });
  function setAll(on) { $("types").querySelectorAll("input").forEach(function (i) { i.checked = on; }); state.types = new Set(on ? TYPES.map(function (t) { return t.id; }) : []); render(); }
  $("all-types").addEventListener("click", function () { setAll(true); });
  $("no-types").addEventListener("click", function () { setAll(false); });
  $("lyr-dist").addEventListener("change", function (e) { if (e.target.checked) distLayer.addTo(map); else distLayer.remove(); });
  $("lyr-barr").addEventListener("change", function (e) { if (e.target.checked) barrLayer.addTo(map); else barrLayer.remove(); updateBarrLabels(); });
  $("lyr-int").addEventListener("change", render);
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", render);

  // búsqueda por dirección
  var q = $("q"), res = $("results");
  q.addEventListener("input", function () {
    var k = norm(q.value);
    if (k.length < 2) { res.hidden = true; return; }
    var hits = ITEMS.filter(function (p) { return norm(p.dir).indexOf(k) >= 0; }).slice(0, 8);
    res.innerHTML = hits.length ? hits.map(function (p) {
      var t = TYPE_BY[p.type], b = BARRIO_BY[p.barrio];
      return '<li tabindex="0" data-id="' + p.id + '">' + badge(t, 20) + '<span>' + esc(p.dir) + '<small>' + esc(t.name) + (b ? ' · ' + esc(b.name) : '') + '</small></span></li>';
    }).join("") : '<li class="empty">No hay intervenciones con esa dirección.</li>';
    res.hidden = false;
  });
  function pick(li) {
    var id = +li.getAttribute("data-id"); if (!id) return;
    var p = ITEMS.filter(function (x) { return x.id === id; })[0];
    if (!state.types.has(p.type)) { state.types.add(p.type); $("types").querySelector('[data-type="' + p.type + '"]').checked = true; }
    if (state.district && state.district !== p.district) setDistrict("");
    if (!$("lyr-int").checked) $("lyr-int").checked = true;
    focusId = id;
    map.setView([p.lat, p.lng], 17);
    setTimeout(function () { if (markers[id]) markers[id].openPopup(); }, 350);
    res.hidden = true;
  }
  res.addEventListener("click", function (e) { var li = e.target.closest("li"); if (li) pick(li); });
  res.addEventListener("keydown", function (e) { if (e.key === "Enter") { var li = e.target.closest("li"); if (li) pick(li); } });

  var tag = $("data-tag");
  if (SOURCE.sample) tag.textContent = "Datos de ejemplo";
  else { tag.textContent = "Planilla actualizada · " + SOURCE.when.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }); tag.classList.add("real"); }
  var warn = [];
  if (SOURCE.skipped) warn.push(SOURCE.skipped + " filas sin tipo o coordenadas válidas (o cuadras con un solo punto) no se muestran.");
  if (SOURCE.unlocated) warn.push(SOURCE.unlocated + " intervenciones caen fuera de los circuitos y no se muestran.");
  if (warn.length) { $("warn").textContent = warn.join(" "); $("warn").hidden = false; }
}
function fillBarrios() {
  var list = state.district ? DIST_BY[state.district].barrios : BARRIOS.slice().sort(byName);
  $("f-barr").innerHTML = '<option value="">Todos los barrios</option>' + list.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join("");
  $("f-barr").value = state.barrio;
}
function setDistrict(id) {
  state.district = id;
  if (state.barrio && (!id || BARRIO_BY[state.barrio].circuits.indexOf(id) < 0)) state.barrio = "";
  $("f-dist").value = id; fillBarrios(); render();
  map.fitBounds(id ? distPolys[id].getBounds() : cityBounds, { padding: [30, 30] });
}
function inZone(p) { return (!state.district || p.district === state.district) && (!state.barrio || p.barrio === state.barrio); }

function popupHtml(p) {
  var t = TYPE_BY[p.type], b = BARRIO_BY[p.barrio];
  return '<div class="pop-h" style="background:' + t.color + '">' + iconSvg(t, 18) + esc(t.name) + '</div><div class="pop-b">' +
    (p.dir ? '<div class="dir">' + esc(p.dir) + '</div>' : '') +
    '<div class="meta">' + (b ? esc(b.name) + ' · ' : '') + esc(DIST_BY[p.district].name) + '</div>' +
    (p.cuadra ? '<div class="meta">Cuadra ' + esc(p.cuadra) + ' · ' + fmt.format(Math.round(p.m)) + ' m</div>' : '') + '</div>';
}

function render() {
  ptLayer.clearLayers(); markers = {};
  var pts = ITEMS.filter(function (p) { return inZone(p) && state.types.has(p.type); });
  var stroke = css("--pt-stroke"), size = 24;
  // con la vista alejada, puntitos dibujados en canvas (livianos); bien de cerca, íconos solo para lo que está en pantalla
  var detail = map.getZoom() >= DETAIL_ZOOM, dotR = map.getZoom() >= 15 ? 5 : 3.5, view = map.getBounds().pad(0.25);
  if ($("lyr-int").checked) {
    pts.forEach(function (p) {
      var t = TYPE_BY[p.type];
      if (p.coords) {
        var ll = p.coords.map(function (c) { return [c[1], c[0]]; });
        L.polyline(ll, { color: stroke, weight: 8, opacity: 0.9, interactive: false }).addTo(ptLayer);
        markers[p.id] = L.polyline(ll, { color: t.color, weight: 5, opacity: 1 }).bindPopup(popupHtml(p)).addTo(ptLayer);
      } else if (!detail) {
        markers[p.id] = L.circleMarker([p.lat, p.lng], { renderer: dotRenderer, radius: dotR, weight: 1, color: stroke, fillColor: t.color, fillOpacity: 1 }).bindPopup(popupHtml(p)).addTo(ptLayer);
      } else if (view.contains([p.lat, p.lng]) || p.id === focusId) {
        markers[p.id] = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "pin", html: badge(t, size), iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] }), title: t.name + (p.dir ? ", " + p.dir : "") }).bindPopup(popupHtml(p)).addTo(ptLayer);
      }
    });
  }
  Object.keys(distPolys).forEach(function (id) { distPolys[id].setStyle(styleDistrict(id)); });
  Object.keys(barrPolys).forEach(function (id) {
    var sel = state.barrio === id;
    barrPolys[id].setStyle({ color: sel ? css("--district") : css("--barrio"), weight: sel ? 2.5 : 1, dashArray: sel ? null : "4 4" });
  });

  var zone = ITEMS.filter(inZone), max = 1;
  var counts = {}; TYPES.forEach(function (t) { counts[t.id] = zone.filter(function (p) { return p.type === t.id; }).length; max = Math.max(max, counts[t.id]); });
  TYPES.forEach(function (t) { $("n-" + t.id).textContent = fmt.format(counts[t.id]); $("b-" + t.id).style.width = (counts[t.id] / max * 100) + "%"; });

  // los totales cuentan lo prendido; con todo apagado (como arranca) cuentan todos los tipos
  if (!state.types.size) pts = zone;
  // solo calles pavimentadas: GeoGestión también trae líneas de recorridos (transporte, ciclovías)
  var lines = pts.filter(function (p) { return p.coords && TYPE_BY[p.type].icon === "pav"; });
  $("zone-name").textContent = state.barrio ? BARRIO_BY[state.barrio].name + " · " + DIST_BY[state.district].name : state.district ? DIST_BY[state.district].name : "Toda la ciudad";
  $("k-total").textContent = fmt.format(pts.length);
  $("k-barrios").textContent = fmt.format(new Set(pts.map(function (p) { return p.barrio; }).filter(Boolean)).size);
  $("k-cuadras").textContent = fmt.format(lines.length);
  $("k-cuadras-l").textContent = "cuadras pavimentadas · " + km(lines.reduce(function (a, p) { return a + p.m; }, 0)) + " km";
  $("k-tipos").textContent = fmt.format(new Set(pts.map(function (p) { return p.type; })).size);
  $("clear").hidden = !state.district;
  var btn = $("btn-ficha");
  btn.disabled = !state.district;
  btn.title = state.district ? "" : "Elegí un circuito para armar su ficha";
  $("btn-ficha-label").textContent = state.district ? "Ficha técnica · " + DIST_BY[state.district].name : "Ficha técnica";
}

/* ---------- Ficha técnica ---------- */
var PAPER = { ink: "#16222c", muted: "#5d6b77", line: "#dde3e8", soft: "#f2f5f7", navy: "#0f2b46", district: "#14507e", barrio: "#8a9aa3", ctx: "#e7ecef", ctxLine: "#c9d3d8" };
var charts = [], fichaReady = Promise.resolve();
var MAXBARS = 15, MAXROWS = 12;
// listado de direcciones: alto útil de cada columna y de la fila con el nombre del barrio (px)
var LIST_CAP = 910, GRP_H = 31;
var measureCtx = null;
function textW(t) { if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d"); measureCtx.font = "400 13px Poppins, Arial, sans-serif"; return measureCtx.measureText(t).width; } // MAXROWS: filas del ranking en la hoja de cada tipo

// Web Mercator (en radianes), igual que las teselas del mapa de fondo
function merc(p) { return [p[0] * Math.PI / 180, Math.log(Math.tan(Math.PI / 4 + p[1] * Math.PI / 360))]; }
function projector(bb, Wd, Hd, pad) {
  var a = merc([bb[0], bb[1]]), b = merc([bb[2], bb[3]]);
  var s = Math.min((Wd - pad * 2) / (b[0] - a[0]), (Hd - pad * 2) / (b[1] - a[1]));
  var ox = (Wd - (b[0] - a[0]) * s) / 2, oy = (Hd - (b[1] - a[1]) * s) / 2;
  var P = function (p) { var m = merc(p); return [ox + (m[0] - a[0]) * s, oy + (b[1] - m[1]) * s]; };
  P.s = s; P.x0 = a[0] - ox / s; P.y0 = b[1] + oy / s;
  P.kmPx = s * 1000 / (6378137 * Math.cos(((bb[1] + bb[3]) / 2) * Math.PI / 180));
  return P;
}

/* Mapa de la ciudad (gris claro con nombres de calles) detrás de los planitos */
var TILE_URL = {
  base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  ref: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
};
var tileCache = {};
function loadTile(url) {
  if (!tileCache[url]) tileCache[url] = new Promise(function (resolve) {
    var img = new Image(), done = function (ok) { clearTimeout(tm); resolve(ok ? img : null); };
    var tm = setTimeout(function () { done(false); }, 10000);
    img.crossOrigin = "anonymous";
    img.onload = function () { done(true); }; img.onerror = function () { done(false); };
    img.src = url;
  });
  return tileCache[url];
}
function tileGrid(P, Wd, Hd) {
  // zoom en el que una tesela se dibuja cerca de su tamaño real, para que los nombres se lean
  var z = Math.max(10, Math.min(16, Math.round(Math.log2(P.s * 2 * Math.PI / 256)))), n = Math.pow(2, z), step = 2 * Math.PI / n;
  var tx = function (x) { return Math.floor((P.x0 + x / P.s + Math.PI) / step); }, ty = function (y) { return Math.floor((Math.PI - (P.y0 - y / P.s)) / step); };
  var out = [];
  for (var x = tx(0); x <= tx(Wd); x++) for (var y = ty(0); y <= ty(Hd); y++) {
    out.push({ z: z, x: x, y: y, px: ((x * step - Math.PI) - P.x0) * P.s, py: (P.y0 - (Math.PI - y * step)) * P.s, size: step * P.s });
  }
  return out;
}
function loadBasemap(P, Wd, Hd) {
  var grid = tileGrid(P, Wd, Hd);
  function layer(k) { return Promise.all(grid.map(function (g) { return loadTile(TILE_URL[k].replace("{z}", g.z).replace("{y}", g.y).replace("{x}", g.x)).then(function (img) { return { g: g, img: img }; }); })); }
  return Promise.all([layer("base"), layer("ref")]).then(function (r) { return r[0].some(function (t) { return t.img; }) ? { base: r[0], ref: r[1] } : null; });
}
function paintTiles(ctx, list) { list.forEach(function (t) { if (t.img) ctx.drawImage(t.img, t.g.px, t.g.py, t.g.size + 0.5, t.g.size + 0.5); }); }
function tracePolys(ctx, P, polys) { ctx.beginPath(); polys.forEach(function (poly) { poly.forEach(function (ring) { ring.forEach(function (p, i) { var q = P(p); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); }); }); }
function prepCanvas(canvas) { var ctx = canvas.getContext("2d"); ctx.setTransform(2, 0, 0, 2, 0, 0); return { ctx: ctx, W: canvas.width / 2, H: canvas.height / 2 }; }

function drawMap(canvas, district, pts, opts) {
  var c = prepCanvas(canvas), P = projector(district.bbox, c.W, c.H, 30);
  paintMap(c, P, district, pts, opts, null);
  // se dibuja enseguida sin fondo y se repite cuando llegan las teselas
  return loadBasemap(P, c.W, c.H).then(function (tiles) { if (tiles) paintMap(c, P, district, pts, opts, tiles); }).catch(function () {});
}
function paintMap(c, P, district, pts, opts, tiles) {
  var ctx = c.ctx, Wd = c.W, Hd = c.H, colorOf = opts.colorOf || function (p) { return TYPE_BY[p.type].color; };
  ctx.clearRect(0, 0, Wd, Hd);
  ctx.fillStyle = "#eef2f4"; ctx.fillRect(0, 0, Wd, Hd);
  if (tiles) {
    paintTiles(ctx, tiles.base);
    // fuera del circuito el mapa queda más apagado
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Wd, Hd); tracePolys(ctx, P, district.polys); ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fill("evenodd"); ctx.restore();
    DISTRICTS.forEach(function (d) { if (d.id === district.id) return; tracePolys(ctx, P, d.polys); ctx.strokeStyle = PAPER.ctxLine; ctx.lineWidth = 1; ctx.stroke(); });
    paintTiles(ctx, tiles.ref);
  } else {
    DISTRICTS.forEach(function (d) { if (d.id === district.id) return; tracePolys(ctx, P, d.polys); ctx.fillStyle = PAPER.ctx; ctx.fill("evenodd"); ctx.strokeStyle = PAPER.ctxLine; ctx.lineWidth = 1; ctx.stroke(); });
    tracePolys(ctx, P, district.polys); ctx.fillStyle = "#ffffff"; ctx.fill("evenodd");
  }
  if (opts.numbered) {
    ctx.save(); tracePolys(ctx, P, district.polys); ctx.clip("evenodd");
    district.barrios.forEach(function (b, i) { tracePolys(ctx, P, b.polys); ctx.fillStyle = ["rgba(11,99,246,.07)", "rgba(11,99,246,.15)", "rgba(244,220,0,.16)"][i % 3]; ctx.fill("evenodd"); });
    ctx.restore();
  }
  ctx.setLineDash([4, 4]); ctx.strokeStyle = PAPER.barrio; ctx.lineWidth = opts.numbered ? 1.2 : 0.8;
  ctx.save(); tracePolys(ctx, P, district.polys); ctx.clip("evenodd");
  district.barrios.forEach(function (b) { tracePolys(ctx, P, b.polys); ctx.stroke(); });
  ctx.restore();
  ctx.setLineDash([]);
  tracePolys(ctx, P, district.polys); ctx.strokeStyle = PAPER.district; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.lineCap = "round";
  pts.forEach(function (p) {
    if (!p.coords) return;
    ctx.beginPath(); p.coords.forEach(function (cc, i) { var q = P(cc); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = opts.lineW + 3; ctx.stroke();
    ctx.strokeStyle = colorOf(p); ctx.lineWidth = opts.lineW; ctx.stroke();
  });
  // muchos puntos: puntitos sin ícono, para que no se tapen entre sí (igual que en el mapa)
  var nPts = pts.filter(function (p) { return !p.coords; }).length, dense = nPts > 120;
  var r = dense ? 3.4 : opts.radius;
  pts.forEach(function (p) {
    if (p.coords) return;
    var t = TYPE_BY[p.type], q = P([p.lng, p.lat]);
    ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
    ctx.fillStyle = colorOf(p); ctx.fill(); ctx.lineWidth = dense ? 0.8 : 1.2; ctx.strokeStyle = "#ffffff"; ctx.stroke();
    if (dense) return;
    var k = (r * 1.32) / 24;
    ctx.save(); ctx.translate(q[0] - 12 * k, q[1] - 12 * k); ctx.scale(k, k);
    ctx.fillStyle = "#ffffff"; ctx.fill(new Path2D(ICONS[t.icon]), "evenodd"); ctx.restore();
  });
  ctx.font = "600 12px Poppins, Arial, sans-serif"; ctx.textAlign = "center"; ctx.lineJoin = "round";
  if (opts.numbered) {
    // plano: cada barrio con su número, que remite al listado de la misma hoja
    ctx.textBaseline = "middle"; ctx.font = "600 12px Poppins, Arial, sans-serif";
    district.barrios.forEach(function (b, i) {
      var q = P(b.labels[district.id] || b.label), n = String(i + 1), rr = n.length > 1 ? 12 : 10.5;
      ctx.beginPath(); ctx.arc(q[0], q[1], rr, 0, Math.PI * 2); ctx.fillStyle = PAPER.navy; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#ffffff"; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.fillText(n, q[0], q[1] + 0.5);
    });
    ctx.textBaseline = "alphabetic";
  } else district.barrios.forEach(function (b) {
    var q = P(b.labels[district.id] || b.label);
    ctx.strokeStyle = "rgba(255,255,255,.92)"; ctx.lineWidth = 3.5; ctx.strokeText(b.name.toUpperCase(), q[0], q[1]);
    ctx.fillStyle = PAPER.navy; ctx.fillText(b.name.toUpperCase(), q[0], q[1]);
  });
  if (tiles) { ctx.font = "9px Poppins, Arial, sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(Wd - 205, Hd - 15, 205, 15); ctx.fillStyle = PAPER.muted; ctx.fillText("Mapa base © Esri, HERE, Garmin, © OpenStreetMap", Wd - 5, Hd - 4); }
  // norte
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(Wd - 26, 28, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAPER.navy; ctx.beginPath(); ctx.moveTo(Wd - 26, 16); ctx.lineTo(Wd - 32, 33); ctx.lineTo(Wd - 26, 29); ctx.lineTo(Wd - 20, 33); ctx.closePath(); ctx.fill();
  ctx.font = "700 9px Poppins, Arial, sans-serif"; ctx.fillText("N", Wd - 26, 52);
  // escala
  var kmPx = P.kmPx, steps = [0.25, 0.5, 1, 2, 5], barKm = steps.filter(function (x) { return x * kmPx <= Wd / 5; }).pop() || 0.25, w = barKm * kmPx;
  ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fillRect(10, Hd - 34, w + 20, 26);
  ctx.fillStyle = PAPER.navy; ctx.fillRect(20, Hd - 16, w / 2, 4); ctx.strokeStyle = PAPER.navy; ctx.lineWidth = 1; ctx.strokeRect(20 + w / 2, Hd - 16, w / 2, 4);
  ctx.textAlign = "left"; ctx.font = "600 9.5px Poppins, Arial"; ctx.fillText("0", 18, Hd - 21); ctx.textAlign = "right"; ctx.fillText(barKm < 1 ? barKm * 1000 + " m" : barKm + " km", 22 + w, Hd - 21);
}

function drawLocator(canvas, district) {
  var c = prepCanvas(canvas), ctx = c.ctx;
  ctx.fillStyle = PAPER.soft; ctx.fillRect(0, 0, c.W, c.H);
  var bb = [Infinity, Infinity, -Infinity, -Infinity];
  DISTRICTS.forEach(function (d) { bb[0] = Math.min(bb[0], d.bbox[0]); bb[1] = Math.min(bb[1], d.bbox[1]); bb[2] = Math.max(bb[2], d.bbox[2]); bb[3] = Math.max(bb[3], d.bbox[3]); });
  var P = projector(bb, c.W, c.H, 12);
  DISTRICTS.forEach(function (d) {
    tracePolys(ctx, P, d.polys); ctx.fillStyle = d.id === district.id ? PAPER.navy : "#d5dde3"; ctx.fill("evenodd");
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2; ctx.stroke();
  });

}

function chartStack(canvas, labels, datasets) {
  charts.push(new Chart(canvas, {
    type: "bar",
    data: { labels: labels, datasets: datasets },
    options: {
      indexAxis: "y", responsive: false, animation: false, devicePixelRatio: 2,
      datasets: { bar: { borderColor: "#ffffff", borderWidth: { right: 1 }, borderSkipped: false, maxBarThickness: 18 } },
      plugins: { legend: { display: true, position: "bottom", labels: { color: PAPER.ink, boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 13, family: "Poppins, Arial" } } }, tooltip: { enabled: false } },
      scales: {
        x: { stacked: true, beginAtZero: true, grid: { color: PAPER.line }, border: { display: false }, ticks: { color: PAPER.muted, precision: 0, font: { size: 12, family: "Poppins, Arial" } }, title: { display: true, text: "Cantidad de intervenciones", color: PAPER.muted, font: { size: 12, family: "Poppins, Arial" } } },
        y: { stacked: true, grid: { display: false }, border: { color: PAPER.ink }, ticks: { color: PAPER.ink, font: { size: 13, family: "Poppins, Arial", weight: 500 } } }
      }
    }
  }));
}

function sheetShell(pageNo, total, inner) {
  if (inner.indexOf('<div class="cover-full">') === 0) return '<article class="sheet cover-sheet">' + inner + '</article>';
  var src = SOURCE.sample ? "Datos de ejemplo. No representan intervenciones reales." : "Fuente: GeoGestión, actualizada al " + SOURCE.when.toLocaleDateString("es-AR");
  return '<article class="sheet">' + inner + '<div class="foot"><span>' + esc(CFG.organismo) + ' - ' + esc(src) + '</span><span class="pg">' + String(pageNo).padStart(2, "0") + ' / ' + String(total).padStart(2, "0") + '</span></div></article>';
}
function band(d, title, sub, opts) {
  opts = opts || {};
  var today = new Date().toLocaleDateString("es-AR");
  return '<div class="band' + (opts.cls ? ' ' + opts.cls : '') + '"><div class="eyebrow"><span>' + esc(CFG.organismo) + '</span><span>Ficha técnica · ' + esc(d.name) + ' · ' + today + '</span></div>' +
    (opts.type ? '<div class="tline">' + badge(opts.type, opts.cls === 'slim' ? 30 : 46) + '<h2>' + esc(title) + '</h2></div>' : '<h2>' + esc(title) + '</h2>') +
    (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (opts.type ? '<div class="rule" style="background:' + opts.type.color + '"></div>' : '');
}
function tiles(list, cls) { return '<div class="tiles' + (cls ? ' ' + cls : '') + '">' + list.map(function (x) { return '<div class="tile' + (x.txt ? ' txt' : '') + '"><b>' + x.v + '</b><span>' + x.l + '</span></div>'; }).join("") + '</div>'; }

function titleCase(t) { return String(t).toLowerCase().replace(/(^|[\s(."'-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }); }
// hoja del plano: el circuito con sus barrios numerados, el listado de barrios y las 3 listas más votadas a concejal (2023)
function planoPage(d) {
  var nb = d.barrios.length, c = CONCEJALES[d.key];
  var blist = '<ol class="blist' + (nb > 24 ? ' c3' : nb > 8 ? ' c2' : '') + '">' + d.barrios.map(function (b) { return '<li>' + esc(b.name) + '</li>'; }).join("") + '</ol>';
  var elec = c ? '<div class="elec">' + c.listas.map(function (l, i) {
    var pct = l.votos / c.total * 100;
    return '<div class="el-row"><span class="el-pos">' + (i + 1) + '</span><div class="el-main"><b>' + esc(l.nombre) + '</b><small>Lista ' + esc(l.lista) + ' · ' + esc(titleCase(l.candidato)) + '</small><div class="el-bar"><i style="width:' + (pct / (c.listas[0].votos / c.total * 100) * 100).toFixed(1) + '%"></i></div></div>' +
      '<div class="el-v"><b>' + pct.toFixed(1).replace(".", ",") + '%</b><small>' + fmt.format(l.votos) + ' votos</small></div></div>';
  }).join("") + '<p class="tnote">Porcentaje sobre ' + fmt.format(c.total) + ' votos a listas de concejales en el circuito (no incluye blancos ni nulos). Elecciones municipales 2023.</p></div>'
    : '<p class="tnote">No hay resultados electorales cargados para este circuito.</p>';
  return band(d, "Plano del circuito", nb + (nb === 1 ? " barrio" : " barrios") + " · " + esc(d.name)) +
    '<div class="body"><div class="sh-map"><canvas data-map="plano" width="1444" height="980"></canvas></div>' +
    '<div class="plano-cols' + (nb > 24 ? ' wide' : '') + '"><div><h3 class="sh-h3">Barrios del circuito</h3>' + blist + '</div>' +
    '<div><h3 class="sh-h3">Concejales 2023 · listas más votadas</h3>' + elec + '</div></div></div>';
}

function buildFicha() {
  charts.forEach(function (c) { c.destroy(); }); charts = [];
  var d = DIST_BY[state.district];
  var on = state.types.size ? state.types : new Set(TYPES.map(function (t) { return t.id; }));
  var dpts = ITEMS.filter(function (p) { return p.district === d.id && on.has(p.type); });
  var types = TYPES.filter(function (t) { return dpts.some(function (p) { return p.type === t.id; }); });
  var isLine = function (t) { return dpts.some(function (p) { return p.type === t.id && p.coords; }); };
  var nb = d.barrios.length, pages = [];
  // solo cuentan los barrios del circuito, así "alcanzados" nunca supera el total
  var own = new Set(d.barrios.map(function (b) { return b.id; }));
  function barriosDe(tp) { return new Set(tp.map(function (p) { return p.barrio; }).filter(function (b) { return own.has(b); })).size; }
  function countBy(tp) {
    return d.barrios.map(function (b) { var bp = tp.filter(function (p) { return p.barrio === b.id; }); return { b: b, n: bp.length, m: bp.reduce(function (a, p) { return a + (p.m || 0); }, 0) }; }).sort(function (a, b) { return b.n - a.n || byName(a.b, b.b); });
  }
  var lines = dpts.filter(function (p) { return p.coords && TYPE_BY[p.type].icon === "pav"; });

  // 1. Portada / resumen
  var maxT = Math.max.apply(null, types.map(function (t) { return dpts.filter(function (p) { return p.type === t.id; }).length; }).concat([1]));
  var rows = types.map(function (t) {
    var tp = dpts.filter(function (p) { return p.type === t.id; }), line = isLine(t);
    var subs = t.subs ? '<div class="subline">' + t.subs.map(function (x) { var n = tp.filter(function (p) { return p.sub === x.name; }).length; return n ? '<span><i style="background:' + x.color + '"></i>' + esc(x.name) + ' ' + n + '</span>' : ''; }).join("") + '</div>' : '';
    return '<tr><td><span class="tcell">' + badge(t, 20) + '<span>' + esc(t.name) + subs + '</span></span></td><td class="barcell"><div class="hbar" style="width:' + (tp.length / maxT * 100) + '%;background:' + t.color + '"></div></td><td class="r nw"><b>' + fmt.format(tp.length) + '</b>' + (line ? ' <small>cuadras</small>' : '') + '</td><td class="r">' + barriosDe(tp) + '/' + nb + '</td></tr>';
  }).join("");
  pages.push(band(d, 'Resumen del circuito', nb + (nb === 1 ? ' barrio · ' : ' barrios · ') + fmt.format(dpts.length) + ' intervenciones municipales registradas') +
    '<div class="body">' +
    '<div class="sh-map"><canvas data-map="all" width="1444" height="' + (types.length > 8 ? 700 : 820) + '"></canvas></div>' +
    '<div><h3 class="sh-h3">Intervenciones por tipo</h3><table class="t"><thead><tr><th>Tipo</th><th></th><th class="r">Cantidad</th><th class="r">Barrios</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '</div>');

  // 2. Una página por tipo (+ listado)
  types.forEach(function (t) {
    var tp = dpts.filter(function (p) { return p.type === t.id; }), line = isLine(t);
    var m = tp.reduce(function (a, p) { return a + (p.m || 0); }, 0);
    var byB = countBy(tp).filter(function (x) { return x.n; }), top = byB[0], shown = byB.slice(0, MAXROWS);
    var maxB = top ? top.n : 1;
    var subs = t.subs ? t.subs.filter(function (x) { return tp.some(function (p) { return p.sub === x.name; }); }) : null;
    var sublabel = t.splitBy === "tipo" ? "Tipo" : "Indicador";
    var ncols = subs ? subs.length + 3 : (line ? 5 : 4);
    var trows = shown.map(function (x) {
      var pct = '<td class="r">' + Math.round(x.n / tp.length * 100) + '%</td>';
      if (subs) return '<tr><td><span class="bn">' + esc(x.b.name) + '</span></td>' + subs.map(function (u) { var n = tp.filter(function (p) { return p.barrio === x.b.id && p.sub === u.name; }).length; return '<td class="r' + (n ? '' : ' zero') + '">' + n + '</td>'; }).join("") + '<td class="r"><b>' + x.n + '</b></td>' + pct + '</tr>';
      return '<tr><td><span class="bn">' + esc(x.b.name) + '</span></td><td class="barcell"><div class="hbar" style="width:' + (x.n / maxB * 100) + '%;background:' + t.color + '"></div></td><td class="r"><b>' + x.n + '</b></td>' + (line ? '<td class="r">' + fmt.format(Math.round(x.m)) + '</td>' : '') + pct + '</tr>';
    }).join("") + (byB.length > MAXROWS ? '<tr><td colspan="' + ncols + '" class="more">y ' + (byB.length - MAXROWS) + ' barrios más con menos intervenciones</td></tr>' : '');
    var thead = subs
      ? '<th>Barrio</th>' + subs.map(function (u) { return '<th class="r sub"><i style="background:' + u.color + '"></i>' + esc(u.name) + '</th>'; }).join("") + '<th class="r">Total</th><th class="r">Participación</th>'
      : '<th>Barrio</th><th></th><th class="r">' + (line ? 'Cuadras' : 'Cantidad') + '</th>' + (line ? '<th class="r">Metros</th>' : '') + '<th class="r">Participación</th>';
    var legend = subs ? '<div class="sh-legend sub-legend"><b>' + sublabel + ':</b>' + subs.map(function (u) { return '<span><i style="background:' + u.color + '"></i>' + esc(u.name) + ' (' + tp.filter(function (p) { return p.sub === u.name; }).length + ')</span>'; }).join("") + '</div>' : '';
    var mapH = shown.length > 8 ? 600 : shown.length > 4 ? 760 : 900;
    pages.push(band(d, t.name, 'Intervenciones de este tipo en ' + esc(d.name), { type: t }) +
      '<div class="body">' +
      tiles(line
        ? [{ v: fmt.format(tp.length), l: "Cuadras" }, { v: km(m) + '<small> km</small>', l: "Extensión" }, { v: barriosDe(tp) + '<small> / ' + nb + '</small>', l: "Barrios alcanzados" }, { v: top ? esc(top.b.name) : "–", l: "Mayor concentración", txt: true }]
        : [{ v: fmt.format(tp.length), l: "Intervenciones" }, { v: (tp.length / dpts.length < 0.005 ? '&lt;1' : Math.round(tp.length / dpts.length * 100)) + '<small>%</small>', l: "Del total del circuito" }, { v: barriosDe(tp) + '<small> / ' + nb + '</small>', l: "Barrios alcanzados" }, { v: top ? esc(top.b.name) : "–", l: "Mayor concentración", txt: true }]) +
      '<div class="sh-map"><canvas data-map="' + t.id + '" width="1444" height="' + mapH + '"></canvas></div>' + legend +
      '<div><h3 class="sh-h3">Ranking de barrios</h3><table class="t' + (subs ? ' bysub' : '') + '"><thead><tr>' + thead + '</tr></thead><tbody>' + trows + '</tbody></table>' +
      '<p class="tnote">Participación: qué parte del total de ' + esc(t.name) + ' en ' + esc(d.name) + ' está en cada barrio.</p></div>' +
      '</div>');

    if (!$("opt-list").checked) return;
    var list = tp.slice().sort(function (a, b) {
      var an = a.barrio ? BARRIO_BY[a.barrio].name : "", bn = b.barrio ? BARRIO_BY[b.barrio].name : "";
      return an.localeCompare(bn, "es", { numeric: true }) || (subs ? a.sub.localeCompare(b.sub, "es") : 0) || a.dir.localeCompare(b.dir, "es", { numeric: true });
    });
    // listado a dos columnas, agrupado por barrio y con la dirección completa (puede ocupar más de una línea):
    // se mide cada dirección para saber cuánto alto ocupa y armar las columnas sin que la hoja se corte
    var LH = 19.5, CAP = LIST_CAP - (subs ? 30 : 0), aw = 350 - 12 - (line ? 52 : 0) - (subs ? 16 : 0);
    var cols = [], col = [], used = 0, prevB = null;
    function rowH(p) { return Math.max(1, Math.ceil(textW(p.dir || "Sin dirección") * 1.04 / aw)) * LH + 7; }
    function grp(bid, cont) { return { g: bid, cont: cont }; }
    list.forEach(function (p) {
      var h = rowH(p), needHead = p.barrio !== prevB;
      if (used + h + (needHead ? GRP_H : 0) > CAP && col.length) { cols.push(col); col = []; used = 0; needHead = true; }
      if (needHead) { col.push(grp(p.barrio, p.barrio === prevB)); used += GRP_H; }
      col.push(p); used += h; prevB = p.barrio;
    });
    if (col.length) cols.push(col);
    var nPages = Math.ceil(cols.length / 2);
    var counts = {}; list.forEach(function (p) { counts[p.barrio] = (counts[p.barrio] || 0) + 1; });
    var legend = subs ? '<div class="sh-legend sub-legend list-legend"><b>' + sublabel + ':</b>' + subs.map(function (u) { return '<span><i style="background:' + u.color + '"></i>' + esc(u.name) + '</span>'; }).join("") + '</div>' : '';
    for (var i = 0; i < cols.length; i += 2) {
      var html = cols.slice(i, i + 2).map(function (c) {
        return '<table class="t lst"><thead><tr><th>Dirección</th>' + (line ? '<th class="r m">m</th>' : '') + '</tr></thead><tbody>' + c.map(function (p) {
          if (p.g !== undefined) return '<tr class="grp"><td colspan="' + (line ? 2 : 1) + '">' + (p.g ? esc(BARRIO_BY[p.g].name) : 'Sin barrio') + ' <small>' + (p.cont ? '(continúa)' : counts[p.g] + (line ? ' cuadras' : '')) + '</small></td></tr>';
          return '<tr><td>' + (subs ? '<i class="dot" style="background:' + subColor(p) + '"></i>' : '') + esc(p.dir || "Sin dirección") + '</td>' + (line ? '<td class="r m">' + Math.round(p.m) + '</td>' : '') + '</tr>';
        }).join("") + '</tbody></table>';
      });
      var part = nPages > 1 ? ' (' + (i / 2 + 1) + ' de ' + nPages + ')' : '';
      pages.push(band(d, t.name + ' · listado' + part, null, { type: t, cls: 'slim' }) + '<div class="body">' + legend + '<div class="list-cols">' + html.join("") + '</div></div>');
    }
  });

  // 3. Síntesis ejecutiva (va como segunda hoja)
  var nBefore = pages.length;
  var tot = countBy(dpts), topB = tot.filter(function (x) { return x.n; }).slice(0, MAXBARS);
  var findings = [];
  if (dpts.length) findings.push('<li class="all">' + badge({ color: PAPER.navy, icon: "pin" }, 22) + '<span><b>En conjunto,</b> ' + esc(tot[0].b.name) + ' es el barrio con más intervenciones (' + tot[0].n + ', ' + Math.round(tot[0].n / dpts.length * 100) + '% del circuito)' + (tot[tot.length - 1].n < tot[0].n ? ' y ' + esc(tot[tot.length - 1].b.name) + ' el que menos recibió (' + tot[tot.length - 1].n + ')' : '') + '.</span></li>');
  types.forEach(function (t) {
    var tp = dpts.filter(function (p) { return p.type === t.id; }), line = isLine(t), byB = countBy(tp);
    var zero = byB.filter(function (x) { return !x.n; }).length;
    findings.push('<li>' + badge(t, 22) + '<span><b>' + esc(t.name) + ':</b> ' + esc(byB[0].b.name) + ' concentra ' + byB[0].n + ' de ' + tp.length + (line ? ' cuadras' : ' intervenciones') + ' (' + Math.round(byB[0].n / tp.length * 100) + '%)' + (zero ? '; ' + zero + (zero === 1 ? ' barrio sin registros' : ' barrios sin registros') : '') + '.</span></li>');
  });
  var colMax = {}; types.forEach(function (t) { colMax[t.id] = Math.max.apply(null, topB.map(function (x) { return dpts.filter(function (p) { return p.barrio === x.b.id && p.type === t.id; }).length; }).concat([1])); });
  function hex2rgba(h, a) { var n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  var heat = '<table class="t heat"><thead><tr><th>Barrio</th>' + types.map(function (t) { return '<th class="c">' + badge(t, 20) + '</th>'; }).join("") + '<th class="r">Total</th></tr></thead><tbody>' +
    topB.map(function (x) {
      return '<tr><td>' + esc(x.b.name) + '</td>' + types.map(function (t) {
        var n = dpts.filter(function (p) { return p.barrio === x.b.id && p.type === t.id; }).length, a = n ? 0.12 + 0.6 * n / colMax[t.id] : 0;
        return '<td class="v' + (n ? '' : ' zero') + '" style="background:' + (n ? hex2rgba(t.color, a.toFixed(2)) : 'transparent') + '">' + n + '</td>';
      }).join("") + '<td class="r"><b>' + x.n + '</b></td></tr>';
    }).join("") + '</tbody></table>' +
    '<div class="sh-legend" style="margin-top:8px">' + types.map(function (t) { return '<span>' + badge(t, 16) + esc(t.name) + '</span>'; }).join("") + '</div>';
  var stackH = Math.min(Math.max(220, topB.length * 30 + 110), 560);
  var many = topB.length > 8;
  var keyTiles = tiles([{ v: fmt.format(dpts.length), l: "Intervenciones" }, { v: barriosDe(dpts) + '<small> / ' + nb + '</small>', l: "Barrios alcanzados" }].concat(ELECTORES[d.key] ? [{ v: fmt.format(ELECTORES[d.key].electores), l: "Electores" }, { v: fmt.format(ELECTORES[d.key].escuelas), l: ELECTORES[d.key].escuelas === 1 ? "Escuela donde se vota" : "Escuelas donde se vota" }] : []), "g2");
  pages.push(band(d, "Síntesis ejecutiva", "Lo principal de " + esc(d.name) + " en una hoja") +
    '<div class="body"><div class="syn-head"><div class="locator"><canvas data-locator="1" width="440" height="330"></canvas><p>' + esc(d.name) + ' dentro de la ciudad</p></div>' + keyTiles + '</div><div><h3 class="sh-h3">Lectura rápida</h3><ul class="findings">' + findings.join("") + '</ul></div></div>');
  pages.push(band(d, "Síntesis ejecutiva · por barrio", "Qué barrios concentran más intervenciones según el tipo" + (tot.filter(function (x) { return x.n; }).length > MAXBARS ? " · " + MAXBARS + " barrios con más intervenciones" : "")) +
    '<div class="body"><div><h3 class="sh-h3">Intervenciones por barrio y tipo</h3><canvas data-chart="stack" width="722" height="' + stackH + '"></canvas></div>' +
    (many ? '' : '<div><h3 class="sh-h3">Cuadro por barrio y tipo</h3>' + heat + '</div>') + '</div>');
  if (many) pages.push(band(d, "Cuadro por barrio y tipo", "Cantidad de intervenciones de cada tipo en cada barrio. El color más intenso marca dónde se concentra cada tipo.") + '<div class="body">' + heat + '</div>');

  // portada
  var cover = '<div class="cover-full"><div class="cv-top"><img class="cv-logo" src="img/logo-blanco.svg" alt="Qué hicimos en los barrios · Fichas técnicas">' +
    '<div class="cv-title"><span>Ficha técnica</span><h1>' + esc(d.name) + '</h1><p>' + nb + (nb === 1 ? ' barrio · ' : ' barrios · ') + fmt.format(dpts.length) + ' intervenciones municipales · ' +
    (SOURCE.sample ? 'datos de ejemplo' : 'actualizada al ' + SOURCE.when.toLocaleDateString("es-AR")) + '</p></div></div>' +
    '<div class="cv-bottom"><div class="cv-org"><b>Subsecretaría de Gestión Estratégica</b><span>Secretaría General</span><span>' + esc(CFG.organismo) + '</span></div></div></div>';
  var plano = planoPage(d);
  pages = [cover, plano].concat(pages.slice(nBefore), [pages[0]], pages.slice(1, nBefore));

  $("sheets").innerHTML = pages.map(function (inner, i) { return sheetShell(i + 1, pages.length, inner); }).join("");
  $("viewer-title").textContent = "Ficha técnica · " + d.name;

  // con letra más grande algunas hojas no entran: el mapa se achica lo justo para que la hoja no se corte
  $("sheets").querySelectorAll(".sheet canvas[data-map]").forEach(function (cv) {
    var sh = cv.closest(".sheet"), foot = sh.querySelector(".foot");
    var bottom = Math.max.apply(null, Array.prototype.map.call(sh.querySelectorAll(".body > *"), function (e) { return e.getBoundingClientRect().bottom; }));
    var over = bottom - foot.getBoundingClientRect().top;
    if (over > 0) cv.height = Math.max(360, cv.height - Math.ceil(over * cv.width / cv.getBoundingClientRect().width) - 8);
  });
  var draws = [];
  $("sheets").querySelectorAll("canvas[data-map]").forEach(function (cv) {
    var k = cv.getAttribute("data-map"), t = TYPE_BY[k];
    if (k === "plano") { draws.push(drawMap(cv, d, [], { numbered: true, radius: 7, lineW: 4 })); return; }
    draws.push(drawMap(cv, d, k === "all" ? dpts : dpts.filter(function (p) { return p.type === k; }), { radius: k === "all" ? 7 : 9.5, lineW: k === "all" ? 4 : 6, colorOf: t && t.subs ? subColor : null }));
  });
  fichaReady = Promise.all(draws);
  $("sheets").querySelectorAll("canvas[data-locator]").forEach(function (cv) { drawLocator(cv, d); });
  var cv = $("sheets").querySelector('canvas[data-chart="stack"]');
  if (cv) chartStack(cv, topB.map(function (x) { return x.b.name; }), types.map(function (t) { return { label: t.name, backgroundColor: t.color, data: topB.map(function (x) { return dpts.filter(function (p) { return p.barrio === x.b.id && p.type === t.id; }).length; }) }; }));
}

function initViewer() {
  $("btn-ficha").addEventListener("click", function () {
    if (!state.district) return;
    $("viewer-msg").textContent = "";
    $("viewer").hidden = false;
    // los mapas y gráficos de la ficha escriben con Poppins: esperar a que esté cargada
    var fonts = document.fonts ? Promise.all(["400 12px Poppins", "600 12px Poppins"].map(function (f) { return document.fonts.load(f); })).catch(function () {}) : Promise.resolve();
    fonts.then(function () { buildFicha(); $("sheets").scrollTop = 0; });
  });
  $("btn-close").addEventListener("click", function () { $("viewer").hidden = true; });
  $("opt-list").addEventListener("change", buildFicha);
  $("btn-pdf").addEventListener("click", async function () {
    var btn = this, msg = $("viewer-msg"), label = btn.textContent;
    btn.disabled = true; msg.textContent = "";
    try {
      btn.textContent = "Cargando mapas…";
      await fichaReady;
      var pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      var sheets = $("sheets").querySelectorAll(".sheet");
      for (var i = 0; i < sheets.length; i++) {
        btn.textContent = "Armando página " + (i + 1) + " de " + sheets.length + "…";
        var cvs = await html2canvas(sheets[i], { scale: 2, backgroundColor: "#ffffff", logging: false });
        if (i) pdf.addPage();
        pdf.addImage(cvs.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297);
      }
      var name = "Ficha_tecnica_" + DIST_BY[state.district].name.replace(/[^\wÀ-ÿ-]+/g, "_") + ".pdf";
      pdf.save(name);
      msg.textContent = "PDF descargado: " + name;
    } catch (e) {
      msg.textContent = "No se pudo armar el PDF (" + (e && e.message || "error") + ").";
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  });
}

loadAll().then(function () {
  initMap(); initPanel(); initViewer(); render(); updateBarrLabels();
}).catch(function (e) {
  var tag = $("data-tag"); tag.textContent = "No se pudieron cargar los datos"; tag.classList.add("err");
  $("warn").textContent = e.message; $("warn").hidden = false;
  console.error(e);
});
})();
