import { useAuth, useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSignUpPress = async () => {
    setFormError(null);
    try {
      const { error } = await signUp.password({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });
      if (error) {
        setFormError(error.message);
        return;
      }

      const { error: verificationError } =
        await signUp.verifications.sendEmailCode();
      if (verificationError) {
        setFormError(verificationError.message);
        return;
      }

      setVerificationSent(true);
    } catch (error) {
      console.error("Sign-up failed:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Sign-up failed unexpectedly. Please try again."
      );
    }
  };

  const onVerifyPress = async () => {
    setFormError(null);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) {
        setFormError(error.message);
        return;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log(session.currentTask);
              return;
            }
            router.replace(decorateUrl("/") as any);
          },
        });
      } else {
        setVerificationSent(false);
        const missingFields = signUp.missingFields.join(", ");
        setFormError(
          missingFields
            ? `Email verified, but sign-up still requires: ${missingFields}.`
            : `Email verification did not complete sign-up (status: ${signUp.status ?? "unknown"}).`
        );
      }
    } catch (error) {
      console.error("Email verification failed:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Email verification failed unexpectedly. Please try again."
      );
    }
  };

  const isLoading = fetchStatus === "fetching";

  if (isSignedIn) {
    return null;
  }

  // OTP verification screen
  if (
    verificationSent ||
    (signUp.status === "missing_requirements" &&
      signUp.unverifiedFields.includes("email_address"))
  ) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <Image
          source={require("../../../assets/images/kribb.png")}
          className="w-32 h-16 mb-8"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Verify your account
        </Text>
        <Text className="text-gray-500 mb-8 text-center">
          We sent a code to {email}
        </Text>
        {formError && (
          <Text className="text-red-500 mb-4 text-center">{formError}</Text>
        )}

        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
          placeholder="Enter verification code"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
        {errors.fields.code && (
          <Text className="text-red-500 mb-4">
            {errors.fields.code.message}
          </Text>
        )}

        <TouchableOpacity
          onPress={onVerifyPress}
          disabled={isLoading}
          className="w-full bg-blue-600 py-4 rounded-xl items-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            setFormError(null);
            try {
              const { error } = await signUp.verifications.sendEmailCode();
              if (error) {
                setFormError(error.message);
              }
            } catch (error) {
              console.error("Resending verification code failed:", error);
              setFormError(
                error instanceof Error
                  ? error.message
                  : "Could not resend the verification code. Please try again."
              );
            }
          }}
          className="py-2"
        >
          <Text className="text-blue-600">I need a new code</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => signUp.reset()} className="py-2">
          <Text className="text-blue-600">Start over</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sign up form
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-white"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-6 py-12">
        <Image
          source={require("../../../assets/images/kribb.png")}
          className="w-36 h-16 mb-8"
          resizeMode="contain"
        />
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Create account
        </Text>
        <Text className="text-gray-500 mb-8">Find a PG that feels right</Text>

        <View className="flex-row gap-3 mb-4">
          <TextInput
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
            placeholder="First name"
            placeholderTextColor="#9CA3AF"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextInput
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
            placeholder="Last name"
            placeholderTextColor="#9CA3AF"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </View>

        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
          placeholder="Email address"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.fields.emailAddress && (
          <Text className="text-red-500 mb-4">
            {errors.fields.emailAddress.message}
          </Text>
        )}

        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6"
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.fields.password && (
          <Text className="text-red-500 mb-4">
            {errors.fields.password.message}
          </Text>
        )}
        {formError && <Text className="text-red-500 mb-4">{formError}</Text>}

        <TouchableOpacity
          onPress={onSignUpPress}
          disabled={isLoading}
          className="w-full bg-blue-600 py-4 rounded-xl items-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Sign Up</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-500">Already have an account? </Text>
          <Link href="/sign-in">
            <Text className="text-blue-600 font-semibold">Sign In</Text>
          </Link>
        </View>
        <View className="mt-6 flex-row flex-wrap items-center justify-center">
          <Text className="text-center text-xs leading-5 text-gray-400">By creating an account, you agree to our </Text>
          <Link href="/terms-of-use">
            <Text className="text-xs font-semibold text-blue-600">Terms of Use</Text>
          </Link>
          <Text className="text-xs text-gray-400"> and </Text>
          <Link href="/privacy-policy">
            <Text className="text-xs font-semibold text-blue-600">Privacy Policy</Text>
          </Link>
          <Text className="text-xs text-gray-400">.</Text>
        </View>

        <View nativeID="clerk-captcha" />
      </View>
    </ScrollView>
  );
}