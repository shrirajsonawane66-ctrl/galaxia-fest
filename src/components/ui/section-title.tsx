import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionTitleProps {
  cream: string;
  red: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * @deprecated two-tone titles were removed
 *
 * Kept so existing call sites keep working. The heading now renders in one flat
 * cream colour with the shared `.type-h2` scale — pass a sentence-case string.
 */
export function SectionTitle({
  cream,
  red,
  as = "h2",
  className,
}: SectionTitleProps) {
  const Tag = as;

  return <Tag className={cn("type-h2", className)}>{cream} {red}</Tag>;
}

export default SectionTitle;
