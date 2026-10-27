# PGFinders: Product and Technical Review

**Review date:** 27 October 2026  
**Repository:** `Sharmax12/application_Pg_finders`  
**Purpose:** Focused route from the current Expo foundation to a trustworthy PG-accommodation pilot.

## Executive decision

Keep React Native + Expo. The app already uses Expo Router, TypeScript, Clerk, Supabase and Zustand. A Flutter or separate native rewrite would add migration work without solving the current blockers: the product model is still generic real estate, several key screens are incomplete, and the database's production access policies are not versioned in this repository.

The first launch should be a focused PG discovery and enquiry product, not a full property-management suite or social marketplace.

## What is present and what is not

### Confirmed in source

- Expo SDK 58, React Native 0.88, React 19.3 and TypeScript are declared in `package.json`.
- Expo Router provides auth routes, tabs, search and property details.
- Clerk is used for the mobile session; Supabase JS is used for database access.
- Home and search load property rows; search filters by title/city, property type, bedroom count and price.
- Property detail includes photos, map preview, save, contact and admin actions.
- Automated tests exist for the home/search flow and filter modal.
- The Saved, Profile and Create Property screens were placeholders before this review branch.
- The current data vocabulary is generic real estate: `is_sold`, `bedrooms`, `bathrooms`, `area_sqft`, property types such as apartment/house/villa/studio, and price presets in lakhs/crores. That does not match PG rental discovery.
- The app metadata still says `my-app` / `myapp`, and some authentication copy says “Find your dream home”.
- The repository did not contain Supabase migrations/schema/RLS policy files or a GitHub Actions workflow at review time. The live database configuration therefore cannot be confirmed from source alone.

### Changed on the review branch

- Added ignore rules for Expo cache/build output, local environment files, logs and OS metadata.
- Removed tracked `.expo`, `dist` and `.DS_Store` files from the branch.
- Changed saved-property lookup to use `maybeSingle()`, check Supabase errors, avoid reporting failed writes as successful, and reset loading state in `finally`.
- Hardened Clerk-to-Supabase user synchronisation: handles missing email, catches sync failures, uses an upsert on `clerk_id`, and fails closed in the UI for admin state.
- Added catch/error feedback for rejected sign-in operations and a visible auth-loading state.
- Implemented the Saved screen and separated a card's Save action from its property-navigation touch target.
- Added a clean-install CI workflow and an environment example.

These code changes still require a successful CI run and device testing before they are considered production-verified.

## Product recommendation

### Narrow the first release

Pick one launch micro-market where the team can personally verify supply—ideally a defined area around a small number of colleges or employment hubs. Do not launch broadly across multiple cities with mostly empty or stale results.

The primary user job is:

1. Find currently available PG accommodation in a practical commute area.
2. Compare the real monthly cost and room/living conditions.
3. Contact the owner or manager with enough context to arrange a visit.
4. Report incorrect, unavailable or suspicious listings.

Recruit owners/managers and seed real listings before spending heavily on advanced discovery features. Supply quality is the initial product bottleneck.

### PG-first listing information

Every published listing should make the following clear:

- Monthly rent, deposit, any one-time/brokerage charges, and what is included.
- Locality/address precision appropriate for discovery; map coordinates when available.
- Room arrangement and occupancy, such as single, double or triple sharing, private/shared room, and current availability.
- Food arrangements, meal schedule where relevant, and whether food is included in rent.
- Amenities, utilities, laundry/cleaning, house rules, visitor policy and any restrictions declared by the property manager.
- Photos that represent the actual space; contact method and typical response window.
- Last-confirmed-available timestamp, listing owner/manager, moderation state, and report action.

Do not imply a listing is “verified” unless PGFinders has a defined verification process and records when it was performed.

### MVP feature boundary

**Build for launch:** PG discovery feed, locality/college-oriented search, monthly rent and deposit filters, room/share filters, listing detail, save/unsave, owner contact/enquiry, owner listing creation/editing, moderation/reporting, profile basics, empty/error/loading states and analytics.

