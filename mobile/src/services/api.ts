import * as SecureStore from "expo-secure-store";

const URL_API = process.env.EXPO_PUBLIC_API_URL;

export async function api(
  caminho: string,
  opcoes: RequestInit = {}
) {
  if (!URL_API) {
    throw new Error("Configure EXPO_PUBLIC_API_URL no .env");
  }

  const headers = new Headers(opcoes.headers);
  headers.set("Content-Type", "application/json");

  const token = await SecureStore.getItemAsync("doefacil_token");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const resposta = await fetch(URL_API + caminho, {
    ...opcoes,
    headers
  });

  if (resposta.status === 204) {
    return null;
  }

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.mensagem || "Erro na API");
  }

  return dados;
}