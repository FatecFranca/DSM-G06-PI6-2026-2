
import { Router } from "express";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { db } from "../db";
import { exigir } from "../validar";

const rotas = Router();

type Usuario = {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: string;
};

type UsuarioLogin = Usuario & {
  senha_hash: string;
  ativo: boolean;
};

const MENSAGEM_LOGIN = "E-mail ou senha incorretos.";

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
    typeof valor === "string"
      ? valor
      : "";

  exigir(
    senha.length >= 8,
    "Use pelo menos 8 caracteres na senha."
  );

  exigir(
    Buffer.byteLength(senha, "utf8") <= 72,
    "A senha e muito longa. Use uma senha menor."
  );

  return senha;
}

// Cadastro publico: cria somente usuarios DOADOR.
rotas.post("/cadastro", async (req, res) => {
  const corpo = req.body ?? {};

  const nome =
    typeof corpo.nome === "string"
      ? corpo.nome.trim()
      : "";

  exigir(
    nome.length > 0 && nome.length <= 100,
    "Informe um nome com ate 100 caracteres."
  );

  const email = validarEmail(corpo.email);
  const senha = validarSenha(corpo.senha);

  const senhaHash = await bcrypt.hash(senha, 12);

  const { rows } = await db.query<Usuario>(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, 'DOADOR')
     ON CONFLICT (email) DO NOTHING
     RETURNING id_usuario, nome, email, perfil`,
    [nome, email, senhaHash]
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

// Login: somente usuarios ativos podem acessar o sistema.
rotas.post("/login", async (req, res) => {
  const corpo = req.body ?? {};

  const email =
    typeof corpo.email === "string"
      ? corpo.email.trim().toLowerCase()
      : "";

  const senha =
    typeof corpo.senha === "string"
      ? corpo.senha
      : "";

  const credenciaisValidas =
    email.length > 0 &&
    email.length <= 150 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    senha.length >= 8 &&
    Buffer.byteLength(senha, "utf8") <= 72;

  exigir(
    credenciaisValidas,
    MENSAGEM_LOGIN,
    401
  );

  const { rows } = await db.query<UsuarioLogin>(
    `SELECT
       id_usuario,
       nome,
       email,
       perfil,
       senha_hash,
       ativo
     FROM usuario
     WHERE email = $1`,
    [email]
  );

  const usuario = rows[0];

  const senhaCorreta = usuario
    ? await bcrypt.compare(senha, usuario.senha_hash)
    : false;

  exigir(
    senhaCorreta && usuario?.ativo === true,
    MENSAGEM_LOGIN,
    401
  );

  const chave = process.env.JWT_SECRET;

  if (!chave || chave.length < 32) {
    throw Object.assign(
      new Error("Autenticacao nao configurada."),
      { status: 503 }
    );
  }

  const token = sign(
    {
      perfil: usuario.perfil
    },
    chave,
    {
      algorithm: "HS256",
      issuer: "doefacil",
      subject: String(usuario.id_usuario),
      expiresIn: "1h"
    }
  );

  res.json({
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }
  });
});

export default rotas;
