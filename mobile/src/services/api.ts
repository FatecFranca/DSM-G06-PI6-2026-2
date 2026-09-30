import * as SecureStore from "expo-secure-store";

const URL_API = process.env.EXPO_PUBLIC_API_URL;

export async function api(
  caminho: string,
  opcoes: RequestInit = {}
) {
  if (!URL_API) {
    throw new Error("O serviço está indisponível no momento.");
  }

  const headers = new Headers(opcoes.headers);
  headers.set("Content-Type", "application/json");

  const token = await SecureStore.getItemAsync("doefacil_token");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controlador = new AbortController();
  const sinalExterno = opcoes.signal;
  let tempoEsgotado = false;

  function cancelar() {
    controlador.abort();
  }

  sinalExterno?.addEventListener("abort", cancelar);

  if (sinalExterno?.aborted) {
    cancelar();
  }

  const temporizador = setTimeout(() => {
    tempoEsgotado = true;
    controlador.abort();
  }, 12000);

  function erroDeConexao() {
    if (tempoEsgotado) {
      return new Error(
        "O servidor demorou para responder. Tente novamente em instantes."
      );
    }

    if (sinalExterno?.aborted) {
      return new Error("A solicitação foi cancelada.");
    }

    return new Error(
      "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente."
    );
  }

  try {
    let resposta: Response;

    try {
      resposta = await fetch(URL_API + caminho, {
        ...opcoes,
        headers,
        signal: controlador.signal
      });
    } catch {
      throw erroDeConexao();
    }

    if (resposta.status === 204) {
      return null;
    }

    let dados;

    try {
      dados = await resposta.json();
    } catch {
      if (controlador.signal.aborted) {
        throw erroDeConexao();
      }

      throw new Error(
        "Não foi possível concluir a solicitação. Tente novamente mais tarde."
      );
    }

    if (!resposta.ok) {
      const mensagem =
        typeof dados?.mensagem === "string"
          ? dados.mensagem
          : "Não foi possível concluir a solicitação.";

      throw new Error(mensagem);
    }

    return dados;
  } finally {
    clearTimeout(temporizador);
    sinalExterno?.removeEventListener("abort", cancelar);
  }
}