**Defer:** payments, in-app chat, AI recommendations, complex ranking, multi-city operations, subscriptions, landlord CRM, reviews/ratings and Redis/microservices until the basic search-to-enquiry loop has real usage.

## Framework and architecture decision

| Area | Recommendation | Reason |
|---|---|---|
| Mobile | React Native + Expo | Existing work is reusable; Android and iOS share most UI and business logic. |
| Navigation | Expo Router | Already used; keep routes in `src/app/`. |
| Language | TypeScript | Keep strict types around listing data and API results. |
| Authentication | Keep Clerk for now | Already wired. Supabase documents a supported Clerk third-party auth integration. Do not maintain two independent sign-in systems. |
| Database/API | Supabase Postgres + Data API | Suitable for a small team; SQL, constraints and RLS are important for listing ownership and saved items. |
| Media | Supabase Storage | Use bucket policies for listing photos; do not trust a client-supplied owner ID. |
| Client state | Zustand, narrowly | Keep temporary filters/UI state here; use the database as the source of truth for listings and saved items. |
| Builds | EAS Build, after configuration | Shared cloud build/release workflow without requiring each contributor to maintain native build machines. |
| Monitoring | Add crash/error reporting before public release | Diagnose auth, network and device-specific failures from real users. |

Keep the architecture modular but not over-engineered: route screens → typed data-access functions → Supabase. Put privileged actions behind database policies and, where necessary, a trusted server/Edge Function. A client-side `isAdmin` flag is presentation state, never authorization.

