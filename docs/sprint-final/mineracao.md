# Relatório de Mineração de Dados — DoeFácil (Sprint Final)

## 1. Pergunta de Pesquisa e Contexto
* **Pergunta norteadora:** "Como as instituições presentes na base de dados externa se agrupam geograficamente e de que forma a separação espacial varia com a quantidade de grupos ($k$) testada?"
* **Objetivo:** Analisar a distribuição espacial das instituições cadastradas na base de dados externa para compreender a formação de clusters geográficos, subsidiando a organização estrutural do projeto sem assumir inferências de prioridade social ou previsão de demanda de doações.

## 2. Base de Dados Utilizada
* **Fonte:** Base de dados externa *Give Food* (`givefoodbasededados.json`), contendo **1.023 instituições**.
* **Tratamento e Limpeza:** Os dados brutos passaram por verificação de duplicados por ID, situação, nomes e coordenadas geográficas através do script `mining/tratar.py`, gerando a base padronizada `mining/data/instituicoes_tratadas.csv`.
* **Atributos Utilizados:** Atributos de localização geográfica (`latitude` e `longitude`), devidamente normalizados utilizando `StandardScaler` para garantir a mesma escala de distância para o algoritmo de agrupamento.

## 3. Metodologia e Parâmetros Testados
* **Técnica Aplicada:** Algoritmo de aprendizado não supervisionado **K-Means**, variando o número de clusters ($k$) de **2 a 6** (`n_init=10`, `random_state=42`).
* **Métricas de Avaliação Utilizadas:**
  * **Coeficiente de Silhueta (*Silhouette Score*):** Mede a coesão interna dos clusters e a separação entre eles (varia de -1 a 1; valores mais próximos de 1 indicam clusters mais densos e bem delimitados).
  * **Índice de Davies-Bouldin (*Davies-Bouldin Score*):** Avalia a similaridade entre os clusters e seus vizinhos (valores menores indicam melhor separação e menor sobreposição entre os grupos).
  * **Inércia (*Inertia* / Soma dos Erros Quadráticos Intra-cluster):** Mede a compactação dos elementos em relação ao centroide do cluster (diminui à medida que $k$ aumenta).

## 4. Resultados Reais da Comparação de Agrupamentos
Abaixo estão os resultados consolidados obtidos pela execução do script de comparação (`mining/comparar_clusters.py`):

| Quantidade de Clusters ($k$) | Coesão / Silhueta (Maior é melhor) | Davies-Bouldin (Menor é melhor) | Inércia (Compactação) |
| :---: | :---: | :---: | :---: |
| **2** | 0,4969 | 0,7843 | 1097,12 |
| **3** | 0,4266 | 0,8546 | 696,80 |
| **4** | 0,4971 | **0,6961** | 432,75 |
| **5** | **0,4998** | 0,7252 | 356,64 |
| **6** | 0,4305 | 0,8225 | 306,10 |

### Distribuição dos Tamanhos por Agrupamento ($k$ testados):
* **Para $k = 2$:** Divisão macro em dois blocos geográficos principais.
* **Para $k = 3$:** Reproduz a divisão base utilizada como referência anterior na Sprint 2.
* **Para $k = 4$ e $k = 5$:** Apresentaram os melhores índices de separação (Silhueta próxima de $0.50$ e menor índice de Davies-Bouldin para $k = 4$), indicando partições regionais mais equilibradas e coesas espacialmente.

## 5. Limitações Geográficas da Análise
* **Uso estrito de coordenadas planas e distância euclidiana:** A aplicação da padronização e do cálculo de distâncias euclidianas sobre latitude e longitude desconsidera a curvatura real da Terra (distâncias geodésicas reais). Para evoluções futuras, recomenda-se a aplicação de abordagens baseadas em coordenadas esféricas (radianos) ou métricas de distância *Haversine* acopladas a algoritmos baseados em densidade (como DBSCAN).
* **Ausência de variáveis contextuais operacionais:** Os agrupamentos refletem estritamente a concentração espacial das coordenadas cadastradas. O modelo **não** substitui nem correlaciona com métricas reais de volume de estoque, carência alimentar, rotas logísticas de entrega do sistema DoeFácil ou prioridade de atendimento.

## 6. Conclusão
A experimentação permitiu avaliar de forma quantitativa o comportamento espacial das 1.023 instituições da base externa. Os resultados comprovam que valores de $k$ entre 4 e 5 otimizam estatisticamente a partição em termos de silhueta e Davies-Bouldin, servindo como base técnica estruturada e reproduzível documentada para o escopo do projeto