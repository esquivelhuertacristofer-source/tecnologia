// Structured security event logger.
// Events are written to console (picked up by Vercel logs + Sentry).
// Do NOT log passwords, tokens, or full email addresses as PII here.

export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'login_rate_limited'
  | 'logout_success'
  | 'unauthorized_access'
  | 'forbidden_access'
  | 'admin_action'
  | 'session_expired'
  | 'suspicious_input';

interface SecurityEvent {
  event: SecurityEventType;
  userId?: string;
  email?: string;
  ip?: string;
  path?: string;
  action?: string;
  detail?: string;
}

export function logSecurityEvent(payload: SecurityEvent): void {
  const entry = {
    severity: 'SECURITY',
    timestamp: new Date().toISOString(),
    ...payload,
  };
  console.warn('[SECURITY]', JSON.stringify(entry));
}
