
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
};

rotas.use(proteger("ADMINISTRADOR"));

rotas.get("/", async (_req, res) => {
  const { rows } = await db.query<Usuario>(
    `SELECT id_usuario, nome, email, perfil
     FROM usuario
     ORDER BY nome, id_usuario`
  );

  res.json(rows);
});

rotas.post("/", async (req, res) => {
  const corpo = req.body ?? {};

  const nome =
    typeof corpo.nome === "string"
      ? corpo.nome.trim()
      : "";

  const email =
    typeof corpo.email === "string"
      ? corpo.email.trim().toLowerCase()
      : "";

  const senha =
    typeof corpo.senha === "string"
      ? corpo.senha
      : "";

  const perfil = corpo.perfil;

  exigir(
    nome.length > 0 && nome.length <= 100,
    "Informe um nome com ate 100 caracteres."
  );

  exigir(
    email.length <= 150 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "Informe um e-mail valido."
  );

  exigir(
    senha.length >= 8 &&
      Buffer.byteLength(senha, "utf8") <= 72,
    "A senha deve ter entre 8 e 72 bytes."
  );

  exigir(
    perfil === "FUNCIONARIO" || perfil === "ADMINISTRADOR",
    "Perfil invalido. Escolha FUNCIONARIO ou ADMINISTRADOR."
  );

  const senhaHash = await bcrypt.hash(senha, 12);

  const { rows } = await db.query<Usuario>(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING id_usuario, nome, email, perfil`,
    [nome, email, senhaHash, perfil]
  );

  exigir(
    rows.length === 1,
    "Este e-mail ja esta cadastrado.",
    409
  );

  res.status(201).json({ usuario: rows[0] });
});

export default rotas;
