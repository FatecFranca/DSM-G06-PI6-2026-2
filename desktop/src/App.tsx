import "./App.css";

const doacoes = [
  {
    codigo: "#DF-1048",
    doador: "Mariana Souza",
    itens: "Alimentos",
    status: "Aguardando"
  },
  {
    codigo: "#DF-1047",
    doador: "Carlos Oliveira",
    itens: "Roupas",
    status: "Recebida"
  },
  {
    codigo: "#DF-1046",
    doador: "Ana Martins",
    itens: "Higiene",
    status: "Aguardando"
  }
];

function App() {
  return (
    <div className="aplicacao">
      <aside className="menu-lateral">
        <h1>DoeFácil</h1>
        <p>Controle interno</p>

        <nav>
          <button className="selecionado">Recebimentos</button>
          <button>Estoque</button>
          <button>Movimentações</button>
          <button>Campanhas</button>
        </nav>
      </aside>

      <main className="area-principal">
        <header>
          <div>
            <h2>Recebimento de doações</h2>
            <p>Confirme as doações entregues na instituição.</p>
          </div>

          <button className="botao-entrada">Registrar entrada</button>
        </header>

        <section className="resumo">
          <article>
            <span>Aguardando recebimento</span>
            <strong>5</strong>
          </article>

          <article>
            <span>Recebidas hoje</span>
            <strong>12</strong>
          </article>

          <article className="alerta">
            <span>Itens com estoque baixo</span>
            <strong>3</strong>
          </article>
        </section>

        <div className="grade">
          <section className="painel">
            <h3>Doações recentes</h3>

            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Doador</th>
                  <th>Itens</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {doacoes.map((doacao) => (
                  <tr key={doacao.codigo}>
                    <td>{doacao.codigo}</td>
                    <td>{doacao.doador}</td>
                    <td>{doacao.itens}</td>
                    <td>
                      <span
                        className={`situacao ${doacao.status.toLowerCase()}`}
                      >
                        {doacao.status}
                      </span>
                    </td>
                    <td>
                      <button className="detalhes">Ver detalhes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <aside className="estoque">
            <h3>Estoque baixo</h3>

            <div>
              <strong>Leite</strong>
              <span>4 unidades</span>
            </div>

            <div>
              <strong>Sabonete</strong>
              <span>7 unidades</span>
            </div>

            <div>
              <strong>Cobertores</strong>
              <span>3 unidades</span>
            </div>

            <button>Consultar estoque</button>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;