import { useState, useCallback } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { auth } from "@/features/core/store/firebase";
import { signInWithBackend } from "./backendAuth";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

interface AuthSession {
  message: string;
  user: AuthUser;
}

type AuthStatus = "idle" | "loading" | "success" | "error";

interface UseEmailAuthReturn {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthSession | null>;
  logout: () => void;
}

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/user-not-found": "Invalid email or password",
  "auth/wrong-password": "Invalid email or password",
  "auth/invalid-credential": "Invalid email or password",
  "auth/invalid-email": "Invalid email address",
  "auth/user-disabled": "This account has been disabled",
  "auth/too-many-requests": "Too many attempts. Please try again later",
  "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase Authentication",
};

export const useEmailAuth = (): UseEmailAuthReturn => {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<AuthSession | null> => {
    setStatus("loading");
    setError(null);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      const backendAuth = await signInWithBackend(idToken);

      await auth.signOut();

      const session: AuthSession = {
        message: backendAuth.message ?? "sign-in successful",
        user: {
          id: result.user.uid,
          email: result.user.email ?? email,
          name: result.user.displayName ?? "",
          avatar: result.user.photoURL ?? "",
        },
      };

      setUser(session.user);
      setStatus("success");
      return session;
    } catch (err: unknown) {
      await auth.signOut().catch(() => {});

      const firebaseErr = err as FirebaseError;
      const message =
        FIREBASE_ERRORS[firebaseErr?.code] ??
        (err instanceof Error ? err.message : "Something went wrong");

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

  return { status, user, error, isLoading: status === "loading", login, logout };
};
