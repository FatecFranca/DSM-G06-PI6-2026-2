# DoeFácil — Mobile

O aplicativo Mobile do DoeFácil permite que doadores participem das campanhas de arrecadação e acompanhem suas doações diretamente pelo celular.

Desenvolvido com **React Native, Expo e TypeScript**, o aplicativo utiliza a API REST do DoeFácil para autenticação, consulta de campanhas e gerenciamento das doações.

Este módulo faz parte do Projeto Interdisciplinar do 6º semestre de Desenvolvimento de Software Multiplataforma (DSM) da Fatec Franca — Grupo 06.

## Funcionalidades

O aplicativo é destinado aos usuários com perfil de doador.

| Funcionalidade | Descrição |
| --- | --- |
| Cadastro | Criação de uma conta com nome, e-mail e senha. |
| Login | Autenticação de usuários com perfil de doador. |
| Campanhas | Consulta das campanhas ativas para vincular uma doação. |
| Cadastro de doações | Registro de itens e quantidades, com campanha e observação opcionais. |
| Minhas doações | Consulta das doações realizadas pelo usuário. |
| Acompanhamento | Visualização da situação de cada doação. |
| Edição | Alteração de quantidades e observação antes do recebimento. |
| Cancelamento | Cancelamento de doações que ainda aguardam recebimento. |
| Logout | Encerramento da sessão do usuário. |

### Fluxo de doação

Após criar uma conta e realizar o login, o doador pode selecionar um item, informar a quantidade e, opcionalmente, vincular a doação a uma campanha ativa.

Uma nova doação é cadastrada com um item e fica inicialmente com o status **Aguardando recebimento**.

Enquanto estiver nessa situação, o doador poderá editar a quantidade e a observação ou cancelar o registro.

Quando a instituição confirmar o recebimento pelo aplicativo Desktop, a doação passará a aparecer como **Recebida**.

O histórico também mantém os registros de doações canceladas.

### Situações das doações

| Status na API | Exibição no aplicativo |
| --- | --- |
| `CADASTRADA` | Aguardando recebimento |
| `RECEBIDA` | Recebida |
| `CANCELADA` | Cancelada |

## Tecnologias utilizadas

| Tecnologia | Utilização |
| --- | --- |
| React Native | Desenvolvimento da interface mobile. |
| Expo | Execução e ferramentas de desenvolvimento. |
| React | Construção dos componentes. |
| TypeScript | Tipagem estática do código. |
| Expo SecureStore | Armazenamento do token de autenticação. |
| API REST | Comunicação com o backend. |
| JWT | Autenticação das requisições. |

## Requisitos

Para executar o aplicativo, é necessário ter:

- Node.js 24 e npm;
- Um celular compatível com o ambiente de desenvolvimento Expo ou um emulador configurado;
- Expo Go, quando compatível com a versão do SDK utilizada;
- Acesso à internet para comunicação com a API publicada.

## Configuração do ambiente

Na pasta `mobile/`, crie ou configure o arquivo `.env`:

```env
EXPO_PUBLIC_API_URL=https://doefacil.duckdns.org/api
```

Essa variável define o endereço da API utilizada pelo aplicativo.

O arquivo `.env` contém configurações específicas do ambiente e não deve ser enviado ao repositório.

Como o endereço é utilizado pelo aplicativo cliente, a variável `EXPO_PUBLIC_API_URL` não deve conter senhas, tokens ou outros dados secretos.

## Executando o aplicativo

Na raiz do repositório, acesse a pasta do Mobile:

```powershell
cd mobile
```

Instale as dependências:

```powershell
npm ci
```

Inicie o Expo:

```powershell
npm start
```

O terminal exibirá as opções disponíveis para executar o aplicativo.

Para utilizar um celular físico, abra o Expo Go e siga as instruções apresentadas pelo Expo. A compatibilidade depende da versão do SDK e do aplicativo instalado no dispositivo.

Também estão disponíveis os comandos:

| Comando | Finalidade |
| --- | --- |
| `npm start` | Iniciar o servidor Expo. |
| `npm run android` | Iniciar a execução para Android. |
| `npm run ios` | Iniciar a execução para iOS. |
| `npm run web` | Iniciar a versão Web pelo Expo. |

A execução para Android ou iOS pode exigir ferramentas e ambientes adicionais, conforme a plataforma escolhida.

## Validação

Para verificar a geração dos arquivos da aplicação pelo Expo:

```powershell
npx expo export
```

Esse comando gera uma exportação do projeto, mas não cria automaticamente um APK ou instalador para distribuição.

## Integração com a API

O aplicativo utiliza a variável `EXPO_PUBLIC_API_URL` para acessar o backend do DoeFácil.

As principais operações utilizadas são:

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| POST | `/auth/cadastro` | Cadastrar doador. |
| POST | `/auth/login` | Autenticar usuário. |
| GET | `/campanhas?status=ATIVA` | Consultar campanhas ativas. |
| GET | `/itens` | Consultar itens disponíveis. |
| GET | `/doacoes/minhas` | Consultar doações do usuário. |
| POST | `/doacoes` | Cadastrar doação. |
| PUT | `/doacoes/:id` | Atualizar doação. |
| DELETE | `/doacoes/:id` | Cancelar doação. |

Após o login, o token JWT é armazenado com o Expo SecureStore e enviado nas requisições autenticadas.

Quando uma requisição autenticada recebe uma resposta HTTP 401, o aplicativo trata a expiração da sessão e solicita que o usuário entre novamente.

As requisições possuem tempo limite de 12 segundos e tratamento de erros de comunicação.

A documentação dos endpoints está disponível no [Swagger do DoeFácil](https://doefacil.duckdns.org/docs).

## Estrutura principal

```text
mobile/
├── assets/
├── src/
│   ├── components/
│   │   ├── Campanhas.tsx
│   │   ├── DoacoesSprint2.tsx
│   │   └── PainelDoacoes.tsx
│   └── services/
│       └── api.ts
├── App.tsx
├── index.ts
├── app.json
├── package.json
└── .env.example
```

O componente `DoacoesSprint2.tsx` concentra as telas de cadastro e autenticação e apresenta o painel de doações após o login.

O `PainelDoacoes.tsx` reúne as operações de cadastro, consulta, edição e cancelamento das doações, utilizando o componente `Campanhas.tsx` para a seleção de campanhas.

O arquivo `api.ts` centraliza a comunicação com o backend.

## Documentação complementar

- [README principal do DoeFácil](../README.md)
- [Backend](../backend/)
- [Frontend Web](../frontend-web/)
- [Desktop](../desktop/)
- [Documentação Swagger](https://doefacil.duckdns.org/docs)

---

**DoeFácil — Projeto Interdisciplinar | DSM — Fatec Franca | 2026/2 | Grupo 06**