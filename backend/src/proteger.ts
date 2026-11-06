
import type { RequestHandler } from "express";
import { verify, type JwtPayload } from "jsonwebtoken";
import { db } from "./db";

type UsuarioAutenticado = {
  id_usuario: number;
  perfil: string;
  ativo: boolean;
};

export function proteger(...perfis: string[]): RequestHandler {
  return async (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

    if (!token) {
      res.status(401).json({
        mensagem: "Faca login"
      });
      return;
    }

    let idUsuario: number;

    try {
      const dados = verify(
        token,
        process.env.JWT_SECRET || "",
        {
          algorithms: ["HS256"],
          issuer: "doefacil"
        }
      ) as JwtPayload;

      idUsuario = Number(dados.sub);

      if (
        !Number.isSafeInteger(idUsuario) ||
        idUsuario <= 0 ||
        typeof dados.perfil !== "string"
      ) {
        throw new Error("Token invalido");
      }
    } catch {
      res.status(401).json({
        mensagem: "Token invalido ou expirado"
      });
      return;
    }

    try {
      const { rows } = await db.query<UsuarioAutenticado>(
        `SELECT id_usuario, perfil, ativo
         FROM usuario
         WHERE id_usuario = $1`,
        [idUsuario]
      );

      const usuario = rows[0];

      if (!usuario || !usuario.ativo) {
        res.status(401).json({
          mensagem: "Usuario inexistente ou desativado"
        });
        return;
      }

      if (
        perfis.length > 0 &&
        !perfis.includes(usuario.perfil)
      ) {
        res.status(403).json({
          mensagem: "Sem permissao"
        });
        return;
      }

      res.locals.usuario = {
        id_usuario: usuario.id_usuario,
        perfil: usuario.perfil
      };

      next();
    } catch (erro) {
      next(erro);
    }
  };
}
