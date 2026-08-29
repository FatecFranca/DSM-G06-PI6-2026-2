import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView>
        <View style={styles.cabecalho}>
          <Text style={styles.logo}>DoeFácil</Text>
          <Text style={styles.subtitulo}>
            Sua doação pode transformar vidas.
          </Text>
        </View>

        <View style={styles.conteudo}>
          <Text style={styles.titulo}>Campanhas disponíveis</Text>

          <View style={styles.card}>
            <Text style={styles.categoria}>ALIMENTOS</Text>
            <Text style={styles.nomeCampanha}>
              Arrecadação de alimentos
            </Text>
            <Text style={styles.descricao}>
              Ajude com alimentos não perecíveis para as famílias atendidas.
            </Text>

            <TouchableOpacity style={styles.botao}>
              <Text style={styles.textoBotao}>Quero doar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.categoria}>VESTUÁRIO</Text>
            <Text style={styles.nomeCampanha}>Campanha do agasalho</Text>
            <Text style={styles.descricao}>
              Estamos recebendo roupas e cobertores em bom estado.
            </Text>

            <TouchableOpacity style={styles.botao}>
              <Text style={styles.textoBotao}>Quero doar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.botaoSecundario}>
            <Text style={styles.textoSecundario}>
              Acompanhar minhas doações
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7F4"
  },
  cabecalho: {
    backgroundColor: "#2E7D32",
    paddingTop: 55,
    paddingHorizontal: 24,
    paddingBottom: 30
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold"
  },
  subtitulo: {
    color: "#E8F5E9",
    fontSize: 16,
    marginTop: 6
  },
  conteudo: {
    padding: 20
  },
  titulo: {
    color: "#263238",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    elevation: 3
  },
  categoria: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "bold"
  },
  nomeCampanha: {
    color: "#263238",
    fontSize: 19,
    fontWeight: "bold",
    marginTop: 6
  },
  descricao: {
    color: "#607D68",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16
  },
  botao: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    padding: 12,
    alignItems: "center"
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  botaoSecundario: {
    borderColor: "#2E7D32",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: "center"
  },
  textoSecundario: {
    color: "#2E7D32",
    fontWeight: "bold"
  }
});