type ChatMessage = {
  sender: "ai" | "user";
  text: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
};

function buildReply(lastUserMessage: string) {
  const normalized = lastUserMessage.trim();

  if (!normalized) {
    return "Necesito un mensaje para poder responder.";
  }

  return `Recibí tu mensaje: "${normalized}". Este endpoint ya está listo para conectarlo a tu proveedor de IA real.`;
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "El body debe ser JSON válido." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUserMessage = [...messages].reverse().find((message) => message.sender === "user");

  if (!lastUserMessage?.text?.trim()) {
    return Response.json({ error: "No se encontró un mensaje del usuario para responder." }, { status: 400 });
  }

  const reply = buildReply(lastUserMessage.text);

  return Response.json({
    message: {
      sender: "ai",
      text: reply,
    },
  });
}