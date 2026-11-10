import { useCallback, useEffect, useId, useRef, useState } from "react";
import { api, ErroApi } from "../services/api";

type Campanha = {
  id_campanha: number;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: string;
};

type Props = {
  administrador: boolean;
  aoExpirar: (mensagem: string) => void;
};

export default function CampanhasSprint2({ administrador, aoExpirar }: Props) {
  const prefixo = useId();

  const [lista, setLista] = useState<Campanha[]>([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [id, setId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [status, setStatus] = useState("ATIVA");

  const emAndamento = useRef(false);
  const montado = useRef(true);

  const ocupado = carregando || enviando;

  function limparFormulario() {
    setId(null);
    setTitulo("");
    setDescricao("");
    setInicio("");
    setFim("");
    setStatus("ATIVA");
  }

  const carregar = useCallback(async (signal?: AbortSignal) => {
    const dados = await api("/campanhas", { signal });

    if (!Array.isArray(dados)) {
      throw new Error("Não foi possível carregar as campanhas.");
    }

    if (montado.current && !signal?.aborted) {
      setLista(dados);
    }
  }, []);

  const mostrarErro = useCallback((falha: unknown) => {
    if (falha instanceof ErroApi && falha.status === 401) {
      aoExpirar(falha.message);
      return;
    }

    setErro(
      falha instanceof Error ? falha.message : "Tente novamente."
    );
  }, [aoExpirar]);

  useEffect(() => {
    montado.current = true;
    const controlador = new AbortController();

    void carregar(controlador.signal)
      .catch((falha: unknown) => {
        if (montado.current && !controlador.signal.aborted) {
          mostrarErro(falha);
        }
      })
      .finally(() => {
        if (montado.current && !controlador.signal.aborted) {
          setCarregando(false);
        }
      });

    return () => {
      montado.current = false;
      controlador.abort();
    };
  }, [carregar, mostrarErro]);

  async function executar(acao: () => Promise<void>) {
    if (emAndamento.current || carregando) return;

    emAndamento.current = true;
    setEnviando(true);
    setErro("");
    setSucesso("");

    try {
      await acao();
    } catch (falha) {
      if (montado.current) {
        mostrarErro(falha);
      }
    } finally {
      emAndamento.current = false;

      if (montado.current) {
        setEnviando(false);
      }
    }
  }

  async function recarregarAposSalvar(mensagem: string) {
    setSucesso(mensagem);

    try {
      await carregar();
    } catch {
      setErro(
        "A alteração foi salva, mas não foi possível atualizar a lista. Clique em Atualizar lista."
      );
    }
  }

  async function salvar() {
    const tituloLimpo = titulo.trim();

    if (tituloLimpo.length < 3 || tituloLimpo.length > 120) {
      throw new Error(
        "Informe um título com 3 a 120 caracteres."
      );
    }

    if (!inicio || (fim && fim < inicio)) {
      throw new Error(
        "Confira as datas: o fim não pode ser anterior ao início."
      );
    }

    const campanha: Campanha = await api(
      id !== null ? `/campanhas/${id}` : "/campanhas",
      {
        method: id !== null ? "PUT" : "POST",
        body: JSON.stringify({
          titulo: tituloLimpo,
          descricao: descricao.trim(),
          data_inicio: inicio,
          data_fim: fim || null,
          status
        })
      }
    );

    const editando = id !== null;

    setLista((atuais) =>
      editando
        ? atuais.map((atual) =>
            atual.id_campanha === id ? campanha : atual
          )
        : [campanha, ...atuais]
    );

    limparFormulario();

    await recarregarAposSalvar(
      editando ? "Campanha atualizada." : "Campanha criada."
    );
  }

  async function cancelar(campanha: Campanha) {
    await api(`/campanhas/${campanha.id_campanha}`, {
      method: "DELETE"
    });

    setLista((atuais) =>
      atuais.filter(
        (atual) =>
          atual.id_campanha !== campanha.id_campanha
      )
    );

    if (id === campanha.id_campanha) {
      limparFormulario();
    }

    await recarregarAposSalvar(
      "Campanha cancelada. O registro foi preservado no banco."
    );
  }

  function editar(campanha: Campanha) {
    if (ocupado) return;

    setId(campanha.id_campanha);
    setTitulo(campanha.titulo);
    setDescricao(campanha.descricao || "");
    setInicio(campanha.data_inicio.slice(0, 10));
    setFim(campanha.data_fim?.slice(0, 10) || "");
    setStatus(campanha.status);
    setErro("");
    setSucesso("");

    document.getElementById(`${prefixo}-titulo`)?.focus();
  }

  function confirmarCancelamento(campanha: Campanha) {
    if (ocupado) return;

    if (
      window.confirm(
        `Cancelar a campanha “${campanha.titulo}”?`
      )
    ) {
      void executar(() => cancelar(campanha));
    }
  }

  return (
    <section
      className="tabela-container campanhas"
      aria-busy={ocupado}
    >
      <div className="titulo-tabela">
        <h3>Campanhas</h3>

        <button
          type="button"
          disabled={ocupado}
          onClick={() => void executar(() => carregar())}
        >
          Atualizar lista
        </button>
      </div>

      {erro ? (
        <p role="alert" className="mensagem-erro">
          {erro}
        </p>
      ) : null}

      {sucesso ? (
        <p role="status" className="mensagem-sucesso">
          {sucesso}
        </p>
      ) : null}

      {carregando ? (
        <p role="status">Carregando campanhas…</p>
      ) : null}

      {administrador && (
        <form
          className="formulario-campanha"
          onSubmit={(evento) => {
            evento.preventDefault();
            void executar(salvar);
          }}
        >
          <h4>
            {id === null
              ? "Nova campanha"
              : `Editar campanha #${id}`}
          </h4>

          <label htmlFor={`${prefixo}-titulo`}>
            Título
          </label>

          <input
            id={`${prefixo}-titulo`}
            value={titulo}
            minLength={3}
            maxLength={120}
            onChange={(evento) =>
              setTitulo(evento.target.value)
            }
            disabled={ocupado}
            required
          />

          <label htmlFor={`${prefixo}-descricao`}>
            Descrição (opcional)
          </label>

          <textarea
            id={`${prefixo}-descricao`}
            value={descricao}
            onChange={(evento) =>
              setDescricao(evento.target.value)
            }
            disabled={ocupado}
            rows={3}
          />

          <label htmlFor={`${prefixo}-inicio`}>
            Início
          </label>

          <input
            id={`${prefixo}-inicio`}
            type="date"
            value={inicio}
            onChange={(evento) =>
              setInicio(evento.target.value)
            }
            disabled={ocupado}
            required
          />

          <label htmlFor={`${prefixo}-fim`}>
            Fim (opcional)
          </label>

          <input
            id={`${prefixo}-fim`}
            type="date"
            min={inicio || undefined}
            value={fim}
            onChange={(evento) =>
              setFim(evento.target.value)
            }
            disabled={ocupado}
          />

          <label htmlFor={`${prefixo}-status`}>
            Situação
          </label>

          <select
            id={`${prefixo}-status`}
            value={status}
            onChange={(evento) =>
              setStatus(evento.target.value)
            }
            disabled={ocupado}
          >
            <option value="ATIVA">Ativa</option>
            <option value="ENCERRADA">Encerrada</option>
          </select>

          <div className="acoes-campanha">
            <button disabled={ocupado}>
              {enviando
                ? "Salvando…"
                : id === null
                  ? "Criar campanha"
                  : "Salvar alterações"}
            </button>

            {id !== null ? (
              <button
                type="button"
                disabled={ocupado}
                onClick={limparFormulario}
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
        </form>
      )}

      {!carregando && !erro && lista.length === 0 ? (
        <p>Nenhuma campanha cadastrada no momento.</p>
      ) : null}

      <div className="tabela-rolavel">
        <table>
          <caption>
            Campanhas cadastradas na instituição
          </caption>

          <thead>
            <tr>
              <th scope="col">Campanha</th>
              <th scope="col">Situação</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>

          <tbody>
            {lista.map((campanha) => (
              <tr key={campanha.id_campanha}>
                <td>
                  <strong>{campanha.titulo}</strong>

                  {campanha.descricao ? (
                    <p>{campanha.descricao}</p>
                  ) : null}
                </td>

                <td>
                  {campanha.status === "ATIVA"
                    ? "Ativa"
                    : "Encerrada"}
                </td>

                <td>
                  {administrador ? (
                    <div className="acoes-campanha">
                      <button
                        type="button"
                        aria-label={`Editar ${campanha.titulo}`}
                        disabled={ocupado}
                        onClick={() => editar(campanha)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        aria-label={`Cancelar ${campanha.titulo}`}
                        disabled={ocupado}
                        onClick={() =>
                          confirmarCancelamento(campanha)
                        }
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    "Entre como administrador para gerenciar."
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
