const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../dist/app").default;
const { db } = require("../dist/db");
test("status preserva a rota da Sprint 1", async () => {
  const r = await request(app).get("/api/status");
  assert.equal(r.status, 200); assert.equal(r.body.status, "online");
});
test.after(async () => { await db.end(); });
