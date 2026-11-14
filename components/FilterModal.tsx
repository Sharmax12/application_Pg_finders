import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  useFilterStore,
  type GenderPreference,
  type PropertySort,
  type PropertyType,
} from "../store/filterStore";

const TYPES: { label: string; value: PropertyType }[] = [
  { label: "All rooms", value: null },
  { label: "Single room", value: "single_room" },
  { label: "Shared room", value: "shared_room" },
  { label: "Private room", value: "private_room" },
  { label: "Entire PG", value: "entire_pg" },
];

const BEDS = [
  { label: "Any", value: null },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4+", value: 4 },
];

const PRICE_PRESETS = [
  { label: "Under ₹5k/mo", min: null, max: 5000 },
  { label: "₹5k–₹10k/mo", min: 5000, max: 10000 },
  { label: "₹10k–₹20k/mo", min: 10000, max: 20000 },
  { label: "Above ₹20k/mo", min: 20000, max: null },
];

const FOOD_OPTIONS: { label: string; value: boolean | null }[] = [
  { label: "Any", value: null },
  { label: "Included", value: true },
  { label: "Not included", value: false },
];

const PREFERENCE_OPTIONS: { label: string; value: GenderPreference }[] = [
  { label: "Any PG", value: null },
  { label: "Women", value: "female" },
  { label: "Men", value: "male" },
];

const SORT_OPTIONS: { label: string; value: PropertySort }[] = [
  { label: "Newest", value: "newest" },
  { label: "Rent: low to high", value: "rent_low_to_high" },
  { label: "Rent: high to low", value: "rent_high_to_low" },
];

const chip = (active: boolean) =>
  `px-4 py-2 rounded-full border ${
    active ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
  }`;

const chipText = (active: boolean) =>
  `text-sm font-semibold ${active ? "text-white" : "text-gray-600"}`;

