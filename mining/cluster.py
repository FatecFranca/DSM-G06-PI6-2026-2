from pathlib import Path
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

PASTA = Path(__file__).resolve().parent
df = pd.read_csv(PASTA / "data" / "instituicoes_tratadas.csv")
if len(df) < 4:
    raise ValueError("Precisa de pelo menos quatro instituicoes validas")
X = StandardScaler().fit_transform(df[["latitude", "longitude"]])
modelo = KMeans(n_clusters=3, random_state=42, n_init=10)
df["cluster"] = modelo.fit_predict(X)
grupos = int(df["cluster"].nunique())
if grupos != 3:
    raise ValueError("A base nao gerou tres grupos distintos")
resumo = {
    "tecnica": "K-Means preliminar por localizacao",
    "k": 3, "registros": len(df),
    "silhouette": float(silhouette_score(X, df["cluster"])),
    "por_grupo": {str(k): int(v) for k, v in df["cluster"].value_counts().items()},
}
saida = PASTA / "outputs"
saida.mkdir(exist_ok=True)
df.to_csv(saida / "instituicoes_clusters.csv", index=False)
(saida / "resumo.json").write_text(
    json.dumps(resumo, indent=2, ensure_ascii=False), encoding="utf-8")
plt.scatter(df["longitude"], df["latitude"], c=df["cluster"], s=8, cmap="viridis")
plt.xlabel("Longitude"); plt.ylabel("Latitude")
plt.title("Give Food: grupos preliminares de instituicoes")
plt.tight_layout(); plt.savefig(saida / "clusters.png", dpi=160); plt.close()
print(json.dumps(resumo, indent=2, ensure_ascii=False))
