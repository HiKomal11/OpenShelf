
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl dark:bg-indigo-500/10" />
          <div className="absolute -left-20 top-40 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl dark:bg-sky-500/10" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm dark:border-indigo-400/30 dark:bg-slate-800/80 dark:text-indigo-300">
              Knowledge, organized and within reach.
            </span>

            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your next great discovery starts{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                on OpenShelf.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
              Explore educational PDFs, read online, and keep the documents
              you value close at hand. Find useful resources in one simple,
              organized library.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/library"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Explore the library <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Create a free account
              </Link>
            </div>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Browse the public library without signing in.
            </p>
          </div>

          {/* Reading space preview */}
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/10">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-700">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-8 w-8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 3.75h10l4 4v12.5H5z" />
                    <path d="M15 3.75v4h4M8 12h8M8 15.5h8" />
                  </svg>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Your reading space
                  </p>
                  <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                    A library that works for you
                  </h2>
                </div>
              </div>

              <div className="space-y-5 py-6">
                <PreviewItem
                  number="01"
                  title="Discover resources"
                  description="Browse educational PDFs and find useful learning materials."
                />
                <PreviewItem
                  number="02"
                  title="Read at your pace"
                  description="Open document details and read supported PDFs online."
                />
                <PreviewItem
                  number="03"
                  title="Build your collection"
                  description="Sign in to bookmark documents and revisit your reading history."
                />
              </div>

              <Link
                href="/library"
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-700/60 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Start exploring <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
              Read. Learn. Return. Your knowledge journey starts here.
            </p>
          </div>
        </div>
      </section>

      {/* Three core features */}
      <section className="border-y border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Made for curious minds
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to explore and read
            </h2>

            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              Discover resources, read online, and keep the documents that
              matter to you close at hand.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              number="01"
              title="Discover"
              description="Explore the public library and find resources with search and category filters."
            />
            <Feature
              number="02"
              title="Read"
              description="Review document information and read supported PDFs in the online reader."
            />
            <Feature
              number="03"
              title="Keep close"
              description="Create an account to use personal features such as bookmarks and reading history."
            />
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/library"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Explore OpenShelf <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple closing section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-indigo-600 px-6 py-10 text-center text-white sm:px-10 sm:py-12">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Your next chapter starts here.
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-indigo-100">
            Find your next useful resource and make learning part of your day.
          </p>
          <Link
            href="/library"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Browse the library
          </Link>
        </div>
      </section>
    </main>
  );
}

function PreviewItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
        {number}
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </div>
  );
}

function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="h-full rounded-2xl border border-slate-200 bg-slate-50/70 p-6 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-400/50">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
        {number}
      </span>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </article>
  );
}