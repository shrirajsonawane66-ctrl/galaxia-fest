import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
}

export function genRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = "GAL-"
  for (let i=0;i<6;i++) s += chars[Math.floor(Math.random()*chars.length)]
  return s
}
