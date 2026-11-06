
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
let idCategoria;
let idItem1;
let idItem2;
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
  const banco = await db.query(
    "SELECT current_database() AS nome"
  );

  assert.equal(
    banco.rows[0].nome,
    "doefacil_testes",
    "Os testes devem utilizar somente doefacil_testes"
  );

  const funcionario = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, 'FUNCIONARIO')
     RETURNING id_usuario`,
    [
      "Funcionario teste movimentacoes",
      `func-${identificador}@doefacil.test`,
      "senha-nao-utilizada"
    ]
  );

  idFuncionario = funcionario.rows[0].id_usuario;

  const doador = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, 'DOADOR')
     RETURNING id_usuario`,
    [
      "Doador teste movimentacoes",
      `doador-${identificador}@doefacil.test`,
      "senha-nao-utilizada"
    ]
  );

  idDoador = doador.rows[0].id_usuario;

  tokenFuncionario = gerarToken(idFuncionario, "FUNCIONARIO");
  tokenDoador = gerarToken(idDoador, "DOADOR");

  const categoria = await db.query(
    `INSERT INTO categoria (nome)
     VALUES ($1)
     RETURNING id_categoria`,
    [`Categoria movimentacoes ${identificador}`]
  );

  idCategoria = categoria.rows[0].id_categoria;

  const item1 = await db.query(
    `INSERT INTO item
       (id_categoria, nome, unidade_medida, estoque_minimo)
     VALUES ($1, $2, 'unidade', 0)
     RETURNING id_item`,
    [idCategoria, `Item A ${identificador}`]
  );

  idItem1 = item1.rows[0].id_item;

  const item2 = await db.query(
    `INSERT INTO item
       (id_categoria, nome, unidade_medida, estoque_minimo)
     VALUES ($1, $2, 'unidade', 0)
     RETURNING id_item`,
    [idCategoria, `Item B ${identificador}`]
  );

  idItem2 = item2.rows[0].id_item;

  await db.query(
    `INSERT INTO movimentacao_estoque
       (id_item, id_funcionario, tipo, quantidade, data_movimentacao)
     VALUES
       ($1, $3, 'ENTRADA', 10, '2026-11-01 10:00:00'),
       ($1, $3, 'SAIDA', 2, '2026-11-02 10:00:00'),
       ($2, $3, 'ENTRADA', 5, '2026-11-03 10:00:00')`,
    [idItem1, idItem2, idFuncionario]
  );
});

test("historico exige autenticacao", async () => {
  const resposta = await request(app)
    .get("/api/movimentacoes");

  assert.equal(resposta.status, 401);
});

test("doador nao pode consultar movimentacoes", async () => {
  const resposta = await request(app)
    .get("/api/movimentacoes")
    .set("Authorization", `Bearer ${tokenDoador}`);

  assert.equal(resposta.status, 403);
});

test("funcionario pode consultar historico geral", async () => {
  const resposta = await request(app)
    .get("/api/movimentacoes")
    .set("Authorization", `Bearer ${tokenFuncionario}`);

  assert.equal(resposta.status, 200);
  assert.ok(Array.isArray(resposta.body));

  const registros = resposta.body.filter(
    m => m.id_item === idItem1 || m.id_item === idItem2
  );

  assert.equal(registros.length, 3);
});

test("filtro retorna somente movimentacoes do item", async () => {
  const resposta = await request(app)
    .get(`/api/movimentacoes?id_item=${idItem1}`)
    .set("Authorization", `Bearer ${tokenFuncionario}`);

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.length, 2);

  assert.ok(
    resposta.body.every(m => m.id_item === idItem1)
  );
});

test("ID de item invalido retorna 400", async () => {
  const resposta = await request(app)
    .get("/api/movimentacoes?id_item=abc")
    .set("Authorization", `Bearer ${tokenFuncionario}`);

  assert.equal(resposta.status, 400);
});

test("historico apresenta movimentacoes mais recentes primeiro", async () => {
  const resposta = await request(app)
    .get(`/api/movimentacoes?id_item=${idItem1}`)
    .set("Authorization", `Bearer ${tokenFuncionario}`);

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.length, 2);

  assert.equal(resposta.body[0].tipo, "SAIDA");
  assert.equal(resposta.body[1].tipo, "ENTRADA");
});

after(async () => {
  try {
    const itens = [idItem1, idItem2].filter(Boolean);

    if (itens.length) {
      await db.query(
        "DELETE FROM movimentacao_estoque WHERE id_item = ANY($1::int[])",
        [itens]
      );

      await db.query(
        "DELETE FROM item WHERE id_item = ANY($1::int[])",
        [itens]
      );
    }

    if (idCategoria) {
      await db.query(
        "DELETE FROM categoria WHERE id_categoria = $1",
        [idCategoria]
      );
    }

    const usuarios = [idFuncionario, idDoador].filter(Boolean);

    if (usuarios.length) {
      await db.query(
        "DELETE FROM usuario WHERE id_usuario = ANY($1::int[])",
        [usuarios]
      );
    }
  } finally {
    await db.end();
  }
});