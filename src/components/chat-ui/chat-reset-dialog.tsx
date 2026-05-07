import { motion } from "framer-motion";

type ChatResetDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ChatResetDialog({ isOpen, onConfirm, onCancel }: ChatResetDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-end bg-slate-950/28 p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full rounded-[24px] bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            Start new chat
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}