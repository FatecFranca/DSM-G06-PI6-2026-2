import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// Inicializa o cliente do SQS fixando ou priorizando a região correta (us-east-2)
const client = new SQSClient({ 
  region: process.env.AWS_REGION || "us-east-2" 
});

// URL da fila SQS configurada nas variáveis de ambiente da AWS
const QUEUE_URL = process.env.SQS_QUEUE_URL;

export async function publishToDoacoesQueue(data: object) {
  if (!QUEUE_URL) {
    console.error("❌ Erro: SQS_QUEUE_URL não está definida nas variáveis de ambiente.");
    return;
  }

  try {
    const command = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(data),
    });

    const response = await client.send(command);
    console.log("Mensagem enviada com sucesso para o SQS:", response.MessageId);
    return response;
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem para o SQS:", error);
    throw error;
  }
}