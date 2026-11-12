
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../services/api";

type Item = {
  id_item: number;
  nome: string;
  saldo: string;
  unidade_medida: string;
};

export default function SaidasEstoque() {
  const [itens, setItens] = useState<Item[]>([]);
  const [idItem, setIdItem] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [carregandoEstoque, setCarregandoEstoque] = useState(true);

  async function carregarEstoque() {
    const dados: Item[] = await api("/estoque");
    setItens(dados);
  }

  useEffect(() => {
    let ativo = true;

    async function carregarInicial() {
      try {
        const dados: Item[] = await api("/estoque");

        if (ativo) {
          setItens(dados);
        }
      } catch (erro) {
        if (ativo) {
          setMensagem(
            erro instanceof Error
              ? erro.message
              : "Erro ao consultar estoque."
          );
        }
      } finally {
        if (ativo) {
          setCarregandoEstoque(false);
        }
      }
    }

    void carregarInicial();

    return () => {
      ativo = false;
    };
  }, []);

  async function registrarSaida(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const valor = Number(quantidade);

    if (!idItem || !Number.isFinite(valor) || valor <= 0) {
      setMensagem("Selecione um item e informe uma quantidade válida.");
      return;
    }

    if (
      valor > 99999999.99 ||
      Math.abs(valor * 100 - Math.round(valor * 100)) > 0.000001
    ) {
      setMensagem(
        "Informe uma quantidade positiva com até duas casas decimais."
      );
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      await api("/estoque/saidas", {
        method: "POST",
        body: JSON.stringify({
          id_item: Number(idItem),
          quantidade: valor
        })
      });

      setQuantidade("");
      setMensagem("Saída registrada com sucesso.");

      try {
        await carregarEstoque();
      } catch {
        setMensagem(
          "Saída registrada, mas não foi possível atualizar o estoque. Atualize a consulta."
        );
      }
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao registrar saída."
      );
    } finally {
      setCarregando(false);
    }
  }

  const itemSelecionado = itens.find(
    (item) => item.id_item === Number(idItem)
  );

  return (
    <section className="painel">
      <h3>Estoque disponível</h3>

      {carregandoEstoque ? (
        <p>Carregando estoque...</p>
      ) : (
        <>
          {itens.length === 0 ? (
            <p>Nenhum item encontrado no estoque.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Saldo</th>
                    <th>Unidade</th>
                  </tr>
                </thead>

                <tbody>
                  {itens.map((item) => (
                    <tr key={item.id_item}>
                      <td>{item.nome}</td>
                      <td>{item.saldo}</td>
                      <td>{item.unidade_medida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <h3 style={{ marginTop: 30 }}>Registrar saída</h3>

      <form onSubmit={(evento) => void registrarSaida(evento)}>
        <p>
          <label htmlFor="item">Item</label>
        </p>

        <select
          id="item"
          value={idItem}
          onChange={(evento) => {
            setIdItem(evento.target.value);
            setMensagem("");
          }}
          required
          disabled={carregando || carregandoEstoque || itens.length === 0}
        >
          <option value="">Selecione um item</option>

          {itens.map((item) => (
            <option key={item.id_item} value={item.id_item}>
              {item.nome}
            </option>
          ))}
        </select>

        {itemSelecionado && (
          <p>
            Saldo disponível: {itemSelecionado.saldo}{" "}
            {itemSelecionado.unidade_medida}
          </p>
        )}

        <p>
          <label htmlFor="quantidade">Quantidade</label>
        </p>

        <input
          id="quantidade"
          type="number"
          min="0.01"
          max="99999999.99"
          step="0.01"
          value={quantidade}
          onChange={(evento) => {
            setQuantidade(evento.target.value);
            setMensagem("");
          }}
          required
          disabled={carregando || carregandoEstoque || itens.length === 0}
        />

        <p>
          <button
            type="submit"
            className="botao-entrada"
            disabled={
              carregando ||
              carregandoEstoque ||
              itens.length === 0
            }
          >
            {carregando ? "Registrando..." : "Registrar saída"}
          </button>
        </p>
      </form>

      {mensagem && (
        <p role="status" aria-live="polite">
          {mensagem}
        </p>
      )}
    </section>
  );
}
