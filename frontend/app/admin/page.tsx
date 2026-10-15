"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/app/providers";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type AdminDashboardResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    roles: string[];
  };
};

function AdminDashboardContent() {
  const router = useRouter();
  const { accessToken, user, logout } = useAuth();

  const [data, setData] =
    useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchAdminDashboard = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/v1/admin/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to access the admin dashboard."
          );
        }

        if (!response.ok) {
          throw new Error("Failed to load admin dashboard.");
        }

        const result: AdminDashboardResponse =
          await response.json();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAdminDashboard();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="page-container w-full py-10 sm:py-14">
        <div className="surface mx-auto max-w-5xl p-6 sm:p-10">
          <div className="flex items-center gap-4">
            <div
              className="h-11 w-11 animate-pulse rounded-xl bg-indigo-100 dark:bg-indigo-950"
              aria-hidden="true"
            />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-64 max-w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>

          <p className="theme-muted mt-6 text-sm">
            Loading your admin dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-container w-full py-10 sm:py-14">
        <section
          className="surface mx-auto max-w-2xl p-6 sm:p-10"
          aria-labelledby="admin-error-title"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5m0 3h.01" />
            </svg>
          </div>

          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            ADMIN ACCESS
          </p>

          <h1
            id="admin-error-title"
            className="mt-2 text-2xl font-bold tracking-tight"
          >
            Unable to open the dashboard
          </h1>

          <p className="theme-muted mt-3 break-words text-sm leading-6">
            {error}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/account")}
              className="theme-primary rounded-xl px-5 py-3 text-sm font-semibold transition"
            >
              Go to My Account
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="theme-control rounded-xl px-5 py-3 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </section>
      </main>
    );
  }

  const displayedUser = data?.user;
  const displayedRoles =
    displayedUser?.roles ?? user?.roles ?? [];

  const hasUserAndAdminRoles =
    displayedRoles.includes("USER") &&
    displayedRoles.includes("ADMIN");

  const adminName =
    displayedUser?.full_name || user?.full_name || "Administrator";

  const adminEmail =
    displayedUser?.email || user?.email || "N/A";

  const adminId =
    displayedUser?.id || user?.id || "N/A";

  return (
    <main className="page-container w-full py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Administration
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="theme-muted mt-2 max-w-2xl text-sm leading-6 sm:text-base">
              Manage your library, organize educational resources,
              and oversee registered accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="theme-control inline-flex min-h-11 items-center justify-center gap-2 self-start px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800 sm:self-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M10 17l5-5-5-5m5 5H3" />
              <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </svg>
            Log out
          </button>
        </header>

        {/* Welcome panel */}
        <section className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-lg shadow-indigo-950/10 sm:p-8">
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-2 -top-6 h-36 w-36 rounded-full border border-white/10"
            aria-hidden="true"
          />

          <div className="relative max-w-2xl">
            <p className="text-sm font-medium text-indigo-100">
              OpenShelf administration
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {adminName}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
              Your workspace for keeping knowledge organized,
              accessible, and ready to discover.
            </p>

            <button
              type="button"
              onClick={() => router.push("/library")}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              Explore public library
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        {/* Management navigation */}
        <section aria-labelledby="management-heading">
          <div className="mb-4">
            <h2
              id="management-heading"
              className="text-xl font-bold tracking-tight"
            >
              Library management
            </h2>
            <p className="theme-muted mt-1 text-sm">
              Choose an area to manage.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => router.push("/admin/documents")}
              className="surface group flex min-h-48 flex-col p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700 sm:p-6"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path d="M6 3h8l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                    <path d="M14 3v6h5M8 13h8M8 17h8" />
                  </svg>
                </span>

                <span className="theme-muted transition group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                  <span aria-hidden="true">↗</span>
                </span>
              </div>

              <h3 className="mt-5 text-base font-bold">
                Documents
              </h3>

              <p className="theme-muted mt-2 text-sm leading-6">
                Create documents, update metadata, and manage
                educational PDF resources.
              </p>

              <span className="mt-auto pt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                Manage documents →
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/categories")}
              className="surface group flex min-h-48 flex-col p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700 sm:p-6"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="8" height="8" rx="2" />
                    <rect x="13" y="3" width="8" height="5" rx="2" />
                    <rect x="13" y="10" width="8" height="11" rx="2" />
                    <rect x="3" y="13" width="8" height="8" rx="2" />
                  </svg>
                </span>

                <span className="theme-muted transition group-hover:text-emerald-600">
                  <span aria-hidden="true">↗</span>
                </span>
              </div>

              <h3 className="mt-5 text-base font-bold">
                Categories
              </h3>

              <p className="theme-muted mt-2 text-sm leading-6">
                Organize resources into useful categories so
                readers can discover them more easily.
              </p>

              <span className="mt-auto pt-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Manage categories →
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/users")}
              className="surface group flex min-h-48 flex-col p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700 sm:col-span-2 sm:p-6 lg:col-span-1"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="8" r="3.5" />
                    <path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20Z" />
                    <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14a5.5 5.5 0 0 1 3.5 5.1V20" />
                  </svg>
                </span>

                <span className="theme-muted transition group-hover:text-amber-600">
                  <span aria-hidden="true">↗</span>
                </span>
              </div>

              <h3 className="mt-5 text-base font-bold">
                User management
              </h3>

              <p className="theme-muted mt-2 text-sm leading-6">
                Review registered accounts and manage user status
                and administrator access.
              </p>

              <span className="mt-auto pt-4 text-sm font-semibold text-amber-700 dark:text-amber-300">
                Manage users →
              </span>
            </button>
          </div>
        </section>

        {/* Account and roles */}
        <section className="mt-8 grid gap-5 lg:grid-cols-5">
          <div className="surface p-5 sm:p-6 lg:col-span-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </span>

              <div>
                <h2 className="font-bold">Administrator profile</h2>
                <p className="theme-muted text-sm">
                  Your current account information
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-4">
              <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
                <dt className="theme-muted text-sm">Full name</dt>
                <dd className="break-long-content text-sm font-medium">
                  {adminName}
                </dd>
              </div>

              <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
                <dt className="theme-muted text-sm">Email</dt>
                <dd className="break-long-content text-sm font-medium">
                  {adminEmail}
                </dd>
              </div>

              <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
                <dt className="theme-muted text-sm">User ID</dt>
                <dd className="break-long-content font-mono text-xs leading-5">
                  {adminId}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => router.push("/account")}
              className="theme-control mt-6 min-h-10 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              View account settings
            </button>
          </div>

          <div className="surface p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M12 3 20 7v5c0 4.5-3.2 7.5-8 9-4.8-1.5-8-4.5-8-9V7l8-4Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>

              <div>
                <h2 className="font-bold">Account roles</h2>
                <p className="theme-muted text-sm">
                  Assigned permissions
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {displayedRoles.length > 0 ? (
                displayedRoles.map((role) => (
                  <span
                    key={role}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      role === "ADMIN"
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {role}
                  </span>
                ))
              ) : (
                <p className="theme-muted text-sm">
                  No roles available.
                </p>
              )}
            </div>

            <div className="theme-border mt-6 border-t pt-5">
              <p className="theme-muted text-xs leading-5">
                Your assigned roles determine which protected
                administration features you can access.
              </p>
            </div>
          </div>
        </section>

        {/* Working mode */}
        {hasUserAndAdminRoles && (
          <section className="surface mt-5 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                Working mode
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Choose your workspace
              </h2>

              <p className="theme-muted mt-1 max-w-xl text-sm leading-6">
                Switch between the public library and administration.
                Your assigned roles and permissions remain unchanged.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/library")}
                className="theme-control min-h-11 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                User Mode
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin")}
                aria-current="page"
                className="theme-primary min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
              >
                Admin Mode · Current
              </button>
            </div>
          </section>
        )}

        {/* API status */}
        <section className="theme-surface mt-5 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M12 3 20 7v5c0 4.5-3.2 7.5-8 9-4.8-1.5-8-4.5-8-9V7l8-4Z" />
                  <path d="m8.5 12 2.3 2.3 4.7-4.7" />
                </svg>
              </span>

              <div>
                <h2 className="font-bold">Dashboard status</h2>
                <p className="theme-muted mt-1 text-sm leading-6">
                  {data?.message ||
                    "Admin dashboard access granted."}
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Access granted
            </span>
          </div>
        </section>

        {/* Footer navigation */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
          <p className="theme-muted text-xs">
            OpenShelf · Administration workspace
          </p>

          <button
            type="button"
            onClick={() => router.push("/account")}
            className="theme-muted text-sm font-medium transition hover:text-indigo-600 dark:hover:text-indigo-300"
          >
            ← Back to My Account
          </button>
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}