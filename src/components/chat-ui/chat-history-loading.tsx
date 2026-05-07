import { motion } from "framer-motion";

export function ChatHistoryLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex min-h-full items-center justify-center px-4 py-10"
    >
      {/* <div className="flex w-full max-w-xs flex-col items-center gap-4 px-6 py-8 text-center 
      rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]
      "> */}
      <div className="flex w-full max-w-xs flex-col items-center gap-4 px-6 py-8 text-center">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-600" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-600 [animation-delay:150ms]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-600 [animation-delay:300ms]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Loading conversation</p>
          <p className="text-sm leading-6 text-slate-500">Please wait while the chat history is prepared.</p>
        </div>
      </div>
    </motion.div>
  );
}