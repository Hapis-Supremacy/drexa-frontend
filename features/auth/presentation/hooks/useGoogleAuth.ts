import { useState, useCallback } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/features/core/store/firebase";
import { signInWithBackend } from "./backendAuth";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: "google";
}

interface AuthSession {
  message: string;
  user: AuthUser;
}

type AuthStatus = "idle" | "loading" | "success" | "error";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/operation-not-allowed": "Google sign-in is not enabled in Firebase Authentication",
};

interface UseGoogleAuthReturn {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  isLoading: boolean;
  login: () => Promise<AuthSession | null>;
  logout: () => void;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (): Promise<AuthSession | null> => {
    setStatus("loading");
    setError(null);

    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const backendAuth = await signInWithBackend(idToken);

      await auth.signOut();

      const session: AuthSession = {
        message: backendAuth.message ?? "sign-in successful",
        user: {
          id: result.user.uid,
          email: result.user.email ?? "",
          name: result.user.displayName ?? "",
          avatar: result.user.photoURL ?? "",
          provider: "google",
        },
      };

      setUser(session.user);
      setStatus("success");
      return session;
    } catch (err: unknown) {
      await auth.signOut().catch(() => {});

      if ((err as { code?: string })?.code === "auth/popup-closed-by-user") {
        setStatus("idle");
        return null;
      }

      const firebaseErr = err as { code?: string };
      const message =
        FIREBASE_ERRORS[firebaseErr?.code ?? ""] ??
        (err instanceof Error ? err.message : "Unknown error occurred");
      setError(message);
      setStatus("error");
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    status,
    user,
    error,
    isLoading: status === "loading",
    login,
    logout,
  };
};
