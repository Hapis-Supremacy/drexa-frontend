"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        const res = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("unauthorized");
        }

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
      <main className="bg-background min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute w-[10000px] h-[400px] bg-[#3B82F6] opacity-10 blur-[120px] rounded-full top-[-300px] z-0"></div>
        <div className="absolute w-[10000px] h-[400px] bg-[#3B82F6] opacity-10 blur-[120px] rounded-full bottom-[-300px] z-0"></div>

        <div className="z-10 w-full max-w-md p-[1px] rounded-[30px] bg-gradient-to-b from-gray-700 from-[10%] via-slate-800 via-[45%] to-slate-700 to-[100%]">
          <section className="bg-linear-to-b from-[#15182B] to-[#1C2140] p-8 rounded-[30px] shadow-2xl text-center">
            <h1 className="text-3xl text-white font-bold">Login Required</h1>
            <p className="text-gray-400 font-semibold mt-3">
              Please log in before accessing the dashboard.
            </p>

            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="bg-gradient-to-r from-[#00FFA3] to-[#3B82F6] opacity-100 hover:opacity-90 transition-all duration-300 cursor-pointer py-4 px-8 rounded-lg text-white font-bold w-full mt-8"
            >
              Login
            </button>
          </section>
        </div>
      </main>
    );
  }

  if (!isAllowed) return null;

  return <>{children}</>;
}
