
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

  const partes = valor.slice(0, 10).split("-");

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
  const [formulario, setFormulario] = useState<Formulario>({
    ...formularioInicial
  });

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
    <section className="painel campanhas-conteudo">
      <div className="campanhas-cabecalho">
        <div>
          <h3>Campanhas cadastradas</h3>
          <p>
            Consulte as campanhas e acompanhe seus períodos e situações.
          </p>
        </div>

        <div className="campanhas-acoes">
          <button
            type="button"
            className="campanhas-botao-secundario"
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
      </div>

      {mensagem && (
        <p className="campanhas-sucesso" role="status">
          {mensagem}
        </p>
      )}

      {erro && (
        <p className="campanhas-erro" role="alert">
          {erro}
        </p>
      )}

      {administrador && mostrarFormulario && (
        <form
          className="campanhas-formulario"
          onSubmit={(evento) => void salvar(evento)}
        >
          <h3>
            {idEdicao === null
              ? "Cadastrar campanha"
              : "Editar campanha"}
          </h3>

          <p>
            <label htmlFor="campanha-titulo">Título</label>
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
          </p>

          <p>
            <label htmlFor="campanha-descricao">
              Descrição
            </label>
            <textarea
              id="campanha-descricao"
              value={formulario.descricao}
              onChange={(evento) =>
                atualizarCampo("descricao", evento.target.value)
              }
              rows={4}
            />
          </p>

          <p>
            <label htmlFor="campanha-inicio">
              Data de início
            </label>
            <input
              id="campanha-inicio"
              type="date"
              value={formulario.data_inicio}
              onChange={(evento) =>
                atualizarCampo("data_inicio", evento.target.value)
              }
              required
            />
          </p>

          <p>
            <label htmlFor="campanha-fim">
              Data de término (opcional)
            </label>
            <input
              id="campanha-fim"
              type="date"
              value={formulario.data_fim}
              min={formulario.data_inicio || undefined}
              onChange={(evento) =>
                atualizarCampo("data_fim", evento.target.value)
              }
            />
          </p>

          <p>
            <label htmlFor="campanha-status">
              Situação
            </label>
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
          </p>

          <div className="campanhas-acoes">
            <button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              className="campanhas-botao-secundario"
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
        <div className="campanhas-tabela">
          <table>
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Início</th>
                <th>Término</th>
                <th>Situação</th>
                {administrador && <th>Ações</th>}
              </tr>
            </thead>

            <tbody>
              {campanhas.map((campanha) => (
                <tr key={campanha.id_campanha}>
                  <td>
                    <span className="campanhas-titulo">
                      {campanha.titulo}
                    </span>

                    {campanha.descricao && (
                      <p className="campanhas-descricao">
                        {campanha.descricao}
                      </p>
                    )}
                  </td>

                  <td>
                    {formatarData(campanha.data_inicio)}
                  </td>

                  <td>
                    {formatarData(campanha.data_fim)}
                  </td>

                  <td>
                    <span
                      className={
                        campanha.status === "ATIVA"
                          ? "campanhas-status ativa"
                          : "campanhas-status encerrada"
                      }
                    >
                      {campanha.status === "ATIVA"
                        ? "Ativa"
                        : "Encerrada"}
                    </span>
                  </td>

                  {administrador && (
                    <td>
                      <div className="campanhas-acoes">
                        <button
                          type="button"
                          className="campanhas-botao-secundario"
                          onClick={() =>
                            editarCampanha(campanha)
                          }
                          disabled={salvando}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="campanhas-botao-perigo"
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
