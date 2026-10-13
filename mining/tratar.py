from pathlib import Path
import hashlib
import json
import pandas as pd

PASTA = Path(__file__).resolve().parent
FONTE = PASTA.parent / "givefoodbasededados.json"
saida = PASTA / "data"
saida.mkdir(exist_ok=True)
df = pd.json_normalize(json.loads(FONTE.read_text(encoding="utf-8")))
total = len(df)
df = df.drop_duplicates(subset="id").copy()
duplicados = total - len(df)
coordenadas = df["lat_lng"].str.split(",", n=1, expand=True)
df["latitude"] = pd.to_numeric(coordenadas[0], errors="coerce")
df["longitude"] = pd.to_numeric(coordenadas[1], errors="coerce")
df["name"] = df["name"].fillna("").str.strip()
validas = (df["closed"].eq(False) & df["name"].ne("")
    & df["latitude"].between(-90, 90)
    & df["longitude"].between(-180, 180))
limpo = df.loc[validas, ["id", "name", "country", "latitude", "longitude"]]
limpo.to_csv(saida / "instituicoes_tratadas.csv", index=False)
relatorio = {
    "fonte": "givefoodbasededados.json (snapshot existente no repositorio)",
    "origem": "https://www.givefood.org.uk/api/2/foodbanks/",
    "sha256": hashlib.sha256(FONTE.read_bytes()).hexdigest(),
    "registros_brutos": total,
    "duplicados_por_id": duplicados,
    "inativos_ou_invalidos": len(df) - len(limpo),
    "registros_tratados": len(limpo),
}
outputs = PASTA / "outputs"
outputs.mkdir(exist_ok=True)
(outputs / "tratamento.json").write_text(
    json.dumps(relatorio, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(relatorio, indent=2, ensure_ascii=False))
