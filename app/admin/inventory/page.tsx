import { createClient } from "@/lib/supabase/server";
import InventoryManager from "@/components/admin/InventoryManager";

export default async function InventoryPage() {
  const supabase = createClient();
  const { data: parts } = await supabase
    .from("parts")
    .select("*")
    .order("type")
    .order("name");

  return <InventoryManager initialParts={parts || []} />;
}
