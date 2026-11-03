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
  llama:   "M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.4 1.3-4 2.6-5.3.1 1.6.8 2.8 2 3.3C11 8.6 11 5.5 12 2z",
  libro:   "M3 5.5C5.5 4.5 8.5 4.5 11 6v13c-2.5-1.5-5.5-1.5-8-.5zM13 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5z",
  pincel:  "M15 2.5l6.5 6.5-7 7-6.5-6.5zM7 11.5l5.5 5.5c-.6 2.8-2.9 4.5-5.7 4.5H3v-3.8c0-2.8 1.6-5.2 4-6.2z",
  reciclar:"M9.2 3.5h5.6l2.6 4.5 1.8-1 -1.2 5-5-1.2 1.8-1L13 6.5h-2L9.4 9.3 6.8 7.8zM4.4 12.2l2.6-1.5 1.6 2.8L10.2 16v-2l4.6 3.4-4.6 3.4v-2H7.4L4.5 15.6zM19.6 12.2l-2.6 4.4h-3.4v3h3.8l2.8-4.8 1.8 1-.8-5.2-4.8 1.6z",
  bolsa:   "M7 8V7a5 5 0 0 1 10 0v1h3l-1 13H5L4 8zm2 0h6V7a3 3 0 0 0-6 0z",
  sol:     "M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8L7 8.4zM15.6 17l1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4l2.8-2.8 1.4 1.4-2.8 2.8zM15.6 7l2.8-2.8 1.4 1.4L17 8.4z",
  // íconos de los indicadores de la síntesis
  herram:  "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
  casas:   "M1 21.5V10l7-5.5 7 5.5v11.5h-4.6v-5.8H5.6v5.8zM16.6 21.5V9.3L11.5 5.3 14 3.3l8.5 6.6v11.6z",
  urna:    "M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4c0 1.1.89 2 1.99 2H19c1.1 0 2-.89 2-2v-4l-3-3zm-1-5.05l-4.95 4.95-3.54-3.54 4.95-4.95L17 7.95zm-4.24-5.66L6.39 8.66c-.39.39-.39 1.02 0 1.41l4.95 4.95c.39.39 1.02.39 1.41 0l6.36-6.36c.39-.39.39-1.02 0-1.41L14.16 2.3c-.38-.4-1.01-.4-1.4-.01z",
  escuela: "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z",
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
// distancia en metros de un punto al borde de un polígono (aprox. plana, alcanza a escala de ciudad)
function distToFeature(pt, f) {
  var kx = 111320 * Math.cos(pt[1] * Math.PI / 180), ky = 110540, best = Infinity;
  f.polys.forEach(function (poly) { poly.forEach(function (ring) {
    for (var i = 1; i < ring.length; i++) {
      var ax = (ring[i - 1][0] - pt[0]) * kx, ay = (ring[i - 1][1] - pt[1]) * ky, bx = (ring[i][0] - pt[0]) * kx, by = (ring[i][1] - pt[1]) * ky;
      var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0;
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
    }
  }); });
  return best;
}
// el polígono que contiene el punto o, si cae en una rendija entre polígonos (p. ej. sobre una avenida), el más cercano
function featureAt(pt, feats, maxM) {
  var f = feats.filter(function (x) { return inFeature(pt, x); })[0];
  if (f || !maxM) return f || null;
  var best = null, bd = maxM;
  feats.forEach(function (x) { var d = distToFeature(pt, x); if (d < bd) { bd = d; best = x; } });
  return best;
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
// Presupuesto Participativo: ganadores por n° de distrito y cruce con los circuitos (data/circuito-distrito.json)
var PP = { ganadores: {}, circuitos: {}, distritos: {}, edicion: null };
// las dos formas de dividir la ciudad: circuitos electorales y distritos de Presupuesto Participativo
var ZONES = { circuito: [], distrito: [] }, MODE = "circuito";
var SUBPAL = ["#1f78b4", "#e6550d", "#33a02c", "#e31a1c", "#b8860b", "#17becf", "#6a3d9a", "#555555"];
function colorDist(a, b) { var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return Math.abs((x >> 16) - (y >> 16)) + Math.abs((x >> 8 & 255) - (y >> 8 & 255)) + Math.abs((x & 255) - (y & 255)); }

// estilos de config.js por nombre normalizado (color, ícono e imagen de cada intervención y subgrupo)
var ESTILO = {};
function loadEstilos() {
  ESTILO = {};
  Object.keys(CFG.estilos || {}).forEach(function (k) {
    var e = CFG.estilos[k], subs = {};
    Object.keys(e.subgrupos || {}).forEach(function (s) { subs[norm(s)] = e.subgrupos[s]; });
    ESTILO[norm(k)] = { color: e.color, icono: e.icono, dibujo: e.dibujo, tinta: e.tinta || null, unidad: e.unidad || null, subgrupos: e.subgrupos ? subs : null };
  });
}
function buildTypes(names) {
  loadEstilos();
  var used = 0;
  TYPES = names.map(function (n) {
    var k = norm(n), rule = RULES.filter(function (r) { return r.re.test(k); })[0];
    var e = ESTILO[k] || {};
    return { id: "t" + k.replace(/[^a-z0-9]+/g, "-"), name: n, icon: e.dibujo || (rule ? rule.icon : "pin"), img: e.icono || null, estiloSubs: e.subgrupos || null, unidad: e.unidad || null, ink: e.tinta || null,
      color: e.color || (rule ? rule.color : SPARE[used++ % SPARE.length]) };
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
  // los polígonos dejan rendijas sobre algunas avenidas: lo que cae ahí (o a menos de 500 m del borde) va al más cercano
  var key = norm(barrioText), d = featureAt(pt, DISTRICTS, 500);
  var b = featureAt(pt, BARRIOS);
  if (!b && key) b = BARRIOS.filter(function (x) { return x.key === key && (!d || x.circuits.indexOf(d.id) >= 0); })[0] || null;
  if (!b && d) b = featureAt(pt, BARRIOS.filter(function (x) { return x.circuits.indexOf(d.id) >= 0; }), 500);
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
    var row = { tname: typeSeen[tk], sub: sc ? String(r[sc] || "").trim() || "Sin especificar" : "", foto: C.foto ? String(r[C.foto] || "").trim() : "", dir: C.direccion ? String(r[C.direccion] || "").trim() : "", barrioText: C.barrio ? r[C.barrio] : "", pt: [lng, lat] };
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
    var zd = ZONES.distrito.length ? featureAt(it.pt, ZONES.distrito, 500) : null;
    ITEMS.push({ id: id++, type: nameToType[it.tname], sub: it.sub, foto: it.foto || "", dir: it.dir, barrio: loc.barrio ? loc.barrio.id : null, zc: loc.district.id, zd: zd ? zd.id : null, district: MODE === "distrito" ? (zd ? zd.id : null) : loc.district.id, lng: it.pt[0], lat: it.pt[1], coords: it.coords, cuadra: it.cuadra, m: it.m });
  });
  SOURCE.skipped = skipped; SOURCE.unlocated = unlocated;
  // subgrupos de cada tipo, de mayor a menor; el primero conserva el color del tipo
  TYPES.forEach(function (t) {
    var n = {};
    ITEMS.forEach(function (p) { if (p.type === t.id && p.sub) n[p.sub] = (n[p.sub] || 0) + 1; });
    var names = Object.keys(n).sort(function (a, b) { return n[b] - n[a] || a.localeCompare(b, "es"); });
    // la paleta saltea los colores parecidos al del tipo, que queda para el primer subgrupo
    var pal = SUBPAL.filter(function (c) { return colorDist(c, t.color) > 120; });
    var ns = 0;
    t.subs = names.length > 1 ? names.map(function (x, i) {
      var e = t.estiloSubs && t.estiloSubs[norm(x)];
      if (e) return { name: x, color: e.color, img: e.icono || null, icon: e.dibujo || t.icon, ink: e.tinta || t.ink };
      return { name: x, color: i || t.estiloSubs ? pal[ns++ % pal.length] : t.color, img: null, icon: t.icon, ink: t.ink };
    }) : null;
    t.splitBy = SPLIT[norm(t.name)] || "";
  });
}
function subOf(p) { var t = TYPE_BY[p.type]; return (t.subs && t.subs.filter(function (x) { return x.name === p.sub; })[0]) || null; }
function subColor(p) { var s = subOf(p); return s ? s.color : TYPE_BY[p.type].color; }
// cómo se dibuja un punto: el ícono de su subgrupo si tiene, si no el de su tipo
function styleOf(p) { var t = TYPE_BY[p.type], s = subOf(p); return s && (s.img || s.icon !== t.icon || s.color !== t.color) ? s : t; }
// imágenes de íconos precargadas (para dibujarlas en los mapas de la ficha)
var IMG = {};
function preloadIcons() {
  var urls = {};
  TYPES.forEach(function (t) { if (t.img) urls[t.img] = 1; (t.subs || []).forEach(function (s) { if (s.img) urls[s.img] = 1; }); });
  return Promise.all(Object.keys(urls).map(function (u) {
    return new Promise(function (ok) { var im = new Image(); im.onload = function () { IMG[u] = im; ok(); }; im.onerror = function () { ok(); }; im.src = rel(u); });
  }));
}

async function loadAll() {
  var ppc = CFG.presupuestoParticipativo || {};
  var res = await Promise.all([
    fetch(rel(CFG.circuitos)).then(function (r) { return r.json(); }),
    fetch(rel(CFG.barrios)).then(function (r) { return r.json(); }),
    ppc.distritos ? fetch(rel(ppc.distritos)).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : null
  ]);
  ZONES.circuito = prepFeatures(res[0], CFG.campoNombreCircuito, ["nombre", "name", "circuito"], "D");
  ZONES.distrito = res[2] ? prepFeatures(res[2], "nombre", ["nombre", "distrito"], "P") : [];
  ZONES.circuito.forEach(function (d) { d.kind = "circuito"; });
  ZONES.distrito.forEach(function (d) { d.kind = "distrito"; d.num = +d.props.distrito; });
  DISTRICTS = ZONES.circuito;
  BARRIOS = prepFeatures(res[1], CFG.campoNombreBarrio, ["nombre", "name", "barrio"], "B");
  ZONES.circuito.concat(ZONES.distrito).forEach(function (d) { DIST_BY[d.id] = d; });
  BARRIOS.forEach(function (b) {
    BARRIO_BY[b.id] = b;
    b.labels = {}; b.zones = {};
    // un barrio puede caer en más de un circuito o distrito: la lista viene calculada en el GeoJSON
    [["circuito", "circuitos"], ["distrito", "distritos"]].forEach(function (z) {
      var names = Array.isArray(b.props[z[1]]) ? b.props[z[1]].map(norm) : null;
      var ds = ZONES[z[0]].filter(function (x) { return names ? names.indexOf(x.key) >= 0 : inFeature(b.label, x); });
      b.zones[z[0]] = ds.map(function (x) { return x.id; });
      ds.forEach(function (x) { var e = b.props.etiquetas && b.props.etiquetas[x.name]; b.labels[x.id] = e || b.label; x.barrios.push(b); });
    });
    b.circuits = b.zones.circuito;
  });
  ZONES.circuito.concat(ZONES.distrito).forEach(function (d) { d.barrios.sort(function (a, b) { return a.name.localeCompare(b.name, "es", { numeric: true }); }); });
  var extra = await Promise.all([
    fetch(rel("data/filtro-intervenciones.json")).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch(rel("data/actualizacion.json") + "?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch(rel("data/electores.json")).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch(rel("data/concejales2023.json")).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ].concat(["ganadores", "cruce"].map(function (k) {
    return ppc[k] ? fetch(rel(ppc[k])).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : null;
  })));
  PP = { ganadores: (extra[4] && extra[4].ganadores) || {}, edicion: extra[4] ? extra[4].edicion : null, circuitos: {}, distritos: {} };
  if (extra[5]) {
    Object.keys(extra[5].circuitos || {}).forEach(function (k) { PP.circuitos[norm(k)] = extra[5].circuitos[k]; });
    Object.keys(extra[5].distritos || {}).forEach(function (k) { PP.distritos[extra[5].distritos[k].distrito] = extra[5].distritos[k]; });
  }
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

function iconSvg(t, size) { return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path fill="' + (t.ink || '#fff') + '" fill-rule="evenodd" d="' + ICONS[t.icon] + '"/></svg>'; }
function badge(t, size) {
  if (t.img) return '<span class="badge" style="background:' + t.color + ';width:' + size + 'px;height:' + size + 'px"><img src="' + esc(t.img) + '" width="' + size + '" height="' + size + '" alt=""></span>';
  return '<span class="badge" style="background:' + t.color + ';width:' + size + 'px;height:' + size + 'px">' + iconSvg(t, Math.round(size * 0.66)) + '</span>';
}
// unidad en que se cuenta cada tipo: cuadras (líneas), la de config.js (p. ej. domicilios) o intervenciones
function unitOf(t, line) { return line ? "cuadras" : t.unidad || "intervenciones"; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
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
  document.querySelectorAll(".layers .seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".layers .seg button").forEach(function (x) { x.classList.toggle("on", x === b); });
      Object.keys(bases).forEach(function (k) { bases[k].remove(); });
      if (bases[b.dataset.base]) bases[b.dataset.base].addTo(map);
    });
  });

  distLayer = L.layerGroup(); barrLayer = L.layerGroup(); barrLabels = L.layerGroup(); ptLayer = L.layerGroup();
  buildZoneLayer();
  BARRIOS.forEach(function (b) {
    var poly = L.polygon(b.polys.map(function (p) { return p.map(toLL); }), { color: css("--barrio"), weight: 1, dashArray: "4 4", fill: false, interactive: false });
    barrPolys[b.id] = poly; poly.addTo(barrLayer);
    L.tooltip({ permanent: true, direction: "center", className: "blabel" }).setLatLng([b.label[1], b.label[0]]).setContent(esc(b.name)).addTo(barrLabels);
  });
  barrLayer.addTo(map); distLayer.addTo(map); ptLayer.addTo(map);
  cityBounds = L.latLngBounds([]);
  ZONES.circuito.forEach(function (d) { cityBounds.extend(distPolys[d.id].getBounds()); });
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
// circuitos o distritos, según lo que se eligió en "Ver por"
function buildZoneLayer() {
  distLayer.clearLayers(); distPolys = {};
  DISTRICTS.forEach(function (d) {
    var poly = L.polygon(d.polys.map(function (p) { return p.map(toLL); }), styleDistrict(d.id));
    L.tooltip({ permanent: true, direction: "center", className: "dlabel", interactive: false }).setLatLng([d.label[1], d.label[0]]).setContent(esc(d.name.replace(/^(circuito|distrito)\s*/i, ""))).addTo(distLayer);
    poly.on("click", function () { setDistrict(state.district === d.id ? "" : d.id); });
    poly.on("mouseover", function () { if (state.district !== d.id) poly.setStyle({ fillOpacity: 0.09, weight: 3 }); });
    poly.on("mouseout", function () { poly.setStyle(styleDistrict(d.id)); });
    distPolys[d.id] = poly; poly.addTo(distLayer);
  });
}
var ZONE_TXT = {
  circuito: { label: "Circuito electoral", todos: "Todos los circuitos", capa: "Circuitos", elegi: "Elegí un circuito para armar su ficha" },
  distrito: { label: "Distrito (Presupuesto Participativo)", todos: "Todos los distritos", capa: "Distritos", elegi: "Elegí un distrito para armar su ficha" }
};
function fillZones() {
  var T = ZONE_TXT[MODE];
  $("f-dist-l").textContent = T.label; $("lyr-dist-l").textContent = T.capa;
  $("f-dist").innerHTML = '<option value="">' + T.todos + '</option>' + DISTRICTS.slice().sort(byName).map(function (d) { return '<option value="' + d.id + '">' + esc(d.name) + '</option>'; }).join("");
}
function setMode(m) {
  if (m === MODE || !ZONES[m].length) return;
  MODE = m; DISTRICTS = ZONES[m];
  ITEMS.forEach(function (p) { p.district = m === "distrito" ? p.zd : p.zc; });
  document.querySelectorAll("#zone-mode button").forEach(function (x) { x.classList.toggle("on", x.dataset.mode === m); x.setAttribute("aria-pressed", x.dataset.mode === m); });
  buildZoneLayer(); fillZones();
  state.district = ""; state.barrio = "";
  setDistrict("");
}
function zonesOf(b) { return b.zones[MODE]; }
function styleDistrict(id) {
  var sel = state.district === id, dim = state.district && !sel;
  // el circuito elegido se rellena en celeste claro para que se distinga
  return { color: css("--district"), weight: sel ? 3.5 : 2, opacity: dim ? 0.5 : 1, fillColor: sel ? css("--selected") : css("--district"), fillOpacity: sel ? 0.28 : dim ? 0.12 : 0.02 };
}
function updateBarrLabels() { if ($("lyr-barr").checked && map.getZoom() >= 14.5) barrLabels.addTo(map); else barrLabels.remove(); }

