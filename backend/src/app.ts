import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { db } from "./db";
import auth from "./routes/auth";
import campanhas from "./routes/campanhas";
import doacoes from "./routes/doacoes";
import estoque from "./routes/estoque";
const app = express();
const origens = (process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:4173").split(",");
app.use(cors({ origin: origens }));
app.use(express.json({ limit: "100kb" }));
app.get("/", (_req, res) => res.json({ mensagem: "API do DoeFacil funcionando!" }));
app.get("/api/status", (_req, res) => res.json({ sistema: "DoeFacil", status: "online" }));
app.get("/api/health", async (_req, res) => {
  try { await db.query("SELECT 1"); res.json({ banco: "conectado" }); }
  catch { res.status(503).json({ mensagem: "Banco indisponivel" }); }
});
app.get("/api/itens", async (_req, res) => {
  const { rows } = await db.query("SELECT * FROM item ORDER BY nome");
  res.json(rows);
});
app.use("/api/auth", auth);
app.use("/api/campanhas", campanhas);
app.use("/api/doacoes", doacoes);
app.use("/api/estoque", estoque);
app.use((_req, res) => res.status(404).json({ mensagem: "Rota nao encontrada" }));
const erros: ErrorRequestHandler = (erro, _req, res, _next) => {
  const status = erro.status ||
    (erro.code === "23505" ? 409 : erro.code === "23503" ? 400 : 500);
  res.status(status).json({ mensagem: status < 500 ? erro.message : "Erro interno na API" });
};
app.use(erros);
export default app;
