"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Icon, Logo } from "@/features/core/presentation/components/drexa_kit";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        await api.post("/auth/refresh", undefined, { retryOnUnauthorized: false });
        if (isMounted) setIsAllowed(true);
      } catch {
        if (!isMounted) return;
        setNeedsLogin(true);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (needsLogin) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 620, height: 620, background: "rgba(26,111,212,0.12)", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 440, padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
            <Logo size={42} />
          </div>
          
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "40px 32px", boxShadow: "var(--shadow-pop)", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 24 }}>
              <Icon name="lock" size={28} color="var(--blue)" stroke={2} />
            </div>

            <h1 style={{ font: "700 24px var(--font)", color: "var(--text-hi)", letterSpacing: "-.02em" }}>Login Required</h1>
            <p style={{ font: "500 15px var(--font)", color: "var(--text-2)", marginTop: 12, lineHeight: 1.5 }}>
              Your session has expired or you need to be signed in to access this page. Please log in to continue.
            </p>

            <button
              onClick={() => router.replace("/login")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", height: 50, borderRadius: "var(--r-md)", border: "none", marginTop: 32,
                cursor: "pointer", font: "700 15px var(--font)",
                background: "var(--blue)", color: "#fff", transition: "background .14s",
              }}
              onMouseOver={e => e.currentTarget.style.background = "var(--blue-hover)"}
              onMouseOut={e => e.currentTarget.style.background = "var(--blue)"}
            >
              Sign in to Drexa <Icon name="arrowRight" size={16} stroke={2.5} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAllowed) return null;

  return <>{children}</>;
}
