import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Keyboard, Pressable,
  StyleSheet, Text, TextInput, View
} from "react-native";
import { api } from "../services/api";

type Item = {
  id_item: number;
  nome: string;
  unidade_medida: string;
};

type Doacao = {
  id_doacao: number;
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

export default function PainelDoacoes() {
  const [itens, setItens] = useState<Item[]>([]);
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [idItem, setIdItem] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const montado = useRef(true);
  const envioEmAndamento = useRef(false);

  const carregar = useCallback(async (signal?: AbortSignal) => {
    setCarregando(true);

    try {
      const [listaItens, listaDoacoes] = await Promise.all([
        api("/itens", { signal }),
        api("/doacoes/minhas", { signal })
      ]);

      if (!montado.current || signal?.aborted) return;

      if (!Array.isArray(listaItens) || !Array.isArray(listaDoacoes)) {
        throw new Error("Não foi possível carregar as doações.");
      }

      setItens(listaItens);
      setDoacoes(listaDoacoes);

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
  const ocupado = carregando || enviando;

  async function cadastrarDoacao() {
    if (carregando || envioEmAndamento.current) return;

    const texto = quantidade.trim();
    const valor = Number(texto.replace(",", "."));

    if (!selecionado) {
      Alert.alert("DoeFácil", "Escolha o item que deseja doar.");
      return;
    }

    if (
      !/^\d+([.,]\d{1,2})?$/.test(texto) ||
      valor < 0.01 ||
      valor > 99999999.99
    ) {
      Alert.alert(
        "DoeFácil",
        "Informe uma quantidade positiva, como 3 ou 1,5."
      );
      return;
    }

    envioEmAndamento.current = true;
    setEnviando(true);
    Keyboard.dismiss();

    try {
      const resposta = await api("/doacoes", {
        method: "POST",
        body: JSON.stringify({
          observacao: observacao.trim() || null,
          itens: [
            {
              id_item: selecionado.id_item,
              quantidade: valor
            }
          ]
        })
      });

      if (!montado.current) return;

      const nova: Doacao = {
        id_doacao: resposta.id_doacao,
        status: resposta.status,
        observacao: resposta.observacao,
        titulo_campanha: null,
        itens: [{ ...selecionado, quantidade: valor }]
      };

      setDoacoes((atuais) => [nova, ...atuais]);
      setQuantidade("");
      setObservacao("");
      setIdItem(null);

      Alert.alert(
        "Doação cadastrada",
        "Sua doação está aguardando o recebimento pela instituição."
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

  return (
    <View style={styles.painel}>
      <Text style={styles.titulo}>Nova doação</Text>

      <Text style={styles.descricao}>
        Escolha um item e informe a quantidade.
      </Text>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {carregando ? (
        <ActivityIndicator color="#2E7D32" />
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
        disabled={ocupado || itens.length === 0}
        onPress={() => void cadastrarDoacao()}
        style={({ pressed }) => [
          styles.botao,
          (pressed || ocupado || itens.length === 0) &&
            styles.desabilitado
        ]}
      >
        {enviando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBotao}>Cadastrar doação</Text>
        )}
      </Pressable>

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

          <Text style={styles.situacao}>
            {situacoes[doacao.status] || doacao.status}
          </Text>

          {doacao.itens.map((item) => (
            <Text key={item.id_item} style={styles.linha}>
              {item.nome}:{" "}
              {String(Number(item.quantidade)).replace(".", ",")}{" "}
              {item.unidade_medida}
            </Text>
          ))}

          {doacao.titulo_campanha ? (
            <Text style={styles.linha}>
              {doacao.titulo_campanha}
            </Text>
          ) : null}

          {doacao.observacao ? (
            <Text style={styles.descricao}>
              {doacao.observacao}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  painel: { marginBottom: 24 },
  titulo: {
    fontSize: 22, fontWeight: "bold",
    color: "#263238", marginBottom: 8
  },
  descricao: {
    color: "#607468", fontSize: 14,
    lineHeight: 21, marginBottom: 12
  },
  rotulo: {
    color: "#34483A", fontWeight: "600", fontSize: 14,
    marginTop: 12, marginBottom: 8
  },
  opcao: {
    borderWidth: 1, borderColor: "#CEDBCF",
    borderRadius: 10, padding: 14, marginBottom: 8
  },
  selecionada: {
    backgroundColor: "#E8F5E9", borderColor: "#2E7D32"
  },
  textoOpcao: {
    color: "#2E7D32", fontSize: 15, fontWeight: "600"
  },
  campo: {
    backgroundColor: "#F8FAF8", borderWidth: 1,
    borderColor: "#CEDBCF", borderRadius: 10,
    padding: 14, minHeight: 50,
    color: "#263238", fontSize: 16
  },
  observacao: { minHeight: 90, textAlignVertical: "top" },
  botao: {
    backgroundColor: "#2E7D32", padding: 15,
    borderRadius: 10, alignItems: "center",
    marginTop: 18, minHeight: 50
  },
  textoBotao: {
    color: "#FFFFFF", fontWeight: "bold", fontSize: 16
  },
  desabilitado: { opacity: 0.6 },
  divisor: {
    height: 1, backgroundColor: "#E7EEE8",
    marginVertical: 24
  },
  atualizar: {
    borderWidth: 1, borderColor: "#2E7D32",
    padding: 12, borderRadius: 10,
    alignItems: "center", marginBottom: 16
  },
  card: {
    backgroundColor: "#F4F7F4", padding: 14,
    borderRadius: 12, marginBottom: 12
  },
  codigo: {
    color: "#263238", fontSize: 16,
    fontWeight: "bold", marginBottom: 6
  },
  situacao: {
    color: "#2E7D32", fontSize: 13,
    fontWeight: "600", marginBottom: 8
  },
  linha: {
    color: "#34483A", fontSize: 14, marginBottom: 6
  },
  erro: {
    color: "#A52020", fontSize: 14, marginBottom: 12
  }
});