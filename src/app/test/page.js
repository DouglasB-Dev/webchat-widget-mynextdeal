
import Script from "next/script";
import { appUrl, embedScriptUrl, embedUrl } from "@/lib/chat-config";

const EMBED_SCRIPT_PROPS = {
  strategy: "afterInteractive",
  "data-origin": appUrl,
  "data-path": embedUrl,
  "data-open": "false",
  "data-title": "Open chat",
  "data-width": "480px",
  "data-height": "760px",
  "data-position": "right",
  "data-offset": "24px",
};

export default function NamePage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold">Prueba de embed</h1>
        <p className="text-base text-slate-600">
          Esta página carga el widget embebido desde el script público del proyecto.
        </p>
      </div>

      {/*
        Script HTML equivalente para copiar y pegar fuera de Next.js, por ejemplo en WordPress:

        <script
          src="http://localhost:3000/webchat-embed.js"
          data-origin="http://localhost:3000"
          data-path="http://localhost:3000/embed"
          data-open="false"
          data-title="Open chat"
          data-width="480px"
          data-height="760px"
          data-position="right"
          data-offset="24px"
        ></script>
      */}
      <Script src={embedScriptUrl} {...EMBED_SCRIPT_PROPS} />
    </main>
  );
}
