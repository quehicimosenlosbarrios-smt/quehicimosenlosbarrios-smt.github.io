(function () {
"use strict";

var CFG = window.APP_CONFIG;
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
  { re: /repavim/, icon: "pav", color: "#b0569a" },
  { re: /paviment|asfalt|calzada/, icon: "pav", color: "#6b4fa3" },
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
function labelPoint(polys) {
  // centroide del anillo más grande; si cae afuera, el punto medio de su caja
  var best = polys.slice().sort(function (a, b) { return ringArea(b[0]) - ringArea(a[0]); })[0][0];
  var A = 0, cx = 0, cy = 0;
  for (var i = 0, j = best.length - 1; i < best.length; j = i++) {
    var f = best[j][0] * best[i][1] - best[i][0] * best[j][1];
    A += f; cx += (best[j][0] + best[i][0]) * f; cy += (best[j][1] + best[i][1]) * f;
  }
  if (A) { cx /= 3 * A; cy /= 3 * A; if (inRing([cx, cy], best)) return [cx, cy]; }
  var b = bboxOf([[best]]); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
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
    return { id: prefix + i, name: name, key: norm(name), polys: polys, bbox: bboxOf(polys), label: labelPoint(polys), barrios: [] };
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
var SOURCE = { sample: true, when: null, skipped: 0, unlocated: 0 };

function buildTypes(names) {
  var used = 0;
  TYPES = names.map(function (n) {
    var k = norm(n), rule = RULES.filter(function (r) { return r.re.test(k); })[0];
    return { id: "t" + k.replace(/[^a-z0-9]+/g, "-"), name: n, icon: rule ? rule.icon : "pin", color: rule ? rule.color : SPARE[used++ % SPARE.length] };
  });
  // dos tipos con la misma regla (raro) reciben colores distintos
  var seen = {};
  TYPES.forEach(function (t) { if (seen[t.color]) t.color = SPARE[used++ % SPARE.length]; seen[t.color] = 1; });
  TYPE_BY = {}; TYPES.forEach(function (t) { TYPE_BY[t.id] = t; });
}

function locate(pt, barrioText) {
  var b = null, key = norm(barrioText);
  if (key) b = BARRIOS.filter(function (x) { return x.key === key; })[0] || null;
  if (!b) b = BARRIOS.filter(function (x) { return inFeature(pt, x); })[0] || null;
  var d = DISTRICTS.filter(function (x) { return inFeature(pt, x); })[0] || (b ? DIST_BY[b.district] : null);
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
    var row = { tname: typeSeen[tk], dir: C.direccion ? String(r[C.direccion] || "").trim() : "", barrioText: C.barrio ? r[C.barrio] : "", pt: [lng, lat] };
    var cid = C.cuadra ? String(r[C.cuadra] || "").trim() : "";
    if (cid) { (lines[cid] = lines[cid] || []).push(row); } else items.push(row);
  });
  Object.keys(lines).forEach(function (cid) {
    var rs = lines[cid];
    if (rs.length < 2) { skipped += rs.length; return; }
    var a = rs[0].pt, e = rs[rs.length - 1].pt;
    var mid = [(a[0] + e[0]) / 2, (a[1] + e[1]) / 2];
    items.push({ tname: rs[0].tname, dir: rs[0].dir, barrioText: rs[0].barrioText, pt: mid, coords: rs.map(function (x) { return x.pt; }), cuadra: cid, m: rs.slice(1).reduce(function (acc, x, i) { return acc + meters(rs[i].pt, x.pt); }, 0) });
  });
  buildTypes(typeNames);
  var nameToType = {}; TYPES.forEach(function (t) { nameToType[t.name] = t.id; });
  var unlocated = 0, id = 1;
  ITEMS = [];
  items.forEach(function (it) {
    var loc = locate(it.pt, it.barrioText);
    if (!loc.district) { unlocated++; return; }
    ITEMS.push({ id: id++, type: nameToType[it.tname], dir: it.dir, barrio: loc.barrio ? loc.barrio.id : null, district: loc.district.id, lng: it.pt[0], lat: it.pt[1], coords: it.coords, cuadra: it.cuadra, m: it.m });
  });
  SOURCE.skipped = skipped; SOURCE.unlocated = unlocated;
}

async function loadAll() {
  var res = await Promise.all([fetch(CFG.distritos).then(function (r) { return r.json(); }), fetch(CFG.barrios).then(function (r) { return r.json(); })]);
  DISTRICTS = prepFeatures(res[0], CFG.campoNombreDistrito, ["nombre", "name", "distrito"], "D");
  BARRIOS = prepFeatures(res[1], CFG.campoNombreBarrio, ["nombre", "name", "barrio"], "B");
  DISTRICTS.forEach(function (d) { DIST_BY[d.id] = d; });
  BARRIOS.forEach(function (b) {
    BARRIO_BY[b.id] = b;
    var d = DISTRICTS.filter(function (x) { return inFeature(b.label, x); })[0];
    b.district = d ? d.id : null;
    if (d) d.barrios.push(b);
  });
  DISTRICTS.forEach(function (d) { d.barrios.sort(function (a, b) { return a.name.localeCompare(b.name, "es", { numeric: true }); }); });
  var url = CFG.planillaCSV || CFG.planillaEjemplo;
  SOURCE.sample = !CFG.planillaCSV;
  var csv = await loadCSV(url + (CFG.planillaCSV ? (url.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now() : ""));
  buildItems(csv.data, csv.meta.fields || []);
  SOURCE.when = new Date();
}

/* ---------- App ---------- */
var state = { district: "", barrio: "", types: new Set() };
var map, distLayer, barrLayer, barrLabels, ptLayer, distPolys = {}, barrPolys = {}, cityBounds, bases = {};

function iconSvg(t, size) { return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path fill="#fff" fill-rule="evenodd" d="' + ICONS[t.icon] + '"/></svg>'; }
function badge(t, size) { return '<span class="badge" style="background:' + t.color + ';width:' + size + 'px;height:' + size + 'px">' + iconSvg(t, Math.round(size * 0.68)) + '</span>'; }

function initMap() {
  map = L.map("map", { zoomSnap: 0.25 });
  bases = {
    claro: L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 20, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' }),
    osm: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }),
    sat: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Imágenes &copy; Esri" })
  };
  bases.claro.addTo(map);
  $("f-base").addEventListener("change", function (e) {
    Object.keys(bases).forEach(function (k) { bases[k].remove(); });
    if (bases[e.target.value]) bases[e.target.value].addTo(map);
  });

  distLayer = L.layerGroup(); barrLayer = L.layerGroup(); barrLabels = L.layerGroup(); ptLayer = L.layerGroup();
  DISTRICTS.forEach(function (d) {
    var poly = L.polygon(d.polys.map(function (p) { return p.map(toLL); }), styleDistrict(d.id));
    poly.bindTooltip(esc(d.name), { permanent: true, direction: "center", className: "dlabel" });
    poly.on("click", function () { setDistrict(state.district === d.id ? "" : d.id); });
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
  map.on("zoomend", function () { updateBarrLabels(); render(); });
}
function styleDistrict(id) {
  var sel = state.district === id;
  return { color: css("--district"), weight: sel ? 3.5 : 2.2, fillColor: css("--district"), fillOpacity: sel ? 0.1 : 0.03 };
}
function updateBarrLabels() { if ($("lyr-barr").checked && map.getZoom() >= 14.5) barrLabels.addTo(map); else barrLabels.remove(); }

function initPanel() {
  $("org").textContent = CFG.organismo; $("app-title").textContent = CFG.titulo; document.title = CFG.titulo;
  var fDist = $("f-dist");
  fDist.innerHTML = '<option value="">Todos los distritos</option>' + DISTRICTS.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "es", { numeric: true }); }).map(function (d) { return '<option value="' + d.id + '">' + esc(d.name) + '</option>'; }).join("");
  fillBarrios();
  TYPES.forEach(function (t) { state.types.add(t.id); });
  $("types").innerHTML = TYPES.map(function (t) {
    return '<label class="type-row"><input type="checkbox" data-type="' + t.id + '" checked>' + badge(t, 22) + '<span>' + esc(t.name) + '</span><span class="n" id="n-' + t.id + '">0</span></label>';
  }).join("");
  $("legend").innerHTML = TYPES.map(function (t) { return '<div>' + badge(t, 18) + esc(t.name) + '</div>'; }).join("");

  fDist.addEventListener("change", function () { setDistrict(fDist.value); });
  $("f-barr").addEventListener("change", function () {
    state.barrio = $("f-barr").value;
    if (state.barrio) {
      var b = BARRIO_BY[state.barrio];
      if (b.district && state.district !== b.district) { state.district = b.district; fDist.value = b.district; fillBarrios(); }
      map.fitBounds(barrPolys[b.id].getBounds(), { padding: [40, 40] });
    } else if (state.district) map.fitBounds(distPolys[state.district].getBounds(), { padding: [30, 30] });
    render();
  });
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

  var tag = $("data-tag");
  if (SOURCE.sample) tag.textContent = "Datos de ejemplo · todavía no se conectó la planilla";
  else { tag.textContent = "Planilla leída el " + SOURCE.when.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }); tag.classList.add("real"); }
  var warn = [];
  if (SOURCE.skipped) warn.push(SOURCE.skipped + " filas sin tipo o coordenadas válidas (o cuadras con un solo punto) no se muestran.");
  if (SOURCE.unlocated) warn.push(SOURCE.unlocated + " intervenciones caen fuera de los distritos y no se muestran.");
  if (warn.length) { $("warn").textContent = warn.join(" "); $("warn").hidden = false; }
}
function fillBarrios() {
  var list = state.district ? DIST_BY[state.district].barrios : BARRIOS.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "es", { numeric: true }); });
  $("f-barr").innerHTML = '<option value="">Todos los barrios</option>' + list.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join("");
  $("f-barr").value = state.barrio;
}
function setDistrict(id) {
  state.district = id;
  if (state.barrio && (!id || BARRIO_BY[state.barrio].district !== id)) state.barrio = "";
  $("f-dist").value = id; fillBarrios(); render();
  map.fitBounds(id ? distPolys[id].getBounds() : cityBounds, { padding: [30, 30] });
}
function inZone(p) { return (!state.district || p.district === state.district) && (!state.barrio || p.barrio === state.barrio); }

