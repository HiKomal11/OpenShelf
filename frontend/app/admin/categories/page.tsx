
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/app/providers";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function AdminCategoriesContent() {
  const router = useRouter();
  const { accessToken, logout } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editActive, setEditActive] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/v1/admin/categories`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 403) {
        setError("You do not have permission to manage categories.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load categories.");
      }

      const result: Category[] = await response.json();

      setError("");
      setCategories(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // Defer the fetch to avoid synchronous state updates during effect execution.
    const timer = window.setTimeout(() => {
      void fetchCategories();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchCategories]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required.");
      setSuccess("");
      return;
    }

    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/v1/admin/categories`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            is_active: true,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.detail || "Failed to create category."
        );
      }

      setName("");
      setSlug("");
      setDescription("");
      setSuccess("Category created successfully.");

      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create category."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditSlug(category.slug);
    setEditDescription(category.description || "");
    setEditActive(category.is_active);
    setError("");
    setSuccess("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditDescription("");
    setEditActive(true);
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId === null) return;

    if (!editName.trim() || !editSlug.trim()) {
      setError("Name and slug are required.");
      setSuccess("");
      return;
    }

    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/v1/admin/categories/${editingId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            slug: editSlug.trim(),
            description: editDescription.trim() || null,
            is_active: editActive,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.detail || "Failed to update category."
        );
      }

      setEditingId(null);
      setSuccess("Category updated successfully.");
      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the category "${category.name}"?`
    );

    if (!confirmed) return;

    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/v1/admin/categories/${category.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.detail || "Failed to delete category."
        );
      }

      if (editingId === category.id) {
        cancelEditing();
      }

      setSuccess("Category deleted successfully.");
      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const activeCount = categories.filter(
    (category) => category.is_active
  ).length;

  const inactiveCount = categories.length - activeCount;

  if (loading) {
    return (
      <main className="page-container w-full py-10">
        <div className="surface mx-auto max-w-6xl p-6 sm:p-8">
          <div className="h-7 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-4 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
          <p className="theme-muted mt-6 text-sm">
            Loading categories...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container w-full py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              <span aria-hidden="true">←</span>
              Admin dashboard
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="8" height="8" rx="2" />
                  <rect x="13" y="3" width="8" height="5" rx="2" />
                  <rect x="13" y="10" width="8" height="11" rx="2" />
                  <rect x="3" y="13" width="8" height="8" rx="2" />
                </svg>
              </span>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Category management
                </h1>
                <p className="theme-muted mt-1 text-sm sm:text-base">
                  Organize resources for easier discovery.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="theme-control inline-flex min-h-11 items-center justify-center gap-2 self-start px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800 sm:self-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M10 17l5-5-5-5m5 5H3" />
              <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </svg>
            Log out
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            <span className="font-bold" aria-hidden="true">!</span>
            <p className="break-words">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto shrink-0 font-semibold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            <span aria-hidden="true">✓</span>
            <p>{success}</p>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto shrink-0 font-semibold"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        <section
          aria-label="Category overview"
          className="mb-7 grid gap-4 sm:grid-cols-3"
        >
          <div className="surface p-5">
            <p className="theme-muted text-sm font-medium">Total categories</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {categories.length}
            </p>
            <p className="theme-muted mt-1 text-xs">
              Available in administration
            </p>
          </div>

          <div className="surface p-5">
            <p className="theme-muted text-sm font-medium">Active categories</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
              {activeCount}
            </p>
            <p className="theme-muted mt-1 text-xs">Marked as active</p>
          </div>

          <div className="surface p-5">
            <p className="theme-muted text-sm font-medium">Inactive categories</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {inactiveCount}
            </p>
            <p className="theme-muted mt-1 text-xs">Currently inactive</p>
          </div>
        </section>

        <section className="surface mb-7 p-5 sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>

            <div>
              <h2 className="text-lg font-bold">Create a category</h2>
              <p className="theme-muted mt-1 text-sm">
                Add a new category to organize library documents.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category-name"
                className="mb-1.5 block text-sm font-semibold"
              >
                Category name <span className="text-red-500">*</span>
              </label>
              <input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Mathematics"
                required
                maxLength={150}
                className="theme-control min-h-11 w-full px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="category-slug"
                className="mb-1.5 block text-sm font-semibold"
              >
                URL slug <span className="text-red-500">*</span>
              </label>
              <input
                id="category-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="e.g. mathematics"
                required
                maxLength={150}
                className="theme-control min-h-11 w-full px-3 py-2.5 text-sm"
              />
              <p className="theme-muted mt-1.5 text-xs">
                Use a short, URL-friendly identifier.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="category-description"
                className="mb-1.5 block text-sm font-semibold"
              >
                Description <span className="theme-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="category-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explain what readers will find in this category..."
                rows={3}
                maxLength={1000}
                className="theme-control w-full resize-y px-3 py-2.5 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
              <p className="theme-muted text-xs">
                New categories are created as active.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="theme-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-hidden="true"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">+</span>
                    Create category
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="surface p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">All categories</h2>
              <p className="theme-muted mt-1 text-sm">
                Review, edit, activate, or remove categories.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchCategories()}
              disabled={saving}
              className="theme-control inline-flex min-h-10 items-center justify-center gap-2 self-start px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800 sm:self-center"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M20 7v5h-5M4 17v-5h5" />
                <path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" />
              </svg>
              Refresh
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="8" height="8" rx="2" />
                  <rect x="13" y="3" width="8" height="5" rx="2" />
                  <rect x="13" y="10" width="8" height="11" rx="2" />
                  <rect x="3" y="13" width="8" height="8" rx="2" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold">No categories yet</h3>
              <p className="theme-muted mx-auto mt-2 max-w-sm text-sm leading-6">
                Create your first category using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <article
                  key={category.id}
                  className={`rounded-2xl border p-4 transition sm:p-5 ${
                    editingId === category.id
                      ? "border-indigo-300 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-950/20"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {editingId === category.id ? (
                    <form onSubmit={handleUpdate} className="space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                            Editing category
                          </p>
                          <h3 className="mt-1 font-bold">{category.name}</h3>
                        </div>
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          ID: {category.id}
                        </span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`edit-name-${category.id}`}
                            className="mb-1.5 block text-sm font-semibold"
                          >
                            Category name
                          </label>
                          <input
                            id={`edit-name-${category.id}`}
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            required
                            maxLength={150}
                            className="theme-control min-h-11 w-full px-3 py-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-slug-${category.id}`}
                            className="mb-1.5 block text-sm font-semibold"
                          >
                            URL slug
                          </label>
                          <input
                            id={`edit-slug-${category.id}`}
                            value={editSlug}
                            onChange={(event) => setEditSlug(event.target.value)}
                            required
                            maxLength={150}
                            className="theme-control min-h-11 w-full px-3 py-2.5 text-sm"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`edit-description-${category.id}`}
                            className="mb-1.5 block text-sm font-semibold"
                          >
                            Description
                          </label>
                          <textarea
                            id={`edit-description-${category.id}`}
                            value={editDescription}
                            onChange={(event) => setEditDescription(event.target.value)}
                            rows={3}
                            maxLength={1000}
                            className="theme-control w-full px-3 py-2.5 text-sm"
                          />
                        </div>
                      </div>

                      <label className="flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={(event) => setEditActive(event.target.checked)}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        Category is active
                      </label>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="theme-primary min-h-10 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save changes"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={saving}
                          className="theme-control min-h-10 px-4 py-2 text-sm font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="break-words text-base font-bold">
                            {category.name}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              category.is_active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                                : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                category.is_active ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {category.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <p className="break-long-content mt-2 font-mono text-xs text-indigo-600 dark:text-indigo-300">
                          /{category.slug}
                        </p>

                        {category.description ? (
                          <p className="theme-muted mt-3 break-words text-sm leading-6">
                            {category.description}
                          </p>
                        ) : (
                          <p className="theme-muted mt-3 text-sm italic">
                            No description provided.
                          </p>
                        )}

                        <p className="theme-muted mt-3 text-xs">
                          Category ID: {category.id}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => startEditing(category)}
                          disabled={saving}
                          className="theme-control inline-flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
                          </svg>
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(category)}
                          disabled={saving}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-700">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="theme-muted text-sm font-medium transition hover:text-indigo-600 dark:hover:text-indigo-300"
          >
            ← Return to Admin Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}

export default function AdminCategoriesPage() {
  return (
    <ProtectedRoute>
      <AdminCategoriesContent />
    </ProtectedRoute>
  );
}