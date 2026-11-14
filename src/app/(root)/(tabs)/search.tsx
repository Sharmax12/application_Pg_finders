import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { formatPrice } from "../../../../lib/utils";
import { usePropertySearch } from "../../../../hooks/usePropertySearch";
import { useFilterStore } from "../../../../store/filterStore";
import PropertyCard from "../../../../components/PropertyCard";
import FilterModal from "../../../../components/FilterModal";

export default function SearchScreen() {
  const { openFilters } = useLocalSearchParams<{ openFilters?: string }>();
  const [showFilters, setShowFilters] = useState(openFilters === "true");
  const [lastOpenFiltersParam, setLastOpenFiltersParam] = useState(openFilters);

  if (lastOpenFiltersParam !== openFilters) {
    setLastOpenFiltersParam(openFilters);
    if (openFilters === "true") setShowFilters(true);
  }

  const search = useFilterStore((state) => state.search);
  const type = useFilterStore((state) => state.type);
  const bedrooms = useFilterStore((state) => state.bedrooms);
  const minPrice = useFilterStore((state) => state.minPrice);
  const maxPrice = useFilterStore((state) => state.maxPrice);
  const foodIncluded = useFilterStore((state) => state.foodIncluded);
  const genderPreference = useFilterStore((state) => state.genderPreference);
  const sortBy = useFilterStore((state) => state.sortBy);
  const setSearch = useFilterStore((state) => state.setSearch);
  const setType = useFilterStore((state) => state.setType);
  const setBedrooms = useFilterStore((state) => state.setBedrooms);
  const setMinPrice = useFilterStore((state) => state.setMinPrice);
  const setMaxPrice = useFilterStore((state) => state.setMaxPrice);
  const setFoodIncluded = useFilterStore((state) => state.setFoodIncluded);
  const setGenderPreference = useFilterStore((state) => state.setGenderPreference);
  const setSortBy = useFilterStore((state) => state.setSortBy);
  const resetFacets = useFilterStore((state) => state.resetFacets);

  const filters = useMemo(
    () => ({
      search,
      type,
      bedrooms,
      minPrice,
      maxPrice,
      foodIncluded,
      genderPreference,
      sortBy,
    }),
    [
      search,
      type,
      bedrooms,
      minPrice,
      maxPrice,
      foodIncluded,
      genderPreference,
      sortBy,
    ]
  );
  const {
    results,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    retry,
  } = usePropertySearch(filters);

  const activeFilterCount = [
    type !== null,
    bedrooms !== null,
    minPrice !== null,
    maxPrice !== null,
    foodIncluded !== null,
    genderPreference !== null,
    sortBy !== "newest",
  ].filter(Boolean).length;

  const rentLabel =
    minPrice !== null && maxPrice !== null
      ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
      : minPrice !== null
        ? `From ${formatPrice(minPrice)}`
        : maxPrice !== null
          ? `Up to ${formatPrice(maxPrice)}`
          : null;

  const sortLabel =
    sortBy === "rent_low_to_high"
      ? "Rent: low to high"
      : sortBy === "rent_high_to_low"
        ? "Rent: high to low"
        : null;

  const showChip = (label: string, onRemove: () => void) => (
    <View
      key={label}
      className="flex-row items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1"
    >
      <Text className="text-xs font-semibold text-blue-700">{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label} filter`}
        onPress={onRemove}
      >
        <Ionicons name="close" size={12} color="#1D4ED8" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-3">
        <Text className="mb-1 text-2xl font-bold text-gray-900">Find PGs</Text>
        <Text className="mb-4 text-sm text-gray-500">
          Compare monthly rent, rooms, food and location.
        </Text>

        <View className="flex-row items-center gap-3">
          <View
            className="flex-1 flex-row items-center gap-3 rounded-2xl bg-white px-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 py-3 text-gray-800"
              placeholder="Search PGs, localities, colleges..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel="Search PGs by name or location"
            />
            {search.length > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setSearch("")}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            onPress={() => setShowFilters(true)}
            className={`h-12 w-12 items-center justify-center rounded-2xl ${
              activeFilterCount > 0 ? "bg-blue-600" : "bg-white"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilterCount > 0 ? "#fff" : "#374151"}
            />
            {activeFilterCount > 0 && (
              <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-red-500">
                <Text className="text-[9px] font-bold text-white">
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeFilterCount > 0 && (
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            {type &&
              showChip(type.replace(/_/g, " "), () => setType(null))}
            {bedrooms !== null &&
              showChip(
                bedrooms >= 4 ? "4+ bedrooms" : `${bedrooms} bedroom${bedrooms > 1 ? "s" : ""}`,
                () => setBedrooms(null)
              )}
            {rentLabel &&
              showChip(rentLabel, () => {
                setMinPrice(null);
                setMaxPrice(null);
              })}
            {foodIncluded !== null &&
              showChip(
                foodIncluded ? "Food included" : "Food not included",
                () => setFoodIncluded(null)
              )}
            {genderPreference &&
              showChip(
                genderPreference === "female" ? "Women" : "Men",
                () => setGenderPreference(null)
              )}
            {sortLabel && showChip(sortLabel, () => setSortBy("newest"))}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={resetFacets}
              className="px-1 py-1"
            >
              <Text className="text-xs font-semibold text-gray-500">Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <PropertyCard property={item} />}
        onEndReached={() => {
          if (hasMore) void loadMore();
        }}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-sm text-gray-500">
              {loading
                ? "Searching..."
                : `Showing ${results.length} PG${results.length === 1 ? "" : "s"}`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-20">
              {error ? (
                <>
                  <Ionicons name="cloud-offline-outline" size={44} color="#9CA3AF" />
                  <Text className="mt-4 text-center text-red-600">{error}</Text>
                  <TouchableOpacity
                    onPress={retry}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2"
                  >
                    <Text className="font-semibold text-white">Try again</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                  <Text className="mt-4 text-base text-gray-500">No PGs found</Text>
                  <Text className="mt-1 text-center text-sm text-gray-400">
                    Try another locality or clear a few filters.
                  </Text>
                </>
              )}
            </View>
          ) : (
            <ActivityIndicator size="large" color="#2563EB" className="py-20" />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#2563EB" className="py-5" />
          ) : error && results.length > 0 ? (
            <View className="items-center py-5">
              <Text className="text-sm text-red-600">{error}</Text>
              <TouchableOpacity onPress={retry} className="mt-2 px-3 py-2">
                <Text className="font-semibold text-blue-600">Search again</Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </SafeAreaView>
  );
}
