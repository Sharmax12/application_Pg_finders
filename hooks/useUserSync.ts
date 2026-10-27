import { useUser } from "@clerk/expo";
import { useEffect } from "react";
import { useSuperbase } from "./useSuperbase";
import { useUserStore } from "../store/userStore";

export const useUserSync = () => {
  const { user } = useUser();
  const setIsAdmin = useUserStore((state) => state.setIsAdmin);
  const authSupabase = useSuperbase();

  useEffect(() => {
    let isCurrent = true;

    if (!user) {
      setIsAdmin(false);
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
        if (isCurrent) setIsAdmin(false);
        return;
      }

      try {
        // clerk_id must have a UNIQUE constraint in Supabase for this upsert.
        // The database must also have RLS policies for the signed-in user's row.
        const { data, error } = await authSupabase
          .from("users")
          .upsert(
            {
              clerk_id: user.id,
              email,
              first_name: user.firstName,
              last_name: user.lastName,
              avatar_url: user.imageUrl,
            },
            { onConflict: "clerk_id" }
          )
          .select("is_admin")
          .single();

        if (error) throw error;

        if (isCurrent) {
          setIsAdmin(data?.is_admin === true);
        }
      } catch (error) {
        console.error("Failed to sync Clerk user with Supabase:", error);
        // Fail closed in the UI. Database RLS must independently protect admin actions.
        if (isCurrent) setIsAdmin(false);
      }
    };

    void syncUser();

    return () => {
      isCurrent = false;
    };
  }, [authSupabase, setIsAdmin, user]);
};
