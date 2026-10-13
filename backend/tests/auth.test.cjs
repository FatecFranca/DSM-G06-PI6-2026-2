require("dotenv/config");

const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../dist/app").default;
const { db } = require("../dist/db");

const emails = [];
const senha = "Teste12345!";

function novoUsuario() {
  const email = `teste-${randomUUID()}@doefacil.test`;
  emails.push(email);

  return { nome: "Pessoa de teste", email, senha };
}

async function usuarioParaLogin() {
  const dados = novoUsuario();
  const hash = await bcrypt.hash(dados.senha, 12);

  const { rows } = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, 'DOADOR')
     RETURNING id_usuario`,
    [dados.nome, dados.email, hash]
  );

  return { ...dados, id_usuario: rows[0].id_usuario };
}

test("cadastro cria doador e protege a senha", async () => {
  const dados = novoUsuario();

  const resposta = await request(app)
    .post("/api/auth/cadastro")
    .send({ ...dados, perfil: "ADMINISTRADOR" });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.usuario.perfil, "DOADOR");
  assert.equal(resposta.body.usuario.senha_hash, undefined);
  assert.equal(resposta.body.usuario.senha, undefined);

  const { rows } = await db.query(
    "SELECT perfil, senha_hash FROM usuario WHERE email = $1",
    [dados.email]
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].perfil, "DOADOR");
  assert.notEqual(rows[0].senha_hash, dados.senha);

  assert.equal(
    await bcrypt.compare(dados.senha, rows[0].senha_hash),
    true
  );
});

test("cadastro rejeita senha com menos de 8 caracteres", async () => {
  const dados = novoUsuario();

  const resposta = await request(app)
    .post("/api/auth/cadastro")
    .send({ ...dados, senha: "123" });

  assert.equal(resposta.status, 400);

  const { rows } = await db.query(
    "SELECT id_usuario FROM usuario WHERE email = $1",
    [dados.email]
  );

  assert.equal(rows.length, 0);
});

test("cadastro rejeita email duplicado", async () => {
  const dados = await usuarioParaLogin();

  const resposta = await request(app)
    .post("/api/auth/cadastro")
    .send({
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha
    });

  assert.equal(resposta.status, 409);
});

test("login retorna usuario e token JWT valido", async () => {
  const dados = await usuarioParaLogin();

  const resposta = await request(app)
    .post("/api/auth/login")
    .send({ email: dados.email, senha: dados.senha });

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.usuario.id_usuario, dados.id_usuario);
  assert.equal(resposta.body.usuario.perfil, "DOADOR");
  assert.equal(resposta.body.usuario.senha_hash, undefined);
  assert.equal(resposta.body.usuario.senha, undefined);

  const token = jwt.verify(
    resposta.body.token,
    process.env.JWT_SECRET,
    {
      algorithms: ["HS256"],
      issuer: "doefacil"
    }
  );

  assert.equal(token.sub, String(dados.id_usuario));
  assert.equal(token.perfil, "DOADOR");
  assert.ok(token.exp > Math.floor(Date.now() / 1000));
});

test("login rejeita senha incorreta", async () => {
  const dados = await usuarioParaLogin();

  const resposta = await request(app)
    .post("/api/auth/login")
    .send({
      email: dados.email,
      senha: "SenhaErrada123!"
    });

  assert.equal(resposta.status, 401);
  assert.equal(resposta.body.token, undefined);
});

after(async () => {
  try {
    if (emails.length) {
      await db.query(
        "DELETE FROM usuario WHERE email = ANY($1::text[])",
        [emails]
      );
    }
  } finally {
    await db.end();
  }
});