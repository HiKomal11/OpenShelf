
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/app/providers";
import {
  getAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRoles,
  deleteAdminUser,
  type AdminUser,
} from "@/lib/api";

type AuthInfo = {
  token?: string | null;
  accessToken?: string | null;
  user?: {
    id?: string;
    sub?: string;
    user_id?: string;
  } | null;
};

const TOKEN_KEY = "pdf_library_access_token";

function getTokenUserId(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));

    return decoded.sub ?? decoded.user_id ?? decoded.id ?? null;
  } catch {
    return null;
  }
}

function ManageUsersContent() {
  const auth = useAuth() as unknown as AuthInfo;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [token, setToken] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pendingRoles, setPendingRoles] = useState<Record<string, string[]>>(
    {}
  );

  const loadUsers = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminUsers(accessToken);
      setUsers(result);

      setPendingRoles(
        Object.fromEntries(
          result.map((user) => [user.id, [...user.roles]])
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const storedToken =
        auth.token ||
        auth.accessToken ||
        (typeof window !== "undefined"
          ? window.localStorage.getItem(TOKEN_KEY)
          : null);

      const id =
        auth.user?.id ||
        auth.user?.user_id ||
        auth.user?.sub ||
        (storedToken ? getTokenUserId(storedToken) : null);

      // Defer initialization state updates until after the effect starts.
      await Promise.resolve();

      if (cancelled) return;

      if (id) {
        setCurrentUserId(id);
      }

      if (!storedToken) {
        setError("Your session token was not found. Please sign in again.");
        setLoading(false);
        return;
      }

      setToken(storedToken);
      await loadUsers(storedToken);
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [
    auth.token,
    auth.accessToken,
    auth.user?.id,
    auth.user?.user_id,
    auth.user?.sub,
    loadUsers,
  ]);
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.email.toLowerCase().includes(query) ||
        (user.full_name ?? "").toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      const matchesRole =
        roleFilter === "all" ||
        user.roles.some(
          (role) => role.toUpperCase() === roleFilter.toUpperCase()
        );

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  async function handleStatusChange(user: AdminUser) {
    if (!token) return;

    if (user.id === currentUserId) {
      setError("You cannot change your own account status here.");
      return;
    }

    const action = user.is_active ? "deactivate" : "activate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) {
      return;
    }

    setSavingId(user.id);
    setError("");
    setSuccess("");

    try {
      const updated = await updateAdminUserStatus(
        user.id,
        !user.is_active,
        token
      );

      setUsers((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item))
      );

      setSuccess(
        `${updated.email} has been ${
          updated.is_active ? "activated" : "deactivated"
        }.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update user status."
      );
    } finally {
      setSavingId(null);
    }
  }

  function toggleRole(userId: string, role: string) {
    setPendingRoles((previous) => {
      const current = previous[userId] ?? [];
      const hasRole = current.includes(role);

      return {
        ...previous,
        [userId]: hasRole
          ? current.filter((item) => item !== role)
          : [...current, role],
      };
    });
  }

  async function handleSaveRoles(user: AdminUser) {
    if (!token) return;

    if (user.id === currentUserId) {
      setError("You cannot change your own roles here.");
      return;
    }

    const roles = pendingRoles[user.id] ?? [];

    if (roles.length === 0) {
      setError("Every user must have at least one role.");
      return;
    }

    if (
      JSON.stringify([...roles].sort()) ===
      JSON.stringify([...user.roles].sort())
    ) {
      setError("");
      setSuccess("No role changes to save.");
      return;
    }

    if (
      !window.confirm(
        `Save the roles ${roles.join(", ")} for ${user.email}?`
      )
    ) {
      return;
    }

    setSavingId(user.id);
    setError("");
    setSuccess("");

    try {
      const updated = await updateAdminUserRoles(user.id, roles, token);

      setUsers((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item))
      );

      setPendingRoles((previous) => ({
        ...previous,
        [updated.id]: [...updated.roles],
      }));

      setSuccess(`Roles updated for ${updated.email}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update user roles."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    if (!token) {
      setError("Your session token was not found. Please sign in again.");
      return;
    }

    if (user.id === currentUserId) {
      setError("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      `PERMANENTLY DELETE ACCOUNT?\n\n` +
        `Name: ${user.full_name || "Unnamed user"}\n` +
        `Email: ${user.email}\n\n` +
        `This action cannot be undone. The account will be removed, ` +
        `but uploaded PDFs should be preserved by the backend.\n\n` +
        `The email may be used to register a new account afterward.\n\n` +
        `Are you sure you want to continue?`
    );

    if (!confirmed) return;

    setSavingId(user.id);
    setError("");
    setSuccess("");

    try {
      const result = await deleteAdminUser(user.id, token);

      setUsers((previous) =>
        previous.filter((item) => item.id !== user.id)
      );

      setPendingRoles((previous) => {
        const next = { ...previous };
        delete next[user.id];
        return next;
      });

      setSuccess(
        result.message || `Account ${user.email} was deleted successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to delete ${user.email}.`
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              ← Back to Admin Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold">Manage Users</h1>

            <p className="mt-2 text-sm text-gray-600">
              View accounts, manage access, update roles, and delete accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => token && void loadUsers(token)}
            disabled={loading || !token || savingId !== null}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh Users
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total users</p>
            <p className="mt-2 text-3xl font-bold">{users.length}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active users</p>
            <p className="mt-2 text-3xl font-bold">
              {users.filter((user) => user.is_active).length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Administrators</p>
            <p className="mt-2 text-3xl font-bold">
              {
                users.filter((user) =>
                  user.roles.some((role) => role.toUpperCase() === "ADMIN")
                ).length
              }
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {success}
          </div>
        )}

        <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, or user ID"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter by account status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter by role"
            >
              <option value="all">All roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-gray-500">
              Loading users…
            </p>
          ) : filteredUsers.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No users match your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3">Account access</th>
                    <th className="px-4 py-3">Role actions</th>
                    <th className="px-4 py-3">Delete account</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const roles = pendingRoles[user.id] ?? user.roles;

                    const rolesChanged =
                      JSON.stringify([...roles].sort()) !==
                      JSON.stringify([...user.roles].sort());

                    return (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="px-4 py-4">
                          <p className="font-semibold">
                            {user.full_name || "Unnamed user"}
                            {isSelf && (
                              <span className="ml-2 text-xs text-blue-700">
                                (You)
                              </span>
                            )}
                          </p>

                          <p className="mt-1 text-gray-600">{user.email}</p>

                          <p className="mt-1 break-all text-xs text-gray-400">
                            ID: {user.id}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              user.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            {["USER", "ADMIN"].map((role) => (
                              <label
                                key={role}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={roles.includes(role)}
                                  disabled={isSelf || savingId === user.id}
                                  onChange={() => toggleRole(user.id, role)}
                                  className="h-4 w-4 rounded"
                                />
                                {role}
                              </label>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={isSelf || savingId === user.id}
                            onClick={() => void handleStatusChange(user)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                              user.is_active
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {savingId === user.id
                              ? "Saving…"
                              : user.is_active
                                ? "Deactivate"
                                : "Activate"}
                          </button>

                          {isSelf && (
                            <p className="mt-2 text-xs text-gray-500">
                              Your account is protected.
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={
                              isSelf ||
                              savingId === user.id ||
                              !rolesChanged ||
                              roles.length === 0
                            }
                            onClick={() => void handleSaveRoles(user)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {savingId === user.id ? "Saving…" : "Save roles"}
                          </button>
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={isSelf || savingId !== null}
                            onClick={() => void handleDeleteUser(user)}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {savingId === user.id ? "Processing…" : "Delete"}
                          </button>

                          {isSelf && (
                            <p className="mt-2 text-xs text-gray-500">
                              Cannot delete yourself.
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500">
            Showing {filteredUsers.length} of {users.length} users. Your own
            account cannot be modified from this page. Deletion is permanent.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function ManageUsersPage() {
  return (
    <ProtectedRoute>
      <ManageUsersContent />
    </ProtectedRoute>
  );
}
