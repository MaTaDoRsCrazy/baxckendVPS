import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadAuth, saveAuth, type StoredAuth } from "../lib/storage";

interface AuthContextValue {
  auth: StoredAuth | null;
  setAuth: (auth: StoredAuth | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<StoredAuth | null>(loadAuth());

  useEffect(() => {
    saveAuth(auth);
  }, [auth]);

  const value = useMemo(
    () => ({
      auth,
      setAuth: setAuthState,
      logout: () => setAuthState(null)
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
