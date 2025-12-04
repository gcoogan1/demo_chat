import { useEffect } from "react";
import { supabase } from "../../supbaseClient";
import { useAuthStore } from "./auth.store";

export const useAuth = () => {
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    let mounted = true;

    // 1. Get current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setSession(session);
    });

    // 2. Subscribe to session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session);
    });

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession]);

  // 3. Return helpers
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    signIn,
    signOut,
  };
}
