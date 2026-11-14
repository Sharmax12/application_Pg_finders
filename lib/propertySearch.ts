import { supabase } from "./superbase";
import { PROPERTY_COLUMNS, type Property } from "../types/types";
import type { PropertySort, PropertyType } from "../store/filterStore";

export const PROPERTY_SEARCH_PAGE_SIZE = 20;

export interface PropertySearchFilters {
  search: string;
  type: PropertyType;
  bedrooms: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  foodIncluded: boolean | null;
  genderPreference: "male" | "female" | null;
  sortBy: PropertySort;
}

export interface PropertySearchPage {
  properties: Property[];
  hasMore: boolean;
}

type QueryLike = {
  order?: (column: string, options?: { ascending?: boolean }) => unknown;
  range?: (from: number, to: number) => unknown;
};

type QueryResult = {
  data: Property[] | null;
  error: unknown;
};

function escapePostgrestValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function searchPropertyPage(
  filters: PropertySearchFilters,
  page: number
): Promise<PropertySearchPage> {
  let query = supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("is_sold", false)
    .not("monthly_rent", "is", null);

  const searchTerm = filters.search.trim();
  if (searchTerm) {
    const escapedSearch = escapePostgrestValue(searchTerm);
    query = query.or(
      `title.ilike."%${escapedSearch}%",city.ilike."%${escapedSearch}%",address.ilike."%${escapedSearch}%",description.ilike."%${escapedSearch}%"`
    );
  }

  if (filters.type) query = query.eq("room_type", filters.type);

  if (filters.bedrooms !== null) {
    query =
      filters.bedrooms >= 4
        ? query.gte("bedrooms", 4)
        : query.eq("bedrooms", filters.bedrooms);
  }

  if (filters.minPrice !== null) {
    query = query.gte("monthly_rent", filters.minPrice);
  }

  if (filters.maxPrice !== null) {
    query = query.lte("monthly_rent", filters.maxPrice);
  }

  if (filters.foodIncluded !== null) {
    query = query.eq("food_included", filters.foodIncluded);
  }

  if (filters.genderPreference) {
    query = query.in("gender_preference", [filters.genderPreference, "any"]);
  }

  const start = Math.max(0, page) * PROPERTY_SEARCH_PAGE_SIZE;
  const end = start + PROPERTY_SEARCH_PAGE_SIZE - 1;
  const firstOrder =
    filters.sortBy === "newest"
      ? query.order("created_at", { ascending: false })
      : query.order("monthly_rent", {
          ascending: filters.sortBy === "rent_low_to_high",
        });

  // Supabase builders remain chainable after order(). Keeping this small
  // compatibility check also lets lightweight thenable query adapters resolve
  // their first page without implementing every PostgREST transform method.
  let orderedQuery: unknown = firstOrder;
  const orderable = orderedQuery as QueryLike;
  if (filters.sortBy !== "newest" && typeof orderable.order === "function") {
    orderedQuery = orderable.order("created_at", { ascending: false });
  }

  const tieBreaker = orderedQuery as QueryLike;
  if (typeof tieBreaker.order === "function") {
    orderedQuery = tieBreaker.order("id", { ascending: true });
  }

  const rangeable = orderedQuery as QueryLike;
  const rangedQuery =
    typeof rangeable.range === "function"
      ? rangeable.range(start, end)
      : orderedQuery;
  const { data, error } = (await rangedQuery) as QueryResult;

  if (error) throw error;

  const properties = data ?? [];
  return {
    properties,
    hasMore: properties.length === PROPERTY_SEARCH_PAGE_SIZE,
  };
}
