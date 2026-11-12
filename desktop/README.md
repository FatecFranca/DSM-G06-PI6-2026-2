# DoeFácil — Desktop

O aplicativo Desktop do DoeFácil é responsável pelas operações internas da instituição, permitindo que funcionários e administradores acompanhem doações, confirmem recebimentos e controlem as movimentações de estoque.

Desenvolvido com **Electron, React e TypeScript**, o aplicativo se comunica com a API REST do DoeFácil para consultar e atualizar as informações do sistema.

Este módulo faz parte do Projeto Interdisciplinar do 6º semestre de Desenvolvimento de Software Multiplataforma (DSM) da Fatec Franca — Grupo 06.

## Funcionalidades

O aplicativo disponibiliza funcionalidades conforme o perfil do usuário autenticado.

| Funcionalidade | Descrição |
| --- | --- |
| Autenticação | Acesso ao sistema por funcionários e administradores. |
| Recebimentos | Consulta de doações pendentes e confirmação do recebimento dos itens. |
| Estoque | Consulta dos itens cadastrados e seus respectivos saldos. |
| Saídas de estoque | Registro de retiradas, respeitando a quantidade disponível. |
| Histórico de movimentações | Consulta das entradas e saídas registradas no sistema. |
| Gerenciamento de usuários | Funcionalidades administrativas relacionadas aos usuários do sistema. |

### Fluxo de recebimento

Quando um doador registra uma doação pelo Web ou Mobile, ela fica com o status **Aguardando recebimento**.

Pelo Desktop, um funcionário ou administrador pode localizar a doação e confirmar seu recebimento.

Após a confirmação, a API atualiza o status da doação para **Recebida** e registra a entrada dos itens no estoque.

As movimentações podem ser consultadas posteriormente pelo histórico.

## Tecnologias utilizadas

| Tecnologia | Utilização |
| --- | --- |
| Electron | Execução da aplicação desktop. |
| React | Construção da interface. |
| TypeScript | Desenvolvimento com tipagem estática. |
| Vite | Ambiente de desenvolvimento e geração do build. |
| API REST | Comunicação com o backend do DoeFácil. |
| JWT | Autenticação e controle de acesso. |

## Requisitos

Para executar o aplicativo, é necessário ter:

- Node.js 24 e npm;
- Acesso à internet para utilizar a API publicada;
- Um usuário autorizado, com perfil de funcionário ou administrador.

## Configuração do ambiente

Na pasta `desktop/`, crie ou configure o arquivo `.env`:

```env
VITE_API_URL=https://doefacil.duckdns.org/api
```

Essa variável define o endereço da API utilizada pelo aplicativo.

O arquivo `.env` contém configurações específicas do ambiente e não deve ser enviado ao repositório.

## Executando o aplicativo

Na raiz do repositório, acesse a pasta do Desktop:

```powershell
cd desktop
```

Instale as dependências:

```powershell
npm ci
```

Inicie o ambiente de desenvolvimento:

```powershell
npm run dev
```

O comando inicia o Vite e abre a aplicação no Electron.

O projeto está configurado para aguardar o servidor de desenvolvimento em `http://localhost:4173` antes de iniciar a janela do aplicativo.

## Build e validação

Para verificar o TypeScript e gerar o build do frontend:

```powershell
npm run build
```

Para visualizar o resultado do build pelo Vite:

```powershell
npm run preview
```

O comando de build não gera, por si só, um instalador executável do Electron.

## Integração com o sistema

O Desktop utiliza a mesma API REST acessada pelas aplicações Web e Mobile.

A API centraliza a autenticação, as regras de negócio e as operações no banco de dados PostgreSQL.

O aplicativo não acessa diretamente o banco de dados. As consultas e atualizações são realizadas por meio dos endpoints disponibilizados pelo backend.

A documentação dos endpoints está disponível no [Swagger do DoeFácil](https://doefacil.duckdns.org/docs).

## Documentação complementar

- [README principal do DoeFácil](../README.md)
- [Backend](../backend/)
- [Frontend Web](../frontend-web/)
- [Mobile](../mobile/)
- [Documentação Swagger](https://doefacil.duckdns.org/docs)

---

**DoeFácil — Projeto Interdisciplinar | DSM — Fatec Franca | 2026/2 | Grupo 06**