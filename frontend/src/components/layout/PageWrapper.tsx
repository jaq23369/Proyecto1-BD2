"use client";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/utils";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
