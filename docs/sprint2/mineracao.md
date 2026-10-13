# Relatório de Mineração de Dados - Sprint 2

## 1. Origem dos Dados
- **Fonte:** Dados de instituições de caridade do Reino Unido obtidos do Give Food (`givefoodbasededados.json`)[cite: 21, 22].
- **Contexto:** Agrupamento exploratório geográfico preliminar por localização (latitude e longitude), sem foco em previsão de falta de itens do DoeFácil ou cálculo de rotas[cite: 22].

## 2. Tratamento dos Dados
- **Total de registros brutos:** 1.023[cite: 21]
- **Registros duplicados/inválidos descartados:** 0[cite: 21]
- **Total de registros tratados:** 1.023[cite: 21]

## 3. Configuração do Algoritmo (Clusterização)
- **Técnica:** K-Means (com padronização de variáveis `StandardScaler` e semente fixa `random_state=42`)[cite: 22].
- **Número de clusters ($k$):** 3[cite: 22]
- **Variáveis utilizadas:** Latitude e Longitude[cite: 22].

## 4. Resultados Obtidos
- **Coeficiente de Silhouette:** 0.4265[cite: 22]
- **Distribuição por Grupo:**
  - **Grupo 0:** 370 instituições[cite: 22]
  - **Grupo 1:** 150 instituições[cite: 22]
  - **Grupo 2:** 503 instituições[cite: 22]

## 5. Visualização
- O gráfico gerado com a distribuição espacial dos clusters foi salvo em `outputs/clusters.png`[cite: 22].