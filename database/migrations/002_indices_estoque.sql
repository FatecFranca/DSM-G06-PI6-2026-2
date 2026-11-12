BEGIN;

-- Melhora as consultas de saldo por item.
CREATE INDEX IF NOT EXISTS idx_movimentacao_item
ON movimentacao_estoque (id_item);

-- Auxilia a ordenacao do historico de movimentacoes.
CREATE INDEX IF NOT EXISTS idx_movimentacao_data
ON movimentacao_estoque (
    data_movimentacao DESC,
    id_movimentacao DESC
);

-- Auxilia as consultas de doacoes por doador.
CREATE INDEX IF NOT EXISTS idx_doacao_doador
ON doacao (id_doador);

COMMIT;