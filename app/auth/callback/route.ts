import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (isAdmin) return NextResponse.redirect(`${origin}/admin`);

      const { data: rental } = await supabase
        .from("rentals")
        .select("id")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();

      return NextResponse.redirect(`${origin}${rental ? "/profile" : "/assembly"}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
