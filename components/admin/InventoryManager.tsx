"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Part, PartType } from "@/lib/types";
import PartImage from "@/components/ui/PartImage";
import TypeBadge from "@/components/ui/TypeBadge";
import Topbar from "@/components/ui/Topbar";

interface Props { initialParts: Part[]; }

const EMPTY: Omit<Part, "id" | "created_at"> = {
  name: "", type: "blade", image_url: null, total_stock: 3, available_stock: 3,
};

export default function InventoryManager({ initialParts }: Props) {
  const supabase = createClient();
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [filter, setFilter] = useState<PartType | "all">("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Omit<Part, "id" | "created_at">>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notification, setNotification] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const filtered = filter === "all" ? parts : parts.filter(p => p.type === filter);

  const openAdd = () => {
    setForm({ ...EMPTY }); setEditId(null); setImagePreview(null); setModal("add");
  };
  const openEdit = (p: Part) => {
    setForm({ name: p.name, type: p.type, image_url: p.image_url, total_stock: p.total_stock, available_stock: p.available_stock });
    setImagePreview(p.image_url);
    setEditId(p.id);
    setModal("edit");
  };
  const closeModal = () => { setModal(null); setImagePreview(null); };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `parts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage.from("part-images").upload(fileName, file, { upsert: true });
    if (error) { notify("Upload failed: " + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("part-images").getPublicUrl(data.path);
    setForm(f => ({ ...f, image_url: publicUrl }));
    setImagePreview(publicUrl);
    setUploading(false);
    notify("Image uploaded ✓");
  };

  const savePart = async () => {
    if (!form.name.trim()) { notify("Part name is required"); return; }
    setSaving(true);
    if (modal === "add") {
      const { data, error } = await supabase.from("parts").insert(form).select().single();
      if (error) { notify("Error: " + error.message); setSaving(false); return; }
      setParts(p => [...p, data]);
      notify("Part added — " + form.name);
    } else if (editId) {
      const { data, error } = await supabase.from("parts").update(form).eq("id", editId).select().single();
      if (error) { notify("Error: " + error.message); setSaving(false); return; }
      setParts(p => p.map(x => x.id === editId ? data : x));
      notify("Updated — " + form.name);
    }
    setSaving(false);
    closeModal();
  };

  const deletePart = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("parts").delete().eq("id", id);
    if (error) { notify("Error: " + error.message); return; }
    setParts(p => p.filter(x => x.id !== id));
    notify("Deleted — " + name);
  };

  const FILTER_STYLE: Record<string, string> = {
    all:     "border-[#353555] bg-[#161625] text-[#eeeef8]",
    blade:   "border-[#f0b429]/40 bg-[#f0b429]/10 text-[#f5c842]",
    ratchet: "border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#60a5fa]",
    bit:     "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#f87171]",
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="INVENTORY" userLabel="Admin" roleLabel="ADMIN" />

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-16 right-5 z-50 bg-[#161625] border border-[#22c55e] text-[#4ade80] text-[12px] font-semibold px-4 py-2.5 rounded-xl">
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {(["all", "blade", "ratchet", "bit"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`font-orbitron text-[9px] tracking-wider px-3 py-1.5 rounded-full border transition-all ${filter === f ? FILTER_STYLE[f] : "border-[#2a2a42] text-[#55556a] hover:text-[#9898b8]"}`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={openAdd}
            className="bg-[#f0b429]/10 border border-[#f0b429]/30 text-[#f5c842] font-orbitron text-[10px] tracking-[1px] px-4 py-2 rounded-lg hover:bg-[#f0b429]/20 transition-all">
            + ADD PART
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#161625] border border-[#2a2a42] rounded-xl overflow-hidden">
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-[#2a2a42]">
                {["PART", "TYPE", "STOCK", "AVAILABLE", "ACTIONS"].map((h, i) => (
                  <th key={h} className="font-orbitron text-[9px] tracking-[1.5px] text-[#55556a] text-left px-4 py-3 font-medium"
                    style={{ width: ["36%","14%","12%","22%","16%"][i] }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const pct = p.total_stock ? Math.round((p.available_stock / p.total_stock) * 100) : 0;
                const avColor = p.available_stock === 0 ? "text-[#f87171]" : p.available_stock < p.total_stock ? "text-[#f5c842]" : "text-[#22c55e]";
                const barColor = p.available_stock === 0 ? "bg-[#ef4444]" : p.available_stock < p.total_stock ? "bg-[#f0b429]" : "bg-[#22c55e]";
                return (
                  <tr key={p.id} className={`border-b border-[#2a2a42]/50 hover:bg-[#1e1e30]/50 transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PartImage src={p.image_url} name={p.name} type={p.type} size={36} />
                        <span className="text-[12px] font-bold text-[#eeeef8] truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                    <td className="px-4 py-3 font-orbitron text-[12px] text-[#9898b8]">{p.total_stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-orbitron text-[12px] ${avColor}`}>{p.available_stock}</span>
                        <div className="flex-1 bg-[#252538] rounded-full h-1 overflow-hidden max-w-[60px]">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)}
                          className="text-[10px] border border-[#2a2a42] text-[#9898b8] hover:text-[#60a5fa] hover:border-[#3b82f6] px-2.5 py-1 rounded transition-all font-semibold">
                          Edit
                        </button>
                        <button onClick={() => deletePart(p.id, p.name)}
                          className="text-[10px] border border-[#2a2a42] text-[#9898b8] hover:text-[#f87171] hover:border-[#ef4444] px-2.5 py-1 rounded transition-all font-semibold">
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 font-orbitron text-[10px] tracking-[2px] text-[#55556a]">NO PARTS FOUND</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#161625] border border-[#353555] rounded-2xl p-6 w-full max-w-md">
              <div className="font-orbitron text-[13px] text-[#f0b429] tracking-[1px] mb-5">
                {modal === "add" ? "ADD PART" : "EDIT PART"}
              </div>

              {/* Image upload */}
              <div className="mb-4">
                <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-2">PART IMAGE</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[#2a2a42] rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer hover:border-[#353555] transition-colors"
                >
                  {imagePreview ? (
                    <div className="relative w-full flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="preview" className="h-28 object-contain rounded-lg" />
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-[#1e1e30] border border-[#2a2a42] flex items-center justify-center text-[#55556a] text-xl">↑</div>
                      <div className="text-center">
                        <div className="text-[11px] text-[#9898b8] font-semibold">Click to upload image</div>
                        <div className="text-[10px] text-[#55556a] mt-0.5">PNG, SVG, JPG — transparent BG recommended</div>
                      </div>
                    </>
                  )}
                  {uploading && <div className="font-orbitron text-[10px] text-[#f0b429] tracking-wider animate-pulse">UPLOADING...</div>}
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

                {/* Or paste URL */}
                <div className="mt-2">
                  <label className="block font-orbitron text-[8px] tracking-[2px] text-[#55556a] mb-1.5">OR PASTE IMAGE URL</label>
                  <input value={form.image_url || ""} onChange={e => { setForm(f => ({ ...f, image_url: e.target.value || null })); setImagePreview(e.target.value || null); }}
                    placeholder="https://..."
                    className="w-full bg-[#1e1e30] border border-[#2a2a42] focus:border-[#f0b429] rounded-lg px-3 py-2 text-[12px] text-[#eeeef8] outline-none transition-colors" />
                </div>
              </div>

              {/* Name */}
              <div className="mb-3">
                <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">PART NAME</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Dran Sword"
                  className="w-full bg-[#1e1e30] border border-[#2a2a42] focus:border-[#f0b429] rounded-lg px-3 py-2.5 text-[13px] text-[#eeeef8] outline-none transition-colors" />
              </div>

              {/* Type */}
              <div className="mb-3">
                <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">TYPE</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PartType }))}
                  className="w-full bg-[#1e1e30] border border-[#2a2a42] focus:border-[#f0b429] rounded-lg px-3 py-2.5 text-[13px] text-[#eeeef8] outline-none transition-colors">
                  <option value="blade">Blade</option>
                  <option value="ratchet">Ratchet</option>
                  <option value="bit">Bit</option>
                </select>
              </div>

              {/* Stock */}
              <div className="mb-5">
                <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">TOTAL STOCK</label>
                <input type="number" min={1} max={50} value={form.total_stock}
                  onChange={e => { const v = parseInt(e.target.value)||1; setForm(f => ({ ...f, total_stock: v, available_stock: modal==="add"?v:Math.min(f.available_stock,v) })); }}
                  className="w-full bg-[#1e1e30] border border-[#2a2a42] focus:border-[#f0b429] rounded-lg px-3 py-2.5 text-[13px] text-[#eeeef8] outline-none transition-colors" />
              </div>

              <div className="flex gap-3">
                <button onClick={closeModal}
                  className="flex-1 bg-[#1e1e30] border border-[#2a2a42] text-[#9898b8] font-orbitron text-[10px] tracking-[1px] rounded-xl py-3 hover:text-[#eeeef8] transition-all">
                  CANCEL
                </button>
                <button onClick={savePart} disabled={saving || uploading}
                  className="flex-1 bg-[#f0b429] text-black font-orbitron text-[10px] tracking-[1px] rounded-xl py-3 font-black hover:bg-[#f5c842] transition-all disabled:opacity-50">
                  {saving ? "SAVING..." : "SAVE PART"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
