
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../services/api";

type Perfil = "FUNCIONARIO" | "ADMINISTRADOR";

type Campanha = {
  id_campanha: number;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: "ATIVA" | "ENCERRADA";
};

type Formulario = {
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  status: "ATIVA" | "ENCERRADA";
};

type Props = {
  perfil: Perfil;
};

const formularioInicial: Formulario = {
  titulo: "",
  descricao: "",
  data_inicio: "",
  data_fim: "",
  status: "ATIVA"
};

function formatarData(valor: string | null) {
  if (!valor) return "Não definida";

  const data = valor.slice(0, 10);
  const partes = data.split("-");

  if (partes.length !== 3) return valor;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function Campanhas({ perfil }: Props) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(
    formularioInicial
  );

  const administrador = perfil === "ADMINISTRADOR";

  const carregarCampanhas = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta: Campanha[] = await api("/campanhas");
      setCampanhas(resposta);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível consultar as campanhas."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarCampanhas();
  }, [carregarCampanhas]);

  function atualizarCampo(
    campo: keyof Formulario,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  }

  function novaCampanha() {
    setIdEdicao(null);
    setFormulario({ ...formularioInicial });
    setMensagem("");
    setErro("");
    setMostrarFormulario(true);
  }

  function editarCampanha(campanha: Campanha) {
    setIdEdicao(campanha.id_campanha);

    setFormulario({
      titulo: campanha.titulo,
      descricao: campanha.descricao ?? "",
      data_inicio: campanha.data_inicio.slice(0, 10),
      data_fim: campanha.data_fim
        ? campanha.data_fim.slice(0, 10)
        : "",
      status: campanha.status
    });

    setMensagem("");
    setErro("");
    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    setIdEdicao(null);
    setFormulario({ ...formularioInicial });
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!administrador || salvando) return;

    setMensagem("");
    setErro("");

    const titulo = formulario.titulo.trim();

    if (titulo.length < 3 || titulo.length > 120) {
      setErro("O título deve conter de 3 a 120 caracteres.");
      return;
    }

    if (!formulario.data_inicio) {
      setErro("Informe a data de início.");
      return;
    }

    if (
      formulario.data_fim &&
      formulario.data_fim < formulario.data_inicio
    ) {
      setErro("A data final não pode ser anterior à data inicial.");
      return;
    }

    setSalvando(true);

    try {
      const editando = idEdicao !== null;

      await api(
        editando ? `/campanhas/${idEdicao}` : "/campanhas",
        {
          method: editando ? "PUT" : "POST",
          body: JSON.stringify({
            titulo,
            descricao: formulario.descricao.trim(),
            data_inicio: formulario.data_inicio,
            data_fim: formulario.data_fim || null,
            status: formulario.status
          })
        }
      );

      fecharFormulario();

      setMensagem(
        editando
          ? "Campanha atualizada com sucesso."
          : "Campanha cadastrada com sucesso."
      );

      await carregarCampanhas();
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível salvar a campanha."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function cancelarCampanha(campanha: Campanha) {
    if (!administrador || salvando) return;

    const confirmado = window.confirm(
      `Deseja realmente cancelar a campanha "${campanha.titulo}"?`
    );

    if (!confirmado) return;

    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      await api(`/campanhas/${campanha.id_campanha}`, {
        method: "DELETE"
      });

      setMensagem("Campanha cancelada com sucesso.");
      await carregarCampanhas();
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível cancelar a campanha."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="painel">
      <h3>Campanhas cadastradas</h3>

      <p>
        Consulte as campanhas e acompanhe seus períodos e situações.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20
        }}
      >
        <button
          type="button"
          onClick={() => void carregarCampanhas()}
          disabled={carregando || salvando}
        >
          {carregando ? "Atualizando..." : "Atualizar"}
        </button>

        {administrador && (
          <button
            type="button"
            onClick={novaCampanha}
            disabled={salvando}
          >
            Nova campanha
          </button>
        )}
      </div>

      {mensagem && <p role="status">{mensagem}</p>}
      {erro && <p role="alert">{erro}</p>}

      {administrador && mostrarFormulario && (
        <form onSubmit={(evento) => void salvar(evento)}>
          <h3>
            {idEdicao === null
              ? "Cadastrar campanha"
              : "Editar campanha"}
          </h3>

          <p>
            <label htmlFor="campanha-titulo">Título</label>
          </p>

          <input
            id="campanha-titulo"
            type="text"
            value={formulario.titulo}
            onChange={(evento) =>
              atualizarCampo("titulo", evento.target.value)
            }
            minLength={3}
            maxLength={120}
            required
          />

          <p>
            <label htmlFor="campanha-descricao">Descrição</label>
          </p>

          <textarea
            id="campanha-descricao"
            value={formulario.descricao}
            onChange={(evento) =>
              atualizarCampo("descricao", evento.target.value)
            }
            rows={4}
          />

          <p>
            <label htmlFor="campanha-inicio">Data de início</label>
          </p>

          <input
            id="campanha-inicio"
            type="date"
            value={formulario.data_inicio}
            onChange={(evento) =>
              atualizarCampo("data_inicio", evento.target.value)
            }
            required
          />

          <p>
            <label htmlFor="campanha-fim">
              Data de término (opcional)
            </label>
          </p>

          <input
            id="campanha-fim"
            type="date"
            value={formulario.data_fim}
            min={formulario.data_inicio || undefined}
            onChange={(evento) =>
              atualizarCampo("data_fim", evento.target.value)
            }
          />

          <p>
            <label htmlFor="campanha-status">Situação</label>
          </p>

          <select
            id="campanha-status"
            value={formulario.status}
            onChange={(evento) =>
              atualizarCampo("status", evento.target.value)
            }
          >
            <option value="ATIVA">Ativa</option>
            <option value="ENCERRADA">Encerrada</option>
          </select>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 20,
              flexWrap: "wrap"
            }}
          >
            <button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              onClick={fecharFormulario}
              disabled={salvando}
            >
              Voltar
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <p>Carregando campanhas...</p>
      ) : campanhas.length === 0 ? (
        <p>Nenhuma campanha cadastrada.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: 10 }}>Campanha</th>
                <th style={{ padding: 10 }}>Início</th>
                <th style={{ padding: 10 }}>Término</th>
                <th style={{ padding: 10 }}>Situação</th>
                {administrador && (
                  <th style={{ padding: 10 }}>Ações</th>
                )}
              </tr>
            </thead>

            <tbody>
              {campanhas.map((campanha) => (
                <tr key={campanha.id_campanha}>
                  <td style={{ padding: 10 }}>
                    <strong>{campanha.titulo}</strong>
                    {campanha.descricao && (
                      <p>{campanha.descricao}</p>
                    )}
                  </td>

                  <td style={{ padding: 10 }}>
                    {formatarData(campanha.data_inicio)}
                  </td>

                  <td style={{ padding: 10 }}>
                    {formatarData(campanha.data_fim)}
                  </td>

                  <td style={{ padding: 10 }}>
                    {campanha.status === "ATIVA"
                      ? "Ativa"
                      : "Encerrada"}
                  </td>

                  {administrador && (
                    <td style={{ padding: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap"
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => editarCampanha(campanha)}
                          disabled={salvando}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void cancelarCampanha(campanha)
                          }
                          disabled={salvando}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Campanhas;
