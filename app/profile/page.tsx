import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileUI from "@/components/user/ProfileUI";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: raw } = await supabase
    .from("rentals")
    .select(`
      id, status, created_at,
      rental_items (
        id, part_id,
        parts ( id, name, type, image_url, total_stock, available_stock, created_at )
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!raw) redirect("/assembly");

  const rental = {
    id: raw.id,
    status: raw.status,
    created_at: raw.created_at,
    rental_items: (raw.rental_items || []).map((item: any) => ({
      id: item.id,
      part_id: item.part_id,
      parts: Array.isArray(item.parts) ? item.parts[0] : item.parts,
    })),
  };

  return <ProfileUI rental={rental} userEmail={user.email!} />;
}
