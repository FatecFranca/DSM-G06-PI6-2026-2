
import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { proteger } from "../proteger";
import { exigir } from "../validar";

const rotas = Router();

type Usuario = {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
};

function validarId(valor: string | string[]) {
  const id = Number(valor);

  exigir(
    typeof valor === "string" &&
      /^[1-9]\d*$/.test(valor) &&
      Number.isSafeInteger(id),
    "ID de usuario invalido."
  );

  return id;
}

function validarNome(valor: unknown) {
  const nome =
    typeof valor === "string" ? valor.trim() : "";

  exigir(
    nome.length > 0 && nome.length <= 100,
    "Informe um nome com ate 100 caracteres."
  );

  return nome;
}

function validarEmail(valor: unknown) {
  const email =
    typeof valor === "string"
      ? valor.trim().toLowerCase()
      : "";

  exigir(
    email.length <= 150 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "Informe um e-mail valido."
  );

  return email;
}

function validarSenha(valor: unknown) {
  const senha =
    typeof valor === "string" ? valor : "";

  exigir(
    senha.length >= 8 &&
      Buffer.byteLength(senha, "utf8") <= 72,
    "A senha deve ter entre 8 e 72 bytes."
  );

  return senha;
}

// Todas as rotas exigem administrador.
rotas.use(proteger("ADMINISTRADOR"));

// Listar usuarios.
rotas.get("/", async (_req, res) => {
  const { rows } = await db.query<Usuario>(
    `SELECT id_usuario, nome, email, perfil, ativo
     FROM usuario
     ORDER BY nome, id_usuario`
  );

  res.json(rows);
});

// Cadastrar funcionario ou administrador.
rotas.post("/", async (req, res) => {
  const corpo = req.body ?? {};

  const nome = validarNome(corpo.nome);
  const email = validarEmail(corpo.email);
  const senha = validarSenha(corpo.senha);
  const perfil = corpo.perfil;

  exigir(
    perfil === "FUNCIONARIO" ||
      perfil === "ADMINISTRADOR",
    "Perfil invalido. Escolha FUNCIONARIO ou ADMINISTRADOR."
  );

  const senhaHash = await bcrypt.hash(senha, 12);

  const { rows } = await db.query<Usuario>(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING id_usuario, nome, email, perfil, ativo`,
    [nome, email, senhaHash, perfil]
  );

  exigir(
    rows.length === 1,
    "Este e-mail ja esta cadastrado.",
    409
  );

  res.status(201).json({
    usuario: rows[0]
  });
});

// Editar somente funcionarios ativos.
rotas.put("/:id", async (req, res) => {
  const id = validarId(req.params.id);
  const corpo = req.body ?? {};

  exigir(
    corpo.perfil === undefined,
    "Nao e permitido alterar o perfil do usuario."
  );

  exigir(
    corpo.ativo === undefined,
    "Nao e permitido alterar o status nesta rota."
  );

  const nome = validarNome(corpo.nome);
  const email = validarEmail(corpo.email);

  const alterarSenha =
    corpo.senha !== undefined;

  const senha = alterarSenha
    ? validarSenha(corpo.senha)
    : null;

  const senhaHash = senha
    ? await bcrypt.hash(senha, 12)
    : null;

  const { rows } = await db.query<Usuario>(
    `UPDATE usuario
     SET nome = $1,
         email = $2,
         senha_hash = COALESCE($3, senha_hash)
     WHERE id_usuario = $4
       AND perfil = 'FUNCIONARIO'
       AND ativo = TRUE
     RETURNING id_usuario, nome, email, perfil, ativo`,
    [nome, email, senhaHash, id]
  );

  exigir(
    rows.length === 1,
    "Funcionario ativo nao encontrado.",
    404
  );

  res.json({
    usuario: rows[0]
  });
});

// Desativar somente funcionarios.
rotas.delete("/:id", async (req, res) => {
  const id = validarId(req.params.id);

  const { rows } = await db.query<Usuario>(
    `UPDATE usuario
     SET ativo = FALSE
     WHERE id_usuario = $1
       AND perfil = 'FUNCIONARIO'
       AND ativo = TRUE
     RETURNING id_usuario`,
    [id]
  );

  exigir(
    rows.length === 1,
    "Funcionario ativo nao encontrado.",
    404
  );

  res.status(204).send();
});

export default rotas;
