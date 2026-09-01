import { useEffect, useState } from "react";
import {
  KitchenLogin,
  getToken,
  logout,
  logoutSession,
  restoreSession,
} from "@/features/auth";
import { KitchenBoard } from "@/features/kitchen/pages/KitchenBoard";

export const KitchenApp = () => {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(() =>
    getToken() ? true : null,
  );

  useEffect(() => {
    if (loggedIn !== null) return;
    restoreSession()
      .then(() => setLoggedIn(true))
      .catch(() => {
        logout();
        setLoggedIn(false);
      });
  }, [loggedIn]);

  async function handleLogout() {
    try {
      await logoutSession();
    } finally {
      logout();
      setLoggedIn(false);
    }
  }

  if (loggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        Restoring session…
      </div>
    );
  }
  if (!loggedIn) return <KitchenLogin onLogin={() => setLoggedIn(true)} />;
  return <KitchenBoard onLogout={() => void handleLogout()} />;
};
