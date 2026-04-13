"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Part, PartType } from "@/lib/types";
import PartImage from "@/components/ui/PartImage";
import TypeBadge from "@/components/ui/TypeBadge";
import Topbar from "@/components/ui/Topbar";

interface Props { parts: Part[]; userId: string; userEmail: string; }

const TYPES: PartType[] = ["blade", "ratchet", "bit"];
const TYPE_COLORS = {
  blade:   { border: "border-[#f0b429]", bg: "bg-[#f0b429]/10", glow: "shadow-[0_0_12px_rgba(240,180,41,0.3)]", text: "text-[#f5c842]", dash: "border-[#f0b429]/25" },
  ratchet: { border: "border-[#3b82f6]", bg: "bg-[#3b82f6]/10", glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]",  text: "text-[#60a5fa]", dash: "border-[#3b82f6]/25" },
  bit:     { border: "border-[#ef4444]", bg: "bg-[#ef4444]/10", glow: "shadow-[0_0_12px_rgba(239,68,68,0.3)]",   text: "text-[#f87171]", dash: "border-[#ef4444]/25" },
};

export default function AssemblyUI({ parts, userId, userEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [activeType, setActiveType] = useState<PartType>("blade");
  const [selected, setSelected] = useState<Record<PartType, Part[]>>({ blade: [], ratchet: [], bit: [] });
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const totalSelected = TYPES.reduce((s, t) => s + selected[t].length, 0);
  const progress = Math.round((totalSelected / 9) * 100);

  const filtered = useMemo(() =>
    parts.filter(p => p.type === activeType && p.name.toLowerCase().includes(search.toLowerCase())),
    [parts, activeType, search]);

  const togglePart = (part: Part) => {
    setSelected(prev => {
      const sel = prev[part.type];
      const idx = sel.findIndex(s => s.id === part.id);
      if (idx >= 0) return { ...prev, [part.type]: sel.filter((_, i) => i !== idx) };
      if (sel.length >= 3) return prev;
      return { ...prev, [part.type]: [...sel, part] };
    });
  };

  const isSelected = (part: Part) => selected[part.type].some(s => s.id === part.id);

  const confirmRental = async () => {
    setSubmitting(true);
    setSubmitError("");
    const allParts = TYPES.flatMap(t => selected[t]);

    try {
      // 1. Create rental record
      const { data: rental, error: rentalError } = await supabase
        .from("rentals")
        .insert({ user_id: userId, status: "active" })
        .select("id")
        .single();

      if (rentalError) throw new Error("Failed to create rental: " + rentalError.message);
      if (!rental) throw new Error("No rental returned");

      // 2. Create rental items
      const { error: itemsError } = await supabase
        .from("rental_items")
        .insert(allParts.map(p => ({ rental_id: rental.id, part_id: p.id })));

      if (itemsError) throw new Error("Failed to save rental items: " + itemsError.message);

      // 3. Decrement stock for each part using direct update instead of RPC
      for (const p of allParts) {
        await supabase
          .from("parts")
          .update({ available_stock: Math.max(0, p.available_stock - 1) })
          .eq("id", p.id);
      }

      router.replace("/profile");
    } catch (err: any) {
      setSubmitError(err.message || "Error creating rental. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="ASSEMBLY" userLabel={userEmail} roleLabel="PLAYER" />
      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto">

          {/* LEFT — BEY SLOTS */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#161625] border border-[#2a2a42] rounded-xl p-4">
              <div className="font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-4">
                YOUR BUILD — SELECT 3 OF EACH
              </div>
              {TYPES.map(type => {
                const c = TYPE_COLORS[type];
                return (
                  <div key={type} className="mb-4 last:mb-0">
                    <div className={`font-orbitron text-[9px] tracking-[2px] ${c.text} mb-2`}>
                      {type.toUpperCase()}S
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map(i => {
                        const part = selected[type][i];
                        return (
                          <motion.div key={i} layout
                            className={`relative rounded-lg border-[1.5px] border-dashed ${part ? `${c.border} ${c.bg} ${c.glow} border-solid` : c.dash} flex flex-col items-center justify-center cursor-pointer transition-all`}
                            style={{ minHeight: 80 }}
                            onClick={() => part && togglePart(part)}>
                            {part ? (
                              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center gap-1 p-2">
                                <PartImage src={part.image_url} name={part.name} type={part.type} size={48} />
                                <span className="text-[9px] text-[#eeeef8] font-semibold text-center leading-tight px-1">
                                  {part.name.split(" ")[0]}
                                </span>
                              </motion.div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[#55556a] text-lg">+</span>
                                <span className="font-orbitron text-[8px] text-[#55556a] tracking-wider">#{i + 1}</span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress + Confirm */}
            <div className="bg-[#1e1e30] border border-[#2a2a42] rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-orbitron text-[9px] tracking-[2px] text-[#55556a]">PROGRESS</span>
                <span className="font-orbitron text-sm text-[#f0b429]">{totalSelected} / 9</span>
              </div>
              <div className="bg-[#252538] rounded-full h-1.5 mb-4 overflow-hidden">
                <motion.div className="h-full bg-[#f0b429] rounded-full"
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>
              {TYPES.map(t => {
                const c = TYPE_COLORS[t];
                return (
                  <div key={t} className="flex items-center gap-2 mb-1.5">
                    <span className={`font-orbitron text-[8px] w-14 ${c.text}`}>{t.toUpperCase()}</span>
                    <div className="flex-1 bg-[#252538] rounded-full h-1 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${t === "blade" ? "bg-[#f0b429]" : t === "ratchet" ? "bg-[#3b82f6]" : "bg-[#ef4444]"}`}
                        style={{ width: `${(selected[t].length / 3) * 100}%` }} />
                    </div>
                    <span className="font-orbitron text-[9px] text-[#55556a] w-6">{selected[t].length}/3</span>
                  </div>
                );
              })}
              {submitError && (
                <div className="mt-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg px-3 py-2 text-[11px] text-[#f87171]">
                  {submitError}
                </div>
              )}
              <button onClick={confirmRental} disabled={totalSelected < 9 || submitting}
                className="w-full mt-4 bg-[#f0b429]/10 border border-[#f0b429]/40 text-[#f5c842] font-orbitron text-[10px] tracking-[2px] rounded-lg py-3 font-bold hover:bg-[#f0b429]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                {submitting ? "CONFIRMING..." : "CONFIRM RENTAL"}
              </button>
            </div>
          </div>

          {/* RIGHT — PARTS GRID */}
          <div className="bg-[#161625] border border-[#2a2a42] rounded-xl p-4">
            <div className="font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-3">PARTS GRID</div>
            <div className="flex gap-2 mb-3">
              {TYPES.map(t => {
                const c = TYPE_COLORS[t];
                const on = activeType === t;
                return (
                  <button key={t} onClick={() => { setActiveType(t); setSearch(""); }}
                    className={`font-orbitron text-[9px] tracking-wider px-3 py-1.5 rounded-full border transition-all ${on ? `${c.border} ${c.bg} ${c.text}` : "border-[#2a2a42] text-[#55556a] hover:text-[#9898b8]"}`}>
                    {t.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search parts..."
              className="w-full bg-[#1e1e30] border border-[#2a2a42] focus:border-[#353555] rounded-lg px-3 py-2 text-sm text-[#eeeef8] outline-none transition-colors mb-3 placeholder-[#55556a]" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
              <AnimatePresence>
                {filtered.map(part => {
                  const sel = isSelected(part);
                  const c = TYPE_COLORS[part.type];
                  const full = selected[part.type].length >= 3 && !sel;
                  return (
                    <motion.div key={part.id} layout
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => !full && togglePart(part)}
                      className={`relative rounded-xl border p-3 flex flex-col items-center gap-2 cursor-pointer transition-all
                        ${sel ? `${c.border} ${c.bg} ${c.glow}` : "border-[#2a2a42] bg-[#1e1e30] hover:border-[#353555]"}
                        ${full ? "opacity-40 cursor-not-allowed" : ""}`}>
                      {sel && (
                        <div className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full ${c.border} ${c.bg} flex items-center justify-center`}>
                          <span className={`text-[8px] font-bold ${c.text}`}>✓</span>
                        </div>
                      )}
                      <PartImage src={part.image_url} name={part.name} type={part.type} size={72} />
                      <div className="text-center">
                        <div className="text-[11px] font-bold text-[#eeeef8] leading-tight">{part.name}</div>
                        <div className="text-[9px] text-[#55556a] mt-0.5">{part.available_stock} avail</div>
                      </div>
                      <TypeBadge type={part.type} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="col-span-3 text-center py-12 text-[#55556a] font-orbitron text-[10px] tracking-[2px]">
                  NO PARTS FOUND
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
