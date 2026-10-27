# PGFinders — Mobile App

**Find a place to stay with more confidence.**

PGFinders is a mobile-first product designed to make finding and comparing paying-guest (PG) accommodation easier for students and young professionals. The goal is to bring important information—such as rent, location, amenities, food options, and house rules—into one place so people can make better-informed decisions.

> **Project Status:** Active development. This repository provides the Expo/React Native app foundation and Clerk authentication routing. PG discovery, listing management, filters, and other product capabilities remain planned until their implementation is complete.

---

## 🚀 Product Vision

Searching for a PG can involve scattered information, unclear pricing, uncertain amenities, and limited visibility into everyday living conditions.

PGFinders aims to make accommodation discovery more structured, transparent, and convenient.

### Planned Features

- 🏠 **Discover PGs** — Browse available accommodation listings.
- 💰 **Transparent Pricing** — Compare rent, deposits, and additional charges.
- 🔎 **Smart Search & Filters** — Search by location, budget, room type, and preferences.
- 🍽️ **Food & Amenities** — Review food arrangements, facilities, and house rules.
- 📍 **Location-Based Discovery** — Explore accommodation options near colleges and workplaces.
- ❤️ **Saved Listings** — Bookmark places worth revisiting.
- 🤝 **Direct Enquiries** — Make it easier to connect with PG owners or managers.
- 🛡️ **Trust & Transparency** — Progressively introduce listing checks and reporting mechanisms.

These are product goals, not a claim that all features are currently implemented.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile application |
| Expo SDK | Mobile development and build tooling |
| Expo Router | File-based navigation |
| TypeScript | Type-safe application development |
| Clerk | Authentication |
| NativeWind | Utility-first styling |
| Tailwind CSS | Styling utilities |
| Zustand | Client-side state management |
| Supabase JS | Database integration foundation |

---

## 📂 Project Structure

```text
application_Pg_finders/
├── assets/          # Images, icons, and static assets
├── components/      # Reusable UI components
├── hooks/           # Reusable React hooks
├── lib/             # Shared utilities and integrations
├── src/
│   └── app/         # Expo Router screens and layouts
├── store/           # Zustand state stores
├── types/           # TypeScript definitions
├── app.json         # Expo configuration
├── package.json     # Dependencies and scripts
└── README.md        # Project documentation
```

Some folders and responsibilities may evolve as development progresses.

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js LTS
- npm
- Git
- Expo Go or an Android emulator
- Xcode and an iOS simulator for iOS development on macOS
- A Clerk application and its publishable key

### 1. Clone the repository

```bash
git clone https://github.com/Sharmax12/application_Pg_finders.git
cd application_Pg_finders
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a template:

```dotenv
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_with_your_key
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_with_your_key
```

Use the Clerk publishable key and Supabase project URL/publishable key from their dashboards. The app reads listings and synchronises the signed-in user through Supabase, so both configurations are required. Existing local deployments using `EXPO_PUBLIC_SUPABASE_KEY` remain supported temporarily; prefer `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for new setup.

Only publishable/client keys belong in `EXPO_PUBLIC_*` variables. Never put a Clerk secret key or Supabase secret/service-role key in a mobile app.

**Security reminder:**
- Never commit `.env` files containing credentials.
- Never expose Clerk secret keys in a mobile application.
- Never include a Supabase service-role key in client-side code.
- Use appropriate database access policies before connecting user-facing features.

### 4. Start the development server

```bash
npx expo start
```

Follow the Expo CLI instructions to run the application on your device, emulator, or simulator.

---

## 📱 Available Commands

| Command | Description |
|---|---|
| `npm start` | Start the Expo development server |
| `npm run android` | Run the Android workflow |
| `npm run ios` | Run the iOS workflow |
| `npm run web` | Run the web version |
| `npm run lint` | Run the configured lint command |
| `npx tsc --noEmit` | Check TypeScript types |
| `npx expo-doctor` | Check Expo configuration and dependencies |

Some native modules may require an Expo development build instead of Expo Go.

---

## 🔐 Authentication Flow

The current application entry flow uses Clerk authentication.

1. `src/app/_layout.tsx` wraps the application with `ClerkProvider`.
2. `src/app/index.tsx` waits for authentication state to load.
3. Authenticated users are redirected to the main tab area.
4. Unauthenticated users are redirected to `/sign-in`.

Ensure the Clerk publishable key is configured before launching the application.

---

## 🗺️ Development Roadmap

### Phase 1 — Foundation
- Stabilise navigation and authentication.
- Configure application identity and environment variables.
- Improve loading and error handling.

### Phase 2 — Accommodation Data
- Define the PG listing data model.
- Define user, owner, amenity, location, and pricing structures.
- Establish appropriate database access policies.

### Phase 3 — Core Discovery
- Build the PG listing feed.
- Implement search and filters.
- Create detailed accommodation pages.
- Add saved listings.

### Phase 4 — Enquiries & Trust
- Implement enquiry workflows.
- Introduce listing review and reporting mechanisms.
- Improve pricing transparency and listing freshness.

### Phase 5 — Testing & Release
- Test on physical Android and iOS devices.
- Handle empty, loading, offline, and error states.
- Configure app icons, splash screens, deep links, and platform identifiers.
- Prepare production builds.

Prioritise a reliable search-to-enquiry journey before expanding into advanced features.

---

## 🧑‍💻 Development Guidelines

- Use Expo Router for screens and navigation.
- Keep reusable UI components outside the route tree.
- Place shared hooks in `hooks/` and integrations in `lib/`.
- Store shared TypeScript definitions in `types/`.
- Use Zustand for shared client state where appropriate.
- Prefer `npx expo install <package>` for Expo-compatible dependencies.
- Handle loading, empty, and error states.
- Keep secrets and local environment files out of version control.
- Test functionality on actual devices throughout development.

---

## 🔒 Security

Security is essential when handling accommodation listings and user enquiries.

- Keep secret API keys on trusted servers.
- Never ship a Supabase service-role key in the mobile application.
- Enforce data access permissions at the database or server layer.
- Collect only the personal information required by the product.
- Validate listing data and provide ways to report inaccurate information.

---

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Create a focused branch for your change.
2. Follow the existing project structure.
3. Keep changes small and understandable.
4. Run linting and type checks where possible.
5. Document the changes and include testing notes.

---

## 📄 License

This repository includes an MIT license. See [`LICENSE`](./LICENSE) for the terms.

---

**PGFinders — Making the PG search process clearer, safer, and less stressful.**
