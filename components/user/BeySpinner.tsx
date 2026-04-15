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

// ── Colour helpers ────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function shade(hex: string, amt: number, alpha = 1): string {
  if (!hex.startsWith("#")) return hex;
  const [r, g, b] = hexToRgb(hex);
  const clamp = (v: number) => Math.max(0, Math.min(255, v + amt));
  return `rgba(${clamp(r)},${clamp(g)},${clamp(b)},${alpha})`;
}
function lighten(hex: string, amt: number, alpha = 1): string {
  return shade(hex, amt, alpha);
}

export default function BeySpinner({ blade, ratchet, bit, size = 200, spinning = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef  = useRef(0);
  const rafRef    = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const B  = blade   ? "#f0b429" : "#3a3a3a";
    const R  = ratchet ? "#3b82f6" : "#2a2a2a";
    const BT = bit     ? "#ef4444" : "#2a2a2a";

    const cx = size / 2;
    const cy = size / 2;
    const TILT = 0.36; // vertical squeeze for perspective

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const a = angleRef.current;

      // ── Ground shadow ─────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + size * 0.30, size * 0.16, size * 0.035, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fill();
      ctx.restore();

      // ── BIT (spinning tip at bottom) ──────────────────────
      const tipBaseY = cy + size * 0.14;
      const tipY     = cy + size * 0.32;
      const tipX     = cx + Math.sin(a * 2) * size * 0.006; // tiny wobble

      ctx.save();
      // halo
      const bHalo = ctx.createRadialGradient(tipX, tipBaseY, 0, tipX, tipBaseY, size * 0.09);
      bHalo.addColorStop(0, shade(BT, 0, 0.25));
      bHalo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bHalo;
      ctx.beginPath();
      ctx.arc(tipX, tipBaseY, size * 0.09, 0, Math.PI * 2);
      ctx.fill();
      // cone
      ctx.beginPath();
      ctx.moveTo(tipX - size * 0.04, tipBaseY);
      ctx.lineTo(tipX + size * 0.04, tipBaseY);
      ctx.lineTo(tipX + size * 0.01, tipY);
      ctx.lineTo(tipX, tipY + size * 0.025);
      ctx.lineTo(tipX - size * 0.01, tipY);
      ctx.closePath();
      const coneG = ctx.createLinearGradient(tipX - size * 0.04, 0, tipX + size * 0.04, 0);
      coneG.addColorStop(0, shade(BT, -50));
      coneG.addColorStop(0.45, BT);
      coneG.addColorStop(1, shade(BT, -70));
      ctx.fillStyle = coneG;
      ctx.fill();
      ctx.restore();

      // ── RATCHET (middle tilted ring) ──────────────────────
      const rY  = cy + size * 0.05;
      const rRx = size * 0.17;
      const rRy = rRx * TILT;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, rY, rRx, rRy, 0, 0, Math.PI * 2);
      const rG = ctx.createRadialGradient(cx - size * 0.04, rY - size * 0.01, 0, cx, rY, rRx);
      rG.addColorStop(0, lighten(R, 70));
      rG.addColorStop(0.5, R);
      rG.addColorStop(1, shade(R, -50));
      ctx.fillStyle = rG;
      ctx.fill();
      ctx.strokeStyle = lighten(R, 30);
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // teeth
      const teeth = ratchet?.name?.includes("3") ? 3 : ratchet?.name?.includes("5") ? 5 : 4;
      for (let i = 0; i < teeth; i++) {
        const ta = a + (i / teeth) * Math.PI * 2;
        const tx = cx + Math.cos(ta) * rRx;
        const ty = rY  + Math.sin(ta) * rRy;
        const nx = cx + Math.cos(ta) * (rRx + size * 0.034);
        const ny = rY  + Math.sin(ta) * (rRy + size * 0.034 * TILT);
        const ta2 = ta + 0.42;
        const tx2 = cx + Math.cos(ta2) * rRx;
        const ty2 = rY  + Math.sin(ta2) * rRy;
        const nx2 = cx + Math.cos(ta2) * (rRx + size * 0.025);
        const ny2 = rY  + Math.sin(ta2) * (rRy + size * 0.025 * TILT);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(nx, ny - size * 0.008);
        ctx.lineTo(nx2, ny2);
        ctx.lineTo(tx2, ty2);
        ctx.closePath();
        ctx.fillStyle = lighten(R, 25);
        ctx.fill();
      }
      ctx.restore();

      // ── BLADE (top tilted disc) ───────────────────────────
      const bY  = cy - size * 0.07;
      const bRx = size * 0.29;
      const bRy = bRx * TILT;

      ctx.save();
      // disc base
      ctx.beginPath();
      ctx.ellipse(cx, bY, bRx, bRy, 0, 0, Math.PI * 2);
      const dG = ctx.createRadialGradient(cx - size * 0.05, bY - size * 0.015, 0, cx, bY, bRx);
      dG.addColorStop(0, lighten(B, 90));
      dG.addColorStop(0.3, lighten(B, 30));
      dG.addColorStop(0.7, B);
      dG.addColorStop(1, shade(B, -60));
      ctx.fillStyle = dG;
      ctx.fill();

      // 4 swept wings
      for (let i = 0; i < 4; i++) {
        const wa  = a + (i / 4) * Math.PI * 2;
        const wa2 = wa + 0.52;
        const p = (angle: number, r: number) => ({
          x: cx + Math.cos(angle) * bRx * r,
          y: bY  + Math.sin(angle) * bRy * r,
        });
        const p1 = p(wa,  0.55);
        const p2 = p(wa,  1.0);
        const p3 = p(wa2, 0.80);
        const p4 = p(wa2, 0.44);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(
          (p2.x + p3.x) / 2, (p2.y + p3.y) / 2 - size * 0.008,
          p3.x, p3.y
        );
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        const wG = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        wG.addColorStop(0, shade(B,  0, 0.85));
        wG.addColorStop(0.5, lighten(B, 40, 0.65));
        wG.addColorStop(1, shade(B, 0, 0.12));
        ctx.fillStyle = wG;
        ctx.fill();
        ctx.strokeStyle = lighten(B, 20, 0.3);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // centre hub
      ctx.beginPath();
      ctx.ellipse(cx, bY, size * 0.056, size * 0.056 * TILT * 1.5, 0, 0, Math.PI * 2);
      const hG = ctx.createRadialGradient(cx - size * 0.012, bY - size * 0.006, 0, cx, bY, size * 0.056);
      hG.addColorStop(0, "#ffffff");
      hG.addColorStop(0.4, lighten(B, 80));
      hG.addColorStop(1, B);
      ctx.fillStyle = hG;
      ctx.fill();
      ctx.restore();

      // top specular highlight arc
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, bY - bRy * 0.18, bRx * 0.8, bRy * 0.28, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = size * 0.011;
      ctx.stroke();
      ctx.restore();

      // motion blur trails
      if (spinning && (blade || ratchet || bit)) {
        ctx.save();
        for (let i = 1; i <= 4; i++) {
          const ta = a - i * 0.18;
          const tx = cx + Math.cos(ta) * bRx * 0.78;
          const ty = bY  + Math.sin(ta) * bRy * 0.78;
          ctx.beginPath();
          ctx.arc(tx, ty, size * (0.022 - i * 0.004), 0, Math.PI * 2);
          ctx.fillStyle = shade(B, 0, 0.07 - i * 0.014);
          ctx.fill();
        }
        ctx.restore();
      }

      if (spinning) {
        angleRef.current += 0.052;
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
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {allSelected && (
          <div className="absolute inset-0 pointer-events-none rounded-full"
            style={{ background: "radial-gradient(circle at 50% 60%, rgba(240,180,41,0.09) 0%, transparent 68%)" }} />
        )}
        <canvas ref={canvasRef} width={size} height={size} />
      </div>
      {allSelected && (
        <div className="font-orbitron text-[8px] tracking-[3px] text-[#f0b429] opacity-70 animate-pulse">
          ⚡ BEY ASSEMBLED
        </div>
      )}
    </div>
  );
}
