"""
Descarga las intervenciones de GeoGestión y las guarda en data/intervenciones.csv
con el formato que lee la app.

Usa solo la biblioteca estándar de Python. El usuario y la contraseña se leen de
las variables de entorno GEOGESTION_CUIL y GEOGESTION_PASSWORD (secretos del repo).

  GEOGESTION_CUIL=... GEOGESTION_PASSWORD=... python scripts/descargar_geogestion.py
"""
import csv
import http.cookiejar
import io
import json
import os
import re
import sys
import urllib.request

BASE = os.environ.get("GEOGESTION_URL", "https://smtendatos.gob.ar/apps/GeoGestion").rstrip("/")
SALIDA = os.environ.get("SALIDA", "data/intervenciones.csv")

# Valores de verificado_id que no se publican (2 = Rechazado)
EXCLUIR_VERIFICADO = {"2"}

COLUMNAS = ["intervencion", "indicador", "ambito", "estado", "verificado", "direccion",
            "barrio", "latitud", "longitud", "id_cuadra", "id_geogestion", "fecha_verificado"]

jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
opener.addheaders = [("User-Agent", "quehicimosenlosbarrios-sync/1.0")]


def pedir(ruta, datos=None, csrf=""):
    headers = {"Content-Type": "application/json", "X-CSRF-Token": csrf}
    cuerpo = json.dumps(datos).encode() if datos is not None else None
    req = urllib.request.Request(BASE + "/" + ruta, data=cuerpo, headers=headers,
                                 method="POST" if cuerpo else "GET")
    try:
        with opener.open(req, timeout=120) as r:
            return r.status, r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def catalogo(js, nombre, clave, valor):
    """Lee un array 'const NOMBRE = [...]' de data/catalogos.js como {id: texto}.
    Si el nombre está repetido (pasa con VERIFICADOS) vale el último, como en el navegador."""
    m = re.findall(r"const\s+" + nombre + r"\s*=\s*(\[.*?\]);", js, re.S)
    if not m:
        return {}
    return {str(x.get(clave)): str(x.get(valor, "")).strip() for x in json.loads(m[-1])}


def coord(v):
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return None


def main():
    cuil, clave = os.environ.get("GEOGESTION_CUIL"), os.environ.get("GEOGESTION_PASSWORD")
    if not cuil or not clave:
        sys.exit("Faltan los secretos GEOGESTION_CUIL y GEOGESTION_PASSWORD.")

    _, me = pedir("api/auth.php?action=me")
    csrf = json.loads(me).get("csrf_token", "")
    estado, texto = pedir("api/auth.php?action=login", {"cuil": cuil, "password": clave}, csrf)
    login = json.loads(texto) if texto.strip().startswith("{") else {}
    if estado != 200 or not login.get("success"):
        sys.exit("No se pudo iniciar sesión en GeoGestión (HTTP %s): %s" % (estado, login.get("error", "")))
    csrf = login.get("csrf_token") or csrf

    estado, texto = pedir("api/features.php?action=list", csrf=csrf)
    if estado != 200:
        sys.exit("GeoGestión no devolvió los datos (HTTP %s)." % estado)
    datos = json.loads(texto)

    _, cat = pedir("data/catalogos.js")
    programas = catalogo(cat, "PROGRAMAS", "programa_geo_id", "programa_geo_det")
    indicadores = catalogo(cat, "INDICADORES", "indicador_geo_id", "indicador_geo_det")
    ambitos = catalogo(cat, "AMBITOS", "ambito_id", "ambito_det")
    verificados = catalogo(cat, "VERIFICADOS", "verificado_id", "estado")
    # ESTADOS repite estado_id por indicador; el nombre es el mismo para cada id
    estados = catalogo(cat, "ESTADOS", "estado_id", "estado_indicador")

    def base(x):
        return {
            "intervencion": programas.get(str(x.get("programa_geo_id")), ""),
            "indicador": indicadores.get(str(x.get("indicador_geo_id")), ""),
            "ambito": ambitos.get(str(x.get("ambito_id")), ""),
            "estado": estados.get(str(x.get("estado_id")), ""),
            "verificado": verificados.get(str(x.get("verificado_id") or 0), ""),
            "fecha_verificado": x.get("fecha_verificado") or "",
        }

    filas, descartadas = [], 0

    for p in datos.get("puntos") or []:
        if str(p.get("tipo_punto_id")) != "1" or str(p.get("verificado_id")) in EXCLUIR_VERIFICADO:
            continue
        lat, lng = coord(p.get("latitud")), coord(p.get("longitud"))
        if lat is None or lng is None:
            descartadas += 1
            continue
        filas.append(dict(base(p), direccion=" ".join(filter(None, [str(p.get("dirección") or p.get("direccion") or "").strip(), str(p.get("numeracion") or "").strip()])),
                          barrio=p.get("barrio_nombre") or "", latitud=lat, longitud=lng,
                          id_cuadra="", id_geogestion=p.get("orden_punto") or p.get("id_punto") or ""))

    for l in datos.get("lineas") or []:
        if str(l.get("verificado_id")) in EXCLUIR_VERIFICADO:
            continue
        vertices = [v for v in (l.get("vertices") or []) if coord(v.get("latitud")) is not None and coord(v.get("longitud")) is not None]
        if len(vertices) < 2:
            descartadas += 1
            continue
        for v in vertices:
            filas.append(dict(base(l), direccion=str(v.get("direccion") or l.get("dirección") or l.get("direccion") or "").strip(),
                              barrio=v.get("barrio_nombre") or l.get("barrio_nombre") or "",
                              latitud=coord(v.get("latitud")), longitud=coord(v.get("longitud")),
                              id_cuadra="L-%s" % l.get("id_punto"), id_geogestion=l.get("id_punto") or ""))

    # Si GeoGestión viene vacío no se pisa el archivo anterior
    if not filas:
        sys.exit("La descarga no trajo ninguna intervención; no se modifica %s." % SALIDA)

    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=COLUMNAS, lineterminator="\n")
    w.writeheader()
    w.writerows(filas)
    os.makedirs(os.path.dirname(SALIDA) or ".", exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8", newline="") as f:
        f.write(buf.getvalue())

    lineas = len({f["id_cuadra"] for f in filas if f["id_cuadra"]})
    print("Guardadas %d filas (%d tramos de línea) en %s; %d sin coordenadas." % (len(filas), lineas, SALIDA, descartadas))


if __name__ == "__main__":
    main()
