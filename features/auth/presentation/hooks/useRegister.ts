import { useState, useCallback } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { auth } from "@/features/core/store/firebase";
import { signInWithBackend } from "./backendAuth";

type RegisterStatus = "idle" | "loading" | "success" | "error";

interface UseRegisterReturn {
  status: RegisterStatus;
  error: string | null;
  isLoading: boolean;
  register: (email: string, password: string) => Promise<boolean>;
}

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists",
  "auth/invalid-email": "Invalid email address",
  "auth/weak-password": "Password is too weak",
  "auth/operation-not-allowed": "Email/password sign-up is not enabled",
};

export const useRegister = (): UseRegisterReturn => {
  const [status, setStatus] = useState<RegisterStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    setStatus("loading");
    setError(null);

    let firebaseUser: User | null = null;

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();
      const uid = firebaseUser.uid;

      await signInWithBackend(idToken);
      await auth.signOut();

      // Store Firebase UID so the OTP verification page can use it as user_id
      localStorage.setItem("pending_uid", uid);

      setStatus("success");
      return true;
    } catch (err: unknown) {
      await firebaseUser?.delete().catch(() => {});
      await auth.signOut().catch(() => {});

      const firebaseErr = err as FirebaseError;
      const message =
        FIREBASE_ERRORS[firebaseErr?.code] ??
        (err instanceof Error ? err.message : "Something went wrong");

      setError(message);
      setStatus("error");
      return false;
    }
  }, []);

  return { status, error, isLoading: status === "loading", register };
};
