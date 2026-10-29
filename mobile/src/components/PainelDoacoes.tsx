import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { api } from "../services/api";
import Campanhas, { type Campanha } from "./Campanhas";

type Item = {
  id_item: number;
  nome: string;
  unidade_medida: string;
};

type Doacao = {
  id_doacao: number;
  id_campanha?: number | null;
  status: string;
  observacao: string | null;
  titulo_campanha?: string | null;
  itens: (Item & { quantidade: number })[];
};

const situacoes: Record<string, string> = {
  CADASTRADA: "Aguardando recebimento",
  RECEBIDA: "Recebida",
  CANCELADA: "Cancelada"
};

function lerQuantidade(texto: string, nome: string) {
  const limpo = texto.trim();
  const valor = Number(limpo.replace(",", "."));

  if (
    !/^\d+([.,]\d{1,2})?$/.test(limpo) ||
    valor < 0.01 ||
    valor > 99999999.99
  ) {
    throw new Error(
      `Informe uma quantidade positiva para ${nome}, como 3 ou 1,5.`
    );
  }

  return valor;
}

export default function PainelDoacoes() {
  const [itens, setItens] = useState<Item[]>([]);
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [idCampanha, setIdCampanha] = useState<number | null>(null);
  const [idItem, setIdItem] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState<Doacao | null>(null);

  const [quantidadesEditadas, setQuantidadesEditadas] = useState<
    Record<number, string>
  >({});

  const montado = useRef(true);
  const envioEmAndamento = useRef(false);
  const edicaoAtual = useRef<Doacao | null>(null);

  const carregar = useCallback(async (signal?: AbortSignal) => {
    setCarregando(true);

    try {
      const [listaItens, listaDoacoes, listaCampanhas] = await Promise.all([
        api("/itens", { signal }),
        api("/doacoes/minhas", { signal }),
        api("/campanhas?status=ATIVA", { signal })
      ]);

      if (!montado.current || signal?.aborted) return;

      if (
        !Array.isArray(listaItens) ||
        !Array.isArray(listaDoacoes) ||
        !Array.isArray(listaCampanhas)
      ) {
        throw new Error(
          "Não foi possível carregar as doações e campanhas."
        );
      }

      setItens(listaItens);
      setDoacoes(listaDoacoes);
      setCampanhas(listaCampanhas);

      const emEdicao = edicaoAtual.current;

      if (
        emEdicao &&
        !listaDoacoes.some(
          (doacao: Doacao) =>
            doacao.id_doacao === emEdicao.id_doacao &&
            doacao.status === "CADASTRADA"
        )
      ) {
        edicaoAtual.current = null;
        setEditando(null);
        setQuantidadesEditadas({});
        setObservacao("");
        setIdItem(null);
        setIdCampanha(null);
        setQuantidade("");

        Alert.alert(
          "Doação atualizada",
          "Essa doação não está mais disponível para edição. Confira a situação no histórico."
        );
      }

      setIdItem((atual) =>
        listaItens.some((item: Item) => item.id_item === atual)
          ? atual
          : null
      );

      setErro("");
    } catch (falha) {
      if (montado.current && !signal?.aborted) {
        setErro(
          falha instanceof Error ? falha.message : "Tente novamente."
        );
      }
    } finally {
      if (montado.current && !signal?.aborted) {
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    const controlador = new AbortController();

    void carregar(controlador.signal);

    return () => {
      montado.current = false;
      controlador.abort();
    };
  }, [carregar]);

  const selecionado = itens.find((item) => item.id_item === idItem);

  const campanhaSelecionada = campanhas.find(
    (campanha) =>
      campanha.id_campanha === idCampanha &&
      campanha.status === "ATIVA"
  );

  const campanhaIndisponivel =
    !editando &&
    idCampanha !== null &&
    !campanhaSelecionada;

  const ocupado = carregando || enviando;

  const podeSalvar =
    !ocupado &&
    !erro &&
    !campanhaIndisponivel &&
    (editando !== null || itens.length > 0);

  function limparFormulario() {
    setEditando(null);
    edicaoAtual.current = null;
    setIdCampanha(null);
    setQuantidadesEditadas({});
    setQuantidade("");
    setObservacao("");
    setIdItem(null);
  }

  function iniciarEdicao(doacao: Doacao) {
    if (ocupado || doacao.status !== "CADASTRADA") return;

    setEditando(doacao);
    edicaoAtual.current = doacao;

    setQuantidadesEditadas(
      Object.fromEntries(
        doacao.itens.map((item) => [
          item.id_item,
          String(Number(item.quantidade)).replace(".", ",")
        ])
      )
    );

    setObservacao(doacao.observacao || "");

    Alert.alert(
      "Editar doação",
      "O formulário acima foi preenchido. Role para cima para fazer as alterações."
    );
  }

  async function salvarDoacao() {
    if (!podeSalvar || envioEmAndamento.current) return;

    let itensSalvos: (Item & { quantidade: number })[];

    try {
      if (editando) {
        itensSalvos = editando.itens.map((item) => ({
          ...item,
          quantidade: lerQuantidade(
            quantidadesEditadas[item.id_item] || "",
            item.nome
          )
        }));
      } else {
        if (!selecionado) {
          throw new Error("Escolha o item que deseja doar.");
        }

        itensSalvos = [
          {
            ...selecionado,
            quantidade: lerQuantidade(quantidade, selecionado.nome)
          }
        ];
      }
    } catch (falha) {
      Alert.alert(
        "DoeFácil",
        falha instanceof Error
          ? falha.message
          : "Confira as quantidades."
      );
      return;
    }

    envioEmAndamento.current = true;
    setEnviando(true);
    Keyboard.dismiss();

    try {
      const resposta = await api(
        editando ? `/doacoes/${editando.id_doacao}` : "/doacoes",
        {
          method: editando ? "PUT" : "POST",
          body: JSON.stringify({
            ...(!editando ? { id_campanha: idCampanha } : {}),
            observacao: observacao.trim() || null,
            itens: itensSalvos.map((item) => ({
              id_item: item.id_item,
              quantidade: item.quantidade
            }))
          })
        }
      );

      if (!montado.current) return;

      const nova: Doacao = {
        id_doacao: resposta.id_doacao,
        id_campanha: resposta.id_campanha,
        status: resposta.status,
        observacao: resposta.observacao,
        titulo_campanha: editando
          ? editando.titulo_campanha || null
          : campanhaSelecionada?.titulo || null,
        itens: itensSalvos
      };

      setDoacoes((atuais) =>
        editando
          ? atuais.map((doacao) =>
              doacao.id_doacao === nova.id_doacao ? nova : doacao
            )
          : [nova, ...atuais]
      );

      limparFormulario();

      Alert.alert(
        editando ? "Doação atualizada" : "Doação cadastrada",
        editando
          ? "As alterações foram salvas."
          : "Sua doação está aguardando o recebimento pela instituição."
      );
    } catch (falha) {
      if (montado.current) {
        Alert.alert(
          "DoeFácil",
          falha instanceof Error ? falha.message : "Tente novamente."
        );
      }
    } finally {
      envioEmAndamento.current = false;

      if (montado.current) {
        setEnviando(false);
      }
    }
  }

  async function cancelarDoacao(doacao: Doacao) {
    if (carregando || envioEmAndamento.current) return;

    envioEmAndamento.current = true;
    setEnviando(true);

    try {
      const resposta = await api(`/doacoes/${doacao.id_doacao}`, {
        method: "DELETE"
      });

      if (!montado.current) return;

      setDoacoes((atuais) =>
        atuais.map((atual) =>
          atual.id_doacao === doacao.id_doacao
            ? { ...atual, status: resposta.status }
            : atual
        )
      );

      if (editando?.id_doacao === doacao.id_doacao) {
        limparFormulario();
      }

      Alert.alert(
        "Doação cancelada",
        "O registro foi mantido no seu histórico."
      );
    } catch (falha) {
      if (montado.current) {
        Alert.alert(
          "DoeFácil",
          falha instanceof Error ? falha.message : "Tente novamente."
        );
      }
    } finally {
      envioEmAndamento.current = false;

      if (montado.current) {
        setEnviando(false);
      }
    }
  }

  function confirmarCancelamento(doacao: Doacao) {
    if (ocupado || doacao.status !== "CADASTRADA") return;

    Alert.alert(
      "Cancelar doação",
      `Deseja cancelar a doação #${doacao.id_doacao}?`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar doação",
          style: "destructive",
          onPress: () => void cancelarDoacao(doacao)
        }
      ]
    );
  }

  return (
    <View style={styles.painel}>
      <Text style={styles.titulo}>
        {editando
          ? `Editar doação #${editando.id_doacao}`
          : "Nova doação"}
      </Text>

      <Text style={styles.descricao}>
        {editando
          ? "Corrija as quantidades e a observação."
          : "Escolha uma campanha, se desejar, e informe sua doação."}
      </Text>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {carregando ? (
        <ActivityIndicator color="#2E7D32" />
      ) : null}

      {editando ? (
        <View>
          <Text style={styles.descricao}>
            Campanha: {editando.titulo_campanha || "Doação geral"}.
            A edição mantém a campanha original.
          </Text>

          {editando.itens.map((item) => (
            <View key={item.id_item}>
              <Text style={styles.rotulo}>
                {item.nome} ({item.unidade_medida})
              </Text>

              <TextInput
                accessibilityLabel={`Quantidade de ${item.nome}`}
                style={styles.campo}
                keyboardType="decimal-pad"
                value={quantidadesEditadas[item.id_item] || ""}
                onChangeText={(texto) =>
                  setQuantidadesEditadas((atuais) => ({
                    ...atuais,
                    [item.id_item]: texto
                  }))
                }
                editable={!ocupado}
                maxLength={12}
              />
            </View>
          ))}
        </View>
      ) : (
        <>
          {!carregando && !erro ? (
            <Campanhas
              campanhas={campanhas}
              selecionada={idCampanha}
              desabilitado={ocupado}
              onSelecionar={setIdCampanha}
            />
          ) : null}

          <Text style={styles.rotulo}>Item</Text>

          {itens.map((item) => (
            <Pressable
              key={item.id_item}
              accessibilityRole="radio"
              accessibilityState={{
                checked: idItem === item.id_item,
                disabled: ocupado
              }}
              disabled={ocupado}
              onPress={() => setIdItem(item.id_item)}
              style={[
                styles.opcao,
                idItem === item.id_item && styles.selecionada
              ]}
            >
              <Text style={styles.textoOpcao}>
                {item.nome} ({item.unidade_medida})
              </Text>
            </Pressable>
          ))}

          {!carregando && !erro && itens.length === 0 ? (
            <Text style={styles.descricao}>
              Nenhum item disponível no momento.
            </Text>
          ) : null}

          <Text style={styles.rotulo}>
            Quantidade
            {selecionado ? ` (${selecionado.unidade_medida})` : ""}
          </Text>

          <TextInput
            accessibilityLabel="Quantidade da doação"
            style={styles.campo}
            placeholder="Ex.: 3"
            placeholderTextColor="#78877C"
            keyboardType="decimal-pad"
            value={quantidade}
            onChangeText={setQuantidade}
            editable={!ocupado}
            maxLength={12}
          />
        </>
      )}

      <Text style={styles.rotulo}>Observação (opcional)</Text>

      <TextInput
        accessibilityLabel="Observação da doação"
        style={[styles.campo, styles.observacao]}
        placeholder="Informações sobre a doação"
        placeholderTextColor="#78877C"
        multiline
        maxLength={1000}
        value={observacao}
        onChangeText={setObservacao}
        editable={!ocupado}
      />

      <Pressable
        accessibilityRole="button"
        disabled={!podeSalvar}
        onPress={() => void salvarDoacao()}
        style={({ pressed }) => [
          styles.botao,
          (pressed || !podeSalvar) && styles.desabilitado
        ]}
      >
        {enviando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBotao}>
            {editando ? "Salvar alterações" : "Cadastrar doação"}
          </Text>
        )}
      </Pressable>

      {editando ? (
        <Pressable
          accessibilityRole="button"
          disabled={ocupado}
          onPress={limparFormulario}
          style={[
            styles.atualizar,
            styles.cancelarEdicao,
            ocupado && styles.desabilitado
          ]}
        >
          <Text style={styles.textoOpcao}>Cancelar edição</Text>
        </Pressable>
      ) : null}

      <View style={styles.divisor} />

      <Text style={styles.titulo}>Minhas doações</Text>

      <Pressable
        accessibilityRole="button"
        disabled={ocupado}
        onPress={() => void carregar()}
        style={[
          styles.atualizar,
          ocupado && styles.desabilitado
        ]}
      >
        <Text style={styles.textoOpcao}>Atualizar lista</Text>
      </Pressable>

      {!carregando && !erro && doacoes.length === 0 ? (
        <Text style={styles.descricao}>
          Você ainda não cadastrou doações.
        </Text>
      ) : null}

      {doacoes.map((doacao) => (
        <View key={doacao.id_doacao} style={styles.card}>
          <Text style={styles.codigo}>
            Doação #{doacao.id_doacao}
          </Text>

          <Text
            style={[
              styles.situacao,
              doacao.status === "CANCELADA" &&
                styles.situacaoCancelada
            ]}
          >
            {situacoes[doacao.status] || doacao.status}
          </Text>

          {doacao.itens.map((item) => (
            <Text key={item.id_item} style={styles.linha}>
              {item.nome}:{" "}
              {String(Number(item.quantidade)).replace(".", ",")}{" "}
              {item.unidade_medida}
            </Text>
          ))}

          <Text style={styles.linha}>
            Campanha: {doacao.titulo_campanha || "Doação geral"}
          </Text>

          {doacao.observacao ? (
            <Text style={styles.descricao}>
              {doacao.observacao}
            </Text>
          ) : null}

          {doacao.status === "CADASTRADA" ? (
            <View style={styles.acoes}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar doação ${doacao.id_doacao}`}
                disabled={ocupado}
                onPress={() => iniciarEdicao(doacao)}
                style={({ pressed }) => [
                  styles.acaoEditar,
                  (pressed || ocupado) && styles.desabilitado
                ]}
              >
                <Text style={styles.textoOpcao}>Editar</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Cancelar doação ${doacao.id_doacao}`}
                disabled={ocupado}
                onPress={() => confirmarCancelamento(doacao)}
                style={({ pressed }) => [
                  styles.acaoCancelar,
                  (pressed || ocupado) && styles.desabilitado
                ]}
              >
                <Text style={styles.textoCancelar}>
                  Cancelar doação
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  painel: { marginBottom: 24 },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#263238",
    marginBottom: 8
  },
  descricao: {
    color: "#607468",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12
  },
  rotulo: {
    color: "#34483A",
    fontWeight: "600",
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8
  },
  opcao: {
    borderWidth: 1,
    borderColor: "#CEDBCF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8
  },
  selecionada: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32"
  },
  textoOpcao: {
    color: "#2E7D32",
    fontSize: 15,
    fontWeight: "600"
  },
  campo: {
    backgroundColor: "#F8FAF8",
    borderWidth: 1,
    borderColor: "#CEDBCF",
    borderRadius: 10,
    padding: 14,
    minHeight: 50,
    color: "#263238",
    fontSize: 16
  },
  observacao: {
    minHeight: 90,
    textAlignVertical: "top"
  },
  botao: {
    backgroundColor: "#2E7D32",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
    minHeight: 50
  },
  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16
  },
  desabilitado: { opacity: 0.6 },
  divisor: {
    height: 1,
    backgroundColor: "#E7EEE8",
    marginVertical: 24
  },
  atualizar: {
    borderWidth: 1,
    borderColor: "#2E7D32",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16
  },
  card: {
    backgroundColor: "#F4F7F4",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12
  },
  codigo: {
    color: "#263238",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6
  },
  situacao: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8
  },
  linha: {
    color: "#34483A",
    fontSize: 14,
    marginBottom: 6
  },
  erro: {
    color: "#A52020",
    fontSize: 14,
    marginBottom: 12
  },
  acoes: { gap: 8, marginTop: 10 },
  acaoEditar: {
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderRadius: 10,
    padding: 12,
    alignItems: "center"
  },
  acaoCancelar: {
    borderWidth: 1,
    borderColor: "#C76C6C",
    borderRadius: 10,
    padding: 12,
    alignItems: "center"
  },
  textoCancelar: {
    color: "#A52020",
    fontWeight: "600",
    fontSize: 15
  },
  cancelarEdicao: {
    marginTop: 10,
    marginBottom: 0
  },
  situacaoCancelada: { color: "#607468" }
});