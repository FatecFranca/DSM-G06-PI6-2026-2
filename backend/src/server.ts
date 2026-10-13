import "dotenv/config";
import app from "./app";

const porta = process.env.PORT || 3000;

app.listen(porta, () => {
  console.log(`Servidor iniciado na porta ${porta}`);
});