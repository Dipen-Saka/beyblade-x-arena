import { PartType } from "@/lib/types";

const STYLES: Record<PartType, string> = {
  blade:   "bg-[#f0b429]/10 text-[#f5c842] border border-[#f0b429]/25",
  ratchet: "bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/25",
  bit:     "bg-[#ef4444]/10 text-[#f87171] border border-[#ef4444]/25",
};

export default function TypeBadge({ type }: { type: PartType }) {
  return (
    <span className={`font-orbitron text-[9px] tracking-[1px] px-2 py-0.5 rounded ${STYLES[type]}`}>
      {type.toUpperCase()}
    </span>
  );
}
