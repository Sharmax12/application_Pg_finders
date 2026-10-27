import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Linking, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function MapScreen() {
  const { latitude, longitude, title, address } = useLocalSearchParams<{
    latitude: string;
    longitude: string;
    title: string;
    address: string;
  }>();
  const router = useRouter();

  const lat = Number.parseFloat(latitude ?? "");
  const lng = Number.parseFloat(longitude ?? "");
  const hasCoordinates =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        lng - 0.001
      }%2C${lat - 0.001}%2C${lng + 0.001}%2C${
        lat + 0.001
      }&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>

        <View className="flex-1 mx-3">
          <Text
            className="text-gray-900 font-semibold text-sm"
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text className="text-gray-400 text-xs" numberOfLines={1}>
            {address}
          </Text>
        </View>

        <TouchableOpacity
          disabled={!hasCoordinates}
          onPress={() => {
            if (!hasCoordinates) return;
            void Linking.openURL(
              `https://www.google.com/maps?q=${lat},${lng}`
            ).catch((error) => {
              console.error("Failed to open Google Maps:", error);
              Alert.alert("Unable to open Google Maps", "Please try again.");
            });
          }}
          className="flex-row items-center gap-1 bg-blue-50 px-3 py-2 rounded-full"
        >
          <Ionicons name="navigate-outline" size={14} color="#2563EB" />
          <Text className="text-blue-600 text-xs font-semibold">
            Google Maps
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full Screen Map */}
      {hasCoordinates && mapUrl ? (
        <WebView source={{ uri: mapUrl }} style={{ flex: 1 }} />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="location-outline" size={38} color="#9CA3AF" />
          <Text className="mt-3 text-center font-semibold text-gray-700">Map location unavailable</Text>
          <Text className="mt-1 text-center text-sm text-gray-500">This route needs valid listing coordinates.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}