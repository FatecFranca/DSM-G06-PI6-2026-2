BEGIN;
INSERT INTO usuario (id_usuario, nome, email, senha_hash, perfil) VALUES
 (1, 'Admin Teste', 'admin@doefacil.test', '$2a$12$dhpXRN2k7lXpEv728lYRpuUX9qEjQD3VMI8Wbtaalp76grQFLqfXW', 'ADMINISTRADOR'),
 (2, 'Doador Teste', 'doador@doefacil.test', '$2a$12$dhpXRN2k7lXpEv728lYRpuUX9qEjQD3VMI8Wbtaalp76grQFLqfXW', 'DOADOR'),
 (3, 'Funcionario Teste', 'funcionario@doefacil.test', '$2a$12$dhpXRN2k7lXpEv728lYRpuUX9qEjQD3VMI8Wbtaalp76grQFLqfXW', 'FUNCIONARIO')
ON CONFLICT DO NOTHING;
INSERT INTO campanha (id_campanha, titulo, descricao, data_inicio, data_fim, status)
VALUES (1, 'Alimentos - teste', 'Campanha ficticia da Sprint 2',
 '2026-09-30', '2026-10-31', 'ATIVA') ON CONFLICT DO NOTHING;
INSERT INTO categoria (id_categoria, nome) VALUES
 (1, 'Alimentos'), (2, 'Higiene') ON CONFLICT DO NOTHING;
INSERT INTO item (id_item, id_categoria, nome, unidade_medida, estoque_minimo)
VALUES (1, 1, 'Arroz', 'kg', 5), (2, 2, 'Sabonete', 'unidade', 10)
ON CONFLICT DO NOTHING;
INSERT INTO doacao (id_doacao, id_doador, id_campanha, observacao)
VALUES (1, 2, 1, 'Doacao ficticia inicial') ON CONFLICT DO NOTHING;
INSERT INTO item_doacao (id_item_doacao, id_doacao, id_item, quantidade)
VALUES (1, 1, 1, 3) ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('usuario','id_usuario'),
 (SELECT MAX(id_usuario) FROM usuario));
SELECT setval(pg_get_serial_sequence('campanha','id_campanha'),
 (SELECT MAX(id_campanha) FROM campanha));
SELECT setval(pg_get_serial_sequence('categoria','id_categoria'),
 (SELECT MAX(id_categoria) FROM categoria));
SELECT setval(pg_get_serial_sequence('item','id_item'),
 (SELECT MAX(id_item) FROM item));
SELECT setval(pg_get_serial_sequence('doacao','id_doacao'),
 (SELECT MAX(id_doacao) FROM doacao));
SELECT setval(pg_get_serial_sequence('item_doacao','id_item_doacao'),
 (SELECT MAX(id_item_doacao) FROM item_doacao));
COMMIT;
