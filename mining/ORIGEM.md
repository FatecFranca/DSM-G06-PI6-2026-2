# Base real - Sprint 2

- Arquivo usado: givefoodbasededados.json, ja existente na raiz do repositorio.
- Origem: https://www.givefood.org.uk/api/2/foodbanks/
- Site: https://www.givefood.org.uk/
- O arquivo tem cadastros de instituicoes do Reino Unido.
- Data de coleta original: nao registrada no arquivo. Nao inventar essa data.
- O snapshot entrou no Git em 01/09/2026; essa e a data do commit, nao da coleta.
- Tratamento: remover IDs duplicados, registros fechados e coordenadas invalidas.
- Tecnica: K-Means com latitude/longitude padronizadas, k=3 e random_state=42.
- Limite: agrupamento exploratorio por localizacao; nao mede demanda nem volume de doacoes.
- outputs/tratamento.json registra o hash e as contagens; outputs/resumo.json registra os grupos.
- As coordenadas padronizadas usam distancia aproximada; nao sao calculo de rotas.
