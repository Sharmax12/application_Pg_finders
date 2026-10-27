import {
  act,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import FilterModal from "../components/FilterModal";
import { useFilterStore } from "../store/filterStore";

beforeEach(() => {
  useFilterStore.getState().resetFilters();
});

it("syncs price inputs when opened and applies or resets filters", async () => {
  const onClose = jest.fn();
  const screen = await render(
    <FilterModal visible={false} onClose={onClose} />
  );
  await act(async () => {
    useFilterStore.getState().setMinPrice(5000000);
    useFilterStore.getState().setMaxPrice(10000000);
  });
  await screen.rerender(<FilterModal visible onClose={onClose} />);

  expect(screen.getByDisplayValue("5000000")).toBeTruthy();
  expect(screen.getByDisplayValue("10000000")).toBeTruthy();

  await fireEvent.press(screen.getByText("Apply Filters (2)"));
  expect(useFilterStore.getState().minPrice).toBe(5000000);
  expect(useFilterStore.getState().maxPrice).toBe(10000000);

  await fireEvent.press(screen.getByText("Reset"));
  await waitFor(() => {
    expect(useFilterStore.getState().minPrice).toBeNull();
    expect(useFilterStore.getState().maxPrice).toBeNull();
  });
});

it("applies price inputs alongside selected type and bedroom filters", async () => {
  useFilterStore.getState().setType("house");
  useFilterStore.getState().setBedrooms(4);
  const screen = await render(<FilterModal visible onClose={jest.fn()} />);

  await fireEvent.changeText(screen.getByPlaceholderText("0"), "2000000");
  await fireEvent.changeText(screen.getByPlaceholderText("Any"), "9000000");
  await fireEvent.press(screen.getByText("Apply Filters (2)"));

  const filters = useFilterStore.getState();
  expect(filters.type).toBe("house");
  expect(filters.bedrooms).toBe(4);
  expect(filters.minPrice).toBe(2000000);
  expect(filters.maxPrice).toBe(9000000);

  await fireEvent.press(screen.getByText("Reset"));
  expect(useFilterStore.getState().type).toBeNull();
  expect(useFilterStore.getState().bedrooms).toBeNull();
  expect(useFilterStore.getState().minPrice).toBeNull();
  expect(useFilterStore.getState().maxPrice).toBeNull();
});
