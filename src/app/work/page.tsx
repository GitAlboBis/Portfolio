import type { Metadata } from "next";
import { WorkIndex } from "@/components/work/WorkIndex";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected work — full-stack products and AI-driven systems by Alberto Tuveri.",
};

export default function WorkPage() {
  return <WorkIndex />;
}
