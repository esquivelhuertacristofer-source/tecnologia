import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production; devtools already capture errors locally
  enabled: process.env.NODE_ENV === "production",

  // 10% of sessions traced for performance (free tier friendly)
  tracesSampleRate: 0.1,

  // Replay 1% of all sessions, 100% on errors
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    }),
  ],

  beforeSend(event, hint) {
    const error = hint?.originalException;
    const message = error instanceof Error ? error.message : String(error ?? "");

    // Drop browser extension noise
    if (
      event.exception?.values?.[0]?.stacktrace?.frames?.some(
        (f) => f.filename?.includes("extension://") || f.filename?.includes("chrome-extension")
      )
    ) {
      return null;
    }

    // Drop ad-blocker / CORS noise
    if (message.includes("NetworkError") && message.includes("blocked")) return null;
    if (message.includes("Script error")) return null;

    // Drop CSP violations from noise.svg & external embeds
    if (event.type === "csp" || message.toLowerCase().includes("csp")) return null;

    // Drop errors already caught and displayed by our ErrorBoundary
    if (event.tags?.["cen.handled"] === "true") return null;

    return event;
  },
});