Official references:
- [Expo SDK 58 reference](https://docs.expo.dev/versions/v58.0.0/)
- [Clerk with Expo](https://docs.expo.dev/guides/using-clerk/)
- [Clerk third-party auth with Supabase](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [EAS build configuration](https://docs.expo.dev/build-reference/build-configuration/)

## Recommended database model

Create and version migrations before relying on production data. Names can be adapted, but ownership and access rules should be explicit.

- `profiles`: Clerk user ID (unique), display name, contact preferences, created/updated timestamps. Keep role changes restricted to trusted admin tooling.
- `pg_listings`: owner ID, title, description, locality, city, latitude/longitude, monthly rent, deposit, room/share type, occupancy, food plan, amenities/rules, availability, publication status, last-confirmed timestamp and moderation metadata.
- `listing_photos`: listing ID, storage path, display order and optional caption; constrain access by listing visibility/ownership.
- `saved_listings`: user ID + listing ID with a unique constraint so one user cannot save the same listing multiple times.
- `enquiries`: listing ID, renter ID, contact/consent state, message, status and timestamps; expose only the minimum data to each party.
- `listing_reports` and a moderation/audit record: reporter, reason, listing, resolution status and timestamps.

Use check constraints for non-negative prices/deposits and valid statuses, foreign keys for ownership, indexes for published listings/location/rent, and unique constraints for identity and saves. Decide whether a listing can be public before/after moderation and enforce that in RLS—not just in the UI.

## Security blockers to clear before launch

1. **RLS must be reviewed against the live database.** Public clients should read only published listings and public fields. Owners may edit only their own listings. Only trusted admins may moderate/delete other owners' listings or grant admin roles. Saved items and enquiries must be scoped to the signed-in user.
2. **Never use a Supabase service-role/secret key in the app.** The mobile client may contain the Supabase publishable key and Clerk publishable key; neither is an authorization policy.
3. **Verify Clerk token claims in Supabase policies.** The client passes a Clerk session token to Supabase. Ensure the live project has the matching third-party auth integration and policies that use the correct identity claim.
4. **Verify the `users.clerk_id` unique constraint and insert/upsert policy.** The revised hook assumes a unique conflict target on `clerk_id`; the live schema must satisfy that assumption.
5. **Audit the admin mutation routes.** Client-side hiding of the Create tab is convenience only. Test a non-admin token directly against INSERT/UPDATE/DELETE operations.
6. **Protect contact details and enquiries.** Do not expose owner private phone/email data in public listing queries by default. Get appropriate user consent before opening external messaging or sharing contact details.
7. **Validate listing submissions and uploads.** Constrain image type/size, verify ownership, limit report/enquiry abuse, and avoid accepting arbitrary client-provided admin fields.
8. **Review environment configuration and rotation.** Keep `.env` out of Git; only publishable keys belong in `EXPO_PUBLIC_*` variables. Rotate any secret if it was ever committed.

## Release roadmap and acceptance criteria

### Milestone 0 — Clean baseline and CI
**In progress on this branch.** Remove generated artifacts from Git, establish environment setup, and run lint/type/test checks. No production release until a clean clone can install and pass the checks.

### Milestone 1 — Define PG domain + data security
- Decide the listing fields and their definitions.
- Add SQL migrations and testable RLS policies.
- Add generated TypeScript database types and a documented local/staging setup.
- Acceptance: unauthenticated users cannot mutate listings; a renter cannot read another user's saved list/enquiries; an owner cannot edit another owner's listing; admin privileges cannot be self-assigned.

### Milestone 2 — Make discovery useful for one micro-market
- Replace sale price/property filters with monthly rent, deposit, sharing type, food, facilities, availability and locality/commute searches.
- Implement clear no-results, stale-listing and network-error states.
- Seed a small but real set of listings with owner permission and accurate availability.
- Acceptance: a first-time user can get from opening the app to a relevant shortlist without needing a tutorial.

### Milestone 3 — Owner supply workflow
- Draft → preview → submit → moderated/published → refresh/pause/archive.
- Owner can manage only their own listings; admin review is separately authorised.
- Add photo upload, required-field validation and a last-confirmed timestamp.
- Acceptance: a real owner can maintain a listing without developer/database access.

### Milestone 4 — Contact and trust
- Enquiry/contact action with clear intent and fallback options.
- Report listing and moderation queue.
- Save/unsave and basic profile preferences.
- Acceptance: every enquiry has a listing and user context; reports can be triaged; no false “verified” claims are shown.

### Milestone 5 — Pilot instrumentation and QA
- Measure listing views → contact taps → enquiries and owner response.
- Add crash/error monitoring, analytics with data minimisation, and support contact.
- Test sign-up/sign-in, expired sessions, slow/no network, empty search, save/unsave, image upload, authorization denial and app resume on physical Android and iOS devices.
- Acceptance: no open critical/high security defects; all core journeys pass on both platforms; listings have an operational refresh process.

### Milestone 6 — Closed beta and measured expansion
- Start with one micro-market and a manageable number of active, accurate listings.
- Proposed initial operating goals: 30–50 maintained listings before promotion; review availability at least weekly; track listing completeness and owner response time; review contact conversion weekly.
- Expand only when a useful share of search sessions produces relevant enquiries and owners can keep availability current.

## Build/release checklist

Before store submission, replace generic app metadata (`name: my-app`, `slug: my-app`, `scheme: myapp`) with the final PGFinders identity. Confirm whether the project is already linked to an Expo/EAS project before changing the slug. Set stable, unique `ios.bundleIdentifier` and `android.package` values once the intended publisher identifiers are known. Confirm icons, splash screen, deep links, privacy/support URLs, permission prompts and store metadata. Then create development, preview and production build profiles, and test signed builds outside Expo Go.

## Things not verified by this repository review

- The actual Supabase schema, indexes, grants, RLS policies, storage policies or live data.
- Clerk dashboard methods, redirect URLs, native API configuration or production keys.
- Successful local execution of `npm ci`, lint, typecheck, tests or Android/iOS builds.
- Device behaviour, real listing accuracy, owner response rates or store readiness.

Treat those as explicit verification tasks, not as claims that the current product is insecure or broken in every deployment.
