
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          >
            OpenShelf
          </Link>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Knowledge, organized and within reach.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300"
        >
          <Link className="hover:text-indigo-600 dark:hover:text-indigo-300" href="/">
            Home
          </Link>
          <Link className="hover:text-indigo-600 dark:hover:text-indigo-300" href="/library">
            Browse library
          </Link>
          <Link className="hover:text-indigo-600 dark:hover:text-indigo-300" href="/login">
            Log in
          </Link>
          <Link className="hover:text-indigo-600 dark:hover:text-indigo-300" href="/register">
            Create account
          </Link>
        </nav>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} OpenShelf
        </p>
      </div>
    </footer>
  );
}