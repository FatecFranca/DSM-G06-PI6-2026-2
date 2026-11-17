import { Pressable, StyleSheet, Text, View } from "react-native";

export type Campanha = {
  id_campanha: number;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: string;
};

type Props = {
  campanhas: Campanha[];
  selecionada: number | null;
  desabilitado: boolean;
  onSelecionar: (id: number | null) => void;
};

export default function Campanhas({
  campanhas,
  selecionada,
  desabilitado,
  onSelecionar
}: Props) {
  const ativas = campanhas.filter(
    (campanha) => campanha.status === "ATIVA"
  );

  const indisponivel =
    selecionada !== null &&
    !ativas.some((campanha) => campanha.id_campanha === selecionada);

  return (
    <View>
      <Text style={styles.titulo}>Campanha (opcional)</Text>

      <Text style={styles.descricao}>
        Escolha uma campanha ou faça uma doação geral.
      </Text>

      <Pressable
        accessibilityRole="radio"
        accessibilityState={{
          checked: selecionada === null,
          disabled: desabilitado
        }}
        disabled={desabilitado}
        onPress={() => onSelecionar(null)}
        style={[
          styles.opcao,
          selecionada === null && styles.selecionada
        ]}
      >
        <Text style={styles.nome}>Doação geral — sem campanha</Text>
      </Pressable>

      {ativas.map((campanha) => (
        <Pressable
          key={campanha.id_campanha}
          accessibilityRole="radio"
          accessibilityLabel={`Campanha ${campanha.titulo}`}
          accessibilityState={{
            checked: selecionada === campanha.id_campanha,
            disabled: desabilitado
          }}
          disabled={desabilitado}
          onPress={() => onSelecionar(campanha.id_campanha)}
          style={[
            styles.opcao,
            selecionada === campanha.id_campanha &&
              styles.selecionada
          ]}
        >
          <Text style={styles.nome}>{campanha.titulo}</Text>

          {campanha.descricao ? (
            <Text style={styles.descricao}>
              {campanha.descricao}
            </Text>
          ) : null}
        </Pressable>
      ))}

      {ativas.length === 0 ? (
        <Text style={styles.descricao}>
          Não há campanhas ativas. Você pode fazer uma doação geral.
        </Text>
      ) : null}

      {indisponivel ? (
        <Text style={styles.erro}>
          A campanha selecionada não está mais disponível.
          Escolha outra ou selecione doação geral.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    color: "#344848",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8
  },
  descricao: {
    color: "#5D7275",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8
  },
  opcao: {
    borderWidth: 1,
    borderColor: "#B2C5C7",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8
  },
  selecionada: {
    backgroundColor: "#E0F2F1",
    borderColor: "#087883"
  },
  nome: {
    color: "#087883",
    fontSize: 15,
    fontWeight: "600"
  },
  erro: {
    color: "#A52020",
    fontSize: 14,
    marginBottom: 12
  }
});