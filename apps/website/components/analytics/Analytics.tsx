"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const KEY = "servora_cookie_consent";

export const Analytics = () => {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setConsent(window.localStorage.getItem(KEY));
    read();
    window.addEventListener("storage", read);
    window.addEventListener("servora:consent-changed", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("servora:consent-changed", read);
    };
  }, []);

  useEffect(() => {
    if (consent === "accepted") {
      track({
        event: "page_view",
        path: window.location.pathname,
        referrer: document.referrer || undefined,
      });
    }
  }, [consent]);

  if (!GA_ID || consent !== "accepted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="servora-gtag" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`}
      </Script>
    </>
  );
};
