import CampanhasSprint2 from "./components/CampanhasSprint2";
import "./App.css";

function App() {
  return (
    <div className="pagina">
      <aside className="menu">
        <h1>DoeFácil</h1>
        <p>Painel administrativo</p>

        <nav>
          <button className="ativo">Visão geral</button>
          <button>Campanhas</button>
          <button>Doações</button>
          <button>Estoque</button>
          <button>Relatórios</button>
        </nav>
      </aside>

      <main className="conteudo">
        <header>
          <div>
            <h2>Painel Administrativo</h2>
            <p>Gerenciamento de Campanhas - Sprint 2</p>
          </div>
        </header>

        {/* Componente integrando o CRUD de campanhas conectado à API */}
        <CampanhasSprint2 />
      </main>
    </div>
  );
}

export default App;