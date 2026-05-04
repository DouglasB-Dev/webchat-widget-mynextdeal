import AIChatCard from "@/components/ai-chat";
import { websocketUrl } from "@/lib/chat-config";

export default function EmbedPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-transparent">
      <AIChatCard
        className="h-screen w-screen rounded-none border-0 shadow-none"
        websocketUrl={websocketUrl}
      />
    </main>
  );
}