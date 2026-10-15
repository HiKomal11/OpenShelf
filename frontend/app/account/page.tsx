
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "../providers";
import {
  getMyBookmarks,
  getMyHistory,
  getUnreadNotificationCount,
} from "@/lib/api";

type StatCardProps = {
  label: string;
  value: number;
  description: string;
  icon: "bookmark" | "history" | "notification";
  href?: string;
};

function StatCard({
  label,
  value,
  description,
  icon,
  href,
}: StatCardProps) {
  const iconPaths = {
    bookmark: (
      <path
        d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    history: (
      <>
        <path
          d="M3.5 11a8.5 8.5 0 1 1 2.3 5.8"
          strokeLinecap="round"
        />
        <path
          d="M3.5 5.5V11h5.5M12 7v5l3.5 2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    notification: (
      <>
        <path
          d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 21h4"
          strokeLinecap="round"
        />
      </>
    ),
  };

  const content = (
    <div className="surface h-full p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium theme-muted">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
            {value.toLocaleString()}
          </p>
        </div>

        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="size-5"
            aria-hidden="true"
          >
            {iconPaths[icon]}
          </svg>
        </span>
      </div>

      <p className="mt-3 text-sm theme-muted">{description}</p>

      {href && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
          View details
          <span aria-hidden="true">→</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {content}
      </Link>
    );
  }

  return content;
}

function AccountContent() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuth();

  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    async function loadAccountStats() {
      try {
        const [bookmarks, history, notifications] = await Promise.all([
          getMyBookmarks(accessToken!, 1, 1),
          getMyHistory(accessToken!, 1, 1),
          getUnreadNotificationCount(accessToken!),
        ]);

        if (cancelled) return;

        setBookmarkCount(bookmarks.total);
        setHistoryCount(history.total);
        setUnreadNotificationCount(notifications.count);
      } catch {
        // Keep the account page usable if statistics cannot be loaded.
      }
    }

    void loadAccountStats();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!user) return null;

  const isAdmin = user.roles.includes("ADMIN");
  const isRegularUser = user.roles.includes("USER");

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <main className="flex-1">
      <section className="border-b theme-border bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900">
        <div className="page-container py-10 sm:py-14">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-sm theme-muted"
          >
            <Link href="/" className="transition hover:text-indigo-600">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              My Account
            </span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/20 sm:size-20 sm:text-3xl">
                {(user.full_name || user.email || "U")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                  Account overview
                </p>

                <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  Welcome, {user.full_name || "User"}
                </h1>

                <p className="mt-1 break-all text-sm theme-muted">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/library"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border theme-border theme-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Browse library
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400/30 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container py-8 sm:py-10">
        <section aria-labelledby="activity-heading">
          <div className="mb-5">
            <h2
              id="activity-heading"
              className="text-xl font-bold tracking-tight sm:text-2xl"
            >
              Your library activity
            </h2>
            <p className="mt-1 text-sm theme-muted">
              A quick overview of your saved resources and reading activity.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Bookmarked documents"
              value={bookmarkCount}
              description="Resources you've saved for later."
              icon="bookmark"
              href="/my-library"
            />

            <StatCard
              label="Recently viewed"
              value={historyCount}
              description="Documents you've opened and read."
              icon="history"
              href="/my-library"
            />

            <StatCard
              label="Unread notifications"
              value={unreadNotificationCount}
              description="Updates waiting for your attention."
              icon="notification"
            />
          </div>
        </section>

        <section className="mt-10" aria-labelledby="details-heading">
          <div className="mb-5">
            <h2
              id="details-heading"
              className="text-xl font-bold tracking-tight sm:text-2xl"
            >
              Account details
            </h2>
            <p className="mt-1 text-sm theme-muted">
              Your profile and account access information.
            </p>
          </div>

          <div className="surface divide-y divide-slate-200 dark:divide-slate-700">
            <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm theme-muted">Full name</p>
                <p className="mt-1 break-words font-semibold">
                  {user.full_name || "Not provided"}
                </p>
              </div>
              <span className="text-sm theme-muted">Profile</span>
            </div>

            <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="text-sm theme-muted">Email address</p>
                <p className="mt-1 break-all font-semibold">{user.email}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Account email
              </span>
            </div>

            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm theme-muted">Account status</p>
                <p className="mt-1 font-semibold">
                  {user.is_active ? "Active" : "Inactive"}
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  user.is_active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                    : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    user.is_active ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                {user.is_active ? "In good standing" : "Inactive"}
              </span>
            </div>

            <div className="p-5 sm:px-6">
              <p className="text-sm theme-muted">Assigned roles</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                      role === "ADMIN"
                        ? "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300"
                        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-300"
                    }`}
                  >
                    {role === "ADMIN" ? "Administrator" : role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isAdmin && isRegularUser && (
          <section className="mt-8" aria-labelledby="mode-heading">
            <div className="surface overflow-hidden">
              <div className="border-b theme-border bg-violet-50/70 p-5 dark:bg-violet-400/5 sm:px-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="size-5"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 3v18M3 12h18"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>

                  <div>
                    <h2
                      id="mode-heading"
                      className="text-lg font-bold"
                    >
                      Switch working mode
                    </h2>
                    <p className="mt-1 text-sm theme-muted">
                      Your account has both user and administrator access.
                      Choose the workspace you want to open.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:px-6">
                <button
                  type="button"
                  onClick={() => router.push("/library")}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border theme-border theme-surface px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Switch to user mode
                  <span className="ml-2" aria-hidden="true">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Open admin workspace
                  <span className="ml-2" aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-8" aria-labelledby="personal-library-heading">
          <div className="relative overflow-hidden rounded-2xl bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-600/10 sm:p-8">
            <div
              className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full border-[32px] border-white/10"
              aria-hidden="true"
            />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold text-indigo-100">
                  Your personal space
                </p>

                <h2
                  id="personal-library-heading"
                  className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
                >
                  Keep your learning organized.
                </h2>

                <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100 sm:text-base">
                  Revisit saved PDFs, continue exploring documents, and keep
                  the resources you care about close at hand.
                </p>
              </div>

              <Link
                href="/my-library"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 sm:self-center"
              >
                Open My Library
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-sm theme-muted">
          OpenShelf · Knowledge, organized and within reach.
        </p>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}