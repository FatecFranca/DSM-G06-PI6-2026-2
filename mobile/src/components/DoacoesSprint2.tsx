import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { api } from "../services/api";

export default function DoacoesSprint2() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [logado, setLogado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cadastroAtivo, setCadastroAtivo] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  async function executar(acao: () => Promise<void>) {
    if (enviando) return;

    setEnviando(true);

    try {
      await acao();
    } catch (erro) {
      Alert.alert(
        "DoeFácil",
        erro instanceof Error ? erro.message : "Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  function validarCampos() {
    if (!email.trim() || !senha) {
      throw new Error("Preencha o e-mail e a senha.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error("Digite um e-mail válido.");
    }
  }

  async function entrar() {
    validarCampos();

    const dados = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        senha
      })
    });

    if (dados.usuario.perfil !== "DOADOR") {
      throw new Error("Use uma conta de doador neste aplicativo.");
    }

    await SecureStore.setItemAsync("doefacil_token", dados.token);

    setNomeUsuario(dados.usuario.nome);
    setLogado(true);
    setSenha("");
    setSenhaVisivel(false);
  }

  async function cadastrar() {
    validarCampos();

    if (!nome.trim()) {
      throw new Error("Preencha seu nome.");
    }

    if (senha.length < 8) {
      throw new Error("A senha precisa ter pelo menos 8 caracteres.");
    }

    await api("/auth/cadastro", {
      method: "POST",
      body: JSON.stringify({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha
      })
    });

    setCadastroAtivo(false);
    setSenha("");
    setSenhaVisivel(false);

    Alert.alert(
      "Cadastro realizado",
      "Agora entre com seu e-mail e sua senha."
    );
  }

  async function sair() {
    await SecureStore.deleteItemAsync("doefacil_token");

    setLogado(false);
    setNomeUsuario("");
    setSenha("");
    setSenhaVisivel(false);
    setCadastroAtivo(false);
  }

  function alternarModo() {
    setCadastroAtivo(!cadastroAtivo);
    setSenha("");
    setSenhaVisivel(false);
  }

  return (
    <View style={styles.conteudo}>
      <View style={styles.card}>
        {logado ? (
          <>
            <Text style={styles.titulo}>Olá, {nomeUsuario}!</Text>

            <Text style={styles.descricao}>
              Bem-vindo à sua conta de doador.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={enviando}
              style={({ pressed }) => [
                styles.botao,
                (pressed || enviando) && styles.botaoPressionado
              ]}
              onPress={() => void executar(sair)}
            >
              <Text style={styles.textoBotao}>Sair da conta</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.titulo}>
              {cadastroAtivo ? "Crie sua conta" : "Acesse sua conta"}
            </Text>

            <Text style={styles.descricao}>
              {cadastroAtivo
                ? "Cadastre-se para começar a ajudar."
                : "Participe das campanhas e acompanhe suas doações."}
            </Text>

            {cadastroAtivo && (
              <View style={styles.grupo}>
                <Text style={styles.rotulo}>Nome</Text>

                <TextInput
                  accessibilityLabel="Nome"
                  style={styles.campo}
                  placeholder="Como você se chama?"
                  placeholderTextColor="#78877C"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  editable={!enviando}
                />
              </View>
            )}

            <View style={styles.grupo}>
              <Text style={styles.rotulo}>E-mail</Text>

              <TextInput
                accessibilityLabel="E-mail"
                style={styles.campo}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor="#78877C"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!enviando}
              />
            </View>

            <View style={styles.grupo}>
              <Text style={styles.rotulo}>Senha</Text>

              <View style={styles.linhaSenha}>
                <TextInput
                  accessibilityLabel="Senha"
                  style={styles.campoSenha}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#78877C"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!senhaVisivel}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!enviando}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    senhaVisivel ? "Ocultar senha" : "Mostrar senha"
                  }
                  disabled={enviando}
                  style={styles.mostrarSenha}
                  onPress={() => setSenhaVisivel(!senhaVisivel)}
                >
                  <Text style={styles.textoMostrar}>
                    {senhaVisivel ? "Ocultar" : "Mostrar"}
                  </Text>
                </Pressable>
              </View>

              {cadastroAtivo && (
                <Text style={styles.ajuda}>
                  Use pelo menos 8 caracteres.
                </Text>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                cadastroAtivo ? "Criar conta" : "Entrar"
              }
              accessibilityState={{
                disabled: enviando,
                busy: enviando
              }}
              disabled={enviando}
              style={({ pressed }) => [
                styles.botao,
                (pressed || enviando) && styles.botaoPressionado
              ]}
              onPress={() =>
                void executar(cadastroAtivo ? cadastrar : entrar)
              }
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBotao}>
                  {cadastroAtivo ? "Criar conta" : "Entrar"}
                </Text>
              )}
            </Pressable>

            <View style={styles.divisor} />

            <Text style={styles.pergunta}>
              {cadastroAtivo
                ? "Já tem uma conta?"
                : "Ainda não tem uma conta?"}
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={enviando}
              style={({ pressed }) => [
                styles.botaoSecundario,
                (pressed || enviando) && styles.botaoPressionado
              ]}
              onPress={alternarModo}
            >
              <Text style={styles.textoSecundario}>
                {cadastroAtivo ? "Voltar para entrar" : "Quero me cadastrar"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    padding: 20,
    paddingBottom: 32
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3EBE4",
    padding: 22
  },
  titulo: {
    color: "#263238",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8
  },
  descricao: {
    color: "#607468",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24
  },
  grupo: {
    marginBottom: 18
  },
  rotulo: {
    color: "#34483A",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8
  },
  campo: {
    backgroundColor: "#F8FAF8",
    borderWidth: 1,
    borderColor: "#CEDBCF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 54,
    fontSize: 16,
    color: "#263238"
  },
  linhaSenha: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAF8",
    borderWidth: 1,
    borderColor: "#CEDBCF",
    borderRadius: 12
  },
  campoSenha: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#263238"
  },
  mostrarSenha: {
    minHeight: 54,
    paddingHorizontal: 14,
    justifyContent: "center"
  },
  textoMostrar: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "600"
  },
  ajuda: {
    color: "#607468",
    fontSize: 12,
    marginTop: 8
  },
  botao: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    minHeight: 54,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  botaoPressionado: {
    opacity: 0.65
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  },
  divisor: {
    height: 1,
    backgroundColor: "#E7EEE8",
    marginVertical: 24
  },
  pergunta: {
    color: "#607468",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12
  },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderRadius: 12,
    minHeight: 50,
    padding: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  textoSecundario: {
    color: "#2E7D32",
    fontSize: 15,
    fontWeight: "600"
  }
});