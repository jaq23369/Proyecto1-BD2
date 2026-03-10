"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

const AUTH_ROUTES = ["/login", "/register"];

export function NavbarWrapper() {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute) return null;
  return <Navbar />;
}
