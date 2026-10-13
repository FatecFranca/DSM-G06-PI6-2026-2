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

function validarEmail(valor: unknown) {
  const email = typeof valor === "string"
    ? valor.trim().toLowerCase()
    : "";

  exigir(
    email.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "Informe um e-mail válido."
  );

  return email;
}

function validarSenha(valor: unknown) {
  const senha = typeof valor === "string" ? valor : "";

  exigir(
    senha.length >= 8,
    "Use pelo menos 8 caracteres na senha."
  );

  exigir(
    Buffer.byteLength(senha, "utf8") <= 72,
    "A senha é muito longa. Use uma senha menor."
  );

  return senha;
}

rotas.post("/cadastro", async (req, res) => {
  const corpo = req.body ?? {};
  const nome = typeof corpo.nome === "string"
    ? corpo.nome.trim()
    : "";

  exigir(
    nome.length > 0 && nome.length <= 100,
    "Informe um nome com até 100 caracteres."
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
    "Este e-mail já está cadastrado.",
    409
  );

  res.status(201).json({ usuario: rows[0] });
});

rotas.post("/login", async (req, res) => {
  const corpo = req.body ?? {};
  const email = validarEmail(corpo.email);
  const senha = validarSenha(corpo.senha);

  const { rows } = await db.query<Usuario & { senha_hash: string }>(
    `SELECT id_usuario, nome, email, perfil, senha_hash
     FROM usuario WHERE email = $1`,
    [email]
  );

  const usuario = rows[0];

  const senhaCorreta = usuario
    ? await bcrypt.compare(senha, usuario.senha_hash)
    : false;

  exigir(senhaCorreta, "E-mail ou senha incorretos.", 401);

  const chave = process.env.JWT_SECRET;

  if (!chave || chave.length < 32) {
    throw Object.assign(
      new Error("Autenticação não configurada."),
      { status: 503 }
    );
  }

  const token = sign({ perfil: usuario.perfil }, chave, {
    algorithm: "HS256",
    issuer: "doefacil",
    subject: String(usuario.id_usuario),
    expiresIn: "1h"
  });

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