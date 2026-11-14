# DoeFácil

O DoeFácil é um sistema desenvolvido para auxiliar instituições sociais no gerenciamento de campanhas, doações de itens e controle de estoque. A solução integra aplicações web, mobile e desktop, permitindo que doadores registrem e acompanhem suas contribuições enquanto a equipe da instituição administra recebimentos e movimentações de estoque.

O projeto foi desenvolvido como parte do **Projeto Interdisciplinar do 6º semestre do curso de Desenvolvimento de Software Multiplataforma (DSM)** da Fatec Franca, no segundo semestre de 2026.

**Grupo 06:** Ana Júlia, Lauane e Pedro.

## Funcionalidades

O sistema disponibiliza funcionalidades específicas de acordo com o perfil de acesso.

| Perfil | Interface | Funcionalidades | 
| ----- | ----- | ----- | 
| Doador | Web e Mobile | Consultar campanhas ativas, cadastrar doações com ou sem campanha, acompanhar o status e editar ou cancelar doações que aguardam recebimento. | 
| Doador | Mobile | Criar uma conta para acessar o sistema. | 
| Funcionário | Desktop | Confirmar recebimentos, consultar saldos, registrar saídas e acompanhar o histórico de movimentações. | 
| Administrador | Web e Desktop | Gerenciar campanhas pelo painel web, realizar operações de recebimento e estoque pelo desktop e administrar usuários. | 

### Fluxo de uma doação

Após o cadastro, a doação permanece com o status **Aguardando recebimento** e dispara de forma assíncrona uma mensagem para a fila de processamento na nuvem (`AWS SQS`).

Quando um funcionário ou administrador confirma o recebimento pelo desktop, a API registra a entrada dos itens no estoque e atualiza o status da doação para **Recebida**.

O doador pode acompanhar essa atualização pelo aplicativo mobile ou pela interface web.

## Arquitetura do sistema

O DoeFácil utiliza uma arquitetura cliente-servidor, na qual as aplicações Web, Mobile e Desktop se comunicam com uma API REST centralizada.

A API, desenvolvida em Node.js, Express e TypeScript, concentra as regras de negócio, a autenticação, as validações e o acesso ao banco de dados PostgreSQL.

A autenticação utiliza **JSON Web Token (JWT)**, com controle de acesso de acordo com o perfil do usuário.

O backend possui uma implantação na **AWS Elastic Beanstalk**, utilizando HTTPS e um banco PostgreSQL hospedado no Neon. Além disso, conta com mensageria assíncrona integrada ao **AWS SQS (Simple Queue Service)** na região `us-east-2` (`doacoes-queue`) para o processamento robusto de eventos de doações.

A mineração de dados é realizada separadamente em Python, sem depender da execução da API ou do banco operacional do DoeFácil.

## Estrutura do projeto

| Diretório | Descrição | 
| ----- | ----- | 
| [`backend/`](backend/) | API REST em Node.js, Express e TypeScript, com autenticação JWT e integração SQS. | 
| [`frontend-web/`](frontend-web/) | Painel web desenvolvido em React, TypeScript e Vite. | 
| [`mobile/`](mobile/) | Aplicativo mobile desenvolvido em React Native e Expo. | 
| [`desktop/`](desktop/) | Aplicativo interno desenvolvido em Electron, React e TypeScript. | 
| [`database/`](database/) | Modelo relacional PostgreSQL e dados de exemplo. | 
| [`mining/`](mining/) | Pré-processamento e agrupamento de instituições utilizando Python e K-Means. | 
| [`docs/`](docs/) | Documentação técnica, relatórios e registros das entregas. | 

## API publicada

O backend do DoeFácil está publicado na AWS Elastic Beanstalk.

**Endereço principal da API:** http://doefacil-api-env.eba-ajkbdf8e.us-east-2.elasticbeanstalk.com/api
*(Nota: Também acessível via proxy com domínio customizado e HTTPS em `https://doefacil.duckdns.org`)*

