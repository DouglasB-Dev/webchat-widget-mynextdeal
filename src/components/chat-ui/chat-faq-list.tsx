import type { FAQ } from "@/lib/faqs";

type ChatFAQListProps = {
  faqs: FAQ[];
  disabled: boolean;
  onSelect: (question: string) => void;
};

export function ChatFAQList({ faqs, disabled, onSelect }: ChatFAQListProps) {
  return (
    <div className="mt-4 space-y-3">
      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Frequently Asked Questions</p>
      <div className="space-y-2">
        {faqs.map((faq) => (
          <button
            key={faq.id}
            onClick={() => {
              onSelect(faq.question);
            }}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors duration-200 hover:bg-green-50"
          >
            <p className="text-xs font-medium leading-snug text-green-700 hover:text-green-800">{faq.question}</p>
          </button>
        ))}
      </div>
    </div>
  );
}