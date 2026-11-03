"""
Red vial de la ciudad por material, para la hoja "Caracterización de la red vial"
de la ficha técnica. Se corre a mano solo cuando cambia la red vial.

Fuente: tabla "RED VIAL COMPLETA" del Power BI de la Subsecretaría (una fila por
vértice de cada cuadra, con la capa PAVIMENTO / CORDON CUNETA / RIPIO).

Requiere pbixray y shapely (pip install pbixray shapely).

Uso:  python scripts/red_vial.py ruta/al/archivo.pbix
      python scripts/red_vial.py ruta/a/red-vial.csv   (la tabla ya exportada)

Genera:
  - data/red-vial.geojson: una línea por cuadra, con su material (m) e id.
  - data/red-vial-zonas.json: para cada circuito y cada distrito, los km y la
      cantidad de cuadras de cada material. Los km se miden recortando cada
      cuadra con el límite de la zona; una cuadra cuenta en la zona donde cae
      su punto medio.
"""
import csv
import json
import math
import os
import sys
from collections import defaultdict

from shapely.geometry import LineString, shape
from shapely.prepared import prep

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MATERIAL = {"PAVIMENTO": "P", "CORDON CUNETA": "C", "RIPIO": "R"}
LAT0 = math.radians(-26.83)


def ruta(n):
    return os.path.join(RAIZ, "data", n)


def filas(origen):
    if origen.lower().endswith(".csv"):
        with open(origen, encoding="utf-8-sig") as f:
            return list(csv.DictReader(f))
    from pbixray import PBIXRay
    t = PBIXRay(origen).get_table("RED VIAL COMPLETA")
    return t.astype(str).to_dict("records")


def largo_m(g):
    """Largo en metros (aprox. plana, alcanza a escala de ciudad)."""
    kx, ky = math.cos(LAT0) * 111320, 110540
    lines = getattr(g, "geoms", [g])
    tot = 0.0
    for ln in lines:
        c = list(ln.coords)
        tot += sum(math.hypot((c[i][0] - c[i - 1][0]) * kx, (c[i][1] - c[i - 1][1]) * ky) for i in range(1, len(c)))
    return tot


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cuadras = defaultdict(list)
    for r in filas(sys.argv[1]):
        m = MATERIAL.get(str(r["LAYER"]).strip().upper())
        if not m:
            continue
        cuadras[(m, str(r["ID CUADRA"]).strip())].append((int(float(r["vertex_index"])), float(r["LONG X"]), float(r["LAT Y"])))
    feats, lineas = [], []
    for (m, cid), vs in sorted(cuadras.items(), key=lambda kv: (kv[0][0], int(kv[0][1]) if kv[0][1].isdigit() else 0)):
        vs.sort()
        pts = []
        for _, x, y in vs:
            p = [round(x, 5), round(y, 5)]
            if not pts or pts[-1] != p:
                pts.append(p)
        if len(pts) < 2:
            continue
        feats.append({"type": "Feature", "properties": {"m": m, "id": cid}, "geometry": {"type": "LineString", "coordinates": pts}})
        lineas.append((m, LineString(pts)))
    with open(ruta("red-vial.geojson"), "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection",
                   "_ayuda": "Red vial por material (m): P pavimento, C cordón cuneta, R ripio. Generado por scripts/red_vial.py.",
                   "features": feats}, f, ensure_ascii=False, separators=(",", ":"))

    zonas = {}
    for archivo, campo, clave in (("circuitos.geojson", "nombre", None), ("distritos.geojson", "distrito", "Distrito {}")):
        with open(ruta(archivo), encoding="utf-8") as f:
            fc = json.load(f)
        for z in fc["features"]:
            nombre = clave.format(int(z["properties"][campo])) if clave else z["properties"][campo]
            g = shape(z["geometry"]).buffer(0)
            pg = prep(g)
            st = {k: {"km": 0.0, "cuadras": 0} for k in MATERIAL.values()}
            for m, ln in lineas:
                if not pg.intersects(ln):
                    continue
                parte = ln.intersection(g)
                if not parte.is_empty:
                    st[m]["km"] += largo_m(parte) / 1000
                if pg.contains(ln.interpolate(0.5, normalized=True)):
                    st[m]["cuadras"] += 1
            for v in st.values():
                v["km"] = round(v["km"], 2)
            zonas[nombre] = st
    with open(ruta("red-vial-zonas.json"), "w", encoding="utf-8") as f:
        json.dump({"_ayuda": "Km y cuadras de cada material de la red vial (P pavimento, C cordón cuneta, R ripio) en cada circuito y distrito. "
                             "Generado por scripts/red_vial.py.", "zonas": zonas}, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"{len(feats)} cuadras, {len(zonas)} zonas")


if __name__ == "__main__":
    main()
