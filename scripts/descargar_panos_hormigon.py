"""
Descarga los paños de hormigón realizados desde la planilla de Google
"Georreferencia Paños Hormigón" (pestaña "unificado") y escribe
data/panos-hormigon.csv con las mismas columnas que data/intervenciones.csv,
más la columna m2 (superficie de hormigón de cada registro).

La app la suma a las intervenciones de GeoGestión como "Paños de hormigón".
Para que la descarga funcione, la planilla tiene que estar compartida como
"Cualquier persona con el enlace: Lector". Si no se puede descargar, el
archivo anterior queda como está.

Uso:
  python scripts/descargar_panos_hormigon.py               (descarga de Google)
  python scripts/descargar_panos_hormigon.py planilla.xlsx (desde una copia local)
"""
import csv
import io
import os
import sys
import urllib.parse
import urllib.request

PLANILLA = os.environ.get("PANOS_PLANILLA", "1L2Gme_NVRfx2HgLPIQwEROwlOCgHZpPQSfy5MZI_Hc0")
PESTANA = os.environ.get("PANOS_PESTANA", "unificado")
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, "data", "panos-hormigon.csv")
NOMBRE = "Paños de hormigón"
COLUMNAS = ["intervencion", "programa", "indicador", "ambito", "estado", "tipo", "verificado", "direccion", "barrio",
            "latitud", "longitud", "id_cuadra", "id_geogestion", "fecha_verificado", "foto", "m2"]


def filas_google():
    url = ("https://docs.google.com/spreadsheets/d/" + PLANILLA + "/gviz/tq?tqx=out:csv&sheet=" + urllib.parse.quote(PESTANA))
    req = urllib.request.Request(url, headers={"User-Agent": "quehicimosenlosbarrios (ficha tecnica)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        tipo = r.headers.get("Content-Type", "")
        txt = r.read().decode("utf-8-sig")
    # si la planilla no está compartida, Google devuelve la página de inicio de sesión
    if "text/csv" not in tipo or txt.lstrip().startswith("<"):
        raise RuntimeError("la planilla no está compartida con enlace (Google no devolvió un CSV)")
    return list(csv.DictReader(io.StringIO(txt)))


def filas_xlsx(ruta):
    import openpyxl
    ws = openpyxl.load_workbook(ruta, read_only=True, data_only=True)[PESTANA]
    filas = list(ws.iter_rows(values_only=True))
    cab = [str(c or "").strip() for c in filas[0]]
    return [dict(zip(cab, f)) for f in filas[1:]]


def campo(f, *nombres):
    claves = {k.strip().lower(): k for k in f if k}
    for n in nombres:
        k = claves.get(n.lower())
        if k is not None and f[k] not in (None, ""):
            return f[k]
    return ""


def numero(v):
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v or "").strip()
    if not s:
        return None
    # "1.234,5" o "1234,5" (Google en castellano) y "1234.5"
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def convertir(filas):
    out, sin_lugar = [], 0
    for f in filas:
        if not any(v not in (None, "") for v in f.values()):
            continue  # filas vacías al final de la pestaña
        lat, lon = numero(campo(f, "Latitud")), numero(campo(f, "Longitud"))
        if lat is None or lon is None:
            sin_lugar += 1
            continue
        calle = str(campo(f, "Direccion normalizada", "CALLE")).strip()
        entre = str(campo(f, "ENTRE CALLES")).strip()
        m2 = numero(campo(f, "N° PAÑOS", "N° PANOS"))
        out.append({
            "intervencion": NOMBRE, "programa": NOMBRE, "indicador": NOMBRE,
            "direccion": calle + (" (entre " + entre + ")" if entre and entre.lower() != "none" else ""),
            "barrio": str(campo(f, "Barrio")).strip(),
            "latitud": round(lat, 6), "longitud": round(lon, 6),
            "id_geogestion": str(campo(f, "Id-paño", "Id-pano")).strip(),
            "m2": "" if m2 is None else round(m2, 2),
        })
    return out, sin_lugar


def main():
    try:
        filas = filas_xlsx(sys.argv[1]) if len(sys.argv) > 1 else filas_google()
    except Exception as e:
        print("No se pudo leer la planilla de paños de hormigón:", e, "- se mantiene", SALIDA)
        return
    out, sin_lugar = convertir(filas)
    if not out:
        print("La planilla no trajo paños con coordenadas: se mantiene", SALIDA)
        return
    with open(SALIDA, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNAS)
        w.writeheader()
        for r in out:
            w.writerow({k: r.get(k, "") for k in COLUMNAS})
    m2 = sum(r["m2"] or 0 for r in out)
    print(f"{len(out)} registros de paños de hormigón ({m2:,.0f} m²); {sin_lugar} filas sin coordenadas quedaron afuera")


if __name__ == "__main__":
    main()
