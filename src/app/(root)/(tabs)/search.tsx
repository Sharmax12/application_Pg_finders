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
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/superbase";
import { PROPERTY_COLUMNS, type Property } from "../../../../types/types";
import { useFilterStore } from "../../../../store/filterStore";
import { formatPrice } from "../../../../lib/utils";
import PropertyCard from "../../../../components/PropertyCard";
import FilterModal from "../../../../components/FilterModal";
import { useLocalSearchParams } from "expo-router";

export default function SearchScreen() {
  const { openFilters } = useLocalSearchParams<{ openFilters?: string }>();
  const [showFilters, setShowFilters] = useState(openFilters === "true");
  const [lastOpenFiltersParam, setLastOpenFiltersParam] = useState(openFilters);

  if (lastOpenFiltersParam !== openFilters) {
    setLastOpenFiltersParam(openFilters);
    if (openFilters === "true") {
      setShowFilters(true);
    }
  }

  const {
    search,
    type,
    bedrooms,
    minPrice,
    maxPrice,
    setSearch,
    setType,
    setBedrooms,
    setMinPrice,
    setMaxPrice,
  } = useFilterStore();
  const [retryCount, setRetryCount] = useState(0);
  const request = useMemo(
    () => ({ search, type, bedrooms, minPrice, maxPrice, retryCount }),
    [search, type, bedrooms, minPrice, maxPrice, retryCount]
  );
  const requestKey = JSON.stringify(request);
  const [response, setResponse] = useState<{
    key: string;
    results: Property[];
    error: string | null;
  } | null>(null);
  const currentResponse = response?.key === requestKey ? response : null;
  const results = currentResponse?.results ?? [];
  const error = currentResponse?.error ?? null;
  const loading = currentResponse === null;

  const activeFilterCount = [
    type !== null,
    bedrooms !== null,
    minPrice !== null,
    maxPrice !== null,
  ].filter(Boolean).length;

  useEffect(() => {
    let isCurrent = true;

    const fetchResults = async () => {
      try {
        let query = supabase
          .from("properties")
          .select(PROPERTY_COLUMNS)
          .eq("listing_kind", "pg")
          .eq("is_sold", false);

        if (request.search) {
          // Treat user input as literal search text, not PostgREST filter syntax.
          const safeSearch = request.search.replace(/[\\\\,()%"]/g, " ").trim();
          if (safeSearch) {
            query = query.or(
              `title.ilike."%${safeSearch}%",city.ilike."%${safeSearch}%"`
            );
          }
        }

        if (request.type) {
          query = query.eq("type", request.type);
        }

        if (request.bedrooms !== null) {
          query =
            request.bedrooms === 4
              ? query.gte("bedrooms", 4)
              : query.eq("bedrooms", request.bedrooms);
        }

        if (request.minPrice !== null) {
          query = query.gte("price", request.minPrice);
        }

        if (request.maxPrice !== null) {
          query = query.lte("price", request.maxPrice);
        }

        const { data, error: fetchError } = await query.order("created_at", {
          ascending: false,
        });

        if (fetchError) {
          throw fetchError;
        }

        if (isCurrent) {
          setResponse({
            key: requestKey,
            results: data ?? [],
            error: null,
          });
        }
      } catch (fetchError) {
        console.error("Failed to fetch search properties:", fetchError);
        if (isCurrent) {
          setResponse({
            key: requestKey,
            results: [],
            error: "Unable to search properties. Please try again.",
          });
        }
      }
    };

    void fetchResults();

    return () => {
      isCurrent = false;
    };
  }, [request, requestKey]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Find a PG
        </Text>

        {/* Search Bar + Filter Button */}
        <View className="flex-row items-center gap-3">
          <View
            className="flex-1 flex-row items-center bg-white rounded-2xl px-4 gap-3"
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
              placeholder="Search by title or city..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearch("");
                }}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => {
              setShowFilters(true);
            }}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${
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
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
                <Text className="text-white text-[9px] font-bold">
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {type && (
              <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-1">
                <Text className="text-blue-700 text-xs font-semibold capitalize">
                  {type}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setType(null);
                  }}
                >
                  <Ionicons name="close" size={12} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
            )}
            {bedrooms !== null && (
              <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-1">
                <Ionicons name="bed-outline" size={11} color="#1D4ED8" />
                <Text className="text-blue-700 text-xs font-semibold">
                  {bedrooms === 4
                    ? "4+ beds"
                    : `${bedrooms} bed${bedrooms > 1 ? "s" : ""}`}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setBedrooms(null);
                  }}
                >
                  <Ionicons name="close" size={12} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
            )}
            {(minPrice !== null || maxPrice !== null) && (
              <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-1">
                <Text className="text-blue-700 text-xs font-semibold">
                  {minPrice !== null && maxPrice !== null
                    ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
                    : minPrice !== null
                    ? `From ${formatPrice(minPrice)}`
                    : maxPrice !== null
                    ? `Up to ${formatPrice(maxPrice)}`
                    : ""}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setMinPrice(null);
                    setMaxPrice(null);
                  }}
                >
                  <Ionicons name="close" size={12} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PropertyCard property={item} />}
        ListHeaderComponent={
          <Text className="text-sm text-gray-400 mb-4">
            {loading ? "Searching..." : `${results.length} PGs found`}
          </Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-20">
              {error ? (
                <>
                  <Text className="text-center text-red-600">{error}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setRetryCount((count) => count + 1);
                    }}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2"
                  >
                    <Text className="font-semibold text-white">Try again</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-400 mt-4 text-base">
                    No PG listings found
                  </Text>
                  <Text className="text-gray-300 text-sm mt-1">
                    Try a different search or adjust filters
                  </Text>
                </>
              )}
            </View>
          ) : (
            <ActivityIndicator size="large" color="#2563EB" className="py-20" />
          )
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => {
          setShowFilters(false);
        }}
      />
    </SafeAreaView>
  );
}