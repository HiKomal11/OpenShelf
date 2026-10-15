
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ApiErrorResponse = {
  detail?: string;
};

async function parseResponse<T>(
  response: Response
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data && typeof data === "object" && "detail" in data
        ? (data as ApiErrorResponse).detail
        : "An unexpected error occurred.";

    throw new Error(
      typeof errorMessage === "string"
        ? errorMessage
        : "An unexpected error occurred."
    );
  }

  return data as T;
}

export type RegisterRequest = {
  email: string;
  password: string;
  full_name?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type UserResponse = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[];
};

export type DocumentCategory = {
  id: number;
  name: string;
  slug: string;
};

export type PublicDocumentFile = {
  file_name: string;
  file_size: number;
  mime_type: string;
  ocr_status: string | null;
};

export type PublicDocument = {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  language: string | null;
  publication_date: string | null;
  categories: DocumentCategory[];
  page_count: number | null;
  file: PublicDocumentFile | null;
};

export type PublicDocumentListResponse = {
  items: PublicDocument[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type PublicDocumentQuery = {
  search?: string;
  category_id?: number;
  page?: number;
  page_size?: number;
  sort?: string;
};

/* =========================
   Phase 9 - Interactions
   ========================= */

export type DocumentInteractionStatus = {
  liked: boolean;
  bookmarked: boolean;
  like_count: number;
};

export type DocumentInteractionResponse = {
  message: string;
  liked?: boolean;
  bookmarked?: boolean;
  viewed?: boolean;
  like_count?: number;
  last_viewed_at?: string;
};

export type UserDocumentHistoryItem = PublicDocument & {
  last_viewed_at: string;
};

export type UserDocumentListResponse = {
  items: PublicDocument[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type UserDocumentHistoryResponse = {
  items: UserDocumentHistoryItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

/* =========================
   Authentication
   ========================= */

export async function registerUser(
  data: RegisterRequest
): Promise<UserResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return parseResponse<UserResponse>(response);
}


export async function verifyEmail(token: string): Promise<{ message: string }> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      cache: "no-store",
    }
  );

  return parseResponse<{ message: string }>(response);
}

export async function resendVerificationEmail(
  email: string
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/resend-verification`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }
  );

  return parseResponse<{ message: string }>(response);
}

export async function loginUser(
  data: LoginRequest
): Promise<TokenResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return parseResponse<TokenResponse>(response);
}

export async function getCurrentUser(
  accessToken: string
): Promise<UserResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return parseResponse<UserResponse>(response);
}

/* =========================
   Public Documents
   ========================= */

export async function getPublicDocuments(
  params: PublicDocumentQuery = {}
): Promise<PublicDocumentListResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.category_id !== undefined) {
    searchParams.set("category_id", String(params.category_id));
  }

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.page_size !== undefined) {
    searchParams.set("page_size", String(params.page_size));
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  const queryString = searchParams.toString();

  const response = await fetch(
    `${API_URL}/api/v1/documents${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return parseResponse<PublicDocumentListResponse>(response);
}

export async function getPublicDocument(
  documentId: string
): Promise<PublicDocument> {
  const response = await fetch(
    `${API_URL}/api/v1/documents/${documentId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return parseResponse<PublicDocument>(response);
}

export function getPublicDocumentDownloadUrl(
  documentId: string
): string {
  return `${API_URL}/api/v1/documents/${documentId}/download`;
}

export function getPublicDocumentViewUrl(
  documentId: string
): string {
  return `${API_URL}/api/v1/documents/${documentId}/view`;
}

export async function getPublicCategories(): Promise<
  DocumentCategory[]
> {
  const response = await fetch(
    `${API_URL}/api/v1/categories`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return parseResponse<DocumentCategory[]>(response);
}

/* =========================
   Phase 9 - Document Interactions
   ========================= */

export async function getDocumentInteractions(
  documentId: string,
  accessToken: string
): Promise<DocumentInteractionStatus> {
  const response = await fetch(
    `${API_URL}/api/v1/documents/${documentId}/interactions`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  return parseResponse<DocumentInteractionStatus>(response);
}

export async function likeDocument(
  documentId: string,
  accessToken: string
): Promise<DocumentInteractionResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/documents/${documentId}/like`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return parseResponse<DocumentInteractionResponse>(response);
}

export async function unlikeDocument(
  documentId: string,
  accessToken: string
): Promise<DocumentInteractionResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/documents/${documentId}/like`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return parseResponse<DocumentInteractionResponse>(response);
}

export async function bookmarkDocument(
  documentId: string,
  accessToken: string
): Promise<DocumentInteractionResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/documents/${documentId}/bookmark`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return parseResponse<DocumentInteractionResponse>(response);
}

export async function removeBookmark(
  documentId: string,
  accessToken: string
): Promise<DocumentInteractionResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/documents/${documentId}/bookmark`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return parseResponse<DocumentInteractionResponse>(response);
}

export async function recordDocumentView(
  documentId: string,
  accessToken: string
): Promise<DocumentInteractionResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/documents/${documentId}/view`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return parseResponse<DocumentInteractionResponse>(response);
}

/* =========================
   Phase 10 - Notifications
   ========================= */

export type NotificationResponse = {
  id: string;
  type: string;
  title: string;
  message: string;
  document_id: string | null;
  category_id: number | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};
export type UnreadNotificationCountResponse = {
  count: number;
};

export async function getNotifications(
  accessToken: string,
  unreadOnly = false
): Promise<NotificationResponse[]> {
  const searchParams = new URLSearchParams();

  if (unreadOnly) {
    searchParams.set("unread_only", "true");
  }

  const queryString = searchParams.toString();

  const response = await fetch(
    `${API_URL}/api/v1/notifications${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  return parseResponse<NotificationResponse[]>(response);
}

export async function getUnreadNotificationCount(
  accessToken: string
): Promise<UnreadNotificationCountResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/notifications/unread-count`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  return parseResponse<UnreadNotificationCountResponse>(response);
}

export async function markNotificationAsRead(
  notificationId: string,
  accessToken: string
): Promise<NotificationResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return parseResponse<NotificationResponse>(response);
}

/* =========================
   Phase 9 - User Library
   ========================= */

export async function getMyBookmarks(
  accessToken: string,
  page = 1,
  pageSize = 12
): Promise<UserDocumentListResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  const response = await fetch(
    `${API_URL}/api/v1/users/me/bookmarks?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  return parseResponse<UserDocumentListResponse>(response);
}

export async function getMyHistory(
  accessToken: string,
  page = 1,
  pageSize = 12
): Promise<UserDocumentHistoryResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  const response = await fetch(
    `${API_URL}/api/v1/users/me/history?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  return parseResponse<UserDocumentHistoryResponse>(response);
}

/* =========================
   Admin - User Management
   ========================= */

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[];
};

