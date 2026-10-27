import { fireEvent, render, waitFor } from "@testing-library/react-native";
import Profile from "../src/app/(root)/(tabs)/profile";

const mockUser = {
  firstName: "Ada",
  lastName: "Lovelace",
  imageUrl: "",
  emailAddresses: [{ emailAddress: "ada@example.com" }],
  setProfileImage: jest.fn().mockResolvedValue(undefined),
};
const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockReplace = jest.fn();

jest.mock("@clerk/expo", () => ({
  useUser: () => ({ isLoaded: true, user: mockUser }),
  useAuth: () => ({ signOut: mockSignOut }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

beforeEach(() => {
  mockUser.setProfileImage.mockClear().mockResolvedValue(undefined);
  mockSignOut.mockClear().mockResolvedValue(undefined);
  mockReplace.mockClear();
});

it("renders the signed-in user's profile details", async () => {
  const screen = await render(<Profile />);

  expect(screen.getByText("Ada Lovelace")).toBeTruthy();
  expect(screen.getByText("ada@example.com")).toBeTruthy();
});

it("signs out through Clerk", async () => {
  const screen = await render(<Profile />);

  fireEvent.press(screen.getByText("Sign Out"));

  await waitFor(() => {
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/sign-in");
  });
});
