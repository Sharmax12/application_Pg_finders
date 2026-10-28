import FeaturedCard from "../../../../components/FeatureCard";
import PropertyCard from "../../../../components/PropertyCard";
import { supabase } from "../../../../lib/superbase";
import { PROPERTY_COLUMNS, type Property } from "../../../../types/types";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [featured, setFeatured] = useState<Property[]>([]);
  const [recommended, setRecommended] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;

      const fetchProperties = async () => {
        setLoading(true);
        setError(null);

        try {
          const [featuredResult, recommendedResult] = await Promise.all([
            supabase
              .from("properties")
              .select(PROPERTY_COLUMNS)
              .eq("is_featured", true)
              .eq("is_sold", false)
              .not("monthly_rent", "is", null)
              .order("created_at", { ascending: false }),
            supabase
              .from("properties")
              .select(PROPERTY_COLUMNS)
              .eq("is_featured", false)
              .eq("is_sold", false)
              .not("monthly_rent", "is", null)
              .order("created_at", { ascending: false }),
          ]);

          if (featuredResult.error) {
            throw featuredResult.error;
          }
          if (recommendedResult.error) {
            throw recommendedResult.error;
          }

          if (isCurrent) {
            setFeatured(featuredResult.data ?? []);
            setRecommended(recommendedResult.data ?? []);
          }
        } catch (fetchError) {
          console.error("Failed to fetch home properties:", {
            retryCount,
            error: fetchError,
          });
          if (isCurrent) {
            setError("Unable to load properties. Please try again.");
          }
        } finally {
          if (isCurrent) {
            setLoading(false);
          }
        }
      };

      void fetchProperties();

      return () => {
        isCurrent = false;
      };
    }, [retryCount])
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={recommended}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-4 pb-5">
              <Text className="text-2xl font-extrabold tracking-tight text-blue-600">
                PGFinders
              </Text>
              <View className="items-end">
                <Text className="text-gray-500 text-xs">Find your next PG 👋</Text>
                <Text className="text-gray-900 text-base font-bold">
                  {user?.firstName ?? "User"}
                </Text>
              </View>
            </View>

            {/* Search Bar */}
            <TouchableOpacity
              onPress={() => router.push("/(root)/(tabs)/search")}
              className="mx-5 mb-6 flex-row items-center bg-white rounded-2xl px-4 py-3 gap-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm flex-1">
                Search PGs, neighbourhoods...
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push("/(root)/(tabs)/search?openFilters=true")
                }
                className="w-8 h-8 bg-blue-600 rounded-xl items-center justify-center"
              >
                <Ionicons name="options-outline" size={15} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Featured Section */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold px-5 mb-4">
                Featured PGs
              </Text>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                  className="py-10"
                />
              ) : error ? (
                <View className="items-center px-5 py-6">
                  <Text className="text-center text-red-600">{error}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setRetryCount((count) => count + 1);
                    }}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2"
                  >
                    <Text className="font-semibold text-white">Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={featured}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <FeaturedCard property={item} />}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                />
              )}
            </View>

            {/* Recommended Header */}
            <Text className="text-gray-900 text-lg font-bold px-5 mb-4">
              Recommended PGs
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-5">
            <PropertyCard property={item} />
          </View>
        )}
        ListEmptyComponent={
          !loading && !error
            ? () => (
                <View className="items-center py-10">
                  <Text className="text-gray-400">No PGs found yet</Text>
                </View>
              )
            : undefined
        }
      />
    </SafeAreaView>
  );
}