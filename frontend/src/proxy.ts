import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/ordenes", "/resenas/nueva", "/usuarios", "/uploads", "/analytics", "/menu-items"];

export function proxy(request: NextRequest) {
  const token    = request.cookies.get("auth_token")?.value;
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ordenes/:path*",
    "/resenas/nueva/:path*",
    "/usuarios/:path*",
    "/uploads/:path*",
    "/analytics/:path*",
    "/menu-items/:path*",
  ],
};
