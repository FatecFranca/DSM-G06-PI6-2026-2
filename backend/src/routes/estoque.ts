
import { Router } from "express";
import { db } from "../db";
import { proteger } from "../proteger";
import { exigir, idValido } from "../validar";

const rotas = Router();

rotas.use(proteger("FUNCIONARIO", "ADMINISTRADOR"));

// Consultar indicadores reais do estoque
rotas.get("/resumo", async (_req, res) => {
  const [pendentes, recebidasHoje, estoqueBaixo] = await Promise.all([
    db.query(`
      SELECT COUNT(*)::integer AS total
      FROM doacao
      WHERE status = 'CADASTRADA'
    `),

    db.query(`
      SELECT COUNT(DISTINCT id_doacao)::integer AS total
      FROM movimentacao_estoque
      WHERE tipo = 'ENTRADA'
        AND id_doacao IS NOT NULL
        AND data_movimentacao >= CURRENT_DATE
        AND data_movimentacao < CURRENT_DATE + INTERVAL '1 day'
    `),

    db.query(`
      SELECT COUNT(*)::integer AS total
      FROM (
        SELECT
          i.id_item,
          i.estoque_minimo,
          COALESCE(
            SUM(
              CASE
                WHEN m.tipo = 'ENTRADA' THEN m.quantidade
                ELSE -m.quantidade
              END
            ), 0
          ) AS saldo
        FROM item i
        LEFT JOIN movimentacao_estoque m
          ON m.id_item = i.id_item
        GROUP BY i.id_item, i.estoque_minimo
      ) AS estoque
      WHERE estoque.estoque_minimo > 0
        AND estoque.saldo < estoque.estoque_minimo
    `)
  ]);

  res.json({
    aguardando_recebimento: pendentes.rows[0].total,
    recebidas_hoje: recebidasHoje.rows[0].total,
    itens_estoque_baixo: estoqueBaixo.rows[0].total
  });
});


// Consultar saldo de todos os itens
rotas.get("/", async (_req, res) => {
  const { rows } = await db.query(`
    SELECT
      i.id_item,
      i.nome,
      i.unidade_medida,
      COALESCE(
        SUM(
          CASE
            WHEN m.tipo = 'ENTRADA' THEN m.quantidade
            ELSE -m.quantidade
          END
        ), 0
      ) AS saldo
    FROM item i
    LEFT JOIN movimentacao_estoque m
      ON m.id_item = i.id_item
    GROUP BY i.id_item
    ORDER BY i.nome
  `);

  res.json(rows);
});

// Confirmar recebimento de doação
rotas.post("/receber/:id", async (req, res) => {
  const id = idValido(req.params.id);
  const cliente = await db.connect();

  try {
    await cliente.query("BEGIN");

    const d = await cliente.query(
      `SELECT * FROM doacao
       WHERE id_doacao = $1 FOR UPDATE`,
      [id]
    );

    exigir(d.rows.length > 0, "Doacao nao encontrada", 404);

    exigir(
      d.rows[0].status === "CADASTRADA",
      "Doacao ja processada",
      409
    );

    await cliente.query(
      `INSERT INTO movimentacao_estoque
        (id_item, id_funcionario, id_doacao, tipo, quantidade)
       SELECT
         id_item, $1, id_doacao, 'ENTRADA', quantidade
       FROM item_doacao
       WHERE id_doacao = $2`,
      [res.locals.usuario.id_usuario, id]
    );

    await cliente.query(
      "UPDATE doacao SET status = 'RECEBIDA' WHERE id_doacao = $1",
      [id]
    );

    await cliente.query("COMMIT");

    res.json({ mensagem: "Doacao recebida" });
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    cliente.release();
  }
});

// Registrar saída de estoque
rotas.post("/saidas", async (req, res) => {
  const idItem = idValido(req.body?.id_item);
  const quantidade = req.body?.quantidade;

  exigir(
    typeof quantidade === "number" &&
      Number.isFinite(quantidade) &&
      quantidade >= 0.01 &&
      quantidade <= 99999999.99 &&
      Math.abs(
        quantidade * 100 - Math.round(quantidade * 100)
      ) < 0.000001,
    "Informe quantidade positiva com ate duas casas decimais",
    400
  );

  const cliente = await db.connect();

  try {
    await cliente.query("BEGIN");

    // Bloqueia o item para evitar saídas simultâneas
    // que ultrapassem o saldo disponível.
    const item = await cliente.query(
      `SELECT id_item
       FROM item
       WHERE id_item = $1
       FOR UPDATE`,
      [idItem]
    );

    exigir(
      item.rows.length === 1,
      "Item nao encontrado",
      404
    );

    // Calcula o saldo atual do item
    const saldo = await cliente.query(
      `SELECT
         COALESCE(
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

    const saldoAtual = Number(saldo.rows[0].saldo);

    exigir(
      saldoAtual >= quantidade,
      "Saldo insuficiente",
      409
    );

    // Registra a saída no histórico de movimentações
    const resultado = await cliente.query(
      `INSERT INTO movimentacao_estoque
        (id_item, id_funcionario, tipo, quantidade)
       VALUES ($1, $2, 'SAIDA', $3)
       RETURNING *`,
      [
        idItem,
        res.locals.usuario.id_usuario,
        quantidade
      ]
    );

    await cliente.query("COMMIT");

    res.status(201).json({
      mensagem: "Saida registrada com sucesso",
      movimentacao: resultado.rows[0]
    });
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    cliente.release();
  }
});

export default rotas;
