import LegalPage from "../../components/LegalPage";

export default function PrivacyPolicyScreen() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains how PGFinders handles information when you use the app to explore and save paying-guest accommodation. We aim to collect only what is needed to provide and improve the service."
      sections={[
        {
          heading: "Information we handle",
          body: "When you create or use an account, our authentication provider, Clerk, may process your name, email address, profile image and account identifiers. PGFinders also processes app activity needed to provide features, such as the properties you save and the listing details you view. If you contact support, we receive the information you choose to include in that message.",
        },
        {
          heading: "Saved places and listing information",
          body: "Your saved-property list is associated with your account so it can be shown when you return. Listing information may include rent, deposit, address, amenities, availability, contact details, coordinates and photographs. Property listings and their photos may be visible to other app users; do not submit private or sensitive information as listing content.",
        },
        {
          heading: "Location and photos",
          body: "A location-detection feature may ask for foreground location permission when you choose to use it. You can deny permission and use manual entry where available. PGFinders does not need background location permission for the location-detection feature described here. If you choose a profile or listing photo, the relevant image service stores or processes it to provide that feature.",
        },
        {
          heading: "Service providers and sharing",
          body: "PGFinders uses Clerk for authentication and Supabase for database and file-storage services. These providers process information as needed to operate the app under their applicable terms and privacy practices. We may disclose information where reasonably necessary to address security or abuse, comply with a valid legal obligation, or protect users and the service. We do not currently sell personal information.",
        },
        {
          heading: "Retention and security",
          body: "Information is retained for as long as needed to provide the service, maintain account and saved-list functionality, resolve disputes, meet legal obligations, and enforce our terms. We use access controls and database policies, but no internet service or storage system can be guaranteed completely secure.",
        },
        {
          heading: "Your choices",
          body: "You can choose not to provide optional information, deny location permission, and remove places from your saved list. You can update available account information through the app or authentication provider. To ask about access, correction or deletion of account information, contact support; requests are handled subject to applicable law and legitimate retention needs.",
        },
        {
          heading: "Children and changes",
          body: "PGFinders is a general accommodation-discovery service and is not designed to collect information from children. We may update this policy as the product changes; the updated date above indicates the latest revision shown in the app.",
        },
        {
          heading: "Contact",
          body: "For privacy questions or requests, email aniruddhsharma669@gmail.com with “Privacy Request” in the subject line.",
        },
      ]}
    />
  );
}
