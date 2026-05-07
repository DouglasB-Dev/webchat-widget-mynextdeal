import Image from "next/image";
import Link from "next/link";

import type { ChatMessage, UIMessage } from "@/components/chat-ui/types";

const IMAGE_MARKDOWN_RE = /^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i;
const LINK_MARKDOWN_RE = /^\[(.+?)\]\((https?:\/\/[^\s)]+)\)$/i;
const URL_RE = /(https?:\/\/[^\s]+)/gi;

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

export function extractRenderableText(text: string) {
  const normalizedText = text.replace(/\r\n/g, "\n");
  const decodedText = decodeEscapedNewLines(normalizedText);

  try {
    const parsedText = readParsedText(JSON.parse(normalizedText) as unknown);

    if (parsedText !== null) {
      return decodeEscapedNewLines(parsedText);
    }
  } catch {
    return decodedText;
  }

  return decodedText;
}

export function isChatMessage(message: unknown): message is ChatMessage {
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

export function normalizeMessage(message: ChatMessage, prefix: string) {
  if (!isChatMessage(message)) {
    return null;
  }

  const renderableText = extractRenderableText(message.text).trim();

  if (!renderableText) {
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

export function buildInitialMessages(initialMessages: ChatMessage[]) {
  return initialMessages
    .map((message, index) => normalizeMessage(message, `initial-${index}`))
    .filter((message): message is UIMessage => Boolean(message));
}

export function formatTime(sentAt: string) {
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

function renderTextWithLinks(text: string) {
  return text.split(URL_RE).filter(Boolean).map((segment, index) => {
    if (segment.match(/^https?:\/\//i)) {
      return (
        <Link
          key={`${segment}-${index}`}
          href={segment}
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline underline-offset-4"
        >
          {segment}
        </Link>
      );
    }

    return <span key={`${segment}-${index}`}>{renderFormattedText(segment)}</span>;
  });
}

export function renderMessageContent(text: string) {
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
        {renderTextWithLinks(normalizedLine)}
      </p>
    );
  });
}