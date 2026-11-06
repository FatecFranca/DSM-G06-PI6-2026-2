
require("dotenv/config");

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const app = require("../dist/app").default;
const { db } = require("../dist/db");

const identificador = randomUUID();

let idFuncionario;
let idDoador;
let tokenFuncionario;
let tokenDoador;

function gerarToken(idUsuario, perfil) {
  return jwt.sign(
    { perfil },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      issuer: "doefacil",
      subject: String(idUsuario),
      expiresIn: "10m"
    }
  );
}

before(async () => {
  const { rows } = await db.query(
    "SELECT current_database() AS banco"
  );

  assert.equal(
    rows[0].banco,
    "doefacil_testes",
    "Os testes devem usar exclusivamente doefacil_testes"
  );

  const funcionario = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ($1, $2, 'teste-sem-login', 'FUNCIONARIO')
     RETURNING id_usuario`,
    [
      "Funcionario resumo",
      `funcionario-resumo-${identificador}@doefacil.test`
    ]
  );

  idFuncionario = funcionario.rows[0].id_usuario;

  const doador = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ($1, $2, 'teste-sem-login', 'DOADOR')
     RETURNING id_usuario`,
    [
      "Doador resumo",
      `doador-resumo-${identificador}@doefacil.test`
    ]
  );

  idDoador = doador.rows[0].id_usuario;

  tokenFuncionario = gerarToken(idFuncionario, "FUNCIONARIO");
  tokenDoador = gerarToken(idDoador, "DOADOR");
});

test("resumo exige autenticacao", async () => {
  const resposta = await request(app)
    .get("/api/estoque/resumo");

  assert.equal(resposta.status, 401);
});

test("doador nao pode consultar resumo", async () => {
  const resposta = await request(app)
    .get("/api/estoque/resumo")
    .set("Authorization", `Bearer ${tokenDoador}`);

  assert.equal(resposta.status, 403);
});

test("funcionario pode consultar resumo", async () => {
  const resposta = await request(app)
    .get("/api/estoque/resumo")
    .set("Authorization", `Bearer ${tokenFuncionario}`);

  assert.equal(resposta.status, 200);

  assert.equal(
    typeof resposta.body.aguardando_recebimento,
    "number"
  );

  assert.equal(
    typeof resposta.body.recebidas_hoje,
    "number"
  );

  assert.equal(
    typeof resposta.body.itens_estoque_baixo,
    "number"
  );

  assert.ok(resposta.body.aguardando_recebimento >= 0);
  assert.ok(resposta.body.recebidas_hoje >= 0);
  assert.ok(resposta.body.itens_estoque_baixo >= 0);
});

after(async () => {
  try {
    const ids = [idFuncionario, idDoador].filter(Boolean);

    if (ids.length > 0) {
      await db.query(
        "DELETE FROM usuario WHERE id_usuario = ANY($1::int[])",
        [ids]
      );
    }
  } finally {
    await db.end();
  }
});