function initPanel() {
  $("org").textContent = CFG.organismo; $("app-title").textContent = CFG.titulo; document.title = CFG.titulo;
  fillZones();
  if (!ZONES.distrito.length) $("zone-mode").hidden = true;
  $("zone-mode").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) setMode(b.dataset.mode); });
  fillBarrios();
  // arranca sin intervenciones en el mapa: con todas prendidas la carga es muy pesada
  state.types = new Set();
  $("types").innerHTML = TYPES.map(function (t) {
    return '<label class="type-row"><input type="checkbox" role="switch" data-type="' + t.id + '">' + badge(t, 26) + '<span class="nm">' + esc(t.name) + '</span><span class="n" id="n-' + t.id + '">0</span><span class="sw" aria-hidden="true"></span><span class="bar"><i id="b-' + t.id + '" style="background:' + t.color + '"></i></span></label>';
  }).join("");
  $("legend").innerHTML = TYPES.map(function (t) {
    return '<div>' + badge(t, 18) + esc(t.name) + '</div>' + (t.subs ? t.subs.map(function (s) { return '<div class="lsub">' + badge(s, 16) + esc(s.name) + '</div>'; }).join("") : "");
  }).join("");

  $("f-dist").addEventListener("change", function () { setDistrict($("f-dist").value); });
  $("f-barr").addEventListener("change", function () {
    state.barrio = $("f-barr").value;
    if (state.barrio) {
      var b = BARRIO_BY[state.barrio];
      if (zonesOf(b).indexOf(state.district) < 0) { state.district = zonesOf(b).length === 1 ? zonesOf(b)[0] : ""; $("f-dist").value = state.district; fillBarrios(); }
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
  if (state.barrio && (!id || zonesOf(BARRIO_BY[state.barrio]).indexOf(id) < 0)) state.barrio = "";
  $("f-dist").value = id; fillBarrios(); render();
  map.fitBounds(id ? distPolys[id].getBounds() : cityBounds, { padding: [30, 30] });
}
function inZone(p) { return (!state.district || p.district === state.district) && (!state.barrio || p.barrio === state.barrio); }

function popupHtml(p) {
  var t = TYPE_BY[p.type], b = BARRIO_BY[p.barrio];
  return '<div class="pop-h" style="background:' + t.color + '">' + iconSvg(t, 18) + esc(t.name) + '</div><div class="pop-b">' +
    (p.dir ? '<div class="dir">' + esc(p.dir) + '</div>' : '') +
    '<div class="meta">' + (b ? esc(b.name) + ' · ' : '') + esc(DIST_BY[p.zc].name) + (p.zd ? ' · ' + esc(DIST_BY[p.zd].name) : '') + '</div>' +
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
        markers[p.id] = L.circleMarker([p.lat, p.lng], { renderer: dotRenderer, radius: dotR, weight: 1, color: stroke, fillColor: styleOf(p).color, fillOpacity: 1 }).bindPopup(popupHtml(p)).addTo(ptLayer);
      } else if (view.contains([p.lat, p.lng]) || p.id === focusId) {
        markers[p.id] = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "pin", html: badge(styleOf(p), size), iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] }), title: t.name + (p.dir ? ", " + p.dir : "") }).bindPopup(popupHtml(p)).addTo(ptLayer);
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
  btn.title = state.district ? "" : ZONE_TXT[MODE].elegi;
  $("btn-ficha-label").textContent = state.district ? "Ficha técnica · " + DIST_BY[state.district].name : "Ficha técnica";
}

