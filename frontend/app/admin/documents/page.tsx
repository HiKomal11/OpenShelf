
"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/app/providers";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type DocumentItem = {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  language: string | null;
  publication_date: string | null;
  is_public: boolean;
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  categories: Category[];
};

type DocumentForm = {
  title: string;
  description: string;
  author: string;
  language: string;
  publication_date: string;
  is_public: boolean;
  is_active: boolean;
  category_ids: number[];
};

type DocumentFileStatus = {
  document_id: string;
  file: {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    is_original: boolean;
    ocr_status: string | null;
  } | null;
  ocr_file: {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    is_ocr_version: boolean;
    ocr_status: string | null;
  } | null;
  page_count: number | null;
  text_available: boolean;
};

const emptyForm: DocumentForm = {
  title: "",
  description: "",
  author: "",
  language: "English",
  publication_date: "",
  is_public: true,
  is_active: true,
  category_ids: [],
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-950";

const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getOcrStatusLabel(status: string | null): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "not_required":
      return "Not required";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

function getOcrStatusClass(status: string | null): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "processing":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300";
    case "failed":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
    case "not_required":
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

function StatusBadge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const styles = {
    neutral:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    danger:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
    info:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function AdminDocumentsContent() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fileStatuses, setFileStatuses] = useState<
    Record<string, DocumentFileStatus>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDocumentId, setUploadingDocumentId] =
    useState<string | null>(null);
  const [retryingDocumentId, setRetryingDocumentId] =
    useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentForm>(emptyForm);

  const fetchFileStatus = useCallback(
    async (documentId: string) => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${API_URL}/api/v1/admin/documents/${documentId}/file`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) return;

        const data: DocumentFileStatus = await response.json();

        setFileStatuses((current) => ({
          ...current,
          [documentId]: data,
        }));
      } catch {
        // File status failures should not prevent the list from loading.
      }
    },
    [accessToken]
  );

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [documentsResponse, categoriesResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/v1/admin/documents`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }),
          fetch(`${API_URL}/api/v1/admin/categories`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }),
        ]);

      if (!documentsResponse.ok) {
        throw new Error("Failed to load documents.");
      }

      if (!categoriesResponse.ok) {
        throw new Error("Failed to load categories.");
      }

      const documentsData: DocumentItem[] =
        await documentsResponse.json();
      const categoriesData: Category[] =
        await categoriesResponse.json();

      setDocuments(documentsData);
      setCategories(categoriesData);

      const validIds = new Set(
        documentsData.map((document) => document.id)
      );

      setFileStatuses((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) =>
            validIds.has(id)
          )
        )
      );

      await Promise.all(
        documentsData.map((document) =>
          fetchFileStatus(document.id)
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the library."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchFileStatus]);


  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (!cancelled) {
        void fetchData();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchData]);
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!accessToken) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        author: form.author || null,
        language: form.language || null,
        publication_date: form.publication_date || null,
        is_public: form.is_public,
        is_active: form.is_active,
        category_ids: form.category_ids,
      };

      const url = editingId
        ? `${API_URL}/api/v1/admin/documents/${editingId}`
        : `${API_URL}/api/v1/admin/documents`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save document.");
      }

      setSuccess(
        editingId
          ? "Document updated successfully."
          : "Document created successfully."
      );

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save document."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (document: DocumentItem) => {
    setEditingId(document.id);
    setForm({
      title: document.title,
      description: document.description || "",
      author: document.author || "",
      language: document.language || "",
      publication_date: document.publication_date || "",
      is_public: document.is_public,
      is_active: document.is_active,
      category_ids: document.categories.map(
        (category) => category.id
      ),
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (documentId: string) => {
    if (!accessToken) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmed) return;

    setDeletingDocumentId(documentId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/admin/documents/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to delete document.");
      }

      setSuccess("Document deleted successfully.");

      setFileStatuses((current) => {
        const updated = { ...current };
        delete updated[documentId];
        return updated;
      });

      if (editingId === documentId) {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
      }

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete document."
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleCategoryChange = (
    categoryId: number,
    checked: boolean
  ) => {
    setForm((current) => ({
      ...current,
      category_ids: checked
        ? current.category_ids.includes(categoryId)
          ? current.category_ids
          : [...current.category_ids, categoryId]
        : current.category_ids.filter((id) => id !== categoryId),
    }));
  };

  const handleFileUpload = async (
    documentId: string,
    file: File
  ) => {
    if (!accessToken) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Only PDF files are allowed.");
      return;
    }

    setUploadingDocumentId(documentId);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/v1/admin/documents/${documentId}/file`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload PDF.");
      }

      setSuccess(
        `PDF uploaded successfully. OCR status: ${getOcrStatusLabel(
          data.ocr_status
        )}.`
      );

      await fetchFileStatus(documentId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload PDF."
      );
    } finally {
      setUploadingDocumentId(null);
    }
  };

  const handleRetryOcr = async (documentId: string) => {
    if (!accessToken) return;

    setRetryingDocumentId(documentId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/admin/documents/${documentId}/ocr/retry`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "OCR retry failed.");
      }

      setSuccess(
        `OCR retry completed successfully. Extracted ${
          data.text_length
        } characters.`
      );

      await fetchFileStatus(documentId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "OCR retry failed."
      );
    } finally {
      setRetryingDocumentId(null);
    }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const publicCount = documents.filter(
    (document) => document.is_public
  ).length;
  const activeCount = documents.filter(
    (document) => document.is_active
  ).length;
  const uploadedCount = documents.filter(
    (document) => Boolean(fileStatuses[document.id]?.file)
  ).length;
  const ocrCompletedCount = documents.filter(
    (document) =>
      fileStatuses[document.id]?.file?.ocr_status === "completed"
  ).length;

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-12 dark:bg-slate-900 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-9 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading document library…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-w-0 flex-1 bg-slate-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path d="M7 3.75h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z" />
                  <path d="M14 4v4h4M9 13h6M9 17h6" />
                </svg>
              </span>
              OpenShelf Administration
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Document management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Organize educational resources, manage PDF files, and monitor
              text extraction from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className={secondaryButtonClass}
            >
              <span aria-hidden="true" className="mr-2">←</span>
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setEditingId(null);
                setShowForm(true);
                setError("");
                setSuccess("");
              }}
              className={primaryButtonClass}
            >
              <span aria-hidden="true" className="mr-2 text-lg">+</span>
              Add document
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            <span className="mt-0.5 font-bold" aria-hidden="true">!</span>
            <div className="min-w-0 flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg px-2 py-1 font-semibold hover:bg-red-100 dark:hover:bg-red-900/50"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            <span className="font-bold" aria-hidden="true">✓</span>
            <div className="min-w-0 flex-1">{success}</div>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="rounded-lg px-2 py-1 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        <section
          aria-label="Document library overview"
          className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              label: "Total documents",
              value: documents.length,
              detail: "In your library",
              symbol: "▤",
              color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
            },
            {
              label: "Public documents",
              value: publicCount,
              detail: "Visible to visitors when active",
              symbol: "◎",
              color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
            },
            {
              label: "PDFs uploaded",
              value: uploadedCount,
              detail: `${Math.max(0, documents.length - uploadedCount)} awaiting files`,
              symbol: "↥",
              color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
            },
            {
              label: "OCR completed",
              value: ocrCompletedCount,
              detail: `${activeCount} active documents`,
              symbol: "✓",
              color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-semibold ${stat.color}`}
                  aria-hidden="true"
                >
                  {stat.symbol}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {stat.detail}
              </p>
            </div>
          ))}
        </section>

        {showForm && (
          <section
            aria-labelledby="document-form-title"
            className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-700 dark:bg-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Library content
                </p>
                <h2
                  id="document-form-title"
                  className="mt-1 text-xl font-bold text-slate-900 dark:text-white"
                >
                  {editingId ? "Edit document" : "Create a document"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter the resource details and choose its visibility.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelForm}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
              <div>
                <label
                  htmlFor="document-title"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Document title <span className="text-red-500">*</span>
                </label>
                <input
                  id="document-title"
                  type="text"
                  required
                  maxLength={500}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Introduction to Data Structures"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="document-description"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Description
                </label>
                <textarea
                  id="document-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Briefly describe what readers will learn from this resource."
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="document-author"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Author
                  </label>
                  <input
                    id="document-author"
                    type="text"
                    value={form.author}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        author: event.target.value,
                      }))
                    }
                    placeholder="Author or publisher"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="document-language"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Language
                  </label>
                  <input
                    id="document-language"
                    type="text"
                    value={form.language}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        language: event.target.value,
                      }))
                    }
                    placeholder="e.g. English"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="document-publication-date"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Publication date
                  </label>
                  <input
                    id="document-publication-date"
                    type="date"
                    value={form.publication_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        publication_date: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Categories
                </legend>

                {categories.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    No categories available. Create categories from the
                    Categories Management page first.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
                      >
                        <input
                          type="checkbox"
                          checked={form.category_ids.includes(category.id)}
                          onChange={(event) =>
                            handleCategoryChange(
                              category.id,
                              event.target.checked
                            )
                          }
                          className="h-4 w-4 shrink-0 accent-indigo-600"
                        />
                        <span className="break-words text-sm font-medium text-slate-700 dark:text-slate-200">
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Visibility and status
                </legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_public}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          is_public: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 accent-indigo-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Public document
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Allow visitors to discover this resource when it is
                        active.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 accent-indigo-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Active document
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Keep this resource enabled in the library.
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelForm}
                  className={secondaryButtonClass}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={primaryButtonClass}
                >
                  {saving
                    ? "Saving document…"
                    : editingId
                      ? "Save changes"
                      : "Create document"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Your document library
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage metadata, uploaded files, and OCR processing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge>{documents.length} total</StatusBadge>
              <button
                type="button"
                onClick={() => void fetchData()}
                className={secondaryButtonClass}
              >
                <span aria-hidden="true" className="mr-2">↻</span>
                Refresh
              </button>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="px-5 py-16 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-8 w-8"
                >
                  <path d="M7 3.75h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z" />
                  <path d="M14 4v4h4M9 13h6M9 17h6" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                Your library is ready for its first document
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Add a document to get started, then upload its PDF to make it
                available for reading and text extraction.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setEditingId(null);
                  setShowForm(true);
                  setError("");
                  setSuccess("");
                }}
                className={`${primaryButtonClass} mt-5`}
              >
                Add your first document
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {documents.map((document) => {
                const fileStatus = fileStatuses[document.id];
                const file = fileStatus?.file;
                const ocrStatus = file?.ocr_status;
                const isUploading =
                  uploadingDocumentId === document.id;
                const isRetrying =
                  retryingDocumentId === document.id;
                const isDeleting =
                  deletingDocumentId === document.id;

                return (
                  <article
                    key={document.id}
                    className="min-w-0 p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-700/20 sm:p-7"
                  >
                    <div className="flex min-w-0 flex-col gap-5">
                      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <StatusBadge
                              variant={document.is_public ? "info" : "neutral"}
                            >
                              {document.is_public ? "Public" : "Private"}
                            </StatusBadge>
                            <StatusBadge
                              variant={document.is_active ? "success" : "warning"}
                            >
                              {document.is_active ? "Active" : "Inactive"}
                            </StatusBadge>
                            {file && (
                              <StatusBadge
                                variant={
                                  ocrStatus === "completed"
                                    ? "success"
                                    : ocrStatus === "failed"
                                      ? "danger"
                                      : ocrStatus === "pending" ||
                                          ocrStatus === "processing"
                                        ? "warning"
                                        : "neutral"
                                }
                              >
                                OCR: {getOcrStatusLabel(ocrStatus ?? null)}
                              </StatusBadge>
                            )}
                          </div>

                          <h3 className="break-words text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                            {document.title}
                          </h3>

                          {document.description && (
                            <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {document.description}
                            </p>
                          )}

                          <div className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                            <p className="break-words text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                Author:{" "}
                              </span>
                              {document.author || "Not specified"}
                            </p>
                            <p className="break-words text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                Language:{" "}
                              </span>
                              {document.language || "Not specified"}
                            </p>
                            <p className="break-words text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                Publication:{" "}
                              </span>
                              {document.publication_date || "Not specified"}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {document.categories.length === 0 ? (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                No categories assigned
                              </span>
                            ) : (
                              document.categories.map((category) => (
                                <span
                                  key={category.id}
                                  className="max-w-full break-words rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                >
                                  {category.name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEdit(document)}
                            className={secondaryButtonClass}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(document.id)}
                            disabled={isDeleting}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-red-950/40"
                          >
                            {isDeleting ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>

                      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
                        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                className="h-5 w-5"
                              >
                                <path d="M7 3.75h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z" />
                                <path d="M14 4v4h4M9 13h6M9 17h4" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                PDF file and OCR
                              </h4>
                              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                Upload the original PDF and monitor text
                                extraction.
                              </p>
                            </div>
                          </div>

                          {!file && (
                            <label
                              className={`${primaryButtonClass} ${
                                isUploading
                                  ? "pointer-events-none opacity-60"
                                  : "cursor-pointer"
                              }`}
                            >
                              {isUploading ? "Uploading PDF…" : "Upload PDF"}
                              <input
                                type="file"
                                accept="application/pdf,.pdf"
                                className="sr-only"
                                disabled={isUploading}
                                onChange={(event) => {
                                  const selectedFile =
                                    event.target.files?.[0];

                                  if (selectedFile) {
                                    void handleFileUpload(
                                      document.id,
                                      selectedFile
                                    );
                                  }

                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>

                        {!file ? (
                          <div className="m-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-7 text-center dark:border-slate-600 dark:bg-slate-800 sm:m-5">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              No PDF uploaded yet
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              Upload a PDF to begin reading and OCR processing.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 p-4 sm:p-5">
                            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Original PDF
                                </p>
                                <p
                                  className="mt-2 break-all text-sm font-semibold text-slate-800 dark:text-slate-100"
                                  title={file.file_name}
                                >
                                  {file.file_name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  Original file
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  File size
                                </p>
                                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                  {formatFileSize(file.file_size)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  PDF storage
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Page count
                                </p>
                                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                  {fileStatus?.page_count ?? "—"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  Pages detected
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  OCR status
                                </p>
                                <div className="mt-2">
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getOcrStatusClass(
                                      ocrStatus ?? null
                                    )}`}
                                  >
                                    {getOcrStatusLabel(ocrStatus ?? null)}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  Text extraction
                                </p>
                              </div>
                            </div>

                            <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                      fileStatus?.text_available
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                        : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                                    }`}
                                    aria-hidden="true"
                                  >
                                    {fileStatus?.text_available ? "✓" : "–"}
                                  </span>
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    Extracted text
                                  </p>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                  {fileStatus?.text_available
                                    ? "Text is available for search and other library features."
                                    : "Extracted text is not currently available."}
                                </p>

                                {fileStatus?.ocr_file && (
                                  <p className="mt-3 break-all text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      OCR PDF:{" "}
                                    </span>
                                    {fileStatus.ocr_file.file_name}
                                    <span className="ml-2">
                                      ({formatFileSize(
                                        fileStatus.ocr_file.file_size
                                      )})
                                    </span>
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 lg:shrink-0">
                                {(ocrStatus === "failed" ||
                                  ocrStatus === "not_required") && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleRetryOcr(document.id)
                                    }
                                    disabled={isRetrying}
                                    className={secondaryButtonClass}
                                  >
                                    {isRetrying
                                      ? "Retrying OCR…"
                                      : "Retry OCR"}
                                  </button>
                                )}

                                {ocrStatus === "completed" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleRetryOcr(document.id)
                                    }
                                    disabled={isRetrying}
                                    className={secondaryButtonClass}
                                  >
                                    {isRetrying
                                      ? "Running OCR…"
                                      : "Run OCR again"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          OpenShelf Admin · Document metadata, PDF storage, and OCR controls
        </p>
      </div>
    </main>
  );
}

export default function AdminDocumentsPage() {
  return (
    <ProtectedRoute>
      <AdminDocumentsContent />
    </ProtectedRoute>
  );
}
