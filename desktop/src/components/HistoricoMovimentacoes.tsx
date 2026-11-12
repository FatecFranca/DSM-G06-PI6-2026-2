
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

// Formata a data no horário oficial de São Paulo.
function formatarData(data: string) {
  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "Data inválida";
  }

  return dataConvertida.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

export default function HistoricoMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [idItem, setIdItem] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Carrega as movimentações e os itens ao abrir a tela.
  useEffect(() => {
    let ativo = true;

    async function carregarInicial() {
      setCarregando(true);
      setMensagem("");

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
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarInicial();

    return () => {
      ativo = false;
    };
  }, []);

  // Atualiza o histórico, aplicando o filtro selecionado.
  async function carregar(filtro = idItem) {
    setCarregando(true);
    setMensagem("");

    try {
      const caminho = filtro
        ? `/movimentacoes?id_item=${encodeURIComponent(filtro)}`
        : "/movimentacoes";

      const dados: Movimentacao[] = await api(caminho);

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

  function alterarFiltro(valor: string) {
    setIdItem(valor);
    void carregar(valor);
  }

  return (
    <section className="painel">
      <h3>Histórico de movimentações</h3>

      <p>
        Consulte as entradas e saídas registradas no estoque.
      </p>

      {/* Filtro de movimentações */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24
        }}
      >
        <label htmlFor="filtro-item">
          Filtrar por item:
        </label>

        <select
          id="filtro-item"
          value={idItem}
          onChange={(evento) =>
            alterarFiltro(evento.target.value)
          }
          disabled={carregando}
        >
          <option value="">Todos os itens</option>

          {itens.map((item) => (
            <option
              key={item.id_item}
              value={item.id_item}
            >
              {item.nome}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void carregar()}
          disabled={carregando}
        >
          {carregando ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {/* Mensagens de erro */}
      {mensagem && (
        <p role="alert">{mensagem}</p>
      )}

      {/* Tabela de movimentações */}
      <div style={{ overflowX: "auto" }}>
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
                <td>
                  {movimentacao.id_movimentacao}
                </td>

                <td>
                  {formatarData(
                    movimentacao.data_movimentacao
                  )}
                </td>

                <td>
                  {movimentacao.nome_item}
                </td>

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

                <td>
                  {movimentacao.nome_funcionario}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Histórico vazio */}
      {!carregando &&
        movimentacoes.length === 0 &&
        !mensagem && (
          <p>Nenhuma movimentação encontrada.</p>
        )}
    </section>
  );
}
