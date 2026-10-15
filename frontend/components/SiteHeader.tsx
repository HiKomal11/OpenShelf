
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import NotificationBell from "@/components/NotificationBell";
import {
  useThemePreference,
  type ThemePreference,
} from "@/components/ThemeProvider";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Library", href: "/library" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useThemePreference();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  function handleLogout() {
    logout();
    setMobileMenuOpen(false);
    router.push("/");
  }

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  function navLinkClass(href: string) {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);

    return [
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-indigo-50 text-indigo-700 dark:bg-slate-700 dark:text-indigo-200"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white",
    ].join(" ");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex shrink-0 items-center gap-2"
          aria-label="OpenShelf home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            O
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">
              OpenShelf
            </span>
            <span className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
              Knowledge, organized and within reach.
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}

          {!loading && user && (
            <>
              <Link href="/my-library" className={navLinkClass("/my-library")}>
                My Library
              </Link>
              <Link href="/account" className={navLinkClass("/account")}>
                Account
              </Link>
              {isAdmin && (
                <Link href="/admin" className={navLinkClass("/admin")}>
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <label htmlFor="openshelf-theme" className="sr-only">
            Color theme
          </label>
          <select
            id="openshelf-theme"
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemePreference)}
            className="max-w-28 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>

          {!loading && user ? (
            <>
              <NotificationBell />
              <span
                className="hidden max-w-32 truncate text-sm font-medium text-slate-700 xl:block dark:text-slate-200"
                title={user.full_name || user.email}
              >
                {user.full_name || user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Log out
              </button>
            </>
          ) : !loading ? (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Get started
              </Link>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-xl text-slate-700 hover:bg-slate-100 sm:hidden dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="openshelf-mobile-menu"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? "×" : "☰"}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          id="openshelf-mobile-menu"
          className="border-t border-slate-200 bg-white px-4 py-4 sm:hidden dark:border-slate-700 dark:bg-slate-800"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={navLinkClass(item.href)}
              >
                {item.label}
              </Link>
            ))}

            {!loading && user && (
              <>
                <Link href="/my-library" onClick={closeMenu} className={navLinkClass("/my-library")}>
                  My Library
                </Link>
                <Link href="/account" onClick={closeMenu} className={navLinkClass("/account")}>
                  Account
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={closeMenu} className={navLinkClass("/admin")}>
                    Admin
                  </Link>
                )}
                <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
                <NotificationBell />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Log out
                </button>
              </>
            )}

            {!loading && !user && (
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium dark:border-slate-600"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </div>
            )}

            <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
              <label
                htmlFor="openshelf-theme-mobile"
                className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Appearance
              </label>
              <select
                id="openshelf-theme-mobile"
                value={theme}
                onChange={(event) => setTheme(event.target.value as ThemePreference)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}