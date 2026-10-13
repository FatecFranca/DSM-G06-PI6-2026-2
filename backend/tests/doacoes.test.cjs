require("dotenv/config");

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../dist/app").default;
const { db } = require("../dist/db");

const identificador = randomUUID();
const usuarios = [];

let doador, outroDoador, item, minhaDoacao, outraDoacao, token;

async function criarUsuario(email) {
  const hash = await bcrypt.hash("Teste12345!", 12);

  const { rows } = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ('Teste de doacoes', $1, $2, 'DOADOR')
     RETURNING id_usuario`,
    [email, hash]
  );

  const id = rows[0].id_usuario;
  usuarios.push(id);
  return id;
}

async function criarDoacao(idDoador) {
  const { rows } = await db.query(
    "INSERT INTO doacao (id_doador) VALUES ($1) RETURNING id_doacao",
    [idDoador]
  );

  const id = rows[0].id_doacao;

  await db.query(
    `INSERT INTO item_doacao (id_doacao, id_item, quantidade)
     VALUES ($1, $2, 1)`,
    [id, item]
  );

  return id;
}

function dadosDaDoacao() {
  return {
    observacao: "Doacao para teste",
    itens: [{ id_item: item, quantidade: 3 }]
  };
}

before(async () => {
  doador = await criarUsuario(
    `doador-${identificador}@doefacil.test`
  );

  outroDoador = await criarUsuario(
    `outro-${identificador}@doefacil.test`
  );

  const { rows } = await db.query(
    "SELECT id_item FROM item ORDER BY id_item LIMIT 1"
  );

  assert.ok(rows.length, "O banco precisa ter os itens de teste.");
  item = rows[0].id_item;

  minhaDoacao = await criarDoacao(doador);
  outraDoacao = await criarDoacao(outroDoador);

  token = jwt.sign({ perfil: "DOADOR" }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    issuer: "doefacil",
    subject: String(doador),
    expiresIn: "5m"
  });
});

test("cadastro de doacao exige login", async () => {
  const resposta = await request(app)
    .post("/api/doacoes")
    .send(dadosDaDoacao());

  assert.equal(resposta.status, 401);
});

test("consulta de doacoes exige login", async () => {
  const resposta = await request(app).get("/api/doacoes/minhas");

  assert.equal(resposta.status, 401);
});

test("doador consulta somente suas doacoes", async () => {
  const resposta = await request(app)
    .get("/api/doacoes/minhas")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(resposta.status, 200);
  assert.ok(Array.isArray(resposta.body));

  const ids = resposta.body.map((doacao) => doacao.id_doacao);

  assert.ok(ids.includes(minhaDoacao));
  assert.ok(!ids.includes(outraDoacao));
});

test("cadastro salva doacao e itens para o usuario do token", async () => {
  const resposta = await request(app)
    .post("/api/doacoes")
    .set("Authorization", `Bearer ${token}`)
    .send({ ...dadosDaDoacao(), id_doador: outroDoador });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.status, "CADASTRADA");

  const { rows } = await db.query(
    "SELECT id_doador FROM doacao WHERE id_doacao = $1",
    [resposta.body.id_doacao]
  );

  assert.equal(rows[0].id_doador, doador);

  const itens = await db.query(
    "SELECT id_item, quantidade FROM item_doacao WHERE id_doacao = $1",
    [resposta.body.id_doacao]
  );

  assert.equal(itens.rows.length, 1);
  assert.equal(itens.rows[0].id_item, item);
  assert.equal(Number(itens.rows[0].quantidade), 3);
});

test("cadastro rejeita quantidade zero sem salvar doacao", async () => {
  const antes = await db.query(
    "SELECT id_doacao FROM doacao WHERE id_doador = $1",
    [doador]
  );

  const resposta = await request(app)
    .post("/api/doacoes")
    .set("Authorization", `Bearer ${token}`)
    .send({ itens: [{ id_item: item, quantidade: 0 }] });

  assert.equal(resposta.status, 400);

  const depois = await db.query(
    "SELECT id_doacao FROM doacao WHERE id_doador = $1",
    [doador]
  );

  assert.equal(depois.rows.length, antes.rows.length);
});

test("cadastro rejeita doacao sem itens", async () => {
  const resposta = await request(app)
    .post("/api/doacoes")
    .set("Authorization", `Bearer ${token}`)
    .send({ itens: [] });

  assert.equal(resposta.status, 400);
});

after(async () => {
  try {
    if (usuarios.length) {
      await db.query(
        `DELETE FROM item_doacao WHERE id_doacao IN (
          SELECT id_doacao
          FROM doacao
          WHERE id_doador = ANY($1::int[])
        )`,
        [usuarios]
      );

      await db.query(
        "DELETE FROM doacao WHERE id_doador = ANY($1::int[])",
        [usuarios]
      );

      await db.query(
        "DELETE FROM usuario WHERE id_usuario = ANY($1::int[])",
        [usuarios]
      );
    }
  } finally {
    await db.end();
  }
});