/* ---------- Ficha técnica ---------- */
// colores de la ficha, tomados del Informe de Gestión de la Subsecretaría
var PAPER = { ink: "#333333", muted: "#6b6b6b", line: "#d9d9d9", soft: "#f3f7ff", navy: "#333333", blue: "#0066ff", sky: "#2eb1ff", yellow: "#f4dc00", district: "#0066ff", barrio: "#8a9aa3", ctx: "#e7ecef", ctxLine: "#c9d3d8" };
var charts = [], fichaReady = Promise.resolve();
var MAXBARS = 15, MAXROWS = 11;
// listado de direcciones: alto útil de cada columna y de la fila con el nombre del barrio (px)
var LIST_CAP = 875, GRP_H = 40, LIST_FS = 14.5, LIST_COLW = 312;
var measureCtx = null;
function textW(t) { if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d"); measureCtx.font = "400 " + LIST_FS + "px Poppins, Arial, sans-serif"; return measureCtx.measureText(t).width; }
// texto oscuro o blanco según qué se lea mejor sobre el color
function inkOn(hex) { var x = parseInt(hex.slice(1), 16), l = (0.299 * (x >> 16) + 0.587 * (x >> 8 & 255) + 0.114 * (x & 255)) / 255; return l > 0.62 ? PAPER.navy : "#ffffff"; } // MAXROWS: filas del ranking en la hoja de cada tipo

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
    // todos los barrios en celeste claro con transparencia: los separa la línea punteada
    district.barrios.forEach(function (b) { tracePolys(ctx, P, b.polys); ctx.fillStyle = "rgba(11,99,246,.13)"; ctx.fill("evenodd"); });
    ctx.restore();
  }
  ctx.setLineDash([4, 4]); ctx.strokeStyle = PAPER.barrio; ctx.lineWidth = opts.numbered ? 1.2 : 0.8;
  ctx.save(); tracePolys(ctx, P, district.polys); ctx.clip("evenodd");
  district.barrios.forEach(function (b) { tracePolys(ctx, P, b.polys); ctx.stroke(); });
  ctx.restore();
  ctx.setLineDash([]);
  if (opts.before) { opts.before(ctx, P); ctx.setLineDash([]); }
  tracePolys(ctx, P, district.polys); ctx.strokeStyle = PAPER.district; ctx.lineWidth = 2.5; ctx.stroke();
  // ficha por distrito: los circuitos electorales que caen en él
  if (opts.overlay) {
    ctx.save(); tracePolys(ctx, P, district.polys); ctx.clip("evenodd");
    ctx.setLineDash([8, 5]); ctx.strokeStyle = "#e4002b"; ctx.lineWidth = 1.8;
    opts.overlay.forEach(function (o) { tracePolys(ctx, P, o.polys); ctx.stroke(); });
    ctx.restore(); ctx.setLineDash([]);
    var z = PP.distritos[district.num], lab = {};
    if (z) z.circuitos.forEach(function (c) { if (c.del_circuito >= 5 && c.etiqueta) lab[norm(c.circuito)] = c.etiqueta; });
    // se escriben después de los números de barrio, corridos para no taparlos
    var circLabels = opts.overlay.filter(function (o) { return lab[o.key]; }).map(function (o) { return { q: P(lab[o.key]), t: "C. " + o.name.replace(/^circuito\s*/i, "") }; });
  } else if (opts.numbered && district.kind === "circuito") {
    circLabels = [{ q: P(district.label), t: "Circuito " + district.name.replace(/^circuito\s*/i, ""), big: true }];
  }
  ctx.font = "600 " + (opts.labelSize || 12) + "px Poppins, Arial, sans-serif"; ctx.textAlign = "center"; ctx.lineJoin = "round";
  // nombres de barrios debajo de las intervenciones, así las marcas quedan siempre a la vista
  if (opts.numbered) {
    // plano: cada barrio con su número, igual que en el listado de la misma hoja
    ctx.textBaseline = "middle"; ctx.font = "700 14px Poppins, Arial, sans-serif";
    var taken = [];
    district.barrios.forEach(function (b, i) {
      var q = P(b.labels[district.id] || b.label), n = String(i + 1);
      ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 4; ctx.strokeText(n, q[0], q[1]);
      ctx.fillStyle = PAPER.navy; ctx.fillText(n, q[0], q[1]);
      taken.push({ x: q[0], y: q[1], w: 12 + 8 * n.length, h: 20 });
    });
    if (circLabels) {
      // cada circuito en una etiqueta blanca con borde rojo, en el primer lugar libre cerca de su centro
      ctx.font = "700 12px Poppins, Arial, sans-serif";
      var hit = function (a, b) { return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h; };
      var offs = [[0, 0], [0, 20], [0, -20], [34, 0], [-34, 0], [0, 38], [0, -38], [30, 22], [-30, 22], [30, -22], [-30, -22], [0, 56], [0, -56]];
      circLabels.forEach(function (c) {
        ctx.font = "700 " + (c.big ? 14 : 12) + "px Poppins, Arial, sans-serif";
        var hh = c.big ? 24 : 18, w = ctx.measureText(c.t).width + (c.big ? 18 : 12), box = null;
        for (var k = 0; k < offs.length && !box; k++) {
          var cand = { x: c.q[0] + offs[k][0], y: c.q[1] + offs[k][1], w: w, h: hh };
          if (!taken.some(function (t) { return hit(t, cand); })) box = cand;
        }
        box = box || { x: c.q[0], y: c.q[1] + 20, w: w, h: hh };
        taken.push(box);
        ctx.beginPath(); ctx.roundRect(box.x - w / 2, box.y - hh / 2, w, hh, hh / 2);
        // el del propio circuito va lleno de rojo; los de los circuitos dentro de un distrito, blancos con borde rojo
        ctx.fillStyle = c.big ? "#e4002b" : "#ffffff"; ctx.fill(); ctx.strokeStyle = c.big ? "#ffffff" : "#e4002b"; ctx.lineWidth = c.big ? 2 : 1.2; ctx.stroke();
        ctx.fillStyle = c.big ? "#ffffff" : "#e4002b"; ctx.fillText(c.t, box.x, box.y + 1);
      });
    }
    ctx.textBaseline = "alphabetic";
  } else if (!opts.noLabels) district.barrios.forEach(function (b) {
    // mapa de un tipo: solo los barrios que recibieron esa intervención, así nombres e íconos no se pisan
    if (opts.onlyBarrios && !opts.onlyBarrios.has(b.id)) return;
    var q = P(b.labels[district.id] || b.label);
    ctx.strokeStyle = "rgba(255,255,255,.92)"; ctx.lineWidth = 3.5; ctx.strokeText(b.name.toUpperCase(), q[0], q[1]);
    ctx.fillStyle = PAPER.navy; ctx.fillText(b.name.toUpperCase(), q[0], q[1]);
  });
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
    var t = styleOf(p), q = P([p.lng, p.lat]);
    if (!dense && t.img && IMG[t.img]) {
      ctx.beginPath(); ctx.arc(q[0], q[1], r + 1.2, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.drawImage(IMG[t.img], q[0] - r, q[1] - r, 2 * r, 2 * r); return;
    }
    ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
    ctx.fillStyle = colorOf(p); ctx.fill(); ctx.lineWidth = dense ? 0.8 : 1.2; ctx.strokeStyle = "#ffffff"; ctx.stroke();
    if (dense) return;
    var k = (r * 1.32) / 24;
    ctx.save(); ctx.translate(q[0] - 12 * k, q[1] - 12 * k); ctx.scale(k, k);
    ctx.fillStyle = t.ink || "#ffffff"; ctx.fill(new Path2D(ICONS[t.icon]), "evenodd"); ctx.restore();
  });
  ctx.textAlign = "center";
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

// mapa de Presupuesto Participativo: el circuito, el distrito que más comparte con él y el proyecto ganador
function drawPPMap(canvas, district, x) {
  var c = prepCanvas(canvas), bb = district.bbox.slice(), g = x.ganador;
  var pt = g.lat != null && g.lon != null ? [g.lon, g.lat] : null;
  function grow(b) { bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])]; }
  if (x.area) grow(x.area.bbox);
  if (pt) grow([pt[0], pt[1], pt[0], pt[1]]);
  var P = projector(bb, c.W, c.H, 34);
  function paint(tiles) {
    paintMap(c, P, district, [], { noLabels: true }, tiles);
    var ctx = c.ctx;
    if (x.area) {
      tracePolys(ctx, P, x.area.polys); ctx.fillStyle = "rgba(244,220,0,.2)"; ctx.fill("evenodd");
      ctx.setLineDash([9, 5]); ctx.strokeStyle = "#c9a800"; ctx.lineWidth = 2.6; ctx.stroke(); ctx.setLineDash([]);
    }
    tracePolys(ctx, P, district.polys); ctx.strokeStyle = PAPER.district; ctx.lineWidth = 2.5; ctx.stroke();
    if (pt) {
      var q = P(pt), k = 1.75;
      ctx.save(); ctx.translate(q[0] - 12 * k, q[1] - 22 * k); ctx.scale(k, k);
      var pin = new Path2D(ICONS.pin);
      ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
      ctx.lineWidth = 2.2 / k; ctx.strokeStyle = "#ffffff"; ctx.stroke(pin);
      ctx.shadowColor = "transparent"; ctx.fillStyle = "#e4002b"; if (g.ubicacion_aproximada) ctx.globalAlpha = 0.5; ctx.fill(pin, "evenodd");
      ctx.restore();
    }
  }
  paint(null);
  return loadBasemap(P, c.W, c.H).then(function (tiles) { if (tiles) paint(tiles); }).catch(function () {});
}

