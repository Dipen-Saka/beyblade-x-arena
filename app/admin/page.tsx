import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const supabase = createClient();

  const [{ data: parts }, { data: rentals }] = await Promise.all([
    supabase.from("parts").select("*").order("type").order("name"),
    supabase
      .from("rentals")
      .select(`id, status, created_at, user_id`)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const totalStock   = (parts || []).reduce((s, p) => s + p.total_stock, 0);
  const totalAvail   = (parts || []).reduce((s, p) => s + p.available_stock, 0);
  const activeRentals = (rentals || []).filter((r) => r.status === "active").length;

  return (
    <AdminDashboard
      parts={parts || []}
      totalStock={totalStock}
      totalAvail={totalAvail}
      activeRentals={activeRentals}
    />
  );
}
