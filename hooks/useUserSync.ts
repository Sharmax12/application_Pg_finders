import { useUser } from "@clerk/expo";
import { useEffect } from "react";
import { useSuperbase } from "./useSuperbase";
import { useUserStore } from "../store/userStore";

export const useUserSync = () => {
  const { user } = useUser();
  const setAdminStatus = useUserStore((state) => state.setAdminStatus);
  const authSupabase = useSuperbase();

  useEffect(() => {
    let isCurrent = true;

    if (!user) {
      setAdminStatus(false, true);
      return () => {
        isCurrent = false;
      };
    }

    setAdminStatus(false, false);

    const syncUser = async () => {
      const email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress;

      if (!email) {
        console.error("Cannot sync Clerk user without an email address.");
        if (isCurrent) setAdminStatus(false, true);
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
          if (isCurrent) setAdminStatus(existingUser.is_admin === true, true);
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

          if (isCurrent) setAdminStatus(concurrentUser.is_admin === true, true);
          return;
        }

        if (isCurrent) setAdminStatus(newUser?.is_admin === true, true);
      } catch (error) {
        console.error("Failed to sync Clerk user with Supabase:", error);
        // Fail closed in the UI. Database RLS must independently protect admin actions.
        if (isCurrent) setAdminStatus(false, true);
      }
    };

    void syncUser();

    return () => {
      isCurrent = false;
    };
  }, [authSupabase, setAdminStatus, user]);
};
