import { useEffect, useState } from "react";
import { api } from "../services/api";
type Campanha = { id_campanha: number; titulo: string; descricao: string;
  data_inicio: string; data_fim: string | null; status: string };
export default function CampanhasSprint2() {
  const [lista, setLista] = useState<Campanha[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState(""); const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState(""); const [status, setStatus] = useState("ATIVA");
  async function carregar() { setLista(await api("/campanhas")); }
  async function executar(acao: () => Promise<void>) {
    try { setMensagem(""); await acao(); } catch (e) { setMensagem(String(e)); }
  }
  useEffect(() => { void executar(carregar); }, []);
  async function login() {
    const r = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) });
    if (r.usuario.perfil !== "ADMINISTRADOR") throw new Error("Use uma conta administradora");
    sessionStorage.setItem("doefacil_token", r.token); setLogado(true); setSenha("");
  }
  async function salvar() {
    await api(id ? `/campanhas/${id}` : "/campanhas", { method: id ? "PUT" : "POST",
      body: JSON.stringify({ titulo, data_inicio: inicio, data_fim: fim || null, status }) });
    setId(null); setTitulo(""); setInicio(""); setFim(""); setStatus("ATIVA"); await carregar();
  }
  return <section className="tabela-container">
    <h3>Campanhas - Sprint 2</h3><p role="status">{mensagem}</p>
    {!logado ? <form onSubmit={e => { e.preventDefault(); void executar(login); }}>
      <input aria-label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input aria-label="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} required />
      <button>Entrar como administrador</button>
    </form> : <>
      <button onClick={() => { sessionStorage.removeItem("doefacil_token"); setLogado(false); }}>Sair</button>
      <form onSubmit={e => { e.preventDefault(); void executar(salvar); }}>
        <input aria-label="Titulo" value={titulo} onChange={e => setTitulo(e.target.value)} required />
        <input aria-label="Inicio" type="date" value={inicio} onChange={e => setInicio(e.target.value)} required />
        <input aria-label="Fim" type="date" value={fim} onChange={e => setFim(e.target.value)} />
        <select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}>
          <option>ATIVA</option><option>ENCERRADA</option>
        </select><button>{id ? "Salvar alteracoes" : "Criar campanha"}</button>
      </form>
    </>}
    <table><thead><tr><th>Campanha</th><th>Status</th><th>Acoes</th></tr></thead>
      <tbody>{lista.map(c => <tr key={c.id_campanha}>
        <td>{c.titulo}</td><td>{c.status}</td><td>{logado && <>
          <button onClick={() => { setId(c.id_campanha); setTitulo(c.titulo);
            setInicio(c.data_inicio.slice(0,10)); setFim(c.data_fim?.slice(0,10) || ""); setStatus(c.status); }}>Editar</button>
          <button onClick={() => { if (confirm("Cancelar esta campanha?")) void executar(async () => {
            await api(`/campanhas/${c.id_campanha}`, { method: "DELETE" }); await carregar();
          }); }}>Cancelar</button>
        </>}</td></tr>)}</tbody>
    </table>
  </section>;
}
