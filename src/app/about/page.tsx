import type { Metadata } from "next";
import { AboutJourney } from "@/components/about/AboutJourney";

export const metadata: Metadata = {
  title: "About — Alberto Tuveri",
  description:
    "Software engineer — full-stack & AI integration. The long version: education, experience and thesis, from the Sulcis coast of Sardinia to Camerino.",
};

export default function AboutPage() {
  return <AboutJourney />;
}
