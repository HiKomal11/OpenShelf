
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getPublicCategories,
  getPublicDocuments,
  getPublicDocumentDownloadUrl,
} from "@/lib/api";

import type {
  DocumentCategory,
  PublicDocument,
} from "@/lib/api";

const PAGE_SIZE = 12;

export default function LibraryPage() {
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await getPublicCategories();

        if (!cancelled) {
          setCategories(response);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setLoading(true);
      setError("");

      try {
        const response = await getPublicDocuments({
          search: search || undefined,
          category_id: selectedCategory
            ? Number(selectedCategory)
            : undefined,
          page,
          page_size: PAGE_SIZE,
          sort,
        });

        if (cancelled) return;

        setDocuments(response.items);
        setTotal(response.total);
        setTotalPages(response.total_pages);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load documents."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [search, selectedCategory, page, sort]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setSelectedCategory("");
    setSort("newest");
    setPage(1);
  };

  const hasFilters = Boolean(search || selectedCategory);

  return (
    <main className="flex-1 bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <section className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            OpenShelf collection
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Explore the library
              </h1>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                Discover educational resources, browse document
                categories, and find your next useful read.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/60">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Public collection
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {loading ? "—" : total.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {total === 1 ? "document available" : "documents available"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <form
          onSubmit={handleSearch}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_200px_180px]">
            <div className="min-w-0">
              <label
                htmlFor="library-search"
                className="mb-2 block text-sm font-semibold"
              >
                Search documents
              </label>
              <div className="relative">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                >
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4.5 4.5" />
                </svg>
                <input
                  id="library-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Title, author, description, or PDF text…"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-base outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900 dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/20"
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Search includes extracted text from scanned PDFs when
                OCR text is available.
              </p>
            </div>

            <div>
              <label
                htmlFor="library-category"
                className="mb-2 block text-sm font-semibold"
              >
                Category
              </label>
              <select
                id="library-category"
                value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-indigo-500/20"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="library-sort"
                className="mb-2 block text-sm font-semibold"
              >
                Sort by
              </label>
              <select
                id="library-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-indigo-500/20"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title_asc">Title A-Z</option>
                <option value="title_desc">Title Z-A</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center dark:border-slate-700">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Search library
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 font-medium transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Clear filters
              </button>
            )}

            <p className="text-sm text-slate-500 sm:ml-auto dark:text-slate-400">
              {search
                ? `Results for "${search}"`
                : selectedCategory
                  ? "Filtered by category"
                  : "Browse all public documents"}
            </p>
          </div>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              {search || selectedCategory
                ? "Matching documents"
                : "Browse documents"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {loading
                ? "Updating results…"
                : `${total.toLocaleString()} result${total === 1 ? "" : "s"} found`}
            </p>
          </div>

          {!loading && !error && documents.length > 0 && (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
              Page {page} of {Math.max(totalPages, 1)}
            </span>
          )}
        </div>

        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-4 h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-7 h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-8 h-10 rounded-lg bg-slate-100 dark:bg-slate-700" />
              </div>
            ))}
            <span className="sr-only">Loading library documents…</span>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8 dark:border-red-900 dark:bg-red-950/30"
          >
            <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
              Unable to load the library
            </h2>
            <p className="mt-2 break-words text-sm leading-6 text-red-700 dark:text-red-200">
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-600 dark:bg-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-7 w-7"
              >
                <path d="M6 3.75h8l4 4v12.5H6z" />
                <path d="M14 3.75v4h4M9 12h6M9 15.5h6" />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold">No documents found</h2>
            <p className="mx-auto mt-2 max-w-md leading-7 text-slate-600 dark:text-slate-300">
              {search
                ? "No public documents matched your search. Try a different keyword or spelling."
                : selectedCategory
                  ? "There are no public documents in this category right now."
                  : "There are currently no public documents available. Please check again later."}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((document) => (
                <article
                  key={document.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-400/50"
                >
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-400 to-sky-400" />

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-6 w-6"
                        >
                          <path d="M5 3.75h10l4 4v12.5H5z" />
                          <path d="M15 3.75v4h4M8 12h8M8 15.5h8" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-lg font-bold leading-6 tracking-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                          {document.title}
                        </h3>
                        {document.author && (
                          <p className="mt-2 break-words text-sm text-slate-500 dark:text-slate-400">
                            By {document.author}
                          </p>
                        )}
                      </div>
                    </div>

                    {document.description && (
                      <p className="mt-4 line-clamp-3 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {document.description}
                      </p>
                    )}

                    {document.categories.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {document.categories.map((category) => (
                          <span
                            key={category.id}
                            className="max-w-full break-words rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                      {document.language && (
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden="true">◎</span>
                          {document.language}
                        </span>
                      )}
                      {document.page_count !== null && (
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden="true">▤</span>
                          {document.page_count} page
                          {document.page_count === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto grid grid-cols-1 gap-2 pt-6 sm:grid-cols-2">
                      <Link
                        href={`/library/${document.id}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
                      >
                        View details
                      </Link>

                      <a
                        href={getPublicDocumentDownloadUrl(document.id)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M12 3.5v11m0 0 4-4m-4 4-4-4M5 16.5v3h14v-3" />
                        </svg>
                        Download PDF
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Library pagination"
                className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row dark:border-slate-700 dark:bg-slate-800"
              >
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Page <span className="font-semibold">{page}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                </p>

                <div className="flex w-full gap-3 sm:w-auto">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    Next →
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}