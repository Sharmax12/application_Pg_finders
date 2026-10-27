import { useSuperbase } from "../../../../hooks/useSuperbase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useUserStore } from "../../../../store/userStore";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPES = ["single_room", "shared_room", "private_room", "entire_pg"] as const;
type PropertyType = (typeof TYPES)[number];

const MIN_PRICE = 1;
const MAX_PRICE = 999_999_999;

const inputClass =
  "bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-800";
const labelClass = "text-sm font-semibold text-gray-700 mb-1.5";
const sectionClass = "mb-5";

interface FormState {
  title: string;
  description: string;
  price: string;
  securityDeposit: string;
  genderPreference: "any" | "male" | "female";
  foodIncluded: boolean;
  amenities: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  areaSqft: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  isFeatured: boolean;
  images: string[];
  localImages: string[];
}

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  price: "",
  securityDeposit: "",
  genderPreference: "any",
  foodIncluded: false,
  amenities: "",
  type: "private_room",
  bedrooms: 1,
  bathrooms: 1,
  areaSqft: "",
  address: "",
  city: "",
  latitude: "",
  longitude: "",
  isFeatured: false,
  images: [],
  localImages: [],
};

export default function CreatePropertyScreen() {
  const router = useRouter();
  const authSupabase = useSuperbase();
  const isAdmin = useUserStore((state) => state.isAdmin);
  const isAdminLoaded = useUserStore((state) => state.isAdminLoaded);
  const pendingImagePaths = useRef<Record<string, string>>({});
  const listingSaved = useRef(false);

  useEffect(() => {
    return () => {
      if (listingSaved.current) return;
      const paths = Object.values(pendingImagePaths.current);
      if (paths.length > 0) {
        void authSupabase.storage.from("property-images").remove(paths).catch((error) => {
          console.warn("Could not clean up unused listing photos:", error);
        });
      }
    };
  }, [authSupabase]);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const updateForm = (fields: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  // ─── Image Picker ──────────────────────────────────────────
  const handlePickImages = async () => {
    const remainingSlots = Math.max(0, 6 - form.images.length);
    if (remainingSlots === 0) {
      Alert.alert("Photo limit reached", "Choose up to six photos per listing.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
      selectionLimit: remainingSlots,
    });

    if (result.canceled) return;

    setUploadingImages(true);

    const uploadedUrls: string[] = [];
    const previewUris: string[] = [];

    for (const asset of result.assets.slice(0, remainingSlots)) {
      try {
        const mimeType = asset.mimeType?.startsWith("image/")
          ? asset.mimeType
          : "image/jpeg";
        const extension = (mimeType.split("/")[1] ?? "jpeg")
          .replace("jpeg", "jpg")
          .replace(/[^a-z0-9]/gi, "") || "jpg";
        const filename = `property_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

        if (!asset.base64) throw new Error("Image data was not available");
        const buffer = Uint8Array.from(atob(asset.base64), (c) => c.charCodeAt(0));

        const { error } = await authSupabase.storage
          .from("property-images")
          .upload(filename, buffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = authSupabase.storage
          .from("property-images")
          .getPublicUrl(filename);

        uploadedUrls.push(urlData.publicUrl);
        pendingImagePaths.current[urlData.publicUrl] = filename;
        previewUris.push(asset.uri);
      } catch (err) {
        console.error("Upload error:", err);
        Alert.alert("Upload Failed", "One or more images failed to upload.");
      }
    }

    updateForm({
      images: [...form.images, ...uploadedUrls],
      localImages: [...form.localImages, ...previewUris],
    });
    setUploadingImages(false);
  };

  const handleRemoveImage = (index: number) => {
    const imageUrl = form.images[index];
    const publicUrlMarker = "/storage/v1/object/public/property-images/";
    const objectPath = imageUrl?.includes(publicUrlMarker)
      ? decodeURIComponent(imageUrl.split(publicUrlMarker)[1]?.split("?")[0] ?? "")
      : "";
    if (imageUrl) delete pendingImagePaths.current[imageUrl];

    updateForm({
      images: form.images.filter((_, i) => i !== index),
      localImages: form.localImages.filter((_, i) => i !== index),
    });

    if (objectPath) {
      void authSupabase.storage.from("property-images").remove([objectPath]).then(({ error }) => {
        if (error) console.warn("Could not remove unused property image:", error.message);
      }).catch((error) => console.warn("Could not remove unused property image:", error));
    }
  };

  // ─── Location Detection ────────────────────────────────────
  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to detect coordinates."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      updateForm({
        latitude: String(location.coords.latitude),
        longitude: String(location.coords.longitude),
      });
    } catch (err) {
      Alert.alert("Error", "Could not detect location. Enter manually.");
    } finally {
      setDetectingLocation(false);
    }
  };

  // ─── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isAdminLoaded || !isAdmin) {
      Alert.alert("Not authorized", "Only authorized listing administrators can create listings.");
      return;
    }

    if (!form.title.trim())
      return Alert.alert("Validation", "Title is required.");
    if (!form.price.trim())
      return Alert.alert("Validation", "Price is required.");

    const priceNum = Number(form.price);
    if (!Number.isFinite(priceNum) || priceNum < MIN_PRICE)
      return Alert.alert("Validation", "Price must be greater than ₹0.");
    if (priceNum > MAX_PRICE)
      return Alert.alert(
        "Validation",
        `Price cannot exceed ₹${MAX_PRICE.toLocaleString("en-IN")}.`
      );

    if (!form.address.trim())
      return Alert.alert("Validation", "Address is required.");
    if (!form.city.trim())
      return Alert.alert("Validation", "City is required.");
    if (form.images.length === 0)
      return Alert.alert("Validation", "Please upload at least one image.");
    if (form.images.length > 6)
      return Alert.alert("Validation", "A listing can have no more than six photos.");

    const depositNum = form.securityDeposit.trim() ? Number(form.securityDeposit) : 0;
    if (
      !Number.isFinite(depositNum) ||
      depositNum < 0 ||
      depositNum > MAX_PRICE
    ) {
      return Alert.alert("Validation", "Security deposit must be a valid non-negative amount.");
    }

    const areaNum = form.areaSqft.trim() ? Number(form.areaSqft) : null;
    if (areaNum !== null && (!Number.isFinite(areaNum) || areaNum <= 0))
      return Alert.alert("Validation", "Area must be a positive number.");

    const hasLatitude = form.latitude.trim() !== "";
    const hasLongitude = form.longitude.trim() !== "";
    if (hasLatitude !== hasLongitude)
      return Alert.alert("Validation", "Enter both latitude and longitude, or leave both empty.");

    const latitudeNum = hasLatitude ? Number(form.latitude) : null;
    const longitudeNum = hasLongitude ? Number(form.longitude) : null;
    if (
      (latitudeNum !== null &&
        (!Number.isFinite(latitudeNum) || latitudeNum < -90 || latitudeNum > 90)) ||
      (longitudeNum !== null &&
        (!Number.isFinite(longitudeNum) || longitudeNum < -180 || longitudeNum > 180))
    ) {
      return Alert.alert("Validation", "Enter valid map coordinates.");
    }

    setSubmitting(true);
    try {
      const { error } = await authSupabase.from("properties").insert({
        title: form.title.trim(),
        description: form.description.trim(),
        // Keep `price` populated during the transition from the old sale-listing schema.
        price: priceNum,
        type: "studio",
        monthly_rent: priceNum,
        security_deposit: depositNum,
        room_type: form.type,
        gender_preference: form.genderPreference,
        food_included: form.foodIncluded,
        amenities: form.amenities.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 30),
        available_from: null,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        area_sqft: areaNum,
        address: form.address.trim(),
        city: form.city.trim(),
        latitude: latitudeNum,
        longitude: longitudeNum,
        images: form.images,
        // These fields are protected by the admin-only RLS policies as well.
        is_featured: form.isFeatured,
        is_sold: false,
      });

      if (error) throw error;

      listingSaved.current = true;
      pendingImagePaths.current = {};
      setForm(INITIAL_FORM);
      Alert.alert("Success! 🎉", "Property listed successfully.", [
        { text: "OK", onPress: () => router.replace("/(root)/(tabs)") },
      ]);
    } catch (error) {
      console.error("Failed to create property:", error);
      Alert.alert(
        "Unable to create listing",
        "The listing was not saved. Check your connection and administrator access, then try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── UI Helpers ────────────────────────────────────────────
  const Counter = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <View className="flex-1">
      <Text className={labelClass}>{label}</Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <TouchableOpacity
          onPress={() => onChange(Math.max(1, value - 1))}
          className="w-11 h-11 items-center justify-center"
        >
          <Ionicons name="remove" size={18} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-gray-800 font-bold text-base">
          {value}
        </Text>
        <TouchableOpacity
          onPress={() => onChange(value + 1)}
          className="w-11 h-11 items-center justify-center"
        >
          <Ionicons name="add" size={18} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const Toggle = ({
    label,
    value,
    onChange,
    description,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
    description?: string;
  }) => (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      className={`flex-row items-center justify-between p-4 rounded-2xl border ${
        value ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
      }`}
    >
      <View className="flex-1 mr-3">
        <Text
          className={`font-semibold ${
            value ? "text-blue-700" : "text-gray-700"
          }`}
        >
          {label}
        </Text>
        {description && (
          <Text className="text-xs text-gray-400 mt-0.5">{description}</Text>
        )}
      </View>
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
          value ? "bg-blue-600 border-blue-600" : "border-gray-300"
        }`}
      >
        {value && <Ionicons name="checkmark" size={14} color="white" />}
      </View>
    </TouchableOpacity>
  );

  if (!isAdminLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="shield-checkmark-outline" size={42} color="#6B7280" />
        <Text className="mt-4 text-lg font-bold text-gray-900">Administrator access required</Text>
        <Text className="mt-2 text-center text-sm text-gray-500">
          Listing creation is restricted to authorized PGFinders administrators.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(root)/(tabs)")}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3"
        >
          <Text className="font-semibold text-white">Back to home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-3">
          <Text className="text-2xl font-bold text-gray-900 flex-1">
            Add PG Listing
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Images */}
          <View className={sectionClass}>
            <Text className={labelClass}>
              Photos{" "}
              <Text className="text-gray-400 font-normal">(up to 6)</Text>
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {form.localImages.map((uri, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri }}
                    className="w-24 h-24 rounded-2xl"
                    resizeMode="cover"
                  />
                  {index === 0 && (
                    <View className="absolute top-1 left-1 bg-blue-600 px-1.5 py-0.5 rounded-full">
                      <Text className="text-white text-[9px] font-bold">
                        COVER
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={11} color="white" />
                  </TouchableOpacity>
                </View>
              ))}

              {form.localImages.length < 6 && (
                <TouchableOpacity
                  onPress={handlePickImages}
                  disabled={uploadingImages}
                  className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-gray-300 items-center justify-center"
                >
                  {uploadingImages ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <>
                      <Ionicons
                        name="camera-outline"
                        size={22}
                        color="#9CA3AF"
                      />
                      <Text className="text-gray-400 text-xs mt-1">Add</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Basic Info */}
          <View className={sectionClass}>
            <Text className={labelClass}>PG listing title</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. Furnished PG near NSUT"
              placeholderTextColor="#9CA3AF"
              value={form.title}
              onChangeText={(v) => updateForm({ title: v })}
            />
          </View>

          <View className={sectionClass}>
            <Text className={labelClass}>Description</Text>
            <TextInput
              className={`${inputClass} h-24`}
              placeholder="Describe the room, food, house rules, timings, and nearby landmarks..."
              placeholderTextColor="#9CA3AF"
              value={form.description}
              onChangeText={(v) => updateForm({ description: v })}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Price */}
          <View className={sectionClass}>
            <Text className={labelClass}>Monthly rent (₹)</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 15000 (monthly rent)"
              placeholderTextColor="#9CA3AF"
              value={form.price}
              onChangeText={(v) => updateForm({ price: v })}
              keyboardType="numeric"
            />
            <Text className="text-xs text-gray-400 mt-1.5 ml-1">
              Valid range: ₹1 – ₹{MAX_PRICE.toLocaleString("en-IN")}
            </Text>
          </View>

          <View className={sectionClass}>
            <Text className={labelClass}>Security deposit (₹)</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 10000 (optional)"
              placeholderTextColor="#9CA3AF"
              value={form.securityDeposit}
              onChangeText={(v) => updateForm({ securityDeposit: v })}
              keyboardType="numeric"
            />
          </View>

          {/* Property Type */}
          <View className={sectionClass}>
            <Text className={labelClass}>Room type</Text>
            <View className="flex-row flex-wrap gap-2">
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => updateForm({ type: t })}
                  className={`px-4 py-2 rounded-full border ${
                    form.type === t
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${
                      form.type === t ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {t.replace(/_/g, " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className={sectionClass}>
            <Text className={labelClass}>Preferred residents</Text>
            <View className="flex-row flex-wrap gap-2">
              {(["any", "male", "female"] as const).map((preference) => (
                <TouchableOpacity
                  key={preference}
                  onPress={() => updateForm({ genderPreference: preference })}
                  className={`px-4 py-2 rounded-full border ${
                    form.genderPreference === preference
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text className={`text-sm font-semibold capitalize ${
                    form.genderPreference === preference ? "text-white" : "text-gray-600"
                  }`}>
                    {preference === "any" ? "Any" : preference === "male" ? "Men" : "Women"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className={sectionClass}>
            <Toggle
              label="Food included"
              description="Meals are included in the monthly rent"
              value={form.foodIncluded}
              onChange={(v) => updateForm({ foodIncluded: v })}
            />
          </View>

          <View className={sectionClass}>
            <Text className={labelClass}>Amenities (comma-separated)</Text>
            <TextInput
              className={inputClass}
              placeholder="Wi-Fi, laundry, AC, attached bathroom"
              placeholderTextColor="#9CA3AF"
              value={form.amenities}
              onChangeText={(v) => updateForm({ amenities: v })}
              maxLength={1000}
            />
          </View>

          {/* Bedrooms / Bathrooms */}
          <View className="flex-row gap-4 mb-5">
            <Counter
              label="Bedrooms"
              value={form.bedrooms}
              onChange={(v) => updateForm({ bedrooms: v })}
            />
            <Counter
              label="Bathrooms"
              value={form.bathrooms}
              onChange={(v) => updateForm({ bathrooms: v })}
            />
          </View>

          <View className={sectionClass}>
            <Text className={labelClass}>Area (sq ft)</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 1200"
              placeholderTextColor="#9CA3AF"
              value={form.areaSqft}
              onChangeText={(v) => updateForm({ areaSqft: v })}
              keyboardType="numeric"
            />
          </View>

          {/* Location */}
          <View className={sectionClass}>
            <Text className={labelClass}>Address</Text>
            <TextInput
              className={inputClass}
              placeholder="Street address"
              placeholderTextColor="#9CA3AF"
              value={form.address}
              onChangeText={(v) => updateForm({ address: v })}
            />
          </View>

          <View className={sectionClass}>
            <Text className={labelClass}>City</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. Mumbai"
              placeholderTextColor="#9CA3AF"
              value={form.city}
              onChangeText={(v) => updateForm({ city: v })}
            />
          </View>

          {/* Coordinates */}
          <View className={sectionClass}>
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className={labelClass}>Coordinates</Text>
              <TouchableOpacity
                onPress={handleDetectLocation}
                disabled={detectingLocation}
                className="flex-row items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full"
              >
                {detectingLocation ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Ionicons name="locate-outline" size={13} color="#2563EB" />
                )}
                <Text className="text-blue-600 text-xs font-semibold">
                  {detectingLocation ? "Detecting..." : "Use current location"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-gray-400 mb-2">Use current location only when you are physically at the PG; otherwise enter the PG’s coordinates manually.</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextInput
                  className={inputClass}
                  placeholder="Latitude"
                  placeholderTextColor="#9CA3AF"
                  value={form.latitude}
                  onChangeText={(v) => updateForm({ latitude: v })}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <TextInput
                  className={inputClass}
                  placeholder="Longitude"
                  placeholderTextColor="#9CA3AF"
                  value={form.longitude}
                  onChangeText={(v) => updateForm({ longitude: v })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Toggles */}
          <View className="gap-3 mb-5">
            <Toggle
              label="Featured Property"
              description="Show this in the Featured section on home"
              value={form.isFeatured}
              onChange={(v) => updateForm({ isFeatured: v })}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || uploadingImages}
            className="bg-blue-600 rounded-2xl py-4 items-center"
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              opacity: submitting || uploadingImages ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Publish PG Listing
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}