"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Part, PartType } from "@/lib/types";
import PartImage from "@/components/ui/PartImage";
import TypeBadge from "@/components/ui/TypeBadge";
import Topbar from "@/components/ui/Topbar";

interface RentalItem { id: string; part_id: string; parts: Part; }
interface RentalWithItems {
  id: string; status: string; created_at: string;
  rental_items: RentalItem[];
}

interface Props { rental: RentalWithItems; userEmail: string; }

const SECTIONS: { type: PartType; label: string }[] = [
  { type: "blade",   label: "BLADES"   },
  { type: "ratchet", label: "RATCHETS" },
  { type: "bit",     label: "BITS"     },
];

const BORDER: Record<PartType, string> = {
  blade:   "border-[#f0b429]/25",
  ratchet: "border-[#3b82f6]/25",
  bit:     "border-[#ef4444]/25",
};

export default function ProfileUI({ rental, userEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [returning, setReturning] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const rentalDate = new Date(rental.created_at).toLocaleString("en-IN", {
    dateStyle: "medium", timeStyle: "short",
  });

  const confirmReturn = async () => {
    setReturning(true);
    // Mark rental returned
    await supabase.from("rentals").update({ status: "returned" }).eq("id", rental.id);
    // Restore stock for each part
    const partIds = rental.rental_items.map(i => i.part_id);
    for (const partId of partIds) {
      await supabase.rpc("increment_stock", { part_id: partId });
    }
    setConfirmed(true);
    setTimeout(() => router.replace("/assembly"), 1800);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="MY RENTAL" userLabel={userEmail} roleLabel="PLAYER" />
      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        <div className="max-w-2xl mx-auto">

          {/* Active banner */}
          {!confirmed && (
            <div className="flex items-center gap-3 bg-[#22c55e]/07 border border-[#22c55e]/25 rounded-xl p-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
              <span className="text-sm font-semibold">Active Rental</span>
              <span className="text-[10px] text-[#55556a] ml-auto">{rentalDate}</span>
            </div>
          )}

          {confirmed && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-6 mb-4 text-center">
              <div className="text-4xl">✅</div>
              <div className="font-orbitron text-[#22c55e] text-sm tracking-wider">RETURN CONFIRMED</div>
              <div className="text-[#9898b8] text-xs">Returning to Assembly...</div>
            </motion.div>
          )}

          {/* Receipt card */}
          <div className="bg-[#161625] border border-[#2a2a42] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#f0b429]/06 border-b border-[#2a2a42] px-5 py-4 flex justify-between items-start">
              <div>
                <div className="font-orbitron text-[#f0b429] text-sm tracking-[1px]">RENTAL RECEIPT</div>
                <div className="font-orbitron text-[#55556a] text-[10px] mt-1">#{rental.id.slice(0, 8).toUpperCase()}</div>
              </div>
              <div className="text-right text-[10px] text-[#55556a]">
                <div>{userEmail}</div>
                <div className="mt-0.5">{rentalDate}</div>
              </div>
            </div>

            {/* Parts sections */}
            <div className="p-5">
              {SECTIONS.map(({ type, label }) => {
                const items = rental.rental_items.filter(i => i.parts?.type === type);
                return (
                  <div key={type} className="mb-5 last:mb-0">
                    <div className="font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-3">{label}</div>
                    <div className="grid grid-cols-3 gap-3">
                      {items.map(item => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-[#1e1e30] border ${BORDER[type]} rounded-xl p-3 flex flex-col items-center gap-2`}
                        >
                          <PartImage
                            src={item.parts?.image_url ?? null}
                            name={item.parts?.name ?? ""}
                            type={type}
                            size={80}
                          />
                          <div className="text-center">
                            <div className="text-[11px] font-bold text-[#eeeef8] leading-tight">
                              {item.parts?.name}
                            </div>
                          </div>
                          <TypeBadge type={type} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Return button */}
              {!confirmed && (
                <button
                  onClick={confirmReturn}
                  disabled={returning}
                  className="w-full mt-4 bg-[#ef4444]/08 border border-[#ef4444]/30 text-[#f87171] font-orbitron text-[10px] tracking-[2px] rounded-xl py-3.5 font-bold hover:bg-[#ef4444]/15 transition-all disabled:opacity-50"
                >
                  {returning ? "CONFIRMING..." : "⊘  ALL PARTS RETURNED — CONFIRM RETURN"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
