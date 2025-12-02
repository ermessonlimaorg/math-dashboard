export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard",
    "/questions/:path*",
    "/feedback/:path*",
    "/api/questions/:path*",
    "/api/feedback/:path*",
    "/api/attempts/:path*",
    "/api/solutions/:path*"
  ]
}
