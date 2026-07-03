import type { Metadata } from "next";
import { WorkIndex } from "@/components/work/WorkIndex";

const DESCRIPTION =
  "Selected work — full-stack products and AI-driven systems by Alberto Tuveri.";

export const metadata: Metadata = {
  title: "Work",
  description: DESCRIPTION,
  alternates: { canonical: "/work" },
  openGraph: { url: "/work", title: "Work — Alberto Tuveri", description: DESCRIPTION },
  twitter: { title: "Work — Alberto Tuveri", description: DESCRIPTION },
};

export default function WorkPage() {
  return <WorkIndex />;
}
