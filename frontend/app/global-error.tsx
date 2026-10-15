"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
error: Error & { digest?: string };
reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
useEffect(() => {
console.error("OpenShelf root layout error:", error);
}, [error]);

return ( <html lang="en"> <body className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100"> <main
       role="alert"
       className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10"
     > <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white">
O </div>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
        OpenShelf
      </p>

      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        We hit an unexpected problem.
      </h1>

      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
        The application could not load correctly. Try again to recover
        your reading space.
      </p>

      {error.digest ? (
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Reference: {error.digest}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => reset()}
        className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      >
        Try again
      </button>

      <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        Knowledge, organized and within reach.
      </p>
    </main>
  </body>
</html>


);
}
