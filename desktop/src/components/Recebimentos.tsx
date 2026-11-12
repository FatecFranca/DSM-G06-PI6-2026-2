
import { useEffect, useState } from "react";
import { api } from "../services/api";

type Doacao = {
  id_doacao: number;
  doador: string;
  status: string;
};

type Item = {
  id_item: number;
  nome: string;
  saldo: string;
  unidade_medida: string;
};

type Props = {
  onAtualizar?: () => void | Promise<void>;
};

export default function Recebimentos({ onAtualizar }: Props) {
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);

  async function carregar() {
    const [listaDoacoes, listaItens] = await Promise.all([
      api("/doacoes"),
      api("/estoque")
    ]);

    setDoacoes(listaDoacoes);
    setItens(listaItens);
  }

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      try {
        const [listaDoacoes, listaItens] = await Promise.all([
          api("/doacoes"),
          api("/estoque")
        ]);

        if (ativo) {
          setDoacoes(listaDoacoes);
          setItens(listaItens);
        }
      } catch (erro) {
        if (ativo) {
          setMensagem(
            erro instanceof Error
              ? erro.message
              : "Erro ao carregar os recebimentos."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void iniciar();

    return () => {
      ativo = false;
    };
  }, []);

  async function confirmarRecebimento(idDoacao: number) {
    setMensagem("");
    setProcessando(true);

    try {
      await api(`/estoque/receber/${idDoacao}`, {
        method: "POST"
      });

      setMensagem("Doação recebida com sucesso.");

      try {
        await carregar();
        await onAtualizar?.();
      } catch {
        setMensagem(
          "Doação recebida, mas não foi possível atualizar todos os dados. Clique em Atualizar."
        );
      }
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao confirmar o recebimento."
      );
    } finally {
      setProcessando(false);
    }
  }

  async function atualizar() {
    setMensagem("");
    setProcessando(true);

    try {
      await carregar();
      await onAtualizar?.();
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao atualizar os dados."
      );
    } finally {
      setProcessando(false);
    }
  }

  return (
    <section className="painel">
      <h3>Recebimentos</h3>

      {mensagem && (
        <p role="status" aria-live="polite">
          {mensagem}
        </p>
      )}

      <button
        type="button"
        onClick={() => void atualizar()}
        disabled={processando || carregando}
      >
        {processando ? "Aguarde..." : "Atualizar"}
      </button>

      {carregando ? (
        <p>Carregando recebimentos...</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Doador</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {doacoes.map((doacao) => (
                  <tr key={doacao.id_doacao}>
                    <td>{doacao.id_doacao}</td>
                    <td>{doacao.doador}</td>
                    <td>{doacao.status}</td>

                    <td>
                      {doacao.status === "CADASTRADA" ? (
                        <button
                          type="button"
                          disabled={processando}
                          onClick={() =>
                            void confirmarRecebimento(doacao.id_doacao)
                          }
                        >
                          Confirmar recebimento
                        </button>
                      ) : (
                        "Sem ações disponíveis"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {doacoes.length === 0 && (
            <p>Nenhuma doação encontrada.</p>
          )}
        </>
      )}

      <h3>Estoque persistido</h3>

      {carregando ? (
        <p>Carregando estoque...</p>
      ) : itens.length === 0 ? (
        <p>Nenhum item encontrado no estoque.</p>
      ) : (
        itens.map((item) => (
          <p key={item.id_item}>
            {item.nome}: {item.saldo} {item.unidade_medida}
          </p>
        ))
      )}
    </section>
  );
}
