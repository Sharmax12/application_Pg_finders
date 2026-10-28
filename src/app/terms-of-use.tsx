import LegalPage from "../../components/LegalPage";

export default function TermsOfUseScreen() {
  return (
    <LegalPage
      title="Terms of Use"
      intro="These Terms govern your use of PGFinders, a service for discovering and shortlisting paying-guest accommodation. By accessing or using PGFinders, you agree to these Terms. Do not use the service if you do not agree."
      sections={[
        {
          heading: "Using PGFinders",
          body: "PGFinders helps users browse accommodation information and save listings for later comparison. Features, listing availability and supported platforms may change over time. You must use the app lawfully and provide accurate information when creating or managing an account.",
        },
        {
          heading: "Listings and independent checks",
          body: "Listing details such as rent, deposits, availability, amenities, photographs, location and house rules may be incomplete, outdated or changed by a provider. You are responsible for checking current terms, viewing the property where practical, confirming the identity and authority of the owner or manager, and understanding any deposit, rent, refund and tenancy conditions before paying or signing anything. PGFinders does not guarantee that a listing is accurate, available, safe, lawful or suitable for you.",
        },
        {
          heading: "Accounts and security",
          body: "Keep your sign-in details secure and tell us promptly if you suspect unauthorised access. You are responsible for activity performed through your account to the extent permitted by applicable law. We may restrict access where reasonably necessary to protect users, investigate abuse or enforce these Terms.",
        },
        {
          heading: "Saved properties and content",
          body: "You may save listings for personal reference. Do not upload or submit content that you do not have the right to use, that is misleading or unlawful, or that exposes another person’s private information. Listing images and information may be displayed to other users to support accommodation discovery.",
        },
        {
          heading: "Acceptable use",
          body: "Do not use PGFinders to defraud, harass, threaten or impersonate others; distribute malware; attempt to access another account or restricted system; interfere with the app or its databases; scrape or reuse content at scale without permission; or circumvent security controls. Do not rely on a listing alone to make a payment or personal-safety decision.",
        },
        {
          heading: "Third-party services",
          body: "The app relies on third-party services for authentication, database and file storage. Those services may have separate terms and privacy policies. Links or contact details for third parties are provided for convenience and do not imply that PGFinders endorses or guarantees their conduct.",
        },
        {
          heading: "No tenancy or transaction guarantee",
          body: "Unless expressly stated in a separate written agreement, PGFinders is a discovery and shortlisting tool, not the landlord, owner, property manager, guarantor or party to a rental agreement between you and a provider. Any viewing, negotiation, payment, deposit, booking or tenancy arrangement is between the relevant parties, who should independently verify details and document their agreement.",
        },
        {
          heading: "Availability and liability",
          body: "We work to keep PGFinders available and useful, but we do not promise uninterrupted or error-free operation. To the extent permitted by applicable law, PGFinders is not responsible for losses arising from inaccurate third-party listing information, user/provider conduct, rental arrangements made independently, or temporary service interruptions. Nothing in these Terms excludes a right or liability that cannot lawfully be excluded.",
        },
        {
          heading: "Changes and contact",
          body: "We may update these Terms when the app or applicable requirements change. Continued use after an update means you accept the revised Terms to the extent permitted by law. For questions, email aniruddhsharma669@gmail.com.",
        },
      ]}
    />
  );
}
