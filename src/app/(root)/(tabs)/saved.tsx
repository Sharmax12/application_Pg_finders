import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PropertyCard from "../../../../components/PropertyCard";
import { useSuperbase } from "../../../../hooks/useSuperbase";
import { PROPERTY_COLUMNS, type Property } from "../../../../types/types";

export default function Saved() {
  const { userId } = useAuth();
  const authSupabase = useSuperbase();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;

      const loadSavedProperties = async () => {
        setLoading(true);
        setError(null);

        if (!userId) {
          if (isCurrent) {
            setProperties([]);
            setLoading(false);
          }
          return;
        }

        try {
          const { data: savedRows, error: savedError } = await authSupabase
            .from("saved_properties")
            .select("property_id")
            .eq("user_clerk_id", userId);

          if (savedError) throw savedError;

          const propertyIds = [
            ...new Set(
              (savedRows ?? [])
                .map((row: { property_id: string }) => row.property_id)
                .filter(Boolean)
            ),
          ];

          if (propertyIds.length === 0) {
            if (isCurrent) setProperties([]);
            return;
          }

          const { data, error: propertyError } = await authSupabase
            .from("properties")
            .select(PROPERTY_COLUMNS)
            .in("id", propertyIds);

          if (propertyError) throw propertyError;

          if (isCurrent) {
            // Keep the saved-list order rather than database default ordering.
            const byId = new Map(
              ((data ?? []) as Property[]).map((property) => [
                property.id,
                property,
              ])
            );
            setProperties(
              propertyIds
                .map((propertyId) => byId.get(propertyId))
                .filter((property): property is Property => Boolean(property))
            );
          }
        } catch (loadError) {
          console.error("Failed to load saved properties:", loadError);
          if (isCurrent) {
            setError("Unable to load saved properties. Please try again.");
          }
        } finally {
          if (isCurrent) setLoading(false);
        }
      };

      void loadSavedProperties();

      return () => {
        isCurrent = false;
      };
    }, [authSupabase, retryCount, userId])
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            showSave
            onUnsave={() => {
              setProperties((current) =>
                current.filter((property) => property.id !== item.id)
              );
            }}
          />
        )}
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-2xl font-bold text-gray-900">Saved places</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Keep your shortlist in one place.
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-gray-500 mt-3">Loading saved places…</Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-16">
              <Ionicons name="cloud-offline-outline" size={40} color="#9CA3AF" />
              <Text className="text-center text-red-600 mt-3">{error}</Text>
              <TouchableOpacity
                onPress={() => setRetryCount((count) => count + 1)}
                className="mt-3 bg-blue-600 rounded-xl px-4 py-2"
              >
                <Text className="text-white font-semibold">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center justify-center py-16">
              <Ionicons name="heart-outline" size={40} color="#9CA3AF" />
              <Text className="text-gray-900 font-semibold mt-3">
                No saved places yet
              </Text>
              <Text className="text-gray-500 text-center mt-1">
                Save interesting places from search to compare them later.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
