import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./eyebrow";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="heading-1 max-w-3xl text-balance text-foam">{title}</h2>
      {lead ? <p className="lead max-w-2xl text-pretty">{lead}</p> : null}
    </div>
  );
}
