"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Send } from "lucide-react";
import { chatApiPath } from "@/lib/chat-config";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id?: string;
  sender: "ai" | "user";
  text: string;
  sentAt?: string;
  timestamp?: string | Date;
};

type UIMessage = {
  id: string;
  sender: "ai" | "user";
  text: string;
  sentAt: string;
};

type FAQ = {
  id: string;
  question: string;
};

type AIChatCardProps = {
  className?: string;
  apiEndpoint?: string;
  websocketUrl?: string;
  initialMessages?: ChatMessage[];
};

type WebSocketPayload = {
  type?: "history" | "chat_message" | "error";
  messages?: ChatMessage[];
  message?: ChatMessage;
  error?: string;
};

const DEFAULT_MESSAGES: ChatMessage[] = [{ sender: "ai", text: "Hello! Welcome to My Next Deal. How can I help you today?" }];
const FAQS: FAQ[] = [
  { id: "1", question: "How can I schedule an appointment?" },
  { id: "2", question: "What payment methods do you accept?" },
  { id: "3", question: "What are your business hours?" },
  { id: "4", question: "Do you offer financing?" },
  { id: "5", question: "What is the purchase process?" },
];
const RECONNECT_DELAY_MS = 1500;
const IMAGE_MARKDOWN_RE = /^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i;
const LINK_MARKDOWN_RE = /^\[(.+?)\]\((https?:\/\/[^\s)]+)\)$/i;
const LIVE_CONNECTION_ERROR = "The live connection could not be established.";

function decodeEscapedNewLines(text: string) {
  return text.replace(/\\n/g, "\n");
}

