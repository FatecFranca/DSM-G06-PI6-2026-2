
import { Router } from "express";
import type { PoolClient } from "pg";
import { db } from "../db";
import { proteger } from "../proteger";
import { exigir, idValido } from "../validar";

const rotas = Router();

type ItemDoado = {
  id_item: number;
  quantidade: number;
};

function validarItens(valor: unknown): ItemDoado[] {
  if (!Array.isArray(valor) || valor.length === 0 || valor.length > 100) {
    throw Object.assign(
      new Error("Informe entre 1 e 100 itens."),
      { status: 400 }
    );
  }

  const itens = valor.map((linha) => {
    exigir(
      linha && typeof linha === "object" && !Array.isArray(linha),
      "Informe um item válido."
    );

    exigir(
      typeof linha.id_item === "number" && linha.id_item <= 2147483647,
      "Informe um item válido."
    );

    const id_item = idValido(linha.id_item);
    const quantidade = Number(linha.quantidade);

    exigir(
      typeof linha.quantidade === "number" &&
      Number.isFinite(quantidade) &&
      quantidade >= 0.01 &&
      quantidade <= 99999999.99 &&
      Math.abs(quantidade * 100 - Math.round(quantidade * 100)) < 0.000001,
      "Informe uma quantidade positiva com até duas casas decimais."
    );

    return { id_item, quantidade };
  });

  exigir(
    new Set(itens.map((item) => item.id_item)).size === itens.length,
    "Cada item deve aparecer apenas uma vez na doação."
  );

  return itens;
}

function validarObservacao(valor: unknown) {
  exigir(
    valor == null || typeof valor === "string",
    "A observação deve ser um texto."
  );

  const texto = typeof valor === "string" ? valor.trim() || null : null;
  exigir(
    !texto || texto.length <= 1000,
    "Use até 1000 caracteres na observação."
  );

  return texto;
}

async function exigirDoacaoEditavel(
  cliente: PoolClient,
  idDoacao: number,
  idDoador: number
) {
  const { rows } = await cliente.query(
    `SELECT status FROM doacao
     WHERE id_doacao = $1 AND id_doador = $2
     FOR UPDATE`,
    [idDoacao, idDoador]
  );

  exigir(rows.length === 1, "Doação não encontrada.", 404);
  exigir(
    rows[0].status === "CADASTRADA",
    "Somente doações aguardando recebimento podem ser alteradas.",
    409
  );
}

// Consulta de todas as doações para funcionários e administradores
rotas.get(
  "/",
  proteger("FUNCIONARIO", "ADMINISTRADOR"),
  async (_req, res) => {
    const { rows } = await db.query(`
      SELECT
        d.id_doacao,
        u.nome AS doador,
        d.status,
        d.data_cadastro
      FROM doacao d
      JOIN usuario u ON u.id_usuario = d.id_doador
      ORDER BY d.id_doacao DESC
    `);

    res.json(rows);
  }
);

// Consulta das próprias doações
rotas.get("/minhas", proteger("DOADOR"), async (_req, res) => {
  const idDoador = res.locals.usuario.id_usuario;

  const { rows } = await db.query(
    `SELECT d.*, c.titulo AS titulo_campanha,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id_item', i.id_item,
          'nome', i.nome,
          'unidade_medida', i.unidade_medida,
          'quantidade', di.quantidade
        ) ORDER BY di.id_item_doacao)
        FROM item_doacao di
        JOIN item i ON i.id_item = di.id_item
        WHERE di.id_doacao = d.id_doacao
      ), '[]'::json) AS itens
     FROM doacao d
     LEFT JOIN campanha c ON c.id_campanha = d.id_campanha
     WHERE d.id_doador = $1
     ORDER BY d.id_doacao DESC`,
    [idDoador]
  );

  res.json(rows);
});

