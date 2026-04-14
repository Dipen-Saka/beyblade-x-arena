"use client";
import { useEffect, useRef } from "react";
import { Part } from "@/lib/types";

interface Props {
  blade?: Part;
  ratchet?: Part;
  bit?: Part;
  size?: number;
  spinning?: boolean;
}

export default function BeySpinner({ blade, ratchet, bit, size = 200, spinning = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const angle = angleRef.current;

      // ── Shadow ──
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + size * 0.38, size * 0.22, size * 0.045, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // ── BIT (bottom tip) ──
      const bitColor = bit ? "#ef4444" : "#333";
      const bitGlow = bit ? "rgba(239,68,68,0.6)" : "rgba(80,80,80,0.3)";
      ctx.save();
      // Bit glow
      const bgrd = ctx.createRadialGradient(0, size * 0.28, 0, 0, size * 0.28, size * 0.12);
      bgrd.addColorStop(0, bitGlow);
      bgrd.addColorStop(1, "transparent");
      ctx.fillStyle = bgrd;
      ctx.beginPath();
      ctx.arc(0, size * 0.28, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      // Bit shape - pointed tip
      ctx.beginPath();
      ctx.moveTo(-size * 0.05, size * 0.18);
      ctx.lineTo(size * 0.05, size * 0.18);
      ctx.lineTo(size * 0.025, size * 0.38);
      ctx.lineTo(0, size * 0.42);
      ctx.lineTo(-size * 0.025, size * 0.38);
      ctx.closePath();
      const bitGrd = ctx.createLinearGradient(0, size * 0.18, 0, size * 0.42);
      bitGrd.addColorStop(0, bitColor);
      bitGrd.addColorStop(1, "#1a0000");
      ctx.fillStyle = bitGrd;
      ctx.fill();
      ctx.restore();

      // ── RATCHET (middle ring) ──
      const ratchetColor = ratchet ? "#3b82f6" : "#333";
      const ratchetGlow = ratchet ? "rgba(59,130,246,0.5)" : "rgba(80,80,80,0.2)";
      ctx.save();
      // Ratchet glow ring
      const rgrd = ctx.createRadialGradient(0, 0, size * 0.08, 0, 0, size * 0.22);
      rgrd.addColorStop(0, "transparent");
      rgrd.addColorStop(0.7, ratchetGlow);
      rgrd.addColorStop(1, "transparent");
      ctx.fillStyle = rgrd;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      // Ratchet teeth
      const teeth = ratchet?.name.includes("3") ? 3 : ratchet?.name.includes("5") ? 5 : 4;
      for (let i = 0; i < teeth; i++) {
        const ta = (i / teeth) * Math.PI * 2;
        ctx.save();
        ctx.rotate(ta);
        ctx.beginPath();
        ctx.moveTo(size * 0.08, -size * 0.03);
        ctx.lineTo(size * 0.18, -size * 0.025);
        ctx.lineTo(size * 0.2, 0);
        ctx.lineTo(size * 0.18, size * 0.025);
        ctx.lineTo(size * 0.08, size * 0.03);
        ctx.closePath();
        const tgrd = ctx.createLinearGradient(size * 0.08, 0, size * 0.2, 0);
        tgrd.addColorStop(0, ratchetColor);
        tgrd.addColorStop(1, "#001133");
        ctx.fillStyle = tgrd;
        ctx.fill();
        ctx.restore();
      }
      // Ratchet ring
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
      const ringGrd = ctx.createRadialGradient(0, -size * 0.03, 0, 0, 0, size * 0.1);
      ringGrd.addColorStop(0, "#4499ff");
      ringGrd.addColorStop(1, ratchetColor);
      ctx.fillStyle = ringGrd;
      ctx.fill();
      ctx.restore();

      // ── BLADE (top disc) ──
      const bladeColor = blade ? "#f0b429" : "#444";
      const bladeGlow = blade ? "rgba(240,180,41,0.5)" : "rgba(80,80,80,0.2)";
      ctx.save();
      // Blade outer glow
      const bGlow = ctx.createRadialGradient(0, -size * 0.05, 0, 0, -size * 0.05, size * 0.36);
      bGlow.addColorStop(0, "transparent");
      bGlow.addColorStop(0.75, bladeGlow);
      bGlow.addColorStop(1, "transparent");
      ctx.fillStyle = bGlow;
      ctx.beginPath();
      ctx.arc(0, -size * 0.05, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
      // Blade disc body
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.05, size * 0.28, size * 0.07, 0, 0, Math.PI * 2);
      const discGrd = ctx.createRadialGradient(0, -size * 0.08, 0, 0, -size * 0.05, size * 0.28);
      discGrd.addColorStop(0, "#ffe082");
      discGrd.addColorStop(0.5, bladeColor);
      discGrd.addColorStop(1, "#3d2800");
      ctx.fillStyle = discGrd;
      ctx.fill();
      // Blade wings
      const wings = 4;
      for (let i = 0; i < wings; i++) {
        const wa = (i / wings) * Math.PI * 2;
        ctx.save();
        ctx.rotate(wa);
        ctx.beginPath();
        ctx.moveTo(size * 0.08, -size * 0.02);
        ctx.bezierCurveTo(size * 0.18, -size * 0.06, size * 0.3, -size * 0.04, size * 0.28, 0);
        ctx.bezierCurveTo(size * 0.28, size * 0.02, size * 0.16, size * 0.04, size * 0.08, size * 0.02);
        ctx.closePath();
        const wGrd = ctx.createLinearGradient(size * 0.08, 0, size * 0.28, 0);
        wGrd.addColorStop(0, bladeColor);
        wGrd.addColorStop(1, "rgba(240,180,41,0.15)");
        ctx.fillStyle = wGrd;
        ctx.fill();
        ctx.restore();
      }
      // Center hub
      ctx.beginPath();
      ctx.arc(0, -size * 0.05, size * 0.065, 0, Math.PI * 2);
      const hubGrd = ctx.createRadialGradient(-size * 0.02, -size * 0.07, 0, 0, -size * 0.05, size * 0.065);
      hubGrd.addColorStop(0, "#fff8e1");
      hubGrd.addColorStop(1, bladeColor);
      ctx.fillStyle = hubGrd;
      ctx.fill();
      ctx.restore();

      // ── SPIN INDICATOR RING ──
      if (spinning && (blade || ratchet || bit)) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.33, 0, Math.PI * 1.7);
        ctx.strokeStyle = `rgba(240,180,41,${0.1 + Math.abs(Math.sin(angle * 3)) * 0.15})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      if (spinning) {
        angleRef.current += 0.04;
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    if (spinning) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      draw();
    }

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [blade, ratchet, bit, size, spinning]);

  const allSelected = blade && ratchet && bit;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {allSelected && (
          <div className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(240,180,41,0.08) 0%, transparent 70%)" }} />
        )}
        <canvas ref={canvasRef} width={size} height={size} className="relative z-10" />
      </div>
      {allSelected && (
        <div className="font-orbitron text-[8px] tracking-[3px] text-[#f0b429] opacity-60 animate-pulse">
          ⚡ BEY ASSEMBLED
        </div>
      )}
    </div>
  );
}
