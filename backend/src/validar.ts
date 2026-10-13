export function exigir(condicao: unknown, mensagem: string, status = 400) {
  if (!condicao) throw Object.assign(new Error(mensagem), { status });
}
export function idValido(valor: unknown) {
  const id = Number(valor);
  exigir(Number.isInteger(id) && id > 0, "Identificador invalido");
  return id;
}
