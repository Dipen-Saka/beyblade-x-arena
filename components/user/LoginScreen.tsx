"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "admin" | "otp" | "otp-sent";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const adminLogin = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.replace("/admin");
  };

  const sendOtp = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setMode("otp-sent");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#f0b429 1px,transparent 1px),linear-gradient(90deg,#f0b429 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-[#0f0f1a] border border-[#2a2a42] rounded-2xl p-8 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-orbitron text-2xl font-black text-[#f0b429] tracking-[4px] mb-1">
            ⚡ BEY-X
          </div>
          <div className="font-orbitron text-[9px] tracking-[4px] text-[#55556a]">
            TOURNAMENT ARENA
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── ADMIN LOGIN ── */}
          {mode === "admin" && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">EMAIL</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@arena.gg"
                className="w-full bg-[#161625] border border-[#2a2a42] focus:border-[#f0b429] rounded-lg px-3 py-2.5 text-sm text-[#eeeef8] outline-none transition-colors mb-3"
              />
              <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">PASSWORD</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && adminLogin()}
                className="w-full bg-[#161625] border border-[#2a2a42] focus:border-[#f0b429] rounded-lg px-3 py-2.5 text-sm text-[#eeeef8] outline-none transition-colors mb-4"
              />
              {error && <p className="text-[#f87171] text-xs mb-3">{error}</p>}
              <button onClick={adminLogin} disabled={loading}
                className="w-full bg-[#f0b429] text-black font-orbitron text-[11px] font-black tracking-[2px] rounded-lg py-3 hover:bg-[#f5c842] transition-colors disabled:opacity-50">
                {loading ? "AUTHENTICATING..." : "ENTER AS ADMIN"}
              </button>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-[#2a2a42]" />
                <span className="text-[#55556a] text-xs">or</span>
                <div className="flex-1 h-px bg-[#2a2a42]" />
              </div>
              <button onClick={() => { setMode("otp"); setError(""); }}
                className="w-full bg-[#161625] border border-[#2a2a42] text-[#9898b8] font-orbitron text-[10px] tracking-[1.5px] rounded-lg py-2.5 hover:border-[#353555] hover:text-[#eeeef8] transition-all">
                PLAYER — EMAIL OTP LOGIN
              </button>
            </motion.div>
          )}

          {/* ── OTP REQUEST ── */}
          {mode === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/25 rounded-lg p-3 mb-5 text-[11px] text-[#60a5fa] leading-relaxed">
                📧 Enter your email — Supabase will send a one-time login link. No password needed.
              </div>
              <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">YOUR EMAIL</label>
              <input
                type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)}
                placeholder="blader@arena.gg"
                onKeyDown={e => e.key === "Enter" && sendOtp()}
                className="w-full bg-[#161625] border border-[#2a2a42] focus:border-[#3b82f6] rounded-lg px-3 py-2.5 text-sm text-[#eeeef8] outline-none transition-colors mb-4"
              />
              {error && <p className="text-[#f87171] text-xs mb-3">{error}</p>}
              <button onClick={sendOtp} disabled={loading}
                className="w-full bg-[#3b82f6] text-white font-orbitron text-[11px] font-black tracking-[2px] rounded-lg py-3 hover:bg-[#60a5fa] transition-colors disabled:opacity-50">
                {loading ? "SENDING..." : "SEND LOGIN LINK"}
              </button>
              <button onClick={() => { setMode("admin"); setError(""); }}
                className="w-full mt-3 text-[#55556a] text-[11px] font-orbitron tracking-wider hover:text-[#9898b8] transition-colors">
                ← Back to Admin Login
              </button>
            </motion.div>
          )}

          {/* ── OTP SENT ── */}
          {mode === "otp-sent" && (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <div className="font-orbitron text-[#22c55e] text-sm tracking-wider mb-2">LINK SENT!</div>
              <p className="text-[#9898b8] text-[11px] leading-relaxed">
                Check your inbox at<br />
                <span className="text-[#eeeef8] font-semibold">{otpEmail}</span><br />
                and click the login link.
              </p>
              <button onClick={() => setMode("otp")}
                className="mt-5 text-[#55556a] text-[10px] font-orbitron tracking-wider hover:text-[#9898b8] transition-colors">
                ← Try a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
