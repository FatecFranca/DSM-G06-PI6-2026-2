
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent
} from "react";
import { api } from "../services/api";

type Perfil = "DOADOR" | "FUNCIONARIO" | "ADMINISTRADOR";
type PerfilCadastro = "FUNCIONARIO" | "ADMINISTRADOR";

type Usuario = {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
};

export default function GerenciamentoUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] =
    useState<PerfilCadastro>("FUNCIONARIO");

  const [usuarioEditando, setUsuarioEditando] =
    useState<Usuario | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [desativandoId, setDesativandoId] =
    useState<number | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregandoAcao = salvando || desativandoId !== null;

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);

    try {
      const resposta = await api("/usuarios");
      setUsuarios(resposta as Usuario[]);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível consultar os usuários."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarUsuarios();
  }, [carregarUsuarios]);

  function limparFormulario() {
    setNome("");
    setEmail("");
    setSenha("");
    setPerfil("FUNCIONARIO");
    setUsuarioEditando(null);
  }

  function iniciarEdicao(usuario: Usuario) {
    if (
      usuario.perfil !== "FUNCIONARIO" ||
      !usuario.ativo ||
      carregandoAcao
    ) {
      return;
    }

    setUsuarioEditando(usuario);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setSenha("");
    setErro("");
    setSucesso("");
  }

  function cancelarEdicao() {
    limparFormulario();
    setErro("");
    setSucesso("");
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (carregandoAcao) {
      return;
    }

    setErro("");
    setSucesso("");
    setSalvando(true);

    const editando = usuarioEditando;

    try {
      if (editando) {
        const dados: {
          nome: string;
          email: string;
          senha?: string;
        } = {
          nome: nome.trim(),
          email: email.trim()
        };

        if (senha.length > 0) {
          dados.senha = senha;
        }

        await api(`/usuarios/${editando.id_usuario}`, {
          method: "PUT",
          body: JSON.stringify(dados)
        });

        limparFormulario();
        setSucesso("Funcionário atualizado com sucesso.");
      } else {
        await api("/usuarios", {
          method: "POST",
          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim(),
            senha,
            perfil
          })
        });

        limparFormulario();
        setSucesso("Usuário cadastrado com sucesso.");
      }

      await carregarUsuarios();
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : editando
            ? "Não foi possível atualizar o funcionário."
            : "Não foi possível cadastrar o usuário."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(usuario: Usuario) {
    if (
      usuario.perfil !== "FUNCIONARIO" ||
      !usuario.ativo ||
      carregandoAcao
    ) {
      return;
    }

    const confirmado = window.confirm(
      `Deseja realmente desativar o funcionário "${usuario.nome}"?\n\n` +
      "Ele perderá o acesso ao sistema, mas seu histórico será mantido."
    );

    if (!confirmado) {
      return;
    }

    setErro("");
    setSucesso("");
    setDesativandoId(usuario.id_usuario);

    try {
      await api(`/usuarios/${usuario.id_usuario}`, {
        method: "DELETE"
      });

      if (usuarioEditando?.id_usuario === usuario.id_usuario) {
        limparFormulario();
      }

      setSucesso("Funcionário desativado com sucesso.");
      await carregarUsuarios();
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível desativar o funcionário."
      );
    } finally {
      setDesativandoId(null);
    }
  }

  function nomePerfil(perfilUsuario: Perfil) {
    switch (perfilUsuario) {
      case "ADMINISTRADOR":
        return "Administrador";
      case "FUNCIONARIO":
        return "Funcionário";
      default:
        return "Doador";
    }
  }

  return (
    <div className="usuarios-conteudo">
      <section className="painel usuarios-cadastro">
        <h3>
          {usuarioEditando
            ? "Editar funcionário"
            : "Cadastrar usuário"}
        </h3>

        <p>
          {usuarioEditando
            ? "Atualize os dados do funcionário selecionado."
            : "Cadastre funcionários ou administradores do sistema."}
        </p>

        <form onSubmit={(evento) => void salvar(evento)}>
          <label htmlFor="usuario-nome">
            Nome completo
          </label>
          <input
            id="usuario-nome"
            type="text"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            maxLength={100}
            disabled={carregandoAcao}
            required
          />

          <label htmlFor="usuario-email">
            E-mail
          </label>
          <input
            id="usuario-email"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            maxLength={150}
            disabled={carregandoAcao}
            required
          />

          <label htmlFor="usuario-senha">
            {usuarioEditando
              ? "Nova senha (opcional)"
              : "Senha inicial"}
          </label>
          <input
            id="usuario-senha"
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            minLength={8}
            autoComplete="new-password"
            disabled={carregandoAcao}
            required={!usuarioEditando}
          />

          {usuarioEditando ? (
            <p>
              Deixe a senha em branco para manter a atual.
            </p>
          ) : (
            <>
              <label htmlFor="usuario-perfil">
                Perfil de acesso
              </label>
              <select
                id="usuario-perfil"
                value={perfil}
                onChange={(evento) =>
                  setPerfil(
                    evento.target.value as PerfilCadastro
                  )
                }
                disabled={carregandoAcao}
              >
                <option value="FUNCIONARIO">
                  Funcionário
                </option>
                <option value="ADMINISTRADOR">
                  Administrador
                </option>
              </select>
            </>
          )}

          <button
            type="submit"
            className="botao-entrada"
            disabled={carregandoAcao}
          >
            {salvando
              ? "Salvando..."
              : usuarioEditando
                ? "Salvar alterações"
                : "Cadastrar usuário"}
          </button>

          {usuarioEditando && (
            <button
              type="button"
              className="usuarios-atualizar"
              onClick={cancelarEdicao}
              disabled={carregandoAcao}
              style={{
                width: "100%",
                marginTop: "10px"
              }}
            >
              Cancelar edição
            </button>
          )}
        </form>

        {sucesso && (
          <p role="status" className="usuarios-sucesso">
            {sucesso}
          </p>
        )}

        {erro && (
          <p role="alert" className="usuarios-erro">
            {erro}
          </p>
        )}
      </section>

      <section className="painel usuarios-listagem">
        <div className="usuarios-cabecalho">
          <h3>Usuários cadastrados</h3>

          <button
            type="button"
            className="usuarios-atualizar"
            onClick={() => {
              setErro("");
              void carregarUsuarios();
            }}
            disabled={carregando || carregandoAcao}
          >
            Atualizar
          </button>
        </div>

        {carregando ? (
          <p>Carregando usuários...</p>
        ) : (
          <div className="usuarios-tabela">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((usuario) => {
                  const podeGerenciar =
                    usuario.perfil === "FUNCIONARIO" &&
                    usuario.ativo;

                  return (
                    <tr key={usuario.id_usuario}>
                      <td>{usuario.id_usuario}</td>
                      <td>{usuario.nome}</td>
                      <td>{usuario.email}</td>
                      <td>{nomePerfil(usuario.perfil)}</td>

                      <td>
                        <span
                          style={{
                            color: usuario.ativo
                              ? "#287d32"
                              : "#b42318",
                            fontWeight: 600
                          }}
                        >
                          {usuario.ativo
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </td>

                      <td>
                        {podeGerenciar ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap"
                            }}
                          >
                            <button
                              type="button"
                              className="usuarios-atualizar"
                              onClick={() => iniciarEdicao(usuario)}
                              disabled={carregandoAcao}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="usuarios-atualizar"
                              onClick={() =>
                                void desativar(usuario)
                              }
                              disabled={carregandoAcao}
                              style={{
                                color: "#b42318",
                                borderColor: "#b42318"
                              }}
                            >
                              {desativandoId === usuario.id_usuario
                                ? "Desativando..."
                                : "Desativar"}
                            </button>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {usuarios.length === 0 && (
              <p>Nenhum usuário encontrado.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
