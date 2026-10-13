import type { RequestHandler } from "express";
import { verify, type JwtPayload } from "jsonwebtoken";
export function proteger(...perfis: string[]): RequestHandler {
  return (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) { res.status(401).json({ mensagem: "Faca login" }); return; }
    try {
      const dados = verify(token, process.env.JWT_SECRET || "", {
        algorithms: ["HS256"], issuer: "doefacil",
      }) as JwtPayload;
      if (!Number.isInteger(Number(dados.sub)) || Number(dados.sub) <= 0)
        throw new Error("Token invalido");
      if (perfis.length && !perfis.includes(dados.perfil)) {
        res.status(403).json({ mensagem: "Sem permissao" }); return;
      }
      res.locals.usuario = { id_usuario: Number(dados.sub), perfil: dados.perfil };
      next();
    } catch { res.status(401).json({ mensagem: "Token invalido ou expirado" }); }
  };
}
