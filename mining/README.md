# Pré-processamento e mineração inicial do DoeFácil

Esta é a entrega de mineração da Sprint 2. A análise utiliza a cópia real
Give Food já escolhida pelo grupo. Os scripts são os mesmos que foram
executados por Lauane: `tratar.py` e `cluster.py`.

## Pergunta do estudo

Como preparar os cadastros de instituições e observar seu agrupamento por
localização? Uma linha representa uma instituição. A base não contém o
histórico real de doações e movimentações do DoeFácil.

## Arquivos

| Arquivo | Função |
|---|---|
| `../givefoodbasededados.json` | Cópia da fonte real |
| `tratar.py` | Pré-processamento e registro das contagens |
| `cluster.py` | Padronização das coordenadas e K-Means preliminar |
| `executar.py` | Executa as duas etapas em sequência |
| `data/instituicoes_tratadas.csv` | Cinco campos exportados pelo tratamento |
| `outputs/tratamento.json` | Origem, assinatura do arquivo e contagens |
| `outputs/instituicoes_clusters.csv` | Cadastros com o grupo atribuído |
| `outputs/resumo.json` | Quantidade de grupos e silhueta |
| `outputs/clusters.png` | Distribuição das coordenadas originais |
| `GUIA_PRE_PROCESSAMENTO.md` | Explicações das linhas e perguntas para estudar |
| `preprocessamento_doefacil.ipynb` | Versão em células para acompanhar as operações |
| `requirements-lock.txt` | Versões registradas no Windows com Python 3.15.0 |

## Execução no computador da Lauane

Na raiz do repositório, com o ambiente virtual já preparado:

```powershell
.\.venv\Scripts\python.exe mining/tratar.py
.\.venv\Scripts\python.exe mining/cluster.py
```

Ou execute as duas etapas com um comando:

```powershell
.\.venv\Scripts\python.exe mining/executar.py
```

Os scripts usam arquivos locais. A API e o PostgreSQL não precisam estar
em execução para esta análise.

## Preparação em outro computador

Depois de instalar Python 3.15.0, use o PowerShell na raiz do projeto:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r mining/requirements-lock.txt
.\.venv\Scripts\python.exe mining/executar.py
```

O arquivo de versões registra o ambiente testado por Lauane; a compatibilidade
de outras combinações de Python e sistema deve ser verificada separadamente.

## Resultados conferidos

Foram lidos e preservados 1.023 registros. Não foram encontrados identificadores
duplicados nem registros reprovados nas regras aplicadas. Isso não elimina
a necessidade do tratamento: houve organização da tabela, conversão das
coordenadas, ajuste dos nomes e seleção dos campos.

O K-Means usou três grupos, semente 42 e dez inicializações. As quantidades
foram 370, 150 e 503 instituições, com silhueta de 0,4266. A silhueta não é
porcentagem de acerto. Os grupos não representam níveis de prioridade social.

## Estudo pelo notebook

Abra `preprocessamento_doefacil.ipynb` no VS Code para ler as operações e as
saídas de referência. Para executar células, use as extensões Python e Jupyter
e selecione o ambiente `.venv`. O VS Code pode solicitar a instalação de
`ipykernel`; isso é opcional e não é necessário para rodar os arquivos `.py`.

As saídas do notebook foram geradas em Python 3.12.14 no Linux. As versões são
mostradas na primeira célula. Tratamento e agrupamento também foram conferidos
por Lauane no Windows com Python 3.15.0, com as mesmas contagens e silhueta.

## Documentos da entrega

O relatório completo da mineração e a documentação geral estão em
`../docs/sprint2`, em Word e PDF. O guia linha por linha serve para estudo;
o relatório apresenta problema, fonte, preparação, modelo, avaliação, limites
e disponibilização dos resultados.

Na Sprint 2, a técnica inicial pode ser classificação simples **ou** cluster
preliminar. Esta entrega usa K-Means. Aprendizado supervisionado, mensageria,
integração completa do desktop, armazenamento em escala e disponibilidade
continuam no planejamento do semestre.

Fonte dos dados: https://www.givefood.org.uk/api/2/.

Referência de organização estudada:
https://github.com/FatecFranca/DSM-G04-PI6-2026-1.
O estudo usa os dados, scripts e resultados do DoeFácil.
