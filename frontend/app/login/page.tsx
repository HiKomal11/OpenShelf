"use client";

import {
Suspense,
useState,
type FormEvent,
} from "react";
import Link from "next/link";
import {
useRouter,
useSearchParams,
} from "next/navigation";
import { useAuth } from "../providers";
import { resendVerificationEmail } from "@/lib/api";

function LoginForm() {
const router = useRouter();
const searchParams = useSearchParams();
const { login, user } = useAuth();

const emailParam = searchParams.get("email");
const [email, setEmail] = useState(() => emailParam ?? "");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const [googleLoading, setGoogleLoading] = useState(false);

const [showVerificationHelp, setShowVerificationHelp] =
useState(false);
const [resendLoading, setResendLoading] = useState(false);
const [resendMessage, setResendMessage] = useState("");
const [resendError, setResendError] = useState("");

const handleResendVerification = async () => {
setResendMessage("");
setResendError("");


if (!email.trim()) {
  setResendError("Enter your email address first.");
  return;
}

setResendLoading(true);

try {
  const result = await resendVerificationEmail(email.trim());
  setResendMessage(result.message);
} catch (err) {
  setResendError(
    err instanceof Error
      ? err.message
      : "Unable to request a verification email. Please try again."
  );
} finally {
  setResendLoading(false);
}


};

const handleGoogleLogin = () => {
const apiUrl =
process.env.NEXT_PUBLIC_API_URL ||
"http://127.0.0.1:8000";


setError("");
setShowVerificationHelp(false);
setGoogleLoading(true);

// Google OAuth starts on the backend and requires full-page navigation.
// eslint-disable-next-line @next/next/no-location-assign-relative-destination
window.location.assign(`${apiUrl}/api/v1/auth/google/login`);


};

const handleSubmit = async (
event: FormEvent<HTMLFormElement>
) => {
event.preventDefault();
setError("");
setShowVerificationHelp(false);
setResendMessage("");
setResendError("");


if (!email.trim() || !password) {
  setError("Email and password are required.");
  return;
}

setLoading(true);

try {
  const loggedInUser = await login({
    email: email.trim(),
    password,
  });

  const returnTo = searchParams.get("returnTo");

  // Only allow local application paths for post-login redirects.
  if (
    returnTo &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !returnTo.includes("\\")
  ) {
    router.push(returnTo);
  } else if (
    loggedInUser.roles.includes("USER") &&
    loggedInUser.roles.includes("ADMIN")
  ) {
    router.push("/account");
  } else if (loggedInUser.roles.includes("ADMIN")) {
    router.push("/admin");
  } else {
    router.push("/library");
  }
} catch (err) {
  const message =
    err instanceof Error
      ? err.message
      : "Login failed. Please check your credentials.";

  setError(message);
  setShowVerificationHelp(
    /verify your email address/i.test(message)
  );
} finally {
  setLoading(false);
}


};

return ( <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12"> <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border theme-border bg-white shadow-xl shadow-slate-900/5 dark:bg-slate-900 lg:min-h-[600px] lg:grid-cols-2">
{/* Welcome panel */} <section className="relative hidden overflow-hidden bg-indigo-600 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12"> <div
         className="pointer-events-none absolute -right-24 -top-20 size-80 rounded-full border-[48px] border-white/10"
         aria-hidden="true"
       />


      <div
        className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full border-[42px] border-white/10"
        aria-hidden="true"
      />

      <Link
        href="/"
        className="relative inline-flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-white/15 text-xl font-bold">
          O
        </span>
        <span className="text-xl font-bold tracking-tight">
          OpenShelf
        </span>
      </Link>

      <div className="relative max-w-md py-10">
        <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-50">
          YOUR PERSONAL LEARNING SPACE
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
          Your next chapter of learning starts here.
        </h1>

        <p className="mt-5 text-base leading-7 text-indigo-100">
          Sign in to revisit your saved PDFs, continue
          exploring your reading history, and discover
          knowledge worth sharing.
        </p>

        <div className="mt-9 space-y-4">
          {[
            "Keep your favorite PDFs close",
            "Continue exploring your reading history",
            "Discover your next learning resource",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm">
                ✓
              </span>
              <span className="text-sm font-medium text-indigo-50">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-sm text-indigo-100">
        Knowledge, organized and within reach.
      </p>
    </section>

    {/* Sign-in form */}
    <section className="flex min-w-0 flex-col justify-center p-6 sm:p-10 lg:p-12">
      <div className="mb-8 lg:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-3 rounded-lg"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            O
          </span>
          <span className="text-xl font-bold tracking-tight">
            OpenShelf
          </span>
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
          YOUR ACCOUNT
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Sign in
        </h2>

        <p className="mt-3 text-sm leading-6 theme-muted">
          Welcome back. Sign in to access your saved PDFs,
          bookmarks, and personal learning space.
        </p>
      </div>

      {user && (
        <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-100">
          You are already signed in. Continue to your{" "}
          <Link
            href="/account"
            className="font-semibold underline underline-offset-2"
          >
            account
          </Link>
          .
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300"
        >
          <span
            className="mt-0.5 font-bold"
            aria-hidden="true"
          >
            !
          </span>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold"
          >
            Email address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={loading || googleLoading}
            className="theme-control min-h-12 w-full rounded-xl px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold"
          >
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            disabled={loading || googleLoading}
            className="theme-control min-h-12 w-full rounded-xl px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="theme-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <span
              className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden="true"
            />
          )}
          {loading ? "Signing you in..." : "Sign in to OpenShelf"}
        </button>

        <div className="flex items-center gap-4 py-1">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />

          <span className="text-xs font-medium uppercase tracking-wider theme-muted">
            Or continue with
          </span>

          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="theme-control inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
        >
          {googleLoading ? (
            <span
              className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden="true"
            />
          ) : (
            <svg
              viewBox="0 0 48 48"
              className="size-5"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.01 13.22l7.98 6.19C12.88 13.72 18.02 9.5 24 9.5Z"
                transform="translate(0 4)"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.98 46.98 31.93 46.98 24.55Z"
              />
              <path
                fill="#FBBC05"
                d="M10.99 28.59A14.4 14.4 0 0 1 10.23 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 .48 24c0 3.87.93 7.52 2.53 10.78l7.98-6.19Z"
                transform="translate(0 4)"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-5.98 0-11.12-4.22-13.01-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                transform="translate(0 -4)"
              />
            </svg>
          )}

          {googleLoading
            ? "Connecting to Google..."
            : "Continue with Google"}
        </button>
      </form>

      {/* Only show verification help after an unverified-login error. */}
      {showVerificationHelp && (
        <div className="mt-5 rounded-xl border theme-border p-4">
          <h3 className="text-sm font-semibold">
            Didn&apos;t receive a verification email?
          </h3>

          <p className="mt-1 text-sm leading-6 theme-muted">
            Check your inbox and spam folder. You can request
            another verification link below.
          </p>

          {resendMessage && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-sm text-emerald-600 dark:text-emerald-300"
            >
              {resendMessage}
            </p>
          )}

          {resendError && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-600 dark:text-red-300"
            >
              {resendError}
            </p>
          )}

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={loading || googleLoading || resendLoading}
            className="theme-control mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
          >
            {resendLoading
              ? "Requesting email..."
              : "Resend verification email"}
          </button>
        </div>
      )}

      <p className="mt-7 text-center text-sm theme-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-8 text-center text-xs leading-5 theme-muted">
        Your learning space, your way. Browse the public library
        anytime, or sign in to access your personal features.
      </p>

      <footer className="mt-8 border-t theme-border pt-5">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
        >
          OpenShelf
        </Link>

        <nav
          aria-label="Footer navigation"
          className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs theme-muted"
        >
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/library" className="hover:underline">
            Browse library
          </Link>
          <Link href="/login" className="hover:underline">
            Log in
          </Link>
        </nav>
      </footer>
    </section>
  </div>
</main>


);
}

export default function LoginPage() {
return (
<Suspense
fallback={ <main className="flex flex-1 items-center justify-center px-4 py-12"> <div className="surface flex items-center gap-3 px-5 py-4"> <span
           className="size-5 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent"
           aria-hidden="true"
         /> <p className="text-sm theme-muted">
Loading sign-in page... </p> </div> </main>
}
> <LoginForm /> </Suspense>
);
}
