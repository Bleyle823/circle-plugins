/** Paywall URL helpers — aligned with @circle-plugins/plugin-eliza params. */

export function defaultPaywallUrl(): string {
  return (
    process.env.X402_PAYWALL_URL ??
    `http://localhost:${process.env.X402_PAYWALL_PORT ?? "4021"}/risk-profile`
  );
}

/** Ensure paywall requests always hit the /risk-profile route when appropriate. */
export function normalizePaywallUrl(url: string): string {
  const trimmed = url.replace(/[),.]+$/, "");
  if (trimmed.includes("api.example.com")) {
    return defaultPaywallUrl();
  }
  if (/localhost(?::\d+)?\/?$/i.test(trimmed) || /127\.0\.0\.1(?::\d+)?\/?$/i.test(trimmed)) {
    return trimmed.replace(/\/?$/, "/risk-profile");
  }
  if (trimmed.endsWith("/risk-profile")) {
    return trimmed;
  }
  if (/localhost:\d+\/[^/]+$/i.test(trimmed) && !trimmed.endsWith("/risk-profile")) {
    return defaultPaywallUrl();
  }
  return trimmed;
}

export function resolvePaywallUrl(url?: string): string {
  return normalizePaywallUrl(url?.trim() || defaultPaywallUrl());
}
