# DoeFácil — Frontend Web

O Frontend Web do DoeFácil permite que doadores participem de campanhas de arrecadação, registrem e acompanhem suas doações. Também oferece funcionalidades administrativas para o gerenciamento das campanhas.

Desenvolvido com **React, TypeScript e Vite**, o painel utiliza a API REST do DoeFácil para autenticação e gerenciamento das informações.

Este módulo faz parte do Projeto Interdisciplinar do 6º semestre de Desenvolvimento de Software Multiplataforma (DSM) da Fatec Franca — Grupo 06.

## Funcionalidades

As funcionalidades são disponibilizadas conforme o perfil do usuário autenticado.

| Funcionalidade | Descrição |
| --- | --- |
| Autenticação | Acesso ao sistema com as permissões correspondentes ao perfil do usuário. |
| Cadastro de doadores | Criação de contas para participação nas campanhas. |
| Consulta de campanhas | Visualização das campanhas disponíveis para doação. |
| Gerenciamento de campanhas | Cadastro, edição e cancelamento de campanhas por administradores. |
| Cadastro de doações | Registro de itens e quantidades, com possibilidade de vinculação a uma campanha. |
| Minhas doações | Consulta e acompanhamento das doações realizadas. |
| Edição de doações | Alteração de quantidades e observações antes do recebimento. |
| Cancelamento de doações | Cancelamento de registros que ainda aguardam recebimento. |

### Fluxo de doações

Após realizar o login, o doador pode selecionar um item, informar a quantidade e, opcionalmente, vincular a doação a uma campanha ativa.

A doação fica inicialmente com o status **Aguardando recebimento**.

Enquanto estiver nessa situação, o doador pode editar as quantidades e a observação ou cancelar o registro. A edição mantém os itens e a campanha originalmente associados à doação.

Quando a instituição confirma o recebimento pelo aplicativo Desktop, o status é atualizado para **Recebida**.

O acompanhamento pode ser realizado pela seção **Minhas doações**.

## Tecnologias utilizadas

| Tecnologia | Utilização |
| --- | --- |
| React | Construção da interface Web. |
| TypeScript | Desenvolvimento com tipagem estática. |
| Vite | Ambiente de desenvolvimento e geração do build. |
| API REST | Comunicação com o backend do DoeFácil. |
| JWT | Autenticação e controle de acesso. |

## Requisitos

Para executar o painel Web, é necessário ter:

- Node.js 24 e npm;
- Navegador atualizado;
- Acesso à internet para utilizar a API publicada;
- Uma conta de usuário para acessar as funcionalidades autenticadas.

## Configuração do ambiente

Na pasta `frontend-web/`, crie ou configure o arquivo `.env`:

```env
VITE_API_URL=https://doefacil.duckdns.org/api
```

Essa variável define o endereço da API utilizada pelo frontend.

O arquivo `.env` contém configurações específicas do ambiente e não deve ser enviado ao repositório.

Caso o endereço da API seja alterado, reinicie o servidor Vite para aplicar a nova configuração.

## Executando o frontend

Na raiz do repositório, acesse a pasta do frontend:

```powershell
cd frontend-web
```

Instale as dependências:

```powershell
npm ci
```

Inicie o ambiente de desenvolvimento:

```powershell
npm run dev
```

Abra no navegador:

http://localhost:5173

Na tela inicial, selecione **Entrar** e utilize uma conta de administrador ou doador.

O sistema apresenta as funcionalidades correspondentes ao perfil autenticado.

## Build e validação

Para verificar o TypeScript e gerar o build do frontend:

```powershell
npm run build
```

Para executar a verificação de lint:

```powershell
npm run lint
```

Esses comandos auxiliam na identificação de problemas antes da entrega.

## Backend local (opcional)

O frontend também pode ser executado com uma instância local da API.

Para isso, é necessário configurar o backend e utilizar uma base PostgreSQL preparada com o [modelo do DoeFácil](../database/modelo-logico.sql).

Crie o arquivo `backend/.env` com base em [`backend/.env.example`](../backend/.env.example), configurando:

- `PORT=3000`;
- `DATABASE_URL` com a conexão do PostgreSQL;
- `JWT_SECRET` com pelo menos 32 caracteres;
- `CORS_ORIGINS` com as origens autorizadas, quando necessário.

Na pasta `backend/`, execute:

```powershell
npm ci
npm run dev
```

Com o backend em execução, configure o arquivo `frontend-web/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

Reinicie o frontend após alterar a variável.

Para verificar a conexão com o banco de dados, acesse:

http://localhost:3000/api/health

Com o banco conectado, a resposta esperada é:

```json
{
  "banco": "conectado"
}
```

Caso o frontend utilize outra porta, configure a origem correspondente em `CORS_ORIGINS` e reinicie o backend.

Por exemplo, para o frontend na porta 5174 e o Desktop na porta 4173:

```env
CORS_ORIGINS=http://localhost:5174,http://localhost:4173
```

As instruções gerais de configuração do ambiente também estão disponíveis no [README principal](../README.md).

## Integração com o sistema

O Frontend Web utiliza a mesma API REST acessada pelas aplicações Mobile e Desktop.

A API centraliza a autenticação, as regras de negócio e as operações realizadas no banco de dados PostgreSQL.

O frontend não acessa diretamente o banco de dados. As consultas e atualizações são realizadas por meio dos endpoints disponibilizados pelo backend.

A API publicada está disponível em:

https://doefacil.duckdns.org

A documentação dos endpoints pode ser consultada no [Swagger do DoeFácil](https://doefacil.duckdns.org/docs).

## Demonstração do sistema

O roteiro de demonstração integrada do DoeFácil, envolvendo as aplicações Web, Mobile e Desktop, está disponível no [README principal](../README.md).

O roteiro apresenta o fluxo desde o cadastro de uma campanha e de uma doação até a confirmação do recebimento e a atualização do estoque.

## Documentação complementar

- [README principal do DoeFácil](../README.md)
- [Backend](../backend/)
- [Desktop](../desktop/README.md)
- [Mobile](../mobile/README.md)
- [Documentação Swagger](https://doefacil.duckdns.org/docs)

---

**DoeFácil — Projeto Interdisciplinar | DSM — Fatec Franca | 2026/2 | Grupo 06**