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
const TYPE_CFG = {
  blade:   { border: "border-[#f0b429]", bg: "bg-[#f0b429]/10", glow: "shadow-[0_0_16px_rgba(240,180,41,0.35)]", text: "text-[#f5c842]", dash: "border-[#f0b429]/20", pill: "bg-[#f0b429]/10 border-[#f0b429]/30 text-[#f5c842]", bar: "bg-[#f0b429]" },
  ratchet: { border: "border-[#3b82f6]", bg: "bg-[#3b82f6]/10", glow: "shadow-[0_0_16px_rgba(59,130,246,0.35)]",  text: "text-[#60a5fa]", dash: "border-[#3b82f6]/20", pill: "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#60a5fa]", bar: "bg-[#3b82f6]" },
  bit:     { border: "border-[#ef4444]", bg: "bg-[#ef4444]/10", glow: "shadow-[0_0_16px_rgba(239,68,68,0.35)]",   text: "text-[#f87171]", dash: "border-[#ef4444]/20", pill: "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#f87171]", bar: "bg-[#ef4444]" },
};

function SlotCard({ part, index, type, onRemove }: { part?: Part; index: number; type: PartType; onRemove?: () => void }) {
  const c = TYPE_CFG[type];
  return (
    <motion.div
      layout
      whileTap={{ scale: 0.96 }}
      onClick={() => part && onRemove?.()}
      className={`relative rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-200
        ${part ? `${c.border} ${c.bg} ${c.glow}` : `border-dashed ${c.dash} bg-[#0f0f1a]`}`}
      style={{ minHeight: 88 }}
    >
      <AnimatePresence mode="wait">
        {part ? (
          <motion.div key={part.id}
            initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-1.5 p-2 w-full"
          >
            <PartImage src={part.image_url} name={part.name} type={part.type} size={52} />
            <span className="text-[9px] text-[#eeeef8] font-bold text-center leading-tight px-1 truncate w-full text-center">
              {part.name.split(" ")[0]}
            </span>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${c.bg} ${c.border} border`}>
              ✕
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1">
            <span className={`text-2xl font-thin ${c.text} opacity-30`}>+</span>
            <span className="font-orbitron text-[7px] text-[#55556a] tracking-widest">#{index + 1}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PartCard({ part, selected, disabled, onClick }: { part: Part; selected: boolean; disabled: boolean; onClick: () => void }) {
  const c = TYPE_CFG[part.type];
  return (
    <motion.div
      layout
      whileHover={!disabled ? { y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      onClick={() => !disabled && onClick()}
      className={`relative rounded-xl border p-3 flex flex-col items-center gap-2 transition-all duration-150
        ${selected ? `${c.border} ${c.bg} ${c.glow}` : "border-[#2a2a42] bg-[#1a1a28] hover:border-[#353555] hover:bg-[#1e1e30]"}
        ${disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <AnimatePresence>
        {selected && (
          <motion.div key="check"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center ${c.bg} border ${c.border}`}>
            <span className={`text-[9px] font-black ${c.text}`}>✓</span>
          </motion.div>
        )}
      </AnimatePresence>
      <PartImage src={part.image_url} name={part.name} type={part.type} size={70} />
      <div className="text-center w-full">
        <div className="text-[11px] font-bold text-[#eeeef8] leading-tight truncate">{part.name}</div>
        <div className={`text-[9px] mt-0.5 ${part.available_stock === 0 ? "text-[#f87171]" : "text-[#55556a]"}`}>
          {part.available_stock === 0 ? "Out of stock" : `${part.available_stock} available`}
        </div>
      </div>
      <TypeBadge type={part.type} />
    </motion.div>
  );
}

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

  const removePart = (part: Part) => {
    setSelected(prev => ({ ...prev, [part.type]: prev[part.type].filter(s => s.id !== part.id) }));
  };

  const confirmRental = async () => {
    setSubmitting(true); setSubmitError("");
    const allParts = TYPES.flatMap(t => selected[t]);
    try {
      const { data: rental, error: rentalError } = await supabase
        .from("rentals").insert({ user_id: userId, status: "active" }).select("id").single();
      if (rentalError) throw new Error(rentalError.message);

      const { error: itemsError } = await supabase
        .from("rental_items").insert(allParts.map(p => ({ rental_id: rental.id, part_id: p.id })));
      if (itemsError) throw new Error(itemsError.message);

      for (const p of allParts) {
        await supabase.from("parts")
          .update({ available_stock: Math.max(0, p.available_stock - 1) }).eq("id", p.id);
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

          {/* LEFT */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#0f0f1a] border border-[#2a2a42] rounded-2xl p-4">
              <div className="font-orbitron text-[9px] tracking-[3px] text-[#55556a] mb-4">YOUR BUILD</div>
              {TYPES.map(type => {
                const c = TYPE_CFG[type];
                return (
                  <div key={type} className="mb-4 last:mb-0">
                    <div className={`font-orbitron text-[9px] tracking-[2px] ${c.text} mb-2 flex items-center gap-2`}>
                      <span>{type.toUpperCase()}S</span>
                      <span className="text-[#55556a]">{selected[type].length}/3</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map(i => (
                        <SlotCard key={i} part={selected[type][i]} index={i} type={type}
                          onRemove={() => selected[type][i] && removePart(selected[type][i])} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress */}
            <div className="bg-[#0f0f1a] border border-[#2a2a42] rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-orbitron text-[9px] tracking-[2px] text-[#55556a]">SELECTION</span>
                <motion.span key={totalSelected} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  className="font-orbitron text-sm text-[#f0b429] font-bold">
                  {totalSelected} / 9
                </motion.span>
              </div>
              <div className="bg-[#1a1a28] rounded-full h-2 mb-4 overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-[#f0b429] via-[#3b82f6] to-[#ef4444]"
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
              </div>
              {TYPES.map(t => {
                const c = TYPE_CFG[t];
                return (
                  <div key={t} className="flex items-center gap-2 mb-1.5">
                    <span className={`font-orbitron text-[8px] w-16 ${c.text}`}>{t.toUpperCase()}</span>
                    <div className="flex-1 bg-[#1a1a28] rounded-full h-1 overflow-hidden">
                      <motion.div className={`h-full rounded-full ${c.bar}`}
                        animate={{ width: `${(selected[t].length / 3) * 100}%` }}
                        transition={{ duration: 0.3 }} />
                    </div>
                    <span className="font-orbitron text-[9px] text-[#55556a] w-6">{selected[t].length}/3</span>
                  </div>
                );
              })}
              {submitError && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl px-3 py-2 text-[11px] text-[#f87171]">
                  {submitError}
                </motion.div>
              )}
              <motion.button onClick={confirmRental} disabled={totalSelected < 9 || submitting}
                whileTap={totalSelected >= 9 ? { scale: 0.97 } : {}}
                className="w-full mt-4 bg-[#f0b429]/10 border border-[#f0b429]/40 text-[#f5c842] font-orbitron text-[10px] tracking-[2px] rounded-xl py-3.5 font-bold hover:bg-[#f0b429]/20 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                {submitting ? "CONFIRMING..." : totalSelected < 9 ? `SELECT ${9 - totalSelected} MORE PARTS` : "⚡ CONFIRM RENTAL"}
              </motion.button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-[#0f0f1a] border border-[#2a2a42] rounded-2xl p-4">
            <div className="font-orbitron text-[9px] tracking-[3px] text-[#55556a] mb-3">PARTS GRID</div>
            {/* Type pills */}
            <div className="flex gap-2 mb-3">
              {TYPES.map(t => {
                const c = TYPE_CFG[t];
                const on = activeType === t;
                const cnt = selected[t].length;
                return (
                  <motion.button key={t} onClick={() => { setActiveType(t); setSearch(""); }}
                    whileTap={{ scale: 0.95 }}
                    className={`font-orbitron text-[9px] tracking-wider px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5
                      ${on ? `${c.border} ${c.bg} ${c.text}` : "border-[#2a2a42] text-[#55556a] hover:text-[#9898b8]"}`}>
                    {t.toUpperCase()}
                    {cnt > 0 && (
                      <span className={`w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center ${c.bg} ${c.border} border ${c.text}`}>
                        {cnt}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeType}s...`}
              className="w-full bg-[#161625] border border-[#2a2a42] focus:border-[#353555] rounded-xl px-3 py-2 text-sm text-[#eeeef8] outline-none transition-colors mb-3 placeholder-[#55556a]" />
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {filtered.map(part => (
                  <PartCard key={part.id} part={part}
                    selected={selected[part.type].some(s => s.id === part.id)}
                    disabled={part.available_stock === 0 || (selected[part.type].length >= 3 && !selected[part.type].some(s => s.id === part.id))}
                    onClick={() => togglePart(part)} />
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="col-span-3 text-center py-12 text-[#55556a] font-orbitron text-[10px] tracking-[2px]">
                  NO PARTS FOUND
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
