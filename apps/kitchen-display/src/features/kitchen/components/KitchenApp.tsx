import { useState } from "react";
import { KitchenLogin, getToken, logout, logoutSession } from "@/features/auth";
import { KitchenBoard } from "@/features/kitchen/pages/KitchenBoard";

export const KitchenApp = () => {
  const [loggedIn, setLoggedIn] = useState(!!getToken());

  async function handleLogout() {
    try {
      await logoutSession();
    } finally {
      logout();
      setLoggedIn(false);
    }
  }

  if (!loggedIn) return <KitchenLogin onLogin={() => setLoggedIn(true)} />;
  return <KitchenBoard onLogout={() => void handleLogout()} />;
};
