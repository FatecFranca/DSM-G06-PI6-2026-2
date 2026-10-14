const { test } = require("node:test");
const assert = require("node:assert/strict");
const { sign } = require("jsonwebtoken");
const request = require("supertest");
const app = require("../dist/app").default;
const { db } = require("../dist/db");
test("criar campanha sem login retorna 401", async () => {
  const r = await request(app).post("/api/campanhas").send({ titulo: "Teste" });
  assert.equal(r.status, 401);
});
test("data final antes do inicio retorna 400", async () => {
  const token = sign({ perfil: "ADMINISTRADOR" }, process.env.JWT_SECRET, {
    subject: "1", issuer: "doefacil", expiresIn: "1m", algorithm: "HS256",
  });
  const r = await request(app).post("/api/campanhas")
    .set("Authorization", "Bearer " + token)
    .send({ titulo: "Teste", data_inicio: "2026-10-09", data_fim: "2026-10-01" });
  assert.equal(r.status, 400);
});
test.after(async () => { await db.end(); });
