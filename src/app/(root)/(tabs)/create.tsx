import { useSuperbase } from "../../../../hooks/useSuperbase";
import { useUser } from "@clerk/expo";
import { useUserStore } from "../../../../store/userStore";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
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

const TYPES = ["single_room", "double_sharing", "triple_sharing", "private_room", "hostel"] as const;
const TYPE_LABELS: Record<PropertyType, string> = {
  single_room: "Single Room",
  double_sharing: "Double Sharing",
  triple_sharing: "Triple Sharing",
  private_room: "Private Room",
  hostel: "Hostel",
};
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
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  areaSqft: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  images: string[];
  localImages: string[];
}

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  price: "",
  type: "single_room",
  bedrooms: 1,
  bathrooms: 1,
  areaSqft: "",
  address: "",
  city: "",
  latitude: "",
  longitude: "",
  images: [],
  localImages: [],
};

export default function CreatePropertyScreen() {
  const router = useRouter();
  const authSupabase = useSuperbase();
  const { user } = useUser();
  const isAdmin = useUserStore((state) => state.isAdmin);
  const isAdminLoaded = useUserStore((state) => state.isAdminLoaded);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const updateForm = (fields: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  // ─── Image Picker ──────────────────────────────────────────
  const handlePickImages = async () => {
    const remaining = 6 - form.images.length;
    if (remaining <= 0) {
      Alert.alert("Photo limit reached", "A PG listing can have at most 6 photos.");
      return;
    }
    if (!user?.id) {
      Alert.alert("Sign in required", "Please sign in again before uploading photos.");
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
      selectionLimit: remaining,
    });

    if (result.canceled) return;

    setUploadingImages(true);

    const uploadedUrls: string[] = [];
    const previewUris: string[] = [];

    try {
      for (const asset of result.assets.slice(0, remaining)) {
        try {
          const mimeType = asset.mimeType || "image/jpeg";
          const extension = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
          const filename = `${user.id}/property_${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;

          if (!asset.base64) {
            throw new Error("The selected image could not be read. Please choose another photo.");
          }

          const buffer = Uint8Array.from(atob(asset.base64), (c) => c.charCodeAt(0));
          const { error } = await authSupabase.storage
            .from("property-images")
            .upload(filename, buffer, { contentType: mimeType, upsert: false });
          if (error) throw error;

          const { data: urlData } = authSupabase.storage
            .from("property-images")
            .getPublicUrl(filename);
          uploadedUrls.push(urlData.publicUrl);
          previewUris.push(asset.uri);
        } catch (err) {
          console.error("Upload error:", err);
          Alert.alert("Upload Failed", "One or more images failed to upload.");
        }
      }

      updateForm({
        images: [...form.images, ...uploadedUrls].slice(0, 6),
        localImages: [...form.localImages, ...previewUris].slice(0, 6),
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = form.images[index];
    const storagePrefix = "/storage/v1/object/public/property-images/";
    const encodedPath = imageUrl?.split(storagePrefix)[1];
    if (encodedPath) {
      const { error } = await authSupabase.storage
        .from("property-images")
        .remove([decodeURIComponent(encodedPath)]);
      if (error) console.warn("Could not remove unused listing photo:", error);
    }

    updateForm({
      images: form.images.filter((_, i) => i !== index),
      localImages: form.localImages.filter((_, i) => i !== index),
    });
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
      Alert.alert("Not authorised", "Only approved PGFinders admins can publish listings.");
      return;
    }
    if (!form.title.trim())
      return Alert.alert("Validation", "Title is required.");

    if (!form.price.trim())
      return Alert.alert("Validation", "Monthly rent is required.");

    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum < MIN_PRICE)
      return Alert.alert("Validation", "Monthly rent must be greater than ₹0.");
    if (priceNum > MAX_PRICE)
      return Alert.alert(
        "Validation",
        `Monthly rent cannot exceed ₹${MAX_PRICE.toLocaleString("en-IN")}.`
      );

    if (!form.address.trim())
      return Alert.alert("Validation", "Address is required.");
    if (!form.city.trim())
      return Alert.alert("Validation", "City is required.");
    if (form.images.length === 0)
      return Alert.alert("Validation", "Please upload at least one image.");
    if (form.images.length > 6)
      return Alert.alert("Validation", "A PG listing can have at most 6 photos.");

    const areaNum = form.areaSqft.trim() ? Number(form.areaSqft) : null;
    if (areaNum !== null && (!Number.isFinite(areaNum) || areaNum <= 0))
      return Alert.alert("Validation", "Area must be a positive number.");

    const latitudeNum = form.latitude.trim() ? Number(form.latitude) : null;
    const longitudeNum = form.longitude.trim() ? Number(form.longitude) : null;
    if ((latitudeNum === null) !== (longitudeNum === null))
      return Alert.alert("Validation", "Enter both latitude and longitude, or leave both blank.");
    if (latitudeNum !== null && longitudeNum !== null &&
      (!Number.isFinite(latitudeNum) || !Number.isFinite(longitudeNum) ||
       latitudeNum < -90 || latitudeNum > 90 || longitudeNum < -180 || longitudeNum > 180))
      return Alert.alert("Validation", "Enter valid latitude and longitude values.");

    setSubmitting(true);
    try {
      const { error } = await authSupabase.from("properties").insert({
        listing_kind: "pg",
        title: form.title.trim(),
        description: form.description.trim(),
        price: priceNum,
        type: form.type,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        area_sqft: areaNum,
        address: form.address.trim(),
        city: form.city.trim(),
        latitude: latitudeNum,
        longitude: longitudeNum,
        images: form.images,
        is_featured: false,
        is_sold: false,
      });

      if (error) throw error;

      setForm(INITIAL_FORM);
      Alert.alert("Published! 🎉", "Your PG listing has been published.", [
        { text: "OK", onPress: () => router.replace("/(root)/(tabs)") },
      ]);
    } catch (error) {
      console.error("Failed to create PG listing:", error);
      Alert.alert("Error", "Failed to publish the PG listing. Please try again.");
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



  if (!isAdminLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }
  if (!isAdmin) return <Redirect href="/(root)/(tabs)" />;

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
            <Text className={labelClass}>Title</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. Furnished single room near NSUT"
              placeholderTextColor="#9CA3AF"
              value={form.title}
              onChangeText={(v) => updateForm({ title: v })}
            />
          </View>

          <View className={sectionClass}>
            <Text className={labelClass}>Description</Text>
            <TextInput
              className={`${inputClass} h-24`}
              placeholder="Describe the property..."
              placeholderTextColor="#9CA3AF"
              value={form.description}
              onChangeText={(v) => updateForm({ description: v })}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Price */}
          <View className={sectionClass}>
            <Text className={labelClass}>Monthly Rent (₹/month)</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 12000"
              placeholderTextColor="#9CA3AF"
              value={form.price}
              onChangeText={(v) => updateForm({ price: v })}
              keyboardType="numeric"
            />
            <Text className="text-xs text-gray-400 mt-1.5 ml-1">
              Valid monthly rent: ₹1 – ₹{MAX_PRICE.toLocaleString("en-IN")}
            </Text>
          </View>

          {/* PG Stay Type */}
          <View className={sectionClass}>
            <Text className={labelClass}>Room / Stay Type</Text>
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
                    {TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
          <Text className="text-xs text-gray-500 mb-3">
            Use device location only when you are physically at the PG. Otherwise, enter the
            PG's coordinates manually or leave them blank.
          </Text>
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
                  {detectingLocation ? "Detecting..." : "Detect Location"}
                </Text>
              </TouchableOpacity>
            </View>

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
                List Property
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}