
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

export default function RecebimentosSprint2() {
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

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
          setMensagem(String(erro));
        }
      }
    }

    void iniciar();

    return () => {
      ativo = false;
    };
  }, []);

  async function confirmarRecebimento(idDoacao: number) {
    try {
      setMensagem("");
      setCarregando(true);

      await api(`/estoque/receber/${idDoacao}`, {
        method: "POST"
      });

      await carregar();
      setMensagem("Doacao recebida com sucesso.");
    } catch (erro) {
      setMensagem(String(erro));
    } finally {
      setCarregando(false);
    }
  }

  async function atualizar() {
    try {
      setMensagem("");
      setCarregando(true);
      await carregar();
    } catch (erro) {
      setMensagem(String(erro));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="painel">
      <h3>Recebimentos</h3>

      <p role="status">{mensagem}</p>

      <button
        type="button"
        onClick={() => void atualizar()}
        disabled={carregando}
      >
        Atualizar
      </button>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Doador</th>
            <th>Status</th>
            <th>Acao</th>
          </tr>
        </thead>

        <tbody>
          {doacoes.map((doacao) => (
            <tr key={doacao.id_doacao}>
              <td>{doacao.id_doacao}</td>
              <td>{doacao.doador}</td>
              <td>{doacao.status}</td>

              <td>
                {doacao.status === "CADASTRADA" && (
                  <button
                    type="button"
                    disabled={carregando}
                    onClick={() =>
                      void confirmarRecebimento(doacao.id_doacao)
                    }
                  >
                    Confirmar recebimento
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Estoque persistido</h3>

      {itens.map((item) => (
        <p key={item.id_item}>
          {item.nome}: {item.saldo} {item.unidade_medida}
        </p>
      ))}
    </section>
  );
}
