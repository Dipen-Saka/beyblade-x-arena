"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LoginScreen from "@/components/user/LoginScreen";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) { setChecking(false); return; }

      // Check if session is older than 6 hours
      const SIX_HOURS = 6 * 60 * 60;
      const now = Math.floor(Date.now() / 1000);
      const sessionAge = now - (session.user.last_sign_in_at
        ? Math.floor(new Date(session.user.last_sign_in_at).getTime() / 1000)
        : 0);

      if (sessionAge > SIX_HOURS) {
        await supabase.auth.signOut();
        setChecking(false);
        return;
      }

      const user = session.user;
      const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (isAdmin) { router.replace("/admin"); return; }

      // Check active rental — keeps data consistent on re-login
      const { data: rental } = await supabase
        .from("rentals")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      router.replace(rental ? "/profile" : "/assembly");
    };

    check();

    // Listen for auth state changes (logout from other tabs, token expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        if (event === "SIGNED_OUT") setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#08080f]">
        <div className="font-orbitron text-[#f0b429] text-sm tracking-[4px] animate-pulse">
          LOADING ARENA...
        </div>
      </div>
    );
  }

  return <LoginScreen />;
}
