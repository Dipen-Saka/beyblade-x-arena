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
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (isAdmin) { router.replace("/admin"); return; }
        // Check if player has active rental
        supabase
          .from("rentals")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()
          .then(({ data }) => {
            router.replace(data ? "/profile" : "/assembly");
          });
      } else {
        setChecking(false);
      }
    });
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
