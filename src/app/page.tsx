import AIChatCard from "@/components/ai-chat";
import { websocketUrl } from "@/lib/chat-config";

export default function Home() {
  return (
    <div
      suppressHydrationWarning
      className="relative flex min-h-screen flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,#f8fafc_0%,#e2e8f0_45%,#cbd5e1_100%)] font-sans"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.45) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="relative flex w-full items-start justify-start p-6 text-slate-700 sm:p-10">
        <div className="max-w-xl space-y-3 rounded-3xl border border-white/60 bg-white/45 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Live Chat Demo</p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Customer support widget</h1>
          <p className="text-sm leading-6 text-slate-600 sm:text-base">
            The chat now lives as a floating support widget, with the existing AI and WebSocket flows preserved behind the new interface.
          </p>
        </div>
      </div>
      <AIChatCard websocketUrl={websocketUrl} />
    </div>
  );
}
