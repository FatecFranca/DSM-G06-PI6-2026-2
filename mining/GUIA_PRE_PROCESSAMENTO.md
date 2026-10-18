# Guia dos códigos da entrega de pré-processamento

Material de estudo para Ana Júlia, Lauane e Pedro. As linhas vazias apenas separam os trechos.

## Executar na raiz do projeto

```powershell
.\.venv\Scripts\python.exe mining/tratar.py
.\.venv\Scripts\python.exe mining/cluster.py
```

## Ideias principais

Uma linha da base representa uma instituição. `tratar.py` prepara os cadastros. `cluster.py` usa as coordenadas para encontrar três grupos. O PostgreSQL guarda os dados operacionais do aplicativo e não é necessário para executar esta análise.

## tratar.py

### Linha 1

```python
from pathlib import Path
```

Importa Path para montar caminhos de arquivos.

### Linha 2

```python
import hashlib
```

Importa o cálculo da assinatura do arquivo.

### Linha 3

```python
import json
```

Importa a leitura e a escrita de JSON.

### Linha 4

```python
import pandas as pd
```

Importa pandas como pd para trabalhar com a tabela.

### Linha 6

```python
PASTA = Path(__file__).resolve().parent
```

Localiza a pasta mining, onde o próprio script está salvo.

### Linha 7

```python
FONTE = PASTA.parent / "givefoodbasededados.json"
```

Procura o JSON na pasta acima de mining, que é a raiz do projeto.

### Linha 8

```python
saida = PASTA / "data"
```

Define a pasta data para receber o CSV tratado.

### Linha 9

```python
saida.mkdir(exist_ok=True)
```

Cria essa pasta se ela ainda não existir.

### Linha 10

```python
df = pd.json_normalize(json.loads(FONTE.read_text(encoding="utf-8")))
```

Lê o texto em UTF-8, converte o JSON para objetos Python e abre os objetos aninhados em colunas.

### Linha 11

```python
total = len(df)
```

Guarda a quantidade original de registros: 1.023.

### Linha 12

```python
df = df.drop_duplicates(subset="id").copy()
```

Remove eventuais repetições do id e cria uma cópia da tabela.

### Linha 13

```python
duplicados = total - len(df)
```

Calcula quantas linhas foram retiradas por repetição de id. Aqui são zero.

### Linha 14

```python
coordenadas = df["lat_lng"].str.split(",", n=1, expand=True)
```

Separa o texto lat_lng na primeira vírgula, criando duas colunas.

### Linha 15

```python
df["latitude"] = pd.to_numeric(coordenadas[0], errors="coerce")
```

Converte a primeira parte em latitude. Um texto inválido vira NaN, um valor ausente.

### Linha 16

```python
df["longitude"] = pd.to_numeric(coordenadas[1], errors="coerce")
```

Converte a segunda parte em longitude, com a mesma regra para textos inválidos.

### Linha 17

```python
df["name"] = df["name"].fillna("").str.strip()
```

Substitui nome ausente por texto vazio e tira espaços das pontas do nome.

### Linha 18

```python
validas = (df["closed"].eq(False) & df["name"].ne("")
```

Começa o filtro: o cadastro precisa estar aberto e ter nome preenchido. eq(False) compara a situação; ne compara se o nome é diferente de vazio.

### Linha 19

```python
    & df["latitude"].between(-90, 90)
```

Acrescenta a regra de latitude entre -90 e 90. O símbolo & significa que todas as condições precisam valer.

### Linha 20

```python
    & df["longitude"].between(-180, 180))
```

Acrescenta a regra de longitude entre -180 e 180 e fecha o filtro. Coordenadas ausentes não passam nesses testes.

### Linha 21

```python
limpo = df.loc[validas, ["id", "name", "country", "latitude", "longitude"]]
```

Mantém as linhas aprovadas e seleciona as cinco colunas da entrega.

### Linha 22

```python
limpo.to_csv(saida / "instituicoes_tratadas.csv", index=False)
```

Grava instituicoes_tratadas.csv sem acrescentar o índice do pandas.

### Linha 23

```python
relatorio = {
```

Abre o dicionário que reunirá as evidências do tratamento.

### Linha 24

