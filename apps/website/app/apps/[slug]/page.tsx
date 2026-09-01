import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppExperiencePage } from "@/components/marketing/AppExperiencePage";
import { appExperienceBySlug, appExperiences } from "@/content/app-experiences";

export const generateStaticParams = () => appExperiences.map(({ slug }) => ({ slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const app = appExperienceBySlug[(await params).slug];
  return app ? { title: app.name, description: app.description } : {};
}
export default async function AppPage({ params }: { params: Promise<{ slug: string }> }) {
  const app = appExperienceBySlug[(await params).slug];
  if (!app) notFound();
  return <AppExperiencePage app={app} />;
}
