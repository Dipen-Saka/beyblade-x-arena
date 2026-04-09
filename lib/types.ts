export type PartType = "blade" | "ratchet" | "bit";

export interface Part {
  id: string;
  name: string;
  type: PartType;
  image_url: string | null;
  total_stock: number;
  available_stock: number;
  created_at: string;
}

export interface Rental {
  id: string;
  user_id: string;
  status: "active" | "returned";
  created_at: string;
  users?: { email: string };
  rental_items?: RentalItem[];
}

export interface RentalItem {
  id: string;
  rental_id: string;
  part_id: string;
  parts?: Part;
}

export interface Profile {
  id: string;
  email: string;
  role: "admin" | "user";
}
