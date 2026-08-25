import { useState } from 'react';
import { KitchenLogin, getToken, logout } from '../../auth';
import { KitchenBoard } from '../pages/KitchenBoard';

export function KitchenApp() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());

  function handleLogout() {
    logout();
    setLoggedIn(false);
  }

  if (!loggedIn) return <KitchenLogin onLogin={() => setLoggedIn(true)} />;
  return <KitchenBoard onLogout={handleLogout} />;
}
