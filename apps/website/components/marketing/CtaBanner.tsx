import Link from "next/link";

export function CtaBanner({
  title = "See Servora in action.",
  text = "Walk through your restaurant workflow with the team and see where Servora fits.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-[var(--text-primary)] px-7 py-12 text-[var(--surface)] sm:px-12 lg:flex lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 opacity-75">{text}</p>
        </div>
        <Link
          href="/book-a-demo"
          className="mt-7 inline-flex rounded-lg bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] lg:mt-0"
        >
          Book a Demo
        </Link>
      </div>
    </section>
  );
}
