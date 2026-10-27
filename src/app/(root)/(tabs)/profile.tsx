import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { isLoaded, user } = useUser();
  const { signOut } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
  }, [user?.id, user?.firstName, user?.lastName]);

  if (!isLoaded || !user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-3 text-sm text-gray-500">Loading your profile…</Text>
      </View>
    );
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "No email address";

  const handleSave = async () => {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName) {
      Alert.alert("First name required", "Enter a first name to update your profile.");
      return;
    }

    setSaving(true);
    try {
      await user.update({
        firstName: cleanFirstName,
        lastName: cleanLastName,
      });
      Alert.alert("Profile updated", "Your name has been saved.");
    } catch (error) {
      console.error("Failed to update Clerk profile:", error);
      Alert.alert(
        "Unable to update profile",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
      Alert.alert(
        "Unable to sign out",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSigningOut(false);
    }
  };

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Your profile";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-gray-900">Your profile</Text>
        <Text className="mt-1 text-sm text-gray-500">
          Keep your account details up to date.
        </Text>

        <View className="mt-6 items-center rounded-3xl bg-white px-5 py-7">
          {user.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              className="h-24 w-24 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="person" size={38} color="#2563EB" />
            </View>
          )}
          <Text className="mt-4 text-lg font-bold text-gray-900">
            {displayName}
          </Text>
          <Text className="mt-1 text-sm text-gray-500">{email}</Text>
        </View>

        <View className="mt-6 rounded-3xl bg-white p-5">
          <Text className="text-base font-bold text-gray-900">Personal details</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Your name is managed by your sign-in account.
          </Text>

          <Text className="mb-2 mt-5 text-sm font-semibold text-gray-700">
            First name
          </Text>
          <TextInput
            accessibilityLabel="First name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
          />

          <Text className="mb-2 mt-4 text-sm font-semibold text-gray-700">
            Last name
          </Text>
          <TextInput
            accessibilityLabel="Last name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
          />

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => void handleSave()}
            disabled={saving}
            className="mt-5 items-center rounded-2xl bg-blue-600 py-4"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-bold text-white">Save changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-6 rounded-3xl bg-white p-5">
          <Text className="text-base font-bold text-gray-900">Account</Text>
          <View className="mt-4 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Ionicons name="mail-outline" size={18} color="#4B5563" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500">Email address</Text>
              <Text className="mt-1 text-sm font-medium text-gray-900">{email}</Text>
            </View>
          </View>
          <View className="mt-4 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Ionicons name="calendar-outline" size={18} color="#4B5563" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500">Member since</Text>
              <Text className="mt-1 text-sm font-medium text-gray-900">
                {user.createdAt ? user.createdAt.toLocaleDateString() : "—"}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => void handleSignOut()}
          disabled={signingOut}
          className="mt-6 flex-row items-center justify-center rounded-2xl border border-red-100 bg-white py-4"
        >
          {signingOut ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color="#DC2626" />
              <Text className="ml-2 font-semibold text-red-600">Sign out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
