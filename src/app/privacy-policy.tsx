import LegalDocumentScreen, { type LegalSection } from "../../components/LegalDocumentScreen";

const sections: LegalSection[] = [
  {
    heading: "1. Who this policy covers",
    paragraphs: [
      "This Privacy Policy explains how PGFinders handles information when you use the app to discover, compare, and save paying-guest accommodation. It describes the app's current intended practices and should be read together with our Terms of Use.",
    ],
  },
  {
    heading: "2. Information we handle",
    paragraphs: [
      "Account information: when you create or use an account, our authentication provider, Clerk, processes account details such as your name, email address, profile image, and account identifier.",
      "Saved places: when you save a property, the app stores the property identifier and your account identifier in our database provider, Supabase, so your saved list can be retrieved for your account.",
      "Information you choose to provide: if you contact support, the team receives the message and contact details you include. If you use a feature that asks for device-location permission and grant it, the app may use your location to help show nearby places. You can deny or revoke location permission in your device settings and continue using manual search where available.",
      "The app may also process basic technical information needed by the authentication, hosting, database, and mobile-platform services that support it. Do not send passwords, payment card details, or other sensitive information to support.",
    ],
  },
  {
    heading: "3. How we use information",
    paragraphs: [
      "We use information to create and secure accounts, authenticate users, show accommodation listings, remember saved places, respond to support requests, maintain the service, and investigate suspected abuse or technical issues.",
      "PGFinders does not currently provide in-app booking or payment processing. Do not treat saving a listing as a reservation or payment.",
    ],
  },
  {
    heading: "4. Service providers and sharing",
    paragraphs: [
      "We rely on third-party service providers, including Clerk for authentication and Supabase for database services. They process information as needed to provide their services and under their own applicable terms and privacy notices. Device operating systems and app-distribution or hosting services may also process technical information.",
      "We do not make your account details public simply because you create an account. We may disclose information when reasonably necessary to protect users or the service, comply with law, enforce our terms, or respond to a valid legal request. We do not sell personal information as a product.",
    ],
  },
  {
    heading: "5. Storage and security",
    paragraphs: [
      "We use service providers and technical access controls intended to protect information. No internet service or method of electronic storage is completely secure, so we cannot promise absolute security. Keep your sign-in credentials confidential and notify us if you suspect unauthorised access.",
    ],
  },
  {
    heading: "6. Retention and account requests",
    paragraphs: [
      "We keep information for as long as reasonably needed to operate the service, maintain saved places, resolve support issues, meet legal obligations, and protect the service. Retention periods can vary by data type and provider.",
      "To request account or personal-data deletion, email the support address shown below from the email associated with your account. We may ask you to verify account ownership before acting. Some information may need to be retained where required by law or for legitimate security and dispute-resolution purposes.",
    ],
  },
  {
    heading: "7. Your choices",
    paragraphs: [
      "You can choose what profile information to provide, manage device permissions through your operating system, and contact us with questions about your information. You can also stop using the app. Depending on your location, you may have additional privacy rights under applicable law; contact us to make a request.",
    ],
  },
  {
    heading: "8. Children and changes to this policy",
    paragraphs: [
      "PGFinders is a general accommodation-discovery service and is not intended to collect information from children in violation of applicable law. If you believe a child has provided personal information unlawfully, contact us.",
      "We may update this policy as the product or applicable requirements change. We will update the date at the top of this page when we make a revision. Continued use after an update is subject to applicable law and the updated policy.",
    ],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      intro="Your information matters. This policy describes the information PGFinders currently handles, why it is used, and the choices available to you."
      sections={sections}
    />
  );
}
