import { useAuth } from "@clerk/expo";
import { useEffect, useState } from "react";
import { useSuperbase } from "./useSuperbase";

export function useSavedProperty(propertyId: string, onUnsave?: () => void) {
  const { userId } = useAuth();
  const authSupabase = useSuperbase();

  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedLookupError, setSavedLookupError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    if (!userId || !propertyId) {
      setIsSaved(false);
      setSavedLookupError(null);
      return () => {
        isCurrent = false;
      };
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
          setIsSaved(Boolean(data));
          setSavedLookupError(null);
        }
      } catch (error) {
        console.error("Failed to check saved property:", error);
        if (isCurrent) {
          setIsSaved(false);
          setSavedLookupError("Unable to load saved status. Please try again.");
        }
      }
    };

    void checkIfSaved();

    return () => {
      isCurrent = false;
    };
  }, [authSupabase, propertyId, userId]);

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

        setIsSaved(false);
        onUnsave?.();
      } else {
        const { error } = await authSupabase
          .from("saved_properties")
          .insert({ user_clerk_id: userId, property_id: propertyId });

        if (error) throw error;

        setIsSaved(true);
      }

      setSavedLookupError(null);
    } catch (error) {
      setSavedLookupError("Unable to update saved properties. Please try again.");
      throw error;
    } finally {
      setSaveLoading(false);
    }
  };

  return { isSaved, saveLoading, savedLookupError, toggleSave };
}
