
import { Router } from "express";
import { db } from "../db";
import { proteger } from "../proteger";
import { exigir, idValido } from "../validar";

const rotas = Router();

rotas.use(proteger("FUNCIONARIO", "ADMINISTRADOR"));

// Consultar historico de entradas e saidas do estoque
rotas.get("/", async (req, res) => {
  const parametro = req.query.id_item;
  let idItem: number | null = null;

  if (parametro !== undefined) {
    exigir(
      typeof parametro === "string",
      "Informe um ID de item valido",
      400
    );

    idItem = idValido(parametro);
  }

  const { rows } = await db.query(
    `SELECT
       m.id_movimentacao,
       m.id_item,
       i.nome AS nome_item,
       i.unidade_medida,
       m.tipo,
       m.quantidade,
       m.data_movimentacao,
       m.id_funcionario,
       u.nome AS nome_funcionario,
       m.id_doacao
     FROM movimentacao_estoque m
     INNER JOIN item i ON i.id_item = m.id_item
     INNER JOIN usuario u ON u.id_usuario = m.id_funcionario
     WHERE ($1::integer IS NULL OR m.id_item = $1)
     ORDER BY m.data_movimentacao DESC, m.id_movimentacao DESC
     LIMIT 100`,
    [idItem]
  );

  res.json(rows);
});

export default rotas;
