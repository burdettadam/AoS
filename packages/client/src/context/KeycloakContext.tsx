import Keycloak, { KeycloakInitOptions } from "keycloak-js";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
  token: string | null;
  userInfo: any;
}

const KeycloakContext = createContext<KeycloakContextType | undefined>(
  undefined,
);

export const useKeycloak = () => {
  const context = useContext(KeycloakContext);
  if (!context) {
    throw new Error("useKeycloak must be used within a KeycloakProvider");
  }
  return context;
};

interface KeycloakProviderProps {
  children: ReactNode;
}

export const KeycloakProvider: React.FC<KeycloakProviderProps> = ({
  children,
}) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return; // guard against React strict double invoke in dev
    initRef.current = true;

    const hash = window.location.hash;
    if (hash.startsWith("#error=login_required")) {
      // Remove error hash so we don't loop
      console.warn(
        "Detected login_required hash from Keycloak. Showing login prompt.",
      );
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      setLoading(false);
      return; // Let user click Login
    }

    const run = async () => {
      try {
        const kcConfig = {
          url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
          realm: "botct",
          clientId: "botct-client",
        };
        console.log("Initializing Keycloak with config", kcConfig);
        const kc = new Keycloak(kcConfig);
        setKeycloak(kc);

        const options: KeycloakInitOptions = {
          onLoad: "check-sso",
          checkLoginIframe: false,
          // silent check only if the file exists (served from public/)
        };
        // Try to detect silent-check file existence cheaply
        fetch("/silent-check-sso.html", { method: "HEAD" })
          .then((r) => {
            if (r.ok)
              (options as any).silentCheckSsoRedirectUri =
                `${window.location.origin}/silent-check-sso.html`;
          })
          .catch(() => {})
          .finally(async () => {
            let authenticated = false;
            try {
              authenticated = await kc.init(options);
            } catch (e: any) {
              console.warn(
                "Keycloak init (check-sso) failed, will fallback to unauth state:",
                e?.message || e,
              );
              authenticated = false;
            }
            setAuthenticated(authenticated);
            if (authenticated) {
              setToken(kc.token || null);
              try {
                const profile = await kc.loadUserInfo();
                setUserInfo(profile);
                try {
                  const existing = localStorage.getItem(
                    "ashes-of-salem-player-name",
                  );
                  if (!existing || !existing.trim()) {
                    const u: any = profile || {};
                    // Priority order for avatar name generation:
                    // 1. preferred_username (if not email-like)
                    // 2. first name + last initial
                    // 3. name field
                    // 4. first name only
                    // 5. username (if not email-like)
                    let candidate = "";

                    // Check preferred_username (but skip if it looks like an email)
                    if (
                      u.preferred_username &&
                      !u.preferred_username.includes("@")
                    ) {
                      candidate = u.preferred_username;
                    }
                    // Try first name + last initial
                    else if (u.given_name && u.family_name) {
                      candidate = `${u.given_name} ${u.family_name.charAt(0).toUpperCase()}.`;
                    }
                    // Try the full name field
                    else if (u.name && !u.name.includes("@")) {
                      candidate = u.name;
                    }
                    // Try just first name
                    else if (u.given_name) {
                      candidate = u.given_name;
                    }
                    // Last resort: username if not email-like
                    else if (u.sub && !u.sub.includes("@")) {
                      candidate = u.sub;
                    }

                    if (candidate && candidate.trim()) {
                      console.log(
                        "Setting avatar name from Keycloak profile:",
                        candidate.trim(),
                      );
                      localStorage.setItem(
                        "ashes-of-salem-player-name",
                        candidate.trim(),
                      );
                    }
                  }
                } catch (e) {
                  console.warn("Could not set avatar name from profile:", e);
                }
              } catch (e) {
                console.warn("Could not load user profile", e);
              }
              // refresh loop
              const refreshHandle = setInterval(() => {
                kc.updateToken(30)
                  .then((refreshed) => {
                    if (refreshed) setToken(kc.token || null);
                  })
                  .catch((err) => {
                    console.error("Token refresh failed, clearing auth", err);
                    clearInterval(refreshHandle);
                    setAuthenticated(false);
                    setToken(null);
                    setUserInfo(null);
                  });
              }, 10000);
            }
            setLoading(false);
          });
      } catch (err) {
        console.error("Keycloak bootstrap failure", err);
        setLoading(false);
      }
    };
    run();
  }, []);

  const login = () => {
    if (!keycloak) {
      console.warn("Login requested before Keycloak ready");
      return;
    }
    // Use redirect login, not prompt=none
    keycloak.login({ prompt: "login" });
  };

  const logout = () => {
    if (keycloak) {
      setAuthenticated(false);
      setToken(null);
      setUserInfo(null);
      keycloak.logout();
    }
  };

  const value: KeycloakContextType = {
    keycloak,
    authenticated,
    loading,
    login,
    logout,
    token,
    userInfo,
  };

  return (
    <KeycloakContext.Provider value={value}>
      {children}
    </KeycloakContext.Provider>
  );
};
