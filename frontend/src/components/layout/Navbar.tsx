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
  { href: "/restaurantes", label: "Explorar",  icon: <Sparkles size={15} /> },
  { href: "/ordenes",      label: "Pedidos",   icon: <ShoppingBag size={15} /> },
  { href: "/resenas",      label: "Reseñas",   icon: <Star size={15} /> },
  { href: "/menu-items",   label: "Menú",      icon: <Utensils size={15} />, adminOnly: true },
  { href: "/usuarios",     label: "Usuarios",  icon: <Users size={15} />, adminOnly: true },
  { href: "/uploads",      label: "Archivos",  icon: <Upload size={15} />, adminOnly: true },
  { href: "/analytics",   label: "Analytics", icon: <BarChart2 size={15} />, adminOnly: true },
];

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = allLinks.filter((l) => !l.adminOnly || isAdmin);
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none">
      {/* Main bar */}
      <div className="pointer-events-auto flex items-center justify-between h-[60px] px-5 w-full max-w-6xl glass-panel mt-3 rounded-2xl relative">

        {/* Logo */}
        <Link href="/restaurantes" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 shadow-md shadow-brand-600/25 group-hover:shadow-brand-600/40 transition-shadow">
            <Utensils size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-black tracking-tight text-slate-900 text-[17px] hidden sm:block">
            Food<span className="text-brand-600">Hub</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 ml-8">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150",
                isActive(link.href)
                  ? "text-brand-600 bg-brand-50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
              )}
            >
              {link.icon}
              {link.label}
              {isActive(link.href) && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right: user */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100">
                  <User size={12} className="text-brand-700" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[13px] font-semibold text-slate-800 max-w-[110px] truncate">
                    {user.nombre}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Cerrar sesión"
                className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer border border-transparent hover:border-red-100"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/20"
            >
              Ingresar
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menú"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            variants={slideDownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="pointer-events-auto absolute top-full left-4 right-4 mt-1 bg-white rounded-2xl shadow-float border border-slate-100 overflow-hidden md:hidden p-2"
          >
            <div className="flex flex-col gap-0.5">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive(link.href)
                      ? "bg-brand-50 text-brand-600 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <div className="my-1 border-t border-slate-100" />
              {user ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  <User size={15} />
                  Iniciar sesión
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
