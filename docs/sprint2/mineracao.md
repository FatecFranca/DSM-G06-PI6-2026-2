# Relatório de mineração de dados da Sprint 2

Ana Júlia Alves Mota, Lauane Gabriela de Araújo Toledo e Pedro Henrique Cintra Silva.

## 1. Problema e objetivo

O DoeFácil organiza campanhas, doações e estoque de uma instituição social.
Nesta etapa, usamos a base Give Food para preparar os cadastros de instituições
e observar como elas se agrupam por localização.

## 2. Fonte e compreensão dos dados

A fonte é a [API Give Food](https://www.givefood.org.uk/api/2/foodbanks/).
Usamos a cópia `givefoodbasededados.json`, já existente na raiz do projeto.
Cada linha representa uma instituição. A cópia contém 1.023 registros com
17 campos principais; `json_normalize` abre os objetos aninhados em 28 colunas.

Há registros do Reino Unido e de Guernsey, Ilha de Man e Jersey. A data original
da coleta não foi registrada. A entrada do arquivo no Git ocorreu em 01/09/2026.
Essa data identifica o versionamento da cópia, não a coleta.

Os dados cadastrais da Give Food são uma fonte externa de estudo. O PostgreSQL
do aplicativo guarda usuários, campanhas, doações e movimentações do DoeFácil.
Os registros de teste do aplicativo não foram tratados como histórico real.

## 3. Preparação e regras de qualidade

O script `mining/tratar.py` executa, nesta ordem:

1. Lê o JSON em UTF-8 e organiza a tabela com `pandas.json_normalize`.
2. Remove repetições pelo identificador `id`, mantendo a primeira ocorrência.
3. Separa `lat_lng` na primeira vírgula e converte as partes em números.
4. Substitui nome ausente por texto vazio e remove espaços nas pontas.
5. Mantém instituições abertas, com nome preenchido e coordenadas nas faixas válidas.
6. Exporta `id`, `name`, `country`, `latitude` e `longitude` para CSV.
7. Registra a origem, o hash da fonte e as contagens em `tratamento.json`.

A conversão usa `errors="coerce"`: conteúdos não conversíveis viram valores
ausentes e não passam no filtro de coordenadas. Não há preenchimento estimado
de localização. Os limites conferidos são -90 a 90 para latitude e -180 a 180
para longitude. A regra não verifica o endereço de cada instituição em um mapa.

| Verificação | Quantidade |
|---|---:|
| Registros brutos | 1.023 |
| Duplicações por id removidas | 0 |
| Cadastros fechados ou inválidos removidos | 0 |
| Registros tratados | 1.023 |

Zero exclusões não significa ausência de tratamento. As conversões, a seleção
de campos e as verificações foram executadas. O hash identifica os bytes;
finais de linha LF ou CRLF podem mudar a assinatura de cópias equivalentes.

## 4. Aprendizado não supervisionado

`mining/cluster.py` aplica `StandardScaler` a latitude e longitude e utiliza
K-Means com `n_clusters=3`, `random_state=42` e `n_init=10`.
A quantidade de grupos é uma escolha exploratória. Não foi demonstrado que
três seja a melhor quantidade. Os rótulos 0, 1 e 2 não indicam prioridade social.

| Grupo | Instituições |
|---|---:|
| 0 | 370 |
| 1 | 150 |
| 2 | 503 |

A silhueta foi **0,42655731672335884**, aproximadamente **0,4266**.
A medida usa o mesmo espaço padronizado do modelo e não é porcentagem de acerto.
As distâncias padronizadas também não equivalem a quilômetros ou rotas.

## 5. Avaliação e interpretação

Os três grupos contêm 370, 150 e 503 instituições. A silhueta de 0,4266
indica a organização desta solução no espaço padronizado, não uma taxa de
acerto ou uma medida de necessidade de alimentos. A quantidade de grupos
foi definida para a análise preliminar e ainda precisa ser comparada com
outras configurações.

As coordenadas desenhadas são as originais. Os filtros verificam faixas
numéricas, sem confirmar endereços em mapa. A falta da data original de coleta
limita afirmações sobre a situação atual dos cadastros.

## 6. Disponibilização

A sequência de execução é `tratar.py` e `cluster.py`. Os scripts produzem o
CSV tratado, o resumo do tratamento, o CSV com grupos, o resumo do agrupamento
e o gráfico, nas pastas `mining/data` e `mining/outputs`.

O guia linha por linha e o notebook são materiais de estudo. O relatório em
Word e PDF, disponível nesta pasta, descreve o processo completo desta etapa.
A mineração ainda não está conectada à API ou às telas do aplicativo.

## 7. Ambiente e execução

Lauane executou os scripts no Windows com Python 3.15.0. O arquivo
`mining/requirements-lock.txt`, commit `21c5c59`, registra 19 bibliotecas,
entre elas pandas 3.0.6, scikit-learn 1.9.1 e matplotlib 3.11.2.
As contagens e a silhueta enviadas pelo grupo são as apresentadas acima.

Na raiz do projeto:

```powershell
.\.venv\Scripts\python.exe mining/tratar.py
.\.venv\Scripts\python.exe mining/cluster.py
```

## 8. Relação com a Sprint 2 e com o semestre

O enunciado da Sprint 2 permite classificação simples **ou** cluster
preliminar. O grupo entrega o pré-processamento e o K-Means já executados.
O aprendizado supervisionado fica como continuidade do semestre.

Uma tarefa futura ligada ao estoque precisará de histórico operacional
real, com itens, unidades, entradas, saídas e datas. As entradas devem conter
apenas informações disponíveis antes da previsão, e o alvo deve representar
um resultado futuro observado. A base cadastral atual não sustenta previsão
de falta de estoque ou recomendação de alimentos.

## Referências

- Give Food: https://www.givefood.org.uk/api/2/
- K-Means: https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html
- StandardScaler: https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html
- Silhueta: https://scikit-learn.org/stable/modules/generated/sklearn.metrics.silhouette_score.html
