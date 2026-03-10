"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  ShoppingBag,
  Star,
  BarChart2,
  Users,
  Menu,
  X,
  LogOut,
  User,
  Upload,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { slideDownVariants } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const allLinks: NavLink[] = [
  { href: "/restaurantes", label: "Explorar", icon: <Sparkles size={16} /> },
  { href: "/ordenes", label: "Pedidos", icon: <ShoppingBag size={16} /> },
  { href: "/resenas", label: "Resenas", icon: <Star size={16} /> },
  { href: "/menu-items", label: "Menu", icon: <Utensils size={16} />, adminOnly: true },
  { href: "/usuarios", label: "Usuarios", icon: <Users size={16} />, adminOnly: true },
  { href: "/uploads", label: "Archivos", icon: <Upload size={16} />, adminOnly: true },
  { href: "/analytics", label: "Stats", icon: <BarChart2 size={16} />, adminOnly: true },
];

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = allLinks.filter((l) => !l.adminOnly || isAdmin);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 w-full sm:px-6 pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-between h-16 px-4 w-full max-w-6xl glass-panel rounded-full relative">
        <div className="flex items-center w-full justify-between">
          {/* Logo */}
          <Link href="/restaurantes" className="flex items-center gap-3 shrink-0 mr-6 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-300">
              <Utensils size={18} className="text-white fill-white/20" />
            </div>
            <span className="font-heading font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 text-xl hidden sm:block">
              FoodHub
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1.5 flex-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-out",
                  isActive(link.href)
                    ? "bg-brand-50 text-brand-600 shadow-sm ring-1 ring-brand-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center pl-1 pr-4 py-1 bg-white/50 backdrop-blur-md rounded-full shadow-sm ring-1 ring-slate-200/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 mr-3 border border-slate-200">
                    <User size={14} className="text-slate-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                      {user.nombre}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm ring-1 ring-slate-200/50 cursor-pointer"
                  title="Cerrar sesion"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-500/20 bg-gradient-to-r from-brand-400 to-brand-600 text-white hover:from-brand-500 hover:to-brand-700 transition-all hover:scale-105 active:scale-95"
              >
                Ingresar
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm ring-1 ring-slate-200/50"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            variants={slideDownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="pointer-events-auto absolute top-full left-4 right-4 mt-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-float border border-slate-100/50 overflow-hidden md:hidden p-2"
          >
            <div className="flex flex-col gap-1">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive(link.href)
                      ? "bg-amber-50 text-amber-600"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer mt-2 bg-slate-50 border border-slate-100"
                >
                  <LogOut size={16} />
                  Cerrar sesion
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 justify-center px-4 py-3.5 rounded-xl text-sm font-bold bg-brand-500 text-white hover:bg-brand-600 transition-colors mt-2"
                >
                  <User size={16} />
                  Iniciar Sesion
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
