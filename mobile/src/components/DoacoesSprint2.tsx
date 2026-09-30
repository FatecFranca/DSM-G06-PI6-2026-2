import { useState } from "react";
import {
  Alert,
  Button,
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

  async function executar(acao: () => Promise<void>) {
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

    Alert.alert("DoeFácil", "Cadastro realizado! Agora toque em Entrar.");
  }

  async function sair() {
    await SecureStore.deleteItemAsync("doefacil_token");

    setLogado(false);
    setNomeUsuario("");
    setSenha("");
  }

  return (
    <View style={styles.conteudo}>
      {logado ? (
        <>
          <Text style={styles.titulo}>Olá, {nomeUsuario}!</Text>

          <Button
            title="Sair"
            color="#2E7D32"
            disabled={enviando}
            onPress={() => void executar(sair)}
          />
        </>
      ) : (
        <>
          <Text style={styles.titulo}>Acesse sua conta</Text>

          <TextInput
            style={styles.campo}
            placeholder="Nome — preencha para cadastrar"
            value={nome}
            onChangeText={setNome}
            editable={!enviando}
          />

          <TextInput
            style={styles.campo}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!enviando}
          />

          <TextInput
            style={styles.campo}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            editable={!enviando}
          />

          <Button
            title={enviando ? "Aguarde..." : "Entrar"}
            color="#2E7D32"
            disabled={enviando}
            onPress={() => void executar(entrar)}
          />

          <Button
            title="Cadastrar"
            color="#2E7D32"
            disabled={enviando}
            onPress={() => void executar(cadastrar)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    padding: 20,
    gap: 14
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#263238"
  },
  campo: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B8C8B8",
    borderRadius: 8,
    padding: 14,
    color: "#263238"
  }
});