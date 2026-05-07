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
    return "I need a message before I can respond.";
  }

  return `I received your message: "${normalized}".`;
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUserMessage = [...messages].reverse().find((message) => message.sender === "user");

  if (!lastUserMessage?.text?.trim()) {
    return Response.json({ error: "No user message was found to respond to." }, { status: 400 });
  }

  const reply = buildReply(lastUserMessage.text);

  return Response.json({
    message: {
      sender: "ai",
      text: reply,
    },
  });
}