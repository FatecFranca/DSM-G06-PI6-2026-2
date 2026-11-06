
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

function token(id, perfil) {
  return jwt.sign(
    { perfil },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      issuer: "doefacil",
      subject: String(id),
      expiresIn: "1h"
    }
  );
}

async function criarUsuario(perfil) {
  const email = `teste-${randomUUID()}@doefacil.test`;
  const hash = await bcrypt.hash(senha, 12);

  emails.push(email);

  const { rows } = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, $4)
     RETURNING id_usuario`,
    ["Usuario de teste", email, hash, perfil]
  );

  return {
    id: rows[0].id_usuario,
    email,
    token: token(rows[0].id_usuario, perfil)
  };
}

function dadosCadastro() {
  const email = `novo-${randomUUID()}@doefacil.test`;
  emails.push(email);

  return {
    nome: "Funcionario novo",
    email,
    senha,
    perfil: "FUNCIONARIO"
  };
}

test("usuarios exige autenticacao", async () => {
  const resposta = await request(app).get("/api/usuarios");

  assert.equal(resposta.status, 401);
});

test("doador nao pode listar usuarios", async () => {
  const doador = await criarUsuario("DOADOR");

  const resposta = await request(app)
    .get("/api/usuarios")
    .set("Authorization", `Bearer ${doador.token}`);

  assert.equal(resposta.status, 403);
});

test("funcionario nao pode cadastrar usuarios", async () => {
  const funcionario = await criarUsuario("FUNCIONARIO");

  const resposta = await request(app)
    .post("/api/usuarios")
    .set("Authorization", `Bearer ${funcionario.token}`)
    .send(dadosCadastro());

  assert.equal(resposta.status, 403);
});

test("administrador pode listar usuarios sem expor senhas", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");

  const resposta = await request(app)
    .get("/api/usuarios")
    .set("Authorization", `Bearer ${admin.token}`);

  assert.equal(resposta.status, 200);
  assert.ok(Array.isArray(resposta.body));

  for (const usuario of resposta.body) {
    assert.equal(usuario.senha_hash, undefined);
    assert.equal(usuario.senha, undefined);
  }
});

test("administrador pode cadastrar funcionario", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const dados = dadosCadastro();

  const resposta = await request(app)
    .post("/api/usuarios")
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dados);

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.usuario.email, dados.email);
  assert.equal(resposta.body.usuario.perfil, "FUNCIONARIO");
  assert.equal(resposta.body.usuario.senha_hash, undefined);

  const { rows } = await db.query(
    "SELECT senha_hash FROM usuario WHERE email = $1",
    [dados.email]
  );

  assert.equal(rows.length, 1);
  assert.equal(
    await bcrypt.compare(dados.senha, rows[0].senha_hash),
    true
  );
});

test("administrador pode cadastrar outro administrador", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const dados = {
    ...dadosCadastro(),
    perfil: "ADMINISTRADOR"
  };

  const resposta = await request(app)
    .post("/api/usuarios")
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dados);

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.usuario.perfil, "ADMINISTRADOR");
});

test("cadastro administrativo rejeita perfil de doador", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const dados = {
    ...dadosCadastro(),
    perfil: "DOADOR"
  };

  const resposta = await request(app)
    .post("/api/usuarios")
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dados);

  assert.equal(resposta.status, 400);
});

test("cadastro administrativo rejeita senha curta", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const dados = {
    ...dadosCadastro(),
    senha: "123"
  };

  const resposta = await request(app)
    .post("/api/usuarios")
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dados);

  assert.equal(resposta.status, 400);
});

test("cadastro administrativo rejeita email duplicado", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const dados = dadosCadastro();

  await request(app)
    .post("/api/usuarios")
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dados)
    .expect(201);

  const resposta = await request(app)
    .post("/api/usuarios")
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dados);

  assert.equal(resposta.status, 409);
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
