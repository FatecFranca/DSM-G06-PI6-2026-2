import { useState } from "react";
import { api } from "../services/api";
type Doacao = { id_doacao: number; doador: string; status: string };
type Item = { id_item: number; nome: string; saldo: string; unidade_medida: string };
export default function RecebimentosSprint2() {
  const [doacoes, setDoacoes] = useState<Doacao[]>([]); const [itens, setItens] = useState<Item[]>([]);
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false); const [mensagem, setMensagem] = useState("");
  async function carregar() {
    setDoacoes(await api("/doacoes")); setItens(await api("/estoque"));
  }
  async function executar(acao: () => Promise<void>) {
    try { setMensagem(""); await acao(); } catch (e) { setMensagem(String(e)); }
  }
  async function login() {
    const r = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) });
    if (!["FUNCIONARIO", "ADMINISTRADOR"].includes(r.usuario.perfil)) throw new Error("Use uma conta funcionaria");
    sessionStorage.setItem("doefacil_token", r.token); setLogado(true); setSenha(""); await carregar();
  }
  return <section className="painel"><h3>Recebimentos - Sprint 2</h3><p role="status">{mensagem}</p>
    {!logado ? <form onSubmit={e => { e.preventDefault(); void executar(login); }}>
      <input aria-label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input aria-label="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} required />
      <button>Entrar</button>
    </form> : <>
      <button onClick={() => void executar(carregar)}>Atualizar</button>
      <button onClick={() => { sessionStorage.removeItem("doefacil_token"); setLogado(false); }}>Sair</button>
      <table><thead><tr><th>ID</th><th>Doador</th><th>Status</th><th>Acao</th></tr></thead>
      <tbody>{doacoes.map(d => <tr key={d.id_doacao}><td>{d.id_doacao}</td><td>{d.doador}</td>
        <td>{d.status}</td><td>{d.status === "CADASTRADA" &&
          <button onClick={() => void executar(async () => {
            await api(`/estoque/receber/${d.id_doacao}`, { method: "POST" }); await carregar();
          })}>Confirmar recebimento</button>}</td></tr>)}</tbody></table>
      <h3>Estoque persistido</h3>{itens.map(i => <p key={i.id_item}>
        {i.nome}: {i.saldo} {i.unidade_medida}</p>)}
    </>}
  </section>;
}
