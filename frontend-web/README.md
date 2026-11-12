# DoeFácil — Painel web

O painel web permite que a administração gerencie campanhas e que doadores cadastrem e acompanhem suas doações.

## Iniciar o backend

Use Node.js 24 com npm. O ensaio usa uma base PostgreSQL já preparada com o [modelo do DoeFácil](../database/modelo-logico.sql), uma conta administradora e uma conta doadora de teste.

1. Crie `backend/.env` com base em [`backend/.env.example`](../backend/.env.example). Use `PORT=3000`, preencha `DATABASE_URL` com a conexão da base de teste e defina um `JWT_SECRET` de pelo menos 32 caracteres. Guarde esses valores no arquivo local.
2. Em um terminal na raiz do repositório, rode:

   ```sh
   cd backend
   npm ci
   npm run dev
   ```

3. Mantenha o terminal aberto e acesse [`/api/health`](http://localhost:3000/api/health). A resposta esperada é `{"banco":"conectado"}`.

## Iniciar o painel web

Na pasta `frontend-web`, crie um arquivo chamado `.env` com o endereço da API local. Inclua o sufixo `/api`.

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Em outro terminal na raiz do repositório, rode:

```sh
cd frontend-web
npm ci
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) e clique em **Entrar** com sua conta de administrador ou doador. O sistema abre a área correspondente ao perfil da conta. Como doador, escolha um item e informe a quantidade em **Nova doação**. Você pode vincular a doação a uma campanha ativa e acompanhar a situação em **Minhas doações**.

Enquanto a doação estiver **Aguardando recebimento**, use **Editar** para alterar quantidades e observação ou **Cancelar doação** para cancelar o registro. A edição mantém os itens e a campanha escolhidos no cadastro.

Se mudar o `VITE_API_URL`, reinicie o Vite. Se o Vite usar outra porta, ajuste `CORS_ORIGINS` no `backend/.env` e reinicie o backend. Para o painel na porta `5174` e o desktop na porta `4173`, use `CORS_ORIGINS=http://localhost:5174,http://localhost:4173`.

## Ensaiar a demonstração da Sprint 3

Use o mesmo backend local no web, no desktop e no iPhone. Inicie o desktop com `npm ci` e `npm run dev` na pasta `desktop`. No iPhone, conecte-se ao mesmo Wi-Fi do computador. Em `mobile/.env`, defina `EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:3000/api` com o IPv4 atual do computador. Na pasta `mobile`, rode `npm ci` e `npm start`, depois abra o QR code no Expo Go. Se o IP mudar, ajuste o arquivo e reinicie o Expo.

1. **Web.** Entre como administradora, abra **Campanhas** e mostre a campanha ativa **Ensaio final — Sprint 3**. Se ela ainda não existir na base de teste, cadastre uma campanha de ensaio com período vigente.
2. **Mobile.** Entre como doadora e cadastre uma nova doação de 2 kg de arroz vinculada à campanha. Anote o número da doação.
3. **Desktop.** Entre com uma conta de administração ou de funcionário. Em **Recebimentos**, confira o saldo de arroz em **Estoque persistido**, localize a doação pelo número e clique em **Confirmar recebimento**. Verifique o status `RECEBIDA` e o acréscimo de 2 kg ao saldo anterior.
4. **Mobile.** Em **Minhas doações**, toque em **Atualizar lista**. A mesma doação deve aparecer como **Recebida**, sem os botões **Editar** e **Cancelar doação**.

Para mostrar a API publicada, abra `/api/health` e `/api/campanhas` no domínio exibido no Elastic Beanstalk. Faça o login e o fluxo de doação no ambiente local.
