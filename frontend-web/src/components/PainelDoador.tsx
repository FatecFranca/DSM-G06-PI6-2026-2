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
  observacao: string | null;
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
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const sessao = useRef<AbortController | null>(null);
  const emAndamento = useRef(false);
  const tituloFormulario = useRef<HTMLHeadingElement>(null);
  const ocupado = carregando || enviando;
  const editando = dados?.doacoes.find((doacao) => doacao.id_doacao === editandoId);

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
      .then(([itens, campanhas, doacoes]: [Item[], Campanha[], Doacao[]]) => {
        if (signal.aborted) return;
        if (!Array.isArray(itens) || !Array.isArray(campanhas) || !Array.isArray(doacoes)) {
          throw new Error("Não foi possível carregar os dados da área do doador.");
        }

        setDados({ itens, campanhas, doacoes });
        setEditandoId((id) => {
          const doacao = doacoes.find((linha) => linha.id_doacao === id);
          return doacao?.status === "CADASTRADA" ? id : null;
        });
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

  useEffect(() => {
    if (editandoId !== null) tituloFormulario.current?.focus();
  }, [editandoId]);

  async function executarAlteracao(acao: (signal: AbortSignal) => Promise<void>) {
    const signal = sessao.current?.signal;
    if (!signal || ocupado || atualizarAntesDeEnviar || emAndamento.current) return;

    emAndamento.current = true;
    setEnviando(true);
    setErro("");
    setSucesso("");

    try {
      await acao(signal);
    } catch (falha) {
      if (!signal.aborted) {
        if (!(falha instanceof ErroApi) || falha.status >= 500) {
          setAtualizarAntesDeEnviar(true);
          setErro("Não foi possível confirmar a operação. Atualize a lista e confira a doação antes de tentar novamente.");
        } else if (falha.status === 409 || falha.status === 404) {
          setAtualizarAntesDeEnviar(true);
          setErro(`${falha.message} Atualize a lista para conferir a situação da doação.`);
        } else {
          mostrarErro(falha);
        }
      }
    } finally {
      emAndamento.current = false;
      if (!signal.aborted) setEnviando(false);
    }
  }

  function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!dados || (editando && editando.status !== "CADASTRADA")) return;

    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    const item = dados.itens.find(({ id_item }) => id_item === Number(campos.get("item")));
    const campanha = dados.campanhas.find(({ id_campanha }) => id_campanha === Number(campos.get("campanha")));
    const observacao = String(campos.get("observacao") ?? "").trim() || null;
    const itens = editando
      ? editando.itens.map((linha) => ({ ...linha, quantidade: Number(campos.get(`quantidade-${linha.id_item}`)) }))
      : item ? [{ ...item, quantidade: Number(campos.get("quantidade")) }] : [];

    if (!itens.length || itens.some(({ quantidade }) => !Number.isFinite(quantidade) || quantidade < 0.01)) return;

    void executarAlteracao(async (signal) => {
      const resposta: Pick<Doacao, "id_doacao" | "status" | "observacao"> = await api(
        editando ? `/doacoes/${editando.id_doacao}` : "/doacoes",
        {
          method: editando ? "PUT" : "POST",
          signal,
          body: JSON.stringify({
            ...(!editando && { id_campanha: campanha?.id_campanha ?? null }),
            observacao,
            itens: itens.map(({ id_item, quantidade }) => ({ id_item, quantidade }))
          })
        }
      );

      if (signal.aborted) return;
      const doacao: Doacao = {
        ...resposta,
        titulo_campanha: editando ? editando.titulo_campanha : campanha?.titulo ?? null,
        itens
      };
      setDados({
        ...dados,
        doacoes: editando
          ? dados.doacoes.map((linha) => linha.id_doacao === doacao.id_doacao ? doacao : linha)
          : [doacao, ...dados.doacoes]
      });
      setEditandoId(null);
      formulario.reset();
      setSucesso(`Doação #${doacao.id_doacao} ${editando ? "atualizada" : "cadastrada"}.`);
    });
  }

  function cancelar(doacao: Doacao) {
    if (!dados || doacao.status !== "CADASTRADA" || !window.confirm(`Cancelar a doação #${doacao.id_doacao}?`)) return;

    void executarAlteracao(async (signal) => {
      const resposta: Pick<Doacao, "status"> = await api(`/doacoes/${doacao.id_doacao}`, {
        method: "DELETE",
        signal
      });

      if (signal.aborted) return;
      setDados({
        ...dados,
        doacoes: dados.doacoes.map((linha) => linha.id_doacao === doacao.id_doacao ? { ...linha, status: resposta.status } : linha)
      });
      if (editandoId === doacao.id_doacao) setEditandoId(null);
      setSucesso(`Doação #${doacao.id_doacao} cancelada.`);
    });
  }

  return (
    <section id="doacoes" className="tabela-container campanhas" aria-busy={ocupado}>
      <div className="titulo-tabela">
        <h3>Doações</h3>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            if (!sessao.current || emAndamento.current) return;
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
      {enviando && <p role="status">Enviando alteração…</p>}
      {dados && (
        <>
          <h4 ref={tituloFormulario} tabIndex={-1}>
            {editando ? `Editar doação #${editando.id_doacao}` : "Nova doação"}
          </h4>
          <form key={editandoId ?? "nova"} onSubmit={salvar}>
            <fieldset className="formulario-campanha campos-doacao" disabled={ocupado || atualizarAntesDeEnviar}>
              {editando ? (
                <>
                  <p>{editando.titulo_campanha || "Doação geral"}</p>
                  {editando.itens.map((item) => (
                    <label key={item.id_item} htmlFor={`quantidade-${item.id_item}`}>
                      Quantidade de {item.nome} ({item.unidade_medida})
                      <input
                        id={`quantidade-${item.id_item}`}
                        name={`quantidade-${item.id_item}`}
                        type="number"
                        min="0.01"
                        max="99999999.99"
                        step="0.01"
                        defaultValue={item.quantidade}
                        required
                      />
                    </label>
                  ))}
                </>
              ) : (
                <>
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
                </>
              )}

              <label htmlFor="doacao-observacao">Observação (opcional)</label>
              <textarea id="doacao-observacao" name="observacao" maxLength={1000} rows={3} defaultValue={editando?.observacao ?? ""} />

              <div className="acoes-campanha">
                <button disabled={!(editando?.itens.length ?? dados.itens.length)}>
                  {editando ? "Salvar alterações" : "Cadastrar doação"}
                </button>
                {editando && (
                  <button type="button" onClick={() => setEditandoId(null)}>Cancelar edição</button>
                )}
              </div>
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
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.doacoes.map((doacao) => (
                    <tr key={doacao.id_doacao}>
                      <td>#{doacao.id_doacao}</td>
                      <td>{doacao.titulo_campanha || "Doação geral"}</td>
                      <td>
                        {doacao.itens.map((item) => `${item.nome}: ${item.quantidade} ${item.unidade_medida}`).join(", ")}
                        {doacao.observacao && <p>{doacao.observacao}</p>}
                      </td>
                      <td>{situacoes[doacao.status] || doacao.status}</td>
                      <td>
                        {doacao.status === "CADASTRADA" && (
                          <div className="acoes-campanha">
                            <button
                              type="button"
                              aria-label={`Editar doação #${doacao.id_doacao}`}
                              disabled={ocupado || atualizarAntesDeEnviar}
                              onClick={() => {
                                setEditandoId(doacao.id_doacao);
                                setErro("");
                                setSucesso("");
                              }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              aria-label={`Cancelar doação #${doacao.id_doacao}`}
                              disabled={ocupado || atualizarAntesDeEnviar}
                              onClick={() => cancelar(doacao)}
                            >
                              Cancelar doação
                            </button>
                          </div>
                        )}
                      </td>
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