function render() {
  ptLayer.clearLayers();
  var pts = ITEMS.filter(function (p) { return inZone(p) && state.types.has(p.type); });
  var stroke = css("--pt-stroke"), size = map.getZoom() >= 15 ? 26 : 20;
  if ($("lyr-int").checked) {
    pts.forEach(function (p) {
      var t = TYPE_BY[p.type], b = BARRIO_BY[p.barrio];
      var pop = "<b>" + esc(t.name) + "</b>" + (p.dir ? "<br>" + esc(p.dir) : "") + "<br>" + (b ? esc(b.name) + " · " : "") + esc(DIST_BY[p.district].name) + (p.cuadra ? "<br>Cuadra " + esc(p.cuadra) + " · " + fmt.format(Math.round(p.m)) + " m" : "");
      if (p.coords) {
        var ll = p.coords.map(function (c) { return [c[1], c[0]]; });
        L.polyline(ll, { color: stroke, weight: 8, opacity: 0.9, interactive: false }).addTo(ptLayer);
        L.polyline(ll, { color: t.color, weight: 5, opacity: 1 }).bindPopup(pop).addTo(ptLayer);
      } else {
        L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "pin", html: badge(t, size), iconSize: [size, size], iconAnchor: [size / 2, size / 2] }), title: t.name + (p.dir ? ", " + p.dir : "") }).bindPopup(pop).addTo(ptLayer);
      }
    });
  }
  Object.keys(distPolys).forEach(function (id) { distPolys[id].setStyle(styleDistrict(id)); });
  Object.keys(barrPolys).forEach(function (id) {
    var sel = state.barrio === id;
    barrPolys[id].setStyle({ color: sel ? css("--district") : css("--barrio"), weight: sel ? 2.5 : 1, dashArray: sel ? null : "4 4" });
  });
  var zone = ITEMS.filter(inZone);
  TYPES.forEach(function (t) { $("n-" + t.id).textContent = fmt.format(zone.filter(function (p) { return p.type === t.id; }).length); });
  $("s-total").textContent = fmt.format(pts.length);
  $("s-barrios").textContent = fmt.format(new Set(pts.map(function (p) { return p.barrio; }).filter(Boolean)).size);
  var btn = $("btn-ficha");
  btn.disabled = !state.district;
  btn.textContent = state.district ? "Ver ficha técnica · " + DIST_BY[state.district].name : "Ver ficha técnica del distrito";
  $("ficha-hint").textContent = state.district ? "Resumen, una página por cada tipo marcado y análisis por barrio." : "Elegí un distrito en la lista o tocándolo en el mapa.";
}

