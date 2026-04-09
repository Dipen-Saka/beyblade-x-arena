"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin",           label: "Dashboard",  icon: "◈" },
  { href: "/admin/inventory", label: "Inventory",  icon: "◉" },
  { href: "/admin/rentals",   label: "Rentals",    icon: "⊛" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <div className="w-[200px] flex-shrink-0 bg-[#0f0f1a] border-r border-[#2a2a42] flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2a2a42]">
        <div className="font-orbitron text-[14px] font-black text-[#f0b429] tracking-[3px]">⚡ BEY-X</div>
        <div className="font-orbitron text-[8px] text-[#55556a] tracking-[3px] mt-1">ARENA SYSTEM</div>
      </div>

      <div className="px-3 py-2">
        <div className="font-orbitron text-[8px] tracking-[2px] text-[#55556a] px-3 py-3">ADMIN</div>
        {LINKS.map(link => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-semibold tracking-wide transition-all mb-0.5
                ${active
                  ? "bg-[#f0b429]/10 text-[#f0b429] border-l-2 border-[#f0b429]"
                  : "text-[#9898b8] hover:text-[#eeeef8] hover:bg-[#161625]"
                }`}
            >
              <span className="text-[14px]">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1" />
      <div className="border-t border-[#2a2a42] p-3">
        <button onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-lg text-[12px] font-semibold text-[#55556a] hover:text-[#9898b8] hover:bg-[#161625] transition-all">
          <span className="text-[14px]">⊘</span>
          Logout
        </button>
      </div>
    </div>
  );
}
