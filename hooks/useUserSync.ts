import { useAuth, useUser } from "@clerk/expo";
import { useEffect } from "react";
import { useSuperbase } from "./useSuperbase";
import { useUserStore } from "../store/userStore";

export const useUserSync = () => {
  const { isLoaded: isUserLoaded, user } = useUser();
  const { isLoaded: isAuthLoaded } = useAuth();
  const setIsAdmin = useUserStore((state) => state.setIsAdmin);
  const setIsAdminLoaded = useUserStore((state) => state.setIsAdminLoaded);
  const authSupabase = useSuperbase();
  const userId = user?.id;
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress;
  const firstName = user?.firstName ?? null;
  const lastName = user?.lastName ?? null;
  const avatarUrl = user?.imageUrl ?? null;

  useEffect(() => {
    let isCurrent = true;

    if (!isAuthLoaded || !isUserLoaded) {
      setIsAdminLoaded(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsAdminLoaded(false);

    if (!user) {
      setIsAdmin(false);
      setIsAdminLoaded(true);
      return () => {
        isCurrent = false;
      };
    }

    const syncUser = async () => {
      if (!userId || !email) {
        console.error("Cannot sync Clerk user without an email address.");
        if (isCurrent) {
          setIsAdmin(false);
          setIsAdminLoaded(true);
        }
        return;
      }

      try {
        const { data: syncedUser, error: syncError } = await authSupabase
          .from("users")
          .upsert(
            {
              clerk_id: userId,
              email,
              first_name: firstName,
              last_name: lastName,
              avatar_url: avatarUrl,
            },
            { onConflict: "clerk_id" }
          )
          .select("is_admin")
          .single();

        if (syncError) throw syncError;

        if (isCurrent) {
          setIsAdmin(syncedUser?.is_admin === true);
          setIsAdminLoaded(true);
        }
      } catch (error) {
        const details =
          typeof error === "object" && error !== null
            ? {
                code: "code" in error ? error.code : undefined,
                message: "message" in error ? error.message : undefined,
                details: "details" in error ? error.details : undefined,
                hint: "hint" in error ? error.hint : undefined,
              }
            : error;
        console.error("Failed to sync Clerk user with Supabase:", details);
        // Fail closed in the UI. Database RLS must independently protect admin actions.
        if (isCurrent) {
          setIsAdmin(false);
          setIsAdminLoaded(true);
        }
      }
    };

    void syncUser();

    return () => {
      isCurrent = false;
    };
  }, [
    authSupabase,
    avatarUrl,
    email,
    firstName,
    isAuthLoaded,
    isUserLoaded,
    lastName,
    setIsAdmin,
    setIsAdminLoaded,
    userId,
  ]);
};
