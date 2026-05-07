export type FAQ = {
  id: string;
  question: string;
};

export type DefaultChatMessage = {
  sender: "ai" | "user";
  text: string;
};

export const DEFAULT_MESSAGES: DefaultChatMessage[] = [
  { sender: "ai", text: "Hello! Welcome to My Next Deal. How can I help you today?" },
];

export const FAQS: FAQ[] = [
  { id: "1", question: "How can I schedule an appointment?" },
  { id: "2", question: "What payment methods do you accept?" },
  { id: "3", question: "What are your business hours?" },
  { id: "4", question: "Do you offer financing?" },
  { id: "5", question: "What is the purchase process?" },
];