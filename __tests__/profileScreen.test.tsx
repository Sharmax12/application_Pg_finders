import { fireEvent, render, waitFor } from "@testing-library/react-native";
import Profile from "../src/app/(root)/(tabs)/profile";

const mockUser = {
  id: "user_123",
  firstName: "Ada",
  lastName: "Lovelace",
  imageUrl: "",
  primaryEmailAddress: { emailAddress: "ada@example.com" },
  emailAddresses: [{ emailAddress: "ada@example.com" }],
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  update: jest.fn().mockResolvedValue(undefined),
};
const mockSignOut = jest.fn().mockResolvedValue(undefined);

jest.mock("@clerk/expo", () => ({
  useUser: () => ({ isLoaded: true, user: mockUser }),
  useAuth: () => ({ signOut: mockSignOut }),
}));

beforeEach(() => {
  mockUser.update.mockClear().mockResolvedValue(undefined);
  mockSignOut.mockClear().mockResolvedValue(undefined);
});

it("updates the account name through Clerk", async () => {
  const screen = await render(<Profile />);

  await fireEvent.changeText(screen.getByLabelText("First name"), "Augusta");
  await fireEvent.changeText(screen.getByLabelText("Last name"), "Byron");
  await fireEvent.press(screen.getByText("Save changes"));

  await waitFor(() => {
    expect(mockUser.update).toHaveBeenCalledWith({
      firstName: "Augusta",
      lastName: "Byron",
    });
  });
});

it("signs out through Clerk", async () => {
  const screen = await render(<Profile />);

  await fireEvent.press(screen.getByText("Sign out"));

  await waitFor(() => {
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
