import { Slot } from "expo-router";
import { useUserSync } from "../../../hooks/useUserSync";


export default function RootLayout() {
  useUserSync();

  return <Slot />;
}
