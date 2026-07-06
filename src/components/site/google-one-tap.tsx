import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { signInWithGoogleCredential } from "@/lib/auth";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";

// Google OAuth Web client ID. Public value (like the Firebase config) — safe to
// ship. Override via VITE_GOOGLE_CLIENT_ID in .env if the project changes.
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  "153740827461-oeq72rofu53nq606ml4qtt0nqor1nv3v.apps.googleusercontent.com";

const GSI_SRC = "https://accounts.google.com/gsi/client";

type IdConfig = { credential?: string };
type Gsi = {
  accounts: {
    id: {
      initialize: (o: Record<string, unknown>) => void;
      prompt: () => void;
      cancel: () => void;
    };
  };
};
declare global {
  interface Window { google?: Gsi }
}

// Shows Google One Tap to logged-out visitors; the returned ID token is exchanged
// for a Firebase session. Renders nothing.
export function GoogleOneTap() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const started = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || loading || user || started.current || !CLIENT_ID) return;
    started.current = true;

    const prompt = () => {
      const id = window.google?.accounts?.id;
      if (!id) return;
      id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp: IdConfig) => {
          if (!resp.credential) return;
          try {
            await signInWithGoogleCredential(resp.credential);
            toast.success(t("auth.googleSignedIn"));
          } catch (e) {
            toast.error(friendlyAuthError(e));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: true,
      });
      id.prompt();
    };

    if (window.google?.accounts?.id) { prompt(); return; }
    let s = document.getElementById("gsi-client") as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      s.defer = true;
      s.id = "gsi-client";
      document.head.appendChild(s);
    }
    s.addEventListener("load", prompt);
    return () => s?.removeEventListener("load", prompt);
  }, [user, loading, t]);

  // Dismiss any open One Tap once signed in.
  useEffect(() => {
    if (user) window.google?.accounts?.id?.cancel?.();
  }, [user]);

  return null;
}
