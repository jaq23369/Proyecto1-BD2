import type { Variants } from "framer-motion";

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number, currency = "GTQ") {
  return `${currency} ${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-GT", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-GT", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Framer Motion variants ──────────────────────────────────────

export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const listVariants: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const cardVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.25 } },
};

export const modalBackdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

export const modalVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1,   y: 0,  transition: { duration: 0.25, ease: "easeOut" } },
  exit:    { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
};

export const toastVariants: Variants = {
  hidden:  { opacity: 0, x: 320 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, x: 320, transition: { duration: 0.2 } },
};

export const slideDownVariants: Variants = {
  hidden:  { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
  exit:    { opacity: 0, height: 0,      transition: { duration: 0.2 } },
};
