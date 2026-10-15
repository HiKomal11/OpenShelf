"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "../providers";
import {
getMyBookmarks,
getMyHistory,
} from "../../lib/api";
import type {
PublicDocument,
UserDocumentHistoryItem,
} from "../../lib/api";

const PAGE_SIZE = 6;

export default function MyLibraryPage() {
return ( <ProtectedRoute> <MyLibraryContent /> </ProtectedRoute>
);
}

function MyLibraryContent() {
const { user, accessToken } = useAuth();

const [bookmarks, setBookmarks] = useState<PublicDocument[]>([]);
const [history, setHistory] = useState<UserDocumentHistoryItem[]>([]);

const [bookmarksPage, setBookmarksPage] = useState(1);
const [historyPage, setHistoryPage] = useState(1);

const [bookmarksTotalPages, setBookmarksTotalPages] = useState(1);
const [historyTotalPages, setHistoryTotalPages] = useState(1);

const [loadingBookmarks, setLoadingBookmarks] = useState(false);
const [loadingHistory, setLoadingHistory] = useState(false);

const [bookmarkError, setBookmarkError] = useState("");
const [historyError, setHistoryError] = useState("");

useEffect(() => {
  if (!user || !accessToken) {
    return;
  }


let cancelled = false;

async function loadBookmarks() {
  setLoadingBookmarks(true);
  setBookmarkError("");

  try {
    const response = await getMyBookmarks(
      accessToken!,
      bookmarksPage,
      PAGE_SIZE
    );

    if (cancelled) return;

    setBookmarks(response.items);
    setBookmarksTotalPages(Math.max(1, response.total_pages));
  } catch (err) {
    if (cancelled) return;

    setBookmarkError(
      err instanceof Error
        ? err.message
        : "Failed to load saved PDFs."
    );
  } finally {
    if (!cancelled) setLoadingBookmarks(false);
  }
}

void loadBookmarks();

return () => {
  cancelled = true;
};


}, [user, accessToken, bookmarksPage]);

useEffect(() => {
  if (!user || !accessToken) {
    return;
  }


let cancelled = false;

async function loadHistory() {
  setLoadingHistory(true);
  setHistoryError("");

  try {
    const response = await getMyHistory(
      accessToken!,
      historyPage,
      PAGE_SIZE
    );

    if (cancelled) return;

    setHistory(response.items);
    setHistoryTotalPages(Math.max(1, response.total_pages));
  } catch (err) {
    if (cancelled) return;

    setHistoryError(
      err instanceof Error
        ? err.message
        : "Failed to load viewing history."
    );
  } finally {
    if (!cancelled) setLoadingHistory(false);
  }
}

void loadHistory();

return () => {
  cancelled = true;
};

}, [user, accessToken, historyPage]);

if (!user) return null;

return ( <main className="min-w-0 flex-1 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"> <div className="page-container py-8 sm:py-10 lg:py-12">
{/* Page introduction */} <section className="relative mb-8 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-slate-100 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 sm:p-8 lg:p-10"> <div
         aria-hidden="true"
         className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-500/10"
       />


      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:border-indigo-800 dark:bg-slate-900/80 dark:text-indigo-300">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <path
              d="M5 4.75A1.75 1.75 0 0 1 6.75 3H20v17H6.75A1.75 1.75 0 0 0 5 21.75z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M5 4.75v17M9 7h7M9 10h7" strokeLinecap="round" />
          </svg>
          Your personal collection
        </div>

        <h1 className="mt-5 break-words text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
          Your library,{" "}
          <span className="text-indigo-600 dark:text-indigo-400">
            your way.
          </span>
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
          Welcome back, {user.full_name || "Reader"}. Pick up where you
          left off, revisit a useful resource, or explore something new.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/library"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Explore library
            <span aria-hidden="true">→</span>
          </Link>

          <Link
            href="/account"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Account settings
          </Link>
        </div>
      </div>
    </section>

    {/* Collection overview */}
    <section
      aria-label="Library overview"
      className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <SummaryCard
        label="Saved on your list"
        description="Resources bookmarked for later"
        count={bookmarks.length}
        loading={loadingBookmarks}
        icon="bookmark"
        accent="indigo"
      />

      <SummaryCard
        label="Recently explored"
        description="Resources in your reading history"
        count={history.length}
        loading={loadingHistory}
        icon="history"
        accent="sky"
      />
    </section>

    {/* Saved documents */}
    <section
      aria-labelledby="saved-heading"
      className="surface overflow-hidden bg-white shadow-sm dark:bg-slate-900"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <BookmarkIcon />
          </div>

          <div>
            <h2
              id="saved-heading"
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
            >
              Saved documents
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Keep your favorite resources close at hand.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {loadingBookmarks ? "Loading…" : `${bookmarks.length} shown`}
        </span>
      </div>

      <div className="p-5 sm:p-7">
        {loadingBookmarks ? (
          <LoadingGrid />
        ) : bookmarkError ? (
          <ErrorState
            message={bookmarkError}
            onRetry={() => setBookmarksPage((page) => page)}
          />
        ) : bookmarks.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title="Your reading list starts here"
            description="Save documents from the library and they will be collected here for easy access."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {bookmarks.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                />
              ))}
            </div>

            <Pagination
              page={bookmarksPage}
              totalPages={bookmarksTotalPages}
              onPrevious={() =>
                setBookmarksPage((page) => Math.max(1, page - 1))
              }
              onNext={() =>
                setBookmarksPage((page) =>
                  Math.min(bookmarksTotalPages, page + 1)
                )
              }
            />
          </>
        )}
      </div>
    </section>

    {/* Reading history */}
    <section
      aria-labelledby="history-heading"
      className="surface mt-8 overflow-hidden bg-white shadow-sm dark:bg-slate-900"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <HistoryIcon />
          </div>

          <div>
            <h2
              id="history-heading"
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
            >
              Reading history
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Return to documents you viewed recently.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          {loadingHistory ? "Loading…" : `${history.length} shown`}
        </span>
      </div>

      <div className="p-5 sm:p-7">
        {loadingHistory ? (
          <LoadingGrid />
        ) : historyError ? (
          <ErrorState
            message={historyError}
            onRetry={() => setHistoryPage((page) => page)}
          />
        ) : history.length === 0 ? (
          <EmptyState
            icon="history"
            title="Nothing in your history yet"
            description="Open a document in the library and it will appear here when viewing history is recorded."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {history.map((document) => (
                <HistoryCard
                  key={document.id}
                  document={document}
                />
              ))}
            </div>

            <Pagination
              page={historyPage}
              totalPages={historyTotalPages}
              onPrevious={() =>
                setHistoryPage((page) => Math.max(1, page - 1))
              }
              onNext={() =>
                setHistoryPage((page) =>
                  Math.min(historyTotalPages, page + 1)
                )
              }
            />
          </>
        )}
      </div>
    </section>

    <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
      OpenShelf · Knowledge, organized and within reach.
    </p>
  </div>
