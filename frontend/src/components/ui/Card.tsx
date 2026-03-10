"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className, onClick, hoverable = false }: CardProps) {
  if (hoverable) {
    return (
      <motion.div
        whileHover={{
          y: -2,
          boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
        }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className={cn(
          "bg-white rounded-2xl border border-gray-100 shadow-sm",
          onClick && "cursor-pointer",
          className
        )}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-sm",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