/* ---------- Ficha técnica ---------- */
var PAPER = { ink: "#18242c", muted: "#5b6b76", line: "#d9e1e5", tint: "#f2f6f8", district: "#1d5f86", barrio: "#8a9aa3" };
var charts = [];
var MAXBARS = 15;

function drawMap(canvas, district, pts, opts) {
  var scale = 2, Wd = canvas.width / scale, Hd = canvas.height / scale;
  var ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = PAPER.tint; ctx.fillRect(0, 0, Wd, Hd);
  var bb = district.bbox, kx = Math.cos(((bb[1] + bb[3]) / 2) * Math.PI / 180);
  var pad = 28, s = Math.min((Wd - pad * 2) / ((bb[2] - bb[0]) * kx), (Hd - pad * 2) / (bb[3] - bb[1]));
  var ox = (Wd - (bb[2] - bb[0]) * kx * s) / 2, oy = (Hd - (bb[3] - bb[1]) * s) / 2;
  function P(p) { return [ox + (p[0] - bb[0]) * kx * s, oy + (bb[3] - p[1]) * s]; }
  function path(polys) { ctx.beginPath(); polys.forEach(function (poly) { poly.forEach(function (ring) { ring.forEach(function (p, i) { var q = P(p); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); }); }); }
  DISTRICTS.forEach(function (d) { if (d.id === district.id) return; path(d.polys); ctx.fillStyle = "#e8edf0"; ctx.fill("evenodd"); ctx.strokeStyle = "#c9d3d8"; ctx.lineWidth = 1; ctx.stroke(); });
  path(district.polys); ctx.fillStyle = "#ffffff"; ctx.fill("evenodd");
  ctx.setLineDash([4, 4]); ctx.strokeStyle = PAPER.barrio; ctx.lineWidth = 0.8;
  district.barrios.forEach(function (b) { path(b.polys); ctx.stroke(); });
  ctx.setLineDash([]);
  path(district.polys); ctx.strokeStyle = PAPER.district; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.lineCap = "round";
  pts.forEach(function (p) {
    if (!p.coords) return;
    ctx.beginPath(); p.coords.forEach(function (c, i) { var q = P(c); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = opts.lineW + 3; ctx.stroke();
    ctx.strokeStyle = TYPE_BY[p.type].color; ctx.lineWidth = opts.lineW; ctx.stroke();
  });
  var r = opts.radius;
  pts.forEach(function (p) {
    if (p.coords) return;
    var t = TYPE_BY[p.type], q = P([p.lng, p.lat]);
    ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
    ctx.fillStyle = t.color; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = "#ffffff"; ctx.stroke();
    var k = (r * 1.36) / 24;
    ctx.save(); ctx.translate(q[0] - 12 * k, q[1] - 12 * k); ctx.scale(k, k);
    ctx.fillStyle = "#ffffff"; ctx.fill(new Path2D(ICONS[t.icon]), "evenodd"); ctx.restore();
  });
  // nombres de barrio por encima de todo, con halo
  ctx.font = "600 11px 'Source Sans 3', Arial, sans-serif"; ctx.textAlign = "center"; ctx.lineJoin = "round";
  district.barrios.forEach(function (b) {
    var q = P(b.label);
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3; ctx.strokeText(b.name, q[0], q[1]);
    ctx.fillStyle = PAPER.ink; ctx.fillText(b.name, q[0], q[1]);
  });
  ctx.fillStyle = PAPER.ink; ctx.font = "700 12px 'Archivo', Arial, sans-serif";
  ctx.beginPath(); ctx.moveTo(Wd - 22, 14); ctx.lineTo(Wd - 28, 30); ctx.lineTo(Wd - 16, 30); ctx.closePath(); ctx.fill();
  ctx.fillText("N", Wd - 22, 44);
  var kmPx = s / 111.32, steps = [0.25, 0.5, 1, 2, 5], barKm = steps.filter(function (x) { return x * kmPx <= Wd / 4; }).pop() || 0.25;
  ctx.fillRect(14, Hd - 18, barKm * kmPx, 3);
  ctx.textAlign = "left"; ctx.font = "500 11px 'IBM Plex Mono', monospace"; ctx.fillText((barKm < 1 ? barKm * 1000 + " m" : barKm + " km"), 14, Hd - 24);
}

function chartBar(canvas, labels, datasets, opts) {
  var ch = new Chart(canvas, {
    type: "bar",
    data: { labels: labels, datasets: datasets },
    options: {
      indexAxis: "y", responsive: false, animation: false, devicePixelRatio: 2,
      plugins: { legend: { display: !!opts.legend, position: "bottom", labels: { color: PAPER.ink, boxWidth: 10, boxHeight: 10, font: { size: 11, family: "'Source Sans 3', Arial" } } }, tooltip: { enabled: false } },
      scales: {
        x: { stacked: !!opts.stacked, beginAtZero: true, grid: { color: PAPER.line }, border: { display: false }, ticks: { color: PAPER.muted, precision: 0, font: { size: 11, family: "'IBM Plex Mono', monospace" } }, title: { display: !!opts.xTitle, text: opts.xTitle, color: PAPER.muted, font: { size: 11 } } },
        y: { stacked: !!opts.stacked, grid: { display: false }, border: { color: PAPER.ink }, ticks: { color: PAPER.ink, font: { size: 11.5, family: "'Source Sans 3', Arial", weight: 600 } } }
      }
    }
  });
  charts.push(ch);
}

function sheetShell(pageNo, total, d, inner) {
  var today = new Date().toLocaleDateString("es-AR");
  var src = SOURCE.sample ? "Datos de ejemplo. No representan intervenciones reales." : "Fuente: planilla de intervenciones, leída el " + SOURCE.when.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) + ".";
  return '<article class="sheet"><div class="sh-head"><div class="org">' + esc(CFG.organismo) + '<br>Ficha técnica de intervenciones</div><div class="doc">' + esc(d.name.toUpperCase()) + '<br>Emitida ' + today + '</div></div>' + inner +
    '<div class="sh-foot"><span>' + esc(src) + '</span><span>Página ' + pageNo + ' de ' + total + '</span></div></article>';
}

function buildFicha() {
  charts.forEach(function (c) { c.destroy(); }); charts = [];
  var d = DIST_BY[state.district];
  var dpts = ITEMS.filter(function (p) { return p.district === d.id && state.types.has(p.type); });
  var types = TYPES.filter(function (t) { return state.types.has(t.id) && dpts.some(function (p) { return p.type === t.id; }); });
  var isLine = function (t) { return dpts.some(function (p) { return p.type === t.id && p.coords; }); };
  var pages = [];
  function km(m) { return fmt.format(Math.round(m / 100) / 10) + " km"; }
  function barriosDe(tp) { return new Set(tp.map(function (p) { return p.barrio; }).filter(Boolean)).size; }
  function countBy(tp) {
    return d.barrios.map(function (b) { var bp = tp.filter(function (p) { return p.barrio === b.id; }); return { b: b, n: bp.length, m: bp.reduce(function (a, p) { return a + (p.m || 0); }, 0) }; }).sort(function (a, b) { return b.n - a.n; });
  }
  var nb = d.barrios.length;

  var rows = types.map(function (t) {
    var tp = dpts.filter(function (p) { return p.type === t.id; }), line = isLine(t);
    var m = tp.reduce(function (a, p) { return a + (p.m || 0); }, 0);
    return '<tr><td><span class="tcell">' + badge(t, 20) + esc(t.name) + '</span></td><td class="r">' + fmt.format(tp.length) + (line ? ' cuadras' : '') + '</td><td class="r">' + (line ? km(m) : '–') + '</td><td class="r">' + barriosDe(tp) + ' de ' + nb + '</td></tr>';
  }).join("");
  pages.push(
    '<div><h2 class="sh-title">' + esc(d.name) + '</h2><p class="sh-sub">Resumen de intervenciones municipales · ' + nb + ' barrios · ' + fmt.format(dpts.length) + ' intervenciones registradas</p></div>' +
    '<div class="sh-map"><canvas data-map="all" width="1380" height="860"></canvas></div>' +
    '<div class="sh-legend">' + types.map(function (t) { return '<span>' + badge(t, 18) + esc(t.name) + '</span>'; }).join("") + '</div>' +
    '<div class="sh-block"><h3>Totales por tipo de intervención</h3><table class="t"><thead><tr><th>Tipo</th><th class="r">Intervenciones</th><th class="r">Extensión</th><th class="r">Barrios alcanzados</th></tr></thead><tbody>' + rows + '</tbody><tfoot><tr><td>Total</td><td class="r">' + fmt.format(dpts.length) + '</td><td class="r"></td><td class="r">' + barriosDe(dpts) + ' de ' + nb + '</td></tr></tfoot></table></div>');

  types.forEach(function (t) {
    var tp = dpts.filter(function (p) { return p.type === t.id; }), line = isLine(t);
    var m = tp.reduce(function (a, p) { return a + (p.m || 0); }, 0);
    var byB = countBy(tp).filter(function (x) { return x.n; });
    var top = byB[0];
    var pct = function (n) { return (tp.length ? Math.round(n / tp.length * 100) : 0) + '%'; };
    var shown = byB.slice(0, MAXBARS);
    var trows = shown.map(function (x) { return '<tr><td>' + esc(x.b.name) + '</td><td class="r">' + x.n + '</td>' + (line ? '<td class="r">' + fmt.format(Math.round(x.m)) + '</td>' : '') + '<td class="r">' + pct(x.n) + '</td></tr>'; }).join("") +
      (byB.length > MAXBARS ? '<tr><td colspan="' + (line ? 4 : 3) + '" class="more">y ' + (byB.length - MAXBARS) + ' barrios más con menos intervenciones</td></tr>' : '');
    var kpis = line
      ? '<div class="kpi"><b>' + fmt.format(tp.length) + '</b><span>Cuadras</span></div><div class="kpi"><b>' + km(m) + '</b><span>Extensión</span></div>'
      : '<div class="kpi"><b>' + fmt.format(tp.length) + '</b><span>Intervenciones</span></div><div class="kpi"><b>' + (dpts.length ? Math.round(tp.length / dpts.length * 100) : 0) + '%</b><span>Del total del distrito</span></div>';
    var chartH = Math.max(120, shown.length * 26 + 40);
    pages.push(
      '<div class="sh-type">' + badge(t, 34) + '<h2 class="sh-title">' + esc(t.name) + '</h2></div>' +
      '<div class="kpis">' + kpis + '<div class="kpi"><b>' + barriosDe(tp) + ' / ' + nb + '</b><span>Barrios alcanzados</span></div><div class="kpi wide"><b>' + (top ? esc(top.b.name) : "–") + '</b><span>Mayor concentración</span></div></div>' +
      '<div class="sh-map"><canvas data-map="' + t.id + '" width="1380" height="' + (shown.length > 8 ? 660 : 800) + '"></canvas></div>' +
      '<div class="sh-cols"><div class="sh-block"><h3>' + (line ? 'Cuadras' : 'Intervenciones') + ' por barrio</h3><canvas data-chart="' + t.id + '" width="350" height="' + Math.min(chartH, 430) + '"></canvas></div>' +
      '<div class="sh-block"><h3>Detalle por barrio</h3><table class="t"><thead><tr><th>Barrio</th><th class="r">' + (line ? 'Cuadras' : 'Cant.') + '</th>' + (line ? '<th class="r">Metros</th>' : '') + '<th class="r">%</th></tr></thead><tbody>' + trows + '</tbody></table></div></div>');

    if (!$("opt-list").checked) return;
    var list = tp.slice().sort(function (a, b) {
      var an = a.barrio ? BARRIO_BY[a.barrio].name : "", bn = b.barrio ? BARRIO_BY[b.barrio].name : "";
      return an.localeCompare(bn, "es", { numeric: true }) || a.dir.localeCompare(b.dir, "es", { numeric: true });
    });
    var PER = 34;
    for (var i = 0; i < list.length; i += PER * 2) {
      var cols = [list.slice(i, i + PER), list.slice(i + PER, i + PER * 2)].filter(function (c) { return c.length; }).map(function (c) {
        return '<table class="t"><thead><tr><th>Dirección</th><th>Barrio</th>' + (line ? '<th class="r">m</th>' : '') + '</tr></thead><tbody>' + c.map(function (p) {
          return '<tr><td>' + esc(p.dir || "Sin dirección") + '</td><td>' + (p.barrio ? esc(BARRIO_BY[p.barrio].name) : "–") + '</td>' + (line ? '<td class="r">' + Math.round(p.m) + '</td>' : '') + '</tr>';
        }).join("") + '</tbody></table>';
      });
      pages.push('<div class="sh-type">' + badge(t, 26) + '<h2 class="sh-title sm">' + esc(t.name) + ' · listado' + (list.length > PER * 2 ? ' (' + (i / (PER * 2) + 1) + ')' : '') + '</h2></div>' +
        '<div class="list-cols">' + cols.join("") + '</div>');
    }
  });

  // Análisis
  var findings = [];
  types.forEach(function (t) {
    var tp = dpts.filter(function (p) { return p.type === t.id; }), line = isLine(t);
    var byB = countBy(tp);
    var share = Math.round(byB[0].n / tp.length * 100);
    var zero = byB.filter(function (x) { return !x.n; }).length;
    findings.push("<li><b>" + esc(t.name) + ":</b> " + esc(byB[0].b.name) + " concentra " + byB[0].n + " de " + tp.length + (line ? " cuadras" : " intervenciones") + " (" + share + "%)" + (zero ? "; " + zero + (zero === 1 ? " barrio sin registros" : " barrios sin registros") : "") + ".</li>");
  });
  var tot = countBy(dpts);
  if (dpts.length) findings.unshift("<li><b>En conjunto,</b> " + esc(tot[0].b.name) + " es el barrio con más intervenciones (" + tot[0].n + ", " + Math.round(tot[0].n / dpts.length * 100) + "% del distrito)" + (tot[tot.length - 1].n < tot[0].n ? " y " + esc(tot[tot.length - 1].b.name) + " el que menos recibió (" + tot[tot.length - 1].n + ")" : "") + ".</li>");
  var topB = tot.filter(function (x) { return x.n; }).slice(0, MAXBARS);
  var cross = '<table class="t cross"><thead><tr><th>Barrio</th>' + types.map(function (t) { return '<th class="r" title="' + esc(t.name) + '">' + badge(t, 18) + '</th>'; }).join("") + '<th class="r">Total</th></tr></thead><tbody>' +
    topB.map(function (x) {
      return '<tr><td>' + esc(x.b.name) + '</td>' + types.map(function (t) { var n = dpts.filter(function (p) { return p.barrio === x.b.id && p.type === t.id; }).length; return '<td class="r' + (n ? '' : ' zero') + '">' + n + '</td>'; }).join("") + '<td class="r"><b>' + x.n + '</b></td></tr>';
    }).join("") + '</tbody></table>';
  var crossLegend = '<div class="sh-legend" style="margin-top:8px">' + types.map(function (t) { return '<span>' + badge(t, 16) + esc(t.name) + '</span>'; }).join("") + '</div>';
  pages.push(
    '<div><h2 class="sh-title">Análisis del distrito</h2><p class="sh-sub">Qué barrios concentran más intervenciones según el tipo' + (tot.filter(function (x) { return x.n; }).length > MAXBARS ? ' · se muestran los ' + MAXBARS + ' barrios con más intervenciones' : '') + '</p></div>' +
    '<div class="sh-block"><h3>Intervenciones por barrio y tipo</h3><canvas data-chart="stack" width="690" height="' + Math.min(Math.max(200, topB.length * 22 + 70), 400) + '"></canvas></div>' +
    '<div class="sh-block"><h3>Lectura rápida</h3><ul class="findings">' + findings.join("") + '</ul></div>' +
    (topB.length <= 8 ? '<div class="sh-block"><h3>Cuadro por barrio y tipo</h3>' + cross + crossLegend + '</div>' : ''));
  if (topB.length > 8) pages.push('<div><h2 class="sh-title">Cuadro por barrio y tipo</h2><p class="sh-sub">Cantidad de intervenciones de cada tipo en cada barrio</p></div>' + cross + crossLegend);

  $("sheets").innerHTML = pages.map(function (inner, i) { return sheetShell(i + 1, pages.length, d, inner); }).join("");
  $("viewer-title").textContent = "Ficha técnica · " + d.name;

  $("sheets").querySelectorAll("canvas[data-map]").forEach(function (cv) {
    var k = cv.getAttribute("data-map");
    drawMap(cv, d, k === "all" ? dpts : dpts.filter(function (p) { return p.type === k; }), { radius: k === "all" ? 7 : 9, lineW: k === "all" ? 4 : 6 });
  });
  $("sheets").querySelectorAll("canvas[data-chart]").forEach(function (cv) {
    var k = cv.getAttribute("data-chart");
    if (k === "stack") {
      chartBar(cv, topB.map(function (x) { return x.b.name; }), types.map(function (t) { return { label: t.name, backgroundColor: t.color, data: topB.map(function (x) { return dpts.filter(function (p) { return p.barrio === x.b.id && p.type === t.id; }).length; }) }; }), { stacked: true, legend: true, xTitle: "Cantidad de intervenciones" });
    } else {
      var t = TYPE_BY[k];
      var data = countBy(dpts.filter(function (p) { return p.type === k; })).filter(function (x) { return x.n; }).slice(0, MAXBARS);
      chartBar(cv, data.map(function (x) { return x.b.name; }), [{ label: t.name, backgroundColor: t.color, data: data.map(function (x) { return x.n; }), maxBarThickness: 22 }], {});
    }
  });
}

function initViewer() {
  $("btn-ficha").addEventListener("click", function () {
    if (!state.district) return;
    $("viewer-msg").textContent = "";
    $("viewer").hidden = false;
    buildFicha();
    $("sheets").scrollTop = 0;
  });
  $("btn-close").addEventListener("click", function () { $("viewer").hidden = true; });
  $("opt-list").addEventListener("change", buildFicha);
  $("btn-pdf").addEventListener("click", async function () {
    var btn = this, msg = $("viewer-msg"), label = btn.textContent;
    btn.disabled = true; msg.textContent = "";
    try {
      var pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      var sheets = $("sheets").querySelectorAll(".sheet");
      for (var i = 0; i < sheets.length; i++) {
        btn.textContent = "Armando página " + (i + 1) + " de " + sheets.length + "…";
        var cv = await html2canvas(sheets[i], { scale: 2, backgroundColor: "#ffffff", logging: false });
        if (i) pdf.addPage();
        pdf.addImage(cv.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297);
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