// Cadastro de doação
rotas.post("/", proteger("DOADOR"), async (req, res) => {
  const corpo = req.body ?? {};
  const itens = validarItens(corpo.itens);
  const idDoador = res.locals.usuario.id_usuario;

  exigir(
    corpo.observacao == null || typeof corpo.observacao === "string",
    "A observação deve ser um texto."
  );

  const observacao = typeof corpo.observacao === "string"
    ? corpo.observacao.trim() || null
    : null;

  exigir(
    !observacao || observacao.length <= 1000,
    "Use até 1000 caracteres na observação."
  );

  const idCampanha = corpo.id_campanha == null
    ? null
    : idValido(corpo.id_campanha);

  exigir(
    idCampanha === null || idCampanha <= 2147483647,
    "Informe uma campanha válida."
  );

  const cliente = await db.connect();

  try {
    await cliente.query("BEGIN");

    const usuario = await cliente.query(
      `SELECT id_usuario FROM usuario
       WHERE id_usuario = $1 AND perfil = 'DOADOR'
       FOR SHARE`,
      [idDoador]
    );

    exigir(usuario.rows.length === 1, "Faça login novamente.", 401);

    if (idCampanha !== null) {
      const campanha = await cliente.query(
        `SELECT id_campanha FROM campanha
         WHERE id_campanha = $1 AND status = 'ATIVA'
         FOR SHARE`,
        [idCampanha]
      );

      exigir(
        campanha.rows.length === 1,
        "Campanha indisponível."
      );
    }

    const cadastrados = await cliente.query(
      `SELECT id_item FROM item
       WHERE id_item = ANY($1::int[])
       FOR SHARE`,
      [itens.map((item) => item.id_item)]
    );

    exigir(
      cadastrados.rows.length === itens.length,
      "Um dos itens não está cadastrado."
    );

    const { rows } = await cliente.query(
      `INSERT INTO doacao (id_doador, id_campanha, observacao)
       VALUES ($1, $2, $3)
       RETURNING id_doacao, id_campanha, data_cadastro, status, observacao`,
      [idDoador, idCampanha, observacao]
    );

    const doacao = rows[0];

    for (const item of itens) {
      await cliente.query(
        `INSERT INTO item_doacao (id_doacao, id_item, quantidade)
         VALUES ($1, $2, $3)`,
        [doacao.id_doacao, item.id_item, item.quantidade]
      );
    }

    await cliente.query("COMMIT");
    res.status(201).json(doacao);
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    cliente.release();
  }
});

// Edição de doação
rotas.put("/:id", proteger("DOADOR"), async (req, res) => {
  const idDoacao = idValido(req.params.id);
  exigir(idDoacao <= 2147483647, "Informe uma doação válida.");

  const idDoador = res.locals.usuario.id_usuario;
  const corpo = req.body ?? {};
  const itens = validarItens(corpo.itens);
  const observacao = validarObservacao(corpo.observacao);
  const cliente = await db.connect();

  try {
    await cliente.query("BEGIN");
    await exigirDoacaoEditavel(cliente, idDoacao, idDoador);

    const cadastrados = await cliente.query(
      `SELECT id_item FROM item
       WHERE id_item = ANY($1::int[]) FOR SHARE`,
      [itens.map((item) => item.id_item)]
    );

    exigir(
      cadastrados.rows.length === itens.length,
      "Um dos itens não está cadastrado."
    );

    await cliente.query(
      "DELETE FROM item_doacao WHERE id_doacao = $1",
      [idDoacao]
    );

    for (const item of itens) {
      await cliente.query(
        `INSERT INTO item_doacao (id_doacao, id_item, quantidade)
         VALUES ($1, $2, $3)`,
        [idDoacao, item.id_item, item.quantidade]
      );
    }

    const { rows } = await cliente.query(
      `UPDATE doacao SET observacao = $2
       WHERE id_doacao = $1 AND id_doador = $3
       RETURNING id_doacao, id_campanha, data_cadastro, status, observacao`,
      [idDoacao, observacao, idDoador]
    );

    await cliente.query("COMMIT");
    res.json(rows[0]);
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    cliente.release();
  }
});

// Cancelamento de doação
rotas.delete("/:id", proteger("DOADOR"), async (req, res) => {
  const idDoacao = idValido(req.params.id);
  exigir(idDoacao <= 2147483647, "Informe uma doação válida.");

  const idDoador = res.locals.usuario.id_usuario;
  const cliente = await db.connect();

  try {
    await cliente.query("BEGIN");
    await exigirDoacaoEditavel(cliente, idDoacao, idDoador);

    const { rows } = await cliente.query(
      `UPDATE doacao SET status = 'CANCELADA'
       WHERE id_doacao = $1 AND id_doador = $2
       RETURNING id_doacao, id_campanha, data_cadastro, status, observacao`,
      [idDoacao, idDoador]
    );

    await cliente.query("COMMIT");
    res.json(rows[0]);
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    cliente.release();
  }
});

export default rotas;