```python
    "fonte": "givefoodbasededados.json (snapshot existente no repositorio)",
```

Identifica o arquivo usado como cópia da fonte.

### Linha 25

```python
    "origem": "https://www.givefood.org.uk/api/2/foodbanks/",
```

Registra o endereço público de origem da base.

### Linha 26

```python
    "sha256": hashlib.sha256(FONTE.read_bytes()).hexdigest(),
```

Calcula SHA-256 a partir dos bytes do JSON. É uma identificação da cópia, não uma anonimização dos dados.

### Linha 27

```python
    "registros_brutos": total,
```

Registra a quantidade bruta.

### Linha 28

```python
    "duplicados_por_id": duplicados,
```

Registra as repetições de id removidas.

### Linha 29

```python
    "inativos_ou_invalidos": len(df) - len(limpo),
```

Registra quantos cadastros, depois da remoção de duplicados, falharam no filtro.

### Linha 30

```python
    "registros_tratados": len(limpo),
```

Registra quantas instituições ficaram no CSV tratado.

### Linha 31

```python
}
```

Fecha o dicionário do relatório.

### Linha 32

```python
outputs = PASTA / "outputs"
```

Define a pasta outputs para os resumos e gráficos.

### Linha 33

```python
outputs.mkdir(exist_ok=True)
```

Cria outputs se necessário.

### Linha 34

```python
(outputs / "tratamento.json").write_text(
```

Começa a gravação do resumo em tratamento.json.

### Linha 35

```python
    json.dumps(relatorio, indent=2, ensure_ascii=False), encoding="utf-8")
```

Converte o dicionário em JSON legível, preserva acentos e escreve em UTF-8.

### Linha 36

```python
print(json.dumps(relatorio, indent=2, ensure_ascii=False))
```

Mostra o mesmo resumo no terminal para conferência.

## cluster.py

### Linha 1

```python
from pathlib import Path
```

Importa Path para localizar os arquivos.

### Linha 2

```python
import json
```

Importa o formato JSON.

### Linha 3

```python
import matplotlib
```

Importa a configuração do matplotlib.

### Linha 4

```python
matplotlib.use("Agg")
```

Usa Agg para gravar o gráfico em arquivo sem abrir uma janela.

### Linha 5

```python
import matplotlib.pyplot as plt
```

Importa as funções de desenho com o apelido plt.

### Linha 6

```python
import pandas as pd
```

Importa pandas para ler o CSV.

### Linha 7

```python
from sklearn.cluster import KMeans
```

Importa K-Means, o algoritmo de agrupamento.

### Linha 8

```python
from sklearn.metrics import silhouette_score
```

Importa a silhueta, que mede a separação dos grupos.

### Linha 9

```python
from sklearn.preprocessing import StandardScaler
```

Importa StandardScaler para padronizar as coordenadas.

### Linha 11

```python
PASTA = Path(__file__).resolve().parent
```

Localiza a pasta mining.

### Linha 12

```python
df = pd.read_csv(PASTA / "data" / "instituicoes_tratadas.csv")
```

Lê o CSV produzido por tratar.py. Esse arquivo precisa existir antes.

### Linha 13

```python
if len(df) < 4:
```

Verifica se há pelo menos quatro instituições.

### Linha 14

```python
    raise ValueError("Precisa de pelo menos quatro instituicoes validas")
```

Interrompe com uma mensagem se a quantidade for insuficiente.

### Linha 15

```python
X = StandardScaler().fit_transform(df[["latitude", "longitude"]])
```

Seleciona latitude e longitude, calcula média e desvio de cada coluna e transforma os valores para a escala padronizada.

### Linha 16

```python
modelo = KMeans(n_clusters=3, random_state=42, n_init=10)
```

Configura três grupos, semente 42 e dez inicializações do K-Means.

### Linha 17

```python
df["cluster"] = modelo.fit_predict(X)
```

Ajusta o algoritmo e grava o número do grupo de cada instituição na coluna cluster.

### Linha 18

```python
grupos = int(df["cluster"].nunique())
```

Conta quantos grupos distintos apareceram.

### Linha 19

```python
if grupos != 3:
```

Verifica se o resultado contém os três grupos previstos.

