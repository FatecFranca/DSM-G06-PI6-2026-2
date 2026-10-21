import { Router } from "express";
import { db } from "../db";
import { proteger } from "../proteger";
import { exigir, idValido } from "../validar";
const rotas = Router();
rotas.use(proteger("FUNCIONARIO", "ADMINISTRADOR"));
rotas.get("/", async (_req, res) => {
  const { rows } = await db.query(`SELECT i.id_item, i.nome, i.unidade_medida,
    COALESCE(SUM(CASE WHEN m.tipo='ENTRADA' THEN m.quantidade
      ELSE -m.quantidade END),0) AS saldo
    FROM item i LEFT JOIN movimentacao_estoque m ON m.id_item=i.id_item
    GROUP BY i.id_item ORDER BY i.nome`);
  res.json(rows);
});
rotas.post("/receber/:id", async (req, res) => {
  const id = idValido(req.params.id);
  const cliente = await db.connect();
  try {
    await cliente.query("BEGIN");
    const d = await cliente.query(`SELECT * FROM doacao
      WHERE id_doacao=$1 FOR UPDATE`, [id]);
    exigir(d.rows.length, "Doacao nao encontrada", 404);
    exigir(d.rows[0].status === "CADASTRADA", "Doacao ja processada", 409);
    await cliente.query(`INSERT INTO movimentacao_estoque
      (id_item,id_funcionario,id_doacao,tipo,quantidade)
      SELECT id_item,$1,id_doacao,'ENTRADA',quantidade FROM item_doacao
      WHERE id_doacao=$2`, [res.locals.usuario.id_usuario, id]);
    await cliente.query("UPDATE doacao SET status='RECEBIDA' WHERE id_doacao=$1", [id]);
    await cliente.query("COMMIT");
    res.json({ mensagem: "Doacao recebida" });
  } catch (erro) { await cliente.query("ROLLBACK"); throw erro; }
  finally { cliente.release(); }
});
export default rotas;
