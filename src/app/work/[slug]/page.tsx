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
  return {
    title: w ? `${w.title} — Alberto Tuveri` : "Work — Alberto Tuveri",
    description: w?.study?.summary.en,
  };
}

export default async function WorkPage({ params }: Params) {
  const { slug } = await params;
  return <WorkCaseStudy slug={slug} />;
}
