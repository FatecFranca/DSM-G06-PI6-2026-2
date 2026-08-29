import "./App.css";

const campanhas = [
  {
    nome: "Arrecadação de alimentos",
    categoria: "Alimentos",
    status: "Ativa"
  },
  {
    nome: "Campanha do agasalho",
    categoria: "Vestuário",
    status: "Ativa"
  },
  {
    nome: "Natal solidário",
    categoria: "Brinquedos",
    status: "Planejada"
  }
];

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
            <h2>Visão geral</h2>
            <p>Acompanhe as principais informações da instituição.</p>
          </div>

          <button className="nova-campanha">Nova campanha</button>
        </header>

        <section className="indicadores">
          <article>
            <span>Campanhas ativas</span>
            <strong>2</strong>
          </article>

          <article>
            <span>Doações cadastradas</span>
            <strong>48</strong>
          </article>

          <article>
            <span>Doações recebidas</span>
            <strong>36</strong>
          </article>

          <article>
            <span>Itens em estoque baixo</span>
            <strong>4</strong>
          </article>
        </section>

        <section className="tabela-container">
          <div className="titulo-tabela">
            <h3>Campanhas recentes</h3>
            <button>Ver todas</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Categoria</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {campanhas.map((campanha) => (
                <tr key={campanha.nome}>
                  <td>{campanha.nome}</td>
                  <td>{campanha.categoria}</td>
                  <td>
                    <span className={`status ${campanha.status.toLowerCase()}`}>
                      {campanha.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default App;