"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "admin" | "otp-email" | "otp-verify";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
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
    if (!otpEmail.trim()) { setError("Please enter your email"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setLoading(false);
    setMode("otp-verify");
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) { setError("Enter the 6-digit code from your email"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail.trim(),
      token: otpCode.trim(),
      type: "email",
    });
    if (error) { setError(error.message); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Login failed. Try again."); setLoading(false); return; }
    const { data: rental } = await supabase
      .from("rentals").select("id")
      .eq("user_id", user.id).eq("status", "active").maybeSingle();
    router.replace(rental ? "/profile" : "/assembly");
  };

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#f0b429 1px,transparent 1px),linear-gradient(90deg,#f0b429 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-[#0f0f1a] border border-[#2a2a42] rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-orbitron text-2xl font-black text-[#f0b429] tracking-[4px] mb-1">⚡ BEY-X</div>
          <div className="font-orbitron text-[9px] tracking-[4px] text-[#55556a]">TOURNAMENT ARENA</div>
        </div>
        <AnimatePresence mode="wait">
          {mode === "admin" && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@arena.gg"
                className="w-full bg-[#161625] border border-[#2a2a42] focus:border-[#f0b429] rounded-lg px-3 py-2.5 text-sm text-[#eeeef8] outline-none transition-colors mb-3" />
              <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && adminLogin()}
                className="w-full bg-[#161625] border border-[#2a2a42] focus:border-[#f0b429] rounded-lg px-3 py-2.5 text-sm text-[#eeeef8] outline-none transition-colors mb-4" />
              {error && <p className="text-[#f87171] text-xs mb-3">{error}</p>}
              <button onClick={adminLogin} disabled={loading}
                className="w-full bg-[#f0b429] text-black font-orbitron text-[11px] font-black tracking-[2px] rounded-lg py-3 hover:bg-[#f5c842] transition-colors disabled:opacity-50">
                {loading ? "AUTHENTICATING..." : "ENTER AS ADMIN"}
              </button>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-[#2a2a42]" /><span className="text-[#55556a] text-xs">or</span><div className="flex-1 h-px bg-[#2a2a42]" />
              </div>
              <button onClick={() => { setMode("otp-email"); setError(""); }}
                className="w-full bg-[#161625] border border-[#2a2a42] text-[#9898b8] font-orbitron text-[10px] tracking-[1.5px] rounded-lg py-2.5 hover:border-[#353555] hover:text-[#eeeef8] transition-all">
                PLAYER — EMAIL OTP LOGIN
              </button>
            </motion.div>
          )}
          {mode === "otp-email" && (
            <motion.div key="otp-email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/25 rounded-lg p-3 mb-5 text-[11px] text-[#60a5fa] leading-relaxed">
                📧 Enter your email — we'll send a <strong>6-digit code</strong>. No redirects.
              </div>
              <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">YOUR EMAIL</label>
              <input type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)}
                placeholder="blader@arena.gg" onKeyDown={e => e.key === "Enter" && sendOtp()} autoFocus
                className="w-full bg-[#161625] border border-[#2a2a42] focus:border-[#3b82f6] rounded-lg px-3 py-2.5 text-sm text-[#eeeef8] outline-none transition-colors mb-4" />
              {error && <p className="text-[#f87171] text-xs mb-3">{error}</p>}
              <button onClick={sendOtp} disabled={loading}
                className="w-full bg-[#3b82f6] text-white font-orbitron text-[11px] font-black tracking-[2px] rounded-lg py-3 hover:bg-[#60a5fa] transition-colors disabled:opacity-50">
                {loading ? "SENDING CODE..." : "SEND 6-DIGIT CODE"}
              </button>
              <button onClick={() => { setMode("admin"); setError(""); }}
                className="w-full mt-3 text-[#55556a] text-[11px] font-orbitron tracking-wider hover:text-[#9898b8] transition-colors">
                ← Back to Admin Login
              </button>
            </motion.div>
          )}
          {mode === "otp-verify" && (
            <motion.div key="otp-verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-5">
                <div className="text-3xl mb-2">📬</div>
                <div className="font-orbitron text-[10px] tracking-[2px] text-[#22c55e] mb-1">CODE SENT!</div>
                <div className="text-[11px] text-[#55556a]">Check your inbox at</div>
                <div className="text-[12px] text-[#eeeef8] font-semibold mt-0.5">{otpEmail}</div>
              </div>
              <label className="block font-orbitron text-[9px] tracking-[2px] text-[#55556a] mb-1.5">ENTER 6-DIGIT CODE</label>
              <input type="text" value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456" maxLength={6} autoFocus
                onKeyDown={e => e.key === "Enter" && verifyOtp()}
                className="w-full bg-[#161625] border border-[#2a2a42] focus:border-[#22c55e] rounded-lg px-3 py-3 text-xl text-[#eeeef8] outline-none transition-colors mb-4 text-center tracking-[0.5em] font-orbitron" />
              {error && <p className="text-[#f87171] text-xs mb-3 text-center">{error}</p>}
              <button onClick={verifyOtp} disabled={loading || otpCode.length !== 6}
                className="w-full bg-[#22c55e] text-black font-orbitron text-[11px] font-black tracking-[2px] rounded-lg py-3 hover:bg-[#4ade80] transition-colors disabled:opacity-40">
                {loading ? "VERIFYING..." : "ENTER ARENA →"}
              </button>
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => { setMode("otp-email"); setError(""); setOtpCode(""); }}
                  className="text-[#55556a] text-[10px] font-orbitron hover:text-[#9898b8] transition-colors">
                  ← Change email
                </button>
                <button onClick={sendOtp} disabled={loading}
                  className="text-[#3b82f6] text-[10px] font-orbitron hover:text-[#60a5fa] transition-colors disabled:opacity-50">
                  Resend code
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
