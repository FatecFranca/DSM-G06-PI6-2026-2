const URL_API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export async function api(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = sessionStorage.getItem("doefacil_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const resposta = await fetch(URL_API + path, { ...options, headers });
  if (resposta.status === 204) return null;
  const corpo = await resposta.json();
  if (!resposta.ok) throw new Error(corpo.mensagem || "Erro na API");
  return corpo;
}
