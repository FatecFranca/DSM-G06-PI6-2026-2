CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL
        CHECK (perfil IN ('DOADOR', 'FUNCIONARIO', 'ADMINISTRADOR')),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campanha (
    id_campanha SERIAL PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descricao TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('ATIVA', 'ENCERRADA', 'CANCELADA'))
);

CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE item (
    id_item SERIAL PRIMARY KEY,
    id_categoria INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(30) NOT NULL,
    estoque_minimo NUMERIC(10,2) DEFAULT 0,
    CONSTRAINT fk_item_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria(id_categoria)
);

CREATE TABLE doacao (
    id_doacao SERIAL PRIMARY KEY,
    id_doador INTEGER NOT NULL,
    id_campanha INTEGER,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(25) NOT NULL DEFAULT 'CADASTRADA'
        CHECK (status IN ('CADASTRADA', 'RECEBIDA', 'CANCELADA')),
    observacao TEXT,
    CONSTRAINT fk_doacao_doador
        FOREIGN KEY (id_doador)
        REFERENCES usuario(id_usuario),
    CONSTRAINT fk_doacao_campanha
        FOREIGN KEY (id_campanha)
        REFERENCES campanha(id_campanha)
);

CREATE TABLE item_doacao (
    id_item_doacao SERIAL PRIMARY KEY,
    id_doacao INTEGER NOT NULL,
    id_item INTEGER NOT NULL,
    quantidade NUMERIC(10,2) NOT NULL CHECK (quantidade > 0),
    CONSTRAINT fk_item_doacao
        FOREIGN KEY (id_doacao)
        REFERENCES doacao(id_doacao),
    CONSTRAINT fk_item_doado
        FOREIGN KEY (id_item)
        REFERENCES item(id_item)
);

CREATE TABLE movimentacao_estoque (
    id_movimentacao SERIAL PRIMARY KEY,
    id_item INTEGER NOT NULL,
    id_funcionario INTEGER NOT NULL,
    id_doacao INTEGER,
    tipo VARCHAR(10) NOT NULL
        CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    quantidade NUMERIC(10,2) NOT NULL CHECK (quantidade > 0),
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimentacao_item
        FOREIGN KEY (id_item)
        REFERENCES item(id_item),
    CONSTRAINT fk_movimentacao_funcionario
        FOREIGN KEY (id_funcionario)
        REFERENCES usuario(id_usuario),
    CONSTRAINT fk_movimentacao_doacao
        FOREIGN KEY (id_doacao)
        REFERENCES doacao(id_doacao)
);

CREATE TABLE notificacao (
    id_notificacao SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificacao_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);