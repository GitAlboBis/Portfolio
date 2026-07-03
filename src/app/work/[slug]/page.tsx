import type { Metadata } from "next";
import { works, worksConfirmed } from "@/content/works";
import { WorkCaseStudy } from "@/components/work/WorkCaseStudy";

// Only confirmed projects get a case-study page; unknown/provisional slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return worksConfirmed.map((w) => ({ slug: w.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const w = works.find((x) => x.slug === slug);
  const title = w ? w.title : "Work";
  const description = w?.study?.summary.en;
  const ogTitle = `${title} — Alberto Tuveri`;
  return {
    title,
    description,
    alternates: { canonical: `/work/${slug}` },
    openGraph: { url: `/work/${slug}`, title: ogTitle, description },
    twitter: { title: ogTitle, description },
  };
}

export default async function WorkPage({ params }: Params) {
  const { slug } = await params;
  return <WorkCaseStudy slug={slug} />;
}
