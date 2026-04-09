import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssemblyUI from "@/components/user/AssemblyUI";

export default async function AssemblyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // If already has active rental, go to profile
  const { data: rental } = await supabase
    .from("rentals")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (rental) redirect("/profile");

  const { data: parts } = await supabase
    .from("parts")
    .select("*")
    .gt("available_stock", 0)
    .order("type")
    .order("name");

  return <AssemblyUI parts={parts || []} userId={user.id} userEmail={user.email!} />;
}
