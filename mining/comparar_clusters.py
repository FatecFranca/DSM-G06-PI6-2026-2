from pathlib import Path
import json
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.preprocessing import StandardScaler

# Define o caminho base da pasta de mineração
PASTA = Path(__file__).resolve().parent

# Carrega a base de dados tratada gerada anteriormente
df = pd.read_csv(PASTA / "data" / "instituicoes_tratadas.csv")

# Prepara e padroniza as features geográficas (latitude e longitude)
X = StandardScaler().fit_transform(df[["latitude", "longitude"]])

if len(X) < 7:
    raise ValueError("A comparacao k=2..6 precisa de pelo menos 7 registros")

resultados = []

# Loop para testar diferentes quantidades de clusters (k de 2 a 6)
for k in range(2, 7):
    modelo = KMeans(n_clusters=k, random_state=42, n_init=10)
    grupos = modelo.fit_predict(X)
    
    if len(set(grupos)) != k:
        raise ValueError(f"Nao foram formados {k} grupos distintos")
    
    # Coleta as métricas de avaliação para cada k
    resultados.append({
        "k": k,
        "silhueta": float(silhouette_score(X, grupos)),
        "davies_bouldin": float(davies_bouldin_score(X, grupos)),
        "inercia": float(modelo.inertia_),
        "tamanhos": {str(i): int((grupos == i).sum()) for i in range(k)},
    })

# Cria a pasta de saída final se não existir
saida = PASTA / "outputs" / "final"
saida.mkdir(parents=True, exist_ok=True)

# Salva os resultados em formato JSON estruturado
(saida / "comparacao_clusters.json").write_text(
    json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8"
)

# Imprime o resumo em formato de tabela no terminal para conferência
print(pd.DataFrame(resultados).drop(columns="tamanhos").to_string(index=False))