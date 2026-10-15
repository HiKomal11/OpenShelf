"use client";

export default function Loading() {
return ( <main
   role="status"
   aria-live="polite"
   aria-label="Loading OpenShelf"
   className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
 > <div className="w-full max-w-sm text-center"> <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-black text-white shadow-lg shadow-indigo-600/20">
O </div>


    <h1 className="mt-5 text-xl font-bold tracking-tight">
      OpenShelf
    </h1>

    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
      Knowledge, organized and within reach.
    </p>

    <div className="mx-auto mt-7 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className="h-full w-2/5 animate-pulse rounded-full bg-indigo-600" />
    </div>

    <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
      Preparing your reading space…
    </p>
  </div>
</main>


);
}
