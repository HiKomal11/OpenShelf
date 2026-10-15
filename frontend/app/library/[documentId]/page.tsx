"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
bookmarkDocument,
getDocumentInteractions,
getPublicDocument,
getPublicDocumentDownloadUrl,
getPublicDocumentViewUrl,
likeDocument,
recordDocumentView,
removeBookmark,
unlikeDocument,
} from "../../../lib/api";
import type { PublicDocument } from "../../../lib/api";
import PDFReader from "../../../components/PDFReader";
import { useAuth } from "../../providers";

type DocumentPageProps = {
params: Promise<{
documentId: string;
}>;
};

export default function DocumentPage({ params }: DocumentPageProps) {
const { user, accessToken, loading: authLoading } = useAuth();

const [document, setDocument] = useState<PublicDocument | null>(null);
const [documentId, setDocumentId] = useState("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [liked, setLiked] = useState(false);
const [bookmarked, setBookmarked] = useState(false);
const [likeCount, setLikeCount] = useState(0);
const [interactionLoading, setInteractionLoading] = useState(false);
const [interactionError, setInteractionError] = useState("");

useEffect(() => {
let cancelled = false;

async function loadDocument() {
  try {
    const { documentId: routeDocumentId } = await params;

    if (cancelled) return;

    setDocumentId(routeDocumentId);

    const response = await getPublicDocument(routeDocumentId);

    if (cancelled) return;

    setDocument(response);
  } catch (err) {
    if (cancelled) return;

    setError(
      err instanceof Error ? err.message : "Failed to load document."
    );
  } finally {
    if (!cancelled) setLoading(false);
  }
}

loadDocument();

return () => {
  cancelled = true;
};


}, [params]);

useEffect(() => {
if (authLoading || !user || !accessToken || !documentId) return;

const token = accessToken;
let cancelled = false;

async function loadInteractions() {
  try {
    const interactionStatus = await getDocumentInteractions(
      documentId,
      token
    );

    if (cancelled) return;

    setLiked(interactionStatus.liked);
    setBookmarked(interactionStatus.bookmarked);
    setLikeCount(interactionStatus.like_count);

    await recordDocumentView(documentId, token);
  } catch (err) {
    if (cancelled) return;
    console.error("Failed to load document interactions:", err);
  }
}

loadInteractions();

return () => {
  cancelled = true;
};


}, [authLoading, user, accessToken, documentId]);

async function handleLike() {
if (!accessToken || !documentId || interactionLoading) return;

setInteractionLoading(true);
setInteractionError("");

try {
  if (liked) {
    const response = await unlikeDocument(documentId, accessToken);
    setLiked(false);
    setLikeCount(
      typeof response.like_count === "number"
        ? response.like_count
        : (count) => Math.max(0, count - 1)
    );
  } else {
    const response = await likeDocument(documentId, accessToken);
    setLiked(true);
    setLikeCount(
      typeof response.like_count === "number"
        ? response.like_count
        : (count) => count + 1
    );
  }
} catch (err) {
  setInteractionError(
    err instanceof Error ? err.message : "Failed to update like."
  );
} finally {
  setInteractionLoading(false);
}

}

async function handleBookmark() {
if (!accessToken || !documentId || interactionLoading) return;


setInteractionLoading(true);
setInteractionError("");

try {
  if (bookmarked) {
    await removeBookmark(documentId, accessToken);
    setBookmarked(false);
  } else {
    await bookmarkDocument(documentId, accessToken);
    setBookmarked(true);
  }
} catch (err) {
  setInteractionError(
    err instanceof Error ? err.message : "Failed to update bookmark."
  );
} finally {
  setInteractionLoading(false);
}


}

const controlClass =
"inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryClass =
"border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

return ( <main className="flex-1 bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100"> <section className="page-container py-8 sm:py-12"> <div className="mb-6 flex flex-wrap items-center justify-between gap-3"> <Link
         href="/library"
         className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
       > <span aria-hidden="true">←</span>
Back to library </Link>

      {user ? (
        <Link
          href="/my-library"
          className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          My Library →
        </Link>
      ) : (
        <Link
          href={`/login?returnTo=${encodeURIComponent(
            `/library/${documentId}`
          )}`}
          className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          Log in to save documents
        </Link>
      )}
    </div>

    {loading && (
      <div
        role="status"
        aria-live="polite"
        className="surface animate-pulse p-6 sm:p-10 dark:bg-slate-800"
      >
        <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-5 h-8 max-w-xl rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-4 max-w-sm rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-700" />
          <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-700" />
        </div>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Loading document details…
        </p>
      </div>
    )}

    {!loading && error && (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/40 sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-bold text-red-900 dark:text-red-200">
          Unable to load document
        </h1>
        <p className="mt-3 break-words text-sm leading-6 text-red-800 dark:text-red-300">
          {error}
        </p>
        <Link
          href="/library"
          className={`${controlClass} mt-6 bg-red-700 text-white hover:bg-red-800`}
        >
          Return to library
        </Link>
      </div>
    )}

    {!loading && !error && document && (
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 dark:border-slate-700 dark:from-indigo-950/50 dark:via-slate-800 dark:to-slate-800 sm:p-10 lg:p-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300">
              <span aria-hidden="true">▤</span>
              PDF document
            </span>

            {document.file?.ocr_status && (
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium capitalize text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                OCR: {document.file.ocr_status}
              </span>
            )}
          </div>

          <h1 className="mt-6 break-words text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl lg:leading-tight">
            {document.title}
          </h1>

          {document.author && (
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              By <span className="font-semibold">{document.author}</span>
            </p>
          )}

          {document.description && (
            <div className="mt-6 max-w-3xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                About this document
              </h2>
              <p className="mt-3 whitespace-pre-line break-words text-base leading-7 text-slate-600 dark:text-slate-300">
                {document.description}
              </p>
            </div>
          )}

          {document.categories.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Categories
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {document.categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {document.file && (
              <a
                href={getPublicDocumentDownloadUrl(document.id)}
                className={`${controlClass} bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400`}
              >
                <span className="mr-2" aria-hidden="true">↓</span>
                Download PDF
              </a>
            )}

            <Link
              href="/library"
              className={`${controlClass} ${secondaryClass}`}
            >
              Browse more documents
            </Link>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
          {document.language && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Language
              </p>
              <p className="mt-2 break-words font-semibold text-slate-900 dark:text-slate-100">
                {document.language}
              </p>
            </div>
          )}

          {document.page_count !== null && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pages
              </p>
              <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">
                {document.page_count}
              </p>
            </div>
          )}

          {document.publication_date && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Publication date
              </p>
              <p className="mt-2 break-words font-semibold text-slate-900 dark:text-slate-100">
                {document.publication_date}
              </p>
            </div>
          )}

          {document.file && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                OCR status
              </p>
              <p className="mt-2 break-words font-semibold capitalize text-slate-900 dark:text-slate-100">
                {document.file.ocr_status ?? "Not available"}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <section
            aria-labelledby="your-library-heading"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/60 sm:p-6"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  id="your-library-heading"
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  Keep this document close
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {likeCount} {likeCount === 1 ? "like" : "likes"}
                </p>
              </div>

              {user && accessToken ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={interactionLoading}
                    aria-pressed={liked}
                    className={`${controlClass} ${
                      liked
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : secondaryClass
                    }`}
                  >
                    <span className="mr-2 text-lg" aria-hidden="true">
                      {liked ? "♥" : "♡"}
                    </span>
                    {liked ? "Liked" : "Like"}
                  </button>

                  <button
                    type="button"
                    onClick={handleBookmark}
                    disabled={interactionLoading}
                    aria-pressed={bookmarked}
                    className={`${controlClass} ${
                      bookmarked
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                        : secondaryClass
                    }`}
                  >
                    <span className="mr-2 text-lg" aria-hidden="true">
                      {bookmarked ? "★" : "☆"}
                    </span>
                    {bookmarked ? "Saved" : "Save to My Library"}
                  </button>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  <Link
                    href={`/login?returnTo=${encodeURIComponent(
                      `/library/${document.id}`
                    )}`}
                    className="font-semibold text-indigo-700 underline-offset-4 hover:underline dark:text-indigo-300"
                  >
                    Log in
                  </Link>{" "}
                  to like or save this document.
                </p>
              )}
            </div>

            {interactionLoading && (
              <p
                role="status"
                className="mt-4 text-sm text-slate-500 dark:text-slate-400"
              >
                Updating your library…
              </p>
            )}

            {interactionError && (
              <p
                role="alert"
                className="mt-4 break-words text-sm font-medium text-red-700 dark:text-red-300"
              >
                {interactionError}
              </p>
            )}
          </section>

          {document.file && (
            <section className="mt-10" aria-label="PDF reader">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                  Read online
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Document reader
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Read the PDF here, or download it to read later.
                </p>
              </div>

              <PDFReader
                fileUrl={getPublicDocumentViewUrl(document.id)}
              />
            </section>
          )}

          {!document.file && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                PDF preview unavailable
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                The document details are available, but no PDF file is attached yet.
              </p>
            </div>
          )}
        </div>
      </article>
    )}
  </section>
</main>


);
}
