import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Terms",
  description: "Servora terms information.",
};
export default function Terms() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
      <p className="text-sm font-semibold text-[var(--primary)]">Legal</p>
      <h1 className="mt-3 text-4xl font-bold">Terms of Service</h1>
      <p className="mt-8 text-sm leading-7 text-[var(--text-secondary)]">
        This page is a launch placeholder and must be replaced with approved
        legal copy before public production launch.
      </p>
    </section>
  );
}
