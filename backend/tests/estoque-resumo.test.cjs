
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
let tokenFuncionario;
let tokenDoador;

const idsItens = [];
const idsDoacoes = [];

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

async function consultarResumo() {
  const resposta = await request(app)
    .get("/api/estoque/resumo")
    .set("Authorization", `Bearer ${tokenFuncionario}`);

  assert.equal(resposta.status, 200);

  return resposta.body;
}

async function criarItem(nome, estoqueMinimo) {
  const resultado = await db.query(
    `INSERT INTO item
       (id_categoria, nome, unidade_medida, estoque_minimo)
     VALUES ($1, $2, 'unidade', $3)
     RETURNING id_item`,
    [
      idCategoria,
      `${nome} ${identificador}`,
      estoqueMinimo
    ]
  );

  const id = resultado.rows[0].id_item;
  idsItens.push(id);

  return id;
}

async function criarDoacao(status = "CADASTRADA") {
  const resultado = await db.query(
    `INSERT INTO doacao
       (id_doador, status, observacao)
     VALUES ($1, $2, $3)
     RETURNING id_doacao`,
    [
      idDoador,
      status,
      `Teste de indicadores ${identificador}`
    ]
  );

  const id = resultado.rows[0].id_doacao;
  idsDoacoes.push(id);

  return id;
}

