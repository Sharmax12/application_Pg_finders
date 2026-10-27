export const PROPERTY_COLUMNS =
  "id,title,description,price,type,bedrooms,bathrooms,area_sqft,address,city,latitude,longitude,images,is_featured,is_sold,created_at";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  images: string[];
  is_featured: boolean;
  is_sold: boolean;
  created_at: string;
}
