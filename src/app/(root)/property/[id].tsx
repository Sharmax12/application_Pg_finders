import { useSavedProperty } from "../../../../hooks/useSavedProperty";
import { useSuperbase as useSupabase } from "../../../../hooks/useSuperbase";
import ImageViewer from "../../../../components/ImageViewer";
import { formatPrice } from "../../../../lib/utils";
import { supabase } from "../../../../lib/superbase";
import { useUserStore } from "../../../../store/userStore";
import { formatListingType, PROPERTY_COLUMNS, type Property } from "../../../../types/types";
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
          .eq("listing_kind", "pg")
          .single();

        if (error) {
          throw error;
        }

        if (isCurrent) {
          setProperty({
            ...data,
            description: typeof data.description === "string" ? data.description : "",
            images: Array.isArray(data.images)
              ? data.images.filter(
                  (image: unknown): image is string =>
                    typeof image === "string" && image.length > 0
                )
              : [],
            amenities: Array.isArray(data.amenities)
              ? data.amenities.filter(
                  (amenity: unknown): amenity is string =>
                    typeof amenity === "string" && amenity.length > 0
                )
              : [],
            house_rules: typeof data.house_rules === "string" ? data.house_rules : "",
            gender_preference:
              data.gender_preference === "male" || data.gender_preference === "female"
                ? data.gender_preference
                : "any",
          });
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
    Alert.alert("Delete Property", "Are you sure?", [
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
    Alert.alert("Mark as unavailable", "Remove this PG from available listings?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Sold",
        onPress: () => {
          void markPropertySold();
        },
      },
    ]);
  };

  const togglePropertyFeatured = async () => {
    const nextFeatured = !property?.is_featured;
    try {
      const { error } = await authSupabase
        .from("properties")
        .update({ is_featured: nextFeatured })
        .eq("id", id);

      if (error) throw error;
      setProperty((prev) =>
        prev ? { ...prev, is_featured: nextFeatured } : prev
      );
    } catch (updateError) {
      console.error("Failed to update featured status:", updateError);
      Alert.alert("Unable to update featured status", "Please try again.");
    }
  };

  const handleToggleFeatured = () => {
    const nextFeatured = !property?.is_featured;
    Alert.alert(
      nextFeatured ? "Feature PG Listing" : "Remove Featured Status",
      nextFeatured
        ? "This PG will appear in the featured section."
        : "This PG will no longer appear in the featured section.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: nextFeatured ? "Feature Listing" : "Unfeature Listing",
          onPress: () => void togglePropertyFeatured(),
        },
      ]
    );
  };

  const handleContact = () => {
    const contactNumber = (
      property?.owner_whatsapp ??
      process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ??
      ""
    ).replace(/\D/g, "");

    // Do not route users to a placeholder number. This is a global PGFinders
    // support contact, not a verified per-listing owner number.
    if (contactNumber.length < 10 || contactNumber.length > 15) {
      Alert.alert(
        "Contact not available yet",
        "No contact number is configured for this listing or PGFinders support yet."
      );
      return;
    }

    const listingTitle = property?.title ?? "a PG listing";
    const message = property?.owner_whatsapp
      ? `Hi, I'm interested in "${listingTitle}". Is it still available? Could you share the rent and visiting details?`
      : `Hi PGFinders team, I'm interested in "${listingTitle}". Could you connect me with the owner or manager?`;
    const url = `https://wa.me/${contactNumber}?text=${encodeURIComponent(
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
        <Text className="text-gray-500">Property not found</Text>
      </View>
    );
  }

  const latitude = property.latitude;
  const longitude = property.longitude;
  const hasCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;
  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        longitude - 0.003
      }%2C${latitude - 0.003}%2C${longitude + 0.003}%2C${
        latitude + 0.003
      }&layer=mapnik&marker=${latitude}%2C${longitude}`
    : null;

  const isLongDesc = property.description.length > 150;
  const displayDesc =
    expanded || !isLongDesc
      ? property.description
      : property.description.slice(0, 150) + "...";

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View>
          <View style={{ opacity: property.is_sold ? 0.5 : 1 }}>
            {property.images.length > 0 ? (
              <FlatList
                data={property.images}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="View listing photo full screen"
                    onPress={() => setImageViewerVisible(true)}
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
            ) : (
              <View
                style={{ width, height: 300 }}
                className="bg-gray-100 items-center justify-center"
              >
                <Ionicons name="image-outline" size={38} color="#9CA3AF" />
                <Text className="text-sm text-gray-500 mt-3">
                  No photos have been added to this PG yet.
                </Text>
              </View>
            )}
          </View>

          {/* Image count badge */}
          {property.images.length > 0 && (
            <View className="absolute bottom-3 right-4 bg-black/50 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">
                {activeIndex + 1}/{property.images.length}
              </Text>
            </View>
          )}

          {/* Dot indicators */}
          {property.images.length > 1 && (
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1">
              {property.images.map((_, i) => (
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
                {formatListingType(property.type)}
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
            {formatPrice(property.price)}{property.listing_kind === "pg" ? " / month" : ""}
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
              value={property.area_sqft !== null ? `${property.area_sqft} ft²` : "Not listed"}
            />
            <SpecItem icon="home-outline" label="Type" value={formatListingType(property.type)} />
          </View>

          <View className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-6">
            <View className="flex-row flex-wrap gap-y-4">
              <View className="w-1/2 pr-3">
                <Text className="text-xs text-gray-500 mb-1">Security deposit</Text>
                <Text className="text-gray-900 font-bold">
                  {property.deposit_amount !== null
                    ? formatPrice(property.deposit_amount)
                    : "Not listed"}
                </Text>
              </View>
              <View className="w-1/2">
                <Text className="text-xs text-gray-500 mb-1">Food</Text>
                <Text className="text-gray-900 font-bold">
                  {property.food_available === null
                    ? "Not specified"
                    : property.food_available
                    ? "Included"
                    : "Not included"}
                </Text>
              </View>
              <View className="w-1/2 pr-3">
                <Text className="text-xs text-gray-500 mb-1">Accommodation preference</Text>
                <Text className="text-gray-900 font-bold">
                  {property.gender_preference === "any"
                    ? "Any"
                    : property.gender_preference === "male"
                    ? "Men"
                    : "Women"}
                </Text>
              </View>
            </View>

            {property.amenities.length > 0 && (
              <View className="mt-4">
                <Text className="text-sm font-bold text-gray-900 mb-2">Amenities</Text>
                <View className="flex-row flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <View key={amenity} className="rounded-full bg-white border border-gray-200 px-3 py-1.5">
                      <Text className="text-xs text-gray-700">{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {property.house_rules.trim().length > 0 && (
              <View className="mt-4">
                <Text className="text-sm font-bold text-gray-900 mb-1">House rules</Text>
                <Text className="text-sm text-gray-600 leading-5">{property.house_rules}</Text>
              </View>
            )}
          </View>

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
          {mapUrl ? (
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/(root)/property/map",
                  params: {
                    latitude: String(latitude),
                    longitude: String(longitude),
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
                <Text className="text-gray-600 text-xs font-medium">
                  Tap to expand
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-6">
              <Text className="text-sm text-gray-500">
                Map location has not been added for this listing yet.
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
              {property.owner_whatsapp ? "Contact Owner / Manager" : "Contact PGFinders"}
            </Text>
          </TouchableOpacity>

          {/* Admin Actions */}
          {isAdmin && (
            <View className="flex-row flex-wrap gap-3">
              <TouchableOpacity
                onPress={handleToggleFeatured}
                className="flex-1 flex-row items-center justify-center gap-2 bg-blue-50 py-4 rounded-2xl border border-blue-200"
              >
                <Ionicons
                  name={property.is_featured ? "star" : "star-outline"}
                  size={18}
                  color="#2563EB"
                />
                <Text className="text-blue-700 font-semibold">
                  {property.is_featured ? "Unfeature" : "Feature PG"}
                </Text>
              </TouchableOpacity>
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
                    Mark Unavailable
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
      {property.images.length > 0 && (
        <ImageViewer
          images={property.images.map((uri) => ({ uri }))}
          imageIndex={activeIndex}
          visible={imageViewerVisible}
          onRequestClose={() => {
            setImageViewerVisible(false);
          }}
        />
      )}
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