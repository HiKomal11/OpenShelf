
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
  type LoginRequest,
  type RegisterRequest,
  type UserResponse,
} from "@/lib/api";

const TOKEN_KEY = "pdf_library_access_token";

type AuthContextType = {
  user: UserResponse | null;
  accessToken: string | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<UserResponse>;
  register: (data: RegisterRequest) => Promise<UserResponse>;
  setSession: (token: string) => Promise<UserResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  // Adopt a new session and immediately synchronize React state.
  const setSession = useCallback(
    async (token: string): Promise<UserResponse> => {
      localStorage.setItem(TOKEN_KEY, token);
      setAccessToken(token);
      setLoading(true);

      try {
        const currentUser = await getCurrentUser(token);
        setUser(currentUser);
        return currentUser;
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        setAccessToken(null);
        setUser(null);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refreshUser = useCallback(async () => {
    // Read the latest token, not a potentially stale state value.
    const token =
      accessToken ?? localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const currentUser = await getCurrentUser(token);
      setAccessToken(token);
      setUser(currentUser);
    } catch {
      logout();
    }
  }, [accessToken, logout]);


  // Restore a previously saved session on initial page load.
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (storedToken) {
      // This effect synchronizes React state with localStorage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccessToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);
  // Load the current user whenever the active token changes.
  useEffect(() => {
  if (!accessToken) {
    return;
  }
    let cancelled = false;

    getCurrentUser(accessToken)
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setAccessToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const login = async (
    data: LoginRequest
  ): Promise<UserResponse> => {
    const result = await loginUser(data);
    return setSession(result.access_token);
  };

  const register = async (data: RegisterRequest) => {
    return registerUser(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        setSession,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
