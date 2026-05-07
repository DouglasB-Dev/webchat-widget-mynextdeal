export type ChatMessage = {
  id?: string;
  sender: "ai" | "user";
  text: string;
  sentAt?: string;
  timestamp?: string | Date;
};

export type UIMessage = {
  id: string;
  sender: "ai" | "user";
  text: string;
  sentAt: string;
};

export type WebSocketPayload = {
  type?: "history" | "chat_message" | "error" | "chat_complete";
  messages?: ChatMessage[];
  message?: ChatMessage;
  error?: string;
};