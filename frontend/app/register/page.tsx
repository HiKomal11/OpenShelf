
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "../providers";

const passwordRules = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /[0-9]/.test(value) },
  {
    label: "One special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

export default function RegisterPage() {
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const passwordIsValid = passwordRules.every((rule) => rule.test(password));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!passwordIsValid) {
      setError("Please meet all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border theme-border bg-white shadow-xl shadow-slate-900/5 dark:bg-slate-900 lg:min-h-[620px] lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-indigo-600 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="pointer-events-none absolute -right-24 -top-20 size-80 rounded-full border-[48px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full border-[42px] border-white/10" />

          <Link href="/" className="relative inline-flex w-fit items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/15 text-xl font-bold">O</span>
            <span className="text-xl font-bold tracking-tight">OpenShelf</span>
          </Link>

          <div className="relative max-w-md py-10">
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-50">
              START YOUR LEARNING JOURNEY
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Make room for new ideas.
            </h1>
            <p className="mt-5 text-base leading-7 text-indigo-100">
              Create your account and build a personal space for educational resources.
            </p>
            <div className="mt-9 space-y-4">
              {[
                "Discover educational PDFs",
                "Bookmark useful resources",
                "Keep track of your reading",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-sm">✓</span>
                  <span className="text-sm font-medium text-indigo-50">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-sm text-indigo-100">
            Knowledge, organized and within reach.
          </p>
        </section>

        <section className="flex min-w-0 flex-col justify-center p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">O</span>
              <span className="text-xl font-bold tracking-tight">OpenShelf</span>
            </Link>
          </div>

          {success ? (
            <div role="status" aria-live="polite">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                ACCOUNT CREATED
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Check your inbox
              </h2>
              <p className="mt-4 text-sm leading-6 theme-muted">
                Your account has been created. We have requested a verification
                email for <strong>{email.trim()}</strong>. Open that email and
                follow its verification link before signing in.
              </p>
              <p className="mt-3 text-sm leading-6 theme-muted">
                If the email does not arrive, check your spam folder or use the
                resend option on the sign-in page.
              </p>
              <Link
                href={`/login?email=${encodeURIComponent(email.trim())}`}
                className="theme-primary mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                  JOIN OPENSHELF
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Create your account
                </h2>
                <p className="mt-3 text-sm leading-6 theme-muted">
                  Get started with your own personal learning library.
                </p>
              </div>

              {error && (
                <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-sm font-semibold">
                    Full name <span className="font-normal theme-muted">(optional)</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    disabled={loading}
                    className="theme-control min-h-12 w-full px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={loading}
                    className="theme-control min-h-12 w-full px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={passwordVisible ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      disabled={loading}
                      className="theme-control min-h-12 w-full px-4 py-3 pr-20 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      className="absolute inset-y-0 right-3 my-auto px-2 text-xs font-semibold theme-muted"
                    >
                      {passwordVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-2 text-xs ${
                            passed ? "text-emerald-600 dark:text-emerald-300" : "theme-muted"
                          }`}
                        >
                          <span aria-hidden="true">{passed ? "✓" : "○"}</span>
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={confirmPasswordVisible ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
                      className="theme-control min-h-12 w-full px-4 py-3 pr-20 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                      className="absolute inset-y-0 right-3 my-auto px-2 text-xs font-semibold theme-muted"
                    >
                      {confirmPasswordVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-300">
                      The passwords don&apos;t match yet.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !passwordIsValid || password !== confirmPassword}
                  className="theme-primary mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating your account..." : "Create account"}
                </button>
              </form>

              <p className="mt-7 text-center text-sm theme-muted">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                  Sign in
                </Link>
              </p>
            </>
          )}

          <p className="mt-7 text-center text-xs leading-5 theme-muted">
            Your account gives you access to personal library features, including bookmarks and reading history.
          </p>
        </section>
      </div>
    </main>
  );
}