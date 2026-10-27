import { useAuth } from "@clerk/expo";
import { useEffect, useState } from "react";
import { useSuperbase } from "./useSuperbase";

function isJwtVerificationError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PGRST301"
  );
}

export function useSavedProperty(propertyId: string, onUnsave?: () => void) {
  const { userId } = useAuth();
  const authSupabase = useSuperbase();

  const [saveLoading, setSaveLoading] = useState(false);
  const [savedLookup, setSavedLookup] = useState<{
    key: string;
    isSaved: boolean;
    error: string | null;
  } | null>(null);
  const lookupKey = JSON.stringify([userId, propertyId]);
  const isSaved =
    savedLookup?.key === lookupKey ? savedLookup.isSaved : false;
  const savedLookupError =
    savedLookup?.key === lookupKey ? savedLookup.error : null;

  useEffect(() => {
    let isCurrent = true;

    if (!userId || !propertyId) {
      return undefined;
    }

    const checkIfSaved = async () => {
      try {
        const { data, error } = await authSupabase
          .from("saved_properties")
          .select("id")
          .eq("user_clerk_id", userId)
          .eq("property_id", propertyId)
          .maybeSingle();

        if (error) throw error;

        if (isCurrent) {
          setSavedLookup({
            key: lookupKey,
            isSaved: Boolean(data),
            error: null,
          });
        }
      } catch (error) {
        const jwtVerificationFailed = isJwtVerificationError(error);
        if (jwtVerificationFailed) {
          console.error(
            "Supabase rejected the Clerk session token (PGRST301). Verify that Clerk is configured as a third-party auth provider for this Supabase project.",
            error
          );
        } else {
          console.error("Failed to check saved property:", error);
        }
        if (isCurrent) {
          setSavedLookup((current) => ({
            key: lookupKey,
            isSaved:
              current?.key === lookupKey ? current.isSaved : false,
            error: jwtVerificationFailed
              ? "Unable to verify your sign-in with Supabase. Check the Clerk and Supabase integration setup."
              : "Unable to load saved status. Please try again.",
          }));
        }
      }
    };

    void checkIfSaved();

    return () => {
      isCurrent = false;
    };
  }, [authSupabase, lookupKey, propertyId, userId]);

  const toggleSave = async () => {
    if (!userId) {
      throw new Error("Sign in to save properties.");
    }
    if (!propertyId) {
      throw new Error("A property ID is required to save a property.");
    }
    if (saveLoading) return;

    setSaveLoading(true);
    try {
      if (isSaved) {
        const { error } = await authSupabase
          .from("saved_properties")
          .delete()
          .eq("user_clerk_id", userId)
          .eq("property_id", propertyId);

        if (error) throw error;

        onUnsave?.();
      } else {
        const { error } = await authSupabase
          .from("saved_properties")
          .insert({ user_clerk_id: userId, property_id: propertyId });

        if (error) throw error;

      }

      setSavedLookup({ key: lookupKey, isSaved: !isSaved, error: null });
    } catch (error) {
      setSavedLookup((current) => ({
        key: lookupKey,
        isSaved: current?.key === lookupKey ? current.isSaved : isSaved,
        error: "Unable to update saved properties. Please try again.",
      }));
      throw error;
    } finally {
      setSaveLoading(false);
    }
  };

  return { isSaved, saveLoading, savedLookupError, toggleSave };
}
