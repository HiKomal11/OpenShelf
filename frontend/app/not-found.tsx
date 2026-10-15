import Link from "next/link";

export default function NotFoundPage() {
return ( <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6"> <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10"> <Link
       href="/"
       className="inline-flex items-center gap-2 text-sm font-bold tracking-tight"
       aria-label="OpenShelf home"
     > <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white">
O </span>
OpenShelf </Link>


    <div className="relative mx-auto mt-10 flex h-36 w-36 items-center justify-center rounded-[2rem] bg-indigo-50 dark:bg-indigo-950/60">
      <span
        aria-hidden="true"
        className="text-6xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400"
      >
        404
      </span>
      <span
        aria-hidden="true"
        className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-amber-100 text-lg dark:border-slate-900 dark:bg-amber-950"
      >
        ?
      </span>
    </div>

    <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
      Page not found
    </p>

    <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
      Looks like this page is missing.
    </h1>

    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
      The link may be outdated, or the page may have moved. Let&apos;s
      help you find your way back to something useful.
    </p>

    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
      <Link
        href="/library"
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      >
        Explore the library
      </Link>

      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Back to home
      </Link>
    </div>

    <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
      Knowledge, organized and within reach.
    </p>
  </section>
</main>


);
}