async function criarMovimentacao(
  idItem,
  tipo,
  quantidade,
  idDoacao = null,
  dataMovimentacao = null
) {
  await db.query(
    `INSERT INTO movimentacao_estoque
       (
         id_item,
         id_funcionario,
         id_doacao,
         tipo,
         quantidade,
         data_movimentacao
       )
     VALUES (
       $1, $2, $3, $4, $5,
       COALESCE($6::timestamp, CURRENT_TIMESTAMP)
     )`,
    [
      idItem,
      idFuncionario,
      idDoacao,
      tipo,
      quantidade,
      dataMovimentacao
    ]
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

  const categoria = await db.query(
    `INSERT INTO categoria (nome)
     VALUES ($1)
     RETURNING id_categoria`,
    [`Categoria resumo ${identificador}`]
  );

  idCategoria = categoria.rows[0].id_categoria;

  const funcionario = await db.query(
    `INSERT INTO usuario
       (nome, email, senha_hash, perfil)
     VALUES ($1, $2, 'teste-sem-login', 'FUNCIONARIO')
     RETURNING id_usuario`,
    [
      "Funcionario resumo",
      `funcionario-resumo-${identificador}@doefacil.test`
    ]
  );

  idFuncionario = funcionario.rows[0].id_usuario;

  const doador = await db.query(
    `INSERT INTO usuario
       (nome, email, senha_hash, perfil)
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

// TESTE NOVO: RECEBIMENTO DUPLICADO

test("recebimento duplicado nao aumenta o estoque duas vezes", async () => {
  const idItem = await criarItem(
    "Item recebimento duplicado",
    0
  );

  const idDoacao = await criarDoacao("CADASTRADA");

  await db.query(
    `INSERT INTO item_doacao
       (id_doacao, id_item, quantidade)
     VALUES ($1, $2, $3)`,
    [idDoacao, idItem, 5]
  );

  const consultarSaldo = async () => {
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
  };

  const saldoInicial = await consultarSaldo();

  // Primeiro recebimento deve funcionar.
  const primeiraResposta = await request(app)
    .post(`/api/estoque/receber/${idDoacao}`)
    .set("Authorization", `Bearer ${tokenFuncionario}`);

  assert.equal(primeiraResposta.status, 200);

  assert.equal(
    await consultarSaldo(),
    saldoInicial + 5
  );

  // Segundo recebimento deve ser bloqueado.
  const segundaResposta = await request(app)
    .post(`/api/estoque/receber/${idDoacao}`)
    .set("Authorization", `Bearer ${tokenFuncionario}`);

  assert.equal(segundaResposta.status, 409);

  // O saldo nao pode aumentar novamente.
  assert.equal(
    await consultarSaldo(),
    saldoInicial + 5
  );

  // A doacao deve continuar recebida.
  const { rows } = await db.query(
    `SELECT status
     FROM doacao
     WHERE id_doacao = $1`,
    [idDoacao]
  );

  assert.equal(rows[0].status, "RECEBIDA");

  // Deve existir somente uma movimentacao de entrada.
  const movimentacoes = await db.query(
    `SELECT COUNT(*)::integer AS total
     FROM movimentacao_estoque
     WHERE id_doacao = $1
       AND tipo = 'ENTRADA'`,
    [idDoacao]
  );

  assert.equal(movimentacoes.rows[0].total, 1);
});

// TESTES ORIGINAIS

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
  const resumo = await consultarResumo();

  assert.equal(
    typeof resumo.aguardando_recebimento,
    "number"
  );

  assert.equal(
    typeof resumo.recebidas_hoje,
    "number"
  );

  assert.equal(
    typeof resumo.itens_estoque_baixo,
    "number"
  );

  assert.ok(resumo.aguardando_recebimento >= 0);
  assert.ok(resumo.recebidas_hoje >= 0);
  assert.ok(resumo.itens_estoque_baixo >= 0);
});

test("doacao cadastrada aumenta o total de pendentes", async () => {
  const anterior = await consultarResumo();

  await criarDoacao("CADASTRADA");

  const atual = await consultarResumo();

  assert.equal(
    atual.aguardando_recebimento,
    anterior.aguardando_recebimento + 1
  );
});

test("doacao cancelada deixa de contar como pendente", async () => {
  const idDoacao = await criarDoacao("CADASTRADA");

  const anterior = await consultarResumo();

  await db.query(
    `UPDATE doacao
     SET status = 'CANCELADA'
     WHERE id_doacao = $1`,
    [idDoacao]
  );

  const atual = await consultarResumo();

  assert.equal(
    atual.aguardando_recebimento,
    anterior.aguardando_recebimento - 1
  );
});

test("doacao recebida deixa de contar como pendente", async () => {
  const idDoacao = await criarDoacao("CADASTRADA");

  const anterior = await consultarResumo();

  await db.query(
    `UPDATE doacao
     SET status = 'RECEBIDA'
     WHERE id_doacao = $1`,
    [idDoacao]
  );

  const atual = await consultarResumo();

  assert.equal(
    atual.aguardando_recebimento,
    anterior.aguardando_recebimento - 1
  );
});

test("recebimento com dois itens conta apenas uma doacao", async () => {
  const item1 = await criarItem("Arroz resumo", 0);
  const item2 = await criarItem("Feijao resumo", 0);
  const idDoacao = await criarDoacao("CADASTRADA");

  await db.query(
    `INSERT INTO item_doacao
       (id_doacao, id_item, quantidade)
     VALUES
       ($1, $2, 3),
       ($1, $3, 2)`,
    [idDoacao, item1, item2]
  );

  const anterior = await consultarResumo();

  const resposta = await request(app)
    .post(`/api/estoque/receber/${idDoacao}`)
    .set("Authorization", `Bearer ${tokenFuncionario}`);

  assert.equal(resposta.status, 200);

  const atual = await consultarResumo();

  assert.equal(
    atual.aguardando_recebimento,
    anterior.aguardando_recebimento - 1
  );

  assert.equal(
    atual.recebidas_hoje,
    anterior.recebidas_hoje + 1
  );

  const movimentacoes = await db.query(
    `SELECT COUNT(*)::integer AS total
     FROM movimentacao_estoque
     WHERE id_doacao = $1
       AND tipo = 'ENTRADA'`,
    [idDoacao]
  );

  assert.equal(movimentacoes.rows[0].total, 2);
});

test("item abaixo do minimo aumenta o estoque baixo", async () => {
  const anterior = await consultarResumo();

  await criarItem("Item abaixo minimo", 10);

  const atual = await consultarResumo();

  assert.equal(
    atual.itens_estoque_baixo,
    anterior.itens_estoque_baixo + 1
  );
});

test("item com saldo igual ao minimo nao conta como baixo", async () => {
  const anterior = await consultarResumo();

  const idItem = await criarItem("Item saldo igual", 5);

  await criarMovimentacao(idItem, "ENTRADA", 5);

  const atual = await consultarResumo();

  assert.equal(
    atual.itens_estoque_baixo,
    anterior.itens_estoque_baixo
  );
});

test("item com saldo acima do minimo nao conta como baixo", async () => {
  const anterior = await consultarResumo();

  const idItem = await criarItem("Item saldo acima", 5);

  await criarMovimentacao(idItem, "ENTRADA", 8);

  const atual = await consultarResumo();

  assert.equal(
    atual.itens_estoque_baixo,
    anterior.itens_estoque_baixo
  );
});

test("saida que reduz saldo abaixo do minimo aumenta indicador", async () => {
  const idItem = await criarItem("Item com saida", 5);

  await criarMovimentacao(idItem, "ENTRADA", 8);

  const anterior = await consultarResumo();

  const resposta = await request(app)
    .post("/api/estoque/saidas")
    .set("Authorization", `Bearer ${tokenFuncionario}`)
    .send({
      id_item: idItem,
      quantidade: 4
    });

  assert.equal(resposta.status, 201);

  const atual = await consultarResumo();

  assert.equal(
    atual.itens_estoque_baixo,
    anterior.itens_estoque_baixo + 1
  );
});

test("recebimento de outro dia nao conta como recebido hoje", async () => {
  const idItem = await criarItem("Item data anterior", 0);
  const idDoacao = await criarDoacao("RECEBIDA");

  const anterior = await consultarResumo();

  await criarMovimentacao(
    idItem,
    "ENTRADA",
    1,
    idDoacao,
    "2020-01-01 12:00:00"
  );

  const atual = await consultarResumo();

  assert.equal(
    atual.recebidas_hoje,
    anterior.recebidas_hoje
  );
});

test("recebimento respeita o inicio do dia em Brasilia", async () => {
  const idItem = await criarItem("Item fuso horario", 0);
  const idDoacao = await criarDoacao("RECEBIDA");

  const anterior = await consultarResumo();

  // Inicio do dia atual em Brasilia convertido para UTC.
  const periodo = await db.query(`
    SELECT (
      (
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
      )::timestamp AT TIME ZONE 'America/Sao_Paulo'
    ) AT TIME ZONE 'UTC' AS inicio_utc
  `);

  const inicioUTC = periodo.rows[0].inicio_utc;

  // O PostgreSQL recebe a data UTC sem fuso explicitamente.
  await db.query(
    `INSERT INTO movimentacao_estoque
       (
         id_item,
         id_funcionario,
         id_doacao,
         tipo,
         quantidade,
         data_movimentacao
       )
     VALUES ($1, $2, $3, 'ENTRADA', 1, $4::timestamp)`,
    [
      idItem,
      idFuncionario,
      idDoacao,
      inicioUTC
    ]
  );

  const atual = await consultarResumo();

  assert.equal(
    atual.recebidas_hoje,
    anterior.recebidas_hoje + 1
  );
});

after(async () => {
  try {
    if (idsDoacoes.length > 0) {
      await db.query(
        `DELETE FROM movimentacao_estoque
         WHERE id_doacao = ANY($1::int[])`,
        [idsDoacoes]
      );

      await db.query(
        `DELETE FROM item_doacao
         WHERE id_doacao = ANY($1::int[])`,
        [idsDoacoes]
      );

      await db.query(
        `DELETE FROM doacao
         WHERE id_doacao = ANY($1::int[])`,
        [idsDoacoes]
      );
    }

    if (idsItens.length > 0) {
      await db.query(
        `DELETE FROM movimentacao_estoque
         WHERE id_item = ANY($1::int[])`,
        [idsItens]
      );

      await db.query(
        `DELETE FROM item
         WHERE id_item = ANY($1::int[])`,
        [idsItens]
      );
    }

    if (idCategoria) {
      await db.query(
        "DELETE FROM categoria WHERE id_categoria = $1",
        [idCategoria]
      );
    }

    const idsUsuarios = [
      idFuncionario,
      idDoador
    ].filter(Boolean);

    if (idsUsuarios.length > 0) {
      await db.query(
        `DELETE FROM usuario
         WHERE id_usuario = ANY($1::int[])`,
        [idsUsuarios]
      );
    }
  } finally {
    await db.end();
  }
});
