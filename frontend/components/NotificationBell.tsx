"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
getNotifications,
getUnreadNotificationCount,
markNotificationAsRead,
type NotificationResponse,
} from "@/lib/api";
import { useAuth } from "@/app/providers";

export default function NotificationBell() {
const { user, accessToken, loading: authLoading } = useAuth();
const router = useRouter();

const [notifications, setNotifications] = useState<
NotificationResponse[]

> ([]);
const [unreadCount, setUnreadCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const loadUnreadCount = useCallback(async () => {
  if (!accessToken || !user) {
    return;
  }


try {
  const result = await getUnreadNotificationCount(accessToken);
  setUnreadCount(result.count);
} catch {
  setUnreadCount(0);
}


}, [accessToken, user]);

const loadNotifications = useCallback(async () => {
if (!accessToken || !user) {
setNotifications([]);
return;
}


setLoading(true);
setError("");

try {
  const result = await getNotifications(accessToken);
  setNotifications(result);
} catch {
  setError("Unable to load notifications. Please try again.");
} finally {
  setLoading(false);
}


}, [accessToken, user]);

useEffect(() => {
  if (authLoading) return;

  let cancelled = false;

  void Promise.resolve().then(() => {
    if (!cancelled) {
      return loadUnreadCount();
    }
  });

  return () => {
    cancelled = true;
  };
}, [authLoading, loadUnreadCount]);
useEffect(() => {
if (!isOpen) return;


function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    setIsOpen(false);
  }
}

document.addEventListener("keydown", handleKeyDown);

return () => {
  document.removeEventListener("keydown", handleKeyDown);
};


}, [isOpen]);

const handleToggle = () => {
const nextOpen = !isOpen;
setIsOpen(nextOpen);


if (nextOpen) {
  void loadNotifications();
}


};

const handleMarkAsRead = async (
notification: NotificationResponse
) => {
if (!accessToken) return;


try {
  if (!notification.is_read) {
    const updated = await markNotificationAsRead(
      notification.id,
      accessToken
    );

    setNotifications((current) =>
      current.map((item) =>
        item.id === updated.id ? updated : item
      )
    );

    setUnreadCount((current) => Math.max(0, current - 1));
  }

  setIsOpen(false);

  if (notification.document_id) {
    router.push(`/library/${notification.document_id}`);
    return;
  }

  if (notification.category_id) {
    router.push(
      `/library?category_id=${notification.category_id}`
    );
  }
} catch {
  setError(
    "Unable to mark notification as read. Please try again."
  );
}


};

if (authLoading || !user || !accessToken) {
return null;
}

return ( <div className="relative"> <button
     type="button"
     onClick={handleToggle}
     className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-transparent text-slate-600 transition hover:border-slate-200 hover:bg-slate-100 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
     aria-label={
       unreadCount > 0
? `Notifications, ${unreadCount} unread`
: "Notifications"
}
aria-expanded={isOpen}
aria-controls="openshelf-notifications-panel"
title="Notifications"
> <svg
       aria-hidden="true"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       strokeWidth="1.8"
       strokeLinecap="round"
       strokeLinejoin="round"
       className="h-5 w-5"
     > <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /> <path d="M10 21h4" /> </svg>


    {unreadCount > 0 && (
      <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    )}
  </button>

  {isOpen && (
    <section
      id="openshelf-notifications-panel"
      aria-label="Notifications"
      className="absolute right-0 z-50 mt-3 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30 sm:w-96"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900 dark:text-white">
            Notifications
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Updates from your library
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {unreadCount > 0 && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {unreadCount > 99 ? "99+" : unreadCount} unread
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close notifications"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            ×
          </button>
        </div>
      </div>

      <div className="max-h-[min(24rem,65vh)] overflow-y-auto overscroll-contain">
        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="space-y-4 px-4 py-6"
          >
            <div className="flex gap-3">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-700/70" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-700/70" />
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Loading notifications...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-6 text-center">
            <p
              role="alert"
              className="text-sm text-rose-600 dark:text-rose-300"
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-indigo-300 dark:hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
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
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            </div>

            <p className="mt-4 font-semibold text-slate-800 dark:text-slate-100">
              You&apos;re all caught up
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              New library updates will appear here.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void handleMarkAsRead(notification)}
              className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-indigo-50/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:hover:bg-slate-700/70 ${
                notification.is_read
                  ? "bg-white dark:bg-slate-800"
                  : "bg-indigo-50/60 dark:bg-indigo-950/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.is_read
                      ? "bg-slate-300 dark:bg-slate-600"
                      : "bg-indigo-600 dark:bg-indigo-400"
                  }`}
                  aria-hidden="true"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="break-words text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
                      {notification.title}
                    </p>

                    {!notification.is_read && (
                      <span className="mt-1 shrink-0 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 break-words text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {new Date(
                      notification.created_at
                    ).toLocaleString()}
                  </p>

                  {(notification.document_id ||
                    notification.category_id) && (
                    <p className="mt-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      View details →
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
      </div>

      {!loading && !error && notifications.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Select a notification to view its details.
          </p>
        </div>
      )}
    </section>
  )}
</div>


);
}
