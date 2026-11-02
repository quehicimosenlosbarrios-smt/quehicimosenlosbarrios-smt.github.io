"""
Descarga los proyectos ganadores de Presupuesto Participativo de una edición
y la etapa en que está cada obra.

Fuentes (sitio oficial, datos abiertos):
  - https://presupuestoparticipativo.smt.gob.ar/api/proyectos?edicion=AAAA
    título, barrio, categoría, votos y ubicación de cada proyecto.
  - https://presupuestoparticipativo.smt.gob.ar/transparencia?edicion=AAAA
    etapa de la obra (licitación, adjudicada, en obra, finalizada), la última
    novedad y el enlace a la nota de prensa.

Escribe data/presupuesto-participativo-AAAA.json con un ganador por distrito.
La ficha técnica lo cruza con data/circuito-distrito.json para mostrar en cada
circuito el proyecto del distrito con el que comparte más superficie.

Uso:  python scripts/descargar_presupuesto_participativo.py [edición]
"""
import datetime
import html
import json
import os
import re
import sys
import urllib.request

SITIO = "https://presupuestoparticipativo.smt.gob.ar"
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def bajar(url):
    req = urllib.request.Request(url, headers={"User-Agent": "quehicimosenlosbarrios (ficha tecnica)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8-sig")


def texto(s):
    s = re.sub(r"<!-- -->", "", s)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def etapas(pagina):
    """Etapa de obra de cada ganador, tomada de las tarjetas de la página de transparencia."""
    out = {}
    for art in re.findall(r'<article class="tarjeta-obra"[^>]*>.*?</article>', pagina, re.S):
        m = re.search(r"Distrito (\d+)", texto(art))
        if not m:
            continue
        d = int(m.group(1))
        paso = re.search(r'aria-label="Etapa (\d) de 4: ([^"]+)"', art)
        etiqueta = re.search(r'class="etiqueta-obra">(.*?)</span>', art, re.S)
        fecha = re.search(r"Actualizado el (?:<!-- -->)?([^<]+)<", art)
        novedad = None
        if fecha:
            p = re.search(r"Actualizado el.*?</p>\s*<p[^>]*>(.*?)</p>", art, re.S)
            novedad = texto(p.group(1)) if p else None
        nota = re.search(r'<a href="(https?://[^"]+)"[^>]*>Ver la nota de prensa', art)
        presupuesto = re.search(r"Presupuesto oficial: \$([\d.,]+)", novedad or "")
        out[d] = {
            "etapa": texto(etiqueta.group(1)) if etiqueta else None,
            "paso": int(paso.group(1)) if paso else 0,
            "actualizado": texto(fecha.group(1)) if fecha else None,
            "novedad": novedad,
            "presupuesto_oficial": presupuesto.group(1).rstrip(".,") if presupuesto else None,
            "nota_prensa": html.unescape(nota.group(1)) if nota else None,
        }
    return out


def descripcion(pagina):
    """Secciones de la descripción del proyecto (El problema, La propuesta, Beneficios...), tal como están en su página."""
    out = []
    for titulo, cuerpo in re.findall(r'<section><h2[^>]*>(.*?)</h2><div[^>]*>(.*?)</div></section>', pagina, re.S):
        parrafos = [texto(x) for x in re.findall(r"<p[^>]*>(.*?)</p>", cuerpo, re.S)]
        parrafos = [x for x in parrafos if x]
        if parrafos:
            out.append({"titulo": texto(titulo), "parrafos": parrafos})
    return out


def main():
    edicion = sys.argv[1] if len(sys.argv) > 1 else "2025"
    api = json.loads(bajar(f"{SITIO}/api/proyectos?edicion={edicion}"))
    obras = etapas(bajar(f"{SITIO}/transparencia?edicion={edicion}"))
    ganadores = {}
    for p in api["proyectos"]:
        if not p.get("ganador"):
            continue
        d = int(p["distrito"])
        o = obras.get(d, {})
        ganadores[str(d)] = {
            "distrito": d,
            "titulo": p["titulo"].strip(),
            "barrio": p.get("barrio"),
            "categoria": p.get("categoria"),
            "votos": p.get("votos") or None,
            "lat": p.get("lat"),
            "lon": p.get("lon"),
            "ubicacion_aproximada": bool(p.get("ubicacion_aproximada")),
            "url": SITIO + p["url"] if p.get("url") else None,
            "descripcion": descripcion(bajar(SITIO + p["url"])) if p.get("url") else [],
            "etapa": o.get("etapa") or "Sin información todavía",
            "paso": o.get("paso", 0),
            "actualizado": o.get("actualizado"),
            "novedad": o.get("novedad"),
            "presupuesto_oficial": o.get("presupuesto_oficial"),
            "nota_prensa": o.get("nota_prensa"),
        }
    if len(ganadores) < 1:
        sys.exit("No se encontraron proyectos ganadores; no se modifica el archivo.")
    salida = {
        "_ayuda": "Proyectos ganadores de Presupuesto Participativo, uno por distrito. Generado por scripts/descargar_presupuesto_participativo.py.",
        "edicion": int(edicion),
        "fuente": f"{SITIO}/transparencia?edicion={edicion}",
        "descargado": datetime.date.today().isoformat(),
        "ganadores": dict(sorted(ganadores.items(), key=lambda kv: int(kv[0]))),
    }
    ruta = os.path.join(RAIZ, "data", f"presupuesto-participativo-{edicion}.json")
    previo = None
    if os.path.exists(ruta):
        with open(ruta, encoding="utf-8") as f:
            previo = json.load(f)
    # si no cambió nada más que la fecha de descarga, no se reescribe (evita commits vacíos)
    if previo and {**previo, "descargado": None} == {**salida, "descargado": None}:
        print("Sin cambios en Presupuesto Participativo.")
        return
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"{len(ganadores)} ganadores guardados en {os.path.relpath(ruta, RAIZ)}")


if __name__ == "__main__":
    main()
