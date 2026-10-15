
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";


const TOKEN_KEY = "pdf_library_access_token";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // Prevent duplicate OAuth code exchanges.
    if (started.current) return;
    started.current = true;

    const exchangeCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        setError(
          "Google authentication failed. No authorization code was received."
        );
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("API URL is not configured.");
        }

        const response = await fetch(
          `${apiUrl}/api/v1/auth/google/exchange`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ code }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Google authentication failed."
          );
        }

        if (!data.access_token) {
          throw new Error(
            "Google sign-in succeeded, but no access token was returned."
          );
        }
const currentUser = await setSession(data.access_token);

        // Redirect according to the user's actual roles.
        if (
          currentUser.roles.includes("USER") &&
          currentUser.roles.includes("ADMIN")
        ) {
          router.replace("/account");
        } else if (currentUser.roles.includes("ADMIN")) {
          router.replace("/admin");
        } else {
          router.replace("/library");
        }
      } catch (err) {
        console.error("Google authentication error:", err);

        // Do not leave an invalid or unusable session token behind.
        localStorage.removeItem(TOKEN_KEY);

        setError(
          err instanceof Error
            ? err.message
            : "Google authentication failed. Please try again."
        );
      }
    };

    exchangeCode();
  }, [setSession, router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            Google Sign-In Failed
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

        <p className="mt-4 text-sm text-slate-600">
          Completing Google sign-in...
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Please wait while we verify your account.
        </p>
      </div>
    </main>
  );
}
