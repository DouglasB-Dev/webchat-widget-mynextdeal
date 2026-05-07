import Image from "next/image";

export function ChatIntro() {
  return (
    <div className="px-2 pb-1 pt-2">
      <div className="flex items-center gap-4 rounded-[28px] bg-white px-5 py-6 text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:gap-5 sm:px-6 sm:py-7">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28">
          <Image src="/logo.png" alt="My Next Deal" width={800} height={800} className="h-full w-full object-contain" priority />
        </div>
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Find your next property</h3>
          <p className="text-sm leading-6 text-slate-500 sm:text-base">Ask about listings, financing, appointments, or your next investment move.</p>
        </div>
      </div>
    </div>
  );
}