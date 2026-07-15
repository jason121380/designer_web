import { ChevronDown } from "lucide-react";

export default function PageSectionPanel({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-gray-200 bg-white last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 md:px-7">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {!!description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
        </div>
        <ChevronDown size={18} className="shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-gray-100 px-5 py-6 md:px-7">{children}</div>
    </details>
  );
}
