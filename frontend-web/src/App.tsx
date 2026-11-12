import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import CampanhasSprint2 from "./components/CampanhasSprint2";
import PainelDoador from "./components/PainelDoador";
import { api } from "./services/api";
import "./App.css";

type Perfil = "ADMINISTRADOR" | "DOADOR";

function App() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  const encerrarSessao = useCallback((mensagem = "") => {
    sessionStorage.removeItem("doefacil_token");
    setPerfil(null);
    setErro(mensagem);
  }, []);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (entrando) return;

    const formulario = new FormData(evento.currentTarget);
    const email = String(formulario.get("email")).trim().toLowerCase();
    const senha = String(formulario.get("senha"));

    setEntrando(true);
    setErro("");

    try {
      const resposta = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha })
      });

      const perfilRecebido = resposta?.usuario?.perfil;
      if (perfilRecebido !== "ADMINISTRADOR" && perfilRecebido !== "DOADOR") {
        throw new Error("Use uma conta de administrador ou doador.");
      }
      if (typeof resposta.token !== "string" || !resposta.token) {
        throw new Error("Não foi possível iniciar a sessão.");
      }

      sessionStorage.setItem("doefacil_token", resposta.token);
      setPerfil(perfilRecebido);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível entrar.");
    } finally {
      setEntrando(false);
    }
  }

  const titulo = perfil === "ADMINISTRADOR"
    ? "Painel Administrativo"
    : perfil === "DOADOR"
      ? "Área do doador"
      : "Acesse sua conta";
  const secao = perfil === "DOADOR" ? "doacoes" : "campanhas";

  return (
    <div className="pagina">
      <aside className="menu">
        <h1>DoeFácil</h1>
        <p>{perfil === "ADMINISTRADOR" ? "Painel administrativo" : "Campanhas e doações"}</p>
        <nav aria-label="Navegação do painel">
          <button
            type="button"
            className="ativo"
            onClick={() => document.getElementById(secao)?.scrollIntoView({ behavior: "smooth" })}
          >
            {perfil === "DOADOR" ? "Minhas doações" : "Campanhas"}
          </button>
        </nav>
      </aside>

      <main className="conteudo">
        <header className="cabecalho-painel">
          <h2>{titulo}</h2>
          {perfil && (
            <button type="button" className="botao-sair" onClick={() => encerrarSessao()}>
              Sair
            </button>
          )}
        </header>

        {!perfil && (
          <section className="tabela-container campanhas acesso-web">
            <p>Entre com sua conta.</p>
            {erro && <p role="alert" className="mensagem-erro">{erro}</p>}
            <form className="formulario-campanha" onSubmit={entrar}>
              <label htmlFor="login-email">E-mail</label>
              <input id="login-email" name="email" type="email" autoComplete="username" required disabled={entrando} />
              <label htmlFor="login-senha">Senha</label>
              <input id="login-senha" name="senha" type="password" autoComplete="current-password" required disabled={entrando} />
              <button disabled={entrando}>{entrando ? "Entrando…" : "Entrar"}</button>
            </form>
          </section>
        )}

        {perfil === "DOADOR" ? (
          <PainelDoador aoExpirar={encerrarSessao} />
        ) : (
          <div id="campanhas">
            <CampanhasSprint2
              key={perfil}
              administrador={perfil === "ADMINISTRADOR"}
              aoExpirar={encerrarSessao}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
