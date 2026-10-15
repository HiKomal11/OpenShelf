
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [message, setMessage] = useState("Verifying your email address...");
  const [error, setError] = useState(false);

    useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        if (!cancelled) {
          setError(true);
          setMessage("This verification link is missing its token.");
        }
        return;
      }

      try {
        const result = await verifyEmail(token);

        if (!cancelled) {
          setMessage(result.message);
          setError(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(true);
          setMessage(
            err instanceof Error
              ? err.message
              : "Verification failed. Request a new verification email."
          );
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <section className="surface w-full max-w-lg rounded-3xl border theme-border p-8 text-center shadow-xl sm:p-10">
        <Link href="/" className="text-xl font-bold tracking-tight">
          OpenShelf
        </Link>

        <div className="mx-auto mt-8 flex size-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
          {error ? "!" : "✓"}
        </div>

        <h1 className="mt-5 text-2xl font-bold">
          {error ? "Email verification" : "Verify your email"}
        </h1>

        <p
          role={error ? "alert" : "status"}
          aria-live="polite"
          className={`mt-3 text-sm leading-6 ${
            error ? "text-red-600 dark:text-red-300" : "theme-muted"
          }`}
        >
          {message}
        </p>

        {error && (
          <p className="mt-3 text-sm theme-muted">
            Verification links expire after a limited time and can only be used once.
          </p>
        )}

        <Link
          href="/login"
          className="theme-primary mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold"
        >
          Continue to sign in
        </Link>

        {error && (
          <p className="mt-4 text-sm theme-muted">
            Need another link? You can request one from the sign-in page.
          </p>
        )}
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <p className="text-sm theme-muted">Loading verification page...</p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
