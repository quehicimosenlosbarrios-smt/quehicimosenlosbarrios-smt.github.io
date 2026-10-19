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
import unicodedata
import urllib.request

BASE = os.environ.get("GEOGESTION_URL", "https://smtendatos.gob.ar/apps/GeoGestion").rstrip("/")
SALIDA = os.environ.get("SALIDA", "data/intervenciones.csv")
FILTRO = os.environ.get("FILTRO", "data/filtro-intervenciones.json")

# Valores de verificado_id que no se publican (2 = Rechazado)
EXCLUIR_VERIFICADO = {"2"}

COLUMNAS = ["intervencion", "programa", "indicador", "ambito", "estado", "tipo", "verificado", "direccion",
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


def norm(t):
    t = unicodedata.normalize("NFD", str(t or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", t).strip()


def cargar_reglas():
    with open(FILTRO, encoding="utf-8") as f:
        reglas = json.load(f)["reglas"]
    for r in reglas:
        r["_p"] = norm(r["programa"])
        for k in ("indicadores", "estados", "tipos"):
            r["_" + k] = {norm(x) for x in r.get(k) or []}
    return reglas


def clasificar(fila, reglas):
    """Nombre con el que se muestra el registro, o None si no entra en ninguna regla."""
    for r in reglas:
        if norm(fila["programa"]) != r["_p"]:
            continue
        if r["_indicadores"] and norm(fila["indicador"]) not in r["_indicadores"]:
            continue
        if r["_estados"] and norm(fila["estado"]) not in r["_estados"]:
            continue
        if r["_tipos"] and norm(fila["tipo"]) not in r["_tipos"]:
            continue
        return r["mostrar_como"]
    return None


def coord(v, limite=180):
    """Número de una coordenada; None si falta, es 0 o está fuera de rango."""
    try:
        n = float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return None
    return n if n and abs(n) <= limite else None


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

    # Catálogos: los vivos de la API (los mismos que usa el validador) mandan;
    # data/catalogos.js completa lo que falte
    try:
        estado, texto = pedir("api/selectors.php?action=all", csrf=csrf)
        vivos = json.loads(texto) if estado == 200 and texto.strip().startswith("{") else {}
    except (OSError, ValueError):
        vivos = {}
    _, cat = pedir("data/catalogos.js")

    def tabla(clave_api, nombre_js, clave, valor):
        filas_api = vivos.get(clave_api) or []
        m = {str(x.get(clave)): str(x.get(valor) or "").strip() for x in filas_api if isinstance(x, dict) and x.get(clave) is not None}
        return dict(catalogo(cat, nombre_js, clave, valor), **m)

    programas = tabla("programas", "PROGRAMAS", "programa_geo_id", "programa_geo_det")
    indicadores = tabla("indicadores", "INDICADORES", "indicador_geo_id", "indicador_geo_det")
    ambitos = tabla("ambitos", "AMBITOS", "ambito_id", "ambito_det")
    verificados = tabla("verificados", "VERIFICADOS", "verificado_id", "estado")
    # ESTADOS repite estado_id por indicador; el nombre es el mismo para cada id
    estados = tabla("estados", "ESTADOS", "estado_id", "estado_indicador")
    tipos = tabla("tipos", "TIPOS", "tipo_id", "tipo_indicador")
    print("Catálogos %s: %d programas, %d indicadores." % ("de la API" if vivos else "de catalogos.js", len(programas), len(indicadores)))

    def texto_de(x, mapa, *claves):
        """Usa el texto si el registro ya lo trae (…_det); si no, traduce el id con el catálogo."""
        for k in claves:
            v = x.get(k)
            if v in (None, ""):
                continue
            v = str(v).strip()
            # GeoGestión a veces guarda el id y a veces directamente el nombre (igual que lo trata el validador)
            if re.fullmatch(r"\d+(\.0+)?", v):
                v = mapa.get(v.split(".")[0], "")
            if v:
                return v
        return ""

    reglas = cargar_reglas()

    def base(x):
        fila = {
            "programa": texto_de(x, programas, "programa_geo_det", "programa_det", "programa", "programa_geo_id", "programa_id"),
            "indicador": texto_de(x, indicadores, "indicador_geo_det", "indicador_det", "indicador", "indicador_geo_id", "indicador_id"),
            "ambito": texto_de(x, ambitos, "ambito_det", "ambito", "ambito_id"),
            "estado": texto_de(x, estados, "estado_indicador", "estado_det", "estado_id", "estado_geo_id"),
            "tipo": texto_de(x, tipos, "tipo_indicador", "tipo_det", "tipo_id"),
            "verificado": verificados.get(str(x.get("verificado_id") or 0), ""),
            "fecha_verificado": x.get("fecha_verificado") or "",
        }
        fila["intervencion"] = clasificar(fila, reglas)
        return fila

    filas, descartadas, sin_programa, fuera_de_filtro = [], 0, 0, 0

    def entra(x):
        """Registro no rechazado y dentro de data/filtro-intervenciones.json."""
        nonlocal sin_programa, fuera_de_filtro
        if str(x.get("verificado_id")) in EXCLUIR_VERIFICADO:
            return None
        b = base(x)
        if not b["programa"]:
            sin_programa += 1
        if not b["intervencion"]:
            fuera_de_filtro += 1
            return None
        return b

    for p in datos.get("puntos") or []:
        if str(p.get("tipo_punto_id")) != "1":
            continue
        b = entra(p)
        if b is None:
            continue
        lat, lng = coord(p.get("latitud"), 90), coord(p.get("longitud"))
        if lat is None or lng is None:
            descartadas += 1
            continue
        filas.append(dict(b, direccion=" ".join(filter(None, [str(p.get("dirección") or p.get("direccion") or "").strip(), str(p.get("numeracion") or "").strip()])),
                          barrio=p.get("barrio_nombre") or "", latitud=lat, longitud=lng,
                          id_cuadra="", id_geogestion=p.get("orden_punto") or p.get("id_punto") or ""))

    for l in datos.get("lineas") or []:
        b = entra(l)
        if b is None:
            continue
        vertices = [v for v in (l.get("vertices") or []) if coord(v.get("latitud"), 90) is not None and coord(v.get("longitud")) is not None]
        if len(vertices) < 2:
            descartadas += 1
            continue
        for v in vertices:
            filas.append(dict(b, direccion=str(v.get("direccion") or l.get("dirección") or l.get("direccion") or "").strip(),
                              barrio=v.get("barrio_nombre") or l.get("barrio_nombre") or "",
                              latitud=coord(v.get("latitud")), longitud=coord(v.get("longitud")),
                              id_cuadra="L-%s" % l.get("id_punto"), id_geogestion=l.get("id_punto") or ""))

    regs = (datos.get("puntos") or []) + (datos.get("lineas") or [])
    if sin_programa:
        # solo nombres de campos, sin valores, para poder ajustar el mapeo
        print("Campos de un registro de GeoGestión: " + ", ".join(sorted((regs or [{}])[0].keys())))
        print("Catálogos de la API: " + ", ".join(sorted(vivos.keys())))
        for k in ("programa_geo_id", "indicador_geo_id", "ambito_id", "estado_id", "tipo_id"):
            vals = [str(x.get(k) if x.get(k) is not None else "").strip() for x in regs]
            print("%s: %d vacíos, %d numéricos, %d con texto" % (k, sum(1 for v in vals if not v), sum(1 for v in vals if v.replace(".", "").isdigit()), sum(1 for v in vals if v and not v.replace(".", "").isdigit())))
    if regs and sin_programa == len(regs):
        sys.exit("Ningún registro tiene programa reconocible; no se modifica %s." % SALIDA)
    # Si no queda nada para publicar no se pisa el archivo anterior
    if not filas:
        sys.exit("Ningún registro coincide con %s; no se modifica %s." % (FILTRO, SALIDA))

    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=COLUMNAS, lineterminator="\n")
    w.writeheader()
    w.writerows(filas)
    os.makedirs(os.path.dirname(SALIDA) or ".", exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8", newline="") as f:
        f.write(buf.getvalue())

    lineas = len({f["id_cuadra"] for f in filas if f["id_cuadra"]})
    print("Guardadas %d filas (%d tramos de línea) en %s; %d sin coordenadas válidas; %d registros fuera del filtro." % (len(filas), lineas, SALIDA, descartadas, fuera_de_filtro))
    por_tipo = {}
    for f in filas:
        clave = f["id_cuadra"] or id(f)
        por_tipo.setdefault(f["intervencion"], set()).add(clave)
    for k in sorted(por_tipo):
        print("  %s: %d" % (k, len(por_tipo[k])))


if __name__ == "__main__":
    main()
