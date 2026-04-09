import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileUI from "@/components/user/ProfileUI";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: rental } = await supabase
    .from("rentals")
    .select(`
      id, status, created_at,
      rental_items (
        id, part_id,
        parts ( id, name, type, image_url )
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!rental) redirect("/assembly");

  return <ProfileUI rental={rental} userEmail={user.email!} />;
}
