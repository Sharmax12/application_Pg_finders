export const PROPERTY_COLUMNS =
  "id,title,description,price,type,room_type,monthly_rent,security_deposit,gender_preference,food_included,amenities,available_from,bedrooms,bathrooms,area_sqft,address,city,latitude,longitude,images,is_featured,is_sold,created_at";

export type PgRoomType =
  | "single_room"
  | "shared_room"
  | "private_room"
  | "entire_pg";

export interface Property {
  id: string;
  title: string;
  description: string;
  // Legacy price/type are retained for compatibility while existing rows are migrated.
  price: number;
  type: string;
  room_type: PgRoomType | string;
  monthly_rent: number | null;
  security_deposit: number | null;
  gender_preference: "any" | "male" | "female" | string;
  food_included: boolean;
  amenities: string[];
  available_from: string | null;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  is_featured: boolean;
  is_sold: boolean;
  created_at: string;
}
