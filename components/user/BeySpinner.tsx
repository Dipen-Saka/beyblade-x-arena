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

    // Colors
    const bladeColor  = blade   ? "#f0b429" : "#3a3a3a";
    const ratchetColor = ratchet ? "#3b82f6" : "#2a2a2a";
    const bitColor    = bit     ? "#ef4444" : "#2a2a2a";

    const cx = size / 2;
    const cy = size / 2;

    // Tilt: we use an ellipse ratio to fake a perspective tilt
    // The bey is viewed from ~30 degrees above
    const TILT = 0.38; // y-scale for perspective ellipses

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const a = angleRef.current;

      // ── Ground shadow ──
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + size * 0.31, size * 0.18 + Math.abs(Math.sin(a)) * 4, size * 0.04, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fill();
      ctx.restore();

      // ── BIT — bottom spinning tip ──
      // In tilted view the tip is below center
      const tipX = cx + Math.sin(a) * size * 0.018;
      const tipBaseY = cy + size * 0.16;
      const tipY = cy + size * 0.32;

      ctx.save();
      // Bit glow halo
      const bitHalo = ctx.createRadialGradient(tipX, tipBaseY, 0, tipX, tipBaseY, size * 0.1);
      bitHalo.addColorStop(0, bitColor === "#2a2a2a" ? "rgba(60,60,60,0.2)" : "rgba(239,68,68,0.3)");
      bitHalo.addColorStop(1, "transparent");
      ctx.fillStyle = bitHalo;
      ctx.beginPath();
      ctx.arc(tipX, tipBaseY, size * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Bit body (cone shape)
      ctx.beginPath();
      ctx.moveTo(tipX - size * 0.042, tipBaseY);
      ctx.lineTo(tipX + size * 0.042, tipBaseY);
      ctx.lineTo(tipX + size * 0.012, tipY);
      ctx.lineTo(tipX, tipY + size * 0.03);
      ctx.lineTo(tipX - size * 0.012, tipY);
      ctx.closePath();
      const bitGrd = ctx.createLinearGradient(tipX - size * 0.04, 0, tipX + size * 0.04, 0);
      bitGrd.addColorStop(0, shadeColor(bitColor, -40));
      bitGrd.addColorStop(0.4, bitColor);
      bitGrd.addColorStop(1, shadeColor(bitColor, -60));
      ctx.fillStyle = bitGrd;
      ctx.fill();
      ctx.restore();

      // ── RATCHET — middle ring, tilted ellipse ──
      const ratchetY = cy + size * 0.06;
      const ratchetRx = size * 0.18;
      const ratchetRy = ratchetRx * TILT;

      ctx.save();
      // Ratchet ring body (tilted disc)
      ctx.beginPath();
      ctx.ellipse(cx, ratchetY, ratchetRx, ratchetRy, 0, 0, Math.PI * 2);
      const rGrd = ctx.createRadialGradient(cx - size * 0.04, ratchetY - size * 0.01, 0, cx, ratchetY, ratchetRx);
      rGrd.addColorStop(0, lightenColor(ratchetColor, 60));
      rGrd.addColorStop(0.5, ratchetColor);
      rGrd.addColorStop(1, shadeColor(ratchetColor, -50));
      ctx.fillStyle = rGrd;
      ctx.fill();
      ctx.strokeStyle = lightenColor(ratchetColor, 30);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ratchet teeth on the tilted ring
      const teeth = ratchet?.name?.includes("3") ? 3 : ratchet?.name?.includes("5") ? 5 : 4;
      for (let i = 0; i < teeth; i++) {
        const ta = a + (i / teeth) * Math.PI * 2;
        const tx = cx + Math.cos(ta) * ratchetRx;
        const ty = ratchetY + Math.sin(ta) * ratchetRy;
        const nx = cx + Math.cos(ta) * (ratchetRx + size * 0.038);
        const ny = ratchetY + Math.sin(ta) * (ratchetRy + size * 0.038 * TILT);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(nx, ny - size * 0.012);
        ctx.lineTo(nx + Math.cos(ta + 0.4) * size * 0.02, ny + Math.sin(ta + 0.4) * size * 0.008);
        ctx.lineTo(tx + Math.cos(ta + 0.4) * size * 0.015, ty + Math.sin(ta + 0.4) * size * 0.006);
        ctx.closePath();
        ctx.fillStyle = lightenColor(ratchetColor, 20);
        ctx.fill();
      }
      ctx.restore();

      // ── BLADE — top disc, larger tilted ellipse ──
      const bladeY = cy - size * 0.06;
      const bladeRx = size * 0.3;
      const bladeRy = bladeRx * TILT;

      ctx.save();
      // Blade disc base
      ctx.beginPath();
      ctx.ellipse(cx, bladeY, bladeRx, bladeRy, 0, 0, Math.PI * 2);
      const bladeGrd = ctx.createRadialGradient(cx - size * 0.06, bladeY - size * 0.02, 0, cx, bladeY, bladeRx);
      bladeGrd.addColorStop(0, lightenColor(bladeColor, 80));
      bladeGrd.addColorStop(0.35, bladeColor);
      bladeGrd.addColorStop(0.75, shadeColor(bladeColor, -30));
      bladeGrd.addColorStop(1, shadeColor(bladeColor, -70));
      ctx.fillStyle = bladeGrd;
      ctx.fill();

      // Blade wings (4 swept wings rotating)
      const numWings = 4;
      for (let i = 0; i < numWings; i++) {
        const wa = a + (i / numWings) * Math.PI * 2;
        const wa2 = wa + 0.55;

        // Wing tip on the tilted ellipse
        const wx1 = cx + Math.cos(wa) * bladeRx * 0.55;
        const wy1 = bladeY + Math.sin(wa) * bladeRy * 0.55;
        const wx2 = cx + Math.cos(wa) * bladeRx;
        const wy2 = bladeY + Math.sin(wa) * bladeRy;
        const wx3 = cx + Math.cos(wa2) * bladeRx * 0.82;
        const wy3 = bladeY + Math.sin(wa2) * bladeRy * 0.82;
        const wx4 = cx + Math.cos(wa2) * bladeRx * 0.45;
        const wy4 = bladeY + Math.sin(wa2) * bladeRy * 0.45;

        ctx.beginPath();
        ctx.moveTo(wx1, wy1);
        ctx.quadraticCurveTo(wx2 + (wx3 - wx2) * 0.3, wy2 + (wy3 - wy2) * 0.3 - size * 0.01, wx3, wy3);
        ctx.lineTo(wx4, wy4);
        ctx.closePath();

        const wingGrd = ctx.createLinearGradient(wx1, wy1, wx2, wy2);
        wingGrd.addColorStop(0, bladeColor + "cc");
        wingGrd.addColorStop(0.6, lightenColor(bladeColor, 40) + "99");
        wingGrd.addColorStop(1, bladeColor + "22");
        ctx.fillStyle = wingGrd;
        ctx.fill();
        ctx.strokeStyle = lightenColor(bladeColor, 20) + "66";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Blade center hub
      ctx.beginPath();
      ctx.ellipse(cx, bladeY, size * 0.058, size * 0.058 * TILT * 1.4, 0, 0, Math.PI * 2);
      const hubGrd = ctx.createRadialGradient(cx - size * 0.015, bladeY - size * 0.008, 0, cx, bladeY, size * 0.058);
      hubGrd.addColorStop(0, "#ffffff");
      hubGrd.addColorStop(0.4, lightenColor(bladeColor, 80));
      hubGrd.addColorStop(1, bladeColor);
      ctx.fillStyle = hubGrd;
      ctx.fill();
      ctx.restore();

      // ── Edge highlight on blade ──
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, bladeY - bladeRy * 0.15, bladeRx * 0.85, bladeRy * 0.3, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = size * 0.012;
      ctx.stroke();
      ctx.restore();

      // ── Spin motion blur trails ──
      if (spinning && (blade || ratchet || bit)) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const ta = a - (i + 1) * 0.22;
          const trailX = cx + Math.cos(ta) * bladeRx * 0.85;
          const trailY = bladeY + Math.sin(ta) * bladeRy * 0.85;
          ctx.beginPath();
          ctx.arc(trailX, trailY, size * 0.018, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,180,41,${0.06 - i * 0.018})`;
          ctx.fill();
        }
        ctx.restore();
      }

      if (spinning) {
        angleRef.current += 0.055;
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

  // Helper color functions
  function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }
  function shadeColor(hex: string, amt: number) {
    if (hex.startsWith("rgba") || !hex.startsWith("#")) return hex;
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.max(0, Math.min(255, r + amt))},${Math.max(0, Math.min(255, g + amt))},${Math.max(0, Math.min(255, b + amt))})`;
  }
  function lightenColor(hex: string, amt: number) { return shadeColor(hex, amt); }

  const allSelected = blade && ratchet && bit;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {allSelected && (
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 60%, rgba(240,180,41,0.1) 0%, transparent 65%)` }} />
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

// Hoisted helpers so they work inside useEffect closure
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function shadeColor(hex: string, amt: number): string {
  if (!hex || !hex.startsWith("#")) return hex || "#333";
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.max(0, Math.min(255, r + amt))},${Math.max(0, Math.min(255, g + amt))},${Math.max(0, Math.min(255, b + amt))})`;
}
function lightenColor(hex: string, amt: number): string { return shadeColor(hex, amt); }
