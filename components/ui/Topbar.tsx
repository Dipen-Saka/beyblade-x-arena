"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface TopbarProps {
  title: string;
  userLabel: string;
  roleLabel: string;
}

export default function Topbar({ title, userLabel, roleLabel }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <div className="h-[52px] flex-shrink-0 bg-[#0f0f1a] border-b border-[#2a2a42] flex items-center justify-between px-5">
      <div className="font-orbitron text-[11px] tracking-[2px] text-[#eeeef8] font-bold">
        {title}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-orbitron text-[9px] tracking-[2px] text-[#55556a]">
          {roleLabel}
        </span>
        <div className="flex items-center gap-2 bg-[#161625] border border-[#2a2a42] rounded-lg px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />
          <span className="text-[11px] text-[#9898b8]">{userLabel}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-[10px] text-[#55556a] hover:text-[#9898b8] transition-colors font-orbitron tracking-wider"
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
}
