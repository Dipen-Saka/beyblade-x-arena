import { createClient } from "@/lib/supabase/server";
import RentalsManager, { type RentalRow } from "@/components/admin/RentalsManager";

export const revalidate = 0; // always fresh

export default async function RentalsPage() {
  const supabase = await createClient();

  // Fetch ALL rentals - RLS allows admin email
  const { data: rentals, error } = await supabase
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

  if (error) console.error("Rentals fetch error:", error.message);

  // Fetch profiles for user emails
  const userIds = (rentals || []).map((r) => r.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, email, full_name, phone").in("id", userIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  const enriched: RentalRow[] = (rentals || []).map((r) => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    user_id: r.user_id,
    user_email: profileMap[r.user_id]?.email || "unknown",
    user_name: profileMap[r.user_id]?.full_name || "",
    user_phone: profileMap[r.user_id]?.phone || "",
    rental_items: (r.rental_items || []).map((item: any) => ({
      id: item.id,
      part_id: item.part_id,
      parts: Array.isArray(item.parts) ? item.parts[0] : item.parts,
    })),
  }));

  return <RentalsManager initialRentals={enriched} />;
}
