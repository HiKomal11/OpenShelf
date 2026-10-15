"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorPageProps = {
error: Error & { digest?: string };
reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
useEffect(() => {
console.error("OpenShelf page error:", error);
}, [error]);

return ( <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6"> <section
     role="alert"
     className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10"
   > <Link
       href="/"
       className="inline-flex items-center gap-2 text-sm font-bold tracking-tight"
       aria-label="OpenShelf home"
     > <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white">
O </span>
OpenShelf </Link>


    <div className="mx-auto mt-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-3xl text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
      !
    </div>

    <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
      Something went wrong
    </p>

    <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
      Let&apos;s get you back on track.
    </h1>

    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
      This page ran into an unexpected problem. You can try loading it
      again or return to the library.
    </p>

    {error.digest ? (
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Reference: {error.digest}
      </p>
    ) : null}

    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      >
        Try again
      </button>

      <Link
        href="/library"
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Explore the library
      </Link>
    </div>

    <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
      Knowledge, organized and within reach.
    </p>
  </section>
</main>


);
}