export default function FilterModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {
    type,
    bedrooms,
    minPrice,
    maxPrice,
    foodIncluded,
    genderPreference,
    sortBy,
    setType,
    setBedrooms,
    setMinPrice,
    setMaxPrice,
    setFoodIncluded,
    setGenderPreference,
    setSortBy,
    resetFacets,
  } = useFilterStore();

  const [priceDraft, setPriceDraft] = useState<{
    baseMin: number | null;
    baseMax: number | null;
    localMin: string;
    localMax: string;
  } | null>(null);
  const [facetDraft, setFacetDraft] = useState<{
    baseKey: string;
    type: PropertyType;
    bedrooms: number | null;
    foodIncluded: boolean | null;
    genderPreference: GenderPreference;
    sortBy: PropertySort;
  } | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const appliedFacetKey = JSON.stringify([
    type,
    bedrooms,
    foodIncluded,
    genderPreference,
    sortBy,
  ]);
  const currentFacetDraft =
    facetDraft?.baseKey === appliedFacetKey
      ? facetDraft
      : {
          baseKey: appliedFacetKey,
          type,
          bedrooms,
          foodIncluded,
          genderPreference,
          sortBy,
        };
  const currentDraft =
    priceDraft?.baseMin === minPrice && priceDraft?.baseMax === maxPrice
      ? priceDraft
      : null;

  const updateFacetDraft = (
    values: Partial<
      Pick<
        typeof currentFacetDraft,
        "type" | "bedrooms" | "foodIncluded" | "genderPreference" | "sortBy"
      >
    >
  ) => {
    setFacetDraft({ ...currentFacetDraft, ...values });
  };
  const localMin =
    currentDraft?.localMin ?? (minPrice !== null ? String(minPrice) : "");
  const localMax =
    currentDraft?.localMax ?? (maxPrice !== null ? String(maxPrice) : "");

  const setLocalMin = (value: string) => {
    setPriceDraft({
      baseMin: minPrice,
      baseMax: maxPrice,
      localMin: value,
      localMax,
    });
    setPriceError(null);
  };
  const setLocalMax = (value: string) => {
    setPriceDraft({
      baseMin: minPrice,
      baseMax: maxPrice,
      localMin,
      localMax: value,
    });
    setPriceError(null);
  };

  const activeCount = [
    type !== null,
    bedrooms !== null,
    minPrice !== null,
    maxPrice !== null,
    foodIncluded !== null,
    genderPreference !== null,
    sortBy !== "newest",
  ].filter(Boolean).length;

  const handleClose = () => {
    setPriceDraft(null);
    setFacetDraft(null);
    setPriceError(null);
    onClose();
  };

  const handleApply = () => {
    const min = localMin.trim() ? Number(localMin) : null;
    const max = localMax.trim() ? Number(localMax) : null;

    if (
      (min !== null && (!Number.isFinite(min) || min < 0)) ||
      (max !== null && (!Number.isFinite(max) || max < 0))
    ) {
      setPriceError("Enter rent amounts of ₹0 or more.");
      return;
    }
    if (min !== null && max !== null && min > max) {
      setPriceError("Minimum rent must not be higher than maximum rent.");
      return;
    }

    setPriceError(null);
    setType(currentFacetDraft.type);
    setBedrooms(currentFacetDraft.bedrooms);
    setMinPrice(min);
    setMaxPrice(max);
    setFoodIncluded(currentFacetDraft.foodIncluded);
    setGenderPreference(currentFacetDraft.genderPreference);
    setSortBy(currentFacetDraft.sortBy);
    handleClose();
  };

  const handleReset = () => {
    setPriceDraft(null);
    setPriceError(null);
    setFacetDraft(null);
    resetFacets();
    handleClose();
  };

  const shadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={handleClose} className="p-1">
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text className="text-blue-600 font-semibold text-sm">Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Room Type */}
          <Text className="text-base font-bold text-gray-800 mb-3">
            Room Type
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {TYPES.map((item) => (
              <TouchableOpacity
                key={String(item.value)}
                accessibilityRole="button"
                onPress={() => updateFacetDraft({ type: item.value })}
                className={chip(currentFacetDraft.type === item.value)}
                style={shadow}
              >
                <Text className={chipText(currentFacetDraft.type === item.value)}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bedrooms */}
          <Text className="text-base font-bold text-gray-800 mb-3">
            Bedrooms at the property
          </Text>
          <View className="flex-row gap-2 mb-6">
            {BEDS.map((item) => (
              <TouchableOpacity
                key={String(item.value)}
                accessibilityRole="button"
                onPress={() => updateFacetDraft({ bedrooms: item.value })}
                className={`flex-1 items-center py-3 rounded-2xl border ${
                  currentFacetDraft.bedrooms === item.value
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-200"
                }`}
                style={shadow}
              >
                <Text
                  className={`text-sm font-bold ${
                    currentFacetDraft.bedrooms === item.value ? "text-white" : "text-gray-600"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-base font-bold text-gray-800 mb-3">
            Food arrangement
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {FOOD_OPTIONS.map((item) => (
              <TouchableOpacity
                key={String(item.value)}
                accessibilityRole="button"
                onPress={() => updateFacetDraft({ foodIncluded: item.value })}
                className={chip(currentFacetDraft.foodIncluded === item.value)}
                style={shadow}
              >
                <Text className={chipText(currentFacetDraft.foodIncluded === item.value)}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-base font-bold text-gray-800 mb-3">
            PG preference
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {PREFERENCE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={String(item.value)}
                accessibilityRole="button"
                onPress={() => updateFacetDraft({ genderPreference: item.value })}
                className={chip(currentFacetDraft.genderPreference === item.value)}
                style={shadow}
              >
                <Text className={chipText(currentFacetDraft.genderPreference === item.value)}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Monthly Rent */}
          <Text className="text-base font-bold text-gray-800 mb-3">
            Monthly Rent (₹)
          </Text>
          <View className="flex-row gap-3 mb-3">
            {[
              {
                label: "Min rent",
                value: localMin,
                onChange: setLocalMin,
                placeholder: "0",
              },
              {
                label: "Max rent",
                value: localMax,
                onChange: setLocalMax,
                placeholder: "Any",
              },
            ].map(({ label, value, onChange, placeholder }) => (
              <View key={label} className="flex-1">
                <Text className="text-xs text-gray-500 mb-1.5 font-medium">
                  {label}
                </Text>
                <View
                  className="flex-row items-center bg-white rounded-2xl px-3 border border-gray-200"
                  style={shadow}
                >
                  <Text className="text-gray-400 text-sm mr-1">₹</Text>
                  <TextInput
                    className="flex-1 py-3 text-gray-800"
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              </View>
            ))}
          </View>
          {priceError && (
            <Text accessibilityRole="alert" className="mb-3 text-sm text-red-600">
              {priceError}
            </Text>
          )}

          {/* Price Presets */}
          <View className="flex-row flex-wrap gap-2">
            {PRICE_PRESETS.map((p) => {
              const draftMin = localMin.trim() ? Number(localMin) : null;
              const draftMax = localMax.trim() ? Number(localMax) : null;
              const active = draftMin === p.min && draftMax === p.max;
              return (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => {
                    setLocalMin(p.min ? String(p.min) : "");
                    setLocalMax(p.max ? String(p.max) : "");
                    setPriceError(null);
                  }}
                  className={`px-3 py-1.5 rounded-full border ${
                    active
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      active ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="mt-6 text-base font-bold text-gray-800 mb-3">
            Sort results
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SORT_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.value}
                accessibilityRole="button"
                onPress={() => updateFacetDraft({ sortBy: item.value })}
                className={chip(currentFacetDraft.sortBy === item.value)}
                style={shadow}
              >
                <Text className={chipText(currentFacetDraft.sortBy === item.value)}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View className="px-5 pb-8 pt-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleApply}
            className="bg-blue-600 rounded-2xl py-4 items-center"
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-base">
              Apply Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
