import { Send } from "lucide-react";

type ChatInputBarProps = {
  input: string;
  isAwaitingResponse: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export function ChatInputBar({ input, isAwaitingResponse, onInputChange, onSend }: ChatInputBarProps) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Type your message..."
          className="min-w-0 flex-1 rounded-full border border-slate-300 px-4 py-3.5 text-sm text-slate-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
        <button
          onClick={onSend}
          disabled={isAwaitingResponse}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300 sm:h-13 sm:w-13"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">Powered by My Next Deal</p>
    </div>
  );
}