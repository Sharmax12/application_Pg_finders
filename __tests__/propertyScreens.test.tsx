import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { ReactElement } from "react";
import type { Property } from "../types/types";
import { useFilterStore } from "../store/filterStore";
import HomeScreen from "../src/app/(root)/(tabs)/index";
import SearchScreen from "../src/app/(root)/(tabs)/search";

type Result = {
  data: Property[] | null;
  error: { message: string } | null;
};

type QueryRecord = {
  eq: [string, string | number | boolean][];
  gte: [string, number][];
  lte: [string, number][];
  or: string[];
  not: [string, string, string][];
};

type Query = {
  select: () => Query;
  eq: (column: string, value: string | number | boolean) => Query;
  gte: (column: string, value: number) => Query;
  lte: (column: string, value: number) => Query;
  not: (column: string, operator: string, value: string) => Query;
  or: (expression: string) => Query;
  order: () => Promise<Result>;
};

const mockResults: (Result | Promise<Result>)[] = [];
const mockQueries: QueryRecord[] = [];
const renderScreen = (element: ReactElement) => Promise.resolve(render(element));
const completeEvent = (event: unknown) => Promise.resolve(event);

const mockFrom = jest.fn(() => {
  const record: QueryRecord = { eq: [], gte: [], lte: [], or: [], not: [] };
  mockQueries.push(record);

  let query: Query;
  query = {
    select: () => query,
    eq: (column, value) => {
      record.eq.push([column, value]);
      return query;
    },
    gte: (column, value) => {
      record.gte.push([column, value]);
      return query;
    },
    lte: (column, value) => {
      record.lte.push([column, value]);
      return query;
    },
    not: (column, operator, value) => {
      record.not.push([column, operator, value]);
      return query;
    },
    or: (expression) => {
      record.or.push(expression);
      return query;
    },
    order: () =>
      Promise.resolve(mockResults.shift() ?? { data: [], error: null }),
  };
  return query;
});

jest.mock("../lib/superbase", () => ({
  supabase: { from: (...args: Parameters<typeof mockFrom>) => mockFrom(...args) },
}));

jest.mock("@clerk/expo", () => ({
  useUser: () => ({ user: { firstName: "Ada" } }),
}));

jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    useRouter: () => ({ push: jest.fn() }),
    useFocusEffect: (callback: () => (() => void) | undefined) =>
      React.useEffect(() => callback(), [callback]),
    useLocalSearchParams: () => ({}),
  };
});

jest.mock("../components/PropertyCard", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ property }: { property: Property }) =>
      React.createElement(Text, null, property.title),
  };
});

jest.mock("../components/FeatureCard", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ property }: { property: Property }) =>
      React.createElement(Text, null, property.title),
  };
});

const makeProperty = (overrides: Partial<Property> = {}): Property => ({
  id: "property-1",
  title: "Cedar House",
  description: "A comfortable home",
  price: 9500,
  type: "studio",
  room_type: "private_room",
  monthly_rent: 9500,
  security_deposit: 10000,
  gender_preference: "any",
  food_included: true,
  amenities: ["Wi-Fi"],
  available_from: "2026-11-01",
  bedrooms: 1,
  bathrooms: 2,
  area_sqft: 1200,
  address: "10 Main Street",
  city: "Pune",
  latitude: 18.52,
  longitude: 73.85,
  images: [],
  is_featured: false,
  is_sold: false,
  created_at: "2026-01-01",
  ...overrides,
});

const enqueueResult = (result: Result | Promise<Result>) => {
  mockResults.push(result);
};

