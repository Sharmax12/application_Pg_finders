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
      const email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress;

      if (!email) {
        console.error("Cannot sync Clerk user without an email address.");
        if (isCurrent) {
          setIsAdmin(false);
          setIsAdminLoaded(true);
        }
        return;
      }

      try {
        const { data: existingUser, error: lookupError } = await authSupabase
          .from("users")
          .select("clerk_id, is_admin")
          .eq("clerk_id", user.id)
          .maybeSingle();

        if (lookupError) throw lookupError;

        if (existingUser) {
          if (isCurrent) {
            setIsAdmin(existingUser.is_admin === true);
            setIsAdminLoaded(true);
          }
          return;
        }

        const { data: newUser, error: insertError } = await authSupabase
          .from("users")
          .insert({
            clerk_id: user.id,
            email,
            first_name: user.firstName,
            last_name: user.lastName,
            avatar_url: user.imageUrl,
          })
          .select("is_admin")
          .single();

        if (insertError) {
          // Another render/device may have created the profile after our lookup.
          // Re-read once so the unique-clerk_id race does not leave the UI stuck.
          const { data: concurrentUser, error: concurrentLookupError } =
            await authSupabase
              .from("users")
              .select("clerk_id, is_admin")
              .eq("clerk_id", user.id)
              .maybeSingle();

          if (concurrentLookupError || !concurrentUser) throw insertError;

          if (isCurrent) {
            setIsAdmin(concurrentUser.is_admin === true);
            setIsAdminLoaded(true);
          }
          return;
        }

        if (isCurrent) {
          setIsAdmin(newUser?.is_admin === true);
          setIsAdminLoaded(true);
        }
      } catch (error) {
        console.error("Failed to sync Clerk user with Supabase:", error);
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
    isAuthLoaded,
    isUserLoaded,
    setIsAdmin,
    setIsAdminLoaded,
    user,
  ]);
};
