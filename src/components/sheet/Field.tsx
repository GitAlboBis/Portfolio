"use client";

import * as React from "react";
import { RuleIn, type RuleInProps } from "@/components/sheet/RuleIn";
import { cn } from "@/lib/cn";

/**
 * Field — a captioned ruled box (REDESIGN-SPEC §A: "every element is a field
 * with a printed label"). Draws its LEFT rule itself and its TOP rule through
 * RuleIn (so the rule can draw itself); the enclosing `.fields` grid closes
 * right + bottom, so touching fields never double a line. The caption sits
 * top-left inside (`.f-caption`, graphite, 24px line).
 *
 * `caption` is copy from dict.ts — never a literal.
 */
export interface FieldProps extends Omit<RuleInProps, "rule"> {
  caption?: React.ReactNode;
  /** Static top rule (border) instead of the RULE-IN element — for RM-only or nested uses. */
  staticRule?: boolean;
  /** Padding of the box; default `var(--field-pad)`. */
  padded?: boolean;
  /** Field fill: paper (default) or the deeper field tone. */
  tone?: "paper" | "field";
  /** Caption id hook for aria-labelledby consumers. */
  captionId?: string;
}

export function Field({
  caption,
  staticRule = false,
  padded = true,
  tone = "paper",
  captionId,
  className,
  children,
  ...rest
}: FieldProps) {
  return (
    <RuleIn
      rule={!staticRule}
      className={cn(
        "min-w-0 border-l border-ink",
        staticRule && "border-t",
        padded && "[padding:var(--field-pad)]",
        tone === "field" ? "bg-paper-field" : "bg-paper",
        className,
      )}
      {...rest}
    >
      {caption ? (
        <span id={captionId} className="field-caption f-caption">
          {caption}
        </span>
      ) : null}
      {children}
    </RuleIn>
  );
}