</main>


);
}

function SummaryCard({
label,
description,
count,
loading,
icon,
accent,
}: {
label: string;
description: string;
count: number;
loading: boolean;
icon: "bookmark" | "history";
accent: "indigo" | "sky";
}) {
const accentClasses =
accent === "indigo"
? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300";

return ( <article className="surface flex min-w-0 items-center gap-4 bg-white p-5 shadow-sm dark:bg-slate-900 sm:p-6">
<div
className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accentClasses}`}
>
{icon === "bookmark" ? <BookmarkIcon /> : <HistoryIcon />} </div>


  <div className="min-w-0 flex-1">
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
      {loading ? "—" : count}
    </p>
    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
      {description}
    </p>
  </div>
</article>


);
}

function DocumentCard({
document,
}: {
document: PublicDocument;
}) {
return ( <article className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-950/5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700 sm:p-6"> <div className="flex items-start gap-3"> <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"> <DocumentIcon /> </div>


    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
        Saved PDF
      </p>

      <h3 className="mt-1 break-words text-lg font-bold leading-6 text-slate-900 dark:text-white">
        {document.title}
      </h3>
    </div>
  </div>

  {document.author && (
    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
      By {document.author}
    </p>
  )}

  {document.description && (
    <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
      {document.description}
    </p>
  )}

  <div className="mt-4 flex flex-wrap gap-2">
    {document.page_count != null && (
      <MetadataPill>{document.page_count} pages</MetadataPill>
    )}

    {document.language && (
      <MetadataPill>{document.language}</MetadataPill>
    )}
  </div>

  <div className="mt-auto pt-5">
    <Link
      href={`/library/${document.id}`}
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:w-auto"
    >
      Open document
      <span aria-hidden="true">→</span>
    </Link>
  </div>
</article>


);
}

function HistoryCard({
document,
}: {
document: UserDocumentHistoryItem;
}) {
const viewedDate = new Date(document.last_viewed_at);
const validDate = !Number.isNaN(viewedDate.getTime());

return ( <article className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-sky-200 hover:shadow-md hover:shadow-sky-950/5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-700 sm:p-6"> <div className="flex items-start gap-3"> <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"> <HistoryIcon /> </div>


    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
        Recently viewed
      </p>

      <h3 className="mt-1 break-words text-lg font-bold leading-6 text-slate-900 dark:text-white">
        {document.title}
      </h3>
    </div>
  </div>

  {document.author && (
    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
      By {document.author}
    </p>
  )}

  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
    <span className="font-medium text-slate-700 dark:text-slate-300">
      Last viewed:
    </span>{" "}
    {validDate ? viewedDate.toLocaleString() : "Date unavailable"}
  </p>

  <div className="mt-auto pt-5">
    <Link
      href={`/library/${document.id}`}
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-700 dark:hover:bg-slate-700 sm:w-auto"
    >
      Continue reading
      <span aria-hidden="true">→</span>
    </Link>
  </div>
</article>


);
}

function MetadataPill({ children }: { children: React.ReactNode }) {
return ( <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
{children} </span>
);
}

function Pagination({
page,
totalPages,
onPrevious,
onNext,
}: {
page: number;
totalPages: number;
onPrevious: () => void;
onNext: () => void;
}) {
return ( <nav
   aria-label="Document pagination"
   className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-700"
 >
<button
type="button"
onClick={onPrevious}
disabled={page <= 1}
className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
>
← Previous </button>


  <span
    aria-live="polite"
    className="text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400"
  >
    Page {page} of {totalPages}
  </span>

  <button
    type="button"
    onClick={onNext}
    disabled={page >= totalPages}
    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
  >
    Next →
  </button>
</nav>


);
}

function LoadingGrid() {
return ( <div
   role="status"
   aria-label="Loading documents"
   className="grid grid-cols-1 gap-4 lg:grid-cols-2"
 >
{[1, 2].map((item) => ( <div
       key={item}
       className="animate-pulse rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
     > <div className="flex gap-3"> <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700" /> <div className="flex-1 space-y-2 pt-1"> <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" /> <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" /> </div> </div> <div className="mt-5 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" /> <div className="mt-2 h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" /> <div className="mt-6 h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-700" /> </div>
))} <span className="sr-only">Loading your documents...</span> </div>
);
}

function EmptyState({
icon,
title,
description,
}: {
icon: "bookmark" | "history";
title: string;
description: string;
}) {
return ( <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-950/50 sm:px-8"> <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
{icon === "bookmark" ? ( <BookmarkIcon className="h-7 w-7" />
) : ( <HistoryIcon className="h-7 w-7" />
)} </div>


  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
    {title}
  </h3>

  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
    {description}
  </p>

  <Link
    href="/library"
    className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
  >
    Browse library
    <span aria-hidden="true">→</span>
  </Link>
</div>


);
}

function ErrorState({
message,
onRetry,
}: {
message: string;
onRetry: () => void;
}) {
return ( <div
   role="alert"
   className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30"
 > <p className="font-semibold text-rose-800 dark:text-rose-200">
Unable to load documents </p>


  <p className="mt-2 break-words text-sm leading-6 text-rose-700 dark:text-rose-300">
    {message}
  </p>

  <button
    type="button"
    onClick={onRetry}
    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-200 dark:hover:bg-rose-950"
  >
    Try again
  </button>
</div>


);
}

function BookmarkIcon({
className = "h-5 w-5",
}: {
className?: string;
}) {
return ( <svg
   aria-hidden="true"
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.7"
   strokeLinecap="round"
   strokeLinejoin="round"
   className={className}
 > <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4z" /> </svg>
);
}

function HistoryIcon({
className = "h-5 w-5",
}: {
className?: string;
}) {
return ( <svg
   aria-hidden="true"
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.7"
   strokeLinecap="round"
   strokeLinejoin="round"
   className={className}
 > <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" /> <path d="M3 3v5h5" /> <path d="M12 7v5l3 2" /> </svg>
);
}

function DocumentIcon() {
return ( <svg
   aria-hidden="true"
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.7"
   strokeLinecap="round"
   strokeLinejoin="round"
   className="h-5 w-5"
 > <path d="M6 3.75A1.75 1.75 0 0 1 7.75 2h6.5L19 6.75v13.5A1.75 1.75 0 0 1 17.25 22h-9.5A1.75 1.75 0 0 1 6 20.25z" /> <path d="M14 2v5h5M9 13h6M9 17h6" /> </svg>
);
}
