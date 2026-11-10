import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api, ErroApi } from "../services/api";

type Item = {
  id_item: number;
  nome: string;
  unidade_medida: string;
};

type Campanha = {
  id_campanha: number;
  titulo: string;
};

type Doacao = {
  id_doacao: number;
  status: string;
  titulo_campanha: string | null;
  itens: (Item & { quantidade: number })[];
};

type Dados = {
  itens: Item[];
  campanhas: Campanha[];
  doacoes: Doacao[];
};

const situacoes: Record<string, string> = {
  CADASTRADA: "Aguardando recebimento",
  RECEBIDA: "Recebida",
  CANCELADA: "Cancelada"
};

export default function PainelDoador({ aoExpirar }: { aoExpirar: (mensagem: string) => void }) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [atualizarAntesDeEnviar, setAtualizarAntesDeEnviar] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const sessao = useRef<AbortController | null>(null);
  const emAndamento = useRef(false);
  const ocupado = carregando || enviando;

  const mostrarErro = useCallback((falha: unknown) => {
    if (falha instanceof ErroApi && falha.status === 401) {
      aoExpirar(falha.message);
      return;
    }

    setErro(falha instanceof Error ? falha.message : "Tente novamente.");
  }, [aoExpirar]);

  const carregar = useCallback((signal: AbortSignal) => {
    return Promise.all([
      api("/itens", { signal }),
      api("/campanhas?status=ATIVA", { signal }),
      api("/doacoes/minhas", { signal })
    ])
      .then(([itens, campanhas, doacoes]) => {
        if (signal.aborted) return;
        if (!Array.isArray(itens) || !Array.isArray(campanhas) || !Array.isArray(doacoes)) {
          throw new Error("Não foi possível carregar os dados da área do doador.");
        }

        setDados({ itens, campanhas, doacoes });
        setAtualizarAntesDeEnviar(false);
      })
      .catch((falha: unknown) => {
        if (!signal.aborted) mostrarErro(falha);
      })
      .finally(() => {
        if (!signal.aborted) setCarregando(false);
      });
  }, [mostrarErro]);

  useEffect(() => {
    const controlador = new AbortController();
    sessao.current = controlador;
    void carregar(controlador.signal);

    return () => controlador.abort();
  }, [carregar]);

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const signal = sessao.current?.signal;
    if (!signal || ocupado || !dados || atualizarAntesDeEnviar || emAndamento.current) return;

    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    const item = dados.itens.find(({ id_item }) => id_item === Number(campos.get("item")));
    const quantidade = Number(campos.get("quantidade"));
    const campanha = dados.campanhas.find(({ id_campanha }) => id_campanha === Number(campos.get("campanha")));
    if (!item || !Number.isFinite(quantidade) || quantidade <= 0) return;

    emAndamento.current = true;
    setEnviando(true);
    setErro("");
    setSucesso("");

    try {
      const resposta: Pick<Doacao, "id_doacao" | "status"> = await api("/doacoes", {
        method: "POST",
        signal,
        body: JSON.stringify({
          id_campanha: campanha?.id_campanha ?? null,
          observacao: String(campos.get("observacao")).trim() || null,
          itens: [{ id_item: item.id_item, quantidade }]
        })
      });

      if (signal.aborted) return;
      const doacao: Doacao = {
        ...resposta,
        titulo_campanha: campanha?.titulo ?? null,
        itens: [{ ...item, quantidade }]
      };
      setDados({ ...dados, doacoes: [doacao, ...dados.doacoes] });
      formulario.reset();
      setSucesso(`Doação #${doacao.id_doacao} cadastrada.`);
    } catch (falha) {
      if (!signal.aborted) {
        if (!(falha instanceof ErroApi) || falha.status >= 500) {
          setAtualizarAntesDeEnviar(true);
          setErro("Não foi possível confirmar o cadastro. Atualize a lista e verifique se a doação já aparece antes de reenviar.");
        } else {
          mostrarErro(falha);
        }
      }
    } finally {
      emAndamento.current = false;
      if (!signal.aborted) setEnviando(false);
    }
  }

  return (
    <section id="doacoes" className="tabela-container campanhas" aria-busy={ocupado}>
      <div className="titulo-tabela">
        <h3>Doações</h3>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            if (!sessao.current) return;
            setCarregando(true);
            setErro("");
            void carregar(sessao.current.signal);
          }}
        >
          Atualizar lista
        </button>
      </div>

      {erro && <p role="alert" className="mensagem-erro">{erro}</p>}
      {sucesso && <p role="status" className="mensagem-sucesso">{sucesso}</p>}
      {carregando && <p role="status">Carregando dados das doações…</p>}
      {dados && (
        <>
          <h4>Nova doação</h4>
          <form onSubmit={cadastrar}>
            <fieldset className="formulario-campanha campos-doacao" disabled={ocupado || atualizarAntesDeEnviar}>
              <label htmlFor="doacao-campanha">Campanha (opcional)</label>
              <select id="doacao-campanha" name="campanha">
                <option value="">Doação geral</option>
                {dados.campanhas.map((campanha) => (
                  <option key={campanha.id_campanha} value={campanha.id_campanha}>{campanha.titulo}</option>
                ))}
              </select>

              <label htmlFor="doacao-item">Item</label>
              <select id="doacao-item" name="item" required>
                <option value="">Selecione um item</option>
                {dados.itens.map((item) => (
                  <option key={item.id_item} value={item.id_item}>{item.nome} ({item.unidade_medida})</option>
                ))}
              </select>
              {dados.itens.length === 0 && <p>Nenhum item disponível para doação.</p>}

              <label htmlFor="doacao-quantidade">Quantidade</label>
              <input id="doacao-quantidade" name="quantidade" type="number" min="0.01" max="99999999.99" step="0.01" required />

              <label htmlFor="doacao-observacao">Observação (opcional)</label>
              <textarea id="doacao-observacao" name="observacao" maxLength={1000} rows={3} />

              <button disabled={!dados.itens.length}>{enviando ? "Cadastrando…" : "Cadastrar doação"}</button>
            </fieldset>
          </form>

          <h4>Minhas doações</h4>
          {dados.doacoes.length === 0 ? <p>Você ainda não tem doações cadastradas.</p> : (
            <div className="tabela-rolavel">
              <table aria-label="Minhas doações">
                <thead>
                  <tr>
                    <th scope="col">Doação</th>
                    <th scope="col">Campanha</th>
                    <th scope="col">Itens</th>
                    <th scope="col">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.doacoes.map((doacao) => (
                    <tr key={doacao.id_doacao}>
                      <td>#{doacao.id_doacao}</td>
                      <td>{doacao.titulo_campanha || "Doação geral"}</td>
                      <td>{doacao.itens.map((item) => `${item.nome}: ${item.quantidade} ${item.unidade_medida}`).join(", ")}</td>
                      <td>{situacoes[doacao.status] || doacao.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
