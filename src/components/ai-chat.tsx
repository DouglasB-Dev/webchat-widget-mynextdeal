"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { chatApiPath } from "@/lib/chat-config";
import { ChatFAQList } from "@/components/chat-ui/chat-faq-list";
import { ChatHeader } from "@/components/chat-ui/chat-header";
import { ChatHistoryLoading } from "@/components/chat-ui/chat-history-loading";
import { ChatInputBar } from "@/components/chat-ui/chat-input-bar";
import { ChatIntro } from "@/components/chat-ui/chat-intro";
import { ChatMessageBubble } from "@/components/chat-ui/chat-message-bubble";
import { ChatResetDialog } from "@/components/chat-ui/chat-reset-dialog";
import { ChatTypingIndicator } from "@/components/chat-ui/chat-typing-indicator";
import { buildInitialMessages, isChatMessage, normalizeMessage } from "@/components/chat-ui/message-utils";
import type { ChatMessage, UIMessage, WebSocketPayload } from "@/components/chat-ui/types";
import { DEFAULT_MESSAGES, FAQS } from "@/lib/faqs";
import { cn } from "@/lib/utils";

type AIChatCardProps = {
  className?: string;
  apiEndpoint?: string;
  websocketUrl?: string;
  initialMessages?: ChatMessage[];
};

const RECONNECT_DELAY_MS = 1500;
const LIVE_CONNECTION_ERROR = "The live connection could not be established.";

export default function AIChatCard({
  className,
  apiEndpoint = chatApiPath,
  websocketUrl,
  initialMessages = DEFAULT_MESSAGES,
}: AIChatCardProps) {
  const [messages, setMessages] = useState<UIMessage[]>(() => buildInitialMessages(initialMessages));
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(websocketUrl));
  const [error, setError] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [showFAQ, setShowFAQ] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const hasResolvedInitialHistoryRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const usesWebSocket = Boolean(websocketUrl);
  const isAwaitingResponse = isTyping;

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
    hasResolvedInitialHistoryRef.current = false;
    setIsLoadingHistory(Boolean(websocketUrl));
  }, [websocketUrl]);

  useEffect(() => {
    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    if (!websocketUrl) {
      hasResolvedInitialHistoryRef.current = true;
      setIsLoadingHistory(false);
      socketRef.current = null;
      shouldReconnectRef.current = false;
      clearReconnectTimeout();

      return;
    }

    shouldReconnectRef.current = true;
    if (!hasResolvedInitialHistoryRef.current) {
      setIsLoadingHistory(true);
    }
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
        setError("The WebSocket server returned an invalid message.");
        setIsTyping(false);
        return;
      }

      if (payload.type === "history" && Array.isArray(payload.messages)) {
        const nextHistory = payload.messages
          .map((message, index) => normalizeMessage(message, `history-${index}`))
          .filter((message): message is UIMessage => Boolean(message));

        if (nextHistory.length > 0) {
          setMessages(nextHistory);
        }

        hasResolvedInitialHistoryRef.current = true;
        setIsLoadingHistory(false);

        return;
      }

      if (payload.type === "chat_message" && isChatMessage(payload.message)) {
        const nextMessage = normalizeMessage(payload.message, "socket");

        if (!nextMessage) {
          if (payload.message.sender === "ai") {
            setIsTyping(false);
          }

          return;
        }

        setMessages((prev) => [...prev, nextMessage]);

        if (nextMessage.sender === "ai") {
          setIsTyping(false);
        }

        return;
      }

      if (payload.type === "chat_complete") {
        hasResolvedInitialHistoryRef.current = true;
        setIsLoadingHistory(false);
        setIsTyping(false);
        return;
      }

      if (payload.type === "error") {
        hasResolvedInitialHistoryRef.current = true;
        setIsLoadingHistory(false);
        setError(payload.error || "The WebSocket server returned an error.");
        setIsTyping(false);
      }
    };

    const handleClose = () => {
      hasResolvedInitialHistoryRef.current = true;
      setIsLoadingHistory(false);
      setIsSocketConnected(false);
      setIsTyping(false);

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      scheduleReconnect();
    };

    const handleError = () => {
      hasResolvedInitialHistoryRef.current = true;
      setIsLoadingHistory(false);
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

    if (!trimmedInput || isAwaitingResponse) {
      return;
    }

    setShowFAQ(false);

    if (usesWebSocket) {
      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        setError("The live connection is not available yet.");
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
        throw new Error(payload.error || "A chat response could not be retrieved.");
      }

      const assistantMessage = normalizeMessage(payload.message, "api-assistant");

      if (!assistantMessage) {
        throw new Error("The chat response has an invalid format.");
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "An unexpected error occurred.";
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
  const shouldDisableInput = isAwaitingResponse || isLoadingHistory;

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
      <ChatHeader
        usesWebSocket={usesWebSocket}
        isSocketConnected={isSocketConnected}
        error={error}
        liveConnectionError={LIVE_CONNECTION_ERROR}
        onReset={() => setIsResetDialogOpen(true)}
      />

      <div ref={messagesContainerRef} className="chat-scroll flex-1 overflow-y-auto bg-slate-50">
        {isLoadingHistory ? (
          <div className="flex min-h-full items-center justify-center px-4 py-5 sm:px-5">
            <ChatHistoryLoading />
          </div>
        ) : (
          <div className="space-y-4 px-4 py-5 sm:space-y-5 sm:px-5">
            {shouldShowIntro && <ChatIntro />}

            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}

            {isTyping && <ChatTypingIndicator />}

            {shouldShowFAQ && <ChatFAQList faqs={FAQS} disabled={shouldDisableInput} onSelect={(question) => void sendMessage(question)} />}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        )}
      </div>

      <ChatInputBar input={input} isAwaitingResponse={shouldDisableInput} onInputChange={setInput} onSend={() => void sendMessage(input)} />

      <ChatResetDialog isOpen={isResetDialogOpen} onConfirm={resetChat} onCancel={() => setIsResetDialogOpen(false)} />
    </motion.div>
  );
}