export type AdminUserStatusUpdate = {
  is_active: boolean;
};

export type AdminUserRolesUpdate = {
  roles: string[];
};

export async function getAdminUsers(
  accessToken: string
): Promise<AdminUser[]> {
  const response = await fetch(
    `${API_URL}/api/v1/admin/users`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  return parseResponse<AdminUser[]>(response);
}

export async function getAdminUser(
  userId: string,
  accessToken: string
): Promise<AdminUser> {
  const response = await fetch(
    `${API_URL}/api/v1/admin/users/${userId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  return parseResponse<AdminUser>(response);
}

export async function updateAdminUserStatus(
  userId: string,
  isActive: boolean,
  accessToken: string
): Promise<AdminUser> {
  const response = await fetch(
    `${API_URL}/api/v1/admin/users/${userId}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    }
  );

  return parseResponse<AdminUser>(response);
}

export async function updateAdminUserRoles(
  userId: string,
  roles: string[],
  accessToken: string
): Promise<AdminUser> {
  const response = await fetch(
    `${API_URL}/api/v1/admin/users/${userId}/roles`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roles,
      }),
    }
  );

  return parseResponse<AdminUser>(response);
}


export async function deleteAdminUser(
  userId: string,
  accessToken: string
): Promise<{ message: string; user_id: string }> {
  const response = await fetch(
    `${API_URL}/api/v1/admin/users/${userId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return parseResponse<{ message: string; user_id: string }>(response);
}