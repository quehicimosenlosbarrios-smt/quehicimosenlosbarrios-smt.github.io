"""
Cruza los distritos de Presupuesto Participativo con los circuitos electorales
y con los barrios. Se corre a mano solo si cambia alguno de los mapas.

Requiere shapely (pip install shapely).

Genera:
  - data/circuito-distrito.json
      circuitos: para cada circuito, el distrito con el que comparte más
                 superficie y qué % del circuito cae en él (criterio del
                 proyecto ganador que muestra la ficha del circuito), y el
                 reparto completo por distrito (cruce).
      distritos: para cada distrito, los circuitos que caen en él (desde 1%
                 del circuito), con el % del circuito y del distrito, y los
                 electores y escuelas estimados según superficie.
  - data/barrios.geojson: agrega a cada barrio "distritos" (los distritos donde
      cae al menos el 5% del barrio, igual que "circuitos") y, en "etiquetas",
      dónde escribir su nombre cuando el distrito lo corta.
"""
import json
import math
import os

from shapely.geometry import shape

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAT0 = math.radians(-26.83)


def ruta(n):
    return os.path.join(RAIZ, "data", n)


def leer(n):
    with open(ruta(n), encoding="utf-8") as f:
        return json.load(f)


def metros(g):
    """Pasa a metros aproximados (equirectangular): sirve para comparar superficies."""
    from shapely.ops import transform
    return transform(lambda x, y, z=None: (x * math.cos(LAT0) * 111320, y * 110540), g)


def main():
    circ = {f["properties"]["nombre"]: shape(f["geometry"]).buffer(0) for f in leer("circuitos.geojson")["features"]}
    dist = {int(f["properties"]["distrito"]): shape(f["geometry"]).buffer(0) for f in leer("distritos.geojson")["features"]}
    electores = leer("electores.json")["circuitos"]
    cm = {k: metros(g) for k, g in circ.items()}
    dm = {k: metros(g) for k, g in dist.items()}

    circuitos, distritos = {}, {}
    for d in sorted(dist):
        distritos[f"Distrito {d}"] = {"distrito": d, "circuitos": []}
    for c in circ:
        cruce = {}
        for d in sorted(dist):
            i = cm[c].intersection(dm[d]).area
            pc = i / cm[c].area * 100
            if pc < 1:
                continue
            cruce[str(d)] = round(pc)
            parte = circ[c].intersection(dist[d])
            if parte.geom_type in ("MultiPolygon", "GeometryCollection"):
                parte = max((x for x in parte.geoms if x.area > 0), key=lambda x: x.area)
            q = parte.representative_point()
            distritos[f"Distrito {d}"]["circuitos"].append({
                "circuito": c, "del_circuito": round(pc), "del_distrito": round(i / dm[d].area * 100),
                "etiqueta": [round(q.x, 6), round(q.y, 6)], "_p": pc / 100})
        mejor = max(cruce, key=lambda k: cruce[k])
        circuitos[c] = {"distrito": int(mejor), "coincidencia": cruce[mejor], "cruce": cruce}

    for k, v in distritos.items():
        v["circuitos"].sort(key=lambda x: (-x["del_distrito"], x["circuito"]))
        el = es = 0.0
        for x in v["circuitos"]:
            e = electores.get(x["circuito"])
            if e:
                el += e["electores"] * x["_p"]
                es += e["escuelas"] * x["_p"]
            del x["_p"]
        v["electores_estimados"] = round(el)
        v["escuelas_estimadas"] = round(es, 1)

    with open(ruta("circuito-distrito.json"), "w", encoding="utf-8") as f:
        json.dump({
            "_ayuda": "Cruce de los circuitos electorales con los distritos de Presupuesto Participativo (superficie compartida, en %). "
                      "En 'circuitos', 'distrito' es el que más comparte con el circuito. En 'distritos', los electores y escuelas "
                      "son estimados: cada circuito aporta según el % de su superficie dentro del distrito. Generado por scripts/cruce_distritos.py.",
            "circuitos": circuitos,
            "distritos": distritos,
        }, f, ensure_ascii=False, indent=1)
        f.write("\n")

    barrios = leer("barrios.geojson")
    for f in barrios["features"]:
        g = shape(f["geometry"]).buffer(0)
        p = f["properties"]
        p["distritos"] = []
        et = {k: v for k, v in (p.get("etiquetas") or {}).items() if not k.startswith("Distrito ")}
        if g.area == 0:
            p["etiquetas"] = et
            continue
        partes = []
        for d in sorted(dist):
            i = g.intersection(dist[d])
            if i.area / g.area >= 0.05:
                partes.append((d, i))
        if not partes:  # cae en una rendija entre distritos: el más cercano
            d = min(dist, key=lambda k: dist[k].distance(g.representative_point()))
            partes = [(d, g)]
        for d, i in partes:
            p["distritos"].append(f"Distrito {d}")
            if i.area / g.area < 0.95:
                if i.geom_type in ("MultiPolygon", "GeometryCollection"):
                    i = max((x for x in i.geoms if x.area > 0), key=lambda x: x.area)
                q = i.representative_point()
                et[f"Distrito {d}"] = [round(q.x, 6), round(q.y, 6)]
        p["etiquetas"] = et
    with open(ruta("barrios.geojson"), "w", encoding="utf-8") as f:
        json.dump(barrios, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(circuitos)} circuitos, {len(distritos)} distritos, {len(barrios['features'])} barrios")


if __name__ == "__main__":
    main()
