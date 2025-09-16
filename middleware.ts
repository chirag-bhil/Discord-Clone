// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  "/api/uploadthing",
  "/api/uploadthing/(.*)",  // More specific pattern
  "/sign-in(.*)",
  "/sign-up(.*)", 
  "/debug-upload",
  "/"
])

export default clerkMiddleware(async (auth, req) => {
  console.log("Middleware processing:", req.nextUrl.pathname);
  
  if (isPublicRoute(req)) {
    console.log("Public route allowed:", req.nextUrl.pathname);
    return;
  }
  
  console.log("Protected route, checking auth:", req.nextUrl.pathname);
  await auth.protect();
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
