
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

function dadosEdicao() {
  const email = `editado-${randomUUID()}@doefacil.test`;
  emails.push(email);

  return {
    nome: "Funcionario atualizado",
    email
  };
}

// TESTES EXISTENTES

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
    assert.equal(typeof usuario.ativo, "boolean");
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
  assert.equal(resposta.body.usuario.ativo, true);
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

// NOVOS TESTES: EDICAO DE FUNCIONARIOS

test("administrador pode editar nome e email de funcionario", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");
  const dados = dadosEdicao();

  const resposta = await request(app)
    .put(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dados);

  assert.equal(resposta.status, 200);
  assert.equal(resposta.body.usuario.nome, dados.nome);
  assert.equal(resposta.body.usuario.email, dados.email);
  assert.equal(resposta.body.usuario.perfil, "FUNCIONARIO");
  assert.equal(resposta.body.usuario.ativo, true);
  assert.equal(resposta.body.usuario.senha_hash, undefined);

  const { rows } = await db.query(
    "SELECT nome, email, perfil, ativo FROM usuario WHERE id_usuario = $1",
    [funcionario.id]
  );

  assert.equal(rows[0].nome, dados.nome);
  assert.equal(rows[0].email, dados.email);
  assert.equal(rows[0].perfil, "FUNCIONARIO");
  assert.equal(rows[0].ativo, true);
});

test("administrador pode alterar senha de funcionario", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");
  const dados = dadosEdicao();
  const novaSenha = "NovaSenha123!";

  const resposta = await request(app)
    .put(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send({
      ...dados,
      senha: novaSenha
    });

  assert.equal(resposta.status, 200);

  const { rows } = await db.query(
    "SELECT senha_hash FROM usuario WHERE id_usuario = $1",
    [funcionario.id]
  );

  assert.equal(
    await bcrypt.compare(novaSenha, rows[0].senha_hash),
    true
  );

  assert.equal(
    await bcrypt.compare(senha, rows[0].senha_hash),
    false
  );
});

test("edicao rejeita senha curta sem alterar funcionario", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");

  const resposta = await request(app)
    .put(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send({
      ...dadosEdicao(),
      senha: "123"
    });

  assert.equal(resposta.status, 400);

  const { rows } = await db.query(
    "SELECT nome, email FROM usuario WHERE id_usuario = $1",
    [funcionario.id]
  );

  assert.equal(rows[0].nome, "Usuario de teste");
  assert.equal(rows[0].email, funcionario.email);
});

test("edicao rejeita email duplicado", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");
  const outroFuncionario = await criarUsuario("FUNCIONARIO");

  const resposta = await request(app)
    .put(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send({
      nome: "Funcionario atualizado",
      email: outroFuncionario.email
    });

  assert.equal(resposta.status, 409);

  const { rows } = await db.query(
    "SELECT email FROM usuario WHERE id_usuario = $1",
    [funcionario.id]
  );

  assert.equal(rows[0].email, funcionario.email);
});

test("administrador nao pode editar outro administrador", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const outroAdmin = await criarUsuario("ADMINISTRADOR");

  const resposta = await request(app)
    .put(`/api/usuarios/${outroAdmin.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dadosEdicao());

  assert.equal(resposta.status, 404);

  const { rows } = await db.query(
    "SELECT nome, email, perfil FROM usuario WHERE id_usuario = $1",
    [outroAdmin.id]
  );

  assert.equal(rows[0].nome, "Usuario de teste");
  assert.equal(rows[0].email, outroAdmin.email);
  assert.equal(rows[0].perfil, "ADMINISTRADOR");
});

test("administrador nao pode editar doador", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const doador = await criarUsuario("DOADOR");

  const resposta = await request(app)
    .put(`/api/usuarios/${doador.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dadosEdicao());

  assert.equal(resposta.status, 404);
});

