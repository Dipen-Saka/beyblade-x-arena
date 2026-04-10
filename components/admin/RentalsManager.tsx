"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Part, PartType } from "@/lib/types";
import PartImage from "@/components/ui/PartImage";
import TypeBadge from "@/components/ui/TypeBadge";
import Topbar from "@/components/ui/Topbar";

export interface RentalItem { id: string; part_id: string; parts: Part; }
export interface RentalRow {
  id: string; status: string; created_at: string; user_id: string;
  user_email: string;
  rental_items: RentalItem[];
}

interface Props { initialRentals: RentalRow[]; }

const SECTIONS: { type: PartType; label: string }[] = [
  { type: "blade",   label: "Blades"   },
  { type: "ratchet", label: "Ratchets" },
  { type: "bit",     label: "Bits"     },
];

export default function RentalsManager({ initialRentals }: Props) {
  const supabase = createClient();
  const [rentals, setRentals] = useState<RentalRow[]>(initialRentals);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState("");

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const markReturned = async (rental: RentalRow) => {
    setLoading(rental.id);
    await supabase.from("rentals").update({ status: "returned" }).eq("id", rental.id);
    // Restore each part's stock
    for (const item of rental.rental_items) {
      await supabase.rpc("increment_stock", { part_id: item.part_id });
    }
    setRentals(r => r.filter(x => x.id !== rental.id));
    setLoading(null);
    notify("Rental returned — stock restored for " + rental.user_email);
  };

  const toggle = (id: string) => setExpanded(e => e === id ? null : id);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="RENTALS" userLabel="Admin" roleLabel="ADMIN" />

      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-16 right-5 z-50 bg-[#161625] border border-[#22c55e] text-[#4ade80] text-[12px] font-semibold px-4 py-2.5 rounded-xl">
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-orbitron text-[9px] tracking-[2px] text-[#55556a]">ACTIVE RENTALS</div>
          <span className="font-orbitron text-[10px] text-[#9898b8]">{rentals.length} ACTIVE</span>
        </div>

        {rentals.length === 0 && (
          <div className="text-center py-20 font-orbitron text-[10px] tracking-[3px] text-[#55556a]">
            NO ACTIVE RENTALS
          </div>
        )}

        <div className="flex flex-col gap-3">
          {rentals.map(rental => {
            const isOpen = expanded === rental.id;
            const initials = rental.user_email.slice(0, 2).toUpperCase();
            const date = new Date(rental.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

            return (
              <div key={rental.id} className="bg-[#161625] border border-[#2a2a42] rounded-xl overflow-hidden">
                {/* Header row */}
                <div className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-[#1e1e30]/50 transition-colors"
                  onClick={() => toggle(rental.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#f0b429]/10 border border-[#f0b429]/20 flex items-center justify-center font-orbitron text-[11px] font-bold text-[#f5c842] flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#eeeef8]">{rental.user_email}</div>
                      <div className="text-[10px] text-[#55556a] mt-0.5">{date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                      <span className="font-orbitron text-[9px] text-[#22c55e] tracking-wider">ACTIVE</span>
                    </div>
                    <span className={`text-[#55556a] text-sm transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>›</span>
                  </div>
                </div>

                {/* Expanded body */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[#2a2a42]"
                    >
                      <div className="p-4">
                        <div className="font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-3">9 PARTS RENTED</div>

                        {SECTIONS.map(({ type, label }) => {
                          const items = rental.rental_items.filter(i => i.parts?.type === type);
                          if (!items.length) return null;
                          return (
                            <div key={type} className="mb-4">
                              <div className="font-orbitron text-[8px] tracking-[2px] text-[#55556a] mb-2">{label.toUpperCase()}</div>
                              <div className="grid grid-cols-3 gap-2">
                                {items.map(item => (
                                  <div key={item.id} className="bg-[#1e1e30] border border-[#2a2a42] rounded-lg p-2.5 flex items-center gap-2.5">
                                    <PartImage src={item.parts?.image_url ?? null} name={item.parts?.name ?? ""} type={type} size={40} />
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-bold text-[#eeeef8] truncate">{item.parts?.name}</div>
                                      <TypeBadge type={type} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        <button
                          onClick={() => markReturned(rental)}
                          disabled={loading === rental.id}
                          className="w-full bg-[#22c55e]/08 border border-[#22c55e]/30 text-[#4ade80] font-orbitron text-[10px] tracking-[1.5px] rounded-xl py-3 font-bold hover:bg-[#22c55e]/15 transition-all disabled:opacity-50 mt-2"
                        >
                          {loading === rental.id ? "PROCESSING..." : "✓ MARK AS RETURNED — RESTORE STOCK"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
