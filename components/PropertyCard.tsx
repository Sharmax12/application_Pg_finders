import { useSavedProperty } from "../hooks/useSavedProperty";
import { formatPrice } from "../lib/utils";
import type { Property } from "../types/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PropertyCard({
  property,
  onUnsave,
  showSave = false,
}: {
  property: Property;
  onUnsave?: () => void;
  showSave?: boolean;
}) {
  const router = useRouter();
  const { isSaved, saveLoading, toggleSave } = useSavedProperty(
    property.id,
    onUnsave
  );

  const handleToggleSave = () => {
    void toggleSave().catch((error) => {
      console.error("Failed to update saved property:", error);
      Alert.alert(
        "Unable to update saved properties",
        error instanceof Error ? error.message : "Please try again."
      );
    });
  };

  return (
    <View
      className="flex-row bg-white rounded-2xl mb-4 overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        opacity: property.is_sold ? 0.5 : 1,
      }}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View ${property.title}`}
        onPress={() => router.push(`/(root)/property/${property.id}`)}
        className="flex-1 flex-row"
        activeOpacity={0.85}
      >
        {property.images?.[0] ? (
          <Image
            source={{ uri: property.images[0] }}
            className="w-28 h-28"
            resizeMode="cover"
          />
        ) : (
          <View className="w-28 h-28 bg-gray-100 items-center justify-center">
            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
          </View>
        )}

        <View className="flex-1 p-3 justify-between">
          <View>
            <Text
              className="text-sm font-bold text-gray-800 mb-1"
              numberOfLines={1}
            >
              {property.title}
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={11} color="#6B7280" />
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {property.city}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-blue-600 font-bold text-sm">
              {formatPrice(property.price)}{property.listing_kind === "pg" ? "/mo" : ""}
            </Text>
            {property.is_sold && (
              <View className="bg-red-50 px-2 py-0.5 rounded-full">
                <Text className="text-red-500 text-xs font-semibold">Sold</Text>
              </View>
            )}
            <View className="flex-row gap-3">
              <View className="flex-row items-center gap-1">
                <Ionicons name="bed-outline" size={11} color="#6B7280" />
                <Text className="text-xs text-gray-500">
                  {property.bedrooms} bd
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="expand-outline" size={11} color="#6B7280" />
                <Text className="text-xs text-gray-500">
                  {property.area_sqft !== null ? `${property.area_sqft} ft²` : "Area not listed"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {showSave && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isSaved ? "Remove saved property" : "Save property"}
          onPress={handleToggleSave}
          disabled={saveLoading}
          className="w-12 items-center justify-center"
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={20}
            color={isSaved ? "#EF4444" : "#9CA3AF"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
