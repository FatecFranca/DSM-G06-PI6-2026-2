const URL_API =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export class ErroApi extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
  }
}

export async function api(
  caminho: string,
  opcoes: RequestInit = {}
) {
  const headers = new Headers(opcoes.headers);
  headers.set("Content-Type", "application/json");

  const token = sessionStorage.getItem("doefacil_token");

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

  try {
    const resposta = await fetch(URL_API + caminho, {
      ...opcoes,
      headers,
      signal: controlador.signal
    });

    if (
      resposta.status === 401 &&
      token &&
      !caminho.startsWith("/auth/")
    ) {
      if (sessionStorage.getItem("doefacil_token") === token) {
        sessionStorage.removeItem("doefacil_token");
      }

      throw new ErroApi(
        "Sua sessão expirou. Entre novamente para continuar.",
        401
      );
    }

    if (resposta.status === 204) {
      return null;
    }

    let dados;

    try {
      dados = await resposta.json();
    } catch {
      if (controlador.signal.aborted) {
        throw new Error("Solicitação interrompida.");
      }

      throw new Error(
        "O serviço retornou uma resposta inválida. Tente atualizar a lista."
      );
    }

    if (!resposta.ok) {
      throw new ErroApi(
        typeof dados?.mensagem === "string"
          ? dados.mensagem
          : "Não foi possível concluir a solicitação.",
        resposta.status
      );
    }

    return dados;
  } catch (erro) {
    if (tempoEsgotado) {
      throw new Error(
        "O servidor demorou para responder. Atualize a lista antes de tentar enviar novamente."
      );
    }

    if (sinalExterno?.aborted) {
      throw new Error("A solicitação foi cancelada.");
    }

    if (erro instanceof TypeError) {
      throw new Error(
        "Não foi possível conectar ao serviço. Verifique sua conexão."
      );
    }

    throw erro;
  } finally {
    clearTimeout(temporizador);
    sinalExterno?.removeEventListener("abort", cancelar);
  }
}