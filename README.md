# DoeFácil

O DoeFácil é um sistema desenvolvido para auxiliar instituições sociais no gerenciamento de campanhas, doações de itens e controle de estoque. A solução integra aplicações web, mobile e desktop, permitindo que doadores registrem e acompanhem suas contribuições enquanto a equipe da instituição administra recebimentos e movimentações de estoque.

O projeto foi desenvolvido como parte do **Projeto Interdisciplinar do 6º semestre do curso de Desenvolvimento de Software Multiplataforma (DSM)** da Fatec Franca, no segundo semestre de 2026.

**Grupo 06:** Ana Júlia, Lauane e Pedro.

## Funcionalidades

O sistema disponibiliza funcionalidades específicas de acordo com o perfil de acesso.

| Perfil | Interface | Funcionalidades |
| --- | --- | --- |
| Doador | Web e Mobile | Consultar campanhas ativas, cadastrar doações com ou sem campanha, acompanhar o status e editar ou cancelar doações que aguardam recebimento. |
| Doador | Mobile | Criar uma conta para acessar o sistema. |
| Funcionário | Desktop | Confirmar recebimentos, consultar saldos, registrar saídas e acompanhar o histórico de movimentações. |
| Administrador | Web e Desktop | Gerenciar campanhas pelo painel web, realizar operações de recebimento e estoque pelo desktop e administrar usuários. |

### Fluxo de uma doação

Após o cadastro, a doação permanece com o status **Aguardando recebimento**.

Quando um funcionário ou administrador confirma o recebimento pelo desktop, a API registra a entrada dos itens no estoque e atualiza o status da doação para **Recebida**.

O doador pode acompanhar essa atualização pelo aplicativo mobile ou pela interface web.

## Arquitetura do sistema

O DoeFácil utiliza uma arquitetura cliente-servidor, na qual as aplicações Web, Mobile e Desktop se comunicam com uma API REST centralizada.

A API, desenvolvida em Node.js, Express e TypeScript, concentra as regras de negócio, a autenticação, as validações e o acesso ao banco de dados PostgreSQL.

A autenticação utiliza **JSON Web Token (JWT)**, com controle de acesso de acordo com o perfil do usuário.

O backend possui uma implantação na **AWS Elastic Beanstalk**, utilizando HTTPS e um banco PostgreSQL hospedado no Neon.

A mineração de dados é realizada separadamente em Python, sem depender da execução da API ou do banco operacional do DoeFácil.

## Estrutura do projeto

| Diretório | Descrição |
| --- | --- |
| [`backend/`](backend/) | API REST em Node.js, Express e TypeScript, com autenticação JWT. |
| [`frontend-web/`](frontend-web/) | Painel web desenvolvido em React, TypeScript e Vite. |
| [`mobile/`](mobile/) | Aplicativo mobile desenvolvido em React Native e Expo. |
| [`desktop/`](desktop/) | Aplicativo interno desenvolvido em Electron, React e TypeScript. |
| [`database/`](database/) | Modelo relacional PostgreSQL e dados de exemplo. |
| [`mining/`](mining/) | Pré-processamento e agrupamento de instituições utilizando Python e K-Means. |
| [`docs/`](docs/) | Documentação técnica, relatórios e registros das entregas. |

## API publicada

O backend do DoeFácil está publicado na AWS Elastic Beanstalk, com acesso por HTTPS.

**Endereço principal:** https://doefacil.duckdns.org

| Recurso | Endereço |
| --- | --- |
| Documentação Swagger | https://doefacil.duckdns.org/docs |
| Status da API | https://doefacil.duckdns.org/api/status |
| Saúde da API | https://doefacil.duckdns.org/api/health |
| Consulta de campanhas | https://doefacil.duckdns.org/api/campanhas |

O endpoint `/api/status` informa a disponibilidade da aplicação, enquanto `/api/health` verifica a conexão com o banco de dados.

A documentação Swagger apresenta os endpoints disponíveis, seus parâmetros e os formatos de requisição e resposta.

Os endpoints protegidos exigem autenticação e as permissões correspondentes ao perfil do usuário.

## Requisitos para execução

Para executar as aplicações localmente, utilize:

