# DoeFácil

O DoeFácil ajuda instituições sociais a organizar campanhas, doações de itens e estoque. A administração gerencia campanhas no painel web, os doadores registram doações pelo navegador ou pelo celular e a equipe da instituição confirma o recebimento no desktop.

Projeto Interdisciplinar do 6º semestre de Desenvolvimento de Software Multiplataforma (DSM) da Fatec Franca, turma 2026/2. **Grupo 06** · Ana Júlia, Lauane e Pedro.

## Funcionalidades

| Perfil | Interface | O que pode fazer |
| --- | --- | --- |
| Doador | Web e mobile | Consultar campanhas ativas, cadastrar doações com ou sem campanha, acompanhar o status e editar ou cancelar doações que aguardam recebimento |
| Doador | Mobile | Criar uma conta |
| Funcionário | Desktop | Confirmar recebimentos, consultar o saldo, registrar saídas e acompanhar o histórico de movimentações |
| Administrador | Web e desktop | Gerenciar campanhas no web, operar recebimentos e estoque no desktop e gerenciar usuários |

A doação fica como **Aguardando recebimento** após o cadastro. Quando a equipe confirma o recebimento no desktop, a API registra a entrada no estoque e atualiza o status para **Recebida**.

## Estrutura do projeto

| Diretório | Conteúdo |
| --- | --- |
| [`backend/`](backend/) | API REST em Node.js, Express e TypeScript, com autenticação JWT |
| [`frontend-web/`](frontend-web/) | Painel de campanhas e área do doador em React, TypeScript e Vite |
| [`mobile/`](mobile/) | Aplicativo do doador em React Native e Expo |
| [`desktop/`](desktop/) | Aplicativo interno da instituição em Electron, React e TypeScript |
| [`database/`](database/) | Modelo relacional PostgreSQL e dados de exemplo |
| [`mining/`](mining/) | Pré-processamento e agrupamento de instituições com Python e K-Means |
| [`docs/`](docs/) | Relatórios e registros das entregas |

## Execução local

Use **Node.js 24 com npm** e uma base PostgreSQL. Para rodar o app no celular, instale o **Expo Go** e conecte o celular e o computador à mesma rede.

### 1. Prepare o banco e inicie a API

Se já tiver uma base de teste com o esquema do DoeFácil, use a conexão dessa base. Para iniciar um PostgreSQL local com Docker, execute na raiz:

```sh
docker compose up -d postgres
```

Na primeira inicialização do volume, o Compose aplica o [modelo do banco](database/modelo-logico.sql) e carrega os [dados de exemplo](database/seed.sql). A porta local padrão é `5432`.

Crie `backend/.env` com base em [`backend/.env.example`](backend/.env.example). Configure `PORT=3000`, preencha `DATABASE_URL` com a conexão da base de teste e defina `JWT_SECRET` com pelo menos 32 caracteres. Mantenha as credenciais no arquivo local.

```sh
cd backend
npm ci
npm run dev
```

Abra [`/api/health`](http://localhost:3000/api/health) para conferir se a API retorna `{"banco":"conectado"}`.

### 2. Inicie as interfaces

Com a API em execução, abra um terminal separado para cada interface. Rode os comandos a partir da pasta indicada.

| Interface | Configuração local | Comandos |
| --- | --- | --- |
| Web | Em `frontend-web/.env`, use `VITE_API_URL=http://localhost:3000/api` | Em `frontend-web/`, rode `npm ci` e `npm run dev`. Abra [localhost:5173](http://localhost:5173). |
| Desktop | Em `desktop/.env`, use `VITE_API_URL=http://localhost:3000/api` | Em `desktop/`, rode `npm ci` e `npm run dev`. A janela do Electron abre após iniciar o Vite. |
| Mobile | Em `mobile/.env`, use `EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:3000/api` com o IPv4 atual do computador | Em `mobile/`, rode `npm ci` e `npm start`. Leia o QR code com o celular para abrir no Expo Go. |

Mais detalhes de configuração e ensaio estão no [guia do frontend web](frontend-web/README.md).

## Demonstração

Use contas de teste de administrador e doador. Para confirmar o recebimento no desktop, use uma conta de funcionário ou administrador.

1. No **web**, entre como administrador e crie ou localize uma campanha ativa.
2. No **web ou mobile**, entre como doador e cadastre uma doação de 2 kg de arroz vinculada à campanha. Anote o número da doação.
3. No **desktop**, confira o saldo de arroz e confirme a doação em **Recebimentos**. Verifique o status `RECEBIDA` e a entrada de 2 kg no estoque.
4. Em **Minhas doações**, no web ou mobile, atualize a lista para acompanhar a mudança para **Recebida**.

Nos testes da Sprint 3, a API publicada no **AWS Elastic Beanstalk** foi validada com o banco **Neon** pelos endpoints `/api/status`, `/api/health` e `/api/campanhas`. O fluxo com login e as interfaces foi testado no ambiente local.

## Testes e documentação

- **API** · na pasta `backend/`, rode `npm test` com um banco de testes preparado com o esquema e os dados de exemplo.
- **Web** · na pasta `frontend-web/`, rode `npm run build` e `npm run lint`.
- **Mineração** · a análise usa a base Give Food para agrupar instituições por localização. Os dados, os passos de execução e os resultados estão no [guia de mineração](mining/README.md).
- **Entregas anteriores** · consulte a [documentação da Sprint 2](docs/sprint2/).
