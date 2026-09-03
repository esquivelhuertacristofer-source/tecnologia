import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === "production",

  // Trace 10% of requests for performance profiling
  tracesSampleRate: 0.1,

  beforeSend(event, hint) {
    const error = hint?.originalException;
    const message = error instanceof Error ? error.message : String(error ?? "");

    // Drop Supabase connection timeouts that are expected in cold starts
    if (message.includes("ETIMEDOUT") || message.includes("FetchError")) return null;

    // Drop health-check pings from Vercel
    if (event.request?.url?.includes("/api/health")) return null;

    return event;
  },
});