- Node.js 24 e npm;
- Git para obter e atualizar o repositório;
- Visual Studio Code ou outro editor de código;
- Expo Go para executar o aplicativo mobile em um dispositivo compatível;
- Docker e PostgreSQL, caso seja necessário executar o backend localmente.

As interfaces podem utilizar diretamente a API publicada, sem a necessidade de iniciar o backend e o banco de dados no computador.

## Configuração do ambiente

### 1. Configurar as interfaces

Para utilizar a API publicada, configure os arquivos `.env` de cada interface.

**Frontend Web — `frontend-web/.env`**

```env
VITE_API_URL=https://doefacil.duckdns.org/api
```

**Desktop — `desktop/.env`**

```env
VITE_API_URL=https://doefacil.duckdns.org/api
```

**Mobile — `mobile/.env`**

```env
EXPO_PUBLIC_API_URL=https://doefacil.duckdns.org/api
```

Os arquivos `.env` são utilizados para configurar o ambiente e não devem ser enviados ao repositório.

Caso o endereço da API seja alterado, atualize a variável correspondente e reinicie a aplicação.

### 2. Executar o painel web

Na raiz do repositório, execute:

```bash
cd frontend-web
npm ci
npm run dev
```

Acesse:

http://localhost:5173

O painel permite que administradores gerenciem campanhas e que doadores consultem campanhas, cadastrem doações e acompanhem seus registros.

### 3. Executar o aplicativo desktop

Na raiz do repositório, execute:

```bash
cd desktop
npm ci
npm run dev
```

Após a inicialização do Vite, a janela do Electron será aberta.

O acesso às funcionalidades internas depende da autenticação de um funcionário ou administrador.

O aplicativo permite confirmar recebimentos, consultar o estoque, registrar saídas e acompanhar o histórico de movimentações.

### 4. Executar o aplicativo mobile

Instale o Expo Go no celular e execute:

```bash
cd mobile
npm ci
npm start
```

Utilize o QR code exibido no terminal para abrir o aplicativo.

Para acessar a API publicada, o dispositivo precisa ter conexão com a internet.

Caso o Expo não consiga estabelecer a conexão de desenvolvimento, verifique a rede utilizada pelo computador e pelo celular.

### 5. Executar o backend localmente (opcional)

O backend também pode ser executado localmente para desenvolvimento e testes.

Nesse caso, é necessário utilizar uma base PostgreSQL preparada com o esquema do DoeFácil.

Na raiz do repositório, inicie o PostgreSQL com Docker:

```bash
docker compose up -d postgres
```

Na primeira inicialização do volume, o Docker Compose aplica o [modelo do banco](database/modelo-logico.sql) e carrega os [dados de exemplo](database/seed.sql).

Crie o arquivo `backend/.env` utilizando como referência [`backend/.env.example`](backend/.env.example).

Configure as variáveis necessárias:

```env
PORT=3000
DATABASE_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/doefacil
JWT_SECRET=SUA_CHAVE_SECRETA_COM_PELO_MENOS_32_CARACTERES
```

Substitua os valores de exemplo pelas configurações do ambiente local.

Em seguida, execute:

```bash
cd backend
npm ci
npm run dev
```

A API local ficará disponível em:

http://localhost:3000

Para conectar as interfaces ao backend local, altere temporariamente as variáveis `VITE_API_URL` e `EXPO_PUBLIC_API_URL`.

No aplicativo mobile, utilize o IPv4 do computador acessível pelo celular, em vez de `localhost`.

## Mineração de dados

Na Sprint 2, o grupo desenvolveu uma etapa de mineração de dados utilizando Python e o algoritmo **K-Means**.

A análise utiliza dados da **Give Food** para realizar o pré-processamento e o agrupamento de instituições sociais com base em suas localizações geográficas.

Foram analisados **1.023 registros**, distribuídos em três grupos, permitindo observar padrões de distribuição das instituições.

Essa etapa é independente da API e do banco de dados operacional do DoeFácil.

Os scripts, os resultados, o notebook e as instruções de execução estão disponíveis na [documentação de mineração de dados](mining/README.md).

## Demonstração do sistema

A demonstração apresenta a integração entre as aplicações Web, Mobile e Desktop com a API REST.

### Fluxo de demonstração

