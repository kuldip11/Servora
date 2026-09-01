import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { AppExperience } from "@/content/app-experiences";
import { ProductPreview } from "./ProductPreview";
import { CtaBanner } from "./CtaBanner";

export const AppExperiencePage = ({ app }: { app: AppExperience }) => (
  <>
    <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-primary">{app.audience}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{app.headline}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-secondary">{app.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book-a-demo" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white">See {app.name} in a demo</Link>
            <Link href="/workflow" className="rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold">See the connected workflow</Link>
          </div>
        </div>
        <ProductPreview label={app.name} />
      </div>

      <section className="mt-20">
        <p className="text-sm font-semibold text-primary">What teams can do</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Built around real restaurant moments.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {app.features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-border bg-surface p-6">
              <CheckCircle2 className="text-primary" size={21} />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-20 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-[#111827] p-8 text-white sm:p-10">
          <p className="text-sm font-semibold text-violet-300">A typical flow</p>
          <ol className="mt-6 space-y-5">
            {app.moments.map((moment, index) => <li key={moment} className="flex items-center gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">{index + 1}</span><span>{moment}</span></li>)}
          </ol>
        </section>
        <section className="rounded-3xl border border-border bg-surface p-8 sm:p-10">
          <p className="text-sm font-semibold text-primary">Why it matters</p>
          <div className="mt-6 space-y-4">
            {app.outcomes.map((outcome) => <div key={outcome} className="flex items-center gap-3 rounded-xl bg-surface-secondary p-4"><CheckCircle2 className="text-primary" size={19} /><span className="font-semibold">{outcome}</span></div>)}
          </div>
          <Link href="/solutions" className="mt-7 inline-flex items-center text-sm font-semibold text-primary">Explore solutions <ArrowRight className="ml-1" size={16} /></Link>
        </section>
      </div>
    </section>
    <CtaBanner title={`See how ${app.name} fits your restaurant.`} />
  </>
);