beforeEach(() => {
  mockResults.length = 0;
  mockQueries.length = 0;
  mockFrom.mockClear();
  useFilterStore.getState().resetFilters();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("HomeScreen", () => {
  it("fetches and renders featured and recommended properties", async () => {
    enqueueResult({ data: [makeProperty({ is_featured: true })], error: null });
    enqueueResult({ data: [makeProperty({ title: "Recommended PG" })], error: null });

    const screen = await renderScreen(<HomeScreen />);

    expect(await screen.findByText("Cedar House")).toBeTruthy();
    expect(await screen.findByText("Recommended PG")).toBeTruthy();
    expect(mockQueries[0].eq).toContainEqual(["is_featured", true]);
    expect(mockQueries[1].eq).toContainEqual(["is_featured", false]);
  });

  it("shows an empty state when the home query returns no properties", async () => {
    enqueueResult({ data: [], error: null });
    enqueueResult({ data: [], error: null });

    const screen = await renderScreen(<HomeScreen />);

    expect(await screen.findByText("No PGs found yet")).toBeTruthy();
  });

  it("surfaces home fetch failures and allows retry", async () => {
    enqueueResult(Promise.reject(new Error("Network unavailable")));
    enqueueResult({ data: [], error: null });

    const screen = await renderScreen(<HomeScreen />);

    expect(
      await screen.findByText("Unable to load properties. Please try again.")
    ).toBeTruthy();
    await completeEvent(fireEvent.press(screen.getByText("Try again")));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledTimes(4);
    });
  });
});

describe("SearchScreen", () => {
  it("searches PG title and city using escaped PostgREST input", async () => {
    enqueueResult({ data: [], error: null });

    const screen = await renderScreen(<SearchScreen />);
    const input = screen.getByPlaceholderText("Search PGs, localities, colleges...");
    await completeEvent(fireEvent.changeText(input, 'Cedar", (West)'));

    await waitFor(() => {
      expect(mockQueries).toHaveLength(2);
    });
    expect(mockQueries[1].or[0]).toContain('\\"');
    expect(mockQueries[1].or[0]).toContain('title.ilike."%');
    expect(mockQueries[1].or[0]).toContain('city.ilike."%');
  });

  it("applies room type, 4+ bedrooms, and inclusive monthly rent bounds", async () => {
    const filters = useFilterStore.getState();
    filters.setType("private_room");
    filters.setBedrooms(4);
    filters.setMinPrice(0);
    filters.setMaxPrice(10000);
    enqueueResult({ data: [], error: null });

    await renderScreen(<SearchScreen />);

    await waitFor(() => {
      expect(mockQueries).toHaveLength(1);
    });
    expect(mockQueries[0].eq).toContainEqual(["room_type", "private_room"]);
    expect(mockQueries[0].gte).toContainEqual(["bedrooms", 4]);
    expect(mockQueries[0].gte).toContainEqual(["monthly_rent", 0]);
    expect(mockQueries[0].lte).toContainEqual(["monthly_rent", 10000]);
  });

  it("uses an exact match for bedroom counts below four", async () => {
    useFilterStore.getState().setBedrooms(2);
    enqueueResult({ data: [], error: null });

    await renderScreen(<SearchScreen />);

    await waitFor(() => {
      expect(mockQueries).toHaveLength(1);
    });
    expect(mockQueries[0].eq).toContainEqual(["bedrooms", 2]);
    expect(mockQueries[0].gte).toEqual([]);
  });

  it("shows loading and empty states, then reports fetch errors", async () => {
    let resolveRequest!: (result: Result) => void;
    enqueueResult(
      new Promise<Result>((resolve) => {
        resolveRequest = resolve;
      })
    );

    const screen = await renderScreen(<SearchScreen />);
    expect(await screen.findByText("Searching...")).toBeTruthy();
    resolveRequest({ data: [], error: null });
    expect(await screen.findByText("No properties found")).toBeTruthy();

    enqueueResult({ data: null, error: { message: "Request failed" } });
    await completeEvent(
      fireEvent.changeText(
        screen.getByPlaceholderText("Search by title or city..."),
        "Pune"
      )
    );
    expect(
      await screen.findByText("Unable to search PGs. Please try again.")
    ).toBeTruthy();
  });

  it("ignores an older response when a newer search has completed", async () => {
    let resolveOld!: (result: Result) => void;
    enqueueResult(
      new Promise<Result>((resolve) => {
        resolveOld = resolve;
      })
    );
    enqueueResult({ data: [makeProperty({ title: "New result" })], error: null });

    const screen = await renderScreen(<SearchScreen />);
    await completeEvent(
      fireEvent.changeText(
        screen.getByPlaceholderText("Search by title or city..."),
        "new"
      )
    );

    expect(await screen.findByText("New result")).toBeTruthy();
    resolveOld({ data: [makeProperty({ title: "Stale result" })], error: null });

    await waitFor(() => {
      expect(screen.queryByText("Stale result")).toBeNull();
      expect(screen.getByText("New result")).toBeTruthy();
    });
  });
});
