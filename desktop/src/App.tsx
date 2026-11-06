
import { useState, type FormEvent } from "react";
import RecebimentosSprint2 from "./components/Recebimentos";
import SaidasEstoque from "./components/SaidasEstoque";
import HistoricoMovimentacoes from "./components/HistoricoMovimentacoes";
import GerenciamentoUsuarios from "./components/GerenciamentoUsuarios";
import { api } from "./services/api";
import "./App.css";

type Tela = "recebimentos" | "estoque" | "movimentacoes" | "usuarios";
type Perfil = "FUNCIONARIO" | "ADMINISTRADOR";

const informacoes = {
  recebimentos: {
    titulo: "Recebimento de doações",
    descricao: "Confirme as doações entregues na instituição."
  },
  estoque: {
    titulo: "Controle de estoque",
    descricao: "Consulte os saldos e registre saídas de itens."
  },
  movimentacoes: {
    titulo: "Histórico de movimentações",
    descricao: "Consulte as entradas e saídas do estoque."
  },
  usuarios: {
    titulo: "Gerenciamento de usuários",
    descricao: "Consulte e cadastre funcionários e administradores."
  }
};

function App() {
  const [tela, setTela] = useState<Tela>("recebimentos");
  const [logado, setLogado] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");
    setCarregando(true);

    try {
      const resposta = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha })
      });

      const perfilUsuario = resposta.usuario.perfil;

      if (
        perfilUsuario !== "FUNCIONARIO" &&
        perfilUsuario !== "ADMINISTRADOR"
      ) {
        throw new Error(
          "Acesso permitido apenas para funcionários e administradores."
        );
      }

      sessionStorage.setItem("doefacil_token", resposta.token);
      setPerfil(perfilUsuario);
      setLogado(true);
      setTela("recebimentos");
      setSenha("");
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Erro ao entrar."
      );
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    sessionStorage.removeItem("doefacil_token");
    setLogado(false);
    setPerfil(null);
    setTela("recebimentos");
    setEmail("");
    setSenha("");
    setMensagem("");
  }

  const pagina = informacoes[tela];

  return (
    <div className="aplicacao">
      <aside className="menu-lateral">
        <h1>DoeFácil</h1>
        <p>Controle interno</p>

        <nav>
          <button
            type="button"
            className={tela === "recebimentos" ? "selecionado" : ""}
            onClick={() => setTela("recebimentos")}
            disabled={!logado}
          >
            Recebimentos
          </button>

          <button
            type="button"
            className={tela === "estoque" ? "selecionado" : ""}
            onClick={() => setTela("estoque")}
            disabled={!logado}
          >
            Estoque
          </button>

          <button
            type="button"
            className={tela === "movimentacoes" ? "selecionado" : ""}
            onClick={() => setTela("movimentacoes")}
            disabled={!logado}
          >
            Movimentações
          </button>

          {logado && perfil === "ADMINISTRADOR" && (
            <button
              type="button"
              className={tela === "usuarios" ? "selecionado" : ""}
              onClick={() => setTela("usuarios")}
            >
              Usuários
            </button>
          )}

          <button type="button" disabled>
            Campanhas
          </button>
        </nav>
      </aside>

      <main className="area-principal">
        <header>
          <div>
            <h2>{pagina.titulo}</h2>
            <p>{pagina.descricao}</p>
          </div>

          {logado && (
            <button
              type="button"
              className="botao-entrada"
              onClick={sair}
            >
              Sair
            </button>
          )}
        </header>

        {!logado ? (
          <section className="painel" style={{ marginTop: 28 }}>
            <h3>Acesso ao sistema</h3>
            <p>Entre com uma conta de funcionário ou administrador.</p>

            <form onSubmit={(evento) => void entrar(evento)}>
              <p>
                <label htmlFor="email">E-mail</label>
              </p>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                required
              />

              <p>
                <label htmlFor="senha">Senha</label>
              </p>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                required
              />

              <p>
                <button type="submit" disabled={carregando}>
                  {carregando ? "Entrando..." : "Entrar"}
                </button>
              </p>
            </form>

            <p role="status">{mensagem}</p>
          </section>
        ) : (
          <>
            {tela === "recebimentos" && (
              <>
                <section className="resumo">
                  <article>
                    <span>Aguardando recebimento</span>
                    <strong>-</strong>
                  </article>

                  <article>
                    <span>Recebidas hoje</span>
                    <strong>-</strong>
                  </article>

                  <article className="alerta">
                    <span>Itens com estoque baixo</span>
                    <strong>-</strong>
                  </article>
                </section>

                <div className="grade">
                  <RecebimentosSprint2 />
                </div>
              </>
            )}

            {tela === "estoque" && (
              <div style={{ marginTop: 28 }}>
                <SaidasEstoque />
              </div>
            )}

            {tela === "movimentacoes" && (
              <div style={{ marginTop: 28 }}>
                <HistoricoMovimentacoes />
              </div>
            )}

            {tela === "usuarios" && perfil === "ADMINISTRADOR" && (
              <div style={{ marginTop: 28 }}>
                <GerenciamentoUsuarios />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
