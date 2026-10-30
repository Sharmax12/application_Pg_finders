import { useMemo } from "react";
import { createSupabaseClient } from "../lib/superbase";
import { useAuth } from "@clerk/expo";

export function useSuperbase() {
  const { getToken } = useAuth();
  const client = useMemo(
    () => createSupabaseClient(getToken),
    [getToken]
  );
  return client;
}