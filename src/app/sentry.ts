import * as Sentry from '@sentry/angular';

export function initializeSentry() {
  if (typeof window === 'undefined' || !window.location) {
    return;
  }

  const dsn = (window as Window & { __SENTRY_DSN__?: string }).__SENTRY_DSN__ || '';
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: window.location.hostname,
    tracesSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration()],
  });
}
