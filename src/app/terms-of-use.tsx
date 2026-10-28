import LegalDocumentScreen, { type LegalSection } from "../../components/LegalDocumentScreen";

const sections: LegalSection[] = [
  {
    heading: "1. Using PGFinders",
    paragraphs: [
      "PGFinders helps people discover, compare, and save paying-guest accommodation listings. By accessing the app, you agree to these Terms of Use. If you do not agree, please do not use the service.",
      "You must be legally able to accept these terms where you live. If you use the app on behalf of someone else or an organisation, you are responsible for having permission to do so.",
    ],
  },
  {
    heading: "2. Your account",
    paragraphs: [
      "Provide accurate account information and keep your sign-in credentials secure. You are responsible for activity carried out through your account, except where the law says otherwise. Tell us promptly if you suspect unauthorised use.",
      "Do not impersonate another person, create accounts for fraudulent purposes, or attempt to bypass access controls.",
    ],
  },
  {
    heading: "3. Property listings and independent checks",
    paragraphs: [
      "Listing details may be submitted by third parties or may change over time. Rent, deposit, availability, amenities, food arrangements, location, photographs, and house rules may be incomplete, outdated, or inaccurate. We do not guarantee that a listing is available, suitable, lawful, or independently verified.",
      "Before visiting, sharing documents, signing an agreement, or paying anyone, independently confirm the property, the identity and authority of the owner or manager, all charges, refund terms, safety conditions, and the latest availability. Be cautious of requests for urgent advance payments.",
      "PGFinders is a discovery tool, not a landlord, broker, accommodation provider, or party to an agreement between you and a property owner or manager. The app does not currently complete bookings or process rent or deposits.",
    ],
  },
  {
    heading: "4. Acceptable use",
    paragraphs: [
      "Use PGFinders lawfully and respectfully. You must not submit knowingly false or misleading information, harass other people, abuse the service, upload content you do not have the right to use, interfere with app security, probe or disrupt infrastructure, or use automated means to collect information without permission.",
      "We may restrict access to protect users or the service, investigate suspected misuse, comply with law, or enforce these terms. Where appropriate and legally permitted, we will try to provide a reason for significant restrictions.",
    ],
  },
  {
    heading: "5. Content and intellectual property",
    paragraphs: [
      "The app, its branding, interface, and original materials are owned by PGFinders or its licensors and are protected by applicable laws. These terms give you a limited, personal, revocable right to use the app for its intended purpose; they do not transfer ownership to you.",
      "You remain responsible for content you submit. You confirm that you have the rights needed to share it and allow us to host, store, display, and use it as necessary to operate, maintain, and improve the service. Do not submit private information about another person without a lawful basis or their permission.",
    ],
  },
  {
    heading: "6. Third-party services",
    paragraphs: [
      "Authentication, database, hosting, and other features may rely on third-party services. Those services may be governed by their own terms and policies. We are not responsible for independent third-party services, although nothing in these terms limits rights or remedies that cannot lawfully be limited.",
    ],
  },
  {
    heading: "7. Availability and disclaimers",
    paragraphs: [
      "We work to keep PGFinders useful and available, but features and listings may change, be interrupted, or contain errors. To the extent permitted by law, the service is provided on an “as available” basis and we do not make guarantees that it will always be uninterrupted, error-free, or meet every user's needs.",
      "Nothing in these terms excludes or limits a consumer right, warranty, or liability that cannot be excluded or limited under applicable law.",
    ],
  },
  {
    heading: "8. Changes, suspension, and termination",
    paragraphs: [
      "We may update the app and these terms as the service develops. The date on the legal page will indicate when the terms were last updated. We may suspend or end access where necessary to protect the service, enforce these terms, or comply with law. You may stop using the app at any time.",
    ],
  },
  {
    heading: "9. Contact",
    paragraphs: [
      "For questions about these terms, safety concerns, or a report about a listing, contact aniruddhsharma669@gmail.com. We will review reports and respond as reasonably practicable.",
    ],
  },
];

export default function TermsOfUseScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Use"
      intro="These terms explain the ground rules for using PGFinders. Please verify accommodation details independently before making a housing decision or payment."
      sections={sections}
    />
  );
}
