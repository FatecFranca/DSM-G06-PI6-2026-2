import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import DoacoesSprint2 from "./src/components/DoacoesSprint2";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

<ScrollView
  keyboardShouldPersistTaps="handled"
  automaticallyAdjustKeyboardInsets
>
          <View style={styles.cabecalho}>
          <Text style={styles.logo}>DoeFácil</Text>

          <Text style={styles.subtitulo}>
            Sua doação pode transformar vidas.
          </Text>
        </View>

        <DoacoesSprint2 />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8F9"
  },
  cabecalho: {
    backgroundColor: "#087883",
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
    color: "#E0F2F1",
    fontSize: 16,
    marginTop: 6
  }
});