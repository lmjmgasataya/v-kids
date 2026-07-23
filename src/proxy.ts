import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "app_session";

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "fallback-dev-secret-change-in-production"
  );
}

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, secret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/", "/kids/:path*", "/settings/:path*", "/check-in/:path*", "/attendance/:path*", "/kc-bucks/:path*"],
};
