
import { useEffect, useState } from "react";
import { api } from "../services/api";

type Movimentacao = {
  id_movimentacao: number;
  id_item: number;
  nome_item: string;
  unidade_medida: string;
  tipo: "ENTRADA" | "SAIDA";
  quantidade: string;
  data_movimentacao: string;
  id_funcionario: number;
  nome_funcionario: string;
  id_doacao: number | null;
};

type Item = {
  id_item: number;
  nome: string;
};

export default function HistoricoMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [idItem, setIdItem] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarInicial() {
      try {
        const [listaMovimentacoes, listaItens] = await Promise.all([
          api("/movimentacoes"),
          api("/itens")
        ]);

        if (ativo) {
          setMovimentacoes(listaMovimentacoes);
          setItens(listaItens);
        }
      } catch (erro) {
        if (ativo) {
          setMensagem(
            erro instanceof Error
              ? erro.message
              : "Erro ao carregar movimentações."
          );
        }
      }
    }

    void carregarInicial();

    return () => {
      ativo = false;
    };
  }, []);

  async function carregar(filtro = idItem) {
    setCarregando(true);
    setMensagem("");

    try {
      const caminho = filtro
        ? `/movimentacoes?id_item=${encodeURIComponent(filtro)}`
        : "/movimentacoes";

      const dados = await api(caminho);
      setMovimentacoes(dados);
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao consultar movimentações."
      );
    } finally {
      setCarregando(false);
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString("pt-BR");
  }

  return (
    <section className="painel">
      <h3>Histórico de movimentações</h3>

      <div style={{ marginBottom: 24 }}>
        <label htmlFor="filtro-item">Filtrar por item: </label>

        <select
          id="filtro-item"
          value={idItem}
          onChange={(evento) => {
            const valor = evento.target.value;
            setIdItem(valor);
            void carregar(valor);
          }}
        >
          <option value="">Todos os itens</option>

          {itens.map((item) => (
            <option key={item.id_item} value={item.id_item}>
              {item.nome}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void carregar()}
          disabled={carregando}
          style={{ marginLeft: 12 }}
        >
          {carregando ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <p role="status">{mensagem}</p>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Item</th>
            <th>Tipo</th>
            <th>Quantidade</th>
            <th>Responsável</th>
          </tr>
        </thead>

        <tbody>
          {movimentacoes.map((movimentacao) => (
            <tr key={movimentacao.id_movimentacao}>
              <td>{movimentacao.id_movimentacao}</td>
              <td>{formatarData(movimentacao.data_movimentacao)}</td>
              <td>{movimentacao.nome_item}</td>
              <td>
                <span
                  className={
                    movimentacao.tipo === "ENTRADA"
                      ? "situacao recebida"
                      : "situacao aguardando"
                  }
                >
                  {movimentacao.tipo}
                </span>
              </td>
              <td>
                {movimentacao.quantidade}{" "}
                {movimentacao.unidade_medida}
              </td>
              <td>{movimentacao.nome_funcionario}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!carregando && movimentacoes.length === 0 && (
        <p>Nenhuma movimentação encontrada.</p>
      )}
    </section>
  );
}
