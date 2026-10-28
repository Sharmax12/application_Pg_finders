import { useSavedProperty } from "../../../../hooks/useSavedProperty";
import { useSuperbase as useSupabase } from "../../../../hooks/useSuperbase";
import ImageViewer from "../../../../components/ImageViewer";
import { formatPrice } from "../../../../lib/utils";
import { supabase } from "../../../../lib/superbase";
import { useUserStore } from "../../../../store/userStore";
import { PROPERTY_COLUMNS, type Property } from "../../../../types/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAdmin = useUserStore((state) => state.isAdmin);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const { isSaved, saveLoading, toggleSave } = useSavedProperty(id ?? "");
  const authSupabase = useSupabase();

  useEffect(() => {
    let isCurrent = true;

    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select(PROPERTY_COLUMNS)
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        if (isCurrent) {
          setProperty(data);
        }
      } catch (fetchError) {
        console.error("Failed to fetch property details:", fetchError);
        if (isCurrent) {
          setProperty(null);
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    void fetchProperty();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  const deleteProperty = async () => {
    try {
      const { error } = await authSupabase
        .from("properties")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
      router.replace("/(root)/(tabs)");
    } catch (deleteError) {
      console.error("Failed to delete property:", deleteError);
      Alert.alert("Unable to delete property", "Please try again.");
    }
  };

  const handleDelete = () => {
    Alert.alert("Remove PG listing", "Are you sure you want to remove this PG listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteProperty();
        },
      },
    ]);
  };

  const markPropertySold = async () => {
    try {
      const { error } = await authSupabase
        .from("properties")
        .update({ is_sold: true })
        .eq("id", id);

      if (error) {
        throw error;
      }
      setProperty((prev) => (prev ? { ...prev, is_sold: true } : prev));
    } catch (updateError) {
      console.error("Failed to mark property as sold:", updateError);
      Alert.alert("Unable to update property", "Please try again.");
    }
  };

  const handleMarkSold = () => {
    Alert.alert("Mark unavailable", "Are you sure this PG is no longer available?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark unavailable",
        onPress: () => {
          void markPropertySold();
        },
      },
    ]);
  };

  const handleContact = () => {
    const supportWhatsApp = (process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(
      /\D/g,
      ""
    );

    // Do not route users to a placeholder number. This is a global PGFinders
    // support contact, not a verified per-listing owner number.
    if (supportWhatsApp.length < 10 || supportWhatsApp.length > 15) {
      Alert.alert(
        "Contact not available yet",
        "The PGFinders contact number has not been configured. Please try again later."
      );
      return;
    }

    const listingTitle = property?.title ?? "a PG listing";
    const message = `Hi PGFinders team, I'm interested in "${listingTitle}". Could you connect me with the owner or manager?`;
    const url = `https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(
      message
    )}`;
    void Linking.openURL(url).catch((error) => {
      console.error("Failed to open WhatsApp contact:", error);
      Alert.alert("Unable to open WhatsApp", "Please try again.");
    });
  };

  const handleToggleSave = () => {
    void toggleSave().catch((error) => {
      console.error("Failed to update saved property:", error);
      Alert.alert("Unable to update saved properties", "Please try again.");
    });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!property) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">PG listing not found</Text>
      </View>
    );
  }

  const safeImages = Array.isArray(property.images)
    ? property.images.filter((uri) => typeof uri === "string" && uri.length > 0)
    : [];
  const description = typeof property.description === "string" ? property.description : "";
  const coordinates =
    typeof property.latitude === "number" &&
    typeof property.longitude === "number" &&
    Number.isFinite(property.latitude) &&
    Number.isFinite(property.longitude) &&
    property.latitude >= -90 &&
    property.latitude <= 90 &&
    property.longitude >= -180 &&
    property.longitude <= 180
      ? { latitude: property.latitude, longitude: property.longitude }
      : null;
  const hasCoordinates = coordinates !== null;
  const mapUrl = coordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.003
      }%2C${coordinates.latitude - 0.003}%2C${coordinates.longitude + 0.003}%2C${coordinates.latitude + 0.003
      }&layer=mapnik&marker=${coordinates.latitude}%2C${coordinates.longitude}`
    : null;

  const isLongDesc = description.length > 150;
  const displayDesc =
    expanded || !isLongDesc ? description : description.slice(0, 150) + "...";

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View>
          <View style={{ opacity: property.is_sold ? 0.5 : 1 }}>
            <FlatList
              data={safeImages}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setImageViewerVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: item }}
                    style={{ width, height: 300 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
            />
          </View>

          {/* Image count badge */}
          <View className="absolute bottom-3 right-4 bg-black/50 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">
              {activeIndex + 1}/{safeImages.length}
            </Text>
          </View>

          {/* Dot indicators */}
          {safeImages.length > 1 && (
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1">
              {safeImages.map((_, i) => (
                <View
                  key={i}
                  className={`h-1.5 rounded-full ${
                    i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </View>
          )}

          {/* Back + Save buttons */}
          <SafeAreaView className="absolute top-0 left-0 right-0">
            <View className="flex-row items-center justify-between px-4 pt-2">
              <TouchableOpacity
                onPress={() => {
                  router.back();
                }}
                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                style={{ elevation: 3 }}
              >
                <Ionicons name="arrow-back" size={20} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleToggleSave}
                disabled={saveLoading}
                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                style={{ elevation: 3 }}
              >
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={20}
                  color={isSaved ? "#EF4444" : "#111827"}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View
          className="px-5 pt-5 pb-8"
          style={{ opacity: property.is_sold ? 0.6 : 1 }}
        >
          {/* Badges */}
          <View className="flex-row gap-2 mb-3 flex-wrap">
            <View className="bg-blue-50 px-3 py-1 rounded-full">
              <Text className="text-blue-600 text-xs font-semibold capitalize">
                {property.room_type.replace(/_/g, " ")}
              </Text>
            </View>
            {property.is_featured && (
              <View className="bg-amber-50 px-3 py-1 rounded-full">
                <Text className="text-amber-600 text-xs font-semibold">
                  ⭐ Featured
                </Text>
              </View>
            )}
            {property.is_sold && (
              <View className="bg-red-50 px-3 py-1 rounded-full">
                <Text className="text-red-500 text-xs font-semibold">Unavailable</Text>
              </View>
            )}
          </View>

          {/* Title + Price */}
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {property.title}
          </Text>
          <Text className="text-blue-600 text-xl font-bold mb-4">
            {typeof property.monthly_rent === "number" ? `${formatPrice(property.monthly_rent)}/month` : "Rent not set"}
          </Text>

          {/* Specs Row */}
          <View className="flex-row justify-between bg-gray-50 rounded-2xl p-4 mb-5">
            <SpecItem
              icon="bed-outline"
              label="Beds"
              value={`${property.bedrooms}`}
            />
            <SpecItem
              icon="water-outline"
              label="Baths"
              value={`${property.bathrooms}`}
            />
            <SpecItem
              icon="expand-outline"
              label="Area"
              value={typeof property.area_sqft === "number" && property.area_sqft > 0 ? `${property.area_sqft} ft²` : "—"}
            />
            <SpecItem icon="home-outline" label="Room type" value={property.room_type.replace(/_/g, " ")} />
          </View>

          <View className="flex-row flex-wrap gap-2 mb-5">
            <View className="bg-gray-50 rounded-xl px-3 py-2">
              <Text className="text-xs text-gray-400">Security deposit</Text>
              <Text className="text-sm font-semibold text-gray-800">
                {typeof property.security_deposit === "number"
                  ? formatPrice(property.security_deposit)
                  : "Not specified"}
              </Text>
            </View>
            <View className="bg-gray-50 rounded-xl px-3 py-2">
              <Text className="text-xs text-gray-400">Preference</Text>
              <Text className="text-sm font-semibold text-gray-800 capitalize">
                {property.gender_preference === "any" ? "Any" : property.gender_preference}
              </Text>
            </View>
            <View className="bg-gray-50 rounded-xl px-3 py-2">
              <Text className="text-xs text-gray-400">Food</Text>
              <Text className="text-sm font-semibold text-gray-800">
                {property.food_included ? "Included" : "Not included"}
              </Text>
            </View>
          </View>

          {property.available_from && (
            <View className="flex-row items-center gap-2 mb-5">
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600">
                Available from {new Date(`${property.available_from}T00:00:00`).toLocaleDateString()}
              </Text>
            </View>
          )}

          {property.amenities?.length > 0 && (
            <View className="mb-5">
              <Text className="text-base font-bold text-gray-900 mb-2">Amenities</Text>
              <View className="flex-row flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <View key={amenity} className="bg-blue-50 px-3 py-1.5 rounded-full">
                    <Text className="text-xs font-medium text-blue-700">{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <Text className="text-base font-bold text-gray-900 mb-2">
            Description
          </Text>
          <Text className="text-gray-500 text-sm leading-6 mb-1">
            {displayDesc}
          </Text>
          {isLongDesc && (
            <TouchableOpacity
              onPress={() => {
                setExpanded(!expanded);
              }}
            >
              <Text className="text-blue-600 text-sm font-medium mb-5">
                {expanded ? "Show less" : "Read more"}
              </Text>
            </TouchableOpacity>
          )}

          <View className="mb-5" />

          {/* Location */}
          <Text className="text-base font-bold text-gray-900 mb-2">
            Location
          </Text>
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm flex-1">
              {property.address}, {property.city}
            </Text>
          </View>

          {/* Map Preview */}
          {hasCoordinates && mapUrl ? (
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/(root)/property/map",
                  params: {
                    latitude: String(property.latitude),
                    longitude: String(property.longitude),
                    title: property.title,
                    address: `${property.address}, ${property.city}`,
                  },
                });
              }}
              activeOpacity={0.9}
              className="rounded-2xl overflow-hidden mb-6"
              style={{ height: 200 }}
            >
              <WebView
                source={{ uri: mapUrl }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                pointerEvents="none"
              />
              <View className="absolute bottom-3 right-3 bg-white/90 px-3 py-1 rounded-full flex-row items-center gap-1">
                <Ionicons name="expand-outline" size={12} color="#374151" />
                <Text className="text-gray-600 text-xs font-medium">Tap to expand</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="rounded-2xl bg-gray-50 items-center justify-center mb-6 px-5" style={{ height: 120 }}>
              <Ionicons name="location-outline" size={24} color="#9CA3AF" />
              <Text className="mt-2 text-center text-sm text-gray-500">
                Map coordinates have not been added to this listing.
              </Text>
            </View>
          )}

          {/* Contact Button */}
          <TouchableOpacity
            onPress={handleContact}
            className="flex-row items-center justify-center gap-2 bg-blue-600 py-4 rounded-2xl mb-4"
          >
            <Ionicons name="logo-whatsapp" size={20} color="white" />
            <Text className="text-white font-bold text-base">
              Contact PGFinders
            </Text>
          </TouchableOpacity>

          {/* Admin Actions */}
          {isAdmin && (
            <View className="flex-row gap-3">
              {!property.is_sold && (
                <TouchableOpacity
                  onPress={handleMarkSold}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-amber-50 py-4 rounded-2xl border border-amber-200"
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#D97706"
                  />
                  <Text className="text-amber-600 font-semibold">
                    Mark unavailable
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-1 flex-row items-center justify-center gap-2 bg-red-50 py-4 rounded-2xl border border-red-100"
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text className="text-red-500 font-semibold">Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Viewer */}
      <ImageViewer
        images={safeImages.map((uri) => ({ uri }))}
        imageIndex={Math.min(activeIndex, Math.max(0, safeImages.length - 1))}
        visible={imageViewerVisible}
        onRequestClose={() => {
          setImageViewerVisible(false);
        }}
      />
    </View>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="items-center gap-1">
      <Ionicons name={icon} size={20} color="#2563EB" />
      <Text className="text-gray-900 font-bold text-sm">{value}</Text>
      <Text className="text-gray-400 text-xs">{label}</Text>
    </View>
  );
}