function drawLocator(canvas, district) {
  var c = prepCanvas(canvas), ctx = c.ctx;
  ctx.fillStyle = PAPER.soft; ctx.fillRect(0, 0, c.W, c.H);
  var bb = [Infinity, Infinity, -Infinity, -Infinity];
  DISTRICTS.forEach(function (d) { bb[0] = Math.min(bb[0], d.bbox[0]); bb[1] = Math.min(bb[1], d.bbox[1]); bb[2] = Math.max(bb[2], d.bbox[2]); bb[3] = Math.max(bb[3], d.bbox[3]); });
  var P = projector(bb, c.W, c.H, 12);
  DISTRICTS.forEach(function (d) {
    tracePolys(ctx, P, d.polys); ctx.fillStyle = d.id === district.id ? PAPER.blue : "#d5dde3"; ctx.fill("evenodd");
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

// hoja con el diseño del Informe de Gestión: encabezado con logos, marco, textos al margen y pie con la fuente
function monthYear() { var s = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" }).replace(" de ", " "); return s; }
function sheetShell(pageNo, total, inner, d) {
  if (inner.indexOf('<div class="cover-full">') === 0) return '<article class="sheet cover-sheet">' + inner + '</article>';
  var src = SOURCE.sample ? "Datos de ejemplo. No representan intervenciones reales." : "GeoGestión, actualizada al " + SOURCE.when.toLocaleDateString("es-AR") + ".";
  // una hoja puede traer su propia fuente al principio: <!--fuente:...-->
  var own = inner.match(/^<!--fuente:(.*?)-->/);
  if (own) src = own[1];
  return '<article class="sheet"><div class="pg-head"><span class="ph-sec"><small>Ficha técnica</small><b class="ph-zone">' + esc(d.name) + '</b></span><span class="ph-org"><img src="img/ciudad-smt.png" alt="Ciudad SMT"><i></i><b>Subsecretaría de<br>Gestión Estratégica</b></span></div>' +
    '<div class="side"><div class="rot"><span class="s-top">' + esc(monthYear()) + '</span><span class="s-bot"><b>Ficha técnica</b> – ' + esc(CFG.organismo.replace(/^Municipalidad de /i, "Ciudad de ")) + '</span></div></div>' +
    '<div class="frame">' + inner + '<div class="foot"><span><b>Fuente:</b> ' + esc(src) + ' <b>Elaboración:</b> Subsecretaría de Gestión Estratégica.</span><span class="pg">' + String(pageNo).padStart(2, "0") + ' / ' + String(total).padStart(2, "0") + '</span></div></div></article>';
}
// título como en el informe: la parte final en azul (lo que va después de "·", o la última palabra)
function titleHTML(title, plain) {
  var i = title.indexOf(" · ");
  if (i > 0) return esc(title.slice(0, i)) + ' <em>' + esc(title.slice(i + 3)) + '</em>';
  var w = title.split(" ");
  return plain || w.length < 2 ? esc(title) : esc(w.slice(0, -1).join(" ")) + ' <em>' + esc(w[w.length - 1]) + '</em>';
}
function band(d, title, sub, opts) {
  opts = opts || {};
  return '<div class="band' + (opts.cls ? ' ' + opts.cls : '') + '">' +
    (opts.type ? '<div class="tline">' + badge(opts.type, opts.cls === 'slim' ? 32 : 42) + '<h2>' + titleHTML(title, true) + '</h2></div>' : '<h2>' + titleHTML(title) + '</h2>') +
    (sub ? '<p>' + sub + '</p>' : '') + '</div>';
}
function tiles(list, cls) { return '<div class="tiles' + (cls ? ' ' + cls : '') + '">' + list.map(function (x) { return '<div class="tile' + (x.txt ? ' txt' : '') + (x.ic ? ' ic' : '') + '">' + (x.ic ? '<i class="kic"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' + ICONS[x.ic] + '"/></svg></i>' : '') + '<b>' + x.v + '</b><span>' + x.l + '</span></div>'; }).join("") + '</div>'; }

// Fuerza Republicana se distingue en morado; las demás listas quedan en azul
function frCls(l) { return /fuerza\s+republicana/i.test(l.nombre) ? ' fr' : ''; }
function titleCase(t) { return String(t).toLowerCase().replace(/(^|[\s(."'-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }); }
// hoja del plano: el circuito con sus barrios numerados, el listado de barrios y las 3 listas más votadas a concejal (2023)
function planoPage(d) {
  var nb = d.barrios.length, c = CONCEJALES[d.key];
  if (d.kind === "distrito") c = null;
  var blist = '<ol class="blist' + (nb > 24 ? ' c3' : nb > 8 ? ' c2' : '') + '">' + d.barrios.map(function (b) { return '<li>' + esc(b.name) + '</li>'; }).join("") + '</ol>';
  var elec = c ? '<div class="elec">' + c.listas.map(function (l, i) {
    var pct = l.votos / c.total * 100;
    return '<div class="el-row' + frCls(l) + '"><span class="el-pos">' + (i + 1) + '°</span><div class="el-main"><b>' + esc(l.nombre) + '</b><small>Lista ' + esc(l.lista) + ' · ' + esc(titleCase(l.candidato)) + '</small><div class="el-bar"><i style="width:' + (pct / (c.listas[0].votos / c.total * 100) * 100).toFixed(1) + '%"></i></div></div>' +
      '<div class="el-v"><b>' + pct.toFixed(1).replace(".", ",") + '%</b><small>' + fmt.format(l.votos) + ' votos</small></div></div>';
  }).join("") + '<p class="tnote">Porcentaje sobre ' + fmt.format(c.total) + ' votos a listas de concejales en el circuito (no incluye blancos ni nulos). Elecciones municipales 2023.</p></div>'
    : '<p class="tnote">No hay resultados electorales cargados para este circuito.</p>';
  var right = '<div><h3 class="sh-h3">Concejales 2023 · listas más votadas</h3>' + elec + '</div>';
  if (d.kind === "distrito") {
    var z = PP.distritos[d.num], cs = z ? z.circuitos.filter(function (x) { return x.del_circuito >= 5; }) : [];
    right = '<div><h3 class="sh-h3 dot-red">Circuitos electorales del distrito</h3><table class="t ctab' + (cs.length > 6 ? ' tight' : '') + '"><thead><tr><th>Circuito</th><th class="r">En el distrito</th><th class="r">Electores</th><th class="r">Escuelas</th></tr></thead><tbody>' +
      cs.map(function (x) { var e = ELECTORES[norm(x.circuito)]; return '<tr><td>' + esc(x.circuito.replace(/^Circuito\s*/, "")) + '</td><td class="r">' + x.del_circuito + '%</td><td class="r">' + (e ? fmt.format(e.electores) : '–') + '</td><td class="r">' + (e ? e.escuelas : '–') + '</td></tr>'; }).join("") +
      (z ? '<tr class="tot"><td colspan="2">Estimado en el distrito</td><td class="r">≈ ' + fmt.format(z.electores_estimados) + '</td><td class="r">≈ ' + Math.round(z.escuelas_estimadas) + '</td></tr>' : '') + '</tbody></table>' +
      '<p class="tnote">"En el distrito": parte de la superficie del circuito dentro del distrito. Electores y escuelas: padrón 2025 del circuito completo; el total del distrito suma cada circuito según esa parte. Se omiten cruces menores al 5% (bordes).</p></div>';
  }
  return band(d, "Plano del " + zw(d), nb + (nb === 1 ? " barrio" : " barrios") + " · " + esc(d.name)) +
    '<div class="body"><div><div class="sh-map"><canvas data-map="plano" width="1372" height="930"></canvas></div>' +
    (d.kind === "distrito" ? '<div class="sh-legend pp-legend"><span><i class="lg-circ"></i>' + esc(d.name) + '</span><span><i class="lg-cline"></i>Límite de circuito electoral (C.)</span></div>' : '') + '</div>' +
    '<div class="plano-cols' + (nb > 24 ? ' wide' : '') + '"><div><h3 class="sh-h3 dot-blue">Barrios del ' + zw(d) + '</h3>' + blist + '</div>' + right + '</div></div>';
}

// palabra de la zona de la ficha
function zw(d) { return d.kind === "distrito" ? "distrito" : "circuito"; }
// proyecto ganador de Presupuesto Participativo que corresponde a la zona:
// el del propio distrito, o en un circuito el del distrito con el que comparte más superficie
function ppOf(d) {
  var c = d.kind === "distrito" ? null : PP.circuitos[d.key];
  var num = d.kind === "distrito" ? d.num : c && c.distrito, g = num && PP.ganadores[String(num)];
  if (!g) return null;
  return { distrito: num, coincidencia: c ? c.coincidencia : null, ganador: g, edicion: PP.edicion,
    area: c ? ZONES.distrito.filter(function (x) { return x.num === num; })[0] || null : null };
}
// electores y escuelas: del padrón en un circuito; en un distrito, estimados según superficie
function padronOf(d) {
  if (d.kind !== "distrito") return ELECTORES[d.key] ? { electores: ELECTORES[d.key].electores, escuelas: ELECTORES[d.key].escuelas, est: false } : null;
  var z = PP.distritos[d.num];
  return z ? { electores: z.electores_estimados, escuelas: Math.round(z.escuelas_estimadas), est: true } : null;
}
// ficha por distrito: una tarjeta por circuito electoral que cae en él, con electores, escuelas y las 3 listas más votadas a concejal (2023)
var CIRC_PER_PAGE = 6;
function circuitPages(d) {
  if (d.kind !== "distrito") return [];
  var z = PP.distritos[d.num];
  var cs = z ? z.circuitos.filter(function (x) { return x.del_circuito >= 5; }) : [];
  if (!cs.length) return [];
  var cards = cs.map(function (x) {
    var key = norm(x.circuito), e = ELECTORES[key], c = CONCEJALES[key];
    var lists = c ? c.listas.map(function (l, i) {
      var pct = l.votos / c.total * 100;
      return '<div class="cc-row' + frCls(l) + '"><span class="el-pos">' + (i + 1) + '°</span><div class="el-main"><b>' + esc(l.nombre) + '</b><small>Lista ' + esc(l.lista) + ' · ' + esc(titleCase(l.candidato)) + '</small></div><div class="cc-v"><b>' + pct.toFixed(1).replace(".", ",") + '%</b> <small>' + fmt.format(l.votos) + '</small></div></div>';
    }).join("") : '<p class="tnote">Sin resultados electorales cargados.</p>';
    return '<div class="cc-card"><div class="cc-head"><b>' + esc(x.circuito) + '</b><span>' + x.del_circuito + '% en el distrito</span></div>' +
      '<div class="cc-kpi"><span><b>' + (e ? fmt.format(e.electores) : '–') + '</b> electores</span><span><b>' + (e ? e.escuelas : '–') + '</b> ' + (e && e.escuelas === 1 ? 'escuela donde se vota' : 'escuelas donde se vota') + '</span></div>' +
      '<div class="cc-sub">Concejales 2023 · 3 más votadas</div>' + lists + '</div>';
  });
  var total = '<div class="cc-total"><div><b>≈ ' + fmt.format(z.electores_estimados) + '</b><span>Electores del distrito</span></div><div><b>≈ ' + Math.round(z.escuelas_estimadas) + '</b><span>Escuelas donde se vota</span></div>' +
    '<p>Total estimado: cada circuito suma sus electores y escuelas según la parte de su superficie que cae dentro del distrito, así los circuitos compartidos no se cuentan dos veces. Concejales: porcentaje sobre los votos a listas de cada circuito completo (sin blancos ni nulos), elecciones municipales 2023.</p></div>';
  // la primera hoja lleva el total arriba y 4 tarjetas; las siguientes, 6
  var chunks = [cards.slice(0, CIRC_PER_PAGE - 2)];
  for (var i = CIRC_PER_PAGE - 2; i < cards.length; i += CIRC_PER_PAGE) chunks.push(cards.slice(i, i + CIRC_PER_PAGE));
  return chunks.map(function (ch, k) {
    var part = chunks.length > 1 ? ' · ' + (k + 1) + ' de ' + chunks.length : '';
    return '<!--fuente:Padrón electoral 2025 y resultados de concejales 2023 por circuito; cruce con los distritos de Presupuesto Participativo.-->' +
      band(d, 'Circuitos electorales' + part, k ? null : cs.length + (cs.length === 1 ? ' circuito cae' : ' circuitos caen') + ' dentro de ' + esc(d.name), k ? { cls: 'slim' } : null) +
      '<div class="body">' + (k ? '' : total) + '<div class="cc-grid">' + ch.join("") + '</div></div>';
  });
}

// hoja de Presupuesto Participativo: proyecto ganador, su ubicación y la descripción publicada
var PP_PASOS = ["Licitación", "Adjudicada", "En obra", "Finalizada"];
function ppDesc(g) { return (g.descripcion || []).map(function (s) { return '<section><h5>' + esc(s.titulo) + '</h5>' + s.parrafos.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join("") + '</section>'; }).join(""); }
function ppDescLen(g) { return (g.descripcion || []).reduce(function (a, s) { return a + 60 + s.parrafos.reduce(function (b, t) { return b + t.length + 40; }, 0); }, 0); }
function ppEtapa(g) { return /^sin informaci/i.test(g.etapa || "") || !g.etapa ? "Sin avance" : g.etapa.replace(/ todavía$/, ""); }
// gráfico de barras con los proyectos más votados del distrito (votos publicados por el sitio)
function ppVotos(g, num) {
  var mv = (g.mas_votados || []).filter(function (v) { return v.votos > 0; });
  if (!mv.length) return '';
  var max = Math.max.apply(null, mv.map(function (v) { return v.votos; }));
  return '<div><h3 class="sh-h3">' + (mv.length === 1 ? 'Proyecto más votado' : 'Los ' + mv.length + ' proyectos más votados') + ' del Distrito ' + num + '</h3><div class="pp-votes">' +
    mv.map(function (v, i) {
      return '<div class="pv-row' + (v.ganador ? ' win' : '') + '"><span class="pv-pos">' + (i + 1) + '°</span><span class="pv-t">' + esc(v.titulo) + (v.ganador ? ' <em>Ganador</em>' : '') + '</span>' +
        '<span class="pv-bar"><i style="width:' + Math.max(1.5, v.votos / max * 100).toFixed(1) + '%"></i></span><span class="pv-v"><b>' + fmt.format(v.votos) + '</b> ' + (v.votos === 1 ? 'voto' : 'votos') + '</span></div>';
    }).join("") + '</div>' + (mv.length < 3 ? '<p class="tnote">En este distrito solo ' + (mv.length === 1 ? 'este proyecto registró' : 'estos proyectos registraron') + ' votos.</p>' : '') + '</div>';
}
var ppSplitFor = null; // zona cuya descripción no entró junto al mapa y va en hoja aparte
function ppPage(d) {
  var x = ppOf(d);
  if (!x) return null;
  var g = x.ganador, hasPt = g.lat != null && g.lon != null, isD = d.kind === "distrito";
  var steps = '<div class="pp-steps">' + PP_PASOS.map(function (s, i) { return '<span class="' + (i < g.paso ? 'on' : '') + (i === g.paso - 1 ? ' cur' : '') + '"><i></i>' + s + '</span>'; }).join("") + '</div>';
  var info = [];
  if (g.novedad) info.push('<div><dt>Última novedad' + (g.actualizado ? ' · ' + esc(g.actualizado) : '') + '</dt><dd>' + esc(g.novedad) + '</dd></div>');
  else info.push('<div><dt>Última novedad</dt><dd>El sitio de Presupuesto Participativo todavía no publicó novedades de esta obra.</dd></div>');
  var meta = [g.barrio ? 'Barrio ' + esc(g.barrio) : null, 'Distrito ' + x.distrito, g.votos ? fmt.format(g.votos) + ' votos' : null].filter(Boolean).join(' · ');
  var nCirc = isD && PP.distritos[d.num] ? PP.distritos[d.num].circuitos.filter(function (c) { return c.del_circuito >= 5; }).length : 0;
  var note = (isD ? 'Proyecto elegido con el voto de los vecinos del Distrito ' + x.distrito + '.'
    : 'Hay un ganador por distrito y los distritos no coinciden con los circuitos electorales: se muestra el proyecto del distrito que más superficie comparte con el circuito (el ' + x.coincidencia + '% de ' + esc(d.name) + ' está dentro del Distrito ' + x.distrito + ').') +
    (!hasPt ? ' El sitio de Presupuesto Participativo no publica la ubicación de este proyecto.' : g.ubicacion_aproximada ? ' El sitio de Presupuesto Participativo no tiene la ubicación exacta: la marca va en el centro del distrito.' : '');
  // descripción larga: va en una hoja propia, así el mapa no se achica
  var desc = ppDesc(g), split = desc && (ppSplitFor === d.id || ppDescLen(g) > 1100);
  var src = '<!--fuente:Presupuesto Participativo SMT, edición ' + x.edicion + ' (presupuestoparticipativo.smt.gob.ar).-->';
  var head = isD
    ? [{ v: g.votos ? fmt.format(g.votos) : '–', l: g.votos ? "Votos obtenidos" : "Votos no publicados" }, { v: esc(ppEtapa(g)), l: "Estado de la obra", txt: true }, { v: String(nCirc), l: nCirc === 1 ? "Circuito electoral en el distrito" : "Circuitos electorales en el distrito" }]
    : [{ v: String(x.distrito), l: "Distrito" }, { v: x.coincidencia + '<small>%</small>', l: "Del circuito dentro del distrito" }, { v: g.votos ? fmt.format(g.votos) : '–', l: g.votos ? "Votos obtenidos" : "Votos no publicados" }, { v: esc(ppEtapa(g)), l: "Estado de la obra", txt: true }];
  var pin = !hasPt ? '' : g.ubicacion_aproximada ? '<span><i class="lg-pin aprox"></i>Proyecto ganador (ubicación aproximada)</span>' : '<span><i class="lg-pin"></i>Proyecto ganador</span>';
  var descBlock = desc ? '<div><h3 class="sh-h3">Descripción del proyecto</h3><div class="pp-desc' + (split ? ' full' : '') + '">' + desc + '</div></div>' : '';
  var p1 = src + band(d, 'Presupuesto Participativo · ' + x.edicion, 'Proyecto ganador del Distrito ' + x.distrito + ', elegido por los vecinos con su voto') +
    '<div class="body">' + tiles(head) +
    '<div><div class="sh-map"><canvas data-pp="1" width="1372" height="' + (split || !desc ? 760 : 600) + '"></canvas></div>' +
    '<div class="sh-legend pp-legend"><span><i class="lg-circ"></i>' + esc(d.name) + '</span>' + (isD ? '' : '<span><i class="lg-dist"></i>Distrito ' + x.distrito + '</span>') + pin + '</div></div>' +
    '<div><h3 class="sh-h3">Proyecto ganador</h3><div class="pp-card"><div class="pp-pills">' + (g.categoria ? '<span class="pp-cat">' + esc(g.categoria) + '</span>' : '') + '<span class="pp-estado s' + g.paso + '">Estado de la obra: ' + esc(ppEtapa(g)) + '</span></div>' +
    '<h4>' + esc(g.titulo) + '</h4><p class="pp-meta">' + meta + '</p>' + steps +
    '<dl class="pp-info">' + info.join("") + '</dl></div>' + (split ? '' : '<p class="tnote">' + note + '</p>') + '</div>' + ppVotos(g, x.distrito) +
    (split ? '' : descBlock) + '</div>';
  if (!split) return [p1];
  return [p1, src + band(d, 'Presupuesto Participativo · descripción', esc(g.titulo), { cls: 'slim' }) + '<div class="body">' + descBlock + '<p class="tnote">' + note + ' Texto publicado en presupuestoparticipativo.smt.gob.ar.</p></div>'];
}

/* ---------- Red vial por material (Power BI de la Subsecretaría) ---------- */
var RV = { lineas: null, zonas: null, promesa: null };
function loadRedVial() {
  var c = CFG.redVial;
  if (!c) return Promise.resolve();
  if (!RV.promesa) RV.promesa = Promise.all([
    fetch(rel(c.zonas)).then(function (r) { return r.ok ? r.json() : null; }),
    fetch(rel(c.lineas)).then(function (r) { return r.ok ? r.json() : null; })
  ]).then(function (r) {
    if (!r[0] || !r[1]) return;
    RV.zonas = r[0].zonas;
    RV.lineas = r[1].features.map(function (f) {
      var cs = f.geometry.coordinates, b = [Infinity, Infinity, -Infinity, -Infinity];
      cs.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); });
      return { m: f.properties.m, c: cs, bb: b };
    });
  }).catch(function () { RV.promesa = null; });
  return RV.promesa;
}
var RV_ORDEN = ["P", "C", "R"];
function rvMat(k) { return CFG.redVial.materiales[k]; }
function rvKey(d) { return d.kind === "distrito" ? "Distrito " + d.num : d.name; }
// km, cuadras y % de cada material en la zona; "ciudad" suma todos los circuitos
function rvStats(st) {
  var km = 0, cu = 0, out = {};
  RV_ORDEN.forEach(function (k) { km += st[k].km; cu += st[k].cuadras; });
  RV_ORDEN.forEach(function (k) { out[k] = { km: st[k].km, cuadras: st[k].cuadras, pct: km ? st[k].km / km * 100 : 0 }; });
  out.km = km; out.cuadras = cu;
  return out;
}
function rvCiudad() {
  var t = {}; RV_ORDEN.forEach(function (k) { t[k] = { km: 0, cuadras: 0 }; });
  Object.keys(RV.zonas).forEach(function (n) { if (/^Distrito /.test(n)) return; RV_ORDEN.forEach(function (k) { t[k].km += RV.zonas[n][k].km; t[k].cuadras += RV.zonas[n][k].cuadras; }); });
  return rvStats(t);
}
function pc(x) { return (Math.round(x * 10) / 10).toFixed(1).replace(".", ","); }
function kmTxt(x) { return fmt.format(Math.round(x * 10) / 10); }
function redPage(d) {
  if (!RV.zonas || !RV.zonas[rvKey(d)]) return null;
  var z = zw(d), s = rvStats(RV.zonas[rvKey(d)]), city = rvCiudad();
  if (!s.km) return null;
  var np = s.C.km + s.R.km;
  // puesto entre las zonas del mismo tipo por proporción de calles sin pavimento (1 = la mayor)
  var same = Object.keys(RV.zonas).filter(function (n) { return /^Distrito /.test(n) === (d.kind === "distrito"); }).map(function (n) { return rvStats(RV.zonas[n]); }).filter(function (x) { return x.km; });
  var share = function (x) { return (x.C.km + x.R.km) / x.km; }, rank = 1 + same.filter(function (x) { return share(x) > share(s) + 1e-9; }).length;
  var comp = function (a, b) { return Math.abs(a - b) < 2 ? 'similar al' : a > b ? 'por encima del' : 'por debajo del'; };
  var findings = [
    '<b>Pavimento:</b> el ' + pc(s.P.pct) + '% de la red vial del ' + z + ' (' + kmTxt(s.P.km) + ' km, ' + fmt.format(s.P.cuadras) + ' cuadras) está pavimentada, ' + comp(s.P.pct, city.P.pct) + ' promedio de la ciudad (' + pc(city.P.pct) + '%).',
    np > 0.05 ? '<b>Sin pavimento:</b> quedan ' + kmTxt(np) + ' km de calles' + (s.C.km > 0.05 ? ' con cordón cuneta (' + kmTxt(s.C.km) + ' km, ' + fmt.format(s.C.cuadras) + ' cuadras)' : '') + (s.C.km > 0.05 && s.R.km > 0.05 ? ' y' : '') + (s.R.km > 0.05 ? ' de ripio (' + kmTxt(s.R.km) + ' km, ' + fmt.format(s.R.cuadras) + ' cuadras)' : '') + '.'
      : '<b>Sin pavimento:</b> prácticamente toda la red vial del ' + z + ' está pavimentada.',
    '<b>Ripio:</b> ' + (s.R.km > 0.05 ? 'representa el ' + pc(s.R.pct) + '% de la red, ' + comp(s.R.pct, city.R.pct) + ' ' + pc(city.R.pct) + '% de la ciudad.' : 'no hay calles de ripio registradas en el ' + z + '.'),
    np < 0.05 ? '<b>Comparación:</b> es uno de los ' + same.filter(function (x) { return x.C.km + x.R.km < 0.05; }).length + ' ' + z + 's de la ciudad con toda su red vial pavimentada.'
      : '<b>Comparación:</b> es el ' + rank + '° de ' + same.length + ' ' + z + 's con mayor proporción de calles sin pavimentar (cordón cuneta y ripio).'
  ];
  var table = '<table class="t rv-t"><thead><tr><th>Material</th><th class="r">Cuadras</th><th class="r">Km</th><th class="r">% red</th></tr></thead><tbody>' +
    RV_ORDEN.map(function (k) { return '<tr><td><i class="rv-sw" style="background:' + rvMat(k).color + '"></i>' + rvMat(k).nombre + '</td><td class="r">' + fmt.format(s[k].cuadras) + '</td><td class="r">' + kmTxt(s[k].km) + '</td><td class="r">' + pc(s[k].pct) + '%</td></tr>'; }).join("") +
    '</tbody><tfoot><tr><td>Total</td><td class="r">' + fmt.format(s.cuadras) + '</td><td class="r">' + kmTxt(s.km) + '</td><td class="r">100%</td></tr></tfoot></table>';
  return '<!--fuente:Red vial de la ciudad por material (Power BI de la Subsecretaría de Gestión Estratégica).-->' +
    band(d, 'Caracterización de la red vial del ' + z, 'Material de las calles de ' + esc(d.name) + ' · ' + fmt.format(s.cuadras) + ' cuadras · ' + kmTxt(s.km) + ' km') +
    '<div class="body"><div><div class="sh-map"><canvas data-map="red" width="1372" height="900"></canvas></div>' +
    '<div class="sh-legend pp-legend">' + RV_ORDEN.map(function (k) { return '<span><i class="lg-rv" style="background:' + rvMat(k).color + '"></i>' + rvMat(k).nombre + '</span>'; }).join("") + '<span><i class="lg-circ"></i>Límite del ' + z + '</span></div></div>' +
    '<div class="rv-cols"><div><h3 class="sh-h3">Red vial según material</h3><canvas data-chart="red" width="318" height="168"></canvas><p class="tnote">Porcentaje de los km de calles. En color, el ' + z + '; en gris, la ciudad.</p></div>' +
    '<div><h3 class="sh-h3">Cantidades</h3>' + table + '</div></div>' +
    '<div><h3 class="sh-h3">Análisis</h3><ul class="findings rv-f">' + findings.map(function (f) { return '<li><span class="rv-dot"></span><span>' + f + '</span></li>'; }).join("") + '</ul>' +
    '<p class="tnote">Km medidos recortando cada cuadra con el límite del ' + z + '; cada cuadra se cuenta donde cae su punto medio.</p></div></div>';
}
function paintRed(ctx, P, d) {
  if (!RV.lineas) return;
  var bb = d.bbox;
  ctx.save(); tracePolys(ctx, P, d.polys); ctx.clip("evenodd");
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = P.kmPx > 120 ? 3 : 2.2;
  RV_ORDEN.forEach(function (k) {
    ctx.strokeStyle = rvMat(k).color; ctx.beginPath();
    RV.lineas.forEach(function (l) {
      if (l.m !== k || l.bb[2] < bb[0] || l.bb[0] > bb[2] || l.bb[3] < bb[1] || l.bb[1] > bb[3]) return;
      l.c.forEach(function (p, i) { var q = P(p); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    });
    ctx.stroke();
  });
  ctx.restore();
}
function chartRed(canvas, d) {
  var s = rvStats(RV.zonas[rvKey(d)]), city = rvCiudad();
  charts.push(new Chart(canvas, {
    type: "bar",
    data: { labels: RV_ORDEN.map(function (k) { return rvMat(k).nombre; }), datasets: [
      { label: d.name, data: RV_ORDEN.map(function (k) { return Math.round(s[k].pct * 10) / 10; }), backgroundColor: RV_ORDEN.map(function (k) { return rvMat(k).color; }) },
      { label: "Ciudad", data: RV_ORDEN.map(function (k) { return Math.round(city[k].pct * 10) / 10; }), backgroundColor: "#c9d3d8" }] },
    options: {
      indexAxis: "y", responsive: false, animation: false, devicePixelRatio: 2,
      datasets: { bar: { barPercentage: 0.9, categoryPercentage: 0.8, maxBarThickness: 16 } },
      layout: { padding: { right: 44 } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { beginAtZero: true, max: 100, grid: { color: PAPER.line }, border: { display: false }, ticks: { color: PAPER.muted, stepSize: 25, callback: function (v) { return v + "%"; }, font: { size: 11, family: "Poppins, Arial" } } },
        y: { grid: { display: false }, border: { color: PAPER.ink }, ticks: { color: PAPER.ink, font: { size: 12, family: "Poppins, Arial", weight: 500 } } }
      }
    },
    plugins: [{ id: "valores", afterDatasetsDraw: function (ch) {
      var ctx = ch.ctx; ctx.save(); ctx.font = "600 10.5px Poppins, Arial"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
      ch.data.datasets.forEach(function (ds, i) { ch.getDatasetMeta(i).data.forEach(function (b, j) { ctx.fillStyle = i ? PAPER.muted : PAPER.ink; ctx.fillText(pc(ds.data[j]) + "%", b.x + 4, b.y); }); });
      ctx.restore();
    } }]
  }));
}

/* ---------- Hoja de contextualización ---------- */
function contextPage(d, hasRed, hasPP) {
  var z = zw(d), isD = d.kind === "distrito";
  var quien = isD ? 'el ' + esc(d.name) + ' de Presupuesto Participativo' : 'el ' + esc(d.name).replace(/^Circuito/, 'circuito electoral');
  var parts = [];
  if (hasRed) parts.push(['Red vial', 'Material de las calles, plano y análisis.']);
  parts.push(['Plano del ' + z, isD ? 'Barrios y circuitos electorales del distrito.' : 'Barrios y listas más votadas a concejal 2023.']);
  if (isD) parts.push(['Circuitos electorales', 'Electores, escuelas y listas más votadas.']);
  parts.push(['Síntesis ejecutiva', 'Indicadores, lectura rápida y barrios.']);
  parts.push(['Resumen del ' + z, 'Mapa con todas las intervenciones.']);
  parts.push(['Intervenciones por tipo', 'Mapa, ranking de barrios y direcciones.']);
  if (hasPP) parts.push(['Presupuesto Participativo', 'Ganador, estado de la obra y más votados.']);
  var fuentes = [
    ['Intervenciones municipales', SOURCE.sample ? 'Datos de ejemplo' : 'GeoGestión, al ' + SOURCE.when.toLocaleDateString("es-AR") + ' (sin registros rechazados)'],
    ['Circuitos electorales y barrios', 'Cartografía de la Municipalidad'],
    ['Distritos y proyectos ganadores', 'Presupuesto Participativo SMT' + (PP.edicion ? ', edición ' + PP.edicion : '')],
    ['Electores y escuelas', 'Padrón electoral 2025 por circuito'],
    ['Concejales', 'Elecciones municipales 2023, por circuito']
  ];
  if (hasRed) fuentes.splice(1, 0, ['Red vial', 'Power BI de la Subsecretaría (red vial por material)']);
  var criterios = [
    'Cada intervención se ubica en su barrio y su ' + z + ' por sus coordenadas; si cae sobre una avenida, se asigna al más cercano.',
    'Un barrio que cruza el límite del ' + z + ' cuenta solo con las intervenciones que caen dentro.',
    'Pavimentación se cuenta por cuadras; El gas llega a tu casa, por domicilios; EDUCÁ, por instituciones visitadas.',
    isD ? 'Electores y escuelas del distrito se estiman según la parte de cada circuito que cae dentro.'
        : 'Presupuesto Participativo: se muestra el ganador del distrito que comparte más superficie con el circuito.'
  ];
  return '<!--fuente:ver el cuadro "Fuentes de información" de esta hoja.-->' +
    band(d, 'Contextualización de la Ficha Técnica', 'Qué es esta ficha, de dónde salen los datos y cómo leerla') +
    '<div class="body"><div class="ctx-intro"><p>Esta ficha técnica reúne en un solo documento las intervenciones que la ' + esc(CFG.organismo) + ' registró en ' + quien +
    ', organizadas por barrio y por tipo de intervención. Es una herramienta de la Subsecretaría de Gestión Estratégica para conocer el territorio, dar cuenta de lo realizado y acompañar la planificación.</p></div>' +
    '<div><h3 class="sh-h3">Qué contiene</h3><ol class="ctx-grid">' + parts.map(function (x) { return '<li><b>' + x[0] + '</b><span>' + x[1] + '</span></li>'; }).join("") + '</ol></div>' +
    '<div><h3 class="sh-h3">Fuentes de información</h3><table class="t ctx-t"><tbody>' + fuentes.map(function (f) { return '<tr><td><b>' + f[0] + '</b></td><td>' + esc(f[1]) + '</td></tr>'; }).join("") + '</tbody></table></div>' +
    '<div><h3 class="sh-h3">Criterios de lectura</h3><ul class="ctx-crit">' + criterios.map(function (c) { return '<li>' + c + '</li>'; }).join("") + '</ul></div></div>';
}

// fotos de GeoGestión (p. ej. de cada refugio), con la dirección debajo: 12 por hoja
var FOTOS_POR_HOJA = 12;
function fotoPages(d, t, fotos) {
  if (!fotos.length) return [];
  var list = fotos.slice().sort(function (a, b) {
    var an = a.barrio ? BARRIO_BY[a.barrio].name : "", bn = b.barrio ? BARRIO_BY[b.barrio].name : "";
    return an.localeCompare(bn, "es", { numeric: true }) || a.dir.localeCompare(b.dir, "es", { numeric: true });
  });
  var out = [], n = Math.ceil(list.length / FOTOS_POR_HOJA);
  for (var i = 0; i < list.length; i += FOTOS_POR_HOJA) {
    var part = n > 1 ? ' (' + (i / FOTOS_POR_HOJA + 1) + ' de ' + n + ')' : '';
    out.push('<!--fuente:GeoGestión (fotos y direcciones de cada registro).-->' + band(d, (t.name === "Refugios" ? typeTitle(t, d) : t.name) + ' · fotos' + part, null, { type: t, cls: 'slim' }) +
      '<div class="body"><div class="foto-grid">' + list.slice(i, i + FOTOS_POR_HOJA).map(function (p) {
        var s = subOf(p);
        return '<figure class="foto"><div class="ph"><img src="' + esc(CFG.carpetaFotos || "img/fotos/") + esc(p.foto) + '" alt="" loading="eager">' + (s ? '<span class="ftag" style="background:' + s.color + ';color:' + inkOn(s.color) + '">' + esc(s.name) + '</span>' : '') + '</div>' +
          '<figcaption><b>' + esc(p.dir || "Sin dirección") + '</b><small>' + (p.barrio ? esc(BARRIO_BY[p.barrio].name) : 'Sin barrio') + '</small></figcaption></figure>';
      }).join("") + '</div></div>');
  }
  return out;
}

// tipos que la ficha muestra juntos en una hoja (config.js: fichaJuntas), cada uno de sus indicadores en un tono de verde
function joinTypes(dpts, types) {
  var J = CFG.fichaJuntas;
  if (!J) return { dpts: dpts, types: types };
  var names = J.tipos.map(norm), jin = types.filter(function (t) { return names.indexOf(norm(t.name)) >= 0; });
  if (!jin.length) return { dpts: dpts, types: types };
  var ids = jin.map(function (t) { return t.id; }), subs = [];
  jin.forEach(function (t) {
    var tp = dpts.filter(function (p) { return p.type === t.id; });
    if (t.subs) t.subs.forEach(function (x) { if (tp.some(function (p) { return p.sub === x.name; })) subs.push({ name: x.name, icon: x.icon }); });
    else subs.push({ name: t.name, icon: t.icon });
  });
  var jt = { id: "tjuntas", name: J.nombre, icon: jin[0].icon, img: null, color: J.verdes[1] || J.verdes[0], unidad: null, splitBy: "tipo",
    subs: subs.map(function (x, i) { return { name: x.name, icon: x.icon, img: null, color: J.verdes[i % J.verdes.length] }; }) };
  TYPE_BY[jt.id] = jt;
  dpts = dpts.map(function (p) {
    if (ids.indexOf(p.type) < 0) return p;
    var t = TYPE_BY[p.type], q = Object.assign({}, p);
    q.type = jt.id; q.sub = t.subs ? p.sub : t.name;
    return q;
  });
  var at = types.indexOf(jin[0]);
  types = types.filter(function (t) { return ids.indexOf(t.id) < 0; });
  types.splice(at, 0, jt);
  return { dpts: dpts, types: types };
}
function typeTitle(t, d) { var x = (CFG.fichaTitulos || {})[t.name]; return x ? x.replace("{zona}", zw(d)) : t.name; }

function buildFicha() {
  charts.forEach(function (c) { c.destroy(); }); charts = [];
  var d = DIST_BY[state.district];
  var on = state.types.size ? state.types : new Set(TYPES.map(function (t) { return t.id; }));
  var dpts = ITEMS.filter(function (p) { return p.district === d.id && on.has(p.type); });
  var types = TYPES.filter(function (t) { return dpts.some(function (p) { return p.type === t.id; }); });
  var jn = joinTypes(dpts, types); dpts = jn.dpts; types = jn.types;
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
    return '<tr><td><span class="tcell">' + badge(t, 20) + '<span>' + esc(t.name) + subs + '</span></span></td><td class="barcell"><div class="hbar" style="width:' + (tp.length / maxT * 100) + '%;background:' + t.color + '"></div></td><td class="r nw"><b>' + fmt.format(tp.length) + '</b>' + (line || t.unidad ? ' <small>' + unitOf(t, line) + '</small>' : '') + '</td><td class="r">' + barriosDe(tp) + '/' + nb + '</td></tr>';
  }).join("");
  pages.push(band(d, 'Resumen del ' + zw(d), nb + (nb === 1 ? ' barrio · ' : ' barrios · ') + fmt.format(dpts.length) + ' intervenciones municipales registradas') +
    '<div class="body">' +
    '<div class="sh-map"><canvas data-map="all" width="1372" height="' + (types.length > 8 ? 665 : 780) + '"></canvas></div>' +
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
      ? '<th>Barrio</th>' + subs.map(function (u) { return '<th class="r sub"><i style="background:' + u.color + '"></i>' + esc(u.name) + '</th>'; }).join("") + '<th class="r">Total</th><th class="r">%</th>'
      : '<th>Barrio</th><th></th><th class="r">' + (line || t.unidad ? cap(unitOf(t, line)) : 'Cantidad') + '</th>' + (line ? '<th class="r">Metros</th>' : '') + '<th class="r">Participación</th>';
    var legend = subs ? '<div class="sh-legend sub-legend"><b>' + sublabel + ':</b>' + subs.map(function (u) { return '<span><i style="background:' + u.color + '"></i>' + esc(u.name) + ' (' + tp.filter(function (p) { return p.sub === u.name; }).length + ')</span>'; }).join("") + '</div>' : '';
    var mapH = shown.length > 8 ? 570 : shown.length > 4 ? 720 : 855;
    pages.push(band(d, typeTitle(t, d), 'Intervenciones de este tipo en ' + esc(d.name), { type: t }) +
      '<div class="body">' +
      tiles(line
        ? [{ v: fmt.format(tp.length), l: "Cuadras" }, { v: km(m) + '<small> km</small>', l: "Extensión" }, { v: top ? esc(top.b.name) : "–", l: "Mayor concentración", txt: true }]
        : [{ v: fmt.format(tp.length), l: cap(unitOf(t, false)) }, { v: top ? esc(top.b.name) : "–", l: "Mayor concentración", txt: true }]) +
      '<div class="sh-map"><canvas data-map="' + t.id + '" width="1372" height="' + mapH + '"></canvas></div>' + legend +
      '<div><h3 class="sh-h3">Ranking de barrios</h3><table class="t' + (subs ? ' bysub' : '') + '"><thead><tr>' + thead + '</tr></thead><tbody>' + trows + '</tbody></table>' +
      '<p class="tnote">' + (subs ? '%' : 'Participación') + ': qué parte del total de ' + esc(t.name) + ' en ' + esc(d.name) + ' está en cada barrio.</p></div>' +
      '</div>');

    var fotos = tp.filter(function (p) { return p.foto; });
    if (!$("opt-list").checked) { pages.push.apply(pages, fotoPages(d, t, fotos)); return; }
    var list = tp.slice().sort(function (a, b) {
      var an = a.barrio ? BARRIO_BY[a.barrio].name : "", bn = b.barrio ? BARRIO_BY[b.barrio].name : "";
      return an.localeCompare(bn, "es", { numeric: true }) || (subs ? a.sub.localeCompare(b.sub, "es") : 0) || a.dir.localeCompare(b.dir, "es", { numeric: true });
    });
    // listado a dos columnas, agrupado por barrio y con la dirección completa (puede ocupar más de una línea):
    // se mide cada dirección para saber cuánto alto ocupa y armar las columnas sin que la hoja se corte
    var LH = 21.5, CAP = LIST_CAP - (subs ? (subs.length > 4 ? 62 : 34) : 0), aw = LIST_COLW - 16 - (line ? 56 : 0) - (subs ? 17 : 0);
    var cols = [], col = [], used = 0, prevB = null;
    function rowH(p) { return Math.max(1, Math.ceil(textW(p.dir || "Sin dirección") * 1.04 / aw)) * LH + 8; }
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
        var gs = 'background:' + t.color + ';color:' + inkOn(t.color);
        return '<table class="t lst"><colgroup><col>' + (line ? '<col class="m">' : '') + '</colgroup><tbody>' + c.map(function (p) {
          if (p.g !== undefined) return '<tr class="grp"><td colspan="' + (line ? 2 : 1) + '"><div class="gbox" style="' + gs + '"><span>' + (p.g ? esc(BARRIO_BY[p.g].name) : 'Sin barrio') + '</span><small>' + (p.cont ? 'continúa' : counts[p.g] + (line || t.unidad ? ' ' + unitOf(t, line) : '')) + '</small></div></td></tr>';
          return '<tr><td>' + (subs ? '<i class="dot" style="background:' + subColor(p) + '"></i>' : '') + esc(p.dir || "Sin dirección") + '</td>' + (line ? '<td class="r m">' + (p.coords ? Math.round(p.m) : '–') + '</td>' : '') + '</tr>';
        }).join("") + '</tbody></table>';
      });
      var part = nPages > 1 ? ' (' + (i / 2 + 1) + ' de ' + nPages + ')' : '';
      pages.push(band(d, (t.name === "Refugios" ? typeTitle(t, d) : t.name) + ' · listado' + part, null, { type: t, cls: 'slim' }) + '<div class="body lbody">' + legend + '<div class="list-cols">' + html.join("") + '</div></div>');
    }
    pages.push.apply(pages, fotoPages(d, t, fotos));
  });

  // 3. Síntesis ejecutiva (va como segunda hoja)
  var nBefore = pages.length;
  var tot = countBy(dpts), topB = tot.filter(function (x) { return x.n; }).slice(0, MAXBARS);
  var findings = [];
  if (dpts.length) findings.push('<li class="all">' + badge({ color: PAPER.blue, icon: "pin" }, 22) + '<span><b>En conjunto,</b> ' + esc(tot[0].b.name) + ' es el barrio con más intervenciones (' + tot[0].n + ', ' + Math.round(tot[0].n / dpts.length * 100) + '% del circuito)' + (tot[tot.length - 1].n < tot[0].n ? ' y ' + esc(tot[tot.length - 1].b.name) + ' el que menos recibió (' + tot[tot.length - 1].n + ')' : '') + '.</span></li>');
  var ppx = ppOf(d);
  // Presupuesto Participativo va en su propia hoja, al final
  types.forEach(function (t) {
    var tp = dpts.filter(function (p) { return p.type === t.id; }), line = isLine(t), byB = countBy(tp);
    var zero = byB.filter(function (x) { return !x.n; }).length;
    findings.push('<li>' + badge(t, 22) + '<span><b>' + esc(t.name) + ':</b> ' + esc(byB[0].b.name) + ' concentra ' + byB[0].n + ' de ' + tp.length + ' ' + unitOf(t, line) + ' (' + Math.round(byB[0].n / tp.length * 100) + '%)' + (zero ? '; ' + zero + (zero === 1 ? ' barrio sin registros' : ' barrios sin registros') : '') + '.</span></li>');
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
  var pad = padronOf(d), apx = pad && pad.est ? '<small>≈ </small>' : '';
  var zt = zw(d), keyTiles = tiles([
    { v: fmt.format(dpts.length), l: "Intervenciones realizadas en el " + zt, ic: "herram" },
    { v: barriosDe(dpts) + '<small> / ' + nb + '</small>', l: "Barrios con intervenciones / total de barrios en el " + zt, ic: "casas" }
  ].concat(pad ? [
    { v: apx + fmt.format(pad.electores), l: "Electores del " + zt + (pad.est ? " (estimado)" : ""), ic: "urna" },
    { v: apx + fmt.format(pad.escuelas), l: (pad.escuelas === 1 ? "Escuela donde se vota" : "Escuelas donde se vota") + " en el " + zt + (pad.est ? " (estimado)" : ""), ic: "escuela" }] : []), "g2 kpi");
  pages.push(band(d, "Síntesis ejecutiva", "Lo principal de " + esc(d.name) + " en una hoja") +
    '<div class="body"><div class="syn-head"><div class="locator"><canvas data-locator="1" width="440" height="330"></canvas><p>' + esc(d.name) + ' dentro de la ciudad</p></div>' + keyTiles + '</div><div><h3 class="sh-h3">Lectura rápida</h3><ul class="findings">' + findings.join("") + '</ul></div></div>');
  pages.push(band(d, "Síntesis ejecutiva · por barrio", "Qué barrios concentran más intervenciones según el tipo" + (tot.filter(function (x) { return x.n; }).length > MAXBARS ? " · " + MAXBARS + " barrios con más intervenciones" : "")) +
    '<div class="body"><div><h3 class="sh-h3">Intervenciones por barrio y tipo</h3><canvas data-chart="stack" width="636" height="' + stackH + '"></canvas></div>' +
    (many ? '' : '<div><h3 class="sh-h3">Cuadro por barrio y tipo</h3>' + heat + '</div>') + '</div>');
  if (many) pages.push(band(d, "Cuadro por barrio y tipo", "Cantidad de intervenciones de cada tipo en cada barrio. El color más intenso marca dónde se concentra cada tipo.") + '<div class="body">' + heat + '</div>');

  // portada
  var my = monthYear();
  var cover = '<div class="cover-full"><div class="cv-top"><img class="cv-logo" src="img/logo.svg" alt="Qué hicimos en los barrios · Fichas técnicas"><img class="cv-city" src="img/ciudad-smt.png" alt="Ciudad SMT"></div>' +
    '<div class="cv-panel"><span class="cv-pill">Ficha técnica</span><div class="cv-title"><h1>' + esc(d.name) + '</h1><p>' + nb + (nb === 1 ? ' barrio · ' : ' barrios · ') + fmt.format(dpts.length) + ' intervenciones municipales · ' +
    (SOURCE.sample ? 'datos de ejemplo' : 'actualizada al ' + SOURCE.when.toLocaleDateString("es-AR")) + '</p></div>' +
    '<ul class="cv-list' + (d.kind === "distrito" ? ' tight' : '') + '"><li>Contextualización</li>' + (RV.zonas ? '<li>Red vial del ' + zw(d) + '</li>' : '') + '<li>Plano del ' + zw(d) + '</li>' + (d.kind === "distrito" ? '<li>Circuitos electorales del distrito</li>' : '') + '<li>Síntesis ejecutiva</li><li>Resumen del ' + zw(d) + '</li><li>Intervenciones por tipo</li>' + (ppx ? '<li>Presupuesto Participativo ' + ppx.edicion + '</li>' : '') + '</ul>' +
    '<div class="cv-foot"><div><b>Subsecretaría de Gestión Estratégica</b><br>Secretaría General</div><div class="r"><b>' + esc(my.charAt(0).toUpperCase() + my.slice(1)) + '</b><br>' + esc(CFG.organismo) + '</div></div></div></div>';
  var plano = planoPage(d), pp = ppPage(d), red = redPage(d);
  // orden: portada, contextualización, red vial, plano, (circuitos del distrito), síntesis, resumen, tipos y, al final, Presupuesto Participativo
  pages = [cover, contextPage(d, !!red, !!pp)].concat(red ? [red] : [], [plano], circuitPages(d), pages.slice(nBefore), [pages[0]], pages.slice(1, nBefore), pp || []);

  $("sheets").innerHTML = pages.map(function (inner, i) { return sheetShell(i + 1, pages.length, inner, d); }).join("");
  $("viewer-title").textContent = "Ficha técnica · " + d.name;

  // con letra más grande algunas hojas no entran: el mapa se achica lo justo para que la hoja no se corte
  $("sheets").querySelectorAll(".sheet canvas[data-map], .sheet canvas[data-pp]").forEach(function (cv) {
    var sh = cv.closest(".sheet"), foot = sh.querySelector(".foot");
    var bottom = Math.max.apply(null, Array.prototype.map.call(sh.querySelectorAll(".body > *"), function (e) { return e.getBoundingClientRect().bottom; }));
    var over = bottom - foot.getBoundingClientRect().top;
    if (over > 0) cv.height = Math.max(360, cv.height - Math.ceil(over * cv.width / cv.getBoundingClientRect().width) - 8);
  });
  // si para que entre la descripción el mapa de Presupuesto Participativo queda muy chico, la descripción pasa a otra hoja
  var ppc = $("sheets").querySelector("canvas[data-pp]");
  if (ppc && ppc.height < 500 && ppSplitFor !== d.id && $("sheets").querySelector(".pp-desc:not(.full)")) { ppSplitFor = d.id; return buildFicha(); }
  var draws = [];
  $("sheets").querySelectorAll("canvas[data-map]").forEach(function (cv) {
    var k = cv.getAttribute("data-map"), t = TYPE_BY[k];
    if (k === "plano") { draws.push(drawMap(cv, d, [], { numbered: true, radius: 7, lineW: 4, overlay: d.kind === "distrito" ? ZONES.circuito : null })); return; }
    if (k === "red") { draws.push(drawMap(cv, d, [], { noLabels: true, before: function (ctx, P) { paintRed(ctx, P, d); } })); return; }
    var tps = k === "all" ? dpts : dpts.filter(function (p) { return p.type === k; });
    draws.push(drawMap(cv, d, tps, { radius: k === "all" ? 7 : 9.5, lineW: k === "all" ? 4 : 6, labelSize: k === "all" ? 10 : 12, colorOf: t && t.subs ? subColor : null, onlyBarrios: k === "all" ? null : new Set(tps.map(function (p) { return p.barrio; })) }));
  });
  $("sheets").querySelectorAll("canvas[data-pp]").forEach(function (cv) { draws.push(drawPPMap(cv, d, ppOf(d))); });
  fichaReady = Promise.all(draws);
  $("sheets").querySelectorAll("canvas[data-locator]").forEach(function (cv) { drawLocator(cv, d); });
  var cv = $("sheets").querySelector('canvas[data-chart="stack"]');
  var rc = $("sheets").querySelector('canvas[data-chart="red"]');
  if (rc) chartRed(rc, d);
  if (cv) chartStack(cv, topB.map(function (x) { return x.b.name; }), types.map(function (t) { return { label: t.name, backgroundColor: t.color, data: topB.map(function (x) { return dpts.filter(function (p) { return p.barrio === x.b.id && p.type === t.id; }).length; }) }; }));
}

function initViewer() {
  $("btn-ficha").addEventListener("click", function () {
    if (!state.district) return;
    $("viewer-msg").textContent = "";
    $("viewer").hidden = false;
    // los mapas y gráficos de la ficha escriben con Poppins: esperar a que esté cargada
    var fonts = document.fonts ? Promise.all(["400 12px Poppins", "500 12px Poppins", "600 12px Poppins", "700 12px Poppins", "800 12px Poppins"].map(function (f) { return document.fonts.load(f); })).catch(function () {}) : Promise.resolve();
    Promise.all([fonts, preloadIcons(), loadRedVial()]).then(function () { buildFicha(); $("sheets").scrollTop = 0; });
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