test("edicao nao permite alterar perfil", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");

  const resposta = await request(app)
    .put(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send({
      ...dadosEdicao(),
      perfil: "ADMINISTRADOR"
    });

  assert.equal(resposta.status, 400);

  const { rows } = await db.query(
    "SELECT perfil FROM usuario WHERE id_usuario = $1",
    [funcionario.id]
  );

  assert.equal(rows[0].perfil, "FUNCIONARIO");
});

test("funcionario nao pode editar outro funcionario", async () => {
  const funcionario = await criarUsuario("FUNCIONARIO");
  const outroFuncionario = await criarUsuario("FUNCIONARIO");

  const resposta = await request(app)
    .put(`/api/usuarios/${outroFuncionario.id}`)
    .set("Authorization", `Bearer ${funcionario.token}`)
    .send(dadosEdicao());

  assert.equal(resposta.status, 403);
});

// NOVOS TESTES: DESATIVACAO DE FUNCIONARIOS

test("administrador pode desativar funcionario", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");

  const resposta = await request(app)
    .delete(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`);

  assert.equal(resposta.status, 204);

  const { rows } = await db.query(
    "SELECT ativo FROM usuario WHERE id_usuario = $1",
    [funcionario.id]
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].ativo, false);
});

test("funcionario desativado nao consegue fazer login", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");

  await request(app)
    .delete(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .expect(204);

  const resposta = await request(app)
    .post("/api/auth/login")
    .send({
      email: funcionario.email,
      senha
    });

  assert.equal(resposta.status, 401);
  assert.equal(resposta.body.token, undefined);
});

test("token antigo de funcionario desativado deixa de funcionar", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");

  await request(app)
    .delete(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .expect(204);

  const resposta = await request(app)
    .get("/api/movimentacoes")
    .set("Authorization", `Bearer ${funcionario.token}`);

  assert.equal(resposta.status, 401);
});

test("administrador nao pode desativar outro administrador", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const outroAdmin = await criarUsuario("ADMINISTRADOR");

  const resposta = await request(app)
    .delete(`/api/usuarios/${outroAdmin.id}`)
    .set("Authorization", `Bearer ${admin.token}`);

  assert.equal(resposta.status, 404);

  const { rows } = await db.query(
    "SELECT ativo FROM usuario WHERE id_usuario = $1",
    [outroAdmin.id]
  );

  assert.equal(rows[0].ativo, true);
});

test("administrador nao pode desativar doador", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const doador = await criarUsuario("DOADOR");

  const resposta = await request(app)
    .delete(`/api/usuarios/${doador.id}`)
    .set("Authorization", `Bearer ${admin.token}`);

  assert.equal(resposta.status, 404);

  const { rows } = await db.query(
    "SELECT ativo FROM usuario WHERE id_usuario = $1",
    [doador.id]
  );

  assert.equal(rows[0].ativo, true);
});

test("funcionario nao pode desativar outro funcionario", async () => {
  const funcionario = await criarUsuario("FUNCIONARIO");
  const outroFuncionario = await criarUsuario("FUNCIONARIO");

  const resposta = await request(app)
    .delete(`/api/usuarios/${outroFuncionario.id}`)
    .set("Authorization", `Bearer ${funcionario.token}`);

  assert.equal(resposta.status, 403);
});

test("funcionario desativado nao pode ser editado", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");

  await request(app)
    .delete(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .expect(204);

  const resposta = await request(app)
    .put(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .send(dadosEdicao());

  assert.equal(resposta.status, 404);
});

test("nao e permitido desativar funcionario duas vezes", async () => {
  const admin = await criarUsuario("ADMINISTRADOR");
  const funcionario = await criarUsuario("FUNCIONARIO");

  await request(app)
    .delete(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .expect(204);

  const resposta = await request(app)
    .delete(`/api/usuarios/${funcionario.id}`)
    .set("Authorization", `Bearer ${admin.token}`);

  assert.equal(resposta.status, 404);
});

// LIMPEZA DOS REGISTROS CRIADOS PELOS TESTES

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
