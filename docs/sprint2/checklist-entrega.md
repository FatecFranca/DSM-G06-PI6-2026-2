# Conferência da entrega da Sprint 2

Revisão em 15/10/2026. Código integrado à main: `f9e69c4`.
O registro do ambiente Python está na branch de Lauane, commit `21c5c59`.

## Entregas mínimas

| Exigência | Evidência disponível | Conferência antes da apresentação |
|---|---|---|
| Endpoints básicos da API com CRUD | Rotas de autenticação, campanhas e doações em `backend/src/routes`; testes em `backend/tests` | Rodar os testes e demonstrar um fluxo completo de doação e campanha |
| Front-end parcialmente integrado | Mobile com doações e web com campanhas usando a API | Demonstrar no aparelho e no navegador com a API iniciada |
| Banco implementado e populado | `database/modelo-logico.sql`, `database/seed.sql` e prints das tabelas no Neon | Conferir conexão e dados no ambiente da apresentação |
| Commits de todos | Histórico de Pedro, Lauane e Ana Júlia integrado à main | Publicar a documentação e integrar a branch final de mineração |
| Nuvem criada e documentada | PostgreSQL no Neon; `nuvem.md` e quatro capturas em `evidencias` | Confirmar `/api/health` e `/api/itens` com o banco configurado |
| Coleta e tratamento com técnica inicial | Give Food, `tratar.py`, `cluster.py`, CSVs, JSONs e gráfico | Repetir os dois scripts e conferir 1.023 registros e três grupos |
| Documentação intermediária com evidências | Documentação geral da Sprint 2, relatório de mineração, trechos de código e capturas do Neon | Conferir os documentos e fazer o commit dos arquivos finais |

## 1. Conferir a mineração

Execute no PowerShell da raiz do repositório:

```powershell
.\.venv\Scripts\python.exe mining/tratar.py
.\.venv\Scripts\python.exe mining/cluster.py
```

Resultado registrado: 1.023 cadastros, zero exclusões, grupos com 370, 150 e
503 instituições e silhueta 0,42655731672335884. Esta entrega usa o cluster
preliminar permitido no enunciado.

## 2. Conferir back-end e web

```powershell
cd backend
npm test
cd ..\frontend-web
npm run build
cd ..
```

Os testes do back-end usam a configuração local de `backend/.env` e precisam
de PostgreSQL com as tabelas e os dados de teste. A última execução enviada
pelo grupo teve 24 testes aprovados. Se o resultado mudar, investigar antes
de substituir as evidências ou apresentar os números como atuais.

## 3. Conferir a conexão e os fluxos

Em um terminal na pasta `backend`, inicie a API com `npm run dev` e deixe-o
aberto. Em outro terminal, faça as consultas:

```powershell
Invoke-RestMethod "http://127.0.0.1:3000/api/health" -TimeoutSec 15
Invoke-RestMethod "http://127.0.0.1:3000/api/itens" -TimeoutSec 15
```

Depois, demonstre login, cadastro, consulta, edição e cancelamento de uma
doação no mobile. No web, use a conta administradora de teste para criar,
consultar, editar e cancelar uma campanha. A documentação registra que a
leitura no Neon foi validada; isso não substitui a conferência dos fluxos
de escrita no ambiente que será demonstrado.

Se for necessário atualizar evidências, capture a tela do resultado.
Mantenha arquivos `.env`, senhas e tokens fora dos prints e dos commits.

## 4. Conferir e publicar os arquivos

Na raiz do projeto, execute `git status` e revise os arquivos antes de
adicioná-los. Use commits referentes ao trabalho realizado. A participação
dos três integrantes já está no histórico e deve ser preservada.

## Continuidade do semestre

O desktop ainda é um protótipo estático. Recebimento e estoque completos,
mensageria com protocolo e broker, demonstração de armazenamento em escala,
publicação da API com disponibilidade e recuperação e aprendizado supervisionado
precisam evoluir nas próximas etapas.

Essas pendências não são apresentadas como funcionalidades prontas. O escopo
da Sprint 2 é a versão intermediária com integrações parciais descrita no
enunciado. O cumprimento de toda a avaliação do semestre depende da continuidade.
