import type { JobStatus } from "@/lib/contracts";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-[#030303] text-[#F4F4F4] border-[#F4F4F4]",
  Funded: "bg-[#F4F4F4] text-[#030303] border-[#F4F4F4]",
  Submitted: "bg-[#030303] text-[#FF0033] border-[#FF0033]",
  Completed: "bg-[#030303] text-[#00FF00] border-[#00FF00]",
  Rejected: "bg-[#030303] text-[#FF0033] border-[#FF0033]",
  Expired: "bg-[#030303] text-[#555] border-[#555]",
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const normalized =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const style = STATUS_STYLES[normalized] || STATUS_STYLES.Open;

  return (
    <span
      className={`inline-flex items-center border font-mono font-bold uppercase tracking-wider ${style} ${
        size === "sm" ? "px-2 py-0.5 text-[0.65rem]" : "px-3 py-1 text-xs"
      }`}
    >
      [{normalized}]
    </span>
  );
}
