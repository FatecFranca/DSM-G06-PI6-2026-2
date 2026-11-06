
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../services/api";

type Perfil = "DOADOR" | "FUNCIONARIO" | "ADMINISTRADOR";

type Usuario = {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: Perfil;
};

type PerfilCadastro = "FUNCIONARIO" | "ADMINISTRADOR";

export default function GerenciamentoUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilCadastro>("FUNCIONARIO");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    setErro("");

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

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      await api("/usuarios", {
        method: "POST",
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          perfil
        })
      });

      setSucesso("Usuário cadastrado com sucesso.");
      setNome("");
      setEmail("");
      setSenha("");
      setPerfil("FUNCIONARIO");

      await carregarUsuarios();
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível cadastrar o usuário."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="usuarios-conteudo">
      <section className="painel usuarios-cadastro">
        <h3>Cadastrar usuário</h3>
        <p>Cadastre funcionários ou administradores do sistema.</p>

        <form onSubmit={(evento) => void cadastrar(evento)}>
          <label htmlFor="usuario-nome">Nome completo</label>
          <input
            id="usuario-nome"
            type="text"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            maxLength={100}
            required
          />

          <label htmlFor="usuario-email">E-mail</label>
          <input
            id="usuario-email"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            maxLength={150}
            required
          />

          <label htmlFor="usuario-senha">Senha inicial</label>
          <input
            id="usuario-senha"
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />

          <label htmlFor="usuario-perfil">Perfil de acesso</label>
          <select
            id="usuario-perfil"
            value={perfil}
            onChange={(evento) =>
              setPerfil(evento.target.value as PerfilCadastro)
            }
          >
            <option value="FUNCIONARIO">Funcionário</option>
            <option value="ADMINISTRADOR">Administrador</option>
          </select>

          <button
            type="submit"
            className="botao-entrada"
            disabled={salvando}
          >
            {salvando ? "Cadastrando..." : "Cadastrar usuário"}
          </button>
        </form>

        {sucesso && <p role="status" className="usuarios-sucesso">{sucesso}</p>}
        {erro && <p role="alert" className="usuarios-erro">{erro}</p>}
      </section>

      <section className="painel usuarios-listagem">
        <div className="usuarios-cabecalho">
          <h3>Usuários cadastrados</h3>

          <button
            type="button"
            className="usuarios-atualizar"
            onClick={() => void carregarUsuarios()}
            disabled={carregando}
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
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id_usuario}>
                    <td>{usuario.id_usuario}</td>
                    <td>{usuario.nome}</td>
                    <td>{usuario.email}</td>
                    <td>
                      {usuario.perfil === "ADMINISTRADOR"
                        ? "Administrador"
                        : usuario.perfil === "FUNCIONARIO"
                          ? "Funcionário"
                          : "Doador"}
                    </td>
                  </tr>
                ))}
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
