"use client";

import { FormEvent, useRef, useState } from "react";
import { track } from "@/lib/analytics";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const started = useRef(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, source: "contact" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send your message.");
      setState("success");
      form.reset();
      track({ event: "contact_form_submit", subject: String(data.subject || "general") });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      track({ event: "contact_form_error", error_type: message });
      setError(message);
      setState("error");
    }
  }

  function startTracking() {
    if (!started.current) {
      started.current = true;
      track({ event: "contact_form_start", source_page: "contact" });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">Name<input required name="name" autoComplete="name" onFocus={startTracking} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-surface)]" /></label>
        <label className="text-sm font-medium">Work email<input required type="email" name="email" autoComplete="email" onFocus={startTracking} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-surface)]" /></label>
      </div>
      <label className="text-sm font-medium">Subject<select name="subject" onFocus={startTracking} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
        <option value="general">General enquiry</option><option value="sales">Sales</option><option value="support">Support</option><option value="partnership">Partnership</option>
      </select></label>
      <label className="text-sm font-medium">Message<textarea required name="message" rows={6} onFocus={startTracking} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3" /></label>
      <button disabled={state === "submitting"} className="rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60">
        {state === "submitting" ? "Sending…" : "Send message"}
      </button>
      {state === "success" && <p role="status" className="text-sm text-[var(--success)]">Thanks. Your message has been sent. We’ll be in touch soon.</p>}
      {state === "error" && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
    </form>
  );
}
