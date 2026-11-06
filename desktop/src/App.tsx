
import { useCallback, useEffect, useState, type FormEvent } from "react";

import RecebimentosSprint2 from "./components/Recebimentos";
import SaidasEstoque from "./components/SaidasEstoque";
import HistoricoMovimentacoes from "./components/HistoricoMovimentacoes";
import GerenciamentoUsuarios from "./components/GerenciamentoUsuarios";
import Campanhas from "./components/Campanhas";

import { api } from "./services/api";
import "./App.css";

type Tela =
  | "recebimentos"
  | "estoque"
  | "movimentacoes"
  | "usuarios"
  | "campanhas";

type Perfil = "FUNCIONARIO" | "ADMINISTRADOR";

type ResumoEstoque = {
  aguardando_recebimento: number;
  recebidas_hoje: number;
  itens_estoque_baixo: number;
};

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
  },
  campanhas: {
    titulo: "Campanhas",
    descricao: "Consulte e gerencie as campanhas da instituição."
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

  const [resumo, setResumo] = useState<ResumoEstoque | null>(null);
  const [erroResumo, setErroResumo] = useState("");
  const [carregandoResumo, setCarregandoResumo] = useState(false);

  // Consulta os indicadores reais do backend.
  const carregarResumo = useCallback(async () => {
    setCarregandoResumo(true);

    try {
      const dados: ResumoEstoque = await api("/estoque/resumo");

      setResumo(dados);
      setErroResumo("");
    } catch (erro) {
      setErroResumo(
        erro instanceof Error
          ? erro.message
          : "Erro ao carregar os indicadores."
      );
    } finally {
      setCarregandoResumo(false);
    }
  }, []);

  // Atualiza os indicadores ao acessar Recebimentos.
  useEffect(() => {
    if (logado && tela === "recebimentos") {
      void carregarResumo();
    }
  }, [logado, tela, carregarResumo]);

  // Autenticação do funcionário ou administrador.
  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (carregando) return;

    setMensagem("");

    const emailInformado = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInformado) ||
      emailInformado.length > 150 ||
      senha.length < 8 ||
      new TextEncoder().encode(senha).length > 72
    ) {
      setMensagem("E-mail ou senha incorretos.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: emailInformado,
          senha
        })
      });

      const perfilUsuario: Perfil = resposta.usuario.perfil;

      if (
        perfilUsuario !== "FUNCIONARIO" &&
        perfilUsuario !== "ADMINISTRADOR"
      ) {
        setMensagem("Acesso não autorizado para este perfil.");
        return;
      }

      sessionStorage.setItem("doefacil_token", resposta.token);

      setPerfil(perfilUsuario);
      setLogado(true);
      setTela("recebimentos");

      setResumo(null);
      setErroResumo("");
      setSenha("");
      setMensagem("");
    } catch (erro) {
      if (erro instanceof TypeError) {
        setMensagem("Não foi possível conectar ao servidor.");
      } else if (
        erro instanceof Error &&
        (
          erro.message === "E-mail ou senha incorretos." ||
          erro.message === "Informe um e-mail válido." ||
          erro.message === "Use pelo menos 8 caracteres na senha." ||
          erro.message === "A senha é muito longa. Use uma senha menor."
        )
      ) {
        setMensagem("E-mail ou senha incorretos.");
      } else {
        setMensagem("Não foi possível realizar o login. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  }

  // Encerra a sessão e limpa os dados do usuário.
  function sair() {
    sessionStorage.removeItem("doefacil_token");

    setLogado(false);
    setPerfil(null);
    setTela("recebimentos");

    setEmail("");
    setSenha("");
    setMensagem("");

    setResumo(null);
    setErroResumo("");
    setCarregandoResumo(false);
  }

  const pagina = informacoes[tela];

  return (
    <div className="aplicacao">
      {/* Menu lateral */}
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

          <button
            type="button"
            className={tela === "campanhas" ? "selecionado" : ""}
            onClick={() => setTela("campanhas")}
            disabled={!logado}
          >
            Campanhas
          </button>
        </nav>
      </aside>

      {/* Conteúdo principal */}
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
          // Tela de login.
          <section className="painel" style={{ marginTop: 28 }}>
            <h3>Acesso ao sistema</h3>

            <p>
              Entre com uma conta de funcionário ou administrador.
            </p>

            <form
              noValidate
              onSubmit={(evento) => void entrar(evento)}
            >
              <p>
                <label htmlFor="email">E-mail</label>
              </p>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                autoComplete="username"
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
                autoComplete="current-password"
                required
              />

              <p>
                <button type="submit" disabled={carregando}>
                  {carregando ? "Entrando..." : "Entrar"}
                </button>
              </p>
            </form>

            {mensagem && (
              <p role="alert">{mensagem}</p>
            )}
          </section>
        ) : (
          <>
            {/* Recebimentos e indicadores */}
            {tela === "recebimentos" && (
              <>
                <section className="resumo">
                  <article>
                    <span>Aguardando recebimento</span>
                    <strong>
                      {resumo?.aguardando_recebimento ?? "-"}
                    </strong>
                  </article>

                  <article>
                    <span>Recebidas hoje</span>
                    <strong>
                      {resumo?.recebidas_hoje ?? "-"}
                    </strong>
                  </article>

                  <article className="alerta">
                    <span>Itens com estoque baixo</span>
                    <strong>
                      {resumo?.itens_estoque_baixo ?? "-"}
                    </strong>
                  </article>
                </section>

                {carregandoResumo && (
                  <p role="status">Atualizando indicadores...</p>
                )}

                {erroResumo && (
                  <p role="alert">{erroResumo}</p>
                )}

                <div className="grade">
                  <RecebimentosSprint2
                    onAtualizar={carregarResumo}
                  />
                </div>
              </>
            )}

            {/* Controle de estoque */}
            {tela === "estoque" && (
              <div style={{ marginTop: 28 }}>
                <SaidasEstoque />
              </div>
            )}

            {/* Histórico de movimentações */}
            {tela === "movimentacoes" && (
              <div style={{ marginTop: 28 }}>
                <HistoricoMovimentacoes />
              </div>
            )}

            {/* Gerenciamento de usuários */}
            {tela === "usuarios" &&
              perfil === "ADMINISTRADOR" && (
                <div style={{ marginTop: 28 }}>
                  <GerenciamentoUsuarios />
                </div>
              )}

            {/* Gerenciamento de campanhas */}
            {tela === "campanhas" && perfil && (
              <div style={{ marginTop: 28 }}>
                <Campanhas perfil={perfil} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
