"use client";

import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const verificationSchema = z.object({
  code: z
    .string()
    .length(4, "Code must be 4 digits")
    .regex(/^\d+$/, "Only numbers allowed"),
});

type FormData = z.infer<typeof verificationSchema>;

type VerificationSession = {
  accessToken?: string;
  refreshToken?: string;
};

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function EmailVerificationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(verificationSchema),
  });

  const code = watch("code", "");

  const onSubmit = async (data: FormData) => {
    const email = localStorage.getItem("pending_email");
    setIsSubmitting(true);

    try {
      const session = await api.post<VerificationSession>("/auth/verify-email", { email, otp: data.code });
      if (session?.accessToken && session.refreshToken) {
        localStorage.setItem(TOKEN_KEY, session.accessToken);
        localStorage.setItem(REFRESH_KEY, session.refreshToken);
      }

      localStorage.removeItem("pending_email");
      router.push("/register/details");

    } catch {
      setError("code", { type: "manual", message: "Server error. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async () => {
    const email = localStorage.getItem("pending_email");
    setIsResending(true);

    try {
      await api.post("/auth/resend-otp", { email });
    } catch {
      // silently fail — user can try again
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="bg-background min-h-screen flex flex-col items-center justify-center p-4 lg:p-0 overflow-hidden relative">
      <div className="absolute w-[10000px] h-[400px] bg-[#3B82F6] opacity-10 blur-[120px] rounded-full top-[-300px] z-0"></div>
      <div className="absolute w-[10000px] h-[400px] bg-[#3B82F6] opacity-10 blur-[120px] rounded-full bottom-[-300px] z-0"></div>

      <div className="z-10 w-full max-w-sm p-[1px] rounded-[30px] bg-gradient-to-b from-gray-700 from-[10%] via-slate-800 via-[45%] to-slate-700 to-[100%]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="z-10 bg-linear-to-b from-[#15182B] to-[#1C2140] text-center flex flex-col gap-6 items-center p-6 md:p-8 rounded-[30px] shadow-2xl"
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white">Verify Your Email Address</h1>
            <p className="text-gray-400 font-bold text-sm">
              {"We've sent a 4-digit verification code to your email. Please enter it below."}
            </p>
          </div>

          <input
            id="code-input"
            {...register("code")}
            maxLength={4}
            autoFocus
            className="absolute opacity-0"
          />

          <div
            className="flex gap-2 cursor-text"
            onClick={() => document.getElementById("code-input")?.focus()}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-16 h-16 rounded-xl bg-background border flex items-center justify-center transition-colors
                  ${errors.code ? "border-red-500" : "border-gray-500"}`}
              >
                <h1 className="text-white text-2xl">{code[i] || ""}</h1>
              </div>
            ))}
          </div>

          {errors.code && (
            <p className="text-red-500 text-xs -mt-4 font-semibold flex items-center gap-1.5">
              <CircleAlert size={14} />
              {errors.code.message}
            </p>
          )}

          <div className="flex flex-col gap-2 w-full">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#00FFA3] to-[#3B82F6] py-4 px-8 rounded-lg text-white font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Verifying..." : "Continue"}
            </button>

            <button
              type="button"
              onClick={onResend}
              disabled={isResending}
              className="bg-transparent py-4 px-8 rounded-lg text-white font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00FFA3] to-[#3B82F6]">
                {isResending ? "Sending..." : "Resend code"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
