import { createClient } from "@/lib/supabase/server";
import RentalsManager, { type RentalRow } from "@/components/admin/RentalsManager";

export default async function RentalsPage() {
  const supabase = createClient();

  const { data: rentals } = await supabase
    .from("rentals")
    .select(`
      id, status, created_at, user_id,
      rental_items (
        id, part_id,
        parts ( id, name, type, image_url, total_stock, available_stock, created_at )
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

  const profileMap = Object.fromEntries(
    (profiles || []).map((p) => [p.id, p.email])
  );

  // Supabase returns nested relations as arrays — normalise parts to single object
  const enriched: RentalRow[] = (rentals || []).map((r) => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    user_id: r.user_id,
    user_email: profileMap[r.user_id] || "unknown",
    rental_items: (r.rental_items || []).map((item: any) => ({
      id: item.id,
      part_id: item.part_id,
      parts: Array.isArray(item.parts) ? item.parts[0] : item.parts,
    })),
  }));

  return <RentalsManager initialRentals={enriched} />;
}
