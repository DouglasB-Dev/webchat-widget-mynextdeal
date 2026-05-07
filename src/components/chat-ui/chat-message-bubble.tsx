import { memo } from "react";

import { motion } from "framer-motion";

import { renderMessageContent, formatTime } from "@/components/chat-ui/message-utils";
import type { UIMessage } from "@/components/chat-ui/types";
import { cn } from "@/lib/utils";

type ChatMessageBubbleProps = {
  message: UIMessage;
};

export const ChatMessageBubble = memo(function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-[88%] flex-col gap-1 sm:max-w-[85%]", message.sender === "user" ? "items-end" : "items-start")}>
        <div
          className={cn(
            "whitespace-pre-wrap wrap-anywhere rounded-2xl px-4 py-3.5 text-sm leading-6 sm:px-5",
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
  );
});