1. **Gerenciamento de campanhas:** entrar no painel web com uma conta de administrador e criar ou localizar uma campanha ativa.
2. **Cadastro de doação:** acessar o sistema como doador, pelo web ou mobile, e cadastrar uma doação de 2 kg de arroz vinculada à campanha.
3. **Consulta de recebimentos:** entrar no desktop como funcionário ou administrador e localizar a doação cadastrada.
4. **Confirmação:** confirmar o recebimento e verificar a atualização do status para `RECEBIDA`.
5. **Atualização do estoque:** consultar o saldo do item e verificar o registro da entrada de 2 kg.
6. **Histórico de movimentações:** consultar a movimentação registrada e as informações do recebimento.
7. **Saída de estoque:** registrar uma saída e verificar a atualização do saldo, respeitando a quantidade disponível.
8. **Acompanhamento pelo doador:** acessar Minhas doações no web ou mobile e verificar a alteração do status para **Recebida**.

### Validação da implantação

Durante os testes da Sprint 3, a API publicada na AWS Elastic Beanstalk foi validada com o banco PostgreSQL hospedado no Neon.

As verificações documentadas contemplaram os endpoints:

- `/api/status`
- `/api/health`
- `/api/campanhas`

O fluxo de autenticação e a integração entre as interfaces foram testados no ambiente local.

A validação dos endpoints públicos não representa uma validação completa de todos os fluxos autenticados no ambiente publicado.

## Testes e validações

O projeto possui testes automatizados no backend e verificações de compilação das interfaces.

### Backend

Na pasta `backend/`, instale as dependências, caso ainda não tenha feito isso:

```bash
npm ci
```

Depois, execute:

```bash
npm test
```

Os testes devem utilizar uma base PostgreSQL isolada, chamada `doefacil_testes`, preparada com o esquema necessário.

**Não execute os testes utilizando a base de produção ou a base principal com dados que precisam ser preservados.**

Na validação realizada, foram executados **80 testes automatizados, todos aprovados**. Essa quantidade corresponde à versão verificada e pode mudar conforme novos testes sejam adicionados ao projeto.

A cobertura contempla funcionalidades relacionadas a:

- Autenticação e autorização;
- Campanhas;
- Doações;
- Usuários;
- Indicadores;
- Recebimentos;
- Saídas de estoque;
- Histórico de movimentações.

Entre os cenários verificados estão operações sem autorização, tentativas de recebimento duplicado, validações de saldo insuficiente e controle de operações simultâneas no estoque.

### Frontend Web

Na pasta `frontend-web/`, instale as dependências, caso necessário, e execute:

```bash
npm ci
npm run build
npm run lint
```

### Desktop

Na pasta `desktop/`, instale as dependências, caso necessário, e execute:

```bash
npm ci
npm run build
```

### Mobile

Na pasta `mobile/`, instale as dependências, caso necessário, e execute:

```bash
npm ci
npx expo export
```

### Banco de dados

O PostgreSQL armazena as informações de usuários, campanhas, doações, itens e movimentações de estoque.

O projeto contempla restrições de integridade, índices e procedimentos de validação de backup e restauração do banco de dados.

## Tecnologias utilizadas

| Área | Tecnologias |
| --- | --- |
| Backend | Node.js, Express e TypeScript |
| Banco de dados | PostgreSQL e Neon |
| Frontend Web | React, TypeScript e Vite |
| Mobile | React Native e Expo |
| Desktop | Electron, React e TypeScript |
| Autenticação | JSON Web Token (JWT) |
| Infraestrutura | Docker, AWS Elastic Beanstalk e HTTPS |
| Documentação da API | OpenAPI e Swagger |
| Mineração de dados | Python e K-Means |
| Controle de versão | Git e GitHub |

## Documentação complementar

Para informações específicas sobre cada módulo, consulte:

- [Documentação do frontend web](frontend-web/README.md)
- [Mineração de dados](mining/README.md)
- [Documentação da Sprint 2](docs/sprint2/)
- [Modelo do banco de dados](database/modelo-logico.sql)
- [Documentação Swagger da API](https://doefacil.duckdns.org/docs)

---

**DoeFácil — Projeto Interdisciplinar | DSM — Fatec Franca | 2026/2 | Grupo 06**