| Recurso | Endereço | 
| ----- | ----- | 
| Status da API | http://doefacil-api-env.eba-ajkbdf8e.us-east-2.elasticbeanstalk.com/api/status | 
| Saúde da API | http://doefacil-api-env.eba-ajkbdf8e.us-east-2.elasticbeanstalk.com/api/health | 
| Consulta de campanhas | http://doefacil-api-env.eba-ajkbdf8e.us-east-2.elasticbeanstalk.com/api/campanhas | 

## Requisitos para execução

Para executar as aplicações localmente, utilize:

* Node.js 24 e npm;
* Git para obter e atualizar o repositório;
* Visual Studio Code ou outro editor de código;
* Expo Go para executar o aplicativo mobile em um dispositivo compatível;
* Docker e PostgreSQL, caso seja necessário executar o backend localmente.

## Configuração do ambiente

### 1. Configurar as interfaces

Para utilizar a API publicada no Elastic Beanstalk, configure os arquivos `.env` de cada interface com os seguintes parâmetros:

**Frontend Web — `frontend-web/.env`**
```env
VITE_API_URL=http://doefacil-api-env.eba-ajkbdf8e.us-east-2.elasticbeanstalk.com/api
SQS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/730335245279/doacoes-queue
```

**Mobile — `mobile/.env`**
```env
EXPO_PUBLIC_API_URL=http://doefacil-api-env.eba-ajkbdf8e.us-east-2.elasticbeanstalk.com/api
SQS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/730335245279/doacoes-queue
```

**Desktop — `desktop/.env`**
```env
VITE_API_URL=http://doefacil-api-env.eba-ajkbdf8e.us-east-2.elasticbeanstalk.com/api
SQS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/730335245279/doacoes-queue
```

Os arquivos `.env` são utilizados para configurar o ambiente e não devem ser enviados ao repositório.

### 2. Executar o painel web

Na raiz do repositório, execute:

```bash
cd frontend-web
npm ci
npm run dev
```

Acesse: http://localhost:5173

### 3. Executar o aplicativo desktop

Na raiz do repositório, execute:

```bash
cd desktop
npm ci
npm run dev
```

### 4. Executar o aplicativo mobile

Instale o Expo Go no celular e execute:

```bash
cd mobile
npm ci
npm start
```

### 5. Executar o backend localmente (opcional)

Crie o arquivo `backend/.env` utilizando as variáveis:

```env
PORT=3000
DATABASE_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/doefacil
JWT_SECRET=SUA_CHAVE_SECRETA_COM_PELO_MENOS_32_CARACTERES
AWS_REGION=us-east-2
SQS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/730335245279/doacoes-queue
```

Em seguida, execute:

```bash
cd backend
npm ci
npm run dev
```

## Mineração de dados

Na Sprint 2, o grupo desenvolveu uma etapa de mineração de dados utilizando Python e o algoritmo **K-Means** com base em **1.023 registros** da Give Food. Os scripts e instruções estão em [`mining/README.md`](mining/README.md).

## Testes e validações

O projeto possui testes automatizados no backend (`npm test` — 80 testes aprovados) e verificações de build nas interfaces web, desktop e mobile.

## Tecnologias utilizadas

| Área | Tecnologias | 
| ----- | ----- | 
| Backend | Node.js, Express e TypeScript | 
| Banco de dados | PostgreSQL e Neon | 
| Frontend Web | React, TypeScript e Vite | 
| Mobile | React Native e Expo | 
| Desktop | Electron, React e TypeScript | 
| Autenticação | JSON Web Token (JWT) | 
| Infraestrutura e Mensageria | Docker, AWS Elastic Beanstalk, **AWS SQS** e HTTPS | 
| Mineração de dados | Python e K-Means | 

---

**DoeFácil — Projeto Interdisciplinar | DSM — Fatec Franca | 2026/2 | Grupo 06**
