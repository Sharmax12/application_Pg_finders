export const PROPERTY_COLUMNS =
  "id,title,description,listing_kind,price,deposit_amount,food_available,gender_preference,amenities,house_rules,type,bedrooms,bathrooms,area_sqft,address,city,latitude,longitude,images,is_featured,is_sold,created_at";

export interface Property {
  id: string;
  listing_kind: "pg" | "legacy";
  deposit_amount: number | null;
  food_available: boolean | null;
  gender_preference: "any" | "male" | "female";
  amenities: string[];
  house_rules: string;
  title: string;
  description: string;
  price: number;
  type: string;
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

export const LISTING_TYPE_LABELS: Record<string, string> = {
  single_room: "Single Room",
  double_sharing: "Double Sharing",
  triple_sharing: "Triple Sharing",
  private_room: "Private Room",
  hostel: "Hostel",
};

export function formatListingType(type: string): string {
  return LISTING_TYPE_LABELS[type] ??
    type.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
