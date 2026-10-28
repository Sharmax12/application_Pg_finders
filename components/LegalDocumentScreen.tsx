import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

type Props = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

const SUPPORT_EMAIL = "aniruddhsharma669@gmail.com";

export default function LegalDocumentScreen({ title, intro, sections }: Props) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-5 py-3">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="arrow-back" size={21} color="#0F172A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            PGFinders
          </Text>
          <Text className="text-base font-bold text-slate-900">{title}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 26, paddingBottom: 42 }}
      >
        <Text className="text-3xl font-bold leading-9 text-slate-900">{title}</Text>
        <Text className="mt-3 text-sm leading-6 text-slate-600">{intro}</Text>
        <Text className="mt-3 text-xs text-slate-400">Last updated: 28 October 2026</Text>

        {sections.map((section, index) => (
          <View key={section.heading} className={index === 0 ? "mt-8" : "mt-6"}>
            <Text className="mb-2 text-lg font-bold text-slate-900">{section.heading}</Text>
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <Text
                key={paragraphIndex}
                className="mb-3 text-sm leading-6 text-slate-600"
              >
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <View className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-sm font-semibold text-slate-900">Questions or requests?</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-600">
            Contact the PGFinders team at {SUPPORT_EMAIL}.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() =>
              Linking.openURL(
                `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(title + " question")}`
              )
            }
            className="mt-3 flex-row items-center"
          >
            <Text className="text-sm font-semibold text-blue-600">Email support</Text>
            <Ionicons name="arrow-forward" size={15} color="#2563EB" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
