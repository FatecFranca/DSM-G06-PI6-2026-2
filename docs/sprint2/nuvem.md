# Computação em Nuvem II — Sprint 2

## Ambiente criado

Em 13/10/2026, configuramos o banco PostgreSQL do DoeFácil no Neon e conectamos a API executada no computador a esse banco.

| Configuração | Valor |
| --- | --- |
| Provedor do banco | Neon |
| Plano | Free |
| Projeto | doefacil |
| Banco de dados | neondb |
| Região | AWS US East 2 — Ohio, conforme o painel do Neon |
| Aplicação que acessa o banco | API Node.js/Express do DoeFácil |
| Execução atual da API | Local, na porta 3000 |

A indicação AWS na região corresponde à infraestrutura usada pelo Neon. O grupo utiliza o serviço e o console do Neon.

## Ajuste do planejamento inicial

A documentação da primeira Sprint previa AWS Elastic Beanstalk e Amazon RDS. Durante a configuração, o cadastro da conta AWS exigiu cartão, que não estava disponível. Para viabilizar a implantação inicial, escolhemos o plano Free do Neon, que permite utilizar PostgreSQL sem cadastrar cartão.

A troca de provedor mantém o SGBD PostgreSQL e permite aproveitar o modelo e as consultas já utilizados no projeto. A hospedagem da API permanece como próxima etapa; o Elastic Beanstalk não foi configurado nesta entrega.

## Configuração realizada

1. Criamos a organização do grupo e o projeto `doefacil` no Neon.
2. Mantivemos o serviço de banco de dados PostgreSQL no plano Free.
3. Executamos `database/modelo-logico.sql` no editor SQL do Neon, criando as oito tabelas do sistema.
4. Executamos `database/seed.sql` para inserir os dados de teste.
5. Configuramos a URL do Neon na variável `DATABASE_URL` do arquivo local `backend/.env`, mantendo os parâmetros de conexão fornecidos pelo serviço, incluindo `sslmode=require`.
6. Iniciamos a API com `npm run dev`, a partir da pasta `backend`.
7. Consultamos `/api/health` para verificar a conexão com o banco e `/api/itens` para conferir os dados de teste.

O procedimento levou para a nuvem a estrutura do banco e os dados do script de teste. Os demais registros eventualmente criados no banco local não foram transferidos por esse procedimento. A base Give Food, usada na mineração, permanece separada do banco operacional do aplicativo.

## Verificação realizada

No PowerShell, com a API em execução, utilizamos:

```powershell
Invoke-RestMethod "http://127.0.0.1:3000/api/health" -TimeoutSec 15
Invoke-RestMethod "http://127.0.0.1:3000/api/itens" -TimeoutSec 15
```

A rota `/api/health` retornou `banco: conectado`. A rota `/api/itens` apresentou:

| id_item | Nome | Unidade de medida | Estoque mínimo |
| --- | --- | --- | --- |
| 1 | Arroz | kg | 5.00 |
| 2 | Sabonete | unidade | 10.00 |

Também executamos diretamente no editor do Neon:

```sql
SELECT nome, unidade_medida
FROM item
ORDER BY id_item;
```

Os dois itens foram retornados no editor SQL e pela API, com os mesmos nomes e unidades de medida.

## Credenciais

A URL de conexão é mantida em `backend/.env`. O comando `git check-ignore -v backend/.env` confirmou que esse arquivo está ignorado pelo Git. As credenciais não fazem parte desta documentação nem dos arquivos versionados desta etapa.

## Evidências

Projeto criado, região e plano:

![Projeto doefacil no Neon com plano gratuito e região Ohio](evidencias/neon-projeto.png)

Lista das oito tabelas no banco `neondb`, com a campanha de teste cadastrada:

![Tabelas do sistema no Neon e registro da campanha de teste](evidencias/neon-tabelas.png)

Consulta dos itens após a execução do seed:

![Consulta dos itens no editor SQL do Neon](evidencias/neon-itens.png)

Verificação da conexão com o banco e consulta dos itens pela API local:

![PowerShell com banco conectado e retorno dos itens Arroz e Sabonete](evidencias/api-itens.png)

## Limites desta entrega e próximas etapas

O ambiente é parcial: o banco está em nuvem e a API ainda depende do computador ligado. Não foi configurada redundância própria da API nem demonstrada uma arquitetura completa de alta disponibilidade.

Nas próximas etapas, o grupo deverá hospedar a API, configurar os clientes para o endereço publicado e documentar a estratégia de backups, recuperação e disponibilidade. Os limites do plano Free deverão ser acompanhados conforme a utilização.

## Referências

- Neon — Planos e condições do serviço: https://neon.com/pricing
- Neon — Conexão de aplicações ao banco: https://neon.com/docs/connect/connect-from-any-app
- Repositório do DoeFácil: https://github.com/FatecFranca/DSM-G06-PI6-2026-2

Consulta e configuração: 13/10/2026.