function readParsedText(parsed: unknown) {
  if (Array.isArray(parsed) && parsed.length > 0) {
    const firstItem = parsed[0] as { output?: unknown };

    if (typeof firstItem?.output === "string") {
      return firstItem.output;
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const candidate = parsed as Record<"output" | "message" | "text", unknown>;

  for (const key of ["output", "message", "text"] as const) {
    if (typeof candidate[key] === "string") {
      return candidate[key];
    }
  }

  return null;
}

function buildInitialMessages(initialMessages: ChatMessage[]) {
  return initialMessages
    .map((message, index) => normalizeMessage(message, `initial-${index}`))
    .filter((message): message is UIMessage => Boolean(message));
}

function isChatMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as ChatMessage;
  return typeof candidate.text === "string" && (candidate.sender === "ai" || candidate.sender === "user");
}

function createMessageId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeMessage(message: ChatMessage, prefix: string) {
  if (!isChatMessage(message)) {
    return null;
  }

  const sentAtValue = message.sentAt ?? (message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp);

  return {
    id: message.id ?? createMessageId(prefix),
    sender: message.sender,
    text: message.text,
    sentAt: typeof sentAtValue === "string" && sentAtValue ? sentAtValue : new Date().toISOString(),
  } satisfies UIMessage;
}

function formatTime(sentAt: string) {
  const date = new Date(sentAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function extractRenderableText(text: string) {
  const normalizedText = text.replace(/\r\n/g, "\n");
  const decodedText = decodeEscapedNewLines(normalizedText);

  try {
    const parsedText = readParsedText(JSON.parse(normalizedText) as unknown);

    if (parsedText) {
      return decodeEscapedNewLines(parsedText);
    }
  } catch {
    return decodedText;
  }

  return decodedText;
}

function renderFormattedText(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((segment, index) => {
      const boldSegment = segment.match(/^\*\*([\s\S]+)\*\*$/) || segment.match(/^\*([\s\S]+)\*$/);

      if (boldSegment) {
        return (
          <strong key={`${segment}-${index}`} className="font-semibold">
            {boldSegment[1]}
          </strong>
        );
      }

      return <span key={`${segment}-${index}`}>{segment}</span>;
    });
}

function renderMessageContent(text: string) {
  const lines = extractRenderableText(text).split(/\r?\n/);

  return lines.map((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return <div key={`spacer-${index}`} className="h-3" aria-hidden="true" />;
    }

    const normalizedLine = trimmedLine.replace(/^[-*]\s+/, "").trim();
    const imageMatch = normalizedLine.match(IMAGE_MARKDOWN_RE);

    if (imageMatch) {
      const [, altText, imageUrl] = imageMatch;

      return (
        <div key={`image-${imageUrl}-${index}`} className="overflow-hidden rounded-md border border-slate-200 bg-white/80">
          <Image
            src={imageUrl}
            alt={altText || "Property image"}
            width={1200}
            height={900}
            sizes="(max-width: 768px) 100vw, 640px"
            className="h-auto w-full object-cover"
            unoptimized
            loader={({ src }) => src}
          />
        </div>
      );
    }

    const linkMatch = normalizedLine.match(LINK_MARKDOWN_RE);

    if (linkMatch) {
      const [, label, href] = linkMatch;

      return (
        <Link
          key={`link-${href}-${index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit break-all font-semibold underline underline-offset-4 text-green-600"
        >
          {label}
        </Link>
      );
    }

    return (
      <p key={`line-${index}`} className="leading-6">
        {renderFormattedText(normalizedLine)}
      </p>
    );
  });
}

export default function AIChatCard({
  className,
  apiEndpoint = chatApiPath,
  websocketUrl,
  initialMessages = DEFAULT_MESSAGES,
}: AIChatCardProps) {
  const [messages, setMessages] = useState<UIMessage[]>(() => buildInitialMessages(initialMessages));
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [showFAQ, setShowFAQ] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const usesWebSocket = Boolean(websocketUrl);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior,
    });
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [isTyping, messages]);

  useEffect(() => {
    const handleEmbedOpen = (event: MessageEvent<unknown>) => {
      if (event.data !== "webchat:opened") {
        return;
      }

      window.requestAnimationFrame(() => {
        scrollToBottom();
        window.setTimeout(() => {
          scrollToBottom();
        }, 120);
      });
    };

    window.addEventListener("message", handleEmbedOpen);

    return () => {
      window.removeEventListener("message", handleEmbedOpen);
    };
  }, []);

  useEffect(() => {
    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    if (!websocketUrl) {
      socketRef.current = null;
      shouldReconnectRef.current = false;
      clearReconnectTimeout();

      return;
    }

    shouldReconnectRef.current = true;
    clearReconnectTimeout();

    const socket = new WebSocket(websocketUrl);
    socketRef.current = socket;

    const scheduleReconnect = () => {
      if (!shouldReconnectRef.current || reconnectTimeoutRef.current) {
        return;
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        setConnectionAttempt((current) => current + 1);
      }, RECONNECT_DELAY_MS);
    };

    const handleOpen = () => {
      setIsSocketConnected(true);
      setError("");
    };

    const handleMessage = (event: MessageEvent<string>) => {
      let payload: WebSocketPayload;

      try {
        payload = JSON.parse(event.data) as WebSocketPayload;
      } catch {
        setError("El servidor WebSocket devolvió un mensaje inválido.");
        setIsTyping(false);
        return;
      }

      if (payload.type === "history" && Array.isArray(payload.messages) && payload.messages.length > 0) {
        const nextHistory = payload.messages
          .map((message, index) => normalizeMessage(message, `history-${index}`))
          .filter((message): message is UIMessage => Boolean(message));

        if (nextHistory.length > 0) {
          setMessages(nextHistory);
        }

        return;
      }

      if (payload.type === "chat_message" && isChatMessage(payload.message)) {
        const nextMessage = normalizeMessage(payload.message, "socket");

        if (!nextMessage) {
          return;
        }

        setMessages((prev) => [...prev, nextMessage]);

        if (nextMessage.sender === "ai") {
          setIsTyping(false);
        }

        return;
      }

      if (payload.type === "error") {
        setError(payload.error || "El servidor WebSocket devolvió un error.");
        setIsTyping(false);
      }
    };

    const handleClose = () => {
      setIsSocketConnected(false);
      setIsTyping(false);

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      scheduleReconnect();
    };

    const handleError = () => {
      setError(LIVE_CONNECTION_ERROR);
      setIsSocketConnected(false);
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);

    return () => {
      shouldReconnectRef.current = false;

      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("error", handleError);

      clearReconnectTimeout();

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [connectionAttempt, websocketUrl]);

  const sendMessage = async (rawText: string) => {
    const trimmedInput = rawText.trim();

    if (!trimmedInput || (!usesWebSocket && isTyping)) {
      return;
    }

    setShowFAQ(false);

    if (usesWebSocket) {
      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        setError("La conexión en vivo no está disponible todavía.");
        return;
      }

      socket.send(
        JSON.stringify({
          type: "chat_message",
          message: {
            sender: "user",
            text: trimmedInput,
          },
        })
      );

      setInput("");
      setError("");
      setIsTyping(true);
      return;
    }

    const nextUserMessage = normalizeMessage(
      {
        sender: "user",
        text: trimmedInput,
        sentAt: new Date().toISOString(),
      },
      "local-user"
    );

    if (!nextUserMessage) {
      return;
    }

    const nextMessages = [...messages, nextUserMessage];

    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);
    setError("");

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            sender: message.sender,
            text: message.text,
          })),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: ChatMessage;
      };

      if (!response.ok || !payload.message) {
        throw new Error(payload.error || "No se pudo obtener una respuesta del chat.");
      }

      const assistantMessage = normalizeMessage(payload.message, "api-assistant");

      if (!assistantMessage) {
        throw new Error("La respuesta del chat no tiene un formato válido.");
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Ocurrió un error inesperado.";
      setError(message);
    } finally {
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setMessages(buildInitialMessages(initialMessages));
    setInput("");
    setError("");
    setIsTyping(false);
    setShowFAQ(true);
    setIsResetDialogOpen(false);
  };

  const hasUserMessages = messages.some((message) => message.sender === "user");
  const isInitialConversation = !hasUserMessages && messages.length <= 1;
  const shouldShowFAQ = showFAQ && isInitialConversation;
  const shouldShowIntro = isInitialConversation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={cn(
        "relative flex h-[calc(100dvh-1rem)] min-h-152 w-[calc(100vw-1rem)] min-w-0 max-w-124 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:h-[calc(100dvh-2rem)] sm:max-w-lg lg:max-w-136",
        className
      )}
    >
      <div className="shrink-0 bg-linear-to-r from-green-600 to-green-700 px-5 py-4 text-white sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image src="/icono-logo.png" alt="My Next Deal" width={24} height={24} className="object-contain" priority />
            </div>
            <div>
              <h2 className="text-base font-bold">My Next Deal</h2>
              {(!usesWebSocket || isSocketConnected || error !== LIVE_CONNECTION_ERROR) && (
                <p className="text-xs text-green-100 font-bold">
                  {usesWebSocket
                    ? isSocketConnected
                      ? "Property guidance in real time"
                      : "Connecting to live chat..."
                    : "Property guidance in real time"}
                </p>
              )}
              {!isSocketConnected && error === LIVE_CONNECTION_ERROR && (
                <p className="mt-1 text-xs font-bold text-red-300">{error}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/14 text-white transition-colors hover:bg-white/22"
            aria-label="Reset chat"
            title="Reset chat"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={messagesContainerRef} className="chat-scroll flex-1 overflow-y-auto bg-slate-50">
        <div className="space-y-4 px-4 py-5 sm:space-y-5 sm:px-5">
          {shouldShowIntro && (
            <div className="px-2 pt-2 pb-1">
              <div className="flex items-center gap-4 px-5 py-6 text-left rounded-[28px] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:gap-5 sm:px-6 sm:py-7">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28">
                  <Image src="/logo.png" alt="My Next Deal" width={800} height={800} className="h-full w-full object-contain" priority />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Find your next property</h3>
                  <p className="text-sm leading-6 text-slate-500 sm:text-base">
                    Ask about listings, financing, appointments, or your next investment move.
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}
            >
              <div className={cn("flex max-w-[88%] flex-col gap-1 sm:max-w-[85%]", message.sender === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "wrap-break-word whitespace-pre-wrap rounded-2xl px-4 py-3.5 text-sm leading-6 sm:px-5",
                    message.sender === "user"
                      ? "rounded-br-none bg-green-600 text-white"
                      : "rounded-bl-none border border-slate-200 bg-white text-slate-900"
                  )}
                >
                  <div className="space-y-0.5">{renderMessageContent(message.text)}</div>
                </div>
                <span className="px-2 text-xs text-slate-500">{formatTime(message.sentAt)}</span>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-3.5 sm:px-5">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}

          {shouldShowFAQ && (
            <div className="mt-4 space-y-3">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Frequently Asked Questions</p>
              <div className="space-y-2">
                {FAQS.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => {
                      void sendMessage(faq.question);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors duration-200 hover:bg-green-50"
                  >
                    <p className="text-xs font-medium leading-snug text-green-700 hover:text-green-800">{faq.question}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder="Type your message..."
            disabled={isTyping}
            className="min-w-0 flex-1 rounded-full border border-slate-300 px-4 py-3.5 text-sm text-slate-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
          <button
            onClick={() => {
              void sendMessage(input);
            }}
            disabled={isTyping}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300 sm:h-13 sm:w-13"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">Powered by My Next Deal</p>
      </div>

      {isResetDialogOpen && (
        <div className="absolute inset-0 z-20 flex items-end bg-slate-950/28 p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full rounded-[24px] bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
          >
            <div className="space-y-2">
              <button
                type="button"
                onClick={resetChat}
                className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                Start new chat
              </button>
              <button
                type="button"
                onClick={() => setIsResetDialogOpen(false)}
                className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
