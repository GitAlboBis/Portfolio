import type { Metadata } from "next";
import { works } from "@/content/works";
import { SubForm } from "@/components/work/SubForm";

/* `/work/[slug]` — the sub-form on the carbon copy (REDESIGN-SPEC §D, §E.12).
   All nine line items are prerendered; anything else is a 404 (the job order
   has no tenth row). */
export const dynamicParams = false;

export function generateStaticParams() {
  return works.map((w) => ({ slug: w.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const w = works.find((x) => x.slug === slug);
  const title = w ? w.title : "Work";
  // The card's description is the job's own summary, EN (metadata has no locale).
  const description = w?.study?.summary.en;
  const ogTitle = `${title} — Alberto Tuveri`;
  return {
    title,
    description,
    alternates: { canonical: `/work/${slug}` },
    openGraph: { url: `/work/${slug}`, title: ogTitle, description },
    twitter: { card: "summary_large_image", title: ogTitle, description },
  };
}

export default async function WorkSubFormPage({ params }: Params) {
  const { slug } = await params;
  return <SubForm slug={slug} />;
}
