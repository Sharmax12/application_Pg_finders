import { useSignIn } from "@clerk/expo";
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

type VerificationMethod = "first_factor_email" | "mfa_email" | "mfa_phone";

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verificationMethod, setVerificationMethod] =
    useState<VerificationMethod | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const finalizeSignIn = async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.log(session.currentTask);
          return;
        }
        router.replace(decorateUrl("/") as any);
      },
    });
  };

  const onSignInPress = async () => {
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Enter your email address and password.");
      return;
    }

    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });
      if (error) {
        setFormError(error.message);
        return;
      }

      if (signIn.status === "complete") {
        await finalizeSignIn();
      } else if (signIn.status === "needs_first_factor") {
        const emailCodeFactor = signIn.supportedFirstFactors.find(
          (factor) => factor.strategy === "email_code"
        );
        if (!emailCodeFactor) {
          setFormError("Email code verification is not available for this account.");
          return;
        }

        const { error: codeError } = await signIn.emailCode.sendCode();
        if (codeError) {
          setFormError(codeError.message);
          return;
        }
        setVerificationMethod("first_factor_email");
      } else if (signIn.status === "needs_second_factor") {
        const secondFactors = signIn.supportedSecondFactors;
        if (secondFactors.some((factor) => factor.strategy === "email_code")) {
          const { error: codeError } = await signIn.mfa.sendEmailCode();
          if (codeError) {
            setFormError(codeError.message);
            return;
          }
          setVerificationMethod("mfa_email");
        } else if (secondFactors.some((factor) => factor.strategy === "phone_code")) {
          const { error: codeError } = await signIn.mfa.sendPhoneCode();
          if (codeError) {
            setFormError(codeError.message);
            return;
          }
          setVerificationMethod("mfa_phone");
        } else {
          setFormError("No supported verification code method is available.");
        }
      } else if (signIn.status === "needs_client_trust") {
        const emailCodeFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === "email_code"
        );
        if (emailCodeFactor) {
          const { error: codeError } = await signIn.mfa.sendEmailCode();
          if (codeError) {
            setFormError(codeError.message);
            return;
          }
          setVerificationMethod("mfa_email");
        } else {
          setFormError("Email verification is not available for this sign-in.");
        }
      } else {
        setFormError(
          `Sign-in could not continue (status: ${signIn.status ?? "unknown"}).`
        );
      }
    } catch (error) {
      console.error("Sign-in failed:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Sign-in failed unexpectedly. Please try again."
      );
    }
  };

  const onVerifyPress = async () => {
    setFormError(null);

    if (!code.trim()) {
      setFormError("Enter the verification code.");
      return;
    }

    try {
      const result =
        verificationMethod === "first_factor_email"
          ? await signIn.emailCode.verifyCode({ code: code.trim() })
          : verificationMethod === "mfa_phone"
            ? await signIn.mfa.verifyPhoneCode({ code: code.trim() })
            : await signIn.mfa.verifyEmailCode({ code: code.trim() });

      if (result.error) {
        setFormError(result.error.message);
        return;
      }

      if (signIn.status === "complete") {
        await finalizeSignIn();
      } else {
        setFormError(
          `Verification could not complete (status: ${signIn.status ?? "unknown"}).`
        );
      }
    } catch (error) {
      console.error("Sign-in verification failed:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Verification failed unexpectedly. Please try again."
      );
    }
  };

  const onResendCode = async () => {
    setFormError(null);
    try {
      const result =
        verificationMethod === "first_factor_email"
          ? await signIn.emailCode.sendCode()
          : verificationMethod === "mfa_phone"
            ? await signIn.mfa.sendPhoneCode()
            : await signIn.mfa.sendEmailCode();

      if (result.error) {
        setFormError(result.error.message);
      }
    } catch (error) {
      console.error("Resending sign-in verification code failed:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to resend the verification code. Please try again."
      );
    }
  };

  const isLoading = fetchStatus === "fetching";

  if (verificationMethod) {
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
        {formError && <Text className="text-red-500 mb-4">{formError}</Text>}

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
          onPress={onResendCode}
          className="py-2 mb-2"
        >
          <Text className="text-blue-600">I need a new code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            signIn.reset();
            setVerificationMethod(null);
            setCode("");
            setFormError(null);
          }}
          className="py-2"
        >
          <Text className="text-blue-600">Start over</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          Welcome back
        </Text>
        <Text className="text-gray-500 mb-8">Sign in to your account</Text>

        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
          placeholder="Email address"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.fields.identifier && (
          <Text className="text-red-500 mb-4">
            {errors.fields.identifier.message}
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
          onPress={onSignInPress}
          disabled={isLoading}
          className="w-full bg-blue-600 py-4 rounded-xl items-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-500">Don&apos;t have an account? </Text>
          <Link href="/sign-up">
            <Text className="text-blue-600 font-semibold">Sign Up</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}