### Linha 20

```python
    raise ValueError("A base nao gerou tres grupos distintos")
```

Interrompe se essa condição não for atendida.

### Linha 21

```python
resumo = {
```

Abre o dicionário de resultados.

### Linha 22

```python
    "tecnica": "K-Means preliminar por localizacao",
```

Identifica a técnica aplicada.

### Linha 23

```python
    "k": 3, "registros": len(df),
```

Registra k igual a três e a quantidade de instituições.

### Linha 24

```python
    "silhouette": float(silhouette_score(X, df["cluster"])),
```

Calcula a silhueta no mesmo espaço padronizado usado pelo K-Means. Não é porcentagem de acerto.

### Linha 25

```python
    "por_grupo": {str(k): int(v) for k, v in df["cluster"].value_counts().items()},
```

Conta os cadastros de cada cluster e converte os tipos para poder salvar no JSON.

### Linha 26

```python
}
```

Fecha o dicionário.

### Linha 27

```python
saida = PASTA / "outputs"
```

Define a pasta de resultados.

### Linha 28

```python
saida.mkdir(exist_ok=True)
```

Cria essa pasta se necessário.

### Linha 29

```python
df.to_csv(saida / "instituicoes_clusters.csv", index=False)
```

Salva o CSV com as cinco colunas tratadas e a coluna cluster.

### Linha 30

```python
(saida / "resumo.json").write_text(
```

Começa a gravação do resumo dos grupos.

### Linha 31

```python
    json.dumps(resumo, indent=2, ensure_ascii=False), encoding="utf-8")
```

Escreve o dicionário como JSON em UTF-8.

### Linha 32

```python
plt.scatter(df["longitude"], df["latitude"], c=df["cluster"], s=8, cmap="viridis")
```

Desenha os pontos nas coordenadas originais. A cor identifica o cluster e não indica prioridade.

### Linha 33

```python
plt.xlabel("Longitude"); plt.ylabel("Latitude")
```

Coloca os nomes dos eixos. O ponto e vírgula separa dois comandos nessa linha.

### Linha 34

```python
plt.title("Give Food: grupos preliminares de instituicoes")
```

Define o título da figura.

### Linha 35

```python
plt.tight_layout(); plt.savefig(saida / "clusters.png", dpi=160); plt.close()
```

Ajusta as margens, salva clusters.png e fecha a figura. Há três comandos nessa linha.

### Linha 36

```python
print(json.dumps(resumo, indent=2, ensure_ascii=False))
```

Imprime o resumo no terminal.

## Perguntas para a apresentação

1. Por que nenhuma linha foi removida? Os 1.023 cadastros passaram nas regras verificadas. Mesmo assim, houve conversão, seleção e organização dos dados.
2. O que significa `errors="coerce"`? Valores que não podem virar número são tratados como ausentes.
3. O que entra no K-Means? Apenas latitude e longitude padronizadas.
4. Por que usar `random_state=42`? Para fixar a semente da inicialização. O número 42 é uma escolha fixa, não uma configuração de prioridade.
5. O que significa `n_init=10`? São dez inicializações; a solução é escolhida pela menor inércia.
6. Três grupos é a melhor solução? Ainda não foi comparado com outras quantidades. É uma análise preliminar.
7. O que significa silhueta 0,4266? É uma medida da organização dos grupos, de -1 a 1. Não é 42,66% de acertos.
8. A análise prevê falta de alimentos? Não. Essa tarefa exige histórico de entradas e saídas do aplicativo.
9. O que falta de supervisionado? Definir uma tarefa com alvo real, separar treino e teste e avaliar. Isso fica para a continuidade do semestre.

## executar.py

Este arquivo só automatiza a sequência dos dois scripts já estudados.

- Linha 1: importa `Path` para localizar a pasta.
- Linha 2: importa `subprocess` para iniciar outro programa.
- Linha 3: importa `sys`, que informa o Python em uso.
- Linha 5: localiza a pasta do próprio arquivo.
- Linha 6: percorre os nomes dos dois scripts, na ordem.
- Linha 7: mostra qual etapa será executada.
- Linha 8: executa essa etapa com o mesmo Python; `check=True` interrompe se houver falha.
