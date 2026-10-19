
import RecebimentosSprint2 from "./components/RecebimentosSprint2";
import "./App.css";

function App() {
  return (
    <div className="aplicacao">
      <aside className="menu-lateral">
        <h1>DoeFácil</h1>
        <p>Controle interno</p>

        <nav>
          <button className="selecionado">
            Recebimentos
          </button>
          <button disabled>Estoque</button>
          <button disabled>Movimentações</button>
          <button disabled>Campanhas</button>
        </nav>
      </aside>

      <main className="area-principal">
        <header>
          <div>
            <h2>Recebimento de doações</h2>
            <p>
              Confirme as doações entregues na instituição.
            </p>
          </div>

          <button className="botao-entrada" disabled>
            Registrar entrada
          </button>
        </header>

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
      </main>
    </div>
  );
}

export default App;
