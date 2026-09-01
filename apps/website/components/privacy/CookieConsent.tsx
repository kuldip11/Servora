"use client";
import { useEffect, useState } from "react";

const KEY = "servora_cookie_consent";
export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const open = () => setVisible(true);
    setVisible(!localStorage.getItem(KEY));
    window.addEventListener("servora:open-cookie-settings", open);
    return () =>
      window.removeEventListener("servora:open-cookie-settings", open);
  }, []);
  if (!visible) return null;
  function choose(value: "accepted" | "essential") {
    localStorage.setItem(KEY, value);
    window.dispatchEvent(new Event("servora:consent-changed"));
    setVisible(false);
  }
  return (
    <aside
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl"
    >
      <h2 className="font-semibold">Cookies</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        We use essential cookies to operate the site. Optional analytics should
        only be enabled after consent.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => choose("accepted")}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Accept optional cookies
        </button>
        <button
          onClick={() => choose("essential")}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
        >
          Essential only
        </button>
      </div>
    </aside>
  );
};
