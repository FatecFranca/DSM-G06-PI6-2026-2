
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
let idAdministrador;
let idCategoria;
let idItem;

let tokenFuncionario;
let tokenDoador;
let tokenAdministrador;

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

async function consultarSaldo() {
  const { rows } = await db.query(
    `SELECT COALESCE(
       SUM(
         CASE
           WHEN tipo = 'ENTRADA' THEN quantidade
           ELSE -quantidade
         END
       ), 0
     ) AS saldo
     FROM movimentacao_estoque
     WHERE id_item = $1`,
    [idItem]
  );

  return Number(rows[0].saldo);
}

before(async () => {
  assert.equal(
    (await db.query("SELECT current_database() AS banco")).rows[0].banco,
    "doefacil_testes",
    "Os testes de estoque devem usar exclusivamente doefacil_testes"
  );

  const categoria = await db.query(
    `INSERT INTO categoria (nome)
     VALUES ($1)
     RETURNING id_categoria`,
    [`Categoria estoque ${identificador}`]
  );

  idCategoria = categoria.rows[0].id_categoria;

  const item = await db.query(
    `INSERT INTO item
       (id_categoria, nome, unidade_medida, estoque_minimo)
     VALUES ($1, $2, 'unidade', 0)
     RETURNING id_item`,
    [idCategoria, `Item estoque ${identificador}`]
  );

  idItem = item.rows[0].id_item;

  const funcionario = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ('Funcionario estoque', $1, 'teste-sem-login', 'FUNCIONARIO')
     RETURNING id_usuario`,
    [`funcionario-${identificador}@doefacil.test`]
  );

  idFuncionario = funcionario.rows[0].id_usuario;

  const doador = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ('Doador estoque', $1, 'teste-sem-login', 'DOADOR')
     RETURNING id_usuario`,
    [`doador-${identificador}@doefacil.test`]
  );

  idDoador = doador.rows[0].id_usuario;

  const administrador = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil)
     VALUES ('Administrador estoque', $1, 'teste-sem-login', 'ADMINISTRADOR')
     RETURNING id_usuario`,
    [`admin-${identificador}@doefacil.test`]
  );

  idAdministrador = administrador.rows[0].id_usuario;

  tokenFuncionario = gerarToken(idFuncionario, "FUNCIONARIO");
  tokenDoador = gerarToken(idDoador, "DOADOR");
  tokenAdministrador = gerarToken(idAdministrador, "ADMINISTRADOR");

  await db.query(
    `INSERT INTO movimentacao_estoque
       (id_item, id_funcionario, tipo, quantidade)
     VALUES ($1, $2, 'ENTRADA', 10)`,
    [idItem, idFuncionario]
  );
});

test("saida de estoque exige autenticacao", async () => {
  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .send({ id_item: idItem, quantidade: 1 });

  assert.equal(resposta.status, 401);
});

test("doador nao pode registrar saida de estoque", async () => {
  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenDoador}`)
    .send({ id_item: idItem, quantidade: 1 });

  assert.equal(resposta.status, 403);
});

test("saida com quantidade zero retorna 400", async () => {
  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenFuncionario}`)
    .send({ id_item: idItem, quantidade: 0 });

  assert.equal(resposta.status, 400);
});

test("saida com quantidade negativa retorna 400", async () => {
  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenFuncionario}`)
    .send({ id_item: idItem, quantidade: -2 });

  assert.equal(resposta.status, 400);
});

test("saida com mais de duas casas decimais retorna 400", async () => {
  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenFuncionario}`)
    .send({ id_item: idItem, quantidade: 1.234 });

  assert.equal(resposta.status, 400);
});

test("saida de item inexistente retorna 404", async () => {
  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenFuncionario}`)
    .send({ id_item: 2147483647, quantidade: 1 });

  assert.equal(resposta.status, 404);
});

test("saida valida registra movimentacao e reduz saldo", async () => {
  const saldoAnterior = await consultarSaldo();

  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenFuncionario}`)
    .send({ id_item: idItem, quantidade: 2 });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.movimentacao.tipo, "SAIDA");
  assert.equal(Number(resposta.body.movimentacao.quantidade), 2);
  assert.equal(await consultarSaldo(), saldoAnterior - 2);
});

test("saldo insuficiente retorna 409 sem alterar estoque", async () => {
  const saldoAnterior = await consultarSaldo();

  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenFuncionario}`)
    .send({ id_item: idItem, quantidade: saldoAnterior + 1 });

  assert.equal(resposta.status, 409);
  assert.equal(await consultarSaldo(), saldoAnterior);
});

test("saidas simultaneas nao permitem estoque negativo", async () => {
  const saldoAnterior = await consultarSaldo();

  assert.equal(saldoAnterior, 8);

  const requisicao = () =>
    request(app)
      .post("/api/estoque/saidas")
      .set("Authorization", `Bearer ${tokenFuncionario}`)
      .send({ id_item: idItem, quantidade: 6 });

  const respostas = await Promise.all([
    requisicao(),
    requisicao()
  ]);

  const status = respostas.map(r => r.status).sort();

  assert.deepEqual(status, [201, 409]);
  assert.equal(await consultarSaldo(), 2);
});

test("administrador pode registrar saida de estoque", async () => {
  const saldoAnterior = await consultarSaldo();

  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenAdministrador}`)
    .send({ id_item: idItem, quantidade: 1 });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.movimentacao.tipo, "SAIDA");
  assert.equal(Number(resposta.body.movimentacao.id_funcionario), idAdministrador);
  assert.equal(await consultarSaldo(), saldoAnterior - 1);
});

test("saida com saldo exato deixa estoque zerado", async () => {
  const saldoAnterior = await consultarSaldo();

  assert.ok(saldoAnterior > 0);

  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenFuncionario}`)
    .send({ id_item: idItem, quantidade: saldoAnterior });

  assert.equal(resposta.status, 201);
  assert.equal(Number(resposta.body.movimentacao.quantidade), saldoAnterior);
  assert.equal(await consultarSaldo(), 0);
});

after(async () => {
  try {
    if (idItem) {
      await db.query(
        "DELETE FROM movimentacao_estoque WHERE id_item = $1",
        [idItem]
      );

      await db.query(
        "DELETE FROM item WHERE id_item = $1",
        [idItem]
      );
    }

    if (idCategoria) {
      await db.query(
        "DELETE FROM categoria WHERE id_categoria = $1",
        [idCategoria]
      );
    }

    const usuarios = [
      idFuncionario,
      idDoador,
      idAdministrador
    ].filter(Boolean);

    if (usuarios.length > 0) {
      await db.query(
        "DELETE FROM usuario WHERE id_usuario = ANY($1::int[])",
        [usuarios]
      );
    }
  } finally {
    await db.end();
  }
});
