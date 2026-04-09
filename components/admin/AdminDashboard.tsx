"use client";
import { Part } from "@/lib/types";
import Topbar from "@/components/ui/Topbar";
import TypeBadge from "@/components/ui/TypeBadge";

interface Props {
  parts: Part[];
  totalStock: number;
  totalAvail: number;
  activeRentals: number;
}

export default function AdminDashboard({ parts, totalStock, totalAvail, activeRentals }: Props) {
  const rented = totalStock - totalAvail;
  const availPct = totalStock ? Math.round((totalAvail / totalStock) * 100) : 0;
  const rentedPct = totalStock ? Math.round((rented / totalStock) * 100) : 0;

  const byType = (type: string) => parts.filter(p => p.type === type);
  const typeStats = ["blade", "ratchet", "bit"].map(type => {
    const ps = byType(type);
    const tot = ps.reduce((s, p) => s + p.total_stock, 0);
    const av  = ps.reduce((s, p) => s + p.available_stock, 0);
    return { type, tot, av, rented: tot - av, pct: tot ? Math.round((av / tot) * 100) : 0 };
  });

  const STAT_CARDS = [
    { label: "TOTAL PARTS",   val: totalStock,     color: "text-[#f5c842]", barColor: "bg-[#f0b429]", pct: 100 },
    { label: "AVAILABLE",     val: totalAvail,     color: "text-[#22c55e]", barColor: "bg-[#22c55e]", pct: availPct },
    { label: "RENTED OUT",    val: rented,         color: "text-[#f87171]", barColor: "bg-[#ef4444]", pct: rentedPct },
    { label: "ACTIVE BEYS",   val: activeRentals,  color: "text-[#60a5fa]", barColor: "bg-[#3b82f6]", pct: Math.min(100, activeRentals * 20) },
  ];

  const TYPE_COLOR: Record<string, string> = {
    blade: "text-[#f5c842]", ratchet: "text-[#60a5fa]", bit: "text-[#f87171]",
  };
  const BAR_COLOR: Record<string, string> = {
    blade: "bg-[#f0b429]", ratchet: "bg-[#3b82f6]", bit: "bg-[#ef4444]",
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="DASHBOARD" userLabel="Admin" roleLabel="ADMIN" />
      <div className="flex-1 overflow-y-auto p-5">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="bg-[#161625] border border-[#2a2a42] rounded-xl p-4">
              <div className="font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-2">{s.label}</div>
              <div className={`font-orbitron text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="bg-[#252538] rounded-full h-1 mt-3 overflow-hidden">
                <div className={`h-full rounded-full ${s.barColor}`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Per type breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {typeStats.map(s => (
            <div key={s.type} className="bg-[#161625] border border-[#2a2a42] rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <span className={`font-orbitron text-[10px] tracking-[1.5px] ${TYPE_COLOR[s.type]}`}>
                  {s.type.toUpperCase()}S
                </span>
                <TypeBadge type={s.type as any} />
              </div>
              {[["Total", s.tot, TYPE_COLOR[s.type]], ["Available", s.av, "text-[#22c55e]"], ["Rented", s.rented, "text-[#f87171]"]].map(([lbl, val, col]) => (
                <div key={lbl as string} className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-[#55556a]">{lbl}</span>
                  <span className={`font-orbitron ${col}`}>{val}</span>
                </div>
              ))}
              <div className="bg-[#252538] rounded-full h-1 mt-3 overflow-hidden">
                <div className={`h-full rounded-full ${BAR_COLOR[s.type]}`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Low stock alert */}
        {parts.filter(p => p.available_stock === 0).length > 0 && (
          <div className="bg-[#ef4444]/08 border border-[#ef4444]/25 rounded-xl p-4 mb-5">
            <div className="font-orbitron text-[10px] tracking-[2px] text-[#f87171] mb-2">⚠ OUT OF STOCK</div>
            <div className="flex flex-wrap gap-2">
              {parts.filter(p => p.available_stock === 0).map(p => (
                <span key={p.id} className="bg-[#1e1e30] border border-[#2a2a42] rounded px-2 py-1 text-[11px] text-[#9898b8]">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick parts list */}
        <div>
          <div className="font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-3">ALL PARTS OVERVIEW</div>
          <div className="bg-[#161625] border border-[#2a2a42] rounded-xl overflow-hidden">
            {parts.map((p, i) => {
              const pct = p.total_stock ? Math.round((p.available_stock / p.total_stock) * 100) : 0;
              const barColor = p.available_stock === 0 ? "bg-[#ef4444]" : p.available_stock < p.total_stock ? "bg-[#f0b429]" : "bg-[#22c55e]";
              return (
                <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < parts.length - 1 ? "border-b border-[#2a2a42]/50" : ""}`}>
                  <TypeBadge type={p.type} />
                  <span className="flex-1 text-[12px] font-semibold text-[#eeeef8]">{p.name}</span>
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 bg-[#252538] rounded-full h-1 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-orbitron text-[10px] text-[#9898b8] w-10 text-right">
                      {p.available_stock}/{p.total_stock}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
