import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export Greeklish utilities for easier access
export { toGreeklish, sanitizeFilename, createSafeFilename } from './utils/greeklish';
