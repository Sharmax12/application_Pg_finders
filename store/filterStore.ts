import { create } from "zustand";

export type PropertyType = "single_room" | "shared_room" | "private_room" | "entire_pg" | null;
export type GenderPreference = "male" | "female" | null;
export type PropertySort = "newest" | "rent_low_to_high" | "rent_high_to_low";

interface FilterState {
  search: string;
  type: PropertyType;
  bedrooms: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  foodIncluded: boolean | null;
  genderPreference: GenderPreference;
  sortBy: PropertySort;

  setSearch: (value: string) => void;
  setType: (value: PropertyType) => void;
  setBedrooms: (value: number | null) => void;
  setMinPrice: (value: number | null) => void;
  setMaxPrice: (value: number | null) => void;
  setFoodIncluded: (value: boolean | null) => void;
  setGenderPreference: (value: GenderPreference) => void;
  setSortBy: (value: PropertySort) => void;
  resetFacets: () => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  search: "",
  type: null,
  bedrooms: null,
  minPrice: null,
  maxPrice: null,
  foodIncluded: null,
  genderPreference: null,
  sortBy: "newest",

  setSearch: (value) => set({ search: value }),
  setType: (value) => set({ type: value }),
  setBedrooms: (value) => set({ bedrooms: value }),
  setMinPrice: (value) => set({ minPrice: value }),
  setMaxPrice: (value) => set({ maxPrice: value }),
  setFoodIncluded: (value) => set({ foodIncluded: value }),
  setGenderPreference: (value) => set({ genderPreference: value }),
  setSortBy: (value) => set({ sortBy: value }),
  resetFacets: () =>
    set({
      type: null,
      bedrooms: null,
      minPrice: null,
      maxPrice: null,
      foodIncluded: null,
      genderPreference: null,
      sortBy: "newest",
    }),
  resetFilters: () =>
    set({
      search: "",
      type: null,
      bedrooms: null,
      minPrice: null,
      maxPrice: null,
      foodIncluded: null,
      genderPreference: null,
      sortBy: "newest",
    }),
}));
