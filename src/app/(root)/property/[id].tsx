import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatPrice } from "../../../../lib/utils";
import { supabase } from "../../../../lib/superbase";
import type { Property } from "../../../../types/types";

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProperty(data);
      }
      setLoading(false);
    };

    if (id) {
      void fetchProperty();
    } else {
      setError("Property ID is missing.");
      setLoading(false);
    }
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableOpacity className="px-5 py-3" onPress={() => router.back()}>
        <Text className="font-semibold text-blue-600">Back</Text>
      </TouchableOpacity>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-red-600">{error}</Text>
        </View>
      ) : property ? (
        <ScrollView>
          {property.images[0] ? (
            <Image
              source={{ uri: property.images[0] }}
              className="h-72 w-full"
              resizeMode="cover"
            />
          ) : null}
          <View className="gap-3 p-5">
            <Text className="text-2xl font-bold text-gray-900">
              {property.title}
            </Text>
            <Text className="text-gray-600">
              {property.address}, {property.city}
            </Text>
            <Text className="text-xl font-bold text-blue-600">
              {formatPrice(property.price)}
            </Text>
            <Text className="text-gray-700">
              {property.type} · {property.bedrooms} bedrooms ·{" "}
              {property.bathrooms} bathrooms · {property.area_sqft} sq ft
            </Text>
            {property.is_sold ? (
              <Text className="font-semibold text-red-600">Sold</Text>
            ) : null}
            <Text className="mt-2 text-gray-700">{property.description}</Text>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
