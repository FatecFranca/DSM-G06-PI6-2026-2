import CampanhasSprint2 from "./components/CampanhasSprint2";
import "./App.css";

function App() {
  function abrirCampanhas() {
    document.getElementById("campanhas")?.scrollIntoView({
      behavior: "smooth"
    });
  }

  return (
    <div className="pagina">
      <aside className="menu">
        <h1>DoeFácil</h1>
        <p>Painel administrativo</p>

        <nav aria-label="Navegação do painel">
          <button
            type="button"
            className="ativo"
            onClick={abrirCampanhas}
          >
            Campanhas
          </button>
        </nav>
      </aside>

      <main className="conteudo">
        <header>
          <div>
            <h2>Painel Administrativo</h2>
            <p>Gerencie as campanhas da instituição.</p>
          </div>
        </header>

        <div id="campanhas">
          <CampanhasSprint2 />
        </div>
      </main>
    </div>
  );
}

export default App;