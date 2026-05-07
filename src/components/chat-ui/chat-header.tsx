import Image from "next/image";

import { RotateCcw } from "lucide-react";

type ChatHeaderProps = {
  usesWebSocket: boolean;
  isSocketConnected: boolean;
  error: string;
  liveConnectionError: string;
  onReset: () => void;
};

export function ChatHeader({ usesWebSocket, isSocketConnected, error, liveConnectionError, onReset }: ChatHeaderProps) {
  return (
    <div className="shrink-0 bg-linear-to-r from-green-600 to-green-700 px-5 py-4 text-white sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
            <Image src="/icono-logo.png" alt="My Next Deal" width={24} height={24} className="object-contain" priority />
          </div>
          <div>
            <h2 className="text-base font-bold">My Next Deal</h2>
            {(!usesWebSocket || isSocketConnected || error !== liveConnectionError) && (
              <p className="text-xs font-bold text-green-100">
                {usesWebSocket ? (isSocketConnected ? "Property guidance in real time" : "Connecting to live chat...") : "Property guidance in real time"}
              </p>
            )}
            {!isSocketConnected && error === liveConnectionError && <p className="mt-1 text-xs font-bold text-red-300">{error}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/14 text-white transition-colors hover:bg-white/22"
          aria-label="Reset chat"
          title="Reset chat"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}