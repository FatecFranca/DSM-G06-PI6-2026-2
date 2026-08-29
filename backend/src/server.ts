import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const porta = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API do DoeFácil funcionando!"
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    sistema: "DoeFácil",
    status: "online"
  });
});

app.listen(porta, () => {
  console.log(`Servidor iniciado na porta ${porta}`);
});