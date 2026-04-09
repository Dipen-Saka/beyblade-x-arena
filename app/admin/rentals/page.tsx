import { createClient } from "@/lib/supabase/server";
import RentalsManager from "@/components/admin/RentalsManager";

export default async function RentalsPage() {
  const supabase = createClient();

  const { data: rentals } = await supabase
    .from("rentals")
    .select(`
      id, status, created_at, user_id,
      rental_items (
        id, part_id,
        parts ( id, name, type, image_url )
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // fetch user emails separately via profiles table
  const userIds = (rentals || []).map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.email]));

  const enriched = (rentals || []).map((r) => ({
    ...r,
    user_email: profileMap[r.user_id] || "unknown",
  }));

  return <RentalsManager initialRentals={enriched} />;
}
