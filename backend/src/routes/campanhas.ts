import { Router } from "express";
import { db } from "../db";
import { proteger } from "../proteger";
import { exigir, idValido } from "../validar";
const rotas = Router();
function dataValida(valor: unknown) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(valor);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0,10) === valor;
}
function dados(body: Record<string, unknown>) {
  const titulo = String(body.titulo || "").trim();
  const fim = body.data_fim || null;
  const status = body.status || "ATIVA";
  exigir(titulo.length >= 3 && titulo.length <= 120, "Titulo: de 3 a 120 caracteres");
  exigir(dataValida(body.data_inicio) && (!fim || dataValida(fim)), "Datas invalidas");
  exigir(!fim || String(fim) >= String(body.data_inicio), "Data final anterior ao inicio");
  exigir(["ATIVA", "ENCERRADA"].includes(String(status)), "Status invalido");
  return [titulo, String(body.descricao || ""), body.data_inicio, fim, status];
}
rotas.get("/", async (req, res) => {
  const status = req.query.status || null;
  exigir(!status || ["ATIVA", "ENCERRADA"].includes(String(status)), "Status invalido");
  const { rows } = await db.query(`SELECT * FROM campanha
    WHERE status <> 'CANCELADA' AND ($1::text IS NULL OR status=$1)
    ORDER BY id_campanha DESC`, [status]);
  res.json(rows);
});
rotas.get("/:id", async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM campanha
    WHERE id_campanha=$1 AND status <> 'CANCELADA'`, [idValido(req.params.id)]);
  exigir(rows.length, "Campanha nao encontrada", 404); res.json(rows[0]);
});
rotas.post("/", proteger("ADMINISTRADOR"), async (req, res) => {
  const { rows } = await db.query(`INSERT INTO campanha
    (titulo,descricao,data_inicio,data_fim,status) VALUES ($1,$2,$3,$4,$5)
    RETURNING *`, dados(req.body));
  res.status(201).json(rows[0]);
});
rotas.put("/:id", proteger("ADMINISTRADOR"), async (req, res) => {
  const { rows } = await db.query(`UPDATE campanha SET titulo=$1,descricao=$2,
    data_inicio=$3,data_fim=$4,status=$5 WHERE id_campanha=$6
    AND status <> 'CANCELADA' RETURNING *`, [...dados(req.body), idValido(req.params.id)]);
  exigir(rows.length, "Campanha nao encontrada", 404); res.json(rows[0]);
});
rotas.delete("/:id", proteger("ADMINISTRADOR"), async (req, res) => {
  const r = await db.query(`UPDATE campanha SET status='CANCELADA'
    WHERE id_campanha=$1 AND status <> 'CANCELADA'`, [idValido(req.params.id)]);
  exigir(r.rowCount, "Campanha nao encontrada", 404); res.status(204).send();
});
export